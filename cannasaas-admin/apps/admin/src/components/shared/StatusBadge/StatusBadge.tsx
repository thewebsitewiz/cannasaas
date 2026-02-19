/**
 * @file StatusBadge.tsx
 * @path apps/admin/src/components/shared/StatusBadge/StatusBadge.tsx
 *
 * Accessible status badge component used across Orders, Products, and Customers.
 *
 * WCAG NOTE: Status is conveyed through BOTH color AND a text label.
 * Never color alone (§1.4.1). The `aria-label` prop allows callers to provide
 * a more descriptive label for screen readers when the visible text is abbreviated.
 */

import React from 'react';
import type { OrderStatus, ProductStatus, VerificationStatus } from '../../../types/admin.types';
import styles from './StatusBadge.module.css';

// ─── Variant Maps ─────────────────────────────────────────────────────────────

type BadgeVariant = 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange';

const ORDER_STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  pending:           'yellow',
  confirmed:         'blue',
  processing:        'blue',
  ready_for_pickup:  'purple',
  out_for_delivery:  'orange',
  delivered:         'green',
  cancelled:         'red',
  refunded:          'gray',
};

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending:           'Pending',
  confirmed:         'Confirmed',
  processing:        'Processing',
  ready_for_pickup:  'Ready',
  out_for_delivery:  'Out for Delivery',
  delivered:         'Delivered',
  cancelled:         'Cancelled',
  refunded:          'Refunded',
};

const PRODUCT_STATUS_VARIANT: Record<ProductStatus, BadgeVariant> = {
  active:   'green',
  inactive: 'gray',
  draft:    'yellow',
  archived: 'red',
};

const VERIFICATION_STATUS_VARIANT: Record<VerificationStatus, BadgeVariant> = {
  verified:   'green',
  pending:    'yellow',
  unverified: 'gray',
  rejected:   'red',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type StatusBadgeType = 'order' | 'product' | 'verification' | 'custom';

export interface StatusBadgeProps {
  type: StatusBadgeType;
  value: string;
  /** Override the displayed label */
  label?: string;
  /** Override the color variant */
  variant?: BadgeVariant;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StatusBadge
 *
 * Renders a colored pill indicating the status of an entity.
 * Color is always paired with a text label for WCAG 1.4.1 compliance.
 *
 * @example
 * <StatusBadge type="order" value="delivered" />
 * <StatusBadge type="product" value="draft" />
 */
export function StatusBadge({
  type,
  value,
  label,
  variant,
  ariaLabel,
  className,
}: StatusBadgeProps) {
  let resolvedVariant: BadgeVariant = variant ?? 'gray';
  let resolvedLabel: string = label ?? value;

  switch (type) {
    case 'order': {
      const status = value as OrderStatus;
      resolvedVariant = variant ?? ORDER_STATUS_VARIANT[status] ?? 'gray';
      resolvedLabel = label ?? ORDER_STATUS_LABEL[status] ?? value;
      break;
    }
    case 'product': {
      const status = value as ProductStatus;
      resolvedVariant = variant ?? PRODUCT_STATUS_VARIANT[status] ?? 'gray';
      resolvedLabel = label ?? (value.charAt(0).toUpperCase() + value.slice(1));
      break;
    }
    case 'verification': {
      const status = value as VerificationStatus;
      resolvedVariant = variant ?? VERIFICATION_STATUS_VARIANT[status] ?? 'gray';
      resolvedLabel = label ?? (value.charAt(0).toUpperCase() + value.slice(1));
      break;
    }
  }

  return (
    <span
      className={`${styles.badge} ${styles[`variant_${resolvedVariant}`]} ${className ?? ''}`}
      aria-label={ariaLabel}
    >
      <span className={styles.dot} aria-hidden="true" />
      {resolvedLabel}
    </span>
  );
}

