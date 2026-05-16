import { createHmac } from 'crypto';
import { WebhookHeaders } from '../payment-processor.interface';
import {
  AEROPAY_SIGNATURE_HEADER,
  parseAeropayWebhook,
} from './aeropay-webhook.parser';

const SECRET = 'test-secret';

function sign(body: string): string {
  return createHmac('sha256', SECRET).update(body).digest('hex');
}

function makeHeaders(sig: string | undefined): WebhookHeaders {
  if (sig === undefined) return {};
  return { [AEROPAY_SIGNATURE_HEADER]: sig };
}

describe('parseAeropayWebhook', () => {
  it('verifies a signed payload and maps transaction.completed → payment.succeeded', () => {
    const body = JSON.stringify({
      id: 'evt_1',
      type: 'transaction.completed',
      transactionId: 'tx_100',
      amount: 2500,
    });

    const event = parseAeropayWebhook(body, makeHeaders(sign(body)), SECRET);

    expect(event.type).toBe('payment.succeeded');
    expect(event.processorTransactionId).toBe('tx_100');
    expect(event.amountCents).toBe(2500);
  });

  it('accepts a Buffer raw body identically', () => {
    const body = JSON.stringify({
      type: 'transaction.pending',
      transactionId: 'tx_101',
    });
    const buf = Buffer.from(body);

    const event = parseAeropayWebhook(buf, makeHeaders(sign(body)), SECRET);

    expect(event.type).toBe('payment.pending');
  });

  it.each([
    ['transaction.completed', 'payment.succeeded'],
    ['transaction.failed', 'payment.failed'],
    ['transaction.cancelled', 'payment.failed'],
    ['transaction.pending', 'payment.pending'],
    ['refund.completed', 'refund.succeeded'],
    ['refund.succeeded', 'refund.succeeded'],
    ['refund.failed', 'refund.failed'],
  ])('maps Aeropay type %s → %s', (aeropayType, expected) => {
    const body = JSON.stringify({
      type: aeropayType,
      transactionId: 'tx_x',
    });
    const event = parseAeropayWebhook(body, makeHeaders(sign(body)), SECRET);
    expect(event.type).toBe(expected);
  });

  it('captures failureReason when present', () => {
    const body = JSON.stringify({
      type: 'transaction.failed',
      transactionId: 'tx_102',
      failureReason: 'insufficient_funds',
    });
    const event = parseAeropayWebhook(body, makeHeaders(sign(body)), SECRET);
    expect(event.failureReason).toBe('insufficient_funds');
  });

  it('rejects when the signature header is missing', () => {
    const body = JSON.stringify({
      type: 'transaction.completed',
      transactionId: 'tx_100',
    });
    expect(() =>
      parseAeropayWebhook(body, makeHeaders(undefined), SECRET),
    ).toThrow(/Missing X-Aeropay-Signature/);
  });

  it('rejects when the signature does not match (uses timing-safe comparison)', () => {
    const body = JSON.stringify({
      type: 'transaction.completed',
      transactionId: 'tx_100',
    });
    const badSig = sign(body + '-tampered');
    expect(() =>
      parseAeropayWebhook(body, makeHeaders(badSig), SECRET),
    ).toThrow(/signature mismatch/);
  });

  it('rejects unknown event types', () => {
    const body = JSON.stringify({
      type: 'mystery.event',
      transactionId: 'tx_100',
    });
    expect(() =>
      parseAeropayWebhook(body, makeHeaders(sign(body)), SECRET),
    ).toThrow(/Unrecognized Aeropay event type/);
  });

  it('rejects a body that is not valid JSON', () => {
    const body = 'definitely not json';
    expect(() =>
      parseAeropayWebhook(body, makeHeaders(sign(body)), SECRET),
    ).toThrow(/not valid JSON/);
  });

  it('rejects a body missing required fields', () => {
    const body = JSON.stringify({ id: 'evt_x' });
    expect(() =>
      parseAeropayWebhook(body, makeHeaders(sign(body)), SECRET),
    ).toThrow(/missing required fields/);
  });

  it('accepts the signature header under any casing', () => {
    const body = JSON.stringify({
      type: 'transaction.completed',
      transactionId: 'tx_100',
    });
    const event = parseAeropayWebhook(
      body,
      { 'X-Aeropay-Signature': sign(body) },
      SECRET,
    );
    expect(event.type).toBe('payment.succeeded');
  });
});
