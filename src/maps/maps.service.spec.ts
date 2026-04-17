import { Test, TestingModule } from '@nestjs/testing';
import { MapsService } from './maps.service';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');

describe('MapsService', () => {
  let service: MapsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MapsService],
    }).compile();

    service = module.get<MapsService>(MapsService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reverseGeocode', () => {
    const lat = 30.0444;
    const lon = 31.2357;

    it('should return formatted address on successful API call', async () => {
      const mockResponse = {
        data: {
          place_id: 123456,
          display_name: 'Cairo, Egypt',
          address: {
            road: 'Tahrir Square',
            city: 'Cairo',
            country: 'Egypt',
          },
        },
      };

      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.reverseGeocode(lat, lon);

      expect(result).toEqual({
        formattedAddress: 'Cairo, Egypt',
        placeId: '123456',
        street: 'Tahrir Square',
        city: 'Cairo',
        country: 'Egypt',
        area: undefined,
        state: undefined,
        postalCode: undefined,
      });

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: {
            lat,
            lon,
            format: 'jsonv2',
            'accept-language': 'en',
            addressdetails: 1,
          },
        })
      );
    });

    it('should build street correctly with house number and road', async () => {
      const mockResponse = {
        data: {
          place_id: 999,
          display_name: '10 Downing Street, London',
          address: {
            house_number: '10',
            road: 'Downing Street',
            city: 'London',
          },
        },
      };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.reverseGeocode(lat, lon);

      expect(result.street).toBe('10 Downing Street');
    });

    it('should throw BadRequestException if display_name is missing', async () => {
      const mockResponse = {
        data: {
          place_id: 123,
          // display_name missing
        },
      };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.reverseGeocode(lat, lon)).rejects.toThrow(BadRequestException);
      await expect(service.reverseGeocode(lat, lon)).rejects.toThrow('Unable to resolve address from location');
    });

    it('should throw InternalServerErrorException on Axios error', async () => {
      const axiosError = new Error('Network Error');
      
      (axios.isAxiosError as jest.Mock).mockReturnValue(true);
      (axios.get as jest.Mock).mockRejectedValue(axiosError);

      await expect(service.reverseGeocode(lat, lon)).rejects.toThrow(InternalServerErrorException);
      await expect(service.reverseGeocode(lat, lon)).rejects.toThrow('OpenStreetMap reverse geocoding failed');
    });

    it('should throw InternalServerErrorException on generic error', async () => {
      const genericError = new Error('Something went wrong');
      
      (axios.isAxiosError as jest.Mock).mockReturnValue(false);
      (axios.get as jest.Mock).mockRejectedValue(genericError);

      await expect(service.reverseGeocode(lat, lon)).rejects.toThrow(InternalServerErrorException);
      await expect(service.reverseGeocode(lat, lon)).rejects.toThrow('Failed to communicate with map service');
    });
  });
});