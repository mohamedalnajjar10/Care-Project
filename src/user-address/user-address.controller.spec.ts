import { Test, TestingModule } from '@nestjs/testing';
import { UserAddressController } from './user-address.controller';
import { UserAddressService } from './user-address.service';
import { BadRequestException } from '@nestjs/common';

describe('UserAddressController', () => {
  let controller: UserAddressController;
  let service: UserAddressService;

  const mockUserId = 'user-123';
  const mockReq = { user: { sub: mockUserId, id: mockUserId } } as any;

  const mockAddress = {
    id: 'address-123',
    userId: mockUserId,
    label: 'Home',
  };

  const mockUserAddressService = {
    create: jest.fn(),
    createFromMap: jest.fn(),
    findAllByUser: jest.fn(),
    findDefaultByUser: jest.fn(),
    findOneById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    setDefault: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserAddressController],
      providers: [
        { provide: UserAddressService, useValue: mockUserAddressService },
      ],
    }).compile();

    controller = module.get<UserAddressController>(UserAddressController);
    service = module.get<UserAddressService>(UserAddressService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with correct data', async () => {
      const dto = { label: 'Work', latitude: 30, longitude: 30 };
      mockUserAddressService.create.mockResolvedValue(mockAddress);

      const result = await controller.create(mockReq, dto as any);
      expect(result).toEqual(mockAddress);
      expect(service.create).toHaveBeenCalledWith(mockUserId, dto);
    });
  });

  describe('createFromMap', () => {
    const dto = { latitude: 30, longitude: 30, label: 'Map' };

    it('should call service.createFromMap with correct data', async () => {
      mockUserAddressService.createFromMap.mockResolvedValue(mockAddress);

      const result = await controller.createFromMap(mockReq, dto as any);
      expect(result).toEqual(mockAddress);
      expect(service.createFromMap).toHaveBeenCalledWith(mockUserId, dto);
    });

    it('should throw BadRequestException if user id is missing from token', async () => {
      const badReq = { user: {} } as any; // No id or sub
      await expect(controller.createFromMap(badReq, dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all addresses for current user', async () => {
      mockUserAddressService.findAllByUser.mockResolvedValue([mockAddress]);
      const result = await controller.findAll(mockReq);
      expect(result).toEqual([mockAddress]);
      expect(service.findAllByUser).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('findDefault', () => {
    it('should return default address', async () => {
      mockUserAddressService.findDefaultByUser.mockResolvedValue(mockAddress);
      const result = await controller.findDefault(mockReq);
      expect(result).toEqual(mockAddress);
      expect(service.findDefaultByUser).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('findOne', () => {
    it('should return specific address', async () => {
      mockUserAddressService.findOneById.mockResolvedValue(mockAddress);
      const result = await controller.findOne(mockReq, 'address-123');
      expect(result).toEqual(mockAddress);
      expect(service.findOneById).toHaveBeenCalledWith(mockUserId, 'address-123');
    });
  });

  describe('update', () => {
    it('should update specific address', async () => {
      const dto = { label: 'Updated' };
      mockUserAddressService.update.mockResolvedValue({ ...mockAddress, ...dto });

      const result = await controller.update(mockReq, 'address-123', dto);
      expect(result.label).toEqual('Updated');
      expect(service.update).toHaveBeenCalledWith(mockUserId, 'address-123', dto);
    });
  });

  describe('setDefault', () => {
    it('should set specific address as default', async () => {
      mockUserAddressService.setDefault.mockResolvedValue({ ...mockAddress, isDefault: true });
      const result = await controller.setDefault(mockReq, 'address-123');
      expect(result.isDefault).toBe(true);
      expect(service.setDefault).toHaveBeenCalledWith(mockUserId, 'address-123');
    });
  });

  describe('remove', () => {
    it('should delete address and return success message', async () => {
      mockUserAddressService.remove.mockResolvedValue(undefined);
      const result = await controller.remove(mockReq, 'address-123');
      expect(result).toEqual({ message: 'Address deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockUserId, 'address-123');
    });
  });
});