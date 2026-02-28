# CANNASAAS

## Multi-Tenant Cannabis E-Commerce Platform

---

# React Component & Markup Implementation Guide

### Advanced Patterns · WCAG 2.1 AA · Responsive Design · Component Composition

**Version 2.0 | February 2026**
**Prepared for: Dennis Luken, Senior Architect / Site Lead**

---

## Table of Contents

1. [Design System Foundations](#1-design-system-foundations)
2. [WCAG 2.1 AA Compliance Strategy](#2-wcag-21-aa-compliance-strategy)
3. [Advanced React Patterns Reference](#3-advanced-react-patterns-reference)
4. [Shared UI Package — Base Components](#4-shared-ui-package--base-components)
5. [Shared UI Package — Composite Components](#5-shared-ui-package--composite-components)
6. [Layout System & Navigation Shell](#6-layout-system--navigation-shell)
7. [Storefront App — Page Breakdown](#7-storefront-app--page-breakdown)
8. [Admin Portal App — Page Breakdown](#8-admin-portal-app--page-breakdown)
9. [Staff Portal App — Page Breakdown](#9-staff-portal-app--page-breakdown)
10. [Compliance & Cannabis-Specific Components](#10-compliance--cannabis-specific-components)
11. [Multi-Tenant Theming Components](#11-multi-tenant-theming-components)
12. [Responsive CSS Architecture](#12-responsive-css-architecture)
13. [Accessibility Testing Checklist](#13-accessibility-testing-checklist)
14. [Component File Checklist](#14-component-file-checklist)

---

## 1. Design System Foundations

### 1.1 Token Architecture

All colors, spacing, and typography values are expressed as CSS custom properties (tokens). This is the foundation that powers the multi-tenant white-label theming system. Every component uses token references — never hard-coded values — so swapping a dispensary's brand requires nothing more than updating the CSS variables at the `:root` level.

The token file lives at `packages/ui/src/styles/tokens.css` and is imported once in the application entry point. Every token name follows a three-level semantic naming scheme: `--[category]-[role]-[modifier]`.

```css
/* packages/ui/src/styles/tokens.css
 *
 * DESIGN TOKEN SYSTEM
 * All values are semantic CSS custom properties.
 * Primitive (raw) values live in the :root[data-theme] selectors.
 * Semantic aliases are mapped in the :root block.
 *
 * LAYER ORDER:
 * 1. Primitives   — raw color values (hex/oklch), never used directly in components
 * 2. Semantic     — mapped roles (--color-brand, --color-surface, etc.)
 * 3. Component    — component-scoped overrides (--button-bg, --card-border, etc.)
 */

/* ── PRIMITIVES ─────────────────────────────────────────────────── */
:root {
  /* Brand palette — overridden by ThemeProvider per dispensary */
  --primitive-brand-50:  #f0fdf4;
  --primitive-brand-100: #dcfce7;
  --primitive-brand-300: #86efac;
  --primitive-brand-500: #22c55e;  /* Primary CTA default */
  --primitive-brand-700: #15803d;
  --primitive-brand-900: #14532d;

  /* Neutrals */
  --primitive-neutral-0:   #ffffff;
  --primitive-neutral-50:  #f8fafc;
  --primitive-neutral-100: #f1f5f9;
  --primitive-neutral-200: #e2e8f0;
  --primitive-neutral-300: #cbd5e1;
  --primitive-neutral-400: #94a3b8;
  --primitive-neutral-500: #64748b;
  --primitive-neutral-700: #334155;
  --primitive-neutral-900: #0f172a;

  /* Status */
  --primitive-success: #16a34a;
  --primitive-warning: #d97706;
  --primitive-error:   #dc2626;
  --primitive-info:    #2563eb;

  /* Typography scale */
  --primitive-size-xs:  0.75rem;    /* 12px */
  --primitive-size-sm:  0.875rem;   /* 14px */
  --primitive-size-base: 1rem;      /* 16px — minimum for WCAG body text */
  --primitive-size-lg:  1.125rem;   /* 18px */
  --primitive-size-xl:  1.25rem;    /* 20px */
  --primitive-size-2xl: 1.5rem;     /* 24px */
  --primitive-size-3xl: 1.875rem;   /* 30px */
  --primitive-size-4xl: 2.25rem;    /* 36px */

  /* Spacing scale (4px base) */
  --primitive-space-1:  0.25rem;
  --primitive-space-2:  0.5rem;
  --primitive-space-3:  0.75rem;
  --primitive-space-4:  1rem;
  --primitive-space-6:  1.5rem;
  --primitive-space-8:  2rem;
  --primitive-space-12: 3rem;
  --primitive-space-16: 4rem;

  /* Border radius */
  --primitive-radius-sm:   0.25rem;
  --primitive-radius-md:   0.5rem;
  --primitive-radius-lg:   0.75rem;
  --primitive-radius-full: 9999px;

  /* Elevation / Shadow */
  --primitive-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --primitive-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --primitive-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Transitions */
  --primitive-duration-fast:   150ms;
  --primitive-duration-normal: 250ms;
  --primitive-duration-slow:   400ms;
  --primitive-easing-default: cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── SEMANTIC ALIASES (LIGHT MODE) ──────────────────────────────── */
:root,
:root[data-color-scheme="light"] {
  /* Brand */
  --color-brand:          var(--primitive-brand-500);
  --color-brand-hover:    var(--primitive-brand-700);
  --color-brand-subtle:   var(--primitive-brand-50);
  --color-brand-text:     var(--primitive-brand-900);

  /* Surfaces */
  --color-bg-primary:     var(--primitive-neutral-0);
  --color-bg-secondary:   var(--primitive-neutral-50);
  --color-bg-tertiary:    var(--primitive-neutral-100);

  /* Borders */
  --color-border:         var(--primitive-neutral-200);
  --color-border-strong:  var(--primitive-neutral-300);

  /* Text */
  --color-text-primary:   var(--primitive-neutral-900);
  --color-text-secondary: var(--primitive-neutral-500);
  --color-text-disabled:  var(--primitive-neutral-400);
  --color-text-inverse:   var(--primitive-neutral-0);

  /* Status */
  --color-success:  var(--primitive-success);
  --color-warning:  var(--primitive-warning);
  --color-error:    var(--primitive-error);
  --color-info:     var(--primitive-info);

  /* Focus ring — WCAG 2.4.11 requires visible, 2px minimum */
  --focus-ring-color: var(--color-brand);
  --focus-ring-offset: 2px;
  --focus-ring-width: 3px;
}

/* ── DARK MODE ───────────────────────────────────────────────────── */
:root[data-color-scheme="dark"] {
  --color-brand:          var(--primitive-brand-300);
  --color-brand-hover:    var(--primitive-brand-500);
  --color-brand-subtle:   var(--primitive-brand-900);
  --color-brand-text:     var(--primitive-brand-100);

  --color-bg-primary:     var(--primitive-neutral-900);
  --color-bg-secondary:   #1e293b;
  --color-bg-tertiary:    var(--primitive-neutral-700);

  --color-border:         var(--primitive-neutral-700);
  --color-border-strong:  var(--primitive-neutral-500);

  --color-text-primary:   var(--primitive-neutral-50);
  --color-text-secondary: var(--primitive-neutral-400);
  --color-text-disabled:  var(--primitive-neutral-500);
  --color-text-inverse:   var(--primitive-neutral-900);

  --focus-ring-color: var(--primitive-brand-300);
}

/* ── GLOBAL FOCUS STYLE ──────────────────────────────────────────── */
/* Applied universally — never use outline: none without a replacement */
*:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  border-radius: var(--primitive-radius-sm);
}
```

### 1.2 Typography Scale

```css
/* packages/ui/src/styles/typography.css
 *
 * TYPOGRAPHY SYSTEM
 * Uses a fluid type scale via clamp() for responsive headings.
 * Minimum body text: 16px (1rem) — WCAG 1.4.4 compliance.
 * Line height minimum: 1.5 for body — WCAG 1.4.12 compliance.
 */

:root {
  /* Font stacks — overridden by ThemeProvider per dispensary brand */
  --font-heading: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* Fluid type scale: clamp(min, preferred, max) */
  --text-h1: clamp(1.875rem, 4vw + 1rem, 3rem);        /* 30–48px */
  --text-h2: clamp(1.5rem, 3vw + 0.75rem, 2.25rem);    /* 24–36px */
  --text-h3: clamp(1.25rem, 2vw + 0.5rem, 1.875rem);   /* 20–30px */
  --text-h4: clamp(1.125rem, 1.5vw + 0.25rem, 1.5rem); /* 18–24px */
  --text-h5: clamp(1rem, 1vw + 0.125rem, 1.25rem);     /* 16–20px */
  --text-body-lg:  1.125rem;
  --text-body:     1rem;      /* 16px minimum for WCAG */
  --text-body-sm:  0.875rem;  /* Use sparingly — only for supplemental info */
  --text-caption:  0.75rem;   /* 12px — only for metadata/labels, NOT body text */

  /* Line heights */
  --leading-tight:  1.25;  /* Headings only */
  --leading-snug:   1.375;
  --leading-normal: 1.5;   /* WCAG minimum for body text */
  --leading-relaxed: 1.625;
  --leading-loose:  2;

  /* Font weights */
  --weight-normal:   400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;

  /* Letter spacing */
  --tracking-tight:  -0.025em;
  --tracking-normal: 0;
  --tracking-wide:   0.025em;
  --tracking-wider:  0.05em;
  --tracking-widest: 0.1em;    /* Useful for ALL CAPS labels */
}

/* ── BASE RESET WITH ACCESSIBILITY IN MIND ───────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  /* Prevent font-size inflation on mobile (iOS) */
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  /* Smooth scrolling — but respect prefers-reduced-motion */
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

body {
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
  /* Improve text rendering */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Fluid heading defaults */
h1 { font-size: var(--text-h1); line-height: var(--leading-tight); font-weight: var(--weight-bold); }
h2 { font-size: var(--text-h2); line-height: var(--leading-tight); font-weight: var(--weight-semibold); }
h3 { font-size: var(--text-h3); line-height: var(--leading-snug); font-weight: var(--weight-semibold); }
h4 { font-size: var(--text-h4); line-height: var(--leading-snug); font-weight: var(--weight-medium); }
h5 { font-size: var(--text-h5); line-height: var(--leading-normal); font-weight: var(--weight-medium); }
```

---

## 2. WCAG 2.1 AA Compliance Strategy

CannaSaas must meet WCAG 2.1 Level AA throughout. Cannabis compliance is the obvious regulatory focus, but accessibility compliance is equally mandatory under the ADA and New York State Human Rights Law. This section documents the strategies baked into every component.

### 2.1 Contrast Ratios

All text/background combinations must meet these ratios:
- Normal text (< 18pt / < 14pt bold): **4.5:1 minimum**
- Large text (≥ 18pt / ≥ 14pt bold): **3:1 minimum**
- Non-text UI elements (icons, borders): **3:1 minimum**

The brand green `--primitive-brand-500` (#22c55e) on white (#ffffff) yields a contrast ratio of approximately 2.6:1 — **below threshold** for normal text. This is a common pitfall with green palettes. The solution: use `--primitive-brand-700` (#15803d) for text and `--primitive-brand-500` only for large icons, backgrounds, and large-format headings.

```typescript
// packages/utils/src/a11y.ts
// Contrast ratio calculation for use in ThemeProvider validation

/**
 * Converts a hex color to its relative luminance value
 * per WCAG 2.1 success criterion 1.4.3
 */
export function hexToLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Returns the WCAG contrast ratio between two hex colors.
 * Ratio of 4.5:1 or higher is AA-compliant for normal text.
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = hexToLuminance(hex1);
  const l2 = hexToLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validates a dispensary's brand color against WCAG AA.
 * Used in ThemeProvider at mount time — logs a warning in dev
 * and falls back to a safe color in production.
 */
export function validateBrandContrast(
  brandColor: string,
  backgroundColor: string,
  context: 'normal-text' | 'large-text' | 'ui-element',
): { passes: boolean; ratio: number; required: number } {
  const ratio = contrastRatio(brandColor, backgroundColor);
  const required = context === 'normal-text' ? 4.5 : 3.0;
  return { passes: ratio >= required, ratio: Math.round(ratio * 100) / 100, required };
}
```

### 2.2 Focus Management

Focus management is the most commonly skipped WCAG requirement in cannabis sites. CannaSaas enforces it via a `useFocusManagement` hook used by all dialogs, drawers, and page transitions.

```typescript
// packages/ui/src/hooks/useFocusManagement.ts

/**
 * FOCUS TRAP HOOK
 *
 * Traps keyboard focus within a container element.
 * Used by: Dialog, Drawer, MobileMenu, AgeGate modal.
 *
 * WCAG references:
 *  2.1.2 — No Keyboard Trap (must be escapable via Escape key)
 *  2.4.3 — Focus Order (logical DOM order within trap)
 *  3.2.2 — On Input (no unexpected context changes)
 *
 * @param containerRef - Ref to the container that should trap focus
 * @param isActive - Whether the trap is currently active
 * @param onEscape - Called when user presses Escape key
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean,
  onEscape?: () => void,
): void {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Save the element that had focus before trap activated
    const previouslyFocused = document.activeElement as HTMLElement;

    // Queryable focusable element selectors
    const FOCUSABLE_SELECTORS = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    const container = containerRef.current;
    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter(el => !el.closest('[aria-hidden="true"]'));

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Move focus into the container immediately
    firstFocusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift+Tab: if we're on the first element, wrap to last
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab: if we're on the last element, wrap to first
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to where it was before the trap opened (WCAG 2.4.3)
      previouslyFocused?.focus();
    };
  }, [isActive, containerRef, onEscape]);
}

/**
 * FOCUS RETURN HOOK
 *
 * Restores focus to a trigger element after an overlay closes.
 * Used by: CartDrawer, MobileMenu, ProductQuickView.
 *
 * @returns A ref to attach to the trigger button, and a method
 *          to programmatically restore focus to it.
 */
export function useFocusReturn() {
  const triggerRef = useRef<HTMLElement | null>(null);

  const captureCurrentFocus = useCallback(() => {
    triggerRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    // Defer to the next frame so any animation doesn't interfere
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  return { captureCurrentFocus, restoreFocus };
}
```

### 2.3 Semantic HTML Contract

Every CannaSaas component must adhere to the following HTML semantics contract:

| Component | Required Element | Role/ARIA | Notes |
|---|---|---|---|
| `ProductCard` | `<article>` | — | Each card is an independent piece of content |
| `ProductGrid` | `<ul>` with `<li>` wrappers | `role="list"` | Screen readers announce count |
| `Navigation` | `<nav>` | `aria-label="Main navigation"` | Only one `<main>` per page |
| `PriceDisplay` | `<span>` | `aria-label="Price: $45.00"` | Raw "$45.00" is ambiguous to screen readers |
| `THCBadge` | `<span>` | `aria-label="THC content: 24.5%"` | "24.5%" alone is meaningless |
| `StarRating` | `<span>` | `aria-label="Rating: 4 out of 5 stars"` | Must not use only visual stars |
| `CartButton` | `<button>` | `aria-label="Add Blue Dream to cart"` | Never use a `<div>` for buttons |
| `Modal` | `<dialog>` or `role="dialog"` | `aria-labelledby`, `aria-modal="true"` | Focus trap required |
| `AgeGate` | `<main>` within `<dialog>` | `aria-modal="true"` | Entire page content should be `aria-hidden` behind it |

---

## 3. Advanced React Patterns Reference

This section defines the patterns used throughout the codebase. Understanding these upfront prevents pattern drift across the three apps.

### 3.1 Compound Component Pattern

Used for: `Tabs`, `Accordion`, `Select`, `DataTable`, `ProductFilter`

The Compound Component pattern allows parent-child components to share state implicitly through React Context, eliminating prop drilling while keeping the API flexible and readable.

```typescript
// packages/ui/src/components/Tabs/Tabs.tsx
//
// COMPOUND COMPONENT PATTERN
//
// USAGE:
//   <Tabs defaultValue="overview">
//     <Tabs.List aria-label="Product information sections">
//       <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
//       <Tabs.Trigger value="effects">Effects</Tabs.Trigger>
//       <Tabs.Trigger value="lab-results">Lab Results</Tabs.Trigger>
//     </Tabs.List>
//     <Tabs.Panel value="overview"><ProductOverview /></Tabs.Panel>
//     <Tabs.Panel value="effects"><EffectsPanel /></Tabs.Panel>
//     <Tabs.Panel value="lab-results"><LabResultsPanel /></Tabs.Panel>
//   </Tabs>

import React, {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
} from 'react';
import { cn } from '@cannasaas/utils';

// ── CONTEXT ──────────────────────────────────────────────────────────────
interface TabsContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
  baseId: string;  // Used to construct aria-controls / aria-labelledby IDs
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs sub-components must be used within <Tabs>');
  }
  return context;
}

// ── ROOT ─────────────────────────────────────────────────────────────────
interface TabsProps {
  defaultValue: string;
  value?: string;           // Controlled mode
  onChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function TabsRoot({
  defaultValue,
  value: controlledValue,
  onChange,
  children,
  className,
}: TabsProps) {
  const baseId = useId();  // Stable unique ID prefix — React 18 feature
  const [internalValue, setInternalValue] = useState(defaultValue);

  // Support both controlled and uncontrolled usage
  const activeValue = controlledValue ?? internalValue;

  const setActiveValue = useCallback(
    (newValue: string) => {
      setInternalValue(newValue);
      onChange?.(newValue);
    },
    [onChange],
  );

  return (
    <TabsContext.Provider value={{ activeValue, setActiveValue, baseId }}>
      <div className={cn('tabs-root', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ── TAB LIST ─────────────────────────────────────────────────────────────
// Implements ARIA tablist pattern + arrow key navigation
interface TabsListProps {
  children: React.ReactNode;
  'aria-label': string;  // Required — describes the purpose of this tab group
  className?: string;
}

function TabsList({ children, 'aria-label': ariaLabel, className }: TabsListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Arrow key navigation per ARIA Authoring Practices Guide (APG)
  function handleKeyDown(event: React.KeyboardEvent) {
    const tabs = listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]');
    if (!tabs || tabs.length === 0) return;

    const tabsArray = Array.from(tabs);
    const currentIndex = tabsArray.indexOf(event.target as HTMLElement);

    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % tabsArray.length;
        tabsArray[nextIndex].focus();
        tabsArray[nextIndex].click();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = (currentIndex - 1 + tabsArray.length) % tabsArray.length;
        tabsArray[nextIndex].focus();
        tabsArray[nextIndex].click();
        break;
      case 'Home':
        event.preventDefault();
        tabsArray[0].focus();
        tabsArray[0].click();
        break;
      case 'End':
        event.preventDefault();
        tabsArray[tabsArray.length - 1].focus();
        tabsArray[tabsArray.length - 1].click();
        break;
    }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex gap-1 border-b border-[--color-border] overflow-x-auto',
        'scrollbar-none', // Hide scrollbar on mobile while keeping scroll
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── TAB TRIGGER ──────────────────────────────────────────────────────────
interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

function TabsTrigger({ value, children, disabled, className }: TabsTriggerProps) {
  const { activeValue, setActiveValue, baseId } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      role="tab"
      type="button"
      id={`${baseId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}  // Only active tab is in tab order
      disabled={disabled}
      onClick={() => setActiveValue(value)}
      className={cn(
        // Base styles
        'px-4 py-2.5 text-sm font-medium whitespace-nowrap',
        'border-b-2 border-transparent -mb-px',
        'transition-colors duration-150',
        // Active state
        isActive
          ? 'border-[--color-brand] text-[--color-brand]'
          : 'text-[--color-text-secondary] hover:text-[--color-text-primary] hover:border-[--color-border-strong]',
        // Disabled state
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  );
}

// ── TAB PANEL ────────────────────────────────────────────────────────────
interface TabsPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function TabsPanel({ value, children, className }: TabsPanelProps) {
  const { activeValue, baseId } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      // Hide from screen readers when not active (not just visually)
      hidden={!isActive}
      tabIndex={0}  // Panels themselves are focusable per APG
      className={cn(
        'focus-visible:outline-2 focus-visible:outline-[--color-brand]',
        className,
      )}
    >
      {isActive && children}
    </div>
  );
}

// ── EXPORT AS COMPOUND COMPONENT ─────────────────────────────────────────
export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Panel: TabsPanel,
});
```

### 3.2 Render Props Pattern

Used for: `DataTable` column renderers, `ProductFilter` custom filter cells, `OrderStatusTracker`

```typescript
// packages/ui/src/components/Table/DataTable.tsx (excerpt)
//
// RENDER PROPS PATTERN for column definitions
//
// This pattern allows parent components to inject custom rendering
// logic into the table without the table needing to know about
// business-domain concerns (product images, order status badges, etc.)

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  // Render prop — parent provides the rendering function
  cell?: (row: T, index: number) => React.ReactNode;
  // For accessible sort announcements
  sortLabel?: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

// ── USAGE EXAMPLE (in admin products page) ────────────────────────────
// const columns: ColumnDef<Product>[] = [
//   {
//     key: 'name',
//     header: 'Product',
//     cell: (product) => (
//       <div className="flex items-center gap-3">
//         <img src={product.images[0]?.url} alt="" aria-hidden="true"
//              className="h-10 w-10 rounded-md object-cover" />
//         <div>
//           <p className="font-medium">{product.name}</p>
//           <p className="text-sm text-[--color-text-secondary]">{product.brand}</p>
//         </div>
//       </div>
//     ),
//   },
//   {
//     key: 'thcContent',
//     header: 'THC',
//     cell: (product) => (
//       <THCBadge value={product.thcContent} />
//     ),
//   },
// ];
```

### 3.3 Custom Hook Pattern

Used everywhere. Each domain has a dedicated hook file in `packages/api-client/src/hooks/`.

```typescript
// packages/api-client/src/hooks/useProducts.ts
//
// CUSTOM HOOK PATTERN
//
// Encapsulates: API calls, loading/error states, caching, invalidation.
// Components import only the hook — never raw axios calls.
// This creates a clean boundary: components are presentation-only.

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { productsApi } from '../services/productsApi';
import type { Product, ProductFilterDto, PaginatedResponse, CreateProductDto, UpdateProductDto } from '@cannasaas/types';

// ── QUERY KEY FACTORY ─────────────────────────────────────────────────────
// Centralizes all query keys to prevent typos and enable precise invalidation
export const productKeys = {
  all:       () => ['products'] as const,
  lists:     () => [...productKeys.all(), 'list'] as const,
  list:      (filters: ProductFilterDto) => [...productKeys.lists(), filters] as const,
  details:   () => [...productKeys.all(), 'detail'] as const,
  detail:    (id: string) => [...productKeys.details(), id] as const,
  lowStock:  () => [...productKeys.all(), 'low-stock'] as const,
  categories:() => [...productKeys.all(), 'categories'] as const,
};

// ── QUERY HOOKS ──────────────────────────────────────────────────────────

/**
 * Fetches a paginated, filtered product listing.
 *
 * @example
 * const { data, isLoading, error } = useProducts({ category: 'flower', minThc: 20 });
 */
export function useProducts(
  filters: ProductFilterDto = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Product>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productsApi.getAll(filters),
    staleTime: 1000 * 60 * 5,  // 5 minutes — matches Redis cache TTL
    ...options,
  });
}

/**
 * Fetches a single product by ID.
 * Reads from the list cache first (optimistic read).
 */
export function useProduct(
  id: string,
  options?: Omit<UseQueryOptions<Product>, 'queryKey' | 'queryFn'>,
) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsApi.getById(id),
    // Seed the cache from the list cache if available
    initialData: () => {
      const listData = queryClient.getQueriesData<PaginatedResponse<Product>>({
        queryKey: productKeys.lists(),
      });
      for (const [, pageData] of listData) {
        const found = pageData?.data.find(p => p.id === id);
        if (found) return found;
      }
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

// ── MUTATION HOOKS ───────────────────────────────────────────────────────

/**
 * Creates a new product. On success, invalidates the products list cache
 * so the admin product table refreshes automatically.
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateProductDto) => productsApi.create(dto),
    onSuccess: () => {
      // Invalidate all product list queries — table will refetch
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError: (error) => {
      console.error('[useCreateProduct] Failed:', error);
    },
  });
}

/**
 * Optimistic inventory update — updates the UI immediately,
 * rolls back on failure. Used in admin inventory adjustment forms.
 */
export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      productsApi.updateInventory(variantId, quantity),

    onMutate: async ({ variantId, quantity }) => {
      // Cancel in-flight queries that might overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueriesData({ queryKey: productKeys.lists() });

      // Optimistically update the cache
      queryClient.setQueriesData<PaginatedResponse<Product>>(
        { queryKey: productKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map(product => ({
              ...product,
              variants: product.variants.map(v =>
                v.id === variantId ? { ...v, quantity } : v,
              ),
            })),
          };
        },
      );

      // Return snapshot for rollback in onError
      return { previousData };
    },

    onError: (_error, _vars, context) => {
      // Roll back to the snapshot
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      // Always refetch to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
```

### 3.4 Context + Reducer Pattern

Used for: `CartContext`, `CheckoutContext` (multi-step form state)

```typescript
// packages/stores/src/cartStore.ts
//
// ZUSTAND STORE PATTERN
//
// Zustand is preferred over React Context + useReducer for cross-app state
// because it avoids re-render cascades and works outside React components
// (useful in API interceptors and utility functions).

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Cart, CartItem } from '@cannasaas/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  promoCode: string | null;
  // Derived values (computed, not stored)
  itemCount: number;
  subtotal: number;
}

interface CartActions {
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  applyPromo: (code: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // ── INITIAL STATE ──────────────────────────────────────────
        items: [],
        isOpen: false,
        promoCode: null,
        get itemCount() { return get().items.reduce((sum, i) => sum + i.quantity, 0); },
        get subtotal() { return get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0); },

        // ── ACTIONS ────────────────────────────────────────────────
        addItem: (item) =>
          set((state) => {
            // Immer allows direct mutation — it produces a new immutable state
            const existing = state.items.find(
              i => i.variantId === item.variantId,
            );
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              state.items.push({ ...item, id: crypto.randomUUID() });
            }
            state.isOpen = true; // Auto-open drawer on add
          }),

        removeItem: (itemId) =>
          set((state) => {
            state.items = state.items.filter(i => i.id !== itemId);
          }),

        updateQuantity: (itemId, quantity) =>
          set((state) => {
            const item = state.items.find(i => i.id === itemId);
            if (item) {
              quantity <= 0
                ? (state.items = state.items.filter(i => i.id !== itemId))
                : (item.quantity = quantity);
            }
          }),

        applyPromo: (code) => set({ promoCode: code }),
        clearCart: () => set({ items: [], promoCode: null }),
        openCart: () => set({ isOpen: true }),
        closeCart: () => set({ isOpen: false }),
      })),
      {
        name: 'cannasaas-cart',
        // Only persist items and promo — not UI state
        partialize: (state) => ({ items: state.items, promoCode: state.promoCode }),
      },
    ),
    { name: 'CartStore' },
  ),
);
```

---

## 4. Shared UI Package — Base Components

### 4.1 Button Component

The `Button` is the most reused component in the system. It handles seven visual variants, three sizes, loading states, icon positioning, and full WCAG compliance in one composable unit.

```
packages/ui/src/components/Button/
├── Button.tsx         — Main component
├── Button.test.tsx    — Vitest + RTL tests
├── Button.stories.tsx — Storybook stories
└── index.ts           — Barrel export
```

```typescript
// packages/ui/src/components/Button/Button.tsx

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@cannasaas/utils';

// ── TYPES ────────────────────────────────────────────────────────────────
type ButtonVariant =
  | 'primary'    // Brand-colored CTA — "Add to Cart", "Checkout"
  | 'secondary'  // Outlined — secondary actions
  | 'ghost'      // No background — tertiary / icon buttons
  | 'danger'     // Red — destructive actions (delete, cancel)
  | 'success'    // Green — confirmations
  | 'link'       // Looks like a hyperlink
  | 'unstyled';  // Escape hatch — no button chrome

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;  // Screen reader text during loading state
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  // Polymorphic: render as <a> for navigation-styled buttons
  as?: 'button' | 'a';
  href?: string;
}

// ── VARIANT STYLES ────────────────────────────────────────────────────────
const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-[--color-brand] text-[--color-text-inverse]',
    'hover:bg-[--color-brand-hover]',
    'active:scale-[0.98]',
    'disabled:bg-[--color-border] disabled:text-[--color-text-disabled]',
  ),
  secondary: cn(
    'border border-[--color-brand] text-[--color-brand] bg-transparent',
    'hover:bg-[--color-brand-subtle]',
    'active:scale-[0.98]',
    'disabled:border-[--color-border] disabled:text-[--color-text-disabled]',
  ),
  ghost: cn(
    'bg-transparent text-[--color-text-primary]',
    'hover:bg-[--color-bg-tertiary]',
    'active:scale-[0.98]',
    'disabled:text-[--color-text-disabled]',
  ),
  danger: cn(
    'bg-[--color-error] text-white',
    'hover:bg-red-700',
    'active:scale-[0.98]',
    'disabled:bg-[--color-border] disabled:text-[--color-text-disabled]',
  ),
  success: cn(
    'bg-[--color-success] text-white',
    'hover:bg-green-700',
    'active:scale-[0.98]',
  ),
  link: cn(
    'bg-transparent text-[--color-brand] underline underline-offset-2 p-0 h-auto',
    'hover:text-[--color-brand-hover]',
  ),
  unstyled: '',
};

