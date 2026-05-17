/**
 * Wire types for the CanPay REST API.
 *
 * Shapes are plausible placeholders for a QR-based pay-by-app rail
 * (merchant creates a transaction, customer scans QR in the CanPay
 * mobile app, app authorizes, CanPay webhooks back the status). Verify
 * against current CanPay docs before pointing at production — the
 * strongly-typed seam here makes field renames mechanical.
 */

export interface CanPayCreateTransactionRequest {
  readonly merchantId: string;
  readonly amount: number;
  readonly currency: 'USD';
  readonly externalOrderId: string;
  readonly customerEmail?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export type CanPayTransactionStatus =
  | 'pending'
  | 'awaiting_customer'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface CanPayTransaction {
  readonly id: string;
  readonly status: CanPayTransactionStatus;
  /** Opaque QR payload — render client-side to a scannable code. */
  readonly qrPayload?: string;
  readonly capturedAmount?: number;
  readonly failureReason?: string;
  readonly expiresAt?: string;
}

export interface CanPayRefundRequest {
  readonly amount: number;
  readonly reason?: string;
}

export type CanPayRefundStatus = 'pending' | 'succeeded' | 'failed';

export interface CanPayRefund {
  readonly id: string;
  readonly status: CanPayRefundStatus;
  readonly refundedAmount: number;
}
