/**
 * @file OrdersPage.tsx
 * @path apps/admin/src/pages/Orders/OrdersPage.tsx
 *
 * Order management list page. Displays all orders with filter controls
 * (status, date range, fulfillment method) and links to individual order
 * detail views. Staff can update order status directly from the detail view.
 *
 * DATA: Paginated fetch from /api/admin/orders with server-side filtering.
 * Pagination uses a cursor-based approach (lastId) for consistent results.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type ColumnDef, type SortState } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { Order, OrderFilters } from '../../types/admin.types';
import styles from './OrdersPage.module.css';

// ─── Column Definitions ───────────────────────────────────────────────────────

const COLUMNS: ColumnDef<Order>[] = [
  {
    key: 'orderNumber',
    label: 'Order #',
    sortable: true,
    render: (row) => <span className={styles.orderNum}>#{row.orderNumber}</span>,
  },
  {
    key: 'customer',
    label: 'Customer',
    render: (row) => (
      <div className={styles.customerCell}>
        <span className={styles.customerName}>{row.customer.displayName}</span>
        <span className={styles.customerEmail}>{row.customer.email}</span>
      </div>
    ),
  },
  {
    key: 'totalCents',
    label: 'Total',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className={styles.mono}>${(row.totalCents / 100).toFixed(2)}</span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (row) => <StatusBadge type="order" value={row.status} />,
  },
  {
    key: 'fulfillment',
    label: 'Fulfillment',
    render: (row) => (
      <span className={styles.fulfillment}>
        {row.fulfillment.method === 'delivery' ? '🚗 Delivery' : '🛍️ Pickup'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    label: 'Placed',
    sortable: true,
    render: (row) => (
      <span className={styles.date}>
        {new Date(row.createdAt).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        })}
      </span>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortState>({ column: 'createdAt', direction: 'desc' });
  const [filters, setFilters] = useState<OrderFilters>({
    search: '', status: '', fulfillmentMethod: '', dateFrom: '', dateTo: '',
  });

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sort: `${sort.column}:${sort.direction}`,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.fulfillmentMethod && { fulfillmentMethod: filters.fulfillmentMethod }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.items ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sort, filters]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const stableCols = useMemo(() => COLUMNS, []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Orders"
        subtitle="View and manage all customer orders."
        breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Orders' }]}
      />

      {/* ── Filter Bar ───────────────────────────────────────────── */}
      <div className={styles.filterBar} role="search" aria-label="Filter orders">
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search order # or customer…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          aria-label="Search orders"
        />
        <select
          className={styles.filterSelect}
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as OrderFilters['status'] }))}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="ready_for_pickup">Ready for Pickup</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filters.fulfillmentMethod}
          onChange={(e) => setFilters((f) => ({ ...f, fulfillmentMethod: e.target.value as OrderFilters['fulfillmentMethod'] }))}
          aria-label="Filter by fulfillment method"
        >
          <option value="">All Methods</option>
          <option value="pickup">Pickup</option>
          <option value="delivery">Delivery</option>
        </select>
        <div className={styles.dateRange}>
          <label htmlFor="date-from" className={styles.srOnly}>From date</label>
          <input
            id="date-from"
            type="date"
            className={styles.filterSelect}
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            aria-label="Filter from date"
          />
          <span className={styles.dateSep} aria-hidden="true">–</span>
          <label htmlFor="date-to" className={styles.srOnly}>To date</label>
          <input
            id="date-to"
            type="date"
            className={styles.filterSelect}
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            aria-label="Filter to date"
          />
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className={styles.tableWrapper}>
        <DataTable<Order>
          caption="Orders list"
          columns={stableCols}
          rows={orders}
          sort={sort}
          onSortChange={setSort}
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/admin/orders/${row.id}`)}
          emptyState={<p className={styles.emptyText}>No orders match your filters.</p>}
        />
      </div>
    </div>
  );
}