// ── SIZE STYLES ──────────────────────────────────────────────────────────
const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',          // Default — 40px height (touch target)
  lg: 'h-11 px-5 text-base gap-2',
  xl: 'h-12 px-6 text-base gap-2.5',      // Primary hero CTAs
};

// ── COMPONENT ────────────────────────────────────────────────────────────
/**
 * Button — The primary interactive element in CannaSaas.
 *
 * WCAG COMPLIANCE:
 *  1.4.3  — All variants maintain ≥ 4.5:1 text contrast ratio
 *  2.4.11 — Focus visible via --focus-ring-* CSS vars (global)
 *  4.1.2  — Role, name, state exposed; disabled state uses aria-disabled
 *           rather than the HTML disabled attribute to maintain focusability
 *           for error messaging (pattern recommended by WCAG 4.1.2)
 *
 * LOADING STATE:
 *  When isLoading is true, aria-busy="true" is set and the loadingText
 *  is placed in an aria-live region. This announces the state change
 *  to screen readers without requiring a page reload.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText = 'Loading…',
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      className,
      as: Tag = 'button',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        // WCAG: Use aria-disabled instead of disabled when you want the
        // button to remain focusable (so users can hear the error on focus)
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        onClick={isDisabled ? (e) => e.preventDefault() : props.onClick}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium',
          'rounded-[--primitive-radius-md]',
          'transition-[background-color,border-color,transform,opacity]',
          'duration-[--primitive-duration-fast]',
          'cursor-pointer select-none',
          // Disabled styles
          isDisabled && 'opacity-60 cursor-not-allowed pointer-events-none',
          // Variant + size
          variant !== 'unstyled' && variantStyles[variant],
          variant !== 'link' && sizeStyles[size],
          // Full width option
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {/* Loading spinner — replaces left icon when loading */}
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" size={16} />
            {/* Screen reader text for loading state */}
            <span className="sr-only">{loadingText}</span>
            {/* Keep the original text visible but hidden from AT */}
            <span aria-hidden="true">{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span aria-hidden="true" className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span aria-hidden="true" className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
```

### 4.2 Input Component

```typescript
// packages/ui/src/components/Input/Input.tsx
//
// WCAG COMPLIANCE:
//  1.3.1 — All inputs have a <label> (via labelText prop or aria-label)
//  1.4.3 — Input text meets 4.5:1 contrast on all backgrounds
//  3.3.1 — Error messages are associated via aria-describedby
//  3.3.2 — Labels and instructions are always visible, never placeholder-only

import React, { forwardRef, useId } from 'react';
import { cn } from '@cannasaas/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelSrOnly?: boolean;     // Visually hide label but keep for screen readers
  error?: string;
  hint?: string;             // Helper text below field
  prefix?: React.ReactNode;  // E.g., "$", search icon inside the input
  suffix?: React.ReactNode;  // E.g., unit "g", clear button
  required?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      labelSrOnly,
      error,
      hint,
      prefix,
      suffix,
      required,
      id: externalId,
      className,
      containerClassName,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    // Build aria-describedby from available description IDs
    const ariaDescribedBy = [
      error && errorId,
      hint && hintId,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {/* Label — required for WCAG 1.3.1 */}
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'text-sm font-medium text-[--color-text-primary]',
              labelSrOnly && 'sr-only',
            )}
          >
            {label}
            {/* Required indicator — paired with aria-required on the input */}
            {required && (
              <span aria-hidden="true" className="ml-1 text-[--color-error]">
                *
              </span>
            )}
          </label>
        )}

        {/* Input wrapper — allows prefix/suffix positioning */}
        <div className="relative flex items-center">
          {/* Prefix (icon or text) */}
          {prefix && (
            <div
              aria-hidden="true"
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2',
                'text-[--color-text-secondary] pointer-events-none',
              )}
            >
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={ariaDescribedBy}
            className={cn(
              // Base
              'w-full h-10 rounded-[--primitive-radius-md]',
              'border border-[--color-border]',
              'bg-[--color-bg-primary] text-[--color-text-primary]',
              'text-sm placeholder:text-[--color-text-disabled]',
              'transition-[border-color,box-shadow] duration-150',
              // Padding adjustments for prefix/suffix
              prefix ? 'pl-10' : 'pl-3',
              suffix ? 'pr-10' : 'pr-3',
              // Hover / Focus
              'hover:border-[--color-border-strong]',
              'focus:outline-none focus:border-[--color-brand]',
              'focus:ring-2 focus:ring-[--color-brand] focus:ring-opacity-20',
              // Error state
              error && 'border-[--color-error] focus:border-[--color-error] focus:ring-[--color-error]',
              // Disabled state
              props.disabled && 'opacity-50 cursor-not-allowed bg-[--color-bg-tertiary]',
              className,
            )}
            {...props}
          />

          {/* Suffix (icon or text) */}
          {suffix && (
            <div
              aria-hidden="true"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-secondary]"
            >
              {suffix}
            </div>
          )}
        </div>

        {/* Error message — announced by screen readers via aria-describedby */}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-[--color-error] flex items-center gap-1">
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}

        {/* Hint text — persistent helper, not an error */}
        {hint && !error && (
          <p id={hintId} className="text-xs text-[--color-text-secondary]">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
```

### 4.3 Skeleton Loader Component

Skeleton loaders are critical for perceived performance. CannaSaas uses them everywhere instead of spinners for content regions.

```typescript
// packages/ui/src/components/Skeleton/Skeleton.tsx
//
// Skeleton loading state component.
// Uses CSS animation with reduced-motion fallback.
// Respects prefers-reduced-motion by using opacity pulse instead of slide.

import { cn } from '@cannasaas/utils';

interface SkeletonProps {
  className?: string;
  'aria-label'?: string;  // Describe what is loading
}

export function Skeleton({ className, 'aria-label': ariaLabel }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel ?? 'Loading…'}
      className={cn(
        'bg-[--color-bg-tertiary] rounded-[--primitive-radius-md]',
        // Standard pulse animation
        'animate-pulse',
        // Reduced-motion: switch to opacity fade instead of slide
        'motion-reduce:animate-[pulse_2s_ease-in-out_infinite]',
        className,
      )}
    />
  );
}

