/**
 * @file useDebounce.ts
 * @app apps/storefront
 *
 * Debounce hook — delays propagation of a value until the input has
 * stopped changing for `delay` milliseconds.
 *
 * Used by:
 *   - SearchBar (300ms delay before firing autocomplete requests)
 *   - ProductsPage price range slider (500ms delay before URL update)
 *   - ProductsPage THC range slider
 *
 * @param value   - The value to debounce
 * @param delay   - Milliseconds to wait after last change (default: 300)
 * @returns       - The debounced value, updated after `delay` ms of silence
 *
 * @example
 *   const [input, setInput] = useState('');
 *   const debouncedInput = useDebounce(input, 300);
 *   // debouncedInput only updates 300ms after the user stops typing
 */

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    // Cleanup: cancel the timeout if value changes before delay elapses
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
