import { PaymentStrategy } from './payment-strategy.interface';
import { ConfigService } from '@nestjs/config';
export declare class ApplePayStrategy implements PaymentStrategy {
    private configService;
    private readonly logger;
    private stripe;
    constructor(configService: ConfigService);
    createPayment(amount: number, currency: string, metadata: any): Promise<any>;
    confirmPayment(paymentIntentId: string): Promise<any>;
    refundPayment(chargeId: string, amount: number): Promise<any>;
}
