import { OtpPurpose } from '@prisma/client';
export declare class ResendOtpDto {
    mobile: string;
    purpose: OtpPurpose;
}
