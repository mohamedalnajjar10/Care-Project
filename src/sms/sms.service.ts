import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);

    async sendOtp(mobile: string, code: string): Promise<void> {
        this.logger.log(`Sending OTP to ${mobile}: ${code}`);
    }
}
