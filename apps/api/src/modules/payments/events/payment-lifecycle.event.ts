import {
  PaymentProcessorName,
  ProcessorWebhookEventType,
} from '../processors/payment-processor.interface';

export const PAYMENT_LIFECYCLE_EVENT = 'payment.lifecycle';

export interface PaymentLifecycleEvent {
  readonly type: ProcessorWebhookEventType;
  readonly paymentId: string;
  readonly orderId: string;
  readonly dispensaryId: string;
  readonly processor: PaymentProcessorName;
  readonly processorTransactionId: string;
  readonly amountCents?: number;
  readonly failureReason?: string;
}
