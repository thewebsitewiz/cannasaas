import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BadRequestException,
  RawBodyRequest,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { PaymentWebhooksController } from './payment-webhooks.controller';
import {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProcessor,
  ProcessorWebhookEvent,
  RefundInput,
  RefundResult,
  WebhookHeaders,
} from '../payments/processors/payment-processor.interface';
import { PaymentProcessorRegistry } from '../payments/processors/payment-processor.registry';

function buildReq(
  rawBody: string | Buffer | undefined,
  headers: Record<string, string> = {},
): RawBodyRequest<Request> {
  return {
    rawBody,
    headers,
  } as unknown as RawBodyRequest<Request>;
}

class StubProcessor implements PaymentProcessor {
  readonly name = 'aeropay' as const;
  // Side-channel capture for assertions
  lastBody: string | Buffer | null = null;
  lastHeaders: WebhookHeaders | null = null;
  verifyResult: ProcessorWebhookEvent | Error;

  constructor(result: ProcessorWebhookEvent | Error) {
    this.verifyResult = result;
  }

  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return Promise.resolve({
      processorTransactionId: `stub-${input.orderId}`,
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
      refundId: 'r',
      status: 'succeeded',
      refundedAmountCents: input.amountCents,
    });
  }
  verifyWebhookSignature(
    rawBody: string | Buffer,
    headers: WebhookHeaders,
  ): ProcessorWebhookEvent {
    this.lastBody = rawBody;
    this.lastHeaders = headers;
    if (this.verifyResult instanceof Error) throw this.verifyResult;
    return this.verifyResult;
  }
}

describe('PaymentWebhooksController', () => {
  let controller: PaymentWebhooksController;
  let registry: PaymentProcessorRegistry;
  let emit: jest.Mock;

  function buildController(processor: PaymentProcessor): void {
    registry = new PaymentProcessorRegistry([processor]);
    emit = jest.fn();
    controller = new PaymentWebhooksController(registry, {
      emit,
    } as unknown as EventEmitter2);
  }

  it('rejects unsupported processor names', () => {
    buildController(
      new StubProcessor({
        type: 'payment.succeeded',
        processorTransactionId: 'tx-1',
        raw: {},
      }),
    );
    expect(() =>
      controller.receive('stripe', buildReq(Buffer.from('{}')), {}),
    ).toThrow(BadRequestException);
  });

  it('rejects when the processor is not registered', () => {
    // Registry has only "aeropay" registered; requesting "canpay" 400s.
    buildController(
      new StubProcessor({
        type: 'payment.succeeded',
        processorTransactionId: 'tx-1',
        raw: {},
      }),
    );
    expect(() =>
      controller.receive('canpay', buildReq(Buffer.from('{}')), {}),
    ).toThrow(BadRequestException);
  });

  it('returns 401-equivalent on signature verification failure', () => {
    buildController(new StubProcessor(new Error('bad signature')));
    expect(() =>
      controller.receive(
        'aeropay',
        buildReq(Buffer.from('{}'), { 'x-aeropay-signature': 'nope' }),
        {},
      ),
    ).toThrow(UnauthorizedException);
  });

  it('passes the raw body and headers through to verifyWebhookSignature', () => {
    const stub = new StubProcessor({
      type: 'payment.succeeded',
      processorTransactionId: 'tx-42',
      raw: { id: 'tx-42' },
    });
    buildController(stub);
    const raw = Buffer.from('{"id":"tx-42"}');
    const headers = { 'x-aeropay-signature': 'sig' };
    controller.receive('aeropay', buildReq(raw, headers), { id: 'tx-42' });
    expect(stub.lastBody).toBe(raw);
    expect(stub.lastHeaders).toEqual(headers);
  });

  it('emits payment.webhook.<type> with the processor name and event', () => {
    const event: ProcessorWebhookEvent = {
      type: 'payment.succeeded',
      processorTransactionId: 'tx-77',
      amountCents: 2500,
      raw: { ok: true },
    };
    buildController(new StubProcessor(event));
    controller.receive(
      'aeropay',
      buildReq(Buffer.from('{}'), { 'x-aeropay-signature': 'sig' }),
      {},
    );
    expect(emit).toHaveBeenCalledWith('payment.webhook.payment.succeeded', {
      processor: 'aeropay',
      event,
    });
  });

  it('returns the ack payload describing the verified event', () => {
    const event: ProcessorWebhookEvent = {
      type: 'refund.succeeded',
      processorTransactionId: 'tx-99',
      raw: {},
    };
    buildController(new StubProcessor(event));
    const ack = controller.receive('aeropay', buildReq(Buffer.from('{}')), {});
    expect(ack).toEqual({
      ok: true,
      processor: 'aeropay',
      type: 'refund.succeeded',
      processorTransactionId: 'tx-99',
    });
  });

  it('falls back to JSON-stringifying the parsed body when rawBody is absent', () => {
    const stub = new StubProcessor({
      type: 'payment.pending',
      processorTransactionId: 'tx-fallback',
      raw: {},
    });
    buildController(stub);
    controller.receive('aeropay', buildReq(undefined), { hello: 'world' });
    expect(stub.lastBody).toEqual(
      Buffer.from(JSON.stringify({ hello: 'world' })),
    );
  });
});