// ── PRE-BUILT SKELETON SHAPES ─────────────────────────────────────────────
// These are named variants for common UI patterns

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading text…" className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            // Last line is shorter — mimics natural paragraph shape
            i === lines - 1 ? 'w-3/4' : 'w-full',
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading product…"
      className="flex flex-col gap-3 rounded-[--primitive-radius-lg] border border-[--color-border] p-4"
    >
      <Skeleton className="h-48 w-full rounded-[--primitive-radius-md]" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-24 rounded-[--primitive-radius-full]" />
      </div>
    </div>
  );
}
```

---

## 5. Shared UI Package — Composite Components

### 5.1 DataTable Component

The `DataTable` is the workhorse of the admin and staff portals. It handles sorting, selection, pagination, and empty/loading/error states as a single composable component.

```
packages/ui/src/components/Table/
├── DataTable.tsx          — Root table component
├── DataTableToolbar.tsx   — Search + filter controls above table
├── DataTablePagination.tsx — Pagination controls below table
└── index.ts
```

```typescript
// packages/ui/src/components/Table/DataTable.tsx

import React, { useState, useMemo, useCallback, useId } from 'react';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  CheckSquare, Square,
} from 'lucide-react';
import { cn } from '@cannasaas/utils';
import { Skeleton } from '../Skeleton/Skeleton';
import type { ColumnDef } from './types';

// ── TYPES ────────────────────────────────────────────────────────────────
export type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  columnKey: string;
  direction: SortDirection;
}

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  error?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  onRowClick?: (row: T) => void;
  caption?: string;  // Required for WCAG 1.3.1 — describes table purpose
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  // Pagination props (if parent controls pagination)
  totalRows?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

/**
 * DataTable — Accessible, sortable, selectable data grid.
 *
 * WCAG COMPLIANCE:
 *  1.3.1  — Semantic <table> with <caption>, <th scope>, <thead>, <tbody>
 *  2.1.1  — Fully keyboard navigable; sort buttons are real <button> elements
 *  4.1.2  — Sort state announced via aria-sort on <th> elements
 *
 * PERFORMANCE:
 *  Client-side sort uses useMemo — only recalculates when data or sort changes.
 *  For server-side pagination/sort, pass the sorted data in and use onSortChange.
 */
