import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Req, Res } from '@nestjs/common';
import type { Response, Request } from 'express';
import { GoogleAuthGuard } from '../common/guards/google-auth.guard';
import { GoogleProfile } from '../common/interfaces/google-profile.interface';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { AuthResponse } from './auth.types';

interface GoogleAuthRequest extends Request {
  user: GoogleProfile;
}

interface GoogleCallbackResponse extends AuthResponse {
  message: string;
}

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) { }


  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sign Up a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  signUp(@Body() dto: RegisterDto) {
    return this.authService.signUp(dto);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign In a user' })
  @ApiResponse({ status: 200, description: 'User signed in successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  signIn(@Body() dto: LoginDto) {
    return this.authService.signIn(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Invalid OTP' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Invalid OTP' })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get Current User' })
  @ApiResponse({ status: 200, description: 'User fetched successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  me(@CurrentUser() user: Pick<User, 'id' | 'role' | 'mobile'>) {
    return this.authService.me(user.id);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login page' })
  googleLogin(): void { }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleCallback(
    @Req() req: GoogleAuthRequest,
  ): Promise<GoogleCallbackResponse> {
    const authResponse = await this.authService.authenticateWithGoogle(req.user);

    return {
      message: 'Google login successful',
      ...authResponse,
    };
  }

  // @Get('google/callback')
  // @UseGuards(GoogleAuthGuard)
  // @ApiExcludeEndpoint()
  // async googleCallback(
  //   @Req() req: Request,
  //   @Res() res: Response,
  // ): Promise<void> {
  //   const profile = req.user as GoogleProfile;
  //   const authResponse = await this.authService.googleAuth(profile);

  //   const clientUrl = process.env.FRONTEND_GOOGLE_REDIRECT_URL;

  //   if (clientUrl) {
  //     const params = new URLSearchParams({
  //       accessToken: authResponse.tokens.accessToken,
  //       refreshToken: authResponse.tokens.refreshToken,
  //     });
  //     res.redirect(`${clientUrl}?${params.toString()}`);
  //     return;
  //   }

  //   res.json({
  //     message: 'Google login successful',
  //     user: authResponse.user,
  //     tokens: authResponse.tokens,
  //   });
  // }
}
