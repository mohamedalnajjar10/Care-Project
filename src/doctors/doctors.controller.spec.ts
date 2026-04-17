import { Test, TestingModule } from '@nestjs/testing';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';

describe('DoctorsController', () => {
  let controller: DoctorsController;
  let service: DoctorsService;

  const mockDoctorsService = {
    createProfileForDoctor: jest.fn(),
    searchDoctors: jest.fn(),
    getFavorites: jest.fn(),
    toggleFavorite: jest.fn(),
    syncAllDoctorsToSearch: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorsController],
      providers: [
        { provide: DoctorsService, useValue: mockDoctorsService },
      ],
    }).compile();

    controller = module.get<DoctorsController>(DoctorsController);
    service = module.get<DoctorsService>(DoctorsService);
    jest.clearAllMocks();
  });

  describe('createMyProfile', () => {
    it('should call service with userId from request', async () => {
      const req = { user: { id: 'user-123' } };
      const dto = { specialtyId: 'spec-1', hospitalName: 'H' };

      await controller.createMyProfile(req, dto);

      expect(service.createProfileForDoctor).toHaveBeenCalledWith('user-123', dto);
    });
  });

  describe('toggleFavorite', () => {
    it('should call service with correct params', async () => {
      const req = { user: { id: 'user-123' } };

      await controller.toggleFavorite(req, 'doctor-456');

      expect(service.toggleFavorite).toHaveBeenCalledWith('user-123', 'doctor-456');
    });
  });
});