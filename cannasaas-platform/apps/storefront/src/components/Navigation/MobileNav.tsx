// apps/storefront/src/components/Navigation/MobileNav.tsx
// STUB — implement in Part 7 follow-up
import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';

interface NavLinkItem { label: string; href: string; }
interface MobileNavProps { id: string; isOpen: boolean; onClose: () => void; links: NavLinkItem[]; }

export function MobileNav({ id, isOpen, onClose, links }: MobileNavProps) {
  if (!isOpen) return null;
  return (
    <div id={id} role="dialog" aria-label="Mobile navigation" aria-modal="true" className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
      <nav className="absolute top-0 right-0 h-full w-72 bg-[var(--color-surface)] shadow-xl flex flex-col p-6">
        <button type="button" onClick={onClose} aria-label="Close menu"
          className="self-end mb-6 p-2 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]">
          <X size={20} aria-hidden="true" />
        </button>
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.href}>
              <NavLink to={link.href} onClick={onClose}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-[var(--p-radius-md)] text-[var(--p-text-base)] font-semibold transition-colors ${
                    isActive
                      ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)]'
                  }`
                }>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
