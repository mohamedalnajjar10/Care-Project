import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreatePaymentDto {
    @ApiProperty({ example: 'uuid-of-appointment' })
    @IsNotEmpty()
    @IsUUID()
    appointmentId: string;

    @ApiProperty({ enum: PaymentMethod })
    @IsNotEmpty()
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiProperty({ example: 50.0 })
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @ApiProperty({ example: 'USD' })
    @IsNotEmpty()
    @IsString()
    currency: string;
}