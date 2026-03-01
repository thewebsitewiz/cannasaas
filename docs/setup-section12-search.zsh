#!/usr/bin/env zsh
# ================================================================
# CannaSaas — Section 12: Elasticsearch Search & AI Recommendations
#
# Writes the storefront search modal into apps/storefront.
# Safe to re-run — existing files are overwritten.
#
# Files written (1):
#   apps/storefront/src/components/Search/SearchModal.tsx
#
# Usage:
#   chmod +x setup-section12-search.zsh
#   ./setup-section12-search.zsh                   # ~/cannasaas-platform
#   ./setup-section12-search.zsh /path/to/repo     # custom root
# ================================================================

set -euo pipefail

PLATFORM_ROOT="${1:-$HOME/cannasaas-platform}"

print -P "%F{green}▶  CannaSaas — Section 12: Elasticsearch Search & AI Recommendations%f"
print -P "%F{cyan}   Target root: ${PLATFORM_ROOT}%f"
echo ""

# ── 1. Directories ────────────────────────────────────────────────
mkdir -p "${PLATFORM_ROOT}/apps/storefront/src/components/Search"

print -P "%F{green}✓  Directories ready%f"
echo ""

# ── 2. Source files ───────────────────────────────────────────────

# [01/1] components/Search/SearchModal.tsx
print -P "%F{cyan}  [01/1] components/Search/SearchModal.tsx%f"
cat > "${PLATFORM_ROOT}/apps/storefront/src/components/Search/SearchModal.tsx" << 'FILE_EOF'
// apps/storefront/src/components/Search/SearchModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Leaf, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearchSuggestions, useSearchProducts } from '@cannasaas/api-client';
import { useDebounce } from '@cannasaas/utils';
import { ProductCard } from '@cannasaas/ui';
import type { Product } from '@cannasaas/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem('cannasaas-recent-searches') ?? '[]',
      ) as string[];
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  // Autocomplete suggestions
  const { data: suggestions } = useSearchSuggestions(debouncedQuery, {
    enabled: debouncedQuery.length >= 2,
  });

  // Full search results (triggered when query is substantial)
  const { data: results } = useSearchProducts(debouncedQuery, {
    enabled: debouncedQuery.length >= 3,
  });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      // Save to recent searches
      const updated = [
        searchQuery,
        ...recentSearches.filter((s) => s !== searchQuery),
      ].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(
        'cannasaas-recent-searches',
        JSON.stringify(updated),
      );

      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
      onClose();
    },
    [recentSearches, navigate, onClose],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className={[
          'fixed top-0 left-0 right-0 z-50 max-w-2xl mx-auto mt-4 mx-4 sm:mx-auto',
          'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
          'border border-[var(--color-border)] shadow-[var(--p-shadow-lg)]',
          'overflow-hidden max-h-[85vh] flex flex-col',
        ].join(' ')}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)]">
          <Search
            size={20}
            className="text-[var(--color-text-secondary)] flex-shrink-0"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={!!suggestions?.length}
            aria-controls="search-results"
            aria-autocomplete="list"
            aria-label="Search cannabis products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(query);
            }}
            placeholder="Search flower, edibles, vapes..."
            className={[
              'flex-1 bg-transparent text-[var(--color-text)]',
              'text-[var(--p-text-base)] placeholder:text-[var(--color-text-disabled)]',
              'outline-none',
            ].join(' ')}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] p-1"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Results */}
        <div
          id="search-results"
          role="listbox"
          aria-label="Search results and suggestions"
          className="overflow-y-auto flex-1"
        >
          {/* No query — show recent searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-4">
              <p className="text-[var(--p-text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
                Recent Searches
              </p>
              {recentSearches.map((search) => (
                <button
                  key={search}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => handleSearch(search)}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-[var(--p-radius-md)] hover:bg-[var(--color-bg-tertiary)] text-left"
                >
                  <Clock
                    size={14}
                    className="text-[var(--color-text-secondary)]"
                    aria-hidden="true"
                  />
                  <span className="text-[var(--p-text-sm)] text-[var(--color-text)]">
                    {search}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions while typing */}
          {query.length >= 2 && suggestions && suggestions.length > 0 && (
            <div className="p-4 border-b border-[var(--color-border)]">
              <p className="text-[var(--p-text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
                Suggestions
              </p>
              {suggestions.map((suggestion: string) => (
                <button
                  key={suggestion}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => handleSearch(suggestion)}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-[var(--p-radius-md)] hover:bg-[var(--color-bg-tertiary)] text-left"
                >
                  <Search
                    size={14}
                    className="text-[var(--color-text-secondary)]"
                    aria-hidden="true"
                  />
                  <span
                    className="text-[var(--p-text-sm)] text-[var(--color-text)]"
                    // Highlight matched portion
                    dangerouslySetInnerHTML={{
                      __html: suggestion.replace(
                        new RegExp(`(${query})`, 'gi'),
                        '<mark class="bg-[var(--color-brand-subtle)] text-[var(--color-brand)] rounded px-0.5">$1</mark>',
                      ),
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Product results */}
          {query.length >= 3 && results && results.data.length > 0 && (
            <div className="p-4">
              <p className="text-[var(--p-text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
                Products ({results.data.length})
              </p>
              <div className="space-y-2">
                {results.data.slice(0, 5).map((product: Product) => (
                  <button
                    key={product.id}
                    type="button"
                    role="option"
                    aria-selected="false"
                    onClick={() => {
                      navigate(`/products/${product.slug}`);
                      onClose();
                    }}
                    className="flex items-center gap-3 w-full px-2 py-2 rounded-[var(--p-radius-md)] hover:bg-[var(--color-bg-tertiary)] text-left"
                  >
                    {product.images[0] ? (
                      <img
                        src={product.images[0].url}
                        alt=""
                        aria-hidden="true"
                        className="w-10 h-10 rounded-[var(--p-radius-sm)] object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-[var(--p-radius-sm)] bg-[var(--color-bg-tertiary)] flex items-center justify-center flex-shrink-0"
                        aria-hidden="true"
                      >
                        <Leaf
                          size={16}
                          className="text-[var(--color-text-secondary)]"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] truncate">
                        {product.name}
                      </p>
                      <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
                        {product.category} · {product.cannabisInfo.thcContent}%
                        THC
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {query.length >= 3 && results?.data.length === 0 && (
            <div className="p-8 text-center" role="status">
              <p className="text-[var(--color-text-secondary)]">
                No products found for "{query}"
              </p>
              <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] mt-1">
                Try different keywords or browse by category
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
FILE_EOF

# ── 3. Summary ────────────────────────────────────────────────────
echo ""
print -P "%F{green}✓  Done — 1 file written to ${PLATFORM_ROOT}/apps/storefront/src/components/Search%f"
echo ""
print -P "%F{cyan}Directory tree:%f"
if command -v tree &>/dev/null; then
  tree "${PLATFORM_ROOT}/apps/storefront/src/components/Search"
else
  find "${PLATFORM_ROOT}/apps/storefront/src/components/Search" -type f | sort | \
    sed "s|${PLATFORM_ROOT}/||"
fi

