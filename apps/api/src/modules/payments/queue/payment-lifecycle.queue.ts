export const PAYMENT_LIFECYCLE_QUEUE = 'payment-lifecycle';

export const PaymentLifecycleJobName = {
  HANDLE_WEBHOOK: 'handle-webhook',
} as const;

export type PaymentLifecycleJobName =
  (typeof PaymentLifecycleJobName)[keyof typeof PaymentLifecycleJobName];
