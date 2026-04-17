import { AddressLabel } from '@prisma/client';
export declare class CreateUserAddressDto {
    label?: AddressLabel;
    title?: string;
    formattedAddress: string;
    placeId?: string;
    latitude: number;
    longitude: number;
    street?: string;
    area?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    buildingNumber?: string;
    floor?: string;
    apartmentNumber?: string;
    landmark?: string;
    notes?: string;
    isDefault?: boolean;
}
