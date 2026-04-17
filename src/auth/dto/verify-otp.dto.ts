import { OtpPurpose } from '@prisma/client';
import { IsEnum, IsString, Length, Matches } from 'class-validator';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

export class VerifyOtpDto {
    @IsString()
    @Matches(/^\+?[1-9]\d{7,14}$/, {
        message: 'mobile must be a valid phone number',
    })
    mobile: string;

    @IsString()
    @Length(AUTH_CONSTANTS.OTP_LENGTH, AUTH_CONSTANTS.OTP_LENGTH)
    code: string;

    @IsEnum(OtpPurpose)
    purpose: OtpPurpose;
}