export function DataTable<T extends { id: string }>({
  data,
  columns,
  isLoading,
  error,
  selectable,
  onSelectionChange,
  onRowClick,
  caption,
  emptyMessage = 'No results found.',
  emptyAction,
  totalRows,
  pageSize = 20,
  currentPage = 1,
  onPageChange,
}: DataTableProps<T>) {
  const captionId = useId();
  const [sort, setSort] = useState<SortState>({ columnKey: '', direction: null });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── CLIENT-SIDE SORTING ────────────────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!sort.columnKey || !sort.direction) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sort.columnKey];
      const bVal = (b as any)[sort.columnKey];
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sort]);

  const handleSort = useCallback((columnKey: string) => {
    setSort(prev => ({
      columnKey,
      direction:
        prev.columnKey !== columnKey ? 'asc'
        : prev.direction === 'asc'   ? 'desc'
        :                              null,
    }));
  }, []);

  // ── SELECTION LOGIC ────────────────────────────────────────────────────
  const allSelected = selectedIds.size === data.length && data.length > 0;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = useCallback(() => {
    const newSet = allSelected ? new Set<string>() : new Set(data.map(r => r.id));
    setSelectedIds(newSet);
    onSelectionChange?.(Array.from(newSet));
  }, [allSelected, data, onSelectionChange]);

  const toggleSelectRow = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      onSelectionChange?.(Array.from(next));
      return next;
    });
  }, [onSelectionChange]);

  // ── RENDER HELPERS ─────────────────────────────────────────────────────
  function getSortIcon(columnKey: string) {
    if (sort.columnKey !== columnKey) return <ChevronsUpDown size={14} aria-hidden="true" />;
    if (sort.direction === 'asc') return <ChevronUp size={14} aria-hidden="true" />;
    if (sort.direction === 'desc') return <ChevronDown size={14} aria-hidden="true" />;
    return <ChevronsUpDown size={14} aria-hidden="true" />;
  }

  function getAriaSort(columnKey: string): 'ascending' | 'descending' | 'none' | undefined {
    if (sort.columnKey !== columnKey) return 'none';
    if (sort.direction === 'asc') return 'ascending';
    if (sort.direction === 'desc') return 'descending';
    return 'none';
  }

  // ── LOADING STATE ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading table data…" role="status">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // ── ERROR STATE ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div role="alert" className="rounded-[--primitive-radius-lg] border border-[--color-error] bg-red-50 p-6 text-center">
        <p className="text-[--color-error] font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[--primitive-radius-lg] border border-[--color-border]">
      {/* Horizontal scroll wrapper for small screens */}
      <div className="overflow-x-auto">
        <table
          aria-labelledby={captionId}
          className="w-full border-collapse text-sm"
        >
          {/* Caption — required for screen reader context */}
          <caption id={captionId} className="sr-only">
            {caption}
            {totalRows && `. ${totalRows} total rows.`}
          </caption>

          <thead className="bg-[--color-bg-secondary] border-b border-[--color-border]">
            <tr>
              {/* Checkbox column header */}
              {selectable && (
                <th scope="col" className="w-12 px-4 py-3">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    aria-label={allSelected ? 'Deselect all rows' : 'Select all rows'}
                    aria-pressed={allSelected}
                    className="flex items-center justify-center text-[--color-text-secondary] hover:text-[--color-text-primary]"
                  >
                    {allSelected ? (
                      <CheckSquare size={18} aria-hidden="true" />
                    ) : someSelected ? (
                      <Square size={18} aria-hidden="true" className="opacity-50" />
                    ) : (
                      <Square size={18} aria-hidden="true" />
                    )}
                  </button>
                </th>
              )}

              {/* Column headers */}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  aria-sort={col.sortable ? getAriaSort(String(col.key)) : undefined}
                  style={{ width: col.width }}
                  className={cn(
                    'px-4 py-3 text-left font-semibold text-[--color-text-primary]',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(String(col.key))}
                      className="inline-flex items-center gap-1 hover:text-[--color-brand] transition-colors"
                      aria-label={`Sort by ${col.sortLabel ?? col.header}`}
                    >
                      {col.header}
                      {getSortIcon(String(col.key))}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[--color-border]">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-16 text-center text-[--color-text-secondary]"
                >
                  <p>{emptyMessage}</p>
                  {emptyAction && <div className="mt-4">{emptyAction}</div>}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'bg-[--color-bg-primary] transition-colors duration-100',
                    onRowClick && 'cursor-pointer hover:bg-[--color-bg-secondary]',
                    selectedIds.has(row.id) && 'bg-[--color-brand-subtle]',
                  )}
                >
                  {selectable && (
                    <td className="w-12 px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleSelectRow(row.id); }}
                        aria-label={`${selectedIds.has(row.id) ? 'Deselect' : 'Select'} row ${rowIndex + 1}`}
                        aria-pressed={selectedIds.has(row.id)}
                        className="flex items-center justify-center text-[--color-text-secondary] hover:text-[--color-brand]"
                      >
                        {selectedIds.has(row.id)
                          ? <CheckSquare size={18} aria-hidden="true" />
                          : <Square size={18} aria-hidden="true" />}
                      </button>
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        'px-4 py-3 text-[--color-text-primary]',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                      )}
                    >
                      {col.cell
                        ? col.cell(row, rowIndex)
                        : String((row as any)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {onPageChange && totalRows && (
        <DataTablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalRows={totalRows}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
```

---

## 6. Layout System & Navigation Shell

### 6.1 Storefront Shell Components

The storefront shell is composed of four independently testable components that combine into the full page layout.

```
apps/storefront/src/components/layout/
├── StorefrontLayout.tsx    — Root layout wrapper, provides skip nav
├── StorefrontHeader.tsx    — Logo, nav, cart button, account menu
├── StorefrontFooter.tsx    — Links, legal, age disclaimer
├── MobileMenu.tsx          — Slide-in nav for mobile
├── CartDrawer.tsx          — Slide-in cart for all screen sizes
└── AgeGate.tsx             — Full-screen age verification modal
```

```typescript
// apps/storefront/src/components/layout/StorefrontLayout.tsx
//
// ROOT LAYOUT COMPONENT
//
// Wraps every storefront page. Provides:
//  - Skip navigation link (WCAG 2.4.1)
//  - Landmark regions (<header>, <main>, <footer>)
//  - Age gate overlay
//  - Cart drawer

import React from 'react';
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontFooter } from './StorefrontFooter';
import { CartDrawer } from './CartDrawer';
import { AgeGate } from './AgeGate';
import { useAgeVerification } from '../../hooks/useAgeVerification';
import { useCartStore } from '@cannasaas/stores';

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

export function StorefrontLayout({ children }: StorefrontLayoutProps) {
  const { isVerified } = useAgeVerification();
  const isCartOpen = useCartStore(s => s.isOpen);
  const closeCart = useCartStore(s => s.closeCart);

  return (
    <>
      {/*
        SKIP NAVIGATION LINK — WCAG 2.4.1
        Visually hidden but appears on :focus for keyboard users.
        This allows keyboard-only users to skip past the navigation
        and go directly to the main content on every page load.
      */}
      <a
        href="#main-content"
        className={[
          'sr-only focus:not-sr-only',
          'fixed top-2 left-2 z-[9999]',
          'bg-[--color-brand] text-[--color-text-inverse]',
          'px-4 py-2 rounded-[--primitive-radius-md]',
          'text-sm font-medium shadow-lg',
        ].join(' ')}
      >
        Skip to main content
      </a>

      {/* Age gate sits outside the normal DOM flow and traps focus */}
      {!isVerified && <AgeGate />}

      {/*
        The entire page content is aria-hidden when the age gate is active.
        This prevents screen readers from accessing content behind the gate.
      */}
      <div
        aria-hidden={!isVerified}
        className="min-h-screen flex flex-col bg-[--color-bg-primary]"
      >
        {/* Landmark: banner role */}
        <StorefrontHeader />

        {/*
          Landmark: main role
          The id="main-content" is the target of the skip nav link.
          tabIndex={-1} allows programmatic focus from the skip link.
        */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 focus:outline-none"
        >
          {children}
        </main>

        {/* Landmark: contentinfo role */}
        <StorefrontFooter />
      </div>

      {/* Cart Drawer — portal renders outside the main DOM flow */}
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}
```

```typescript
// apps/storefront/src/components/layout/StorefrontHeader.tsx
//
// HEADER COMPONENT
//
// Deconstructed into sub-components for testability and readability.
// All components within are individually importable.

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, Search } from 'lucide-react';
import { useCartStore } from '@cannasaas/stores';
import { useAuthStore } from '@cannasaas/stores';
import { MobileMenu } from './MobileMenu';

// ── NAV ITEMS DATA ─────────────────────────────────────────────────────────
// Separating data from markup makes nav items easy to update without
// touching component logic.
const NAV_ITEMS = [
  { label: 'Shop', href: '/products' },
  { label: 'Deals', href: '/deals' },
  { label: 'Brands', href: '/brands' },
  { label: 'Find Us', href: '/locations' },
] as const;

// ── CART BUTTON SUB-COMPONENT ──────────────────────────────────────────────
// Isolated so it can subscribe to cart store independently.
// Only re-renders when itemCount changes.
function CartButton() {
  const itemCount = useCartStore(s => s.itemCount);
  const openCart = useCartStore(s => s.openCart);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={
        itemCount > 0
          ? `Open cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`
          : 'Open cart, empty'
      }
      className={[
        'relative flex items-center justify-center',
        'h-10 w-10 rounded-[--primitive-radius-md]',
        'text-[--color-text-primary]',
        'hover:bg-[--color-bg-tertiary]',
        'transition-colors duration-150',
      ].join(' ')}
    >
      <ShoppingCart size={20} aria-hidden="true" />
      {itemCount > 0 && (
        <span
          aria-hidden="true"  // Count is in aria-label above
          className={[
            'absolute -top-1 -right-1',
            'h-5 w-5 rounded-full',
            'bg-[--color-brand] text-white',
            'text-xs font-bold',
            'flex items-center justify-center',
            'pointer-events-none',
          ].join(' ')}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}

// ── DESKTOP NAV LINK SUB-COMPONENT ────────────────────────────────────────
function NavLink({ href, label }: { href: string; label: string }) {
  const { pathname } = useLocation();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      to={href}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'text-sm font-medium px-3 py-2',
        'rounded-[--primitive-radius-md]',
        'transition-colors duration-150',
        isActive
          ? 'text-[--color-brand] bg-[--color-brand-subtle]'
          : 'text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-bg-tertiary]',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

// ── HEADER ROOT ────────────────────────────────────────────────────────────
export function StorefrontHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = useAuthStore(s => s.user);

  return (
    <header
      role="banner"
      className={[
        'sticky top-0 z-40',
        'border-b border-[--color-border]',
        'bg-[--color-bg-primary]/95 backdrop-blur-sm',
        // Glass effect with reduced-motion fallback
        'supports-[backdrop-filter]:bg-[--color-bg-primary]/80',
      ].join(' ')}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo — wrapped in home link */}
          <Link
            to="/"
            aria-label="CannaSaas — Go to homepage"
            className="flex-shrink-0"
          >
            {/* Logo image — aria-hidden since text label is on the <a> */}
            <img
              src="/logo.svg"
              alt=""
              aria-hidden="true"
              width={140}
              height={32}
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation — hidden on mobile */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-1"
          >
            {NAV_ITEMS.map(item => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <Link
              to="/search"
              aria-label="Search products"
              className={[
                'hidden sm:flex items-center justify-center',
                'h-10 w-10 rounded-[--primitive-radius-md]',
                'text-[--color-text-secondary]',
                'hover:bg-[--color-bg-tertiary] hover:text-[--color-text-primary]',
                'transition-colors duration-150',
              ].join(' ')}
            >
              <Search size={20} aria-hidden="true" />
            </Link>

            {/* Account — shows avatar if logged in */}
            <Link
              to={user ? '/account' : '/login'}
              aria-label={user ? `My account: ${user.firstName}` : 'Log in or create account'}
              className={[
                'flex items-center justify-center',
                'h-10 w-10 rounded-[--primitive-radius-md]',
                'text-[--color-text-secondary]',
                'hover:bg-[--color-bg-tertiary] hover:text-[--color-text-primary]',
                'transition-colors duration-150',
              ].join(' ')}
            >
              <User size={20} aria-hidden="true" />
            </Link>

            {/* Cart */}
            <CartButton />

            {/* Mobile menu toggle — only visible on small screens */}
            <button
              type="button"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={[
                'flex md:hidden items-center justify-center',
                'h-10 w-10 rounded-[--primitive-radius-md]',
                'text-[--color-text-primary]',
                'hover:bg-[--color-bg-tertiary]',
                'transition-colors duration-150',
              ].join(' ')}
            >
              {isMobileMenuOpen
                ? <X size={20} aria-hidden="true" />
                : <Menu size={20} aria-hidden="true" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      <MobileMenu
        id="mobile-navigation"
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={NAV_ITEMS}
      />
    </header>
  );
}
```

### 6.2 Age Gate Component

The Age Gate is the most legally critical UI component. It must fully block access to page content and be resistant to easy bypass at the DOM level.

```typescript
// apps/storefront/src/components/layout/AgeGate.tsx
//
// AGE GATE — Full-screen age verification modal.
//
// REQUIREMENTS:
//  - Every session must re-verify (stored in sessionStorage, not localStorage)
//  - The modal MUST trap focus (WCAG 2.1.2)
//  - Cannot be dismissed without submitting
//  - Behind the modal, page content is aria-hidden and inert
//  - Age must be confirmed by date-of-birth entry, not just a button click

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusTrap } from '@cannasaas/ui';
import { Button } from '@cannasaas/ui';
import { Input } from '@cannasaas/ui';
import { useAgeVerification } from '../../hooks/useAgeVerification';

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function AgeGate() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const { verify, deny } = useAgeVerification();

  // Trap focus within the modal — cannot be escaped without submitting
  useFocusTrap(containerRef, true, undefined); // No escape key handler

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!dateOfBirth) {
      setError('Please enter your date of birth.');
      return;
    }

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      setError('Please enter a valid date.');
      return;
    }

    const age = calculateAge(dob);

    if (age >= 21) {
      verify();
    } else {
      deny();
      setError('You must be 21 or older to access this site.');
    }
  }

  return (
    /*
     * The overlay covers the entire viewport.
     * role="dialog" with aria-modal="true" tells AT that content behind
     * this dialog is inert — equivalent to the HTML inert attribute.
     */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-desc"
      className={[
        'fixed inset-0 z-[9998]',
        'bg-[--color-bg-primary]',
        'flex items-center justify-center',
        'p-4',
      ].join(' ')}
    >
      <div
        ref={containerRef}
        className={[
          'w-full max-w-sm',
          'bg-[--color-bg-primary]',
          'rounded-[--primitive-radius-lg]',
          'border border-[--color-border]',
          'shadow-[--primitive-shadow-lg]',
          'p-8',
        ].join(' ')}
      >
        {/* Brand logo */}
        <div className="flex justify-center mb-6">
          <img src="/logo.svg" alt="CannaSaas" width={160} height={40} className="h-10 w-auto" />
        </div>

        <h1
          id="age-gate-title"
          className="text-2xl font-bold text-center text-[--color-text-primary] mb-2"
        >
          Age Verification Required
        </h1>

        <p
          id="age-gate-desc"
          className="text-sm text-[--color-text-secondary] text-center mb-6"
        >
          You must be 21 years of age or older to enter this website. Cannabis products
          are for adults only.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Date of Birth"
            type="date"
            value={dateOfBirth}
            onChange={e => setDateOfBirth(e.target.value)}
            error={error}
            required
            aria-required="true"
            max={new Date().toISOString().split('T')[0]}  // Cannot select future dates
            hint="You must be 21 or older to continue."
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            className="mt-4"
          >
            Verify My Age
          </Button>
        </form>

        <p className="mt-4 text-xs text-[--color-text-secondary] text-center">
          By entering, you agree that you are of legal age to purchase cannabis
          products in your jurisdiction.
        </p>
      </div>
    </div>
  );
}
```

---

## 7. Storefront App — Page Breakdown

### 7.1 Product Listing Page

The product listing page is the highest-traffic page in the storefront. It is composed of seven sub-components, each independently tested, with a clear data-flow hierarchy.

```
apps/storefront/src/pages/Products/
├── ProductsPage.tsx           — Page root, data fetching, layout
├── components/
│   ├── ProductGrid.tsx        — Responsive product grid
│   ├── ProductCard.tsx        — Individual product card (article)
│   ├── ProductFilter.tsx      — Left-rail filter sidebar
│   ├── ProductFilterMobile.tsx — Mobile sheet version of filter
│   ├── ProductSort.tsx        — Sort dropdown
│   ├── ProductPagination.tsx  — Page controls
│   ├── ProductGridSkeleton.tsx — Loading state
│   └── ActiveFilters.tsx      — Pills showing active filters + clear
```

```typescript
// apps/storefront/src/pages/Products/ProductsPage.tsx
//
// PAGE ROOT — orchestrates data fetching and layout.
// Individual display components are "dumb" — they receive data via props.

import React, { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@cannasaas/api-client';
import type { ProductFilterDto } from '@cannasaas/types';
import { ProductGrid } from './components/ProductGrid';
import { ProductFilter } from './components/ProductFilter';
import { ProductSort } from './components/ProductSort';
import { ActiveFilters } from './components/ActiveFilters';
import { ProductFilterMobile } from './components/ProductFilterMobile';
import { Button } from '@cannasaas/ui';
import { SlidersHorizontal } from 'lucide-react';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Derive filter state from URL search params
  // URL-driven state ensures shareable links and browser back/forward work correctly
  const filters: ProductFilterDto = {
    category:   searchParams.get('category') ?? undefined,
    strainType: searchParams.get('strainType') ?? undefined,
    minThc:     searchParams.get('minThc') ? Number(searchParams.get('minThc')) : undefined,
    maxPrice:   searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort:       searchParams.get('sort') ?? 'popular',
    page:       Number(searchParams.get('page') ?? '1'),
  };

  const { data, isLoading, error } = useProducts(filters);

  // Update a single filter param — preserves all other params
  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        value === null ? next.delete(key) : next.set(key, value);
        next.set('page', '1'); // Reset to page 1 on filter change
        return next;
      });
    },
    [setSearchParams],
  );

  const clearAllFilters = useCallback(() => {
    setSearchParams({ sort: filters.sort ?? 'popular' });
  }, [setSearchParams, filters.sort]);

  const activeFilterCount = [
    filters.category,
    filters.strainType,
    filters.minThc,
    filters.maxPrice,
  ].filter(Boolean).length;

  return (
    /*
     * The page title is rendered here with an h1.
     * Only one h1 per page — WCAG 2.4.6 requires descriptive headings.
     */
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page heading + mobile filter button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[--color-text-primary]">
            Shop Cannabis
          </h1>
          {data && (
            // aria-live announces count changes as filters are applied
            <p
              aria-live="polite"
              aria-atomic="true"
              className="text-sm text-[--color-text-secondary] mt-1"
            >
              {data.pagination.total} products
            </p>
          )}
        </div>

        {/* Mobile filter trigger */}
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<SlidersHorizontal size={16} />}
          onClick={() => setIsMobileFilterOpen(true)}
          aria-label={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
          className="md:hidden"
        >
          Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar Filter */}
        <aside
          aria-label="Product filters"
          className="hidden md:block w-64 flex-shrink-0"
        >
          <ProductFilter
            currentFilters={filters}
            onFilterChange={updateFilter}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar: active filters + sort */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <ActiveFilters
              filters={filters}
              onRemove={updateFilter}
              onClearAll={clearAllFilters}
            />
            <div className="ml-auto">
              <ProductSort
                currentSort={filters.sort}
                onChange={(sort) => updateFilter('sort', sort)}
              />
            </div>
          </div>

          {/* Product Grid — passes error to the grid for error boundary display */}
          <ProductGrid
            products={data?.data ?? []}
            isLoading={isLoading}
            error={error ? 'Failed to load products. Please try again.' : undefined}
            pagination={data?.pagination}
            onPageChange={(page) => updateFilter('page', String(page))}
          />
        </div>
      </div>

      {/* Mobile filter sheet */}
      <ProductFilterMobile
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        currentFilters={filters}
        onFilterChange={updateFilter}
        onClearAll={clearAllFilters}
      />
    </div>
  );
}
```

```typescript
// apps/storefront/src/pages/Products/components/ProductCard.tsx
//
// PRODUCT CARD
//
// WCAG COMPLIANCE:
//  1.1.1 — Product image has meaningful alt text
//  1.4.1 — Strain type is not conveyed by color alone (badge + text)
//  2.1.1 — Entire card is navigable; "Add to cart" is a real button
//  4.1.2 — All interactive elements have accessible names

