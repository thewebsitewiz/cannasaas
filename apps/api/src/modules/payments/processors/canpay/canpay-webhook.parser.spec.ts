import { createHmac } from 'crypto';
import { WebhookHeaders } from '../payment-processor.interface';
import {
  CANPAY_SIGNATURE_HEADER,
  parseCanPayWebhook,
} from './canpay-webhook.parser';

const SECRET = 'test-secret';

function sign(body: string): string {
  return createHmac('sha256', SECRET).update(body).digest('hex');
}

function makeHeaders(sig: string | undefined): WebhookHeaders {
  if (sig === undefined) return {};
  return { [CANPAY_SIGNATURE_HEADER]: sig };
}

describe('parseCanPayWebhook', () => {
  it('verifies a signed payload and maps transaction.completed → payment.succeeded', () => {
    const body = JSON.stringify({
      id: 'evt_1',
      type: 'transaction.completed',
      transactionId: 'tx_100',
      amount: 2500,
    });

    const event = parseCanPayWebhook(body, makeHeaders(sign(body)), SECRET);

    expect(event.type).toBe('payment.succeeded');
    expect(event.processorTransactionId).toBe('tx_100');
    expect(event.amountCents).toBe(2500);
  });

  it('accepts a Buffer raw body identically', () => {
    const body = JSON.stringify({
      type: 'transaction.awaiting_customer',
      transactionId: 'tx_101',
    });
    const buf = Buffer.from(body);

    const event = parseCanPayWebhook(buf, makeHeaders(sign(body)), SECRET);

    expect(event.type).toBe('payment.pending');
  });

  it.each([
    ['transaction.completed', 'payment.succeeded'],
    ['transaction.failed', 'payment.failed'],
    ['transaction.cancelled', 'payment.failed'],
    ['transaction.awaiting_customer', 'payment.pending'],
    ['transaction.pending', 'payment.pending'],
    ['refund.completed', 'refund.succeeded'],
    ['refund.succeeded', 'refund.succeeded'],
    ['refund.failed', 'refund.failed'],
  ])('maps CanPay type %s → %s', (canpayType, expected) => {
    const body = JSON.stringify({
      type: canpayType,
      transactionId: 'tx_x',
    });
    const event = parseCanPayWebhook(body, makeHeaders(sign(body)), SECRET);
    expect(event.type).toBe(expected);
  });

  it('captures failureReason when present', () => {
    const body = JSON.stringify({
      type: 'transaction.failed',
      transactionId: 'tx_102',
      failureReason: 'customer_declined',
    });
    const event = parseCanPayWebhook(body, makeHeaders(sign(body)), SECRET);
    expect(event.failureReason).toBe('customer_declined');
  });

  it('rejects when the signature header is missing', () => {
    const body = JSON.stringify({
      type: 'transaction.completed',
      transactionId: 'tx_100',
    });
    expect(() =>
      parseCanPayWebhook(body, makeHeaders(undefined), SECRET),
    ).toThrow(/Missing X-CanPay-Signature/);
  });

  it('rejects a tampered signature', () => {
    const body = JSON.stringify({
      type: 'transaction.completed',
      transactionId: 'tx_100',
    });
    const badSig = sign(body + '-tampered');
    expect(() => parseCanPayWebhook(body, makeHeaders(badSig), SECRET)).toThrow(
      /signature mismatch/,
    );
  });

  it('rejects unknown event types', () => {
    const body = JSON.stringify({
      type: 'mystery.event',
      transactionId: 'tx_100',
    });
    expect(() =>
      parseCanPayWebhook(body, makeHeaders(sign(body)), SECRET),
    ).toThrow(/Unrecognized CanPay event type/);
  });

  it('rejects a body that is not valid JSON', () => {
    const body = 'definitely not json';
    expect(() =>
      parseCanPayWebhook(body, makeHeaders(sign(body)), SECRET),
    ).toThrow(/not valid JSON/);
  });

  it('rejects a body missing required fields', () => {
    const body = JSON.stringify({ id: 'evt_x' });
    expect(() =>
      parseCanPayWebhook(body, makeHeaders(sign(body)), SECRET),
    ).toThrow(/missing required fields/);
  });

  it('accepts the signature header under any casing', () => {
    const body = JSON.stringify({
      type: 'transaction.completed',
      transactionId: 'tx_100',
    });
    const event = parseCanPayWebhook(
      body,
      { 'X-CanPay-Signature': sign(body) },
      SECRET,
    );
    expect(event.type).toBe('payment.succeeded');
  });
});
