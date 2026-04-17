import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    initiatePayment(req: any, dto: CreatePaymentDto): Promise<any>;
    confirmPayment(paymentId: string, paymentIntentId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PaymentStatus;
        appointmentId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        paymentIntentId: string | null;
        paymentProviderId: string | null;
        paymentProviderData: import("@prisma/client/runtime/library").JsonValue | null;
        failureReason: string | null;
        refundTransactionId: string | null;
        refundedAt: Date | null;
        completedAt: Date | null;
    }>;
    handlePaypalSuccess(token: string, paymentId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    refundPayment(appointmentId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PaymentStatus;
        appointmentId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        paymentIntentId: string | null;
        paymentProviderId: string | null;
        paymentProviderData: import("@prisma/client/runtime/library").JsonValue | null;
        failureReason: string | null;
        refundTransactionId: string | null;
        refundedAt: Date | null;
        completedAt: Date | null;
    }>;
    getPaymentByAppointment(appointmentId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PaymentStatus;
        appointmentId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        transactionId: string | null;
        paymentIntentId: string | null;
        paymentProviderId: string | null;
        paymentProviderData: import("@prisma/client/runtime/library").JsonValue | null;
        failureReason: string | null;
        refundTransactionId: string | null;
        refundedAt: Date | null;
        completedAt: Date | null;
    } | null>;
}
