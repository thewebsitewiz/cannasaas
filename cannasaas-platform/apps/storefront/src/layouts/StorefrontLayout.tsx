/**
 * @file StorefrontLayout.tsx
 * @app apps/storefront
 *
 * Shell layout for all storefront pages.
 *
 * Structure:
 *   <div> (min-h-screen flex column)
 *     <Header />           Sticky top navigation
 *     <a#skip-link />      Skip-to-main-content (WCAG 2.4.1)
 *     <main id="main-content">
 *       <Outlet />         React Router child route content
 *     </main>
 *     <Footer />           Site footer
 *
 * Accessibility:
 *   - Skip-to-content link is the first focusable element (WCAG 2.4.1)
 *     It's visually hidden until focused, then appears at top-left
 *   - <main> has id="main-content" as the skip link target
 *   - Landmark regions: <header>, <main>, <footer> (WCAG 1.3.1)
 *
 * Responsive:
 *   - No max-width on the layout — pages set their own content widths
 *   - Header uses position:sticky so it stays on screen while scrolling
 */

import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/*
       * Skip navigation link — visually hidden until focused.
       * Allows keyboard/screen reader users to bypass the nav and jump
       * directly to main content (WCAG Success Criterion 2.4.1).
       *
       * CSS: sr-only by default, appears at top-left on focus via
       * focus:not-sr-only + focus:fixed + focus:z-50
       */}
      <a
        href="#main-content"
        className={[
          'sr-only focus:not-sr-only',
          'focus:fixed focus:top-4 focus:left-4 focus:z-50',
          'focus:px-4 focus:py-2 focus:rounded-lg',
          'focus:bg-[hsl(var(--primary))] focus:text-white',
          'focus:font-semibold focus:text-sm',
          'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2',
        ].join(' ')}
      >
        Skip to main content
      </a>

      {/* Sticky site header with navigation */}
      <Header />

      {/*
       * Main content area.
       * id="main-content" is the skip link target (href="#main-content").
       * tabIndex={-1} allows the skip link to focus this element programmatically
       * without adding it to the natural tab order (WCAG 2.4.1).
       * outline-none removes the default focus ring (skip link handles visibility).
       */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 outline-none"
      >
        <Outlet />
      </main>

      {/* Site footer */}
      <Footer />
    </div>
  );
}
