import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from 'prisma/prisma.service';
import { UsersService } from 'src/user/user.service';
import { SmsService } from '../sms/sms.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OtpPurpose } from '@prisma/client';
import { AUTH_ERROR_MESSAGES } from './constants/auth.constants';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let prisma: PrismaService;
  let smsService: SmsService;

  const mockPrismaService = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    pendingRegistration: { findUnique: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
    otpAttempt: { findUnique: jest.fn(), upsert: jest.fn() },
    otpCode: { findFirst: jest.fn(), create: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
    refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockUsersService = {
    findByMobile: jest.fn(),
    findById: jest.fn(),
  };

  const mockSmsService = {
    sendOtp: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key, def) => def),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('test_token'),
    decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    smsService = module.get<SmsService>(SmsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signUp', () => {
    const dto: RegisterDto = { fullName: 'John Doe', mobile: '+201000000000', email: 'john@example.com' };

    it('should throw BadRequestException if mobile already registered', async () => {
      mockUsersService.findByMobile.mockResolvedValue({ id: '1' });
      
      await expect(authService.signUp(dto)).rejects.toThrow(
        new BadRequestException(AUTH_ERROR_MESSAGES.MOBILE_ALREADY_REGISTERED)
      );
    });

    it('should upsert pending registration and send OTP on success', async () => {
      mockUsersService.findByMobile.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.pendingRegistration.findUnique.mockResolvedValue(null);
      
      mockPrismaService.otpAttempt.findUnique.mockResolvedValue(null);
      mockPrismaService.otpCode.findFirst.mockResolvedValue(null);
      
      const result = await authService.signUp(dto);

      expect(mockPrismaService.pendingRegistration.upsert).toHaveBeenCalled();
      expect(mockPrismaService.otpCode.create).toHaveBeenCalled();
      expect(mockSmsService.sendOtp).toHaveBeenCalled();
      expect(result.message).toBe('OTP sent successfully');
      expect(result.purpose).toBe(OtpPurpose.SIGN_UP);
    });
  });

  describe('signIn', () => {
    const dto: LoginDto = { mobile: '+201000000000' };

    it('should throw NotFoundException if user not found', async () => {
      mockUsersService.findByMobile.mockResolvedValue(null);

      await expect(authService.signIn(dto)).rejects.toThrow(
        new NotFoundException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND)
      );
    });

    it('should throw ForbiddenException if user is inactive', async () => {
      mockUsersService.findByMobile.mockResolvedValue({ isActive: false });

      await expect(authService.signIn(dto)).rejects.toThrow(
        new ForbiddenException(AUTH_ERROR_MESSAGES.ACCOUNT_DEACTIVATED)
      );
    });

    it('should create and send OTP on successful sign in request', async () => {
      mockUsersService.findByMobile.mockResolvedValue({ id: 'user1', isActive: true, isVerified: true });
      mockPrismaService.otpAttempt.findUnique.mockResolvedValue(null);
      mockPrismaService.otpCode.findFirst.mockResolvedValue(null);

      const result = await authService.signIn(dto);

      expect(mockPrismaService.otpCode.create).toHaveBeenCalled();
      expect(mockSmsService.sendOtp).toHaveBeenCalled();
      expect(result.message).toBe('OTP sent successfully');
    });
  });

  describe('resendOtp', () => {
    it('should throw error if pending registration not found for sign_up', async () => {
      mockPrismaService.pendingRegistration.findUnique.mockResolvedValue(null);
      
      await expect(
        authService.resendOtp({ mobile: '+201000000000', purpose: OtpPurpose.SIGN_UP })
      ).rejects.toThrow(BadRequestException);
    });

    it('should trigger create and send OTP for valid request', async () => {
      mockUsersService.findByMobile.mockResolvedValue({ id: 'user1', isActive: true, isVerified: true });
      mockPrismaService.otpAttempt.findUnique.mockResolvedValue(null);
      mockPrismaService.otpCode.findFirst.mockResolvedValue(null);
      
      const result = await authService.resendOtp({ mobile: '+201000000000', purpose: OtpPurpose.SIGN_IN });
      
      expect(result.message).toBe('OTP sent successfully');
    });
  });
  
  describe('me', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(authService.me('invalid-id')).rejects.toThrow(
        new UnauthorizedException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND).constructor
      );
    });

    it('should return sanitized user details if found', async () => {
      const mockUser = {
        id: '1', fullName: 'Test', mobile: '+2010', email: 'test@test.com',
        isVerified: true, isActive: true, role: 'USER', 
        createdAt: new Date(), updatedAt: new Date(), lastLoginAt: new Date(),
        password: 'hashedpassword123'
      };
      
      mockUsersService.findById.mockResolvedValue(mockUser);
      
      const result = await authService.me('1');
      
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('fullName', mockUser.fullName);
      expect(result).not.toHaveProperty('password');
    });
  });
});
