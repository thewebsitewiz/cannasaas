// packages/ui/src/components/Skeleton/Skeleton.tsx
import React from 'react';
import { cn } from '@cannasaas/utils';
interface SkeletonProps { className?: string; 'aria-hidden'?: boolean | 'true' | 'false'; }
/** Animated loading placeholder. WCAG: aria-hidden="true" by default. */
export function Skeleton({ className, 'aria-hidden': ariaHidden = true }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse bg-[var(--color-bg-tertiary)] rounded-[var(--p-radius-md)]', className)}
      aria-hidden={ariaHidden}
    />
  );
}