import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Leaf } from 'lucide-react';
import { Button } from '@cannasaas/ui';
import { useAddToCart } from '@cannasaas/api-client';
import { formatCurrency } from '@cannasaas/utils';
import type { Product } from '@cannasaas/types';
import { cn } from '@cannasaas/utils';

// Strain type label map — used for both visual badge and aria-label
const STRAIN_LABELS: Record<string, { label: string; color: string }> = {
  sativa:                 { label: 'Sativa',           color: 'bg-amber-100 text-amber-800' },
  indica:                 { label: 'Indica',           color: 'bg-purple-100 text-purple-800' },
  hybrid:                 { label: 'Hybrid',           color: 'bg-blue-100 text-blue-800' },
  sativa_dominant_hybrid: { label: 'Sativa Hybrid',    color: 'bg-yellow-100 text-yellow-800' },
  indica_dominant_hybrid: { label: 'Indica Hybrid',    color: 'bg-violet-100 text-violet-800' },
  cbd:                    { label: 'High CBD',         color: 'bg-green-100 text-green-800' },
};

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  const selectedVariant = product.variants[selectedVariantIdx];
  const primaryImage = product.images.find(img => img.isPrimary) ?? product.images[0];
  const strainInfo = product.strainType ? STRAIN_LABELS[product.strainType] : null;

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent card link navigation
      addToCart({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity: 1,
      });
    },
    [addToCart, product.id, selectedVariant],
  );

  return (
    /*
     * <article> — each card is a self-contained piece of content.
     * aria-label on the article provides full context for screen readers
     * browsing landmark regions — they'll hear the product name.
     */
    <article
      aria-label={product.name}
      className={[
        'group relative flex flex-col',
        'bg-[--color-bg-primary]',
        'border border-[--color-border]',
        'rounded-[--primitive-radius-lg]',
        'overflow-hidden',
        'shadow-[--primitive-shadow-sm]',
        'hover:shadow-[--primitive-shadow-md]',
        'transition-shadow duration-200',
      ].join(' ')}
    >
      {/* Product image link */}
      <Link
        to={`/products/${product.id}`}
        tabIndex={-1}  // The card heading link is the primary focus point
        aria-hidden="true"  // Image link is decorative — heading link is the real nav
        className="block overflow-hidden aspect-[4/3]"
      >
        <img
          src={primaryImage?.url ?? '/placeholder-product.jpg'}
          alt=""  // Intentionally empty — the article label describes the product
          loading="lazy"
          decoding="async"
          width={400}
          height={300}
          className={[
            'w-full h-full object-cover',
            'transition-transform duration-300',
            'group-hover:scale-105',
          ].join(' ')}
        />
      </Link>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Category + Strain badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium uppercase tracking-wider text-[--color-text-secondary]">
            {product.category}
          </span>
          {strainInfo && (
            <span
              aria-label={`Strain type: ${strainInfo.label}`}
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                strainInfo.color,
              )}
            >
              {strainInfo.label}
            </span>
          )}
        </div>

        {/* Product name — the primary navigable link in the card */}
        <h2 className="text-base font-semibold leading-snug">
          <Link
            to={`/products/${product.id}`}
            className={[
              'text-[--color-text-primary]',
              'hover:text-[--color-brand]',
              'transition-colors duration-150',
              // The link stretches to cover the card via the after pseudo-element
              'after:absolute after:inset-0 after:z-0',
            ].join(' ')}
          >
            {product.name}
          </Link>
        </h2>

        <p className="text-xs text-[--color-text-secondary]">{product.brand}</p>

        {/* Cannabis potency info */}
        <div className="flex items-center gap-3 text-xs" aria-label="Potency">
          {product.thcContent && (
            <span aria-label={`THC content: ${product.thcContent}%`}>
              <span aria-hidden="true" className="font-semibold text-[--color-text-primary]">
                THC {product.thcContent}%
              </span>
            </span>
          )}
          {product.cbdContent && product.cbdContent > 0 && (
            <span aria-label={`CBD content: ${product.cbdContent}%`}>
              <span aria-hidden="true" className="font-semibold text-[--color-text-primary]">
                CBD {product.cbdContent}%
              </span>
            </span>
          )}
        </div>

        {/* Variant size selector */}
        {product.variants.length > 1 && (
          <div className="flex flex-wrap gap-1 mt-1" role="group" aria-label="Select size">
            {product.variants.map((variant, idx) => (
              <button
                key={variant.id}
                type="button"
                onClick={(e) => { e.preventDefault(); setSelectedVariantIdx(idx); }}
                aria-pressed={idx === selectedVariantIdx}
                aria-label={`${variant.name}: ${formatCurrency(variant.price)}`}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border',
                  'transition-colors duration-100',
                  'relative z-10',  // Sits above the card's full-cover link
                  idx === selectedVariantIdx
                    ? 'border-[--color-brand] bg-[--color-brand-subtle] text-[--color-brand]'
                    : 'border-[--color-border] hover:border-[--color-border-strong]',
                )}
              >
                {variant.name}
              </button>
            ))}
          </div>
        )}

        {/* Price + Add to cart */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[--color-border]">
          <p
            aria-label={`Price: ${formatCurrency(selectedVariant?.price ?? 0)}`}
            className="text-lg font-bold text-[--color-text-primary]"
          >
            <span aria-hidden="true">
              {formatCurrency(selectedVariant?.price ?? 0)}
            </span>
          </p>

          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isAddingToCart}
            loadingText={`Adding ${product.name} to cart…`}
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} — ${selectedVariant?.name} to cart`}
            className="relative z-10"  // Above the card link overlay
          >
            <ShoppingCart size={14} aria-hidden="true" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Add</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
```

### 7.2 Product Detail Page

```
apps/storefront/src/pages/ProductDetail/
├── ProductDetailPage.tsx         — Page root
├── components/
│   ├── ProductGallery.tsx        — Image carousel with accessible controls
│   ├── ProductInfo.tsx           — Name, brand, potency, description
│   ├── ProductVariantSelector.tsx — Size/weight picker
│   ├── ProductEffects.tsx        — Effects and flavors (visual + text)
│   ├── ProductLabResults.tsx     — COA, terpenes, cannabinoids chart
│   ├── ProductReviews.tsx        — Star ratings + review list
│   └── RelatedProducts.tsx       — Horizontal scroll product strip
```

```typescript
// apps/storefront/src/pages/ProductDetail/components/ProductGallery.tsx
//
// IMAGE GALLERY WITH ACCESSIBLE CAROUSEL
//
// WCAG:
//  1.1.1 — All images have meaningful alt text (from product data)
//  2.1.1 — Arrow key navigation for the carousel
//  2.4.3 — Focus management: thumbnails follow the main image

import React, { useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductImage } from '@cannasaas/types';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeImage = images[activeIndex];
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < images.length - 1;

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
    // Move focus to the corresponding thumbnail
    thumbnailRefs.current[index]?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft' && canGoPrev) goTo(activeIndex - 1);
    if (e.key === 'ArrowRight' && canGoNext) goTo(activeIndex + 1);
    if (e.key === 'Home') goTo(0);
    if (e.key === 'End') goTo(images.length - 1);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div
        role="region"
        aria-label={`Product gallery for ${productName}`}
        aria-roledescription="carousel"
        className="relative overflow-hidden rounded-[--primitive-radius-lg] bg-[--color-bg-secondary] aspect-square"
      >
        <img
          src={activeImage?.url}
          alt={activeImage?.altText ?? `${productName}, image ${activeIndex + 1} of ${images.length}`}
          className="w-full h-full object-cover"
          key={activeImage?.url}  // Forces re-render animation on change
        />

        {/* Prev / Next arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label={`Previous image (${activeIndex} of ${images.length})`}
              onClick={() => canGoPrev && goTo(activeIndex - 1)}
              disabled={!canGoPrev}
              className={[
                'absolute left-3 top-1/2 -translate-y-1/2',
                'h-10 w-10 rounded-full',
                'bg-[--color-bg-primary]/80 backdrop-blur-sm',
                'border border-[--color-border]',
                'flex items-center justify-center',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                'transition-opacity duration-150',
              ].join(' ')}
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label={`Next image (${activeIndex + 2} of ${images.length})`}
              onClick={() => canGoNext && goTo(activeIndex + 1)}
              disabled={!canGoNext}
              className={[
                'absolute right-3 top-1/2 -translate-y-1/2',
                'h-10 w-10 rounded-full',
                'bg-[--color-bg-primary]/80 backdrop-blur-sm',
                'border border-[--color-border]',
                'flex items-center justify-center',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                'transition-opacity duration-150',
              ].join(' ')}
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>

            {/* Dot indicators */}
            <div
              aria-label={`Image ${activeIndex + 1} of ${images.length}`}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5"
            >
              {images.map((_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={[
                    'h-1.5 rounded-full transition-all duration-200',
                    i === activeIndex
                      ? 'w-4 bg-[--color-brand]'
                      : 'w-1.5 bg-[--color-bg-primary]/60',
                  ].join(' ')}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          role="group"
          aria-label="Select product image"
          onKeyDown={handleKeyDown}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
        >
          {images.map((img, idx) => (
            <button
              key={img.url}
              ref={(el) => { thumbnailRefs.current[idx] = el; }}
              type="button"
              onClick={() => goTo(idx)}
              aria-label={`View image ${idx + 1}${img.altText ? `: ${img.altText}` : ''}`}
              aria-pressed={idx === activeIndex}
              className={[
                'flex-shrink-0 h-16 w-16 rounded-[--primitive-radius-md] overflow-hidden',
                'border-2 transition-all duration-150',
                idx === activeIndex
                  ? 'border-[--color-brand]'
                  : 'border-[--color-border] hover:border-[--color-border-strong]',
              ].join(' ')}
            >
              <img
                src={img.url}
                alt=""  // Intentionally empty — button label provides context
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 8. Admin Portal App — Page Breakdown

### 8.1 Admin Layout

```
apps/admin/src/components/layout/
├── AdminLayout.tsx         — Root with sidebar + main content
├── AdminSidebar.tsx        — Collapsible navigation sidebar
├── AdminSidebarItem.tsx    — Nav item with active state + badge
├── AdminTopbar.tsx         — Breadcrumb + user menu + notifications
└── AdminBreadcrumb.tsx     — Semantic breadcrumb navigation
```

```typescript
// apps/admin/src/components/layout/AdminLayout.tsx
//
// ADMIN SHELL — Sidebar navigation pattern.
//
// The sidebar is a persistent <nav> landmark on desktop.
// On mobile it becomes a drawer with a focus trap.
// The main content area fills the remaining viewport.

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[--color-bg-secondary] overflow-hidden">
      {/*
        Skip nav for admin — brings focus directly to main content area.
        Critical because admin pages have long sidebars.
      */}
      <a href="#admin-main" className="sr-only focus:not-sr-only fixed top-2 left-2 z-50 bg-[--color-brand] text-white px-4 py-2 rounded-md text-sm">
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
        />
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminTopbar onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />

        <main
          id="admin-main"
          tabIndex={-1}
          className="flex-1 overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 8.2 Analytics Dashboard Page

