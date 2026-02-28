// packages/ui/src/components/FullPageLoader/FullPageLoader.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface FullPageLoaderProps {
  message?: string;
}

/**
 * FullPageLoader — Full-viewport loading state
 *
 * WCAG:
 * - 4.1.3  Status message announced via role="status" (live region)
 * - 1.4.3  Sufficient contrast on background
 */
export const FullPageLoader: React.FC<FullPageLoaderProps> = ({
  message = 'Loading...',
}) => (
  <div
    className={[
      'fixed inset-0 flex flex-col items-center justify-center gap-4',
      'bg-[var(--color-bg)] z-50',
    ].join(' ')}
    // WCAG 4.1.3: announce status to screen readers without moving focus
    role="status"
    aria-live="polite"
    aria-label={message}
  >
    <Loader2
      className="animate-spin text-[var(--color-brand)]"
      size={40}
      aria-hidden="true"
    />
    <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] font-medium">
      {message}
    </p>
  </div>
);
