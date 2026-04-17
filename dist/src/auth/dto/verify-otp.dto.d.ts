import { OtpPurpose } from '@prisma/client';
export declare class VerifyOtpDto {
    mobile: string;
    code: string;
    purpose: OtpPurpose;
}
