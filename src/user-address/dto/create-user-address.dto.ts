import { AddressLabel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsLatitude,
    IsLongitude,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateUserAddressDto {
    @IsOptional()
    @IsEnum(AddressLabel)
    label?: AddressLabel;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    title?: string;

    @IsString()
    @MaxLength(500)
    formattedAddress: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    placeId?: string;

    @Type(() => Number)
    @IsLatitude()
    latitude: number;

    @Type(() => Number)
    @IsLongitude()
    longitude: number;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    street?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    area?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    state?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    country?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    postalCode?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    buildingNumber?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    floor?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    apartmentNumber?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    landmark?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isDefault?: boolean;
}