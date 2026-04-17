import { Test, TestingModule } from '@nestjs/testing';
import { SpecialtiesService } from './specialties.service';
import { PrismaService } from 'prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  specialty: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('SpecialtiesService', () => {
  let service: SpecialtiesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpecialtiesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SpecialtiesService>(SpecialtiesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a specialty successfully', async () => {
      const dto = { name: 'Cardiology', iconUrl: 'url' };
      mockPrismaService.specialty.findUnique.mockResolvedValue(null);
      mockPrismaService.specialty.create.mockResolvedValue({ id: 'uuid', ...dto });

      const result = await service.create(dto);
      expect(result.name).toEqual('Cardiology');
    });

    it('should throw ConflictException if name exists', async () => {
      mockPrismaService.specialty.findUnique.mockResolvedValue({ id: 'uuid' });
      await expect(service.create({ name: 'Cardiology' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated specialties', async () => {
      mockPrismaService.specialty.findMany.mockResolvedValue([{ name: 'Cardio' }]);
      mockPrismaService.specialty.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update specialty if found', async () => {
      const dto = { name: 'Neuro' };
      mockPrismaService.specialty.findUnique.mockResolvedValue({ id: 'uuid' });
      mockPrismaService.specialty.update.mockResolvedValue({ id: 'uuid', ...dto });

      const result = await service.update('uuid', dto);
      expect(result.name).toEqual('Neuro');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.specialty.findUnique.mockResolvedValue(null);
      await expect(service.update('uuid', {})).rejects.toThrow(NotFoundException);
    });
  });
});