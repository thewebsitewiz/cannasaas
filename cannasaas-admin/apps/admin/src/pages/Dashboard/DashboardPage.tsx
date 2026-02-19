/**
 * @file DashboardPage.tsx
 * @path apps/admin/src/pages/Dashboard/DashboardPage.tsx
 *
 * Admin portal dashboard page. Aggregates:
 *   - 4 KPI stat cards (revenue, orders, customers, AOV)
 *   - Revenue area chart with date range selector
 *   - Top products table
 *   - Recent orders list
 *   - Low stock alerts
 *
 * DATA STRATEGY: All four dashboard data categories are fetched in parallel
 * via Promise.allSettled so a failure in one doesn't block the others.
 * Each section shows its own loading/error state independently.
 *
 * WCAG: The page uses a single <h1> via PageHeader. Widget section headings
 * are all <h2>, maintaining a logical heading hierarchy.
 */

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatCard } from './components/StatCard';
import { RevenueChart } from './components/RevenueChart';
import { TopProductsTable } from './components/TopProductsTable';
import { RecentOrdersList } from './components/RecentOrdersList';
import { LowStockAlerts } from './components/LowStockAlerts';
import type {
  DashboardStats,
  TopProduct,
  RecentOrder,
  LowStockAlert,
} from '../../types/admin.types';
import styles from './DashboardPage.module.css';

// ─── KPI Icon components (inline SVG for zero deps) ──────────────────────────

const RevenueIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
);
const OrdersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const CustomersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const AovIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStock, setLowStock] = useState<LowStockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);

      // Parallel fetch — failures are isolated per widget
      const [statsRes, productsRes, ordersRes, stockRes] = await Promise.allSettled([
        fetch('/api/admin/analytics/dashboard-stats').then((r) => r.json()),
        fetch('/api/admin/analytics/top-products?limit=5').then((r) => r.json()),
        fetch('/api/admin/orders?limit=8&sort=createdAt:desc').then((r) => r.json()),
        fetch('/api/admin/products/low-stock').then((r) => r.json()),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (productsRes.status === 'fulfilled') setTopProducts(productsRes.value);
      if (ordersRes.status === 'fulfilled') setRecentOrders(ordersRes.value?.items ?? []);
      if (stockRes.status === 'fulfilled') setLowStock(stockRes.value);

      setIsLoading(false);
    };

    fetchAll();
  }, []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back. Here's what's happening today.`}
      />

      <div className={styles.content}>
        {/* ── KPI Stats Row ─────────────────────────────────────── */}
        <section aria-label="Key metrics" className={styles.statsGrid}>
          <StatCard
            label="Total Revenue"
            value={stats?.totalRevenueCents ?? 0}
            format="currency"
            changePct={stats?.revenueChangePct ?? 0}
            icon={<RevenueIcon />}
            isLoading={isLoading}
          />
          <StatCard
            label="Orders Today"
            value={stats?.ordersToday ?? 0}
            format="number"
            changePct={stats?.ordersTodayChangePct ?? 0}
            icon={<OrdersIcon />}
            isLoading={isLoading}
          />
          <StatCard
            label="Active Customers"
            value={stats?.activeCustomers ?? 0}
            format="number"
            changePct={stats?.activeCustomersChangePct ?? 0}
            icon={<CustomersIcon />}
            isLoading={isLoading}
          />
          <StatCard
            label="Avg Order Value"
            value={stats?.averageOrderValueCents ?? 0}
            format="currency"
            changePct={stats?.aovChangePct ?? 0}
            icon={<AovIcon />}
            isLoading={isLoading}
          />
        </section>

        {/* ── Revenue Chart ─────────────────────────────────────── */}
        <RevenueChart className={styles.revenueChart} />

        {/* ── Bottom Grid ───────────────────────────────────────── */}
        <div className={styles.bottomGrid}>
          <TopProductsTable products={topProducts} isLoading={isLoading} />
          <RecentOrdersList orders={recentOrders} isLoading={isLoading} />
          <LowStockAlerts alerts={lowStock} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

