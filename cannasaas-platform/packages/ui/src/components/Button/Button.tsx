// packages/ui/src/components/Button/Button.tsx
import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@cannasaas/utils';
import { Loader2 } from 'lucide-react';

// CVA variant definition — all style decisions live here
const buttonVariants = cva(
  // Base styles applied to every variant
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold leading-none tracking-wide',
    'rounded-[var(--p-radius-md)]',
    'transition-all duration-[var(--p-dur-fast)] ease-[var(--p-ease)]',
    'focus-visible:outline-none focus-visible:ring-3',
    'focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none whitespace-nowrap',
    // WCAG 2.4.3 Focus Order — ensure tab order is visible
    '[&:focus-visible]:outline [&:focus-visible]:outline-3',
    '[&:focus-visible]:outline-offset-2',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]',
          'hover:bg-[var(--color-brand-hover)]',
          'active:scale-[0.98]',
          // Minimum 4.5:1 contrast ratio enforced via brand token system
        ],
        secondary: [
          'bg-[var(--color-bg-tertiary)] text-[var(--color-text)]',
          'border border-[var(--color-border-strong)]',
          'hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-border)]',
        ],
        outline: [
          'border-2 border-[var(--color-brand)] text-[var(--color-brand)]',
          'bg-transparent',
          'hover:bg-[var(--color-brand-subtle)]',
        ],
        ghost: [
          'bg-transparent text-[var(--color-text-secondary)]',
          'hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)]',
        ],
        destructive: [
          'bg-[var(--color-error)] text-white',
          'hover:opacity-90 active:opacity-100',
        ],
        link: [
          'bg-transparent text-[var(--color-brand)]',
          'underline-offset-4 hover:underline',
          'h-auto p-0',
        ],
      },
      size: {
        sm:    'h-8  px-3 text-[var(--p-text-sm)]',
        md:    'h-10 px-4 text-[var(--p-text-base)]',
        lg:    'h-12 px-6 text-[var(--p-text-lg)]',
        // WCAG 2.5.5 Target Size: minimum 44×44 px on touch devices
        touch: 'min-h-[44px] min-w-[44px] px-4 text-[var(--p-text-base)]',
        icon:  'h-10 w-10 p-0',
      },
      fullWidth: {
        true:  'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant:   'primary',
      size:      'md',
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?:   boolean;
  loadingText?: string; // Announced to screen readers during loading
  leftIcon?:    React.ReactNode;
  rightIcon?:   React.ReactNode;
}

/**
 * Button — Primary action component
 *
 * WCAG compliance:
 * - 2.1.1  Keyboard: focusable, activatable via Space/Enter
 * - 2.4.7  Focus Visible: high-contrast focus ring
 * - 4.1.2  Name, Role, Value: uses native <button> semantics
 * - 1.4.3  Contrast: brand token enforces 4.5:1 minimum
 * - 2.5.5  Target Size: `size="touch"` provides 44px minimum
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size,
      fullWidth,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={isDisabled}
        // WCAG 4.1.2: communicate loading state to assistive technology
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={16} aria-hidden="true" />
            {/* Screen reader hears the loading text, sighted users see the spinner */}
            <span aria-live="polite">{loadingText ?? children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span aria-hidden="true" className="flex-shrink-0">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span aria-hidden="true" className="flex-shrink-0">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
