import { OtpPurpose } from '@prisma/client';
import { IsEnum, IsString, Matches } from 'class-validator';

export class ResendOtpDto {
    @IsString()
    @Matches(/^\+?[1-9]\d{7,14}$/, {
        message: 'mobile must be a valid phone number',
    })
    mobile: string;

    @IsEnum(OtpPurpose)
    purpose: OtpPurpose;
}
