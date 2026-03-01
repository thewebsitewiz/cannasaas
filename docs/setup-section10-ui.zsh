#!/usr/bin/env zsh
# ================================================================
# CannaSaas — Section 10: Cannabis-Specific UI Components
#
# Writes shared package components for packages/ui into your monorepo.
# Safe to re-run — existing files are overwritten.
#
# Files written (2):
#   packages/ui/src/components/StrainTypeBadge/StrainTypeBadge.tsx
#   packages/ui/src/components/PurchaseLimitMeter/PurchaseLimitMeter.tsx
#
# Usage:
#   chmod +x setup-section10-ui.zsh
#   ./setup-section10-ui.zsh                   # ~/cannasaas-platform
#   ./setup-section10-ui.zsh /path/to/repo     # custom root
# ================================================================

set -euo pipefail

PLATFORM_ROOT="${1:-$HOME/cannasaas-platform}"

print -P "%F{green}▶  CannaSaas — Section 10: Cannabis-Specific UI Components%f"
print -P "%F{cyan}   Target root: ${PLATFORM_ROOT}%f"
echo ""

# ── 1. Directories ────────────────────────────────────────────────
mkdir -p "${PLATFORM_ROOT}/packages/ui/src/components/PurchaseLimitMeter"
mkdir -p "${PLATFORM_ROOT}/packages/ui/src/components/StrainTypeBadge"

print -P "%F{green}✓  Directories ready%f"
echo ""

# ── 2. Source files ───────────────────────────────────────────────

# [01/2] StrainTypeBadge/StrainTypeBadge.tsx
print -P "%F{cyan}  [01/2] StrainTypeBadge/StrainTypeBadge.tsx%f"
cat > "${PLATFORM_ROOT}/packages/ui/src/components/StrainTypeBadge/StrainTypeBadge.tsx" << 'FILE_EOF'
// packages/ui/src/components/StrainTypeBadge/StrainTypeBadge.tsx
import React from 'react';
import { cn } from '@cannasaas/utils';
import type { StrainType } from '@cannasaas/types';

const STRAIN_CONFIG: Record<
  StrainType,
  { label: string; bg: string; text: string }
> = {
  indica: { label: 'Indica', bg: '#7c3aed', text: '#ffffff' },
  sativa: { label: 'Sativa', bg: '#dc2626', text: '#ffffff' },
  hybrid: { label: 'Hybrid', bg: '#16a34a', text: '#ffffff' },
  indica_dominant_hybrid: { label: 'Indica-H', bg: '#6d28d9', text: '#ffffff' },
  sativa_dominant_hybrid: { label: 'Sativa-H', bg: '#b91c1c', text: '#ffffff' },
  cbd_dominant: { label: 'CBD', bg: '#0891b2', text: '#ffffff' },
};

interface StrainTypeBadgeProps {
  strainType: StrainType;
  size?: 'sm' | 'md';
  className?: string;
}

