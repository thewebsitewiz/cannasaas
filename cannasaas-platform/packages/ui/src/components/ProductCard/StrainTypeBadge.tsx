// packages/ui/src/components/ProductCard/StrainTypeBadge.tsx
import React from 'react';
import { cn } from '@cannasaas/utils';
import type { StrainType } from '@cannasaas/types';

// WCAG 1.4.1 — color is not the only visual means of conveying information.
// Each strain type uses both a distinct colour AND a text label.
const STRAIN_CONFIG: Record<
  StrainType,
  { label: string; className: string }
> = {
  indica: {
    label: 'Indica',
    className: 'bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-300',
  },
  sativa: {
    label: 'Sativa',
    className: 'bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-300',
  },
  hybrid: {
    label: 'Hybrid',
    className: 'bg-green-100 text-green-900 dark:bg-green-950/50 dark:text-green-300',
  },
  indica_dominant_hybrid: {
    label: 'Indica Dom.',
    className: 'bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-300',
  },
  sativa_dominant_hybrid: {
    label: 'Sativa Dom.',
    className: 'bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-300',
  },
  cbd_dominant: {
    label: 'CBD',
    className: 'bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-300',
  },
};

interface StrainTypeBadgeProps {
  strainType: StrainType;
  size?: 'sm' | 'md';
  className?: string;
}

export const StrainTypeBadge: React.FC<StrainTypeBadgeProps> = ({
  strainType,
  size = 'md',
  className,
}) => {
  const config = STRAIN_CONFIG[strainType];

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-[var(--p-radius-full)]',
        size === 'sm' ? 'px-2 py-0.5 text-[0.625rem]' : 'px-2.5 py-1 text-[var(--p-text-xs)]',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
};
