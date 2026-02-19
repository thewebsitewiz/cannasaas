/**
 * @file LowStockAlerts.tsx
 * @path apps/admin/src/pages/Dashboard/components/LowStockAlerts/LowStockAlerts.tsx
 *
 * Dashboard widget listing product variants that have fallen below their
 * reorder threshold. Links to the product edit page for each item.
 *
 * WCAG: role="alert" is NOT used here — this is persistent info, not
 * a time-sensitive notification. role="status" with aria-live="polite"
 * announces when the list changes without interrupting the user.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { LowStockAlert } from '../../../../types/admin.types';
import styles from './LowStockAlerts.module.css';

export interface LowStockAlertsProps {
  alerts: LowStockAlert[];
  isLoading?: boolean;
  className?: string;
}

export function LowStockAlerts({ alerts, isLoading = false, className }: LowStockAlertsProps) {
  return (
    <section className={`${styles.section} ${className ?? ''}`} aria-labelledby="low-stock-title">
      <div className={styles.header}>
        <h2 id="low-stock-title" className={styles.title}>
          Low Stock Alerts
        </h2>
        {!isLoading && alerts.length > 0 && (
          <span className={styles.badge} aria-label={`${alerts.length} alerts`}>
            {alerts.length}
          </span>
        )}
      </div>

      <div role="status" aria-live="polite" aria-atomic="false">
        {isLoading ? (
          <ul className={styles.list} aria-label="Loading alerts">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className={styles.alertItem} aria-hidden="true">
                <span className={styles.skeleton} style={{ width: '65%' }} />
                <span className={styles.skeleton} style={{ width: '25%' }} />
              </li>
            ))}
          </ul>
        ) : alerts.length === 0 ? (
          <p className={styles.allGood}>
            <span aria-hidden="true">✓</span> All products are well-stocked.
          </p>
        ) : (
          <ul className={styles.list} aria-label="Low stock alerts">
            {alerts.map((alert) => {
              const urgency = alert.currentStock === 0 ? 'out' : 'low';
              return (
                <li key={`${alert.productId}-${alert.variantId}`} className={styles.alertItem}>
                  <Link
                    to={`/admin/products/${alert.productId}/edit`}
                    className={styles.alertLink}
                    aria-label={`${alert.productName} ${alert.variantLabel}: ${alert.currentStock === 0 ? 'out of stock' : `${alert.currentStock} remaining, below reorder threshold of ${alert.reorderThreshold}`}`}
                  >
                    <div className={styles.alertInfo}>
                      <span className={styles.productName}>{alert.productName}</span>
                      <span className={styles.variantLabel}>{alert.variantLabel}</span>
                    </div>
                    <div className={styles.alertRight}>
                      <span
                        className={`${styles.stockCount} ${urgency === 'out' ? styles.stockOut : styles.stockLow}`}
                        aria-hidden="true"
                      >
                        {alert.currentStock === 0 ? 'OUT' : alert.currentStock}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link to="/admin/products?filter=low_stock" className={styles.viewAllLink}>
        Manage inventory →
      </Link>
    </section>
  );
}

