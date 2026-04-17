import { Test, TestingModule } from '@nestjs/testing';
import { SpecialtiesController } from './specialties.controller';
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

describe('SpecialtiesController', () => {
  let controller: SpecialtiesController;
  let service: SpecialtiesService;

  // Mock for SpecialtiesService
  const mockSpecialtiesService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpecialtiesController],
      providers: [
        {
          provide: SpecialtiesService,
          useValue: mockSpecialtiesService,
        },
      ],
    }).compile();

    controller = module.get<SpecialtiesController>(SpecialtiesController);
    service = module.get<SpecialtiesService>(SpecialtiesService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service with default page and limit if not provided', async () => {
      // Arrange
      mockSpecialtiesService.findAll.mockResolvedValue({ data: [], meta: {} });

      // Act
      await controller.findAll();

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should parse string query params to numbers and call service', async () => {
      // Arrange
      mockSpecialtiesService.findAll.mockResolvedValue({ data: [], meta: {} });

      // Act — pass values as strings
      await controller.findAll('2', '25');

      // Assert — parsed to numbers
      expect(service.findAll).toHaveBeenCalledWith(2, 25);
    });

    it('should return the result from the service', async () => {
      // Arrange
      const expectedResult = {
        data: [{ id: '1', name: 'Cardio' }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      mockSpecialtiesService.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll('1', '10');

      // Assert
      expect(result).toEqual(expectedResult);
    });
  });

  describe('create', () => {
    it('should call service create with correct DTO', async () => {
      // Arrange
      const dto: CreateSpecialtyDto = { name: 'Neurology', iconUrl: 'url' };
      mockSpecialtiesService.create.mockResolvedValue({ id: '1', ...dto });

      // Act
      await controller.create(dto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should call service update with id and DTO', async () => {
      // Arrange
      const id = 'spec-uuid';
      const dto: UpdateSpecialtyDto = { name: 'Updated Name' };
      mockSpecialtiesService.update.mockResolvedValue({ id, ...dto });

      // Act
      await controller.update(id, dto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('remove', () => {
    it('should call service remove with correct id', async () => {
      // Arrange
      const id = 'spec-uuid';
      mockSpecialtiesService.remove.mockResolvedValue({ message: 'Deleted' });

      // Act
      await controller.remove(id);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});