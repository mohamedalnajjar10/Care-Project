"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const sms_service_1 = require("../sms/sms.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const user_service_1 = require("../user/user.service");
const auth_constants_1 = require("./constants/auth.constants");
class TooManyRequestsException extends common_1.HttpException {
    constructor(message) {
        super(message || auth_constants_1.AUTH_ERROR_MESSAGES.TOO_MANY_ATTEMPTS, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
let AuthService = class AuthService {
    prisma;
    usersService;
    smsService;
    configService;
    jwtService;
    constructor(prisma, usersService, smsService, configService, jwtService) {
        this.prisma = prisma;
        this.usersService = usersService;
        this.smsService = smsService;
        this.configService = configService;
        this.jwtService = jwtService;
    }
    normalizeMobile(mobile) {
        let normalized = mobile.replace(/\s/g, '').replace(/\-/g, '');
        if (normalized.startsWith('0')) {
            normalized = '+20' + normalized.slice(1);
        }
        if (!normalized.startsWith('+')) {
            normalized = '+' + normalized;
        }
        return normalized;
    }
    generateOtpCode(length = 4) {
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        return String(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    async hashValue(value) {
        return bcrypt.hash(value, auth_constants_1.AUTH_CONSTANTS.BCRYPT_ROUNDS);
    }
    async compareValue(value, hash) {
        return bcrypt.compare(value, hash);
    }
    getOtpExpiresAt() {
        const seconds = Number(this.configService.get('OTP_EXPIRES_SECONDS', auth_constants_1.AUTH_CONSTANTS.OTP_EXPIRY_SECONDS));
        return new Date(Date.now() + seconds * 1000);
    }
    getOtpResendAllowedAt() {
        const seconds = Number(this.configService.get('OTP_RESEND_SECONDS', auth_constants_1.AUTH_CONSTANTS.OTP_RESEND_LOCK_SECONDS));
        return new Date(Date.now() + seconds * 1000);
    }
    async checkAttempts(mobile, purpose) {
        const attempt = await this.prisma.otpAttempt.findUnique({
            where: {
                mobile_purpose: {
                    mobile,
                    purpose,
                },
            },
        });
        if (attempt?.blockedUntil && attempt.blockedUntil > new Date()) {
            throw new TooManyRequestsException(`Too many invalid OTP attempts. Try again after ${attempt.blockedUntil.toISOString()}`);
        }
    }
    async incrementAttempts(mobile, purpose) {
        const maxAttempts = Number(this.configService.get('OTP_MAX_ATTEMPTS', auth_constants_1.AUTH_CONSTANTS.MAX_OTP_ATTEMPTS));
        const blockSeconds = Number(this.configService.get('OTP_BLOCK_SECONDS', auth_constants_1.AUTH_CONSTANTS.OTP_BLOCK_SECONDS));
        const current = await this.prisma.otpAttempt.findUnique({
            where: {
                mobile_purpose: {
                    mobile,
                    purpose,
                },
            },
        });
        const attempts = (current?.attempts ?? 0) + 1;
        const blockedUntil = attempts >= maxAttempts
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
            throw new TooManyRequestsException(`Too many invalid OTP attempts. Try again after ${blockedUntil.toISOString()}`);
        }
    }
    async resetAttempts(mobile, purpose) {
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
    async invalidateOldOtps(mobile, purpose) {
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
    async createAndSendOtp(mobile, purpose, userId) {
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
            throw new TooManyRequestsException(`Resend allowed after ${latestOtp.resendAllowedAt.toISOString()}`);
        }
        await this.invalidateOldOtps(mobile, purpose);
        const code = this.generateOtpCode(auth_constants_1.AUTH_CONSTANTS.OTP_LENGTH);
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
            expiresInSeconds: Number(this.configService.get('OTP_EXPIRES_SECONDS', auth_constants_1.AUTH_CONSTANTS.OTP_EXPIRY_SECONDS)),
        };
    }
    async signUp(dto) {
        const mobile = this.normalizeMobile(dto.mobile);
        const email = dto.email?.trim().toLowerCase() || null;
        const fullName = dto.fullName.trim();
        const existingUserByMobile = await this.usersService.findByMobile(mobile);
        if (existingUserByMobile) {
            throw new common_1.BadRequestException(auth_constants_1.AUTH_ERROR_MESSAGES.MOBILE_ALREADY_REGISTERED);
        }
        if (email) {
            const existingByEmail = await this.prisma.user.findUnique({
                where: { email },
            });
            if (existingByEmail) {
                throw new common_1.BadRequestException(auth_constants_1.AUTH_ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED);
            }
        }
        const existingPendingByMobile = await this.prisma.pendingRegistration.findUnique({
            where: { mobile },
        });
        if (existingPendingByMobile && email && existingPendingByMobile.email !== email) {
            throw new common_1.BadRequestException('Pending registration already exists for this mobile');
        }
        if (email) {
            const existingPendingByEmail = await this.prisma.pendingRegistration.findUnique({
                where: { email },
            });
            if (existingPendingByEmail && existingPendingByEmail.mobile !== mobile) {
                throw new common_1.BadRequestException('Email already used in pending registration');
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
        return this.createAndSendOtp(mobile, client_1.OtpPurpose.SIGN_UP);
    }
    async signIn(dto) {
        const mobile = this.normalizeMobile(dto.mobile);
        const user = await this.usersService.findByMobile(mobile);
        if (!user) {
            throw new common_1.NotFoundException(auth_constants_1.AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException(auth_constants_1.AUTH_ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
        }
        return this.createAndSendOtp(mobile, client_1.OtpPurpose.SIGN_IN, user.id);
    }
    async resendOtp(dto) {
        const mobile = this.normalizeMobile(dto.mobile);
        if (dto.purpose === client_1.OtpPurpose.SIGN_UP) {
            const pending = await this.prisma.pendingRegistration.findUnique({
                where: { mobile },
            });
            if (!pending) {
                throw new common_1.BadRequestException('No pending sign-up found');
            }
            return this.createAndSendOtp(mobile, client_1.OtpPurpose.SIGN_UP);
        }
        const user = await this.usersService.findByMobile(mobile);
        if (!user) {
            throw new common_1.BadRequestException(auth_constants_1.AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
        }
        if (!user.isVerified) {
            throw new common_1.ForbiddenException('Account is not verified');
        }
        return this.createAndSendOtp(mobile, client_1.OtpPurpose.SIGN_IN, user.id);
    }
    async verifyOtp(dto) {
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
            throw new common_1.BadRequestException(auth_constants_1.AUTH_ERROR_MESSAGES.NO_OTP_FOUND);
        }
        if (otp.expiresAt < new Date()) {
            throw new common_1.BadRequestException(auth_constants_1.AUTH_ERROR_MESSAGES.OTP_EXPIRED);
        }
        const isValid = await this.compareValue(dto.code, otp.hashedCode);
        if (!isValid) {
            await this.incrementAttempts(mobile, dto.purpose);
            throw new common_1.BadRequestException(auth_constants_1.AUTH_ERROR_MESSAGES.OTP_INVALID);
        }
        if (dto.purpose === client_1.OtpPurpose.SIGN_UP) {
            return this.verifySignUpOtpTransactional(mobile, otp.id);
        }
        return this.verifySignInOtpTransactional(mobile, otp.id);
    }
    async verifySignUpOtpTransactional(mobile, otpId) {
        return this.prisma.$transaction(async (tx) => {
            const pending = await tx.pendingRegistration.findUnique({
                where: { mobile },
            });
            if (!pending) {
                throw new common_1.BadRequestException('Pending registration not found');
            }
            const existingUser = await tx.user.findUnique({
                where: { mobile },
            });
            if (existingUser) {
                throw new common_1.BadRequestException(auth_constants_1.AUTH_ERROR_MESSAGES.MOBILE_ALREADY_REGISTERED);
            }
            if (pending.email) {
                const existingEmail = await tx.user.findUnique({
                    where: { email: pending.email },
                });
                if (existingEmail) {
                    throw new common_1.BadRequestException(auth_constants_1.AUTH_ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED);
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
                        purpose: client_1.OtpPurpose.SIGN_UP,
                    },
                },
                create: {
                    mobile,
                    purpose: client_1.OtpPurpose.SIGN_UP,
                    attempts: 0,
                    blockedUntil: null,
                },
                update: {
                    attempts: 0,
                    blockedUntil: null,
                },
            });
            const tokens = await this.generateTokens(user);
            const decoded = this.jwtService.decode(tokens.refreshToken);
            if (!decoded?.exp) {
                throw new common_1.UnauthorizedException('Invalid refresh token payload');
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
    async verifySignInOtpTransactional(mobile, otpId) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { mobile },
            });
            if (!user) {
                throw new common_1.BadRequestException(auth_constants_1.AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
            }
            if (!user.isActive) {
                throw new common_1.ForbiddenException(auth_constants_1.AUTH_ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
            }
            await tx.otpCode.update({
                where: { id: otpId },
                data: { consumedAt: new Date() },
            });
            await tx.otpAttempt.upsert({
                where: {
                    mobile_purpose: {
                        mobile,
                        purpose: client_1.OtpPurpose.SIGN_IN,
                    },
                },
                create: {
                    mobile,
                    purpose: client_1.OtpPurpose.SIGN_IN,
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
            const decoded = this.jwtService.decode(tokens.refreshToken);
            if (!decoded?.exp) {
                throw new common_1.UnauthorizedException('Invalid refresh token payload');
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
    async refreshToken(refreshToken) {
        const stored = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const user = stored.user;
        if (!user.isActive) {
            throw new common_1.UnauthorizedException(auth_constants_1.AUTH_ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
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
    async logout(refreshToken) {
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
    async authenticateWithGoogle(profile) {
        const existingUser = await this.findUserByGoogleIdOrEmail(profile.googleId, profile.email ?? undefined);
        if (!existingUser) {
            const newUser = await this.createGoogleUser(profile);
            return this.buildAuthResponse(newUser);
        }
        this.ensureUserIsActive(existingUser);
        const updatedUser = await this.updateGoogleLoginData(existingUser, profile);
        return this.buildAuthResponse(updatedUser);
    }
    async linkGoogleToExistingUser(user, googleId, avatar) {
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
    async findUserByGoogleIdOrEmail(googleId, email) {
        return this.prisma.user.findFirst({
            where: {
                OR: [{ googleId }, ...(email ? [{ email }] : [])],
            },
        });
    }
    ensureUserIsActive(user) {
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Account is inactive');
        }
    }
    async updateGoogleLoginData(user, profile) {
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
    async createGoogleUser(profile) {
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
    async buildAuthResponse(user) {
        const tokens = await this.generateTokens(user);
        await this.storeRefreshToken(user.id, tokens.refreshToken);
        return {
            user: this.sanitizeUser(user),
            tokens,
        };
    }
    async me(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException(auth_constants_1.AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
        }
        return this.sanitizeUser(user);
    }
    sanitizeUser(user) {
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
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            mobile: user.mobile,
            role: user.role,
        };
        const accessExpiresIn = this.configService.get('ACCESS_TOKEN_EXPIRES_IN', '15m');
        const refreshExpiresIn = this.configService.get('REFRESH_TOKEN_EXPIRES_IN', '30d');
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_ACCESS_SECRET'),
            expiresIn: accessExpiresIn,
        });
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: refreshExpiresIn,
        });
        return {
            accessToken,
            refreshToken,
        };
    }
    async storeRefreshToken(userId, token) {
        const decoded = this.jwtService.decode(token);
        if (!decoded?.exp) {
            throw new common_1.UnauthorizedException('Invalid refresh token payload');
        }
        await this.prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt: new Date(decoded.exp * 1000),
            },
        });
    }
    async cleanupExpiredTokens() {
        await this.prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        user_service_1.UsersService,
        sms_service_1.SmsService,
        config_1.ConfigService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map