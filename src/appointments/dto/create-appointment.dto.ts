import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
    @ApiProperty({ example: 'uuid-of-doctor-profile' })
    @IsNotEmpty()
    @IsUUID()
    doctorProfileId: string;

    @ApiProperty({ example: '2024-01-20T10:00:00Z' })
    @IsNotEmpty()
    @IsDateString()
    appointmentDate: string;

    @ApiProperty({ example: 'I have a headache', required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}