export function StrainTypeBadge({
  strainType,
  size = 'sm',
  className,
}: StrainTypeBadgeProps) {
  const config = STRAIN_CONFIG[strainType];

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold uppercase tracking-wider',
        'rounded-[var(--p-radius-sm)]',
        size === 'sm'
          ? 'px-2 py-0.5 text-[10px]'
          : 'px-3 py-1 text-[var(--p-text-xs)]',
        className,
      )}
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
      // WCAG 1.4.1: color is supplemented by text label
      aria-label={`Strain type: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
FILE_EOF

# [02/2] PurchaseLimitMeter/PurchaseLimitMeter.tsx
print -P "%F{cyan}  [02/2] PurchaseLimitMeter/PurchaseLimitMeter.tsx%f"
cat > "${PLATFORM_ROOT}/packages/ui/src/components/PurchaseLimitMeter/PurchaseLimitMeter.tsx" << 'FILE_EOF'
// packages/ui/src/components/PurchaseLimitMeter/PurchaseLimitMeter.tsx
import React from 'react';
import type { PurchaseLimitResult } from '@cannasaas/types';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { formatWeight } from '@cannasaas/utils';

interface PurchaseLimitMeterProps {
  limitCheck: PurchaseLimitResult;
}

/**
 * PurchaseLimitMeter — Shows remaining daily purchase capacity
 *
 * NY state limits: 3oz flower, 24g concentrate per 24 hours
 * NJ state limits: 1oz per transaction
 * CT state limits: 1.5oz per transaction
 *
 * WCAG:
 * - Uses role="meter" with aria-valuenow/min/max for progress bars
 * - Violations listed as alert for immediate screen reader announcement
 */
export function PurchaseLimitMeter({ limitCheck }: PurchaseLimitMeterProps) {
  const { allowed, violations, remaining, state } = limitCheck;

  const STATE_LIMITS: Record<string, { flower: number; concentrate: number }> =
    {
      NY: { flower: 3, concentrate: 24 },
      NJ: { flower: 1, concentrate: 28 },
      CT: { flower: 1.5, concentrate: 28 },
    };

  const limits = STATE_LIMITS[state] ?? STATE_LIMITS.NY;
  const flowerUsed = limits.flower - remaining.flowerOz;
  const concentrateUsed = limits.concentrate - remaining.concentrateG;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-5">
      <div className="flex items-center gap-2 mb-4">
        {allowed ? (
          <CheckCircle
            className="text-[var(--color-success)] w-5 h-5"
            aria-hidden="true"
          />
        ) : (
          <AlertTriangle
            className="text-[var(--color-error)] w-5 h-5"
            aria-hidden="true"
          />
        )}
        <h3 className="font-bold text-[var(--color-text)]">
          {state} Daily Purchase Limits
        </h3>
      </div>

      {/* Violations — shown as alert */}
      {violations.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-[var(--p-radius-md)] border border-[var(--color-error)]"
        >
          <ul className="text-[var(--p-text-sm)] text-[var(--color-error)] list-disc list-inside space-y-1">
            {violations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Flower meter */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[var(--p-text-sm)] mb-1.5">
            <span className="font-semibold text-[var(--color-text)]">
              Flower
            </span>
            <span className="text-[var(--color-text-secondary)]">
              {flowerUsed.toFixed(2)}oz / {limits.flower}oz used
            </span>
          </div>
          <div
            role="meter"
            aria-valuenow={flowerUsed}
            aria-valuemin={0}
            aria-valuemax={limits.flower}
            aria-label={`Flower purchased today: ${flowerUsed.toFixed(2)} of ${limits.flower} ounces`}
            className="h-3 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden"
          >
            <div
              className={[
                'h-full rounded-full transition-all duration-500',
                flowerUsed / limits.flower > 0.9
                  ? 'bg-[var(--color-error)]'
                  : flowerUsed / limits.flower > 0.7
                    ? 'bg-[var(--color-warning)]'
                    : 'bg-[var(--color-brand)]',
              ].join(' ')}
              style={{
                width: `${Math.min((flowerUsed / limits.flower) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] mt-1">
            {remaining.flowerOz.toFixed(2)}oz remaining today
          </p>
        </div>

        {/* Concentrate meter */}
        <div>
          <div className="flex justify-between text-[var(--p-text-sm)] mb-1.5">
            <span className="font-semibold text-[var(--color-text)]">
              Concentrate
            </span>
            <span className="text-[var(--color-text-secondary)]">
              {concentrateUsed.toFixed(1)}g / {limits.concentrate}g used
            </span>
          </div>
          <div
            role="meter"
            aria-valuenow={concentrateUsed}
            aria-valuemin={0}
            aria-valuemax={limits.concentrate}
            aria-label={`Concentrate purchased today: ${concentrateUsed.toFixed(1)} of ${limits.concentrate} grams`}
            className="h-3 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden"
          >
            <div
              className={[
                'h-full rounded-full transition-all duration-500',
                concentrateUsed / limits.concentrate > 0.9
                  ? 'bg-[var(--color-error)]'
                  : 'bg-[var(--color-info)]',
              ].join(' ')}
              style={{
                width: `${Math.min((concentrateUsed / limits.concentrate) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
FILE_EOF

# ── 3. Summary ────────────────────────────────────────────────────
echo ""
print -P "%F{green}✓  Done — 2 files written to ${PLATFORM_ROOT}/packages/ui/src/components%f"
echo ""
print -P "%F{cyan}Directory tree:%f"
if command -v tree &>/dev/null; then
  tree "${PLATFORM_ROOT}/packages/ui/src/components"
else
  find "${PLATFORM_ROOT}/packages/ui/src/components" -type f | sort | \
    sed "s|${PLATFORM_ROOT}/||"
fi

