import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { GoogleProfile } from '../common/interfaces/google-profile.interface';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { SmsService } from '../sms/sms.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './auth.types';
import { PrismaService } from 'prisma/prisma.service';
import { UsersService } from 'src/user/user.service';
export declare class AuthService {
    private readonly prisma;
    private readonly usersService;
    private readonly smsService;
    private readonly configService;
    private readonly jwtService;
    constructor(prisma: PrismaService, usersService: UsersService, smsService: SmsService, configService: ConfigService, jwtService: JwtService);
    private normalizeMobile;
    private generateOtpCode;
    private hashValue;
    private compareValue;
    private getOtpExpiresAt;
    private getOtpResendAllowedAt;
    private checkAttempts;
    private incrementAttempts;
    private resetAttempts;
    private invalidateOldOtps;
    private createAndSendOtp;
    signUp(dto: RegisterDto): Promise<{
        message: string;
        mobile: string;
        purpose: import("@prisma/client").$Enums.OtpPurpose;
        expiresInSeconds: number;
    }>;
    signIn(dto: LoginDto): Promise<{
        message: string;
        mobile: string;
        purpose: import("@prisma/client").$Enums.OtpPurpose;
        expiresInSeconds: number;
    }>;
    resendOtp(dto: ResendOtpDto): Promise<{
        message: string;
        mobile: string;
        purpose: import("@prisma/client").$Enums.OtpPurpose;
        expiresInSeconds: number;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<AuthResponse>;
    private verifySignUpOtpTransactional;
    private verifySignInOtpTransactional;
    refreshToken(refreshToken: string): Promise<AuthResponse>;
    logout(refreshToken: string): Promise<{
        message: string;
    }>;
    authenticateWithGoogle(profile: GoogleProfile): Promise<AuthResponse>;
    linkGoogleToExistingUser(user: User, googleId: string, avatar?: string): Promise<AuthResponse>;
    private findUserByGoogleIdOrEmail;
    private ensureUserIsActive;
    private updateGoogleLoginData;
    private createGoogleUser;
    private buildAuthResponse;
    me(userId: string): Promise<{
        id: string;
        fullName: string;
        mobile: string | null;
        email: string | null;
        isVerified: boolean;
        isActive: boolean;
        role: import("@prisma/client").$Enums.UserRole;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private sanitizeUser;
    private generateTokens;
    private storeRefreshToken;
    cleanupExpiredTokens(): Promise<void>;
}
