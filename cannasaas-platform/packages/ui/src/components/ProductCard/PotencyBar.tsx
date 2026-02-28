// packages/ui/src/components/ProductCard/PotencyBar.tsx
// Renders a visual THC/CBD potency bar with accessible text fallback
import React from 'react';
import { cn } from '@cannasaas/utils';
import { formatThc } from '@cannasaas/utils';

interface PotencyBarProps {
  thc: number;  // 0–35+
  cbd: number;
  className?: string;
}

export const PotencyBar: React.FC<PotencyBarProps> = ({
  thc,
  cbd,
  className,
}) => {
  // Normalize percentage display against a 35% ceiling
  const thcPct = Math.min((thc / 35) * 100, 100);
  const cbdPct = Math.min((cbd / 35) * 100, 100);

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* THC bar */}
      <div className="flex items-center gap-2">
        <span
          className="text-[var(--p-text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] w-8 flex-shrink-0"
          aria-hidden="true"
        >
          THC
        </span>
        <div
          className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden"
          role="meter"
          aria-valuenow={thc}
          aria-valuemin={0}
          aria-valuemax={35}
          aria-label={`THC content: ${formatThc(thc)}`}
        >
          <div
            className="h-full rounded-full bg-[var(--color-brand)] transition-all duration-500"
            style={{ width: `${thcPct}%` }}
          />
        </div>
        <span className="text-[var(--p-text-xs)] font-bold text-[var(--color-text)] w-12 text-right">
          {formatThc(thc)}
        </span>
      </div>

      {/* CBD bar — only shown when CBD > 0 */}
      {cbd > 0 && (
        <div className="flex items-center gap-2">
          <span
            className="text-[var(--p-text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] w-8 flex-shrink-0"
            aria-hidden="true"
          >
            CBD
          </span>
          <div
            className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden"
            role="meter"
            aria-valuenow={cbd}
            aria-valuemin={0}
            aria-valuemax={35}
            aria-label={`CBD content: ${formatThc(cbd)}`}
          >
            <div
              className="h-full rounded-full bg-[var(--color-info,#2563eb)] transition-all duration-500"
              style={{ width: `${cbdPct}%` }}
            />
          </div>
          <span className="text-[var(--p-text-xs)] font-bold text-[var(--color-text)] w-12 text-right">
            {formatThc(cbd)}
          </span>
        </div>
      )}
    </div>
  );
};