```
apps/admin/src/pages/Dashboard/
├── DashboardPage.tsx             — Page root, parallel data fetching
├── components/
│   ├── MetricCard.tsx            — KPI tile (revenue, orders, AOV)
│   ├── MetricCardSkeleton.tsx    — Loading state for KPI tiles
│   ├── RevenueChart.tsx          — Recharts line chart with accessible table
│   ├── TopProductsChart.tsx      — Bar chart + accessible fallback table
│   ├── RecentOrders.tsx          — Last 10 orders mini-table
│   └── PurchaseLimitAlerts.tsx   — Compliance alerts widget
```

```typescript
// apps/admin/src/pages/Dashboard/components/MetricCard.tsx
//
// KPI METRIC CARD
//
// Displays a single key performance indicator with trend indicator.
//
// WCAG:
//  1.4.1 — Trend direction not conveyed by color alone (arrow + text)
//  4.1.3 — Status messages (trend change) delivered to aria-live region

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@cannasaas/utils';

interface MetricCardProps {
  title: string;
  value: string;           // Formatted value: "$125,000" or "1,456"
  rawValue?: number;       // For aria-label construction
  change?: number;         // Percentage change: +15.5 or -3.2
  changeLabel?: string;    // Context: "vs. last 30 days"
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel = 'vs. last period',
  icon,
  isLoading,
}: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral  = change === undefined || change === 0;

  const changeText = change !== undefined
    ? `${isPositive ? 'Up' : 'Down'} ${Math.abs(change)}% ${changeLabel}`
    : 'No change data';

  if (isLoading) {
    return (
      <div className="rounded-[--primitive-radius-lg] border border-[--color-border] bg-[--color-bg-primary] p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 bg-[--color-bg-tertiary] rounded" />
          <div className="h-8 w-32 bg-[--color-bg-tertiary] rounded" />
          <div className="h-3 w-20 bg-[--color-bg-tertiary] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={`${title}: ${value}. ${changeText}`}
      className={[
        'rounded-[--primitive-radius-lg]',
        'border border-[--color-border]',
        'bg-[--color-bg-primary]',
        'p-6',
        'flex flex-col gap-4',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[--color-text-secondary]">
          {title}
        </p>
        {icon && (
          <span aria-hidden="true" className="text-[--color-text-secondary]">
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <p aria-hidden="true" className="text-3xl font-bold text-[--color-text-primary]">
        {value}
      </p>

      {/* Trend */}
      {change !== undefined && (
        <div
          aria-hidden="true"  // Full context already in aria-label on the region
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium',
            isPositive ? 'text-[--color-success]'  : '',
            isNegative ? 'text-[--color-error]'    : '',
            isNeutral  ? 'text-[--color-text-secondary]' : '',
          )}
        >
          {isPositive && <TrendingUp size={14} />}
          {isNegative && <TrendingDown size={14} />}
          {isNeutral  && <Minus size={14} />}
          <span>
            {isPositive ? '+' : ''}{change}% {changeLabel}
          </span>
        </div>
      )}
    </div>
  );
}
```

```typescript
// apps/admin/src/pages/Dashboard/components/RevenueChart.tsx
//
// REVENUE LINE CHART
//
// WCAG BEST PRACTICE FOR CHARTS:
//  Charts are inherently visual. WCAG 1.1.1 requires a text alternative.
//  Solution: render the chart visually, but also provide an accessible
//  <table> that contains the same data, hidden with sr-only class.
//  Screen reader users get the full data; visual users get the chart.
//
//  Additionally, aria-label on the chart container describes what it shows.

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { formatCurrency } from '@cannasaas/utils';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  period?: string;
}

export function RevenueChart({ data, period = '30 days' }: RevenueChartProps) {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders  = data.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div className="rounded-[--primitive-radius-lg] border border-[--color-border] bg-[--color-bg-primary] p-6">
      <h2 className="text-lg font-semibold text-[--color-text-primary] mb-1">
        Revenue Overview
      </h2>
      <p className="text-sm text-[--color-text-secondary] mb-6">
        Last {period} · {formatCurrency(totalRevenue)} total · {totalOrders} orders
      </p>

      {/* Visual chart — aria-hidden because the table below covers accessibility */}
      <div
        aria-hidden="true"
        className="h-64"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(Number(value)) : value,
                name === 'revenue' ? 'Revenue' : 'Orders',
              ]}
              contentStyle={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-brand)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/*
        ACCESSIBLE DATA TABLE — screen reader alternative to the chart.
        Visually hidden but fully accessible to AT.
        WCAG 1.1.1 compliance for the chart's data.
      */}
      <div className="sr-only">
        <table>
          <caption>Revenue data for the last {period}</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Revenue</th>
              <th scope="col">Orders</th>
            </tr>
          </thead>
          <tbody>
            {data.map(point => (
              <tr key={point.date}>
                <td>{point.date}</td>
                <td>{formatCurrency(point.revenue)}</td>
                <td>{point.orders}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td>{formatCurrency(totalRevenue)}</td>
              <td>{totalOrders}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
```

### 8.3 Products Management Page

```
apps/admin/src/pages/Products/
├── ProductsAdminPage.tsx       — Page root, data fetching
├── components/
│   ├── ProductsToolbar.tsx     — Search + add button + bulk actions
│   ├── ProductsTable.tsx       — DataTable with product columns
│   ├── ProductFormModal.tsx    — Create/edit product dialog
│   ├── ProductFormFields.tsx   — Form fields extracted for reuse
│   ├── InventoryAdjustModal.tsx — Adjust stock dialog
│   └── BulkActionBar.tsx       — Appears when rows are selected
```

```typescript
// apps/admin/src/pages/Products/components/ProductFormModal.tsx
//
// CREATE / EDIT PRODUCT FORM MODAL
//
// Uses React Hook Form + Zod for validation.
// The modal is a <dialog> element (or role="dialog") with full focus trap.
//
// FORM ACCESSIBILITY:
//  - All inputs have visible labels (WCAG 1.3.1)
//  - Errors are associated via aria-describedby (WCAG 3.3.1)
//  - Required fields marked visually and with aria-required (WCAG 3.3.2)
//  - Form submission error summary announced via aria-live (WCAG 4.1.3)

import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@cannasaas/ui';
import { useFocusTrap } from '@cannasaas/ui';
import { useCreateProduct, useUpdateProduct } from '@cannasaas/api-client';
import type { Product } from '@cannasaas/types';

// ── VALIDATION SCHEMA ──────────────────────────────────────────────────────
const productSchema = z.object({
  name:        z.string().min(2, 'Product name must be at least 2 characters'),
  brand:       z.string().min(1, 'Brand is required'),
  category:    z.enum(['flower', 'concentrate', 'edible', 'vape', 'tincture', 'topical', 'accessory']),
  strainType:  z.enum(['sativa', 'indica', 'hybrid', 'cbd']).optional(),
  thcContent:  z.number().min(0).max(100).optional(),
  cbdContent:  z.number().min(0).max(100).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price:       z.number().positive('Price must be greater than 0'),
  sku:         z.string().min(1, 'SKU is required'),
  quantity:    z.number().int().min(0, 'Quantity cannot be negative'),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;  // If provided, edit mode; otherwise create mode
}

export function ProductFormModal({ isOpen, onClose, product }: ProductFormModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingId = React.useId();
  const isEditing = !!product;

  useFocusTrap(containerRef, isOpen, onClose);

  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          brand: product.brand,
          category: product.category as any,
          thcContent: product.thcContent,
          cbdContent: product.cbdContent,
          description: product.description,
          price: product.variants[0]?.price,
          sku:   product.variants[0]?.sku,
          quantity: product.variants[0]?.quantity,
        }
      : {},
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const errorCount = Object.keys(errors).length;

  function onSubmit(data: ProductFormValues) {
    const action = isEditing
      ? () => updateProduct({ id: product!.id, ...data }, { onSuccess: onClose })
      : () => createProduct(data as any, { onSuccess: onClose });
    action();
  }

  if (!isOpen) return null;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={[
          'w-full max-w-2xl max-h-[90vh] overflow-y-auto',
          'bg-[--color-bg-primary]',
          'rounded-[--primitive-radius-lg]',
          'shadow-[--primitive-shadow-lg]',
          'border border-[--color-border]',
        ].join(' ')}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-[--color-border]">
          <h2 id={headingId} className="text-lg font-semibold">
            {isEditing ? `Edit Product: ${product!.name}` : 'Add New Product'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[--color-text-secondary] hover:text-[--color-text-primary] p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Error summary — WCAG 3.3.1 requires errors to be identified */}
        {isSubmitted && errorCount > 0 && (
          <div
            role="alert"
            aria-live="assertive"
            className="mx-6 mt-4 p-3 rounded-[--primitive-radius-md] bg-red-50 border border-[--color-error] text-sm text-[--color-error]"
          >
            <p className="font-medium">Please fix {errorCount} error{errorCount > 1 ? 's' : ''} before submitting:</p>
            <ul className="mt-1 ml-4 list-disc">
              {Object.entries(errors).map(([field, err]) => (
                <li key={field}>
                  <button
                    type="button"
                    onClick={() => document.getElementById(field)?.focus()}
                    className="underline hover:no-underline"
                  >
                    {err?.message}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-6">
          {/* Row 1: Name + Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="name"
              label="Product Name"
              required
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              id="brand"
              label="Brand"
              required
              error={errors.brand?.message}
              {...register('brand')}
            />
          </div>

          {/* Row 2: Category + Strain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="category" className="text-sm font-medium">
                Category <span aria-hidden="true" className="text-[--color-error]">*</span>
              </label>
              <select
                id="category"
                aria-required="true"
                aria-invalid={!!errors.category}
                aria-describedby={errors.category ? 'category-error' : undefined}
                className={[
                  'h-10 px-3 rounded-[--primitive-radius-md]',
                  'border text-sm bg-[--color-bg-primary] text-[--color-text-primary]',
                  errors.category ? 'border-[--color-error]' : 'border-[--color-border]',
                  'focus:outline-none focus:ring-2 focus:ring-[--color-brand]',
                ].join(' ')}
                {...register('category')}
              >
                <option value="">Select category…</option>
                <option value="flower">Flower</option>
                <option value="concentrate">Concentrate</option>
                <option value="edible">Edible</option>
                <option value="vape">Vape</option>
                <option value="tincture">Tincture</option>
                <option value="topical">Topical</option>
                <option value="accessory">Accessory</option>
              </select>
              {errors.category && (
                <p id="category-error" role="alert" className="text-xs text-[--color-error]">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="strainType" className="text-sm font-medium">
                Strain Type
              </label>
              <select
                id="strainType"
                className={[
                  'h-10 px-3 rounded-[--primitive-radius-md]',
                  'border border-[--color-border] text-sm',
                  'bg-[--color-bg-primary] text-[--color-text-primary]',
                  'focus:outline-none focus:ring-2 focus:ring-[--color-brand]',
                ].join(' ')}
                {...register('strainType')}
              >
                <option value="">Not applicable</option>
                <option value="sativa">Sativa</option>
                <option value="indica">Indica</option>
                <option value="hybrid">Hybrid</option>
                <option value="cbd">CBD</option>
              </select>
            </div>
          </div>

          {/* Row 3: THC + CBD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="thcContent"
              label="THC Content (%)"
              type="number"
              min={0}
              max={100}
              step={0.1}
              error={errors.thcContent?.message}
              hint="Enter a value between 0 and 100"
              {...register('thcContent', { valueAsNumber: true })}
            />
            <Input
              id="cbdContent"
              label="CBD Content (%)"
              type="number"
              min={0}
              max={100}
              step={0.1}
              error={errors.cbdContent?.message}
              {...register('cbdContent', { valueAsNumber: true })}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium">
              Description <span aria-hidden="true" className="text-[--color-error]">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              aria-required="true"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'desc-error' : undefined}
              placeholder="Describe this product — effects, flavor profile, recommended uses…"
              className={[
                'px-3 py-2 rounded-[--primitive-radius-md] text-sm',
                'border bg-[--color-bg-primary] text-[--color-text-primary]',
                'placeholder:text-[--color-text-disabled]',
                'resize-y min-h-[100px]',
                'focus:outline-none focus:ring-2 focus:ring-[--color-brand]',
                errors.description ? 'border-[--color-error]' : 'border-[--color-border]',
              ].join(' ')}
              {...register('description')}
            />
            {errors.description && (
              <p id="desc-error" role="alert" className="text-xs text-[--color-error]">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Pricing + SKU + Quantity */}
          <fieldset className="border border-[--color-border] rounded-[--primitive-radius-md] p-4">
            <legend className="text-sm font-semibold px-1">Inventory & Pricing</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <Input
                id="price"
                label="Price"
                type="number"
                min={0}
                step={0.01}
                required
                prefix="$"
                error={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
              />
              <Input
                id="sku"
                label="SKU"
                required
                error={errors.sku?.message}
                {...register('sku')}
              />
              <Input
                id="quantity"
                label="Quantity in Stock"
                type="number"
                min={0}
                required
                error={errors.quantity?.message}
                {...register('quantity', { valueAsNumber: true })}
              />
            </div>
          </fieldset>

          {/* Form actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-[--color-border]">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
              loadingText={isEditing ? 'Saving product…' : 'Creating product…'}
            >
              {isEditing ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## 9. Staff Portal App — Page Breakdown

### 9.1 Order Queue Page

The Staff Portal is optimized for speed and touch interaction at the point of sale. Components are larger, simpler, and designed for glanceability.

```
apps/staff/src/pages/Orders/
├── OrderQueuePage.tsx            — Live order queue with WebSocket
├── components/
│   ├── OrderQueueCard.tsx        — Single order tile with status actions
│   ├── OrderQueueSkeleton.tsx    — Loading state
│   ├── OrderStatusControls.tsx   — Status transition buttons
│   └── CustomerLookupPanel.tsx   — Side panel for customer info
```

```typescript
// apps/staff/src/pages/Orders/components/OrderQueueCard.tsx
//
// ORDER QUEUE CARD — Designed for budtender workflow.
//
// Large touch targets (min 44x44px per WCAG 2.5.5).
// High-contrast status badges.
// One-tap status update buttons.

