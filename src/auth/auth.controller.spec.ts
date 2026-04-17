import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OtpPurpose, UserRole } from '@prisma/client';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    verifyOtp: jest.fn(),
    resendOtp: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
  };

  const mockThrottlerGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue(mockThrottlerGuard)
      .compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('signUp', () => {
    it('should call authService.signUp with dto and return result', async () => {
      const dto: RegisterDto = { fullName: 'John Doe', mobile: '+201000000000' };
      const expectedResult = {
        message: 'OTP sent successfully',
        mobile: dto.mobile,
        purpose: OtpPurpose.SIGN_UP,
        expiresInMinutes: 5,
      };

      mockAuthService.signUp.mockResolvedValue(expectedResult);

      const result = await authController.signUp(dto);

      expect(authService.signUp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('signIn', () => {
    it('should call authService.signIn with dto and return result', async () => {
      const dto: LoginDto = { mobile: '+201000000000' };
      const expectedResult = {
        message: 'OTP sent successfully',
        mobile: dto.mobile,
        purpose: OtpPurpose.SIGN_IN,
        expiresInMinutes: 5,
      };

      mockAuthService.signIn.mockResolvedValue(expectedResult);

      const result = await authController.signIn(dto);

      expect(authService.signIn).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyOtp', () => {
    it('should call authService.verifyOtp with dto and return user and tokens', async () => {
      const dto: VerifyOtpDto = {
        mobile: '+201000000000',
        code: '1234',
        purpose: OtpPurpose.SIGN_IN,
      };
      const expectedResult = {
        user: {
          id: 'uuid',
          fullName: 'John Doe',
          mobile: dto.mobile,
          isActive: true,
          role: UserRole.PATIENT,
        },
        tokens: { accessToken: 'acc_token', refreshToken: 'ref_token' },
      };

      mockAuthService.verifyOtp.mockResolvedValue(expectedResult);

      const result = await authController.verifyOtp(dto);

      expect(authService.verifyOtp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('resendOtp', () => {
    it('should call authService.resendOtp and return expected result', async () => {
      const dto: ResendOtpDto = {
        mobile: '+201000000000',
        purpose: OtpPurpose.SIGN_IN,
      };
      const expectedResult = {
        message: 'OTP sent successfully',
        mobile: dto.mobile,
        purpose: OtpPurpose.SIGN_IN,
        expiresInMinutes: 5,
      };

      mockAuthService.resendOtp.mockResolvedValue(expectedResult);

      const result = await authController.resendOtp(dto);

      expect(authService.resendOtp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshToken and return new tokens', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'old_ref_token' };
      const expectedResult = {
        user: {
          id: 'uuid',
          fullName: 'John Doe',
          mobile: '+201000000000',
          isActive: true,
          role: UserRole.PATIENT,
        },
        tokens: { accessToken: 'new_acc_token', refreshToken: 'new_ref_token' },
      };

      mockAuthService.refreshToken.mockResolvedValue(expectedResult);

      const result = await authController.refresh(dto);

      expect(authService.refreshToken).toHaveBeenCalledWith(dto.refreshToken);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with refreshToken', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'ref_token' };
      const expectedResult = { message: 'Logged out successfully' };

      mockAuthService.logout.mockResolvedValue(expectedResult);

      const result = await authController.logout(dto);

      expect(authService.logout).toHaveBeenCalledWith(dto.refreshToken);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('me', () => {
    it('should call authService.me with the extracted user ID from the request user object', async () => {
      const reqUser = {
        id: 'user-id-123',
        role: UserRole.PATIENT,
        mobile: '+201000000000',
      } as any;

      const expectedResult = {
        id: 'user-id-123',
        fullName: 'John Doe',
        mobile: '+201000000000',
        isActive: true,
        role: UserRole.PATIENT,
      };

      mockAuthService.me.mockResolvedValue(expectedResult);

      const result = await authController.me(reqUser);

      expect(authService.me).toHaveBeenCalledWith(reqUser.id);
      expect(result).toEqual(expectedResult);
    });
  });
});