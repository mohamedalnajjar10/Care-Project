export interface PaymentStrategy {
    createPayment(amount: number, currency: string, metadata: any): Promise<any>;
    confirmPayment(paymentIntentId: string): Promise<any>;
    refundPayment(transactionId: string, amount: number): Promise<any>;
}
