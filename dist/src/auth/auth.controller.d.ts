import { AuthService } from './auth.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
import type { Request } from 'express';
import { GoogleProfile } from '../common/interfaces/google-profile.interface';
import { AuthResponse } from './auth.types';
interface GoogleAuthRequest extends Request {
    user: GoogleProfile;
}
interface GoogleCallbackResponse extends AuthResponse {
    message: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    verifyOtp(dto: VerifyOtpDto): Promise<AuthResponse>;
    resendOtp(dto: ResendOtpDto): Promise<{
        message: string;
        mobile: string;
        purpose: import("@prisma/client").$Enums.OtpPurpose;
        expiresInSeconds: number;
    }>;
    refresh(dto: RefreshTokenDto): Promise<AuthResponse>;
    logout(dto: RefreshTokenDto): Promise<{
        message: string;
    }>;
    me(user: Pick<User, 'id' | 'role' | 'mobile'>): Promise<{
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
    googleLogin(): void;
    googleCallback(req: GoogleAuthRequest): Promise<GoogleCallbackResponse>;
}
export {};
