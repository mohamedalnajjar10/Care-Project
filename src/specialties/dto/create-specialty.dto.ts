import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSpecialtyDto {
    @ApiProperty({ example: 'Dentist', description: 'Specialty name' })
    @IsNotEmpty({ message: 'Specialty name is required' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'https://example.com/icon.png', required: false })
    @IsOptional()
    @IsString()
    iconUrl?: string;
}