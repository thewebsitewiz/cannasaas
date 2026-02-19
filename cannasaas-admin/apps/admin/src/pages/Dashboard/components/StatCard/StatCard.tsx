/**
 * @file StatCard.tsx
 * @path apps/admin/src/pages/Dashboard/components/StatCard/StatCard.tsx
 *
 * KPI metric card for the dashboard overview row.
 * Displays a metric value, label, and a change percentage vs. the prior period.
 *
 * WCAG: The change percentage uses both a directional icon AND text color
 * (never color alone). The icon has aria-hidden and the text provides the
 * semantic meaning. Numbers use font-variant-numeric: tabular-nums for
 * consistent column alignment.
 *
 * ANIMATION: Value counts up from 0 on mount using requestAnimationFrame.
 * Respects prefers-reduced-motion — skips animation if motion is reduced.
 */

import React, { useEffect, useRef, useState } from 'react';
import styles from './StatCard.module.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StatCardProps {
  /** Card heading label */
  label: string;
  /** The primary numeric value to display */
  value: number;
  /** How to format the value: currency, number, or percentage */
  format: 'currency' | 'number' | 'percentage';
  /** Change percentage vs. prior period (positive = improvement) */
  changePct: number;
  /**
   * Whether a positive changePct is good (default true).
   * Set to false for metrics like "refund rate" where increase is bad.
   */
  positiveIsGood?: boolean;
  /** Icon element rendered in the card corner */
  icon?: React.ReactNode;
  /** Loading skeleton state */
  isLoading?: boolean;
  className?: string;
}

// ─── Format Helpers ───────────────────────────────────────────────────────────

function formatValue(value: number, format: StatCardProps['format']): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value / 100); // value is in cents
    case 'percentage':
      return `${value.toFixed(1)}%`;
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
}

// ─── Count-Up Hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 800): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setCurrent(target);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StatCard
 *
 * @example
 * <StatCard
 *   label="Total Revenue"
 *   value={1234500}
 *   format="currency"
 *   changePct={8.3}
 *   icon={<RevenueIcon />}
 * />
 */
export function StatCard({
  label,
  value,
  format,
  changePct,
  positiveIsGood = true,
  icon,
  isLoading = false,
  className,
}: StatCardProps) {
  const animatedValue = useCountUp(isLoading ? 0 : value);
  const isPositive = changePct >= 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  const absChange = Math.abs(changePct);

  if (isLoading) {
    return (
      <div className={`${styles.card} ${styles.cardLoading} ${className ?? ''}`} aria-hidden="true">
        <div className={styles.skeleton} style={{ width: '60%', height: 14 }} />
        <div className={styles.skeleton} style={{ width: '80%', height: 32 }} />
        <div className={styles.skeleton} style={{ width: '40%', height: 12 }} />
      </div>
    );
  }

  return (
    <article className={`${styles.card} ${className ?? ''}`} aria-label={`${label}: ${formatValue(value, format)}`}>
      {/* ── Icon corner ─────────────────────────────────────────── */}
      {icon && (
        <div className={styles.iconSlot} aria-hidden="true">
          {icon}
        </div>
      )}

      {/* ── Label ───────────────────────────────────────────────── */}
      <p className={styles.label}>{label}</p>

      {/* ── Value ───────────────────────────────────────────────── */}
      <p className={styles.value} aria-live="off">
        {formatValue(animatedValue, format)}
      </p>

      {/* ── Change percentage ────────────────────────────────────── */}
      <p
        className={`${styles.change} ${isGood ? styles.changeGood : styles.changeBad}`}
        aria-label={`${isPositive ? 'Up' : 'Down'} ${absChange}% compared to previous period`}
      >
        <span aria-hidden="true" className={styles.changeIcon}>
          {isPositive ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </span>
        {absChange.toFixed(1)}% vs last period
      </p>
    </article>
  );
}

