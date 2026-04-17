import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDoctorProfileDto {
    @ApiProperty({ example: 'uuid-of-specialty' })
    @IsNotEmpty()
    @IsString()
    specialtyId: string;

    @ApiProperty({ example: 'El-Nasr Hospital' })
    @IsNotEmpty()
    @IsString()
    hospitalName: string;

    @ApiProperty({ example: '9:30am - 8:00pm' })
    @IsNotEmpty()
    @IsString()
    workingHours: string;

    @ApiProperty({ example: 10, description: 'Years of experience' })
    @IsOptional()
    @IsNumber()
    experience?: number;

    @ApiProperty({ example: 50.0, description: 'Consultation fee in USD' })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    consultationFee: number;

    @ApiProperty({ example: 'About the doctor...', required: false })
    @IsOptional()
    @IsString()
    about?: string;
}