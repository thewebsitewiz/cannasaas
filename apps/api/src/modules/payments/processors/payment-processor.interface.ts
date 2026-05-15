export type PaymentProcessorName = 'aeropay' | 'canpay' | 'noop';

export interface InitiatePaymentInput {
  readonly orderId: string;
  readonly dispensaryId: string;
  readonly amountCents: number;
  readonly currency: 'USD';
  readonly customerEmail?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface InitiatePaymentResult {
  readonly processorTransactionId: string;
  readonly status: 'pending' | 'requires_action';
  readonly redirectUrl?: string;
  readonly qrPayload?: string;
  readonly expiresAt?: Date;
}

export interface ConfirmPaymentInput {
  readonly processorTransactionId: string;
  readonly dispensaryId: string;
}

export type PaymentTerminalStatus = 'succeeded' | 'failed' | 'pending';

export interface ConfirmPaymentResult {
  readonly processorTransactionId: string;
  readonly status: PaymentTerminalStatus;
  readonly capturedAmountCents?: number;
  readonly failureReason?: string;
}

export interface RefundInput {
  readonly processorTransactionId: string;
  readonly dispensaryId: string;
  readonly amountCents: number;
  readonly reason?: string;
}

export interface RefundResult {
  readonly refundId: string;
  readonly status: PaymentTerminalStatus;
  readonly refundedAmountCents: number;
}

export type WebhookHeaderValue = string | readonly string[] | undefined;
export type WebhookHeaders = Readonly<Record<string, WebhookHeaderValue>>;

export type ProcessorWebhookEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.pending'
  | 'refund.succeeded'
  | 'refund.failed';

export interface ProcessorWebhookEvent {
  readonly type: ProcessorWebhookEventType;
  readonly processorTransactionId: string;
  readonly amountCents?: number;
  readonly raw: unknown;
}

export interface PaymentProcessor {
  readonly name: PaymentProcessorName;
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  confirm(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  verifyWebhookSignature(
    rawBody: string | Buffer,
    headers: WebhookHeaders,
  ): ProcessorWebhookEvent;
}

export const PAYMENT_PROCESSOR = Symbol('PAYMENT_PROCESSOR');
