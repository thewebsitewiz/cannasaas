/**
 * @file SearchBar.tsx
 * @app apps/storefront
 *
 * Debounced product search bar with autocomplete dropdown.
 *
 * Behaviour:
 *   - Debounces input at 300ms before firing GET /search/suggest?q=
 *   - Shows dropdown with up to 6 suggestion strings
 *   - Pressing Enter navigates to /products?search=<query>
 *   - Clicking a suggestion navigates to /products?search=<suggestion>
 *   - Pressing Escape clears the dropdown (not the input)
 *   - Clicking outside closes the dropdown
 *
 * Accessibility:
 *   - role="combobox" on input, role="listbox" on dropdown (WCAG 4.1.2)
 *   - aria-activedescendant tracks keyboard-highlighted suggestion
 *   - aria-controls links input to listbox
 *   - aria-expanded reflects dropdown visibility
 *   - Each suggestion: role="option", id for aria-activedescendant reference
 *   - Arrow keys navigate suggestions; Home/End jump to first/last
 */

import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchSuggestions } from '@cannasaas/api-client';
import { useDebounce } from '../../hooks/useDebounce';
import { ROUTES } from '../../routes';

interface SearchBarProps {
  fullWidth?: boolean;
}

export function SearchBar({ fullWidth = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const comboboxId = useId();
  const listboxId = `${comboboxId}-listbox`;
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query, 300);
  const { data: suggestions = [] } = useSearchSuggestions(debouncedQuery);

  const hasResults = suggestions.length > 0;

  // Open dropdown when we have results
  useEffect(() => {
    setIsOpen(hasResults && query.trim().length >= 2);
    setHighlightedIndex(-1);
  }, [suggestions, hasResults, query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!inputRef.current?.parentElement?.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigateToSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setIsOpen(false);
    navigate(`${ROUTES.products}?search=${encodeURIComponent(q.trim())}`);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter') navigateToSearch(query);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlightedIndex(suggestions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          navigateToSearch(suggestions[highlightedIndex]);
        } else {
          navigateToSearch(query);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={['relative', fullWidth ? 'w-full' : ''].join(' ')}>
      {/* Combobox input */}
      <div className="relative">
        {/* Search icon */}
        <svg
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          id={comboboxId}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={
            highlightedIndex >= 0
              ? `${listboxId}-option-${highlightedIndex}`
              : undefined
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (hasResults && query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder="Search products…"
          autoComplete="off"
          className={[
            'w-full pl-9 pr-3 py-2 text-sm',
            'bg-stone-100 rounded-lg',
            'placeholder:text-stone-400 text-stone-900',
            'border border-transparent',
            'focus:outline-none focus:border-[hsl(var(--primary)/0.4)]',
            'focus:bg-white focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]',
            'transition-all',
          ].join(' ')}
        />
      </div>

      {/* Autocomplete listbox */}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label={`Search suggestions for "${query}"`}
          className={[
            'absolute top-full left-0 right-0 mt-1',
            'bg-white rounded-xl shadow-lg shadow-stone-200/80',
            'border border-stone-100 overflow-hidden',
            'z-50 max-h-64 overflow-y-auto',
          ].join(' ')}
        >
          {suggestions.slice(0, 6).map((suggestion, index) => (
            <li
              key={suggestion}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              onClick={() => navigateToSearch(suggestion)}
              className={[
                'flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer',
                'transition-colors',
                index === highlightedIndex
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-700 hover:bg-stone-50',
              ].join(' ')}
            >
              <svg aria-hidden="true" className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
