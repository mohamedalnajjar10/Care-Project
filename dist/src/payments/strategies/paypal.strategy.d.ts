import { PaymentStrategy } from './payment-strategy.interface';
import { ConfigService } from '@nestjs/config';
export declare class PaypalStrategy implements PaymentStrategy {
    private configService;
    private readonly logger;
    private client;
    constructor(configService: ConfigService);
    createPayment(amount: number, currency: string, metadata: any): Promise<any>;
    confirmPayment(orderId: string): Promise<any>;
    refundPayment(captureId: string, amount: number): Promise<any>;
}
