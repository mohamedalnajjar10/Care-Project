import { Test, TestingModule } from '@nestjs/testing';
import { DoctorsService } from './doctors.service';
import { PrismaService } from 'prisma/prisma.service';
import { CareSearchService } from 'src/search/indexes/care-search.service';
import { CareSearchIndexer } from 'src/search/indexes/care-search.indexer';
import { MeiliService } from 'src/search/meili/meili.service';
import { 
  NotFoundException, 
  ForbiddenException, 
  ConflictException, 
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

const mockUser = { id: 'user-uuid', role: UserRole.DOCTOR, fullName: 'Test User' };
const mockDoctorProfile = { 
  id: 'doctor-uuid', 
  userId: 'user-uuid', 
  specialtyId: 'spec-uuid',
  hospitalName: 'Test Hospital',
  user: mockUser,
  specialty: { id: 'spec-uuid', name: 'Cardio' },
  rating: 5,
  reviewsCount: 10,
  favoritedBy: []
};

const mockPrismaService = {
  user: { findUnique: jest.fn() },
  doctorProfile: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  specialty: { 
    findUnique: jest.fn(),
    findMany: jest.fn() 
  },
  favoriteDoctor: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockCareSearchService = {
  search: jest.fn(),
};

const mockCareSearchIndexer = {
  upsertDoctorProfile: jest.fn(),
};

const mockMeiliService = {
  getIndex: jest.fn().mockReturnValue({
    updateSettings: jest.fn(),
    addDocuments: jest.fn(),
    getStats: jest.fn(),
    getDocuments: jest.fn(),
  }),
  client: {
    deleteIndex: jest.fn(),
    createIndex: jest.fn(),
  }
};

describe('DoctorsService', () => {
  let service: DoctorsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CareSearchService, useValue: mockCareSearchService },
        { provide: CareSearchIndexer, useValue: mockCareSearchIndexer },
        { provide: MeiliService, useValue: mockMeiliService },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
    prisma = module.get<PrismaService>(PrismaService);
    
    jest.clearAllMocks();
  });

  describe('createProfileForDoctor', () => {
    const dto = { specialtyId: 'spec-uuid', hospitalName: 'H', workingHours: '9-5' };

    it('should create profile successfully for a DOCTOR user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.doctorProfile.findUnique.mockResolvedValue(null); // No existing profile
      mockPrismaService.specialty.findUnique.mockResolvedValue({ id: 'spec-uuid' });
      mockPrismaService.doctorProfile.create.mockResolvedValue(mockDoctorProfile);
      mockCareSearchIndexer.upsertDoctorProfile.mockResolvedValue(undefined);

      const result = await service.createProfileForDoctor('user-uuid', dto);
      
      expect(result).toEqual(mockDoctorProfile);
      expect(mockCareSearchIndexer.upsertDoctorProfile).toHaveBeenCalledWith('doctor-uuid');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.createProfileForDoctor('wrong-id', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a DOCTOR', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser, role: UserRole.PATIENT });
      await expect(service.createProfileForDoctor('user-uuid', dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.doctorProfile.findUnique.mockResolvedValue(mockDoctorProfile); // Exists
      await expect(service.createProfileForDoctor('user-uuid', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('toggleFavorite', () => {
    it('should add a doctor to favorites if not exists', async () => {
      mockPrismaService.doctorProfile.findUnique.mockResolvedValue(mockDoctorProfile);
      mockPrismaService.favoriteDoctor.findUnique.mockResolvedValue(null); 
      mockPrismaService.favoriteDoctor.create.mockResolvedValue({ id: 'fav-id' });

      const result = await service.toggleFavorite('user-uuid', 'doctor-uuid');
      
      expect(result.isFavorite).toBe(true);
      expect(result.message).toContain('added');
    });

    it('should remove a doctor from favorites if exists', async () => {
      mockPrismaService.doctorProfile.findUnique.mockResolvedValue(mockDoctorProfile);
      mockPrismaService.favoriteDoctor.findUnique.mockResolvedValue({ id: 'fav-id' }); 
      mockPrismaService.favoriteDoctor.delete.mockResolvedValue({ id: 'fav-id' });

      const result = await service.toggleFavorite('user-uuid', 'doctor-uuid');
      
      expect(result.isFavorite).toBe(false);
      expect(result.message).toContain('removed');
    });

    it('should throw NotFoundException if doctor does not exist', async () => {
      mockPrismaService.doctorProfile.findUnique.mockResolvedValue(null);
      await expect(service.toggleFavorite('user-uuid', 'wrong-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFavorites', () => {
    it('should return formatted list of favorites', async () => {
      const mockFavList = [{
        doctorProfile: { ...mockDoctorProfile, user: mockUser, specialty: { name: 'Cardio', iconUrl: 'url' } },
        createdAt: new Date(),
      }];
      mockPrismaService.favoriteDoctor.findMany.mockResolvedValue(mockFavList);

      const result = await service.getFavorites('user-uuid');
      
      expect(result).toBeInstanceOf(Array);
      expect(result[0].isFavorite).toBe(true);
      expect(result[0].fullName).toEqual('Test User');
    });
  });

  describe('searchDoctors', () => {
    it('should return mixed results from Meilisearch and Prisma', async () => {
      const meiliItems = [
        { type: 'doctor', doctorProfileId: 'doctor-uuid' },
        { type: 'specialty', specialtyId: 'spec-uuid' }
      ];
      mockCareSearchService.search.mockResolvedValue({ items: meiliItems, total: 2 });

      mockPrismaService.doctorProfile.findMany.mockResolvedValue([mockDoctorProfile]);
      mockPrismaService.specialty.findMany.mockResolvedValue([{ id: 'spec-uuid', name: 'Cardio', iconUrl: 'url' }]);

      const result = await service.searchDoctors('user-uuid', { page: 1, limit: 10 });

      expect(result.data.length).toBe(2);
      expect(result.data[0].type).toBe('doctor');
      expect(result.data[1].type).toBe('specialty');
    });
  });
});