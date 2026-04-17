import { Injectable, Logger } from '@nestjs/common';
import { PaymentStrategy } from './payment-strategy.interface';
import * as paypal from '@paypal/checkout-server-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaypalStrategy implements PaymentStrategy {
    private readonly logger = new Logger(PaypalStrategy.name);
    private client: paypal.core.PayPalHttpClient;

    constructor(private configService: ConfigService) {
        const environment =
            this.configService.get('PAYPAL_MODE') === 'production'
                ? new paypal.core.LiveEnvironment(
                    this.configService.get('PAYPAL_CLIENT_ID'),
                    this.configService.get('PAYPAL_CLIENT_SECRET'),
                )
                : new paypal.core.SandboxEnvironment(
                    this.configService.get('PAYPAL_CLIENT_ID'),
                    this.configService.get('PAYPAL_CLIENT_SECRET'),
                );

        this.client = new paypal.core.PayPalHttpClient(environment);
    }

    async createPayment(amount: number, currency: string, metadata: any): Promise<any> {
        // استخراج الـ paymentId من الـ metadata
        const paymentId = metadata.paymentId;

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: currency,
                        value: amount.toFixed(2),
                    },
                    description: `Appointment #${metadata.appointmentId}`,
                },
            ],
            application_context: {
                brand_name: 'Hospital Booking',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                // استخدام الـ paymentId في الروابط
                return_url: `${this.configService.get('APP_URL')}/payments/paypal/success?paymentId=${paymentId}`,
                cancel_url: `${this.configService.get('APP_URL')}/payments/cancel?paymentId=${paymentId}`,
            },
        });

        const response = await this.client.execute(request);
        this.logger.log(`PayPal order created: ${response.result.id}`);

        return {
            orderId: response.result.id,
            status: response.result.status,
            links: response.result.links,
        };
    }

    async confirmPayment(orderId: string): Promise<any> {
        const getRequest = new paypal.orders.OrdersGetRequest(orderId);
        const getResponse = await this.client.execute(getRequest);
        const orderStatus = getResponse.result.status;

        this.logger.log(`PayPal order ${orderId} status: ${orderStatus}`);

        if (orderStatus !== 'APPROVED' && orderStatus !== 'COMPLETED') {
            const approveLink = getResponse.result.links?.find(
                (link: any) => link.rel === 'approve',
            );
            throw new Error(
                `Order not yet approved by the payer. Current status: ${orderStatus}. ` +
                `Please redirect the user to approve the payment first.` +
                (approveLink ? ` Approval URL: ${approveLink.href}` : ''),
            );
        }

        if (orderStatus === 'COMPLETED') {
            return {
                transactionId: getResponse.result.id,
                status: getResponse.result.status,
                captureId: getResponse.result.purchase_units[0]?.payments?.captures[0]?.id,
            };
        }

        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});

        const response = await this.client.execute(request);
        this.logger.log(`PayPal order captured: ${response.result.id}`);

        return {
            transactionId: response.result.id,
            status: response.result.status,
            captureId: response.result.purchase_units[0]?.payments?.captures[0]?.id,
        };
    }

    async refundPayment(captureId: string, amount: number): Promise<any> {
        const request = new paypal.payments.CapturesRefundRequest(captureId);
        request.requestBody({
            amount: {
                value: amount.toFixed(2),
                currency_code: 'USD',
            },
        });

        const response = await this.client.execute(request);
        this.logger.log(`PayPal refund created: ${response.result.id}`);

        return {
            refundId: response.result.id,
            status: response.result.status,
        };
    }
}