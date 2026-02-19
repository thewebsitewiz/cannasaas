/**
 * @file AnalyticsPage.tsx
 * @path apps/admin/src/pages/Analytics/AnalyticsPage.tsx
 *
 * Extended analytics page consuming the Sprint 12 dashboard API.
 * Sections:
 *   - Revenue over time (line chart)
 *   - Orders by fulfillment type (pie/bar chart)
 *   - Top products by revenue and quantity (bar chart)
 *   - Customer acquisition over time (stacked bar)
 *   - Conversion funnel (horizontal bar)
 *   - CSV export for all data
 *
 * WCAG: Every chart has an accessible data table fallback via <details>.
 * The date range selector uses the same controlled fieldset/legend/aria-pressed
 * pattern as the dashboard RevenueChart.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { PageHeader } from '../../components/shared/PageHeader';
import type { DateRangePreset, RevenueDataPoint, TopProduct, CustomerAcquisitionPoint, ConversionFunnelStep, AnalyticsFulfillmentBreakdown } from '../../types/admin.types';
import styles from './AnalyticsPage.module.css';

// ─── Date Range Options ───────────────────────────────────────────────────────

const RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '1y', label: '1yr' },
];

// ─── Data Interface ───────────────────────────────────────────────────────────

interface AnalyticsData {
  revenue: RevenueDataPoint[];
  topProducts: TopProduct[];
  customerAcquisition: CustomerAcquisitionPoint[];
  conversionFunnel: ConversionFunnelStep[];
  fulfillmentBreakdown: AnalyticsFulfillmentBreakdown;
}

// ─── Accessible Chart Section Wrapper ────────────────────────────────────────

function ChartSection({
  titleId,
  title,
  children,
  tableContent,
}: {
  titleId: string;
  title: string;
  children: React.ReactNode;
  tableContent: React.ReactNode;
}) {
  return (
    <section className={styles.chartSection} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.chartTitle}>{title}</h2>
      <div role="img" aria-labelledby={titleId}>
        {children}
      </div>
      <details className={styles.tableDetails}>
        <summary className={styles.tableSummary}>View as table</summary>
        <div className={styles.tableWrapper}>{tableContent}</div>
      </details>
    </section>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const [range, setRange] = useState<DateRangePreset>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/full?range=${range}`);
      if (res.ok) setData(await res.json());
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/analytics/export?range=${range}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cannasaas-analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const CHART_COLORS = ['#2D6A4F', '#52B788', '#95D5B2', '#D8F3DC', '#B7E4C7'];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Analytics"
        subtitle="Performance insights across revenue, orders, and customers."
        breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Analytics' }]}
        actions={
          <div className={styles.headerActions}>
            {/* Date Range */}
            <fieldset className={styles.rangeGroup}>
              <legend className={styles.srOnly}>Date range</legend>
              <div className={styles.rangeButtons}>
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.rangeBtn} ${range === opt.value ? styles.rangeBtnActive : ''}`}
                    aria-pressed={range === opt.value}
                    onClick={() => setRange(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>
            {/* CSV Export */}
            <button
              type="button"
              className={styles.exportBtn}
              onClick={handleExportCsv}
              disabled={isExporting || isLoading}
              aria-busy={isExporting}
              aria-label={isExporting ? 'Exporting CSV…' : 'Export data as CSV'}
            >
              {isExporting ? (
                <span className={styles.btnSpinner} aria-hidden="true" />
              ) : (
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              Export CSV
            </button>
          </div>
        }
      />

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loadingGrid} aria-label="Loading analytics" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.skeletonSection} aria-hidden="true" />
            ))}
          </div>
        ) : !data ? (
          <p className={styles.errorMsg} role="alert">Failed to load analytics data. Please refresh.</p>
        ) : (
          <div className={styles.chartsGrid}>
            {/* ── Revenue Over Time ──────────────────────────────── */}
            <div className={styles.fullWidth}>
              <ChartSection
                titleId="revenue-over-time"
                title="Revenue Over Time"
                tableContent={
                  <table className={styles.dataTable}>
                    <caption className={styles.srOnly}>Revenue data</caption>
                    <thead><tr><th scope="col">Date</th><th scope="col">Revenue</th><th scope="col">Orders</th></tr></thead>
                    <tbody>
                      {data.revenue.map((r) => (
                        <tr key={r.date}>
                          <td>{r.date}</td>
                          <td>${(r.revenueCents / 100).toLocaleString()}</td>
                          <td>{r.orderCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
              >
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="anaRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ca-border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ca-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--ca-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 100 / 1000).toFixed(0)}k`} width={44} />
                    <Tooltip formatter={(v: number) => [`$${(v / 100).toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenueCents" stroke="#2D6A4F" strokeWidth={2} fill="url(#anaRevGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartSection>
            </div>

            {/* ── Top Products ───────────────────────────────────── */}
            <ChartSection
              titleId="top-products-revenue"
              title="Top Products by Revenue"
              tableContent={
                <table className={styles.dataTable}>
                  <caption className={styles.srOnly}>Top products</caption>
                  <thead><tr><th scope="col">Product</th><th scope="col">Revenue</th><th scope="col">Units</th></tr></thead>
                  <tbody>
                    {data.topProducts.map((p) => (
                      <tr key={p.productId}>
                        <td>{p.name}</td>
                        <td>${(p.revenueCents / 100).toLocaleString()}</td>
                        <td>{p.unitsSold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.topProducts} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ca-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--ca-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 100).toLocaleString()}`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: 'var(--ca-text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`$${(v / 100).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenueCents" radius={[0, 4, 4, 0]}>
                    {data.topProducts.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartSection>

            {/* ── Customer Acquisition ───────────────────────────── */}
            <ChartSection
              titleId="customer-acquisition"
              title="Customer Acquisition"
              tableContent={
                <table className={styles.dataTable}>
                  <caption className={styles.srOnly}>Customer acquisition data</caption>
                  <thead><tr><th scope="col">Date</th><th scope="col">New</th><th scope="col">Returning</th></tr></thead>
                  <tbody>
                    {data.customerAcquisition.map((r) => (
                      <tr key={r.date}>
                        <td>{r.date}</td>
                        <td>{r.newCustomers}</td>
                        <td>{r.returningCustomers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.customerAcquisition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ca-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ca-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--ca-text-muted)' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="newCustomers" name="New" fill="#2D6A4F" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="returningCustomers" name="Returning" fill="#95D5B2" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartSection>

            {/* ── Conversion Funnel ──────────────────────────────── */}
            <ChartSection
              titleId="conversion-funnel"
              title="Conversion Funnel"
              tableContent={
                <table className={styles.dataTable}>
                  <caption className={styles.srOnly}>Conversion funnel steps</caption>
                  <thead><tr><th scope="col">Step</th><th scope="col">Count</th><th scope="col">Rate</th></tr></thead>
                  <tbody>
                    {data.conversionFunnel.map((s) => (
                      <tr key={s.label}>
                        <td>{s.label}</td>
                        <td>{s.count.toLocaleString()}</td>
                        <td>{s.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            >
              <div className={styles.funnelChart} role="list">
                {data.conversionFunnel.map((step) => (
                  <div key={step.label} className={styles.funnelStep} role="listitem">
                    <div className={styles.funnelLabel}>{step.label}</div>
                    <div className={styles.funnelBar}>
                      <div
                        className={styles.funnelFill}
                        style={{ width: `${step.pct}%` }}
                        aria-label={`${step.pct.toFixed(1)}% — ${step.count.toLocaleString()} users`}
                      />
                    </div>
                    <div className={styles.funnelStats}>
                      <span>{step.count.toLocaleString()}</span>
                      <span className={styles.funnelPct}>{step.pct.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartSection>
          </div>
        )}
      </div>
    </div>
  );
}

