import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateReviewDto {
    @ApiProperty({ example: 'uuid-of-doctor-profile' })
    @IsNotEmpty()
    @IsUUID()
    doctorProfileId: string;

    @ApiProperty({ example: 4.5, minimum: 0, maximum: 5 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Max(5)
    rating: number;

    @ApiProperty({ example: 'Great doctor!', required: false })
    @IsOptional()
    @IsString()
    comment?: string;
}