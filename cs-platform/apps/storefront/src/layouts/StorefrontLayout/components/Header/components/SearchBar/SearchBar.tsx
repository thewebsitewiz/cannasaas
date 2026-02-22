/**
 * @file SearchBar.tsx
 * @path apps/storefront/src/layouts/StorefrontLayout/components/Header/components/SearchBar/SearchBar.tsx
 *
 * Accessible, autocomplete-powered search bar for the CannaSaas storefront header.
 *
 * ─── WCAG 2.1 AA COMPLIANCE ────────────────────────────────────────────────
 *   • Role="combobox" on the input with aria-expanded, aria-autocomplete,
 *     aria-haspopup, and aria-controls per the ARIA 1.2 Combobox Pattern.
 *   • Role="listbox" on the suggestion dropdown with role="option" children.
 *   • aria-activedescendant tracks keyboard focus within the listbox.
 *   • Keyboard navigation: Arrow keys move focus, Enter selects, Escape closes.
 *   • Focus is never trapped — Escape always restores input focus.
 *   • Minimum touch target 44×44px enforced via CSS.
 *   • Color contrast on all text/background combos ≥ 4.5:1 (AA).
 *   • Loading state announced via aria-live="polite".
 *
 * ─── ADVANCED REACT PATTERNS ───────────────────────────────────────────────
 *   • Debounced API calls via useCallback + useRef timer.
 *   • Controlled combobox state with useReducer for predictable transitions.
 *   • useId() for stable, SSR-safe id generation.
 *   • Click-outside dismissal via useEffect + document event listener.
 *   • Ref forwarding for focus management from parent (Header mobile toggle).
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { SearchSuggestion } from '@cannasaas/types';
import styles from './SearchBar.module.css';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Debounce delay in ms before firing the suggestions API call */
const DEBOUNCE_MS = 220;

/** Minimum characters required to trigger autocomplete */
const MIN_QUERY_LENGTH = 2;

// ─── Reducer ─────────────────────────────────────────────────────────────────

type State = {
  query: string;
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  isOpen: boolean;
  activeIndex: number; // -1 = input focused, 0+ = suggestion focused
};

type Action =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: SearchSuggestion[] }
  | { type: 'FETCH_ERROR' }
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'SET_ACTIVE_INDEX'; payload: number }
  | { type: 'CLEAR' };

