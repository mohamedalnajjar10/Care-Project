import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentMethod, PaymentStatus, AppointmentStatus } from '@prisma/client';
import { PaypalStrategy } from './strategies/paypal.strategy';
import { StripeStrategy } from './strategies/stripe.strategy';
import { ApplePayStrategy } from './strategies/apple-pay.strategy';
import { PaymentStrategy } from './strategies/payment-strategy.interface';
import { AppointmentsService } from '../appointments/appointments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private strategies: Map<PaymentMethod, PaymentStrategy>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly appointmentsService: AppointmentsService,
    private readonly notificationsService: NotificationsService,
    private readonly paypalStrategy: PaypalStrategy,
    private readonly stripeStrategy: StripeStrategy,
    private readonly applePayStrategy: ApplePayStrategy,
  ) {
    // FIX: Proper typing for Map
    this.strategies = new Map<PaymentMethod, PaymentStrategy>();
    this.strategies.set(PaymentMethod.PAYPAL, this.paypalStrategy);
    this.strategies.set(PaymentMethod.VISA_CARD, this.stripeStrategy);
    this.strategies.set(PaymentMethod.APPLE_PAY, this.applePayStrategy);
  }

  /**
   * Initiate payment
   */
  async initiatePayment(userId: string, dto: CreatePaymentDto) {
    // Validate appointment
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: {
        doctorProfile: { include: { user: true } },
        patient: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.patientId !== userId) {
      throw new BadRequestException('This is not your appointment');
    }

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Payment already processed or appointment cancelled');
    }

    // Check if payment already exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { appointmentId: dto.appointmentId },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed');
    }

    // Get payment strategy
    const strategy = this.strategies.get(dto.paymentMethod);
    if (!strategy) {
      throw new BadRequestException('Invalid payment method');
    }

    try {
      // 1. Save payment record FIRST to get the ID
      const payment = await this.prisma.payment.create({
        data: {
          appointmentId: dto.appointmentId,
          amount: dto.amount,
          currency: dto.currency,
          paymentMethod: dto.paymentMethod,
          status: PaymentStatus.PROCESSING,
          // We will update paymentIntentId after creating the order
        },
      });

      // 2. Create payment with provider (Pass payment.id to use in return URL)
      const paymentResult = await strategy.createPayment(dto.amount, dto.currency, {
        appointmentId: dto.appointmentId,
        patientId: userId,
        paymentId: payment.id,
      });

      // 3. Update payment with Provider Order ID
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentIntentId: paymentResult.orderId,
          paymentProviderData: paymentResult as any,
        },
      });

      this.logger.log(`Payment initiated: ${payment.id}`);

      return {
        paymentId: payment.id,
        ...paymentResult,
      };
    } catch (error: any) {
      this.logger.error(`Payment initiation failed: ${error.message}`);
      throw new BadRequestException(`Payment failed: ${error.message}`);
    }
  }

  /**
 * Helper: Get payment by ID (Added to fix the error)
 */
  async getPaymentById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
    });
  }

  /**
   * Confirm payment
   */
  async confirmPayment(paymentId: string, paymentIntentId: string) {
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
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed');
    }

    const strategy = this.strategies.get(payment.paymentMethod);
    if (!strategy) {
      throw new BadRequestException('Invalid payment method');
    }

    try {
      // Confirm with provider
      const confirmResult = await strategy.confirmPayment(paymentIntentId);

      // Update payment
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          transactionId: confirmResult.transactionId,
          paymentProviderId: confirmResult.chargeId || confirmResult.captureId,
          completedAt: new Date(),
        },
      });

      // Confirm appointment
      await this.appointmentsService.confirmAppointment(
        payment.appointmentId,
        confirmResult.transactionId,
      );

      // Send notification to patient
      await this.notificationsService.createNotification({
        userId: payment.appointment.patientId,
        type: NotificationType.PAYMENT_SUCCESS,
        title: 'Payment Successful',
        message: `Your payment of ${payment.amount} ${payment.currency} has been processed successfully`,
        data: { paymentId: payment.id, appointmentId: payment.appointmentId },
      });

      this.logger.log(`Payment confirmed: ${paymentId}`);

      return updatedPayment;
    } catch (error: any) {
      // Mark payment as failed
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: error.message,
        },
      });

      // Send failure notification
      await this.notificationsService.createNotification({
        userId: payment.appointment.patientId,
        type: NotificationType.PAYMENT_FAILED,
        title: 'Payment Failed',
        message: `Your payment could not be processed. Please try again.`,
        data: { paymentId: payment.id, reason: error.message },
      });

      this.logger.error(`Payment confirmation failed: ${error.message}`);
      throw new BadRequestException(`Payment confirmation failed: ${error.message}`);
    }
  }

  /**
   * Refund payment (when appointment is cancelled)
   */
  async refundPayment(appointmentId: string) {
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
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment is not completed, cannot refund');
    }

    // FIX: Remove duplicate check (already checked above)
    const strategy = this.strategies.get(payment.paymentMethod);
    if (!strategy) {
      throw new BadRequestException('Invalid payment method');
    }

    // FIX: Check if paymentProviderId exists
    if (!payment.paymentProviderId) {
      throw new BadRequestException('Payment provider ID not found, cannot process refund');
    }

    try {
      const refundResult = await strategy.refundPayment(
        payment.paymentProviderId,
        Number(payment.amount),
      );

      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
          refundTransactionId: refundResult.refundId,
          refundedAt: new Date(),
        },
      });

      this.logger.log(`Payment refunded: ${payment.id}`);

      return updatedPayment;
    } catch (error: any) {
      this.logger.error(`Refund failed: ${error.message}`);
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  /**
   * Get payment by appointment
   */
  async getPaymentByAppointment(appointmentId: string) {
    return this.prisma.payment.findUnique({
      where: { appointmentId },
    });
  }
}
