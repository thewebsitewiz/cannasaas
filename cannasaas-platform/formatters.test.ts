/**
 * @file src/utils/__tests__/formatters.test.ts
 * @description Unit tests for display-formatting utilities.
 *
 * Formatting functions are tiny but high-impact: incorrect currency formatting
 * or THC percentage display erodes trust. These tests run in < 1ms each and
 * provide a safety net for any future refactoring.
 *
 * Functions tested:
 *   formatCurrency       — USD price display ("$45.00", "$1,250.00")
 *   formatWeight         — cannabis weight display ("3.5g", "1 oz")
 *   formatThc            — THC percentage display ("24.5%", "< 0.3%")
 *   formatDate           — order/compliance date display
 *   hexToHSL             — theming utility (branding module)
 *   truncateText         — product description truncation
 *
 * @see src/utils/formatters.ts
 */

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatWeight,
  formatThc,
  formatDate,
  hexToHSL,
  truncateText,
} from '@/utils/formatters';

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------

describe('formatCurrency', () => {
  it('should format a whole dollar amount', () => {
    expect(formatCurrency(45)).toBe('$45.00');
  });

  it('should format a decimal amount with two decimal places', () => {
    expect(formatCurrency(45.5)).toBe('$45.50');
  });

  it('should format large amounts with comma separators', () => {
    expect(formatCurrency(1250.99)).toBe('$1,250.99');
  });

  it('should format zero as $0.00', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should round to the nearest cent', () => {
    // $45.005 → rounds to $45.01 (half-even rounding)
    expect(formatCurrency(45.005)).toBe('$45.01');
  });

  it('should handle negative amounts (refunds)', () => {
    expect(formatCurrency(-10.0)).toBe('-$10.00');
  });
});

// ---------------------------------------------------------------------------
// formatWeight
// ---------------------------------------------------------------------------

describe('formatWeight', () => {
  it('should display grams with one decimal place', () => {
    expect(formatWeight(3.5, 'g')).toBe('3.5g');
  });

  it('should display whole gram amounts without trailing zero', () => {
    expect(formatWeight(1, 'g')).toBe('1g');
  });

  it('should display ounces with fraction notation', () => {
    // 3.5g ≈ 1/8 oz — display the friendly marketing name
    expect(formatWeight(3.5, 'g', { showFriendlyOz: true })).toBe('1/8 oz');
  });

  it('should display milligrams for edibles', () => {
    expect(formatWeight(100, 'mg')).toBe('100mg');
  });

  it('should return a fallback for undefined weight', () => {
    expect(formatWeight(undefined, 'g')).toBe('—');
  });
});

// ---------------------------------------------------------------------------
// formatThc
// ---------------------------------------------------------------------------

describe('formatThc', () => {
  it('should format a standard THC percentage', () => {
    expect(formatThc(24.5)).toBe('24.5%');
  });

  it('should display "< 0.3%" for hemp-level THC', () => {
    expect(formatThc(0.2)).toBe('< 0.3%');
  });

  it('should display "N/A" when THC content is null', () => {
    expect(formatThc(null)).toBe('N/A');
  });

  it('should cap display at two decimal places', () => {
    expect(formatThc(24.555)).toBe('24.56%');
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('should format an ISO date string into a readable date', () => {
    // Use a fixed date to avoid locale-dependent test failures
    const result = formatDate('2026-02-15T14:32:00Z');
    // Acceptable outputs: "Feb 15, 2026" or "February 15, 2026"
    expect(result).toMatch(/feb(ruary)?\s+15,?\s+2026/i);
  });

  it('should return "Invalid date" for a malformed date string', () => {
    expect(formatDate('not-a-date')).toBe('Invalid date');
  });

  it('should return "—" for null/undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  it('should support a "short" format option', () => {
    const result = formatDate('2026-02-15T14:32:00Z', { format: 'short' });
    // Acceptable: "2/15/26" or "02/15/26"
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{2}/);
  });
});

// ---------------------------------------------------------------------------
// hexToHSL
// ---------------------------------------------------------------------------

describe('hexToHSL', () => {
  it('should convert a 6-digit hex colour to HSL', () => {
    // Pure red (#ff0000) → hsl(0, 100%, 50%)
    const result = hexToHSL('#ff0000');
    expect(result).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('should handle lowercase hex values', () => {
    expect(() => hexToHSL('#2d6a4f')).not.toThrow();
  });

  it('should convert white (#ffffff) to hsl(0, 0%, 100%)', () => {
    expect(hexToHSL('#ffffff')).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('should convert black (#000000) to hsl(0, 0%, 0%)', () => {
    expect(hexToHSL('#000000')).toEqual({ h: 0, s: 0, l: 0 });
  });

  it('should throw for an invalid hex string', () => {
    expect(() => hexToHSL('not-a-colour')).toThrow();
  });

  it('should support 3-digit shorthand hex (#fff)', () => {
    expect(hexToHSL('#fff')).toEqual({ h: 0, s: 0, l: 100 });
  });
});

// ---------------------------------------------------------------------------
// truncateText
// ---------------------------------------------------------------------------

describe('truncateText', () => {
  it('should return the original string if it is under the limit', () => {
    expect(truncateText('Short text', 50)).toBe('Short text');
  });

  it('should truncate and append ellipsis when over the limit', () => {
    const long = 'A balanced sativa-dominant hybrid with sweet berry aroma and uplifting effects.';
    const result = truncateText(long, 30);
    expect(result.length).toBeLessThanOrEqual(33); // 30 chars + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('should not cut in the middle of a word', () => {
    // "Hello world" truncated at 8 should be "Hello..." not "Hello wo..."
    const result = truncateText('Hello world today', 8);
    expect(result).toBe('Hello...');
  });

  it('should handle empty strings', () => {
    expect(truncateText('', 50)).toBe('');
  });

  it('should handle null/undefined gracefully', () => {
    expect(truncateText(null, 50)).toBe('');
    expect(truncateText(undefined, 50)).toBe('');
  });
});
