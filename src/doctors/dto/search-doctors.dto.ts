import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortDoctorsBy {
    RATING = 'rating',
    EXPERIENCE = 'experience',
    NEWEST = 'newest',
}

export class SearchDoctorsDto {
    @ApiProperty({ required: false, description: 'Search term (doctor name, hospital, or specialty)' })
    @IsOptional()
    @IsString()
    searchTerm?: string;

    @ApiProperty({ required: false, description: 'Specialty ID' })
    @IsOptional()
    @IsString()
    specialtyId?: string;

    @ApiProperty({ enum: SortDoctorsBy, required: false })
    @IsOptional()
    @IsEnum(SortDoctorsBy)
    sortBy?: SortDoctorsBy;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
