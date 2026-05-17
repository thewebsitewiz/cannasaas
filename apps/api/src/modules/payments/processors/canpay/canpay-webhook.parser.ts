import { createHmac, timingSafeEqual } from 'crypto';
import {
  ProcessorWebhookEvent,
  ProcessorWebhookEventType,
  WebhookHeaders,
} from '../payment-processor.interface';

export const CANPAY_SIGNATURE_HEADER = 'x-canpay-signature';

interface CanPayWebhookBody {
  readonly id?: string;
  readonly type: string;
  readonly transactionId: string;
  readonly amount?: number;
  readonly failureReason?: string;
}

const EVENT_TYPE_MAP: Readonly<Record<string, ProcessorWebhookEventType>> = {
  'transaction.completed': 'payment.succeeded',
  'transaction.failed': 'payment.failed',
  'transaction.cancelled': 'payment.failed',
  'transaction.awaiting_customer': 'payment.pending',
  'transaction.pending': 'payment.pending',
  'refund.completed': 'refund.succeeded',
  'refund.succeeded': 'refund.succeeded',
  'refund.failed': 'refund.failed',
};

function extractHeader(
  headers: WebhookHeaders,
  name: string,
): string | undefined {
  const lower = name.toLowerCase();
  const key = Object.keys(headers).find((k) => k.toLowerCase() === lower);
  if (!key) return undefined;
  const value = headers[key];
  if (value === undefined) return undefined;
  if (typeof value === 'string') return value;
  const arr = value;
  return arr.length > 0 ? arr[0] : undefined;
}

function toBuffer(body: string | Buffer): Buffer {
  return typeof body === 'string' ? Buffer.from(body, 'utf8') : body;
}

function computeExpectedSignature(body: Buffer, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

function constantTimeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function parseBody(body: Buffer): CanPayWebhookBody {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body.toString('utf8'));
  } catch {
    throw new Error('CanPay webhook body is not valid JSON');
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('type' in parsed) ||
    !('transactionId' in parsed)
  ) {
    throw new Error('CanPay webhook body missing required fields');
  }
  const candidate = parsed as Record<string, unknown>;
  if (typeof candidate['type'] !== 'string') {
    throw new Error('CanPay webhook body has invalid `type`');
  }
  if (typeof candidate['transactionId'] !== 'string') {
    throw new Error('CanPay webhook body has invalid `transactionId`');
  }
  return {
    id: typeof candidate['id'] === 'string' ? candidate['id'] : undefined,
    type: candidate['type'],
    transactionId: candidate['transactionId'],
    amount:
      typeof candidate['amount'] === 'number' ? candidate['amount'] : undefined,
    failureReason:
      typeof candidate['failureReason'] === 'string'
        ? candidate['failureReason']
        : undefined,
  };
}

/**
 * Verifies the HMAC-SHA256 signature on a CanPay webhook and parses the
 * body into the shared ProcessorWebhookEvent shape.
 *
 * Signature format: `X-CanPay-Signature: <hex-encoded HMAC-SHA256 of
 * the raw request body using the merchant's webhook secret>`. CanPay's
 * production header may carry a timestamp/version prefix — verify
 * against current docs and adjust extraction if so.
 */
export function parseCanPayWebhook(
  rawBody: string | Buffer,
  headers: WebhookHeaders,
  secret: string,
): ProcessorWebhookEvent {
  const sigHeader = extractHeader(headers, CANPAY_SIGNATURE_HEADER);
  if (!sigHeader) {
    throw new Error('Missing X-CanPay-Signature header');
  }
  const body = toBuffer(rawBody);
  const expected = computeExpectedSignature(body, secret);
  if (!constantTimeEquals(expected, sigHeader)) {
    throw new Error('CanPay webhook signature mismatch');
  }

  const parsed = parseBody(body);
  const mappedType = EVENT_TYPE_MAP[parsed.type];
  if (!mappedType) {
    throw new Error(`Unrecognized CanPay event type "${parsed.type}"`);
  }

  return {
    type: mappedType,
    processorTransactionId: parsed.transactionId,
    amountCents: parsed.amount,
    failureReason: parsed.failureReason,
    raw: JSON.parse(body.toString('utf8')) as unknown,
  };
}
