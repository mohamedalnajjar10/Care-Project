import { PaymentMethod } from '@prisma/client';
export declare class CreatePaymentDto {
    appointmentId: string;
    paymentMethod: PaymentMethod;
    amount: number;
    currency: string;
}
