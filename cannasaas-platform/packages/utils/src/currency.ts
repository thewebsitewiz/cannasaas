// ── Cannabis tax rates by state ──────────────────────────────────────────────
// Source: State excise + sales tax rates as of 2025
// These are approximate combined rates; actual rates may vary by locality.

export interface TaxRate {
  /** State abbreviation */
  state: string;
  /** State excise tax on cannabis (percentage, e.g. 13 = 13%) */
  exciseTax: number;
  /** State sales tax (percentage) */
  salesTax: number;
  /** Average local tax addon (percentage) */
  localTax: number;
  /** Whether the excise tax is applied to retail price (true) or wholesale (false) */
  exciseOnRetail: boolean;
}

export const STATE_TAX_RATES: Record<string, TaxRate> = {
  NY: {
    state: "NY",
    exciseTax: 9,      // NY adult-use cannabis tax
    salesTax: 4,
    localTax: 4,       // county + city
    exciseOnRetail: true,
  },
  NJ: {
    state: "NJ",
    exciseTax: 6.625,  // NJ social equity excise tax
    salesTax: 6.625,
    localTax: 2,       // municipality transfer tax
    exciseOnRetail: true,
  },
  CT: {
    state: "CT",
    exciseTax: 6.35,   // CT cannabis tax
    salesTax: 6.35,
    localTax: 3,       // municipal
    exciseOnRetail: true,
  },
};

/**
 * Supported states for CannaSaas (NY, NJ, CT).
 */
export const SUPPORTED_STATES = Object.keys(STATE_TAX_RATES);

// ── Tax calculation ─────────────────────────────────────────────────────────

export interface TaxBreakdown {
  /** Original price before tax */
  subtotal: number;
  /** Excise tax amount */
  exciseTax: number;
  /** Sales tax amount */
  salesTax: number;
  /** Local tax amount */
  localTax: number;
  /** Total tax */
  totalTax: number;
  /** Final price including all taxes */
  total: number;
  /** Effective tax rate as a percentage */
  effectiveRate: number;
}

/**
 * Calculate full tax breakdown for a cannabis purchase.
 *
 * @param subtotal   Pre-tax dollar amount
 * @param stateCode  Two-letter state code (NY, NJ, CT)
 * @returns Tax breakdown with all components
 *
 * @example
 * calculateTax(100, "NY")
 * // { subtotal: 100, exciseTax: 9, salesTax: 4, localTax: 4,
 * //   totalTax: 17, total: 117, effectiveRate: 17 }
 */
export function calculateTax(subtotal: number, stateCode: string): TaxBreakdown {
  const rates = STATE_TAX_RATES[stateCode.toUpperCase()];

  if (!rates) {
    // No tax info for unsupported states — return zero tax
    return {
      subtotal,
      exciseTax: 0,
      salesTax: 0,
      localTax: 0,
      totalTax: 0,
      total: subtotal,
      effectiveRate: 0,
    };
  }

  const exciseTax = round2(subtotal * (rates.exciseTax / 100));
  const salesTax = round2(subtotal * (rates.salesTax / 100));
  const localTax = round2(subtotal * (rates.localTax / 100));
  const totalTax = round2(exciseTax + salesTax + localTax);
  const total = round2(subtotal + totalTax);
  const effectiveRate = subtotal > 0 ? round2((totalTax / subtotal) * 100) : 0;

  return {
    subtotal,
    exciseTax,
    salesTax,
    localTax,
    totalTax,
    total,
    effectiveRate,
  };
}

/**
 * Quick total-with-tax calculation.
 *
 * @example
 * applyTax(50, "NJ") // 57.63 (approx)
 */
export function applyTax(subtotal: number, stateCode: string): number {
  return calculateTax(subtotal, stateCode).total;
}

// ── Price helpers ───────────────────────────────────────────────────────────

/**
 * Calculate discount percentage between original and sale price.
 *
 * @example
 * discountPercent(50, 35) // 30  (30% off)
 */
export function discountPercent(
  originalPrice: number,
  salePrice: number,
): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Calculate line item total (price × quantity).
 * Rounds to 2 decimal places.
 */
export function lineTotal(unitPrice: number, quantity: number): number {
  return round2(unitPrice * quantity);
}

/**
 * Sum an array of line item amounts.
 */
export function sumAmounts(amounts: number[]): number {
  return round2(amounts.reduce((sum, a) => sum + a, 0));
}

/**
 * Format a price with locale-aware currency formatting.
 * Re-exported from formatting for convenience.
 */
export { formatCurrency, formatCents } from "./formatting";

// ── Internal ────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
