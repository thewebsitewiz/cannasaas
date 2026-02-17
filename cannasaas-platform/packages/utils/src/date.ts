import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  addDays,
  isBefore,
  isAfter,
  isSameDay,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";

// ── Parsing ─────────────────────────────────────────────────────────────────

/**
 * Safely parse a date string, Date, or timestamp into a Date object.
 * Returns null if invalid.
 */
export function toDate(value: string | Date | number | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "number") {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

/**
 * Parse and assert a date value. Throws if invalid.
 */
export function toDateStrict(value: string | Date | number): Date {
  const d = toDate(value);
  if (!d) throw new Error(`Invalid date: ${String(value)}`);
  return d;
}

// ── Formatting ──────────────────────────────────────────────────────────────

/**
 * Format a date with a date-fns format string.
 * @example formatDateFns("2026-02-15", "MMM d, yyyy") // "Feb 15, 2026"
 */
export function formatDateFns(
  value: string | Date | number,
  pattern = "MMM d, yyyy",
): string {
  return format(toDateStrict(value), pattern);
}

/**
 * Format a date with time.
 * @example formatDateTimeFns("2026-02-15T10:30:00Z") // "Feb 15, 2026 10:30 AM"
 */
export function formatDateTimeFns(
  value: string | Date | number,
  pattern = "MMM d, yyyy h:mm a",
): string {
  return format(toDateStrict(value), pattern);
}

/**
 * "2 hours ago", "3 days ago", "in 5 minutes"
 */
export function timeAgo(value: string | Date | number): string {
  return formatDistanceToNow(toDateStrict(value), { addSuffix: true });
}

/**
 * Format as ISO date string (YYYY-MM-DD) for API params.
 */
export function toISODate(value: string | Date | number): string {
  return format(toDateStrict(value), "yyyy-MM-dd");
}

// ── Date range presets (for analytics filters) ──────────────────────────────

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

export function getDateRangePresets(): DateRange[] {
  const today = new Date();
  return [
    {
      label: "Today",
      startDate: toISODate(startOfDay(today)),
      endDate: toISODate(endOfDay(today)),
    },
    {
      label: "Yesterday",
      startDate: toISODate(startOfDay(subDays(today, 1))),
      endDate: toISODate(endOfDay(subDays(today, 1))),
    },
    {
      label: "Last 7 days",
      startDate: toISODate(subDays(today, 6)),
      endDate: toISODate(today),
    },
    {
      label: "Last 30 days",
      startDate: toISODate(subDays(today, 29)),
      endDate: toISODate(today),
    },
    {
      label: "This week",
      startDate: toISODate(startOfWeek(today, { weekStartsOn: 1 })),
      endDate: toISODate(endOfWeek(today, { weekStartsOn: 1 })),
    },
    {
      label: "This month",
      startDate: toISODate(startOfMonth(today)),
      endDate: toISODate(endOfMonth(today)),
    },
    {
      label: "Last month",
      startDate: toISODate(startOfMonth(subMonths(today, 1))),
      endDate: toISODate(endOfMonth(subMonths(today, 1))),
    },
    {
      label: "Last 90 days",
      startDate: toISODate(subDays(today, 89)),
      endDate: toISODate(today),
    },
  ];
}

// ── Comparisons ─────────────────────────────────────────────────────────────

export {
  isBefore,
  isAfter,
  isSameDay,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
};
