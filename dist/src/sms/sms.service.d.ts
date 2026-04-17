export declare class SmsService {
    private readonly logger;
    sendOtp(mobile: string, code: string): Promise<void>;
}
