/**
 * @file RecentOrdersList.tsx
 * @path apps/admin/src/pages/Dashboard/components/RecentOrdersList/RecentOrdersList.tsx
 *
 * Dashboard widget showing the most recent orders with status, customer name,
 * total, and fulfillment method. Each row links to the order detail page.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../../../components/shared/StatusBadge';
import type { RecentOrder } from '../../../../types/admin.types';
import styles from './RecentOrdersList.module.css';

export interface RecentOrdersListProps {
  orders: RecentOrder[];
  isLoading?: boolean;
  className?: string;
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function RecentOrdersList({ orders, isLoading = false, className }: RecentOrdersListProps) {
  return (
    <section className={`${styles.section} ${className ?? ''}`} aria-labelledby="recent-orders-title">
      <h2 id="recent-orders-title" className={styles.title}>Recent Orders</h2>

      {isLoading ? (
        <ul className={styles.list} aria-label="Loading recent orders" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className={styles.item} aria-hidden="true">
              <span className={styles.skeleton} style={{ width: '30%' }} />
              <span className={styles.skeleton} style={{ width: '40%' }} />
              <span className={styles.skeleton} style={{ width: '20%' }} />
            </li>
          ))}
        </ul>
      ) : orders.length === 0 ? (
        <p className={styles.empty} role="status">No orders yet today.</p>
      ) : (
        <ul className={styles.list} aria-label="Recent orders">
          {orders.map((order) => (
            <li key={order.id} className={styles.item}>
              <Link
                to={`/admin/orders/${order.id}`}
                className={styles.orderLink}
                aria-label={`Order ${order.orderNumber} for ${order.customerName}, ${order.status}`}
              >
                <div className={styles.orderMeta}>
                  <span className={styles.orderNumber}>#{order.orderNumber}</span>
                  <span className={styles.customerName}>{order.customerName}</span>
                </div>
                <div className={styles.orderRight}>
                  <StatusBadge type="order" value={order.status} />
                  <span className={styles.total}>
                    ${(order.totalCents / 100).toLocaleString()}
                  </span>
                  <span className={styles.time} aria-label={`Placed ${timeAgo(order.createdAt)}`}>
                    {timeAgo(order.createdAt)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link to="/admin/orders" className={styles.viewAllLink}>
        View all orders →
      </Link>
    </section>
  );
}

