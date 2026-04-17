import { Injectable, Logger } from '@nestjs/common';
import { PaymentStrategy } from './payment-strategy.interface';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class ApplePayStrategy implements PaymentStrategy {
  private readonly logger = new Logger(ApplePayStrategy.name);
  private stripe: Stripe.Stripe;

    constructor(private configService: ConfigService) {
        const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
        }

        this.stripe = new Stripe(stripeSecretKey, {
            // apiVersion: '2026-01-28.clover', 
        });
    }

    async createPayment(amount: number, currency: string, metadata: any): Promise<any> {
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency.toLowerCase(),
            payment_method_types: ['card'], // Apple Pay works through card type
            metadata: {
                appointmentId: metadata.appointmentId,
                paymentType: 'apple_pay',
            },
        });

        this.logger.log(`Apple Pay payment intent created: ${paymentIntent.id}`);

        return {
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            status: paymentIntent.status,
        };
    }

    async confirmPayment(paymentIntentId: string): Promise<any> {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

        this.logger.log(`Apple Pay payment confirmed: ${paymentIntent.id}`);

        return {
            transactionId: paymentIntent.id,
            status: paymentIntent.status,
            chargeId: paymentIntent.latest_charge as string,
        };
    }

    async refundPayment(chargeId: string, amount: number): Promise<any> {
        const refund = await this.stripe.refunds.create({
            charge: chargeId,
            amount: Math.round(amount * 100),
        });

        this.logger.log(`Apple Pay refund created: ${refund.id}`);

        return {
            refundId: refund.id,
            status: refund.status,
        };
    }
}