import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './user.service';
import { PrismaService } from 'prisma/prisma.service';
import { UserRole } from '@prisma/client';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-123',
    fullName: 'Test User',
    mobile: '+201000000000',
    email: 'test@test.com',
    role: UserRole.PATIENT,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByMobile', () => {
    it('should return user without auth checks if currentUserId is not provided', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findByMobile(mockUser.mobile);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.findByMobile('wrong_mobile', 'user-1', UserRole.PATIENT))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not ADMIN and not the owner', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      await expect(service.findByMobile(mockUser.mobile, 'different-id', UserRole.PATIENT))
        .rejects.toThrow(ForbiddenException);
    });

    it('should return user if current user is the owner', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findByMobile(mockUser.mobile, mockUser.id, UserRole.PATIENT);
      expect(result).toEqual(mockUser);
    });

    it('should return user if current user is ADMIN', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findByMobile(mockUser.mobile, 'admin-id', UserRole.ADMIN);
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    const createDto = { fullName: 'Test', mobile: '+123456', email: 'a@a.com', role: UserRole.PATIENT };

    it('should successfully create a user', async () => {
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      const result = await service.create(createDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException on Prisma P2002 error (Duplicate)', async () => {
      mockPrismaService.user.create.mockRejectedValue({ code: 'P2002' });
      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on other errors', async () => {
      mockPrismaService.user.create.mockRejectedValue(new Error('Some error'));
      await expect(service.create(createDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 0, take: 10, orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser as any);
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, fullName: 'Updated' });

      const result = await service.update(mockUser.id, { fullName: 'Updated' }, mockUser.id, UserRole.PATIENT);
      expect(result.fullName).toEqual('Updated');
    });

    it('should throw BadRequestException on P2002 during update', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser as any);
      mockPrismaService.user.update.mockRejectedValue({ code: 'P2002' });

      await expect(service.update(mockUser.id, { email: 'exist@test.com' }, mockUser.id, UserRole.PATIENT))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete user and return success message', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser as any);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove(mockUser.id, mockUser.id, UserRole.PATIENT);
      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: mockUser.id } });
    });
  });
});