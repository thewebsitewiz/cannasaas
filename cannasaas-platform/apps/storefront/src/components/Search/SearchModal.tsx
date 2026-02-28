// apps/storefront/src/components/Search/SearchModal.tsx
// STUB — implement in Part 7 follow-up
import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps { isOpen: boolean; onClose: () => void; }

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 50); }, [isOpen]);
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement)?.value;
    if (q.trim()) { navigate(`/products?q=${encodeURIComponent(q.trim())}`); onClose(); }
  };
  return (
    <div role="dialog" aria-label="Search products" aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[var(--color-surface)] rounded-[var(--p-radius-lg)] shadow-[var(--p-shadow-lg)] p-4">
        <form onSubmit={handleSubmit} role="search">
          <label htmlFor="search-input" className="sr-only">Search products</label>
          <div className="flex items-center gap-3">
            <Search size={20} className="text-[var(--color-text-secondary)] flex-shrink-0" aria-hidden="true" />
            <input ref={inputRef} id="search-input" name="q" type="search" placeholder="Search products…"
              className="flex-1 bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-disabled)] outline-none text-[var(--p-text-lg)]" />
            <button type="button" onClick={onClose} aria-label="Close search"
              className="p-1 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
