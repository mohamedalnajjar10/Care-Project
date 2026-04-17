import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';

interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

interface NominatimReverseResponse {
  place_id: number;
  display_name: string;
  address?: NominatimAddress;
}

export interface ResolvedMapAddress {
  formattedAddress: string;
  placeId?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

@Injectable()
export class MapsService {
  private readonly reverseGeocodeUrl =
    'https://nominatim.openstreetmap.org/reverse';

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<ResolvedMapAddress> {
    try {
      const response = await axios.get<NominatimReverseResponse>(
        this.reverseGeocodeUrl,
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'jsonv2',
            'accept-language': 'en',
            addressdetails: 1,
          },
          headers: {
            'User-Agent': 'care-project/1.0 (contact: support@care-project.local)',
          },
          timeout: 10000,
        },
      );

      const data = response.data;

      if (!data?.display_name) {
        throw new BadRequestException('Unable to resolve address from location');
      }

      const address = data.address ?? {};

      return {
        formattedAddress: data.display_name,
        placeId: data.place_id ? String(data.place_id) : undefined,
        street: this.buildStreet(address),
        area: address.suburb || address.neighbourhood,
        city: address.city || address.town || address.village,
        state: address.state,
        country: address.country,
        postalCode: address.postcode,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new InternalServerErrorException(
          `OpenStreetMap reverse geocoding failed: ${error.message}`,
        );
      }

      throw new InternalServerErrorException(
        'Failed to communicate with map service',
      );
    }
  }

  private buildStreet(address: NominatimAddress): string | undefined {
    if (address.house_number && address.road) {
      return `${address.house_number} ${address.road}`;
    }

    return address.road;
  }
}
