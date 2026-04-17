import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UsersService } from './user.service';
import { UserRole } from '@prisma/client';

const mockUsersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByMobile: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UserController', () => {
  let controller: UserController;
  let service: UsersService;

  const mockRequest = {
    user: { id: 'req-user-id', role: UserRole.PATIENT },
  };

  const mockUser = {
    id: 'user-123',
    fullName: 'Test User',
    mobile: '+201000000000',
    role: UserRole.PATIENT,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with correct DTO', async () => {
      const dto = { fullName: 'Test', mobile: '+123456' };
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(dto as any);
      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should parse pagination strings and call service.findAll', async () => {
      const paginatedResult = { data: [mockUser], total: 1 };
      mockUsersService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll('2', '20');

      expect(result).toEqual(paginatedResult);
      expect(service.findAll).toHaveBeenCalledWith(2, 20); // String converted to Number
    });

    it('should use default pagination values if omitted', async () => {
      await controller.findAll(undefined, undefined);
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findByMobile', () => {
    it('should pass req user data to service', async () => {
      mockUsersService.findByMobile.mockResolvedValue(mockUser);

      const result = await controller.findByMobile('+201000', mockRequest);

      expect(result).toEqual(mockUser);
      expect(service.findByMobile).toHaveBeenCalledWith('+201000', 'req-user-id', UserRole.PATIENT);
    });
  });

  describe('findById', () => {
    it('should pass id and req user data to service', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findById('user-123', mockRequest);

      expect(result).toEqual(mockUser);
      expect(service.findById).toHaveBeenCalledWith('user-123', 'req-user-id', UserRole.PATIENT);
    });
  });

  describe('update', () => {
    it('should pass id, dto, and req user data to service', async () => {
      const dto = { fullName: 'Updated' };
      mockUsersService.update.mockResolvedValue({ ...mockUser, ...dto });

      const result = await controller.update('user-123', dto, mockRequest);

      expect(result.fullName).toEqual('Updated');
      expect(service.update).toHaveBeenCalledWith('user-123', dto, 'req-user-id', UserRole.PATIENT);
    });
  });

  describe('remove', () => {
    it('should pass id and req user data to service for deletion', async () => {
      const successMessage = { message: 'User deleted successfully' };
      mockUsersService.remove.mockResolvedValue(successMessage);

      const result = await controller.remove('user-123', mockRequest);

      expect(result).toEqual(successMessage);
      expect(service.remove).toHaveBeenCalledWith('user-123', 'req-user-id', UserRole.PATIENT);
    });
  });
});