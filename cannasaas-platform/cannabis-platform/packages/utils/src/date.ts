import { format, formatDistanceToNow, parseISO } from 'date-fns';

/** Format an ISO date string for display */
export function formatDate(
  isoString: string,
  pattern = 'MMM d, yyyy',
): string {
  try {
    return format(parseISO(isoString), pattern);
  } catch {
    return isoString;
  }
}

/** Format an ISO date string as relative time (e.g., "3 minutes ago") */
export function formatRelativeTime(isoString: string): string {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return isoString;
  }
}