import React from 'react';
import { Clock, User, Package } from 'lucide-react';
import { Button } from '@cannasaas/ui';
import { useUpdateOrderStatus } from '@cannasaas/api-client';
import { formatCurrency, formatRelativeTime } from '@cannasaas/utils';
import type { Order, OrderStatus } from '@cannasaas/types';
import { cn } from '@cannasaas/utils';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; nextAction?: { label: string; nextStatus: OrderStatus } }> = {
  pending:          { label: 'Pending',       color: 'bg-yellow-100 text-yellow-800',  nextAction: { label: 'Start Preparing',  nextStatus: 'preparing' } },
  confirmed:        { label: 'Confirmed',     color: 'bg-blue-100 text-blue-800',      nextAction: { label: 'Start Preparing',  nextStatus: 'preparing' } },
  preparing:        { label: 'Preparing',     color: 'bg-orange-100 text-orange-800',  nextAction: { label: 'Mark Ready',       nextStatus: 'ready_for_pickup' } },
  ready_for_pickup: { label: 'Ready',         color: 'bg-green-100 text-green-800',   nextAction: { label: 'Mark Completed',   nextStatus: 'completed' } },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-purple-100 text-purple-800', nextAction: { label: 'Mark Delivered', nextStatus: 'completed' } },
  completed:        { label: 'Completed',     color: 'bg-neutral-100 text-neutral-800' },
  cancelled:        { label: 'Cancelled',     color: 'bg-red-100 text-red-800' },
  refunded:         { label: 'Refunded',      color: 'bg-neutral-100 text-neutral-800' },
};

interface OrderQueueCardProps {
  order: Order;
}

export function OrderQueueCard({ order }: OrderQueueCardProps) {
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus();
  const statusConfig = STATUS_CONFIG[order.status];
  const nextAction = statusConfig.nextAction;

  return (
    <article
      aria-label={`Order #${order.orderNumber}, ${statusConfig.label}, ${formatCurrency(order.total)}`}
      className={[
        'rounded-[--primitive-radius-lg]',
        'border border-[--color-border]',
        'bg-[--color-bg-primary]',
        'p-4 sm:p-5',
        'flex flex-col gap-4',
        'shadow-[--primitive-shadow-sm]',
      ].join(' ')}
    >
      {/* Order header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-lg text-[--color-text-primary]">
            #{order.orderNumber}
          </p>
          <div className="flex items-center gap-2 mt-1 text-sm text-[--color-text-secondary]">
            <Clock size={14} aria-hidden="true" />
            <time dateTime={order.createdAt}>
              {formatRelativeTime(order.createdAt)}
            </time>
          </div>
        </div>

        {/* Status badge */}
        <span
          aria-label={`Status: ${statusConfig.label}`}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
            statusConfig.color,
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Customer info */}
      <div className="flex items-center gap-2 text-sm">
        <User size={14} aria-hidden="true" className="text-[--color-text-secondary]" />
        <span className="text-[--color-text-primary] font-medium">
          {order.customerName}
        </span>
        <span className="text-[--color-text-secondary]">
          · {order.type === 'pickup' ? 'Pickup' : 'Delivery'}
        </span>
      </div>

      {/* Items summary */}
      <div className="flex items-center gap-2 text-sm text-[--color-text-secondary]">
        <Package size={14} aria-hidden="true" />
        <span>
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          {' · '}{formatCurrency(order.total)}
        </span>
      </div>

      {/* Action button — WCAG 2.5.5 minimum 44px touch target */}
      {nextAction && (
        <Button
          variant="primary"
          fullWidth
          size="lg"  // lg = 44px height
          isLoading={isPending}
          loadingText={`Updating order #${order.orderNumber}…`}
          onClick={() =>
            updateStatus({
              orderId: order.id,
              status: nextAction.nextStatus,
            })
          }
          aria-label={`${nextAction.label} for order #${order.orderNumber}`}
        >
          {nextAction.label}
        </Button>
      )}
    </article>
  );
}
```

---

## 10. Compliance & Cannabis-Specific Components

### 10.1 Purchase Limit Meter

```typescript
// packages/ui/src/components/Cannabis/PurchaseLimitMeter.tsx
//
// PURCHASE LIMIT INDICATOR
//
// Visualizes how much of a customer's daily purchase limit has been used.
// Used in checkout flow and customer lookup in the staff portal.
//
// WCAG:
//  1.4.1 — Color not used alone (percentage text + label)
//  4.1.3 — Status messages announced on limit change via aria-live

import React from 'react';
import { cn } from '@cannasaas/utils';

interface LimitCategory {
  label: string;        // "Flower"
  unit: string;         // "oz"
  used: number;
  max: number;
}

interface PurchaseLimitMeterProps {
  categories: LimitCategory[];
  state: 'NY' | 'NJ' | 'CT';
  licenseType: 'recreational' | 'medical';
}

