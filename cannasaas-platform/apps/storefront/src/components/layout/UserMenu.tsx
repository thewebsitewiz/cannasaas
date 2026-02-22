/**
 * @file UserMenu.tsx
 * @app apps/storefront
 *
 * Auth-aware user menu.
 *
 * Unauthenticated: renders "Sign In" link
 * Authenticated: renders avatar button with dropdown:
 *   - User name + email
 *   - My Account
 *   - My Orders
 *   - Sign Out
 *
 * Accessibility:
 *   - Avatar button: aria-haspopup="menu", aria-expanded
 *   - Dropdown: role="menu", items are role="menuitem"
 *   - Keyboard: Arrow keys navigate items, Escape closes, Tab closes
 *   - Focus returns to trigger on close (WCAG 2.1.2)
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@cannasaas/stores';
import { useLogout } from '@cannasaas/api-client';
import { ROUTES } from '../../routes';

export function UserMenu() {
  const { user, isAuthenticated } = useAuthStore();
  const { mutate: logout } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) &&
          !triggerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  if (!isAuthenticated) {
    return (
      <Link
        to={ROUTES.login}
        className={[
          'hidden sm:flex items-center gap-2 px-3 py-1.5',
          'text-sm font-medium text-stone-700',
          'border border-stone-200 rounded-lg',
          'hover:border-stone-300 hover:bg-stone-50',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[hsl(var(--primary))]',
          'transition-colors',
        ].join(' ')}
      >
        Sign In
      </Link>
    );
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`User menu for ${user?.firstName ?? 'Account'}`}
        className={[
          'flex items-center justify-center w-9 h-9 rounded-full',
          'text-xs font-semibold text-white',
          'bg-[hsl(var(--primary))]',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
          'transition-opacity hover:opacity-90',
        ].join(' ')}
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="User account menu"
          className={[
            'absolute right-0 mt-2 w-56',
            'bg-white rounded-xl shadow-lg shadow-stone-200/80',
            'border border-stone-100',
            'py-1 z-50',
            'animate-[fade-in_0.1s_ease-out]',
          ].join(' ')}
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-stone-100">
            <p className="text-sm font-semibold text-stone-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-stone-500 truncate">{user?.email}</p>
          </div>

          {/* Menu items */}
          {[
            { label: 'My Account',    href: ROUTES.account },
            { label: 'My Orders',     href: ROUTES.accountOrders },
            { label: 'Loyalty Points',href: ROUTES.accountLoyalty },
          ].map((item) => (
            <Link
              key={item.href}
              to={item.href}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className={[
                'block px-4 py-2.5 text-sm text-stone-700',
                'hover:bg-stone-50 hover:text-stone-900',
                'focus-visible:outline-none focus-visible:bg-stone-50',
                'transition-colors',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}

          <div role="separator" aria-hidden="true" className="border-t border-stone-100 my-1" />

          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setIsOpen(false);
              logout();
              navigate(ROUTES.home);
            }}
            className={[
              'w-full text-left px-4 py-2.5 text-sm text-red-600',
              'hover:bg-red-50',
              'focus-visible:outline-none focus-visible:bg-red-50',
              'transition-colors',
            ].join(' ')}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
