/**
 * Format a dollar amount (in dollars, not cents) for display.
 *
 * @param amount  Dollar amount (e.g. 29.99)
 * @param locale  BCP 47 locale string (default: "en-US")
 * @param currency ISO 4217 currency code (default: "USD")
 * @returns Formatted string, e.g. "$29.99"
 *
 * @example
 * formatCurrency(29.99)            // "$29.99"
 * formatCurrency(1500)             // "$1,500.00"
 * formatCurrency(29.99, "en-CA", "CAD") // "CA$29.99"
 */
export function formatCurrency(
  amount: number,
  locale = "en-US",
  currency = "USD",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format cents (integer) to a currency display string.
 *
 * @param cents  Amount in cents (e.g. 2999 = $29.99)
 * @param locale BCP 47 locale
 * @param currency ISO 4217 code
 * @returns Formatted string
 *
 * @example
 * formatCents(2999)  // "$29.99"
 * formatCents(100)   // "$1.00"
 */
export function formatCents(
  cents: number,
  locale = "en-US",
  currency = "USD",
): string {
  return formatCurrency(cents / 100, locale, currency);
}

/**
 * Format a date for display.
 *
 * @param date   Date string, Date object, or timestamp
 * @param style  Intl.DateTimeFormat style preset
 * @param locale BCP 47 locale (default: "en-US")
 *
 * @example
 * formatDate("2026-02-15")                    // "Feb 15, 2026"
 * formatDate("2026-02-15T10:30:00Z", "long")  // "February 15, 2026"
 * formatDate("2026-02-15T10:30:00Z", "full")  // "Sunday, February 15, 2026"
 */
export function formatDate(
  date: string | Date | number,
  style: "short" | "medium" | "long" | "full" = "medium",
  locale = "en-US",
): string {
  const d = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;

  return new Intl.DateTimeFormat(locale, { dateStyle: style }).format(d);
}

/**
 * Format a date with time.
 *
 * @example
 * formatDateTime("2026-02-15T10:30:00Z") // "Feb 15, 2026, 10:30 AM"
 */
export function formatDateTime(
  date: string | Date | number,
  locale = "en-US",
): string {
  const d = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/**
 * Format weight in grams to a human-readable string.
 * Automatically selects grams or ounces based on common cannabis conventions.
 *
 * @param grams  Weight in grams
 * @param unit   Display unit: "g" (grams) or "oz" (ounces)
 *
 * @example
 * formatWeight(3.5)       // "3.5g"
 * formatWeight(28)        // "28g"
 * formatWeight(3.5, "oz") // "0.12oz"
 * formatWeight(0.5)       // "0.5g"
 */
export function formatWeight(grams: number, unit: "g" | "oz" = "g"): string {
  if (unit === "oz") {
    const oz = grams / 28.3495;
    return `${oz.toFixed(2)}oz`;
  }
  // Remove trailing zeros: 3.50 → 3.5, 28.00 → 28
  const formatted = Number(grams.toFixed(2));
  return `${formatted}g`;
}

/**
 * Format a percentage for display.
 *
 * @example
 * formatPercentage(24.5)  // "24.5%"
 * formatPercentage(0.8)   // "0.8%"
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format THC/CBD content for product display.
 *
 * @example
 * formatCannabinoid("THC", 24.5)  // "THC: 24.5%"
 * formatCannabinoid("CBD", 0.8)   // "CBD: 0.8%"
 * formatCannabinoid("THC", null)  // null
 */
export function formatCannabinoid(
  label: string,
  value: number | null | undefined,
): string | null {
  if (value == null) return null;
  return `${label}: ${formatPercentage(value)}`;
}

/**
 * Truncate a string to a max length with ellipsis.
 *
 * @example
 * truncate("Blue Dream Premium Flower", 20) // "Blue Dream Premium…"
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1).trimEnd() + "\u2026";
}

/**
 * Slugify a string for URL-safe usage.
 *
 * @example
 * slugify("Blue Dream 3.5g")  // "blue-dream-3-5g"
 * slugify("OG Kush (Indoor)") // "og-kush-indoor"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Pluralize a word based on count.
 *
 * @example
 * pluralize(1, "item")    // "1 item"
 * pluralize(5, "item")    // "5 items"
 * pluralize(0, "item")    // "0 items"
 * pluralize(2, "category", "categories") // "2 categories"
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}