const initialState: State = {
  query: '',
  suggestions: [],
  isLoading: false,
  isOpen: false,
  activeIndex: -1,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload, activeIndex: -1 };
    case 'FETCH_START':
      return { ...state, isLoading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        suggestions: action.payload,
        isOpen: action.payload.length > 0,
      };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, suggestions: [], isOpen: false };
    case 'SET_OPEN':
      return { ...state, isOpen: action.payload, activeIndex: -1 };
    case 'SET_ACTIVE_INDEX':
      return { ...state, activeIndex: action.payload };
    case 'CLEAR':
      return initialState;
    default:
      return state;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SearchBarProps {
  /** Additional CSS class for layout positioning in the header */
  className?: string;
  /** Placeholder text – defaults to "Search products…" */
  placeholder?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SearchBar
 *
 * A fully accessible combobox that queries the CannaSaas product search API
 * as the user types and presents a keyboard-navigable suggestion listbox.
 *
 * @example
 * <SearchBar placeholder="Find flower, edibles, concentrates…" />
 */
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar({ className, placeholder = 'Search products…' }, ref) {
    const navigate = useNavigate();
    const uid = useId();
    const listboxId = `${uid}-listbox`;
    const loadingId = `${uid}-loading`;

    const [state, dispatch] = useReducer(reducer, initialState);
    const { query, suggestions, isLoading, isOpen, activeIndex } = state;

    // Timer ref for debouncing API requests
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Container ref for click-outside dismissal
    const containerRef = useRef<HTMLDivElement>(null);

    // ── Fetch Suggestions ─────────────────────────────────────────────────

    /**
     * Fires a debounced GET request to the product search suggestions endpoint.
     * Wrapped in useCallback so it can be referenced stably in the effect below.
     */
    const fetchSuggestions = useCallback(async (q: string) => {
      dispatch({ type: 'FETCH_START' });
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(q)}&limit=6`,
        );
        if (!res.ok) throw new Error('Search failed');
        const data: SearchSuggestion[] = await res.json();
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch {
        dispatch({ type: 'FETCH_ERROR' });
      }
    }, []);

    // ── Query Effect – Debounce ───────────────────────────────────────────

    useEffect(() => {
      // Clear any pending debounce timer
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (query.trim().length < MIN_QUERY_LENGTH) {
        dispatch({ type: 'SET_OPEN', payload: false });
        return;
      }

      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(query.trim());
      }, DEBOUNCE_MS);

      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
      };
    }, [query, fetchSuggestions]);

    // ── Click Outside ─────────────────────────────────────────────────────

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          dispatch({ type: 'SET_OPEN', payload: false });
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: 'SET_QUERY', payload: e.target.value });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = activeIndex < suggestions.length - 1 ? activeIndex + 1 : 0;
          dispatch({ type: 'SET_ACTIVE_INDEX', payload: next });
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev = activeIndex > 0 ? activeIndex - 1 : suggestions.length - 1;
          dispatch({ type: 'SET_ACTIVE_INDEX', payload: prev });
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (activeIndex >= 0 && suggestions[activeIndex]) {
            handleSelectSuggestion(suggestions[activeIndex]);
          } else if (query.trim()) {
            handleSearch(query.trim());
          }
          break;
        }
        case 'Escape': {
          dispatch({ type: 'SET_OPEN', payload: false });
          break;
        }
      }
    };

    const handleSearch = (q: string) => {
      dispatch({ type: 'SET_OPEN', payload: false });
      navigate(`/search?q=${encodeURIComponent(q)}`);
    };

    const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
      dispatch({ type: 'CLEAR' });
      switch (suggestion.type) {
        case 'product':
          navigate(`/products/${suggestion.id}`);
          break;
        case 'category':
          navigate(`/categories/${suggestion.id}`);
          break;
        case 'brand':
          navigate(`/brands/${suggestion.id}`);
          break;
        case 'strain':
          navigate(`/strains/${suggestion.id}`);
          break;
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) handleSearch(query.trim());
    };

    // ── Option ID Helper ──────────────────────────────────────────────────

    const getOptionId = (index: number) => `${uid}-option-${index}`;

    // ── Render ────────────────────────────────────────────────────────────

    return (
      <div
        ref={containerRef}
        className={`${styles.searchBar} ${className ?? ''}`}
        // Expose the combobox role at the container level per ARIA 1.2 spec
      >
        {/* ── Search Form ─────────────────────────────────────────────── */}
        <form
          role="search"
          onSubmit={handleSubmit}
          className={styles.form}
          aria-label="Product search"
        >
          {/*
           * Search Icon (decorative – hidden from screen readers)
           * Rendered as inline SVG to avoid icon font dependency
           */}
          <span aria-hidden="true" className={styles.searchIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>

          {/*
           * ARIA Combobox Input
           * role="combobox" is on the input itself per ARIA 1.2 (not the wrapper).
           * aria-controls points to the listbox id.
           * aria-activedescendant tracks the currently highlighted option.
           */}
          <input
            ref={ref}
            id={`${uid}-input`}
            type="search"
            role="combobox"
            aria-label={placeholder}
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={
              isOpen && activeIndex >= 0 ? getOptionId(activeIndex) : undefined
            }
            aria-busy={isLoading}
            autoComplete="off"
            spellCheck={false}
            value={query}
            placeholder={placeholder}
            className={styles.input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                dispatch({ type: 'SET_OPEN', payload: true });
              }
            }}
          />

          {/* Clear button – only shown when input has a value */}
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              className={styles.clearButton}
              onClick={() => dispatch({ type: 'CLEAR' })}
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            aria-label="Submit search"
          >
            Search
          </button>
        </form>

        {/*
         * aria-live region announces loading state to screen readers
         * without requiring focus change. Role="status" is polite.
         */}
        <div
          id={loadingId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={styles.srOnly}
        >
          {isLoading ? 'Loading suggestions…' : ''}
        </div>

        {/* ── Suggestion Listbox ──────────────────────────────────────── */}
        {isOpen && suggestions.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Search suggestions"
            className={styles.listbox}
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={getOptionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                className={`${styles.option} ${index === activeIndex ? styles.optionActive : ''}`}
                /*
                 * onMouseDown instead of onClick prevents the input blur
                 * from firing and closing the listbox before the click registers.
                 */
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(suggestion);
                }}
              >
                {/* Type badge */}
                <span className={styles.optionType} aria-label={`type: ${suggestion.type}`}>
                  {suggestion.type === 'product' && (
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  )}
                  {suggestion.type === 'category' && (
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                    </svg>
                  )}
                </span>

                {/* Label */}
                <span className={styles.optionLabel}>{suggestion.label}</span>

                {/* Price (for product suggestions) */}
                {suggestion.priceCents !== undefined && (
                  <span className={styles.optionPrice} aria-label={`$${(suggestion.priceCents / 100).toFixed(2)}`}>
                    ${(suggestion.priceCents / 100).toFixed(2)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);

SearchBar.displayName = 'SearchBar';

