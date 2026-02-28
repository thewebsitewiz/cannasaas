/**
 * Format a number as USD currency.
 * Uses Intl.NumberFormat for locale-aware formatting.
 */
export function formatCurrency(
  amount: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Format THC or CBD percentage value for display.
 * Sub-1% values are displayed as mg/g for precision.
 */
export function formatThc(value: number): string {
  if (value === 0) return '0%';
  if (value < 1) return `${(value * 100).toFixed(0)}mg/g`;
  return `${value.toFixed(1)}%`;
}

/**
 * Format a weight in grams into a human-readable cannabis unit.
 * Standard dispensary denominations are recognised and labelled.
 */
export function formatWeight(grams: number): string {
  if (grams < 1)   return `${(grams * 1000).toFixed(0)}mg`;
  if (grams === 1)  return '1g';
  if (grams === 3.5) return '1/8 oz';
  if (grams === 7)   return '1/4 oz';
  if (grams === 14)  return '1/2 oz';
  if (grams === 28)  return '1 oz';
  return `${grams}g`;
}

/** Pluralize a word based on count */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/** Truncate a string to maxLength, appending '…' if needed */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}