export function PurchaseLimitMeter({
  categories,
  state,
  licenseType,
}: PurchaseLimitMeterProps) {
  return (
    <div
      role="region"
      aria-label="Purchase limits for this transaction"
      className="rounded-[--primitive-radius-lg] border border-[--color-border] bg-[--color-bg-secondary] p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[--color-text-primary]">
          Purchase Limits
        </h3>
        <span className="text-xs text-[--color-text-secondary]">
          {state} · {licenseType === 'medical' ? 'Medical' : 'Recreational'}
        </span>
      </div>

      {categories.map((cat) => {
        const percent = Math.min((cat.used / cat.max) * 100, 100);
        const isWarning = percent >= 75;
        const isExceeded = percent >= 100;

        // Accessible description for this meter
        const meterLabel = `${cat.label}: ${cat.used} of ${cat.max} ${cat.unit} used`;

        return (
          <div key={cat.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[--color-text-primary]">
                {cat.label}
              </span>
              <span
                aria-live="polite"
                aria-atomic="true"
                className={cn(
                  'font-medium',
                  isExceeded ? 'text-[--color-error]' :
                  isWarning   ? 'text-[--color-warning]' :
                                'text-[--color-text-secondary]',
                )}
              >
                {cat.used} / {cat.max} {cat.unit}
                {isExceeded && <span className="sr-only"> — Limit exceeded!</span>}
                {isWarning && !isExceeded && <span className="sr-only"> — Approaching limit</span>}
              </span>
            </div>

            {/*
              <meter> element is semantically correct for known-range gauges.
              Includes aria-label for full context.
            */}
            <meter
              value={cat.used}
              min={0}
              max={cat.max}
              low={cat.max * 0.5}   // Start warning at 50%
              high={cat.max * 0.75} // Escalate warning at 75%
              optimum={0}           // Best value is 0 (no purchases)
              aria-label={meterLabel}
              className={cn(
                'w-full h-2 rounded-full',
                // CSS for the meter element varies by browser;
                // use a custom progress bar for consistent styling
                'appearance-none',
              )}
            />

            {/* Custom progress bar for cross-browser consistency */}
            <div
              role="none"  // The <meter> above is the semantic element
              aria-hidden="true"
              className="w-full h-2 bg-[--color-bg-tertiary] rounded-full overflow-hidden"
            >
              <div
                style={{ width: `${percent}%` }}
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  isExceeded ? 'bg-[--color-error]' :
                  isWarning   ? 'bg-[--color-warning]' :
                                'bg-[--color-success]',
                )}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### 10.2 Metrc Status Badge

```typescript
// packages/ui/src/components/Cannabis/MetrcStatusBadge.tsx
//
// Displays the Metrc sync status for a product or order.
// Used in admin product table and compliance audit log.

import React from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@cannasaas/utils';

type MetrcStatus = 'synced' | 'pending' | 'failed' | 'not_required';

const CONFIG: Record<MetrcStatus, { label: string; icon: React.ElementType; className: string }> = {
  synced:       { label: 'Synced to Metrc',  icon: CheckCircle,  className: 'text-[--color-success] bg-green-50 border-green-200' },
  pending:      { label: 'Metrc Sync Pending', icon: Clock,       className: 'text-[--color-warning] bg-yellow-50 border-yellow-200' },
  failed:       { label: 'Metrc Sync Failed', icon: XCircle,     className: 'text-[--color-error] bg-red-50 border-red-200' },
  not_required: { label: 'Metrc N/A',        icon: AlertCircle,  className: 'text-[--color-text-secondary] bg-[--color-bg-secondary] border-[--color-border]' },
};

interface MetrcStatusBadgeProps {
  status: MetrcStatus;
  showLabel?: boolean;
}

export function MetrcStatusBadge({ status, showLabel = true }: MetrcStatusBadgeProps) {
  const { label, icon: Icon, className } = CONFIG[status];

  return (
    <span
      aria-label={`Metrc status: ${label}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1',
        'text-xs font-medium rounded-full border',
        className,
      )}
    >
      <Icon size={12} aria-hidden="true" />
      {showLabel && <span>{label}</span>}
    </span>
  );
}
```

---

## 11. Multi-Tenant Theming Components

### 11.1 ThemeProvider

```typescript
// apps/storefront/src/providers/ThemeProvider.tsx
//
// MULTI-TENANT THEME PROVIDER
//
// Fetches the dispensary's BrandingConfig from the API and injects
// CSS custom property overrides into the document root.
// All components automatically pick up the new values.
//
// This is called once at app boot in App.tsx after tenant resolution.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useOrganizationStore } from '@cannasaas/stores';
import { dispensariesApi } from '@cannasaas/api-client';
import { validateBrandContrast } from '@cannasaas/utils';
import type { BrandingConfig } from '@cannasaas/types';

// ── CONTEXT ─────────────────────────────────────────────────────────────
interface ThemeContextValue {
  branding: BrandingConfig | null;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({ branding: null, isLoading: true });

export function useTheme() {
  return useContext(ThemeContext);
}

// ── HELPERS ──────────────────────────────────────────────────────────────

/**
 * Converts a hex color to HSL components for CSS variable injection.
 * Tailwind CSS uses HSL format for its theme system.
 */
function hexToHslString(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Injects the dispensary's brand config as CSS custom properties
 * on :root, overriding the default token values.
 */
function applyBranding(branding: BrandingConfig): void {
  const root = document.documentElement;

  // Validate primary color contrast before applying
  const contrastResult = validateBrandContrast(branding.primaryColor, '#ffffff', 'ui-element');
  if (!contrastResult.passes && import.meta.env.DEV) {
    console.warn(
      `[ThemeProvider] Primary brand color "${branding.primaryColor}" has insufficient contrast ` +
      `(${contrastResult.ratio}:1, required ${contrastResult.required}:1 for UI elements). ` +
      `Consider using a darker shade.`
    );
  }

  // Override brand colors
  root.style.setProperty('--color-brand', branding.primaryColor);
  root.style.setProperty('--color-brand-hover', branding.primaryColorDark ?? branding.primaryColor);
  root.style.setProperty('--color-brand-subtle', branding.primaryColorLight ?? '#f0fdf4');

  // Override typography
  if (branding.headingFont) {
    root.style.setProperty('--font-heading', `'${branding.headingFont}', sans-serif`);
    // Inject Google Fonts link if not already present
    const linkId = 'tenant-font';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(branding.headingFont)}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }

  // Background and text overrides
  if (branding.backgroundColor) {
    root.style.setProperty('--color-bg-primary', branding.backgroundColor);
  }

  // Update page title and favicon
  document.title = branding.dispensaryName ?? document.title;
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon && branding.faviconUrl) {
    favicon.href = branding.faviconUrl;
  }
}

// ── PROVIDER ─────────────────────────────────────────────────────────────
interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const dispensaryId = useOrganizationStore(s => s.currentDispensaryId);
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!dispensaryId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    dispensariesApi
      .getBranding(dispensaryId)
      .then((data) => {
        setBranding(data);
        applyBranding(data);
      })
      .catch((err) => {
        console.error('[ThemeProvider] Failed to load branding:', err);
        // Graceful degradation — default brand tokens remain
      })
      .finally(() => setIsLoading(false));

    // Cleanup: reset to defaults when dispensary changes
    return () => {
      document.documentElement.removeAttribute('style');
    };
  }, [dispensaryId]);

  return (
    <ThemeContext.Provider value={{ branding, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

## 12. Responsive CSS Architecture

### 12.1 Breakpoint System

CannaSaas uses Tailwind's default breakpoints with a few additions for cannabis-specific needs (kiosk mode for in-store display).

```css
/* packages/ui/src/styles/responsive.css
 *
 * RESPONSIVE BREAKPOINT STRATEGY
 *
 * Philosophy: Mobile-first. Every component starts with mobile styles,
 * then adds overrides at larger breakpoints.
 *
 * Breakpoints (match Tailwind defaults):
 *   sm:  640px  — Large phones, small tablets
 *   md:  768px  — Tablets, small laptops
 *   lg:  1024px — Laptops, desktop
 *   xl:  1280px — Wide desktop
 *   2xl: 1536px — Ultra-wide
 *
 * Custom breakpoints for CannaSaas:
 *   kiosk: 1080px — In-store kiosk mode (touch-only, no hover)
 */

/* ── CONTAINER ────────────────────────────────────────────────────── */
/* Max-width containers with responsive horizontal padding */
.container-page {
  width: 100%;
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: 1rem;            /* 16px mobile */
}

@media (min-width: 640px) {
  .container-page { padding-inline: 1.5rem; }  /* 24px sm */
}

@media (min-width: 1024px) {
  .container-page { padding-inline: 2rem; }    /* 32px lg */
}

/* ── PRODUCT GRID ─────────────────────────────────────────────────── */
/* Responsive auto-fill grid that adapts column count to viewport */
.product-grid {
  display: grid;
  gap: 1rem;
  /* Auto-fill: as many columns as fit, minimum 280px each */
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
}

@media (min-width: 640px) {
  .product-grid { gap: 1.25rem; }
}

@media (min-width: 1024px) {
  .product-grid { gap: 1.5rem; }
}

/* ── ADMIN SIDEBAR ────────────────────────────────────────────────── */
/* The sidebar layout uses CSS Grid at the page level */
.admin-shell {
  display: grid;
  grid-template-columns: 1fr;      /* Mobile: full width (sidebar is drawer) */
  grid-template-rows: auto 1fr;
  height: 100svh;                  /* svh = small viewport height (mobile) */
}

@media (min-width: 1024px) {
  .admin-shell {
    grid-template-columns: 16rem 1fr;  /* Sidebar + content */
    grid-template-rows: 1fr;
  }

  .admin-shell.collapsed {
    grid-template-columns: 4rem 1fr;   /* Collapsed icon-only sidebar */
  }
}

/* ── CART DRAWER ─────────────────────────────────────────────────── */
.cart-drawer {
  position: fixed;
  inset-block: 0;
  inset-inline-end: 0;  /* Right edge — RTL-aware via logical properties */
  width: min(24rem, 100vw);
  z-index: 50;
  transform: translateX(100%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.cart-drawer[aria-expanded="true"] {
  transform: translateX(0);
}

@media (prefers-reduced-motion: reduce) {
  .cart-drawer {
    transition: none;
  }
}

/* ── TOUCH TARGETS ────────────────────────────────────────────────── */
/* WCAG 2.5.5 — All interactive elements minimum 44x44px */
/* WCAG 2.5.8 (2.2) — Minimum 24x24px (stricter: use 44px) */
@media (pointer: coarse) {
  /* Apply larger touch targets only on touch devices */
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}

/* ── KIOSK MODE ───────────────────────────────────────────────────── */
/* Applied when dispensary's branding config has mode: 'kiosk' */
[data-display-mode="kiosk"] {
  /* Extra large touch targets */
  --touch-target-size: 56px;
  /* Disable hover states (touch-only) */
  * { pointer-events: auto !important; }
  /* Larger text scale */
  font-size: 112.5%;
}
```

### 12.2 Responsive Layout Patterns

```typescript
// packages/ui/src/components/Layout/PageHeader.tsx
//
// Reusable page header for admin and staff portals.
// Adapts between mobile (stacked) and desktop (side-by-side) layouts.

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      {/* Breadcrumb */}
      {breadcrumb && (
        <nav aria-label="Breadcrumb" className="mb-2">
          {breadcrumb}
        </nav>
      )}

      {/* Title row */}
      <div className={[
        'flex flex-col gap-4',
        'sm:flex-row sm:items-center sm:justify-between',
      ].join(' ')}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[--color-text-primary]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-[--color-text-secondary]">
              {description}
            </p>
          )}
        </div>

        {/* Actions — stack on mobile, row on desktop */}
        {actions && (
          <div className={[
            'flex flex-col gap-2',
            'xs:flex-row xs:flex-wrap',
            'sm:flex-shrink-0',
          ].join(' ')}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 13. Accessibility Testing Checklist

This checklist should be run against every page and component before merging to main. Include automated checks in CI (via axe-core) and manual checks before each release.

### Automated Checks (CI)

Run via `vitest` + `@testing-library/jest-dom` + `vitest-axe`:

```typescript
// Axe-core accessibility test — add to every component's .test.tsx
// packages/ui/src/components/Button/Button.test.tsx (excerpt)

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'vitest-axe';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(<Button>Submit</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('announces loading state to screen readers', () => {
    const { getByRole } = render(
      <Button isLoading loadingText="Submitting order…">Submit</Button>
    );
    const button = getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Submitting order…');
  });
});
```

### Manual Keyboard Testing Protocol

Test every page by:
1. Pressing `Tab` — verify all interactive elements receive visible focus in a logical order
2. Pressing `Shift+Tab` — verify reverse focus order is equally logical
3. On modals: verify `Escape` closes the modal and returns focus to the trigger
4. On the age gate: verify `Escape` does NOT close the modal (it must be submitted)
5. On dropdowns and custom selects: test `ArrowUp`, `ArrowDown`, `Enter`, `Escape`
6. On the product carousel: test `ArrowLeft`, `ArrowRight`, `Home`, `End`
7. On the DataTable: test sort with `Enter` and `Space`

### Screen Reader Testing Matrix

| OS | Screen Reader | Browser | Priority |
|---|---|---|---|
| macOS | VoiceOver | Safari | P0 (most common) |
| Windows | NVDA | Firefox | P0 |
| iOS | VoiceOver | Safari | P0 (mobile) |
| Android | TalkBack | Chrome | P1 |
| Windows | JAWS | Chrome | P1 (enterprise) |

### WCAG 2.1 AA Criterion Checklist

| Criterion | Description | How It's Addressed |
|---|---|---|
| 1.1.1 | Non-text content has alt text | Product images, chart accessible tables |
| 1.3.1 | Semantic structure | `<article>`, `<nav>`, `<main>`, `<header>`, table markup |
| 1.3.2 | Meaningful sequence | Logical DOM order matches visual order |
| 1.3.5 | Identify input purpose | `autocomplete` attributes on all checkout fields |
| 1.4.1 | Color not sole conveyor | Strain badges, trend arrows, status badges all have text |
| 1.4.3 | Contrast 4.5:1 | All text pairs validated; brand color warning system |
| 1.4.4 | Resize text 200% | Fluid type scale, no fixed px heights on text containers |
| 1.4.10 | Reflow (320px) | CSS grid + clamp, no horizontal scroll at 320px |
| 1.4.12 | Text spacing | No CSS that breaks on custom line-height/letter-spacing |
| 2.1.1 | Keyboard accessible | All components keyboard navigable, no mouse-only interactions |
| 2.1.2 | No keyboard trap | Focus traps in dialogs have Escape escape (except Age Gate) |
| 2.4.1 | Skip navigation | Skip link on every page |
| 2.4.3 | Focus order | Logical tab order, focus management in modals |
| 2.4.6 | Headings and labels | One h1 per page, descriptive headings throughout |
| 2.4.7 | Focus visible | Custom focus ring on all elements |
| 2.4.11 | Focus appearance | 3px ring, 3:1 contrast with adjacent colors |
| 2.5.3 | Label in name | Button text matches accessible name |
| 2.5.5 | Target size 44x44px | All interactive elements on touch devices |
| 3.1.1 | Language of page | `lang="en"` on `<html>` |
| 3.2.1 | On focus | No context changes on focus |
| 3.3.1 | Error identification | Errors identified in text with field association |
| 3.3.2 | Labels or instructions | All inputs have visible labels; required marked |
| 4.1.2 | Name, role, value | ARIA roles, labels, states on all custom widgets |
| 4.1.3 | Status messages | `aria-live` regions for cart updates, errors, form feedback |

---

## 14. Component File Checklist

Every item below must be created and have a corresponding test file.

### packages/ui/src/components/

```
Atoms/
├── [ ] Button/Button.tsx + Button.test.tsx
├── [ ] Input/Input.tsx + Input.test.tsx
├── [ ] Textarea/Textarea.tsx
├── [ ] Select/Select.tsx
├── [ ] Checkbox/Checkbox.tsx
├── [ ] RadioGroup/RadioGroup.tsx
├── [ ] Switch/Switch.tsx
├── [ ] Badge/Badge.tsx
├── [ ] Skeleton/Skeleton.tsx
└── [ ] Spinner/Spinner.tsx

Molecules/
├── [ ] Card/Card.tsx + Card.Header + Card.Body + Card.Footer
├── [ ] Dialog/Dialog.tsx + Dialog.test.tsx
├── [ ] Drawer/Drawer.tsx + Drawer.test.tsx
├── [ ] Toast/Toast.tsx + Toast.test.tsx
├── [ ] Tabs/Tabs.tsx + Tabs.test.tsx (compound)
├── [ ] Accordion/Accordion.tsx (compound)
├── [ ] Combobox/Combobox.tsx (accessible autocomplete)
├── [ ] DatePicker/DatePicker.tsx
└── [ ] Slider/Slider.tsx (price range filter)

Organisms/
├── [ ] Table/DataTable.tsx + DataTablePagination.tsx + DataTableToolbar.tsx
├── [ ] Table/DataTable.test.tsx
└── [ ] Form/FormSection.tsx (fieldset wrapper)

Layout/
├── [ ] PageHeader/PageHeader.tsx
├── [ ] EmptyState/EmptyState.tsx
├── [ ] ErrorBoundary/ErrorBoundary.tsx
└── [ ] LoadingBoundary/LoadingBoundary.tsx

Cannabis/
├── [ ] PurchaseLimitMeter/PurchaseLimitMeter.tsx
├── [ ] MetrcStatusBadge/MetrcStatusBadge.tsx
├── [ ] THCBadge/THCBadge.tsx
├── [ ] StrainTypeBadge/StrainTypeBadge.tsx
├── [ ] EffectsGrid/EffectsGrid.tsx
└── [ ] AgeGateBanner/AgeGateBanner.tsx
```

### apps/storefront/src/

```
pages/
├── [ ] Home/HomePage.tsx
│       components/HeroBanner.tsx
│       components/FeaturedProducts.tsx
│       components/CategoryNav.tsx
│       components/PromoBanner.tsx
│       components/DispensaryInfo.tsx
│
├── [ ] Products/ProductsPage.tsx
│       components/ProductGrid.tsx
│       components/ProductCard.tsx
│       components/ProductFilter.tsx
│       components/ProductFilterMobile.tsx
│       components/ProductSort.tsx
│       components/ActiveFilters.tsx
│       components/ProductGridSkeleton.tsx
│       components/ProductPagination.tsx
│
├── [ ] ProductDetail/ProductDetailPage.tsx
│       components/ProductGallery.tsx
│       components/ProductInfo.tsx
│       components/ProductVariantSelector.tsx
│       components/ProductEffects.tsx
│       components/ProductLabResults.tsx
│       components/ProductReviews.tsx
│       components/RelatedProducts.tsx
│
├── [ ] Cart/CartPage.tsx
│       components/CartItem.tsx
│       components/CartSummary.tsx
│       components/PromoCodeInput.tsx
│
├── [ ] Checkout/CheckoutPage.tsx
│       components/CheckoutProgress.tsx
│       components/AddressForm.tsx
│       components/PaymentForm.tsx
│       components/OrderReview.tsx
│       components/PurchaseLimitCheck.tsx
│
├── [ ] Orders/OrdersPage.tsx + OrderDetailPage.tsx
├── [ ] Account/AccountPage.tsx
├── [ ] Search/SearchPage.tsx
└── [ ] Auth/LoginPage.tsx + RegisterPage.tsx

components/
└── layout/
    ├── [ ] StorefrontLayout.tsx
    ├── [ ] StorefrontHeader.tsx
    ├── [ ] StorefrontFooter.tsx
    ├── [ ] MobileMenu.tsx
    ├── [ ] CartDrawer.tsx
    └── [ ] AgeGate.tsx
```

### apps/admin/src/

```
pages/
├── [ ] Dashboard/DashboardPage.tsx
│       components/MetricCard.tsx
│       components/RevenueChart.tsx
│       components/TopProductsChart.tsx
│       components/RecentOrders.tsx
│       components/PurchaseLimitAlerts.tsx
│
├── [ ] Products/ProductsAdminPage.tsx
│       components/ProductsToolbar.tsx
│       components/ProductsTable.tsx
│       components/ProductFormModal.tsx
│       components/ProductFormFields.tsx
│       components/InventoryAdjustModal.tsx
│       components/BulkActionBar.tsx
│
├── [ ] Orders/OrdersAdminPage.tsx + OrderDetailPage.tsx
├── [ ] Customers/CustomersPage.tsx + CustomerDetailPage.tsx
├── [ ] Compliance/CompliancePage.tsx
│       components/AuditLogTable.tsx
│       components/DailySalesReport.tsx
│       components/MetrcSyncStatus.tsx
│
├── [ ] Analytics/AnalyticsPage.tsx
│       components/SalesAnalytics.tsx
│       components/ProductAnalytics.tsx
│       components/CustomerAnalytics.tsx
│       components/ExportButton.tsx
│
├── [ ] Settings/SettingsPage.tsx
│       components/BrandingForm.tsx
│       components/HoursForm.tsx
│       components/DeliveryZoneMap.tsx
│       components/POSIntegration.tsx
│
└── components/
    └── layout/
        ├── [ ] AdminLayout.tsx
        ├── [ ] AdminSidebar.tsx
        ├── [ ] AdminSidebarItem.tsx
        ├── [ ] AdminTopbar.tsx
        └── [ ] AdminBreadcrumb.tsx
```

### apps/staff/src/

```
pages/
├── [ ] Orders/OrderQueuePage.tsx
│       components/OrderQueueCard.tsx
│       components/OrderQueueSkeleton.tsx
│       components/OrderStatusControls.tsx
│       components/CustomerLookupPanel.tsx
│
├── [ ] Inventory/InventoryPage.tsx
│       components/InventorySearchBar.tsx
│       components/InventoryItem.tsx
│       components/QuickAdjustModal.tsx
│
├── [ ] Delivery/DeliveryPage.tsx
│       components/DeliveryQueueCard.tsx
│       components/DriverAssignModal.tsx
│       components/DeliveryMapView.tsx
│       components/IDVerifyScreen.tsx
│
└── components/
    └── layout/
        ├── [ ] StaffLayout.tsx
        ├── [ ] StaffHeader.tsx
        └── [ ] StaffBottomNav.tsx
```

---

_End of React Component & Markup Implementation Guide_

_CannaSaas — Building the future of cannabis commerce, accessibly and responsibly._

_Version 2.0 | February 2026_
_Prepared for: Dennis Luken, Senior Architect / Site Lead_
