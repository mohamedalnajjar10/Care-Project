import { AddressLabel } from '@prisma/client';
export declare class CreateAddressFromMapDto {
    latitude: number;
    longitude: number;
    label?: AddressLabel;
    title?: string;
    isDefault?: boolean;
    landmark?: string;
    notes?: string;
}
