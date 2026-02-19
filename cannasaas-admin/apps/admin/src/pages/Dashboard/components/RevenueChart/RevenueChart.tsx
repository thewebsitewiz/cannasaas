/**
 * @file RevenueChart.tsx
 * @path apps/admin/src/pages/Dashboard/components/RevenueChart/RevenueChart.tsx
 *
 * Recharts area chart displaying revenue over a selectable date range.
 *
 * WCAG:
 *   • Chart is wrapped in role="img" aria-labelledby pointing to a descriptive
 *     title and a visually-hidden data table fallback for screen readers.
 *   • Date range buttons are a proper <fieldset> / <legend> group with
 *     aria-pressed state on the active button.
 *   • Custom Tooltip has sufficient color contrast and shows both revenue
 *     and order count so data is not conveyed by color alone.
 *
 * PATTERN: Chart data fetched via a controlled dateRange state that triggers
 * a new API call on change. The loading state shows a skeleton placeholder
 * at the same dimensions as the chart to prevent layout shift.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import type { RevenueDataPoint, DateRangePreset } from '../../../../types/admin.types';
import styles from './RevenueChart.module.css';

// ─── Date Range Options ───────────────────────────────────────────────────────

const RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: '7d',  label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y',  label: '1 year' },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p) => p.dataKey === 'revenueCents');
  const orders = payload.find((p) => p.dataKey === 'orderCount');

  return (
    <div className={styles.tooltip} role="tooltip">
      <p className={styles.tooltipDate}>{label}</p>
      <p className={styles.tooltipRevenue}>
        ${((revenue?.value ?? 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}
      </p>
      <p className={styles.tooltipOrders}>{orders?.value ?? 0} orders</p>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RevenueChartProps {
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RevenueChart({ className }: RevenueChartProps) {
  const [range, setRange] = useState<DateRangePreset>('30d');
  const [data, setData] = useState<RevenueDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (selectedRange: DateRangePreset) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/revenue?range=${selectedRange}`);
      if (res.ok) {
        const json: RevenueDataPoint[] = await res.json();
        setData(json);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(range); }, [range, fetchData]);

  const totalRevenue = data.reduce((sum, d) => sum + d.revenueCents, 0);
  const chartId = 'revenue-chart-title';

  return (
    <section className={`${styles.section} ${className ?? ''}`} aria-labelledby={chartId}>
      {/* ── Header Row ───────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h2 id={chartId} className={styles.title}>Revenue Over Time</h2>
          {!isLoading && (
            <p className={styles.totalLabel} aria-live="polite">
              Total: ${(totalRevenue / 100).toLocaleString('en-US')}
            </p>
          )}
        </div>

        {/* Date range selector */}
        <fieldset className={styles.rangeGroup}>
          <legend className={styles.srOnly}>Select date range</legend>
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
      </div>

      {/* ── Chart ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className={styles.skeleton} aria-hidden="true" aria-label="Loading chart" />
      ) : (
        <div
          role="img"
          aria-labelledby={chartId}
          className={styles.chartWrapper}
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ca-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--ca-text-muted)', fontFamily: 'var(--ca-font-body)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--ca-text-muted)', fontFamily: 'var(--ca-font-body)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 100 / 1000).toFixed(0)}k`}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenueCents"
                stroke="#2D6A4F"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#2D6A4F', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* ── Accessible Data Table Fallback ─────────────────────── */}
          <details className={styles.dataTableDetails}>
            <summary className={styles.dataTableSummary}>View data as table</summary>
            <div className={styles.dataTableWrapper}>
              <table className={styles.dataTable}>
                <caption className={styles.srOnly}>Revenue data for selected period</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Revenue</th>
                    <th scope="col">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>${(row.revenueCents / 100).toLocaleString()}</td>
                      <td>{row.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </section>
  );
}

