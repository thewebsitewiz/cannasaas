/**
 * ═══════════════════════════════════════════════════════════════════
 * SectionErrorBoundary
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/layout/SectionErrorBoundary.tsx
 *
 * Per-section error isolation. React only supports error boundaries as
 * class components (no hook equivalent as of React 18).
 *
 * Each homepage section is wrapped in its own boundary so a single
 * failed API call or rendering error doesn't crash the entire page.
 * The fallback defaults to `null` — the broken section silently
 * disappears, which is better UX than showing an error in the hero
 * position or between product carousels.
 *
 * Critical sections can pass a visible fallback to show a retry prompt
 * or degraded content.
 *
 * @example
 *   // Silent fallback (default) — section disappears on error
 *   <SectionErrorBoundary>
 *     <HeroBanner promotions={promotions} />
 *   </SectionErrorBoundary>
 *
 *   // Visible fallback — show a message
 *   <SectionErrorBoundary fallback={<p>Could not load products.</p>}>
 *     <FeaturedSection />
 *   </SectionErrorBoundary>
 *
 *   // Error reporting — send to Sentry
 *   <SectionErrorBoundary onError={(err) => Sentry.captureException(err)}>
 *     <TrendingSection />
 *   </SectionErrorBoundary>
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface SectionErrorBoundaryProps {
  /** UI rendered when this section errors. Defaults to nothing. */
  fallback?: ReactNode;
  /** Error reporter callback, e.g. Sentry.captureException */
  onError?: (error: Error, info: ErrorInfo) => void;
  children: ReactNode;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
