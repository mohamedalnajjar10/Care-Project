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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const paypal_strategy_1 = require("./strategies/paypal.strategy");
const stripe_strategy_1 = require("./strategies/stripe.strategy");
const apple_pay_strategy_1 = require("./strategies/apple-pay.strategy");
const appointments_service_1 = require("../appointments/appointments.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_2 = require("@prisma/client");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    appointmentsService;
    notificationsService;
    paypalStrategy;
    stripeStrategy;
    applePayStrategy;
    logger = new common_1.Logger(PaymentsService_1.name);
    strategies;
    constructor(prisma, appointmentsService, notificationsService, paypalStrategy, stripeStrategy, applePayStrategy) {
        this.prisma = prisma;
        this.appointmentsService = appointmentsService;
        this.notificationsService = notificationsService;
        this.paypalStrategy = paypalStrategy;
        this.stripeStrategy = stripeStrategy;
        this.applePayStrategy = applePayStrategy;
        this.strategies = new Map();
        this.strategies.set(client_1.PaymentMethod.PAYPAL, this.paypalStrategy);
        this.strategies.set(client_1.PaymentMethod.VISA_CARD, this.stripeStrategy);
        this.strategies.set(client_1.PaymentMethod.APPLE_PAY, this.applePayStrategy);
    }
    async initiatePayment(userId, dto) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: dto.appointmentId },
            include: {
                doctorProfile: { include: { user: true } },
                patient: true,
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (appointment.patientId !== userId) {
            throw new common_1.BadRequestException('This is not your appointment');
        }
        if (appointment.status !== client_1.AppointmentStatus.PENDING) {
            throw new common_1.BadRequestException('Payment already processed or appointment cancelled');
        }
        const existingPayment = await this.prisma.payment.findUnique({
            where: { appointmentId: dto.appointmentId },
        });
        if (existingPayment && existingPayment.status === client_1.PaymentStatus.COMPLETED) {
            throw new common_1.BadRequestException('Payment already completed');
        }
        const strategy = this.strategies.get(dto.paymentMethod);
        if (!strategy) {
            throw new common_1.BadRequestException('Invalid payment method');
        }
        try {
            const payment = await this.prisma.payment.create({
                data: {
                    appointmentId: dto.appointmentId,
                    amount: dto.amount,
                    currency: dto.currency,
                    paymentMethod: dto.paymentMethod,
                    status: client_1.PaymentStatus.PROCESSING,
                },
            });
            const paymentResult = await strategy.createPayment(dto.amount, dto.currency, {
                appointmentId: dto.appointmentId,
                patientId: userId,
                paymentId: payment.id,
            });
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    paymentIntentId: paymentResult.orderId,
                    paymentProviderData: paymentResult,
                },
            });
            this.logger.log(`Payment initiated: ${payment.id}`);
            return {
                paymentId: payment.id,
                ...paymentResult,
            };
        }
        catch (error) {
            this.logger.error(`Payment initiation failed: ${error.message}`);
            throw new common_1.BadRequestException(`Payment failed: ${error.message}`);
        }
    }
    async getPaymentById(id) {
        return this.prisma.payment.findUnique({
            where: { id },
        });
    }
    async confirmPayment(paymentId, paymentIntentId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                appointment: {
                    include: {
                        doctorProfile: { include: { user: true } },
                        patient: true,
                    },
                },
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.status === client_1.PaymentStatus.COMPLETED) {
            throw new common_1.BadRequestException('Payment already completed');
        }
        const strategy = this.strategies.get(payment.paymentMethod);
        if (!strategy) {
            throw new common_1.BadRequestException('Invalid payment method');
        }
        try {
            const confirmResult = await strategy.confirmPayment(paymentIntentId);
            const updatedPayment = await this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: client_1.PaymentStatus.COMPLETED,
                    transactionId: confirmResult.transactionId,
                    paymentProviderId: confirmResult.chargeId || confirmResult.captureId,
                    completedAt: new Date(),
                },
            });
            await this.appointmentsService.confirmAppointment(payment.appointmentId, confirmResult.transactionId);
            await this.notificationsService.createNotification({
                userId: payment.appointment.patientId,
                type: client_2.NotificationType.PAYMENT_SUCCESS,
                title: 'Payment Successful',
                message: `Your payment of ${payment.amount} ${payment.currency} has been processed successfully`,
                data: { paymentId: payment.id, appointmentId: payment.appointmentId },
            });
            this.logger.log(`Payment confirmed: ${paymentId}`);
            return updatedPayment;
        }
        catch (error) {
            await this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: client_1.PaymentStatus.FAILED,
                    failureReason: error.message,
                },
            });
            await this.notificationsService.createNotification({
                userId: payment.appointment.patientId,
                type: client_2.NotificationType.PAYMENT_FAILED,
                title: 'Payment Failed',
                message: `Your payment could not be processed. Please try again.`,
                data: { paymentId: payment.id, reason: error.message },
            });
            this.logger.error(`Payment confirmation failed: ${error.message}`);
            throw new common_1.BadRequestException(`Payment confirmation failed: ${error.message}`);
        }
    }
    async refundPayment(appointmentId) {
        const payment = await this.prisma.payment.findUnique({
            where: { appointmentId },
            include: {
                appointment: {
                    include: {
                        patient: true,
                        doctorProfile: { include: { user: true } },
                    },
                },
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.status !== client_1.PaymentStatus.COMPLETED) {
            throw new common_1.BadRequestException('Payment is not completed, cannot refund');
        }
        const strategy = this.strategies.get(payment.paymentMethod);
        if (!strategy) {
            throw new common_1.BadRequestException('Invalid payment method');
        }
        if (!payment.paymentProviderId) {
            throw new common_1.BadRequestException('Payment provider ID not found, cannot process refund');
        }
        try {
            const refundResult = await strategy.refundPayment(payment.paymentProviderId, Number(payment.amount));
            const updatedPayment = await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: client_1.PaymentStatus.REFUNDED,
                    refundTransactionId: refundResult.refundId,
                    refundedAt: new Date(),
                },
            });
            this.logger.log(`Payment refunded: ${payment.id}`);
            return updatedPayment;
        }
        catch (error) {
            this.logger.error(`Refund failed: ${error.message}`);
            throw new common_1.BadRequestException(`Refund failed: ${error.message}`);
        }
    }
    async getPaymentByAppointment(appointmentId) {
        return this.prisma.payment.findUnique({
            where: { appointmentId },
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        appointments_service_1.AppointmentsService,
        notifications_service_1.NotificationsService,
        paypal_strategy_1.PaypalStrategy,
        stripe_strategy_1.StripeStrategy,
        apple_pay_strategy_1.ApplePayStrategy])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map