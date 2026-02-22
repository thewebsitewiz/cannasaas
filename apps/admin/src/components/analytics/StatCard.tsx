/**
 * @file StatCard.tsx
 * @description KPI metric card for the analytics dashboard.
 *
 * Displays a metric value, percentage change vs. prior period,
 * and an optional sparkline. Used across:
 *   - Revenue, Orders, Customers, AOV cards on GET /analytics/dashboard
 *
 * Accessibility:
 *   - <article> with aria-label communicates the card's purpose as a
 *     standalone unit of content (WCAG 1.3.1)
 *   - Change direction conveyed via text + icon, not colour alone (WCAG 1.4.1)
 *   - aria-label on the change badge gives screen readers full context
 *
 * @pattern Compound component — StatCard + StatCard.Skeleton
 */

import React, { memo } from 'react';
import type { MetricWithChange } from '@cannasaas/types';

interface StatCardProps {
  /** Card heading, e.g. "Total Revenue" */
  label: string;
  metric: MetricWithChange;
  /** How to format the `value` for display */
  formatValue?: (value: number) => string;
  /** Emoji or lucide-react icon to display in the card header */
  icon?: React.ReactNode;
  /** Optional sparkline chart — rendered in the card body */
  children?: React.ReactNode;
}

const defaultFormat = (v: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

/**
 * StatCard — memoised since the analytics dashboard renders many of these
 * and they only re-render when the dashboard query refetches.
 */
export const StatCard = memo(function StatCard({
  label,
  metric,
  formatValue = defaultFormat,
  icon,
  children,
}: StatCardProps) {
  const isPositive = metric.change >= 0;
  const changeAbs = Math.abs(metric.change).toFixed(1);

  return (
    <article
      aria-label={`${label}: ${formatValue(metric.value)}, ${isPositive ? 'up' : 'down'} ${changeAbs}% ${metric.comparisonLabel ?? ''}`}
      className={[
        'bg-white rounded-2xl border border-gray-100 p-6',
        'hover:shadow-sm transition-shadow',
      ].join(' ')}
    >
      {/* Header row — icon + label */}
      <div className="flex items-start justify-between mb-4">
        <div>
          {icon && (
            <div
              aria-hidden="true"
              className="text-2xl mb-2"
            >
              {icon}
            </div>
          )}
          <p className="text-sm font-medium text-gray-500">{label}</p>
        </div>

        {/* Change badge */}
        <span
          aria-label={`${isPositive ? 'Increased' : 'Decreased'} by ${changeAbs}% ${metric.comparisonLabel ?? 'vs prior period'}`}
          className={[
            'inline-flex items-center gap-1 text-xs font-semibold',
            'px-2 py-1 rounded-full',
            isPositive
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700',
          ].join(' ')}
        >
          {/* Directional arrow — supplementary to text (WCAG 1.4.1) */}
          <span aria-hidden="true">{isPositive ? '↑' : '↓'}</span>
          {changeAbs}%
        </span>
      </div>

      {/* Metric value */}
      <p className="text-3xl font-bold text-gray-900 tabular-nums">
        {formatValue(metric.value)}
      </p>

      {metric.comparisonLabel && (
        <p className="text-xs text-gray-400 mt-1">{metric.comparisonLabel}</p>
      )}

      {/* Sparkline slot */}
      {children && <div className="mt-4">{children}</div>}
    </article>
  );
});

/** Loading skeleton — same dimensions as StatCard to prevent CLS */
StatCard.Skeleton = function StatCardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading metric"
      className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse"
    >
      <div className="w-8 h-8 bg-gray-100 rounded-lg mb-3" />
      <div className="w-24 h-4 bg-gray-100 rounded mb-4" />
      <div className="w-32 h-8 bg-gray-100 rounded mb-2" />
      <div className="w-20 h-3 bg-gray-100 rounded" />
    </div>
  );
};

StatCard.displayName = 'StatCard';
