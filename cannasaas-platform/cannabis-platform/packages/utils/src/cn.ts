import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — Tailwind class name merger
 *
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 * Use this for ALL className construction in the component library.
 *
 * @example
 *   cn('px-4 py-2', condition && 'bg-brand', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
