import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
    NotFoundException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { OtpPurpose, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { GoogleProfile } from '../common/interfaces/google-profile.interface';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { SmsService } from '../sms/sms.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse, AuthTokens } from './auth.types';
import { PrismaService } from 'prisma/prisma.service';
import { UsersService } from 'src/user/user.service';
import { AUTH_CONSTANTS, AUTH_ERROR_MESSAGES } from './constants/auth.constants';

class TooManyRequestsException extends HttpException {
    constructor(message?: string) {
        super(message || AUTH_ERROR_MESSAGES.TOO_MANY_ATTEMPTS, HttpStatus.TOO_MANY_REQUESTS);
    }
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly usersService: UsersService,
        private readonly smsService: SmsService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) { }

    private normalizeMobile(mobile: string): string {
        let normalized = mobile.replace(/\s/g, '').replace(/\-/g, '');

        if (normalized.startsWith('0')) {
            normalized = '+20' + normalized.slice(1);
        }

        if (!normalized.startsWith('+')) {
            normalized = '+' + normalized;
        }

        return normalized;
    }

    private generateOtpCode(length = 4): string {
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        return String(Math.floor(Math.random() * (max - min + 1)) + min);
    }

    private async hashValue(value: string): Promise<string> {
        return bcrypt.hash(value, AUTH_CONSTANTS.BCRYPT_ROUNDS);
    }

    private async compareValue(value: string, hash: string): Promise<boolean> {
        return bcrypt.compare(value, hash);
    }

    private getOtpExpiresAt(): Date {
        const seconds = Number(this.configService.get('OTP_EXPIRES_SECONDS', AUTH_CONSTANTS.OTP_EXPIRY_SECONDS));
        return new Date(Date.now() + seconds * 1000);
    }

    private getOtpResendAllowedAt(): Date {
        const seconds = Number(this.configService.get('OTP_RESEND_SECONDS', AUTH_CONSTANTS.OTP_RESEND_LOCK_SECONDS));
        return new Date(Date.now() + seconds * 1000);
    }

    private async checkAttempts(mobile: string, purpose: OtpPurpose) {
        const attempt = await this.prisma.otpAttempt.findUnique({
            where: {
                mobile_purpose: {
                    mobile,
                    purpose,
                },
            },
        });

        if (attempt?.blockedUntil && attempt.blockedUntil > new Date()) {
            throw new TooManyRequestsException(
                `Too many invalid OTP attempts. Try again after ${attempt.blockedUntil.toISOString()}`,
            );
        }
    }

    private async incrementAttempts(mobile: string, purpose: OtpPurpose) {
        const maxAttempts = Number(this.configService.get('OTP_MAX_ATTEMPTS', AUTH_CONSTANTS.MAX_OTP_ATTEMPTS));
        const blockSeconds = Number(this.configService.get('OTP_BLOCK_SECONDS', AUTH_CONSTANTS.OTP_BLOCK_SECONDS));

        const current = await this.prisma.otpAttempt.findUnique({
            where: {
                mobile_purpose: {
                    mobile,
                    purpose,
                },
            },
        });

        const attempts = (current?.attempts ?? 0) + 1;
        const blockedUntil =
            attempts >= maxAttempts
                ? new Date(Date.now() + blockSeconds * 1000)
                : null;

        await this.prisma.otpAttempt.upsert({
            where: {
                mobile_purpose: {
                    mobile,
                    purpose,
                },
            },
            create: {
                mobile,
                purpose,
                attempts,
                blockedUntil,
            },
            update: {
                attempts,
                blockedUntil,
            },
        });

        if (blockedUntil) {
            throw new TooManyRequestsException(
                `Too many invalid OTP attempts. Try again after ${blockedUntil.toISOString()}`,
            );
        }
    }

    private async resetAttempts(mobile: string, purpose: OtpPurpose) {
        await this.prisma.otpAttempt.upsert({
            where: {
                mobile_purpose: {
                    mobile,
                    purpose,
                },
            },
            create: {
                mobile,
                purpose,
                attempts: 0,
                blockedUntil: null,
            },
            update: {
                attempts: 0,
                blockedUntil: null,
            },
        });
    }

    private async invalidateOldOtps(mobile: string, purpose: OtpPurpose) {
        await this.prisma.otpCode.updateMany({
            where: {
                mobile,
                purpose,
                consumedAt: null,
            },
            data: {
                consumedAt: new Date(),
            },
        });
    }

    private async createAndSendOtp(
        mobile: string,
        purpose: OtpPurpose,
        userId?: string,
    ) {
        await this.checkAttempts(mobile, purpose);

        const latestOtp = await this.prisma.otpCode.findFirst({
            where: {
                mobile,
                purpose,
                consumedAt: null,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (latestOtp?.resendAllowedAt && latestOtp.resendAllowedAt > new Date()) {
            throw new TooManyRequestsException(
                `Resend allowed after ${latestOtp.resendAllowedAt.toISOString()}`,
            );
        }

        await this.invalidateOldOtps(mobile, purpose);

        const code = this.generateOtpCode(AUTH_CONSTANTS.OTP_LENGTH);
        console.log('OTP CODE FOR TEST:', { mobile, purpose, code });

        const hashedCode = await this.hashValue(code);

        await this.prisma.otpCode.create({
            data: {
                mobile,
                purpose,
                hashedCode,
                userId,
                expiresAt: this.getOtpExpiresAt(),
                resendAllowedAt: this.getOtpResendAllowedAt(),
            },
        });

        await this.smsService.sendOtp(mobile, code);

        return {
            message: 'OTP sent successfully',
            mobile,
            purpose,
            expiresInSeconds: Number(this.configService.get('OTP_EXPIRES_SECONDS', AUTH_CONSTANTS.OTP_EXPIRY_SECONDS)),
        };
    }

    async signUp(dto: RegisterDto) {
        const mobile = this.normalizeMobile(dto.mobile);
        const email = dto.email?.trim().toLowerCase() || null;
        const fullName = dto.fullName.trim();

        const existingUserByMobile = await this.usersService.findByMobile(mobile);
        if (existingUserByMobile) {
            throw new BadRequestException(AUTH_ERROR_MESSAGES.MOBILE_ALREADY_REGISTERED);
        }

        if (email) {
            const existingByEmail = await this.prisma.user.findUnique({
                where: { email },
            });

            if (existingByEmail) {
                throw new BadRequestException(AUTH_ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED);
            }
        }

        const existingPendingByMobile = await this.prisma.pendingRegistration.findUnique({
            where: { mobile },
        });

        if (existingPendingByMobile && email && existingPendingByMobile.email !== email) {
            throw new BadRequestException('Pending registration already exists for this mobile');
        }

        if (email) {
            const existingPendingByEmail = await this.prisma.pendingRegistration.findUnique({
                where: { email },
            });

            if (existingPendingByEmail && existingPendingByEmail.mobile !== mobile) {
                throw new BadRequestException('Email already used in pending registration');
            }
        }

        await this.prisma.pendingRegistration.upsert({
            where: { mobile },
            create: {
                fullName,
                mobile,
                email,
            },
            update: {
                fullName,
                email,
            },
        });

        return this.createAndSendOtp(mobile, OtpPurpose.SIGN_UP);
    }

    async signIn(dto: LoginDto) {
        const mobile = this.normalizeMobile(dto.mobile);

        const user = await this.usersService.findByMobile(mobile);

        if (!user) {
            throw new NotFoundException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
        }

        if (!user.isActive) {
            throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
        }

        return this.createAndSendOtp(mobile, OtpPurpose.SIGN_IN, user.id);
    }

    async resendOtp(dto: ResendOtpDto) {
        const mobile = this.normalizeMobile(dto.mobile);

        if (dto.purpose === OtpPurpose.SIGN_UP) {
            const pending = await this.prisma.pendingRegistration.findUnique({
                where: { mobile },
            });

            if (!pending) {
                throw new BadRequestException('No pending sign-up found');
            }

            return this.createAndSendOtp(mobile, OtpPurpose.SIGN_UP);
        }

        const user = await this.usersService.findByMobile(mobile);
        if (!user) {
            throw new BadRequestException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
        }

        if (!user.isVerified) {
            throw new ForbiddenException('Account is not verified');
        }

        return this.createAndSendOtp(mobile, OtpPurpose.SIGN_IN, user.id);
    }

    async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponse> {
        const mobile = this.normalizeMobile(dto.mobile);

        await this.checkAttempts(mobile, dto.purpose);

        const otp = await this.prisma.otpCode.findFirst({
            where: {
                mobile,
                purpose: dto.purpose,
                consumedAt: null,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!otp) {
            throw new BadRequestException(AUTH_ERROR_MESSAGES.NO_OTP_FOUND);
        }

        if (otp.expiresAt < new Date()) {
            throw new BadRequestException(AUTH_ERROR_MESSAGES.OTP_EXPIRED);
        }

        const isValid = await this.compareValue(dto.code, otp.hashedCode);
        if (!isValid) {
            await this.incrementAttempts(mobile, dto.purpose);
            throw new BadRequestException(AUTH_ERROR_MESSAGES.OTP_INVALID);
        }

        if (dto.purpose === OtpPurpose.SIGN_UP) {
            return this.verifySignUpOtpTransactional(mobile, otp.id);
        }

        return this.verifySignInOtpTransactional(mobile, otp.id);
    }

    private async verifySignUpOtpTransactional(
        mobile: string,
        otpId: string,
    ): Promise<AuthResponse> {
        return this.prisma.$transaction(async (tx) => {
            const pending = await tx.pendingRegistration.findUnique({
                where: { mobile },
            });

            if (!pending) {
                throw new BadRequestException('Pending registration not found');
            }

            const existingUser = await tx.user.findUnique({
                where: { mobile },
            });

            if (existingUser) {
                throw new BadRequestException(AUTH_ERROR_MESSAGES.MOBILE_ALREADY_REGISTERED);
            }

            if (pending.email) {
                const existingEmail = await tx.user.findUnique({
                    where: { email: pending.email },
                });

                if (existingEmail) {
                    throw new BadRequestException(AUTH_ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED);
                }
            }

            const user = await tx.user.create({
                data: {
                    fullName: pending.fullName,
                    mobile: pending.mobile,
                    email: pending.email,
                    isVerified: true,
                    lastLoginAt: new Date(),
                },
            });

            await tx.otpCode.update({
                where: { id: otpId },
                data: { consumedAt: new Date() },
            });

            await tx.otpAttempt.upsert({
                where: {
                    mobile_purpose: {
                        mobile,
                        purpose: OtpPurpose.SIGN_UP,
                    },
                },
                create: {
                    mobile,
                    purpose: OtpPurpose.SIGN_UP,
                    attempts: 0,
                    blockedUntil: null,
                },
                update: {
                    attempts: 0,
                    blockedUntil: null,
                },
            });

            const tokens = await this.generateTokens(user);

            const decoded = this.jwtService.decode(tokens.refreshToken) as { exp?: number } | null;
            if (!decoded?.exp) {
                throw new UnauthorizedException('Invalid refresh token payload');
            }

            await tx.refreshToken.create({
                data: {
                    token: tokens.refreshToken,
                    userId: user.id,
                    expiresAt: new Date(decoded.exp * 1000),
                },
            });

            await tx.pendingRegistration.delete({
                where: { mobile },
            });

            return {
                user: this.sanitizeUser(user),
                tokens,
            };
        });
    }

    private async verifySignInOtpTransactional(
        mobile: string,
        otpId: string,
    ): Promise<AuthResponse> {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { mobile },
            });

            if (!user) {
                throw new BadRequestException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
            }

            if (!user.isActive) {
                throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
            }

            await tx.otpCode.update({
                where: { id: otpId },
                data: { consumedAt: new Date() },
            });

            await tx.otpAttempt.upsert({
                where: {
                    mobile_purpose: {
                        mobile,
                        purpose: OtpPurpose.SIGN_IN,
                    },
                },
                create: {
                    mobile,
                    purpose: OtpPurpose.SIGN_IN,
                    attempts: 0,
                    blockedUntil: null,
                },
                update: {
                    attempts: 0,
                    blockedUntil: null,
                },
            });

            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                    isVerified: true,
                },
            });

            const tokens = await this.generateTokens(updatedUser);

            const decoded = this.jwtService.decode(tokens.refreshToken) as { exp?: number } | null;
            if (!decoded?.exp) {
                throw new UnauthorizedException('Invalid refresh token payload');
            }

            await tx.refreshToken.create({
                data: {
                    token: tokens.refreshToken,
                    userId: updatedUser.id,
                    expiresAt: new Date(decoded.exp * 1000),
                },
            });

            return {
                user: this.sanitizeUser(updatedUser),
                tokens,
            };
        });
    }

    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        const stored = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const user = stored.user;

        if (!user.isActive) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
        }

        const tokens = await this.generateTokens(user);

        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: {
                revokedAt: new Date(),
            },
        });

        await this.storeRefreshToken(user.id, tokens.refreshToken);

        return {
            user: this.sanitizeUser(user),
            tokens,
        };
    }

    async logout(refreshToken: string) {
        const stored = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });

        if (stored && !stored.revokedAt) {
            await this.prisma.refreshToken.update({
                where: { id: stored.id },
                data: {
                    revokedAt: new Date(),
                },
            });
        }

        return { message: 'Logged out successfully' };
    }

    async authenticateWithGoogle(profile: GoogleProfile): Promise<AuthResponse> {
        const existingUser = await this.findUserByGoogleIdOrEmail(
            profile.googleId,
            profile.email ?? undefined,
        );

        if (!existingUser) {
            const newUser = await this.createGoogleUser(profile);
            return this.buildAuthResponse(newUser);
        }

        this.ensureUserIsActive(existingUser);

        const updatedUser = await this.updateGoogleLoginData(existingUser, profile);
        return this.buildAuthResponse(updatedUser);
    }

    async linkGoogleToExistingUser(
        user: User,
        googleId: string,
        avatar?: string,
    ): Promise<AuthResponse> {
        this.ensureUserIsActive(user);

        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                googleId,
                ...(avatar ? { avatar } : {}),
                isVerified: true,
                lastLoginAt: new Date(),
            },
        });

        return this.buildAuthResponse(updatedUser);
    }

    private async findUserByGoogleIdOrEmail(
        googleId: string,
        email?: string,
    ): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: {
                OR: [{ googleId }, ...(email ? [{ email }] : [])],
            },
        });
    }

    private ensureUserIsActive(user: User): void {
        if (!user.isActive) {
            throw new ForbiddenException('Account is inactive');
        }
    }

    private async updateGoogleLoginData(
        user: User,
        profile: GoogleProfile,
    ): Promise<User> {
        return this.prisma.user.update({
            where: { id: user.id },
            data: {
                googleId: profile.googleId,
                avatar: profile.avatar ?? user.avatar,
                isVerified: true,
                lastLoginAt: new Date(),
            },
        });
    }

    private async createGoogleUser(profile: GoogleProfile): Promise<User> {
        return this.prisma.user.create({
            data: {
                fullName: profile.fullName,
                email: profile.email,
                googleId: profile.googleId,
                avatar: profile.avatar,
                isVerified: true,
                isActive: true,
                lastLoginAt: new Date(),
            },
        });
    }

    private async buildAuthResponse(user: User): Promise<AuthResponse> {
        const tokens = await this.generateTokens(user);
        await this.storeRefreshToken(user.id, tokens.refreshToken);

        return {
            user: this.sanitizeUser(user),
            tokens,
        };
    }

    async me(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
        }

        return this.sanitizeUser(user);
    }

    private sanitizeUser(user: User) {
        return {
            id: user.id,
            fullName: user.fullName,
            mobile: user.mobile,
            email: user.email,
            isVerified: user.isVerified,
            isActive: user.isActive,
            role: user.role,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    private async generateTokens(user: User): Promise<AuthTokens> {
        const payload: JwtPayload = {
            sub: user.id,
            mobile: user.mobile,
            role: user.role,
        };

        const accessExpiresIn = this.configService.get<string>(
            'ACCESS_TOKEN_EXPIRES_IN',
            '15m',
        ) as JwtSignOptions['expiresIn'];

        const refreshExpiresIn = this.configService.get<string>(
            'REFRESH_TOKEN_EXPIRES_IN',
            '30d',
        ) as JwtSignOptions['expiresIn'];

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            expiresIn: accessExpiresIn,
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: refreshExpiresIn,
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    private async storeRefreshToken(userId: string, token: string) {
        const decoded = this.jwtService.decode(token) as { exp?: number } | null;

        if (!decoded?.exp) {
            throw new UnauthorizedException('Invalid refresh token payload');
        }

        await this.prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt: new Date(decoded.exp * 1000),
            },
        });
    }

    async cleanupExpiredTokens(): Promise<void> {
        await this.prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
    }
}
