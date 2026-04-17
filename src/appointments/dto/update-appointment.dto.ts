import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class UpdateAppointmentDto {
    @ApiProperty({ example: '2024-01-20T10:00:00Z', required: false })
    @IsOptional()
    @IsDateString()
    appointmentDate?: string;

    @ApiProperty({ enum: AppointmentStatus, required: false })
    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;

    @ApiProperty({ example: 'Updated notes', required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ example: 'Cancel reason', required: false })
    @IsOptional()
    @IsString()
    cancelReason?: string;
}