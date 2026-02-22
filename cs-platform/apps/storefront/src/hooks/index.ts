/**
 * Barrel export for all custom hooks.
 *
 * Home page hooks:
 *   useReducedMotion      — OS prefers-reduced-motion detection
 *   useMediaQuery         — Generic CSS media query hook
 *   useIntersectionObserver — Viewport detection (fire-once)
 *   useAutoplay           — Timer with pause/hover/focus/a11y
 *
 * Products page hooks:
 *   useDebounce           — Generic value debouncer (500ms search)
 *   useProductFilters     — URL ↔ filter state via useSearchParams
 */
export { useReducedMotion } from './useReducedMotion';
export { useMediaQuery } from './useMediaQuery';
export { useIntersectionObserver } from './useIntersectionObserver';
export { useAutoplay } from './useAutoplay';
export { useDebounce } from './useDebounce';
export { useProductFilters } from './useProductFilters';
export type {
  ProductFilters,
  FilterActions,
  SortOption,
} from './useProductFilters';
export { useCartTotals } from './useCartTotals';
export type { CartTotals } from './useCartTotals';
