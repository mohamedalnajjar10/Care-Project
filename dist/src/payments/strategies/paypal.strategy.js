"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaypalStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaypalStrategy = void 0;
const common_1 = require("@nestjs/common");
const paypal = __importStar(require("@paypal/checkout-server-sdk"));
const config_1 = require("@nestjs/config");
let PaypalStrategy = PaypalStrategy_1 = class PaypalStrategy {
    configService;
    logger = new common_1.Logger(PaypalStrategy_1.name);
    client;
    constructor(configService) {
        this.configService = configService;
        const environment = this.configService.get('PAYPAL_MODE') === 'production'
            ? new paypal.core.LiveEnvironment(this.configService.get('PAYPAL_CLIENT_ID'), this.configService.get('PAYPAL_CLIENT_SECRET'))
            : new paypal.core.SandboxEnvironment(this.configService.get('PAYPAL_CLIENT_ID'), this.configService.get('PAYPAL_CLIENT_SECRET'));
        this.client = new paypal.core.PayPalHttpClient(environment);
    }
    async createPayment(amount, currency, metadata) {
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
    async confirmPayment(orderId) {
        const getRequest = new paypal.orders.OrdersGetRequest(orderId);
        const getResponse = await this.client.execute(getRequest);
        const orderStatus = getResponse.result.status;
        this.logger.log(`PayPal order ${orderId} status: ${orderStatus}`);
        if (orderStatus !== 'APPROVED' && orderStatus !== 'COMPLETED') {
            const approveLink = getResponse.result.links?.find((link) => link.rel === 'approve');
            throw new Error(`Order not yet approved by the payer. Current status: ${orderStatus}. ` +
                `Please redirect the user to approve the payment first.` +
                (approveLink ? ` Approval URL: ${approveLink.href}` : ''));
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
    async refundPayment(captureId, amount) {
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
};
exports.PaypalStrategy = PaypalStrategy;
exports.PaypalStrategy = PaypalStrategy = PaypalStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaypalStrategy);
//# sourceMappingURL=paypal.strategy.js.map