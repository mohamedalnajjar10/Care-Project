"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StripeStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
let StripeStrategy = StripeStrategy_1 = class StripeStrategy {
    configService;
    logger = new common_1.Logger(StripeStrategy_1.name);
    stripe;
    constructor(configService) {
        this.configService = configService;
        const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
        }
        this.stripe = new stripe_1.default(stripeSecretKey, {});
    }
    async createPayment(amount, currency, metadata) {
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency.toLowerCase(),
            payment_method_types: ['card'],
            metadata: {
                appointmentId: metadata.appointmentId,
            },
        });
        this.logger.log(`Stripe payment intent created: ${paymentIntent.id}`);
        return {
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            status: paymentIntent.status,
        };
    }
    async confirmPayment(paymentIntentId) {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
        this.logger.log(`Stripe payment confirmed: ${paymentIntent.id}`);
        return {
            transactionId: paymentIntent.id,
            status: paymentIntent.status,
            chargeId: paymentIntent.latest_charge,
        };
    }
    async refundPayment(chargeId, amount) {
        const refund = await this.stripe.refunds.create({
            charge: chargeId,
            amount: Math.round(amount * 100),
        });
        this.logger.log(`Stripe refund created: ${refund.id}`);
        return {
            refundId: refund.id,
            status: refund.status,
        };
    }
};
exports.StripeStrategy = StripeStrategy;
exports.StripeStrategy = StripeStrategy = StripeStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeStrategy);
//# sourceMappingURL=stripe.strategy.js.map