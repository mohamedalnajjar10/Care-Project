import { Test, TestingModule } from '@nestjs/testing';
import { UserAddressService } from './user-address.service';
import { PrismaService } from 'prisma/prisma.service';
import { MapsService } from '../maps/maps.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('UserAddressService', () => {
  let service: UserAddressService;
  let prisma: PrismaService;
  let mapsService: MapsService;

  const mockUserId = 'user-123';
  const mockAddressId = 'address-123';

  const mockAddress = {
    id: mockAddressId,
    userId: mockUserId,
    label: 'Home',
    isDefault: false,
    latitude: new Prisma.Decimal(30.0),
    longitude: new Prisma.Decimal(31.0),
    createdAt: new Date(),
  };

  // Mock Prisma with $transaction support
  const mockPrismaService = {
    $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrismaService)),
    userAddress: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockMapsService = {
    reverseGeocode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAddressService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MapsService, useValue: mockMapsService },
      ],
    }).compile();

    service = module.get<UserAddressService>(UserAddressService);
    prisma = module.get<PrismaService>(PrismaService);
    mapsService = module.get<MapsService>(MapsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = { label: 'Work', latitude: 30.1, longitude: 31.2, isDefault: true };

    it('should create an address and set it as default if requested', async () => {
      mockPrismaService.userAddress.create.mockResolvedValue({ ...mockAddress, ...createDto });
      mockPrismaService.userAddress.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.create(mockUserId, createDto);

      expect(prisma.userAddress.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, isDefault: true },
        data: { isDefault: false },
      });
      expect(prisma.userAddress.create).toHaveBeenCalled();
      expect(result.label).toEqual('Work');
    });

    it('should set as default automatically if it is the first address', async () => {
      mockPrismaService.userAddress.count.mockResolvedValue(0);
      mockPrismaService.userAddress.create.mockResolvedValue({ ...mockAddress, isDefault: true });

      await service.create(mockUserId, { label: 'Work', latitude: 30.1, longitude: 31.2 });
      
      expect(prisma.userAddress.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isDefault: true }) })
      );
    });
  });

  describe('createFromMap', () => {
    const mapDto = { latitude: 30.1, longitude: 31.2, label: 'Map Address' };
    const mockResolvedAddress = { formattedAddress: '123 Main St', street: 'Main St', city: 'Cairo' };

    it('should reverse geocode and create address', async () => {
      mockMapsService.reverseGeocode.mockResolvedValue(mockResolvedAddress);
      mockPrismaService.userAddress.count.mockResolvedValue(1); // Not first address
      mockPrismaService.userAddress.create.mockResolvedValue(mockAddress);

      await service.createFromMap(mockUserId, mapDto);

      expect(mapsService.reverseGeocode).toHaveBeenCalledWith(30.1, 31.2);
      expect(prisma.userAddress.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ formattedAddress: '123 Main St', city: 'Cairo' })
        })
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return all addresses ordered correctly', async () => {
      mockPrismaService.userAddress.findMany.mockResolvedValue([mockAddress]);
      const result = await service.findAllByUser(mockUserId);
      expect(result).toEqual([mockAddress]);
      expect(prisma.userAddress.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('findOneById', () => {
    it('should return address if found', async () => {
      mockPrismaService.userAddress.findFirst.mockResolvedValue(mockAddress);
      const result = await service.findOneById(mockUserId, mockAddressId);
      expect(result).toEqual(mockAddress);
    });

    it('should throw NotFoundException if address not found', async () => {
      mockPrismaService.userAddress.findFirst.mockResolvedValue(null);
      await expect(service.findOneById(mockUserId, 'wrong-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if user does not own address', async () => {
      mockPrismaService.userAddress.findFirst.mockResolvedValue(null);
      await expect(service.update(mockUserId, mockAddressId, { label: 'New' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('should update address successfully', async () => {
      mockPrismaService.userAddress.findFirst.mockResolvedValue({ id: mockAddressId }); // Ownership pass
      mockPrismaService.userAddress.update.mockResolvedValue({ ...mockAddress, label: 'New' });

      const result = await service.update(mockUserId, mockAddressId, { label: 'New' });
      expect(result.label).toEqual('New');
    });
  });

  describe('remove', () => {
    it('should delete address and reassign default if deleted address was default', async () => {
      // 1. Mock findOneById (address exists)
      mockPrismaService.userAddress.findFirst
        .mockResolvedValueOnce({ ...mockAddress, isDefault: true }) // Initial fetch
        .mockResolvedValueOnce({ id: 'latest-address' }); // Fetch latest address to set as default

      await service.remove(mockUserId, mockAddressId);

      expect(prisma.userAddress.delete).toHaveBeenCalledWith({ where: { id: mockAddressId } });
      expect(prisma.userAddress.update).toHaveBeenCalledWith({
        where: { id: 'latest-address' },
        data: { isDefault: true },
      });
    });
  });

  describe('setDefault', () => {
    it('should clear old default and set new default', async () => {
      mockPrismaService.userAddress.findFirst.mockResolvedValue({ id: mockAddressId }); // Ownership
      mockPrismaService.userAddress.update.mockResolvedValue({ ...mockAddress, isDefault: true });

      await service.setDefault(mockUserId, mockAddressId);

      expect(prisma.userAddress.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, isDefault: true },
        data: { isDefault: false },
      });
      expect(prisma.userAddress.update).toHaveBeenCalledWith({
        where: { id: mockAddressId },
        data: { isDefault: true },
      });
    });
  });
});