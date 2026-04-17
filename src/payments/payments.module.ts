import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from 'prisma/prisma.service';
import { PaypalStrategy } from './strategies/paypal.strategy';
import { StripeStrategy } from './strategies/stripe.strategy';
import { ApplePayStrategy } from './strategies/apple-pay.strategy';
import { ConfigModule } from '@nestjs/config';
import { AppointmentsModule } from '../appointments/appointments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ConfigModule, AppointmentsModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PrismaService,
    PaypalStrategy,
    StripeStrategy,
    ApplePayStrategy,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule { }