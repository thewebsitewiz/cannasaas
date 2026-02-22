/**
 * @file useLocalStorage.ts
 * @app apps/storefront
 *
 * Type-safe localStorage hook with JSON serialisation.
 *
 * Wraps localStorage access in try/catch to handle:
 *   - Private browsing mode (throws SecurityError)
 *   - Storage quota exceeded
 *   - Non-JSON values in storage (from other scripts)
 *
 * Returns [value, setValue, removeValue] — same API as useState
 * but the value is also persisted to localStorage.
 *
 * @example
 *   const [prefs, setPrefs] = useLocalStorage('user-prefs', { theme: 'light' });
 */

import { useState } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore =
        typeof value === 'function'
          ? (value as (prev: T) => T)(storedValue)
          : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch {
      // Storage not available — still update React state
      setStoredValue(typeof value === 'function'
        ? (value as (prev: T) => T)(storedValue)
        : value);
    }
  };

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch {
      setStoredValue(initialValue);
    }
  };

  return [storedValue, setValue, removeValue];
}
