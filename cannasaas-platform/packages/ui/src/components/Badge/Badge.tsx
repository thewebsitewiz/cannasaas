// packages/ui/src/components/Badge/Badge.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@cannasaas/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-semibold leading-none',
    'rounded-[var(--p-radius-full)]',
    'border',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
          'border-[var(--color-border)]',
        ],
        brand: [
          'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]',
          'border-transparent',
        ],
        success: [
          'bg-[var(--color-success-bg,#dcfce7)] text-[var(--color-success-text,#14532d)]',
          'border-transparent',
        ],
        warning: [
          'bg-[var(--color-warning-bg,#fef9c3)] text-[var(--color-warning-text,#78350f)]',
          'border-transparent',
        ],
        destructive: [
          'bg-[var(--color-error-bg,#fee2e2)] text-[var(--color-error-text,#7f1d1d)]',
          'border-transparent',
        ],
        outline: [
          'bg-transparent text-[var(--color-text)]',
          'border-[var(--color-border-strong)]',
        ],
      },
      size: {
        sm: 'px-2   py-0.5 text-[0.625rem]', // 10px
        md: 'px-2.5 py-1   text-[var(--p-text-xs)]',
        lg: 'px-3   py-1.5 text-[var(--p-text-sm)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'md',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  ),
);

Badge.displayName = 'Badge';
