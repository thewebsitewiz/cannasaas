import { Injectable } from '@nestjs/common';
import {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProcessor,
  RefundInput,
  RefundResult,
} from './payment-processor.interface';

@Injectable()
export class NoopPaymentProcessor implements PaymentProcessor {
  readonly name = 'noop' as const;

  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return Promise.resolve({
      processorTransactionId: `noop-${input.orderId}`,
      status: 'pending',
    });
  }

  confirm(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
    return Promise.resolve({
      processorTransactionId: input.processorTransactionId,
      status: 'succeeded',
    });
  }

  refund(input: RefundInput): Promise<RefundResult> {
    return Promise.resolve({
      refundId: `noop-refund-${input.processorTransactionId}`,
      status: 'succeeded',
      refundedAmountCents: input.amountCents,
    });
  }

  verifyWebhookSignature(): never {
    throw new Error('NoopPaymentProcessor does not handle webhooks');
  }
}
