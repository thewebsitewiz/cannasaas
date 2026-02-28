// packages/ui/src/components/ProductCard/EffectsChips.tsx
import React from 'react';
import { cn } from '@cannasaas/utils';

interface EffectsChipsProps {
  effects: string[];
  maxVisible?: number;
  className?: string;
}

export const EffectsChips: React.FC<EffectsChipsProps> = ({
  effects,
  maxVisible = 3,
  className,
}) => {
  const visible = effects.slice(0, maxVisible);

  if (visible.length === 0) return null;

  return (
    <div
      className={cn('flex flex-wrap gap-1', className)}
      aria-label={`Effects: ${visible.join(', ')}`}
    >
      {visible.map((effect) => (
        <span
          key={effect}
          className={[
            'inline-flex items-center px-2 py-0.5',
            'rounded-[var(--p-radius-full)]',
            'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
            'text-[0.625rem] font-medium capitalize',
            'border border-[var(--color-border)]',
          ].join(' ')}
          aria-hidden="true" // Parent div has the full aria-label
        >
          {effect}
        </span>
      ))}
    </div>
  );
};
