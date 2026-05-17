/**
 * Wire types for the Aeropay REST API.
 *
 * Endpoints documented here are placeholders shaped to match a typical
 * pay-by-bank rail (POST transaction → redirect URL → webhook callback,
 * GET to poll, POST :id/refund). Verify against current Aeropay docs
 * before pointing at production; the strongly-typed seam here exists so
 * field renames are mechanical when that happens.
 */

export interface AeropayCreateTransactionRequest {
  readonly merchantId: string;
  readonly amount: number;
  readonly currency: 'USD';
  readonly externalOrderId: string;
  readonly customerEmail?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export type AeropayTransactionStatus =
  | 'pending'
  | 'requires_action'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AeropayTransaction {
  readonly id: string;
  readonly status: AeropayTransactionStatus;
  readonly redirectUrl?: string;
  readonly capturedAmount?: number;
  readonly failureReason?: string;
  readonly expiresAt?: string;
}

export interface AeropayRefundRequest {
  readonly amount: number;
  readonly reason?: string;
}

export type AeropayRefundStatus = 'pending' | 'succeeded' | 'failed';

export interface AeropayRefund {
  readonly id: string;
  readonly status: AeropayRefundStatus;
  readonly refundedAmount: number;
}
