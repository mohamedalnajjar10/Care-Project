import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressLabel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
    IsLatitude,
    IsLongitude,
} from 'class-validator';

export class CreateAddressFromMapDto {
    @ApiProperty({ example: 30.0444 })
    @Type(() => Number)
    @IsLatitude()
    latitude: number;

    @ApiProperty({ example: 31.2357 })
    @Type(() => Number)
    @IsLongitude()
    longitude: number;

    @ApiPropertyOptional({ enum: AddressLabel, example: AddressLabel.HOME })
    @IsOptional()
    @IsEnum(AddressLabel)
    label?: AddressLabel;

    @ApiPropertyOptional({ example: 'My Home' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    title?: string;

    @ApiPropertyOptional({ example: true })
    @Type(() => Boolean)
    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;

    @ApiPropertyOptional({ example: 'Next to the pharmacy' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    landmark?: string;

    @ApiPropertyOptional({ example: 'Ring the bell twice' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}