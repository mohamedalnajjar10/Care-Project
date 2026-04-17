import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate payment for appointment' })
  initiatePayment(@Req() req: any, @Body() dto: CreatePaymentDto) {
    const userId = req.user.id || req.user.sub;
    return this.paymentsService.initiatePayment(userId, dto);
  }

  @Post('confirm/:paymentId')
  @ApiOperation({ summary: 'Confirm payment' })
  confirmPayment(
    @Param('paymentId') paymentId: string,
    @Body('paymentIntentId') paymentIntentId: string,
  ) {
    return this.paymentsService.confirmPayment(paymentId, paymentIntentId);
  }

  @Get('paypal/success')
  @ApiOperation({ summary: 'Handle PayPal success redirect' })
  async handlePaypalSuccess(
    @Query('token') token: string,
    @Query('paymentId') paymentId: string, 
  ) {
    const payment = await this.paymentsService.getPaymentById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }
    try {
      await this.paymentsService.confirmPayment(paymentId, token);

      return { success: true, message: 'Payment completed successfully' };
    } catch (error) {
      throw new BadRequestException('Payment confirmation failed');
    }
  }

  @Post('refund/:appointmentId')
  @ApiOperation({ summary: 'Refund payment' })
  refundPayment(@Param('appointmentId') appointmentId: string) {
    return this.paymentsService.refundPayment(appointmentId);
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get payment by appointment' })
  getPaymentByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.paymentsService.getPaymentByAppointment(appointmentId);
  }
}
