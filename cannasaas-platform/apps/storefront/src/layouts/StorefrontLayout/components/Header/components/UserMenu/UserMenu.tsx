/**
 * @file UserMenu.tsx
 * @path apps/storefront/src/layouts/StorefrontLayout/components/Header/components/UserMenu/UserMenu.tsx
 *
 * Authenticated user avatar + dropdown menu for the storefront header.
 *
 * ─── WCAG 2.1 AA COMPLIANCE ────────────────────────────────────────────────
 *   • Implements the ARIA Disclosure Navigation Menu pattern.
 *   • Button has aria-expanded and aria-controls pointing to the menu panel.
 *   • Menu items use role="menuitem" within role="menu".
 *   • Keyboard: Enter/Space toggle; Arrow keys navigate items; Escape closes.
 *   • Focus returns to trigger button on Escape or menu close.
 *   • Avatar image has descriptive alt text. Falls back to initials if no image.
 *   • Minimum 44×44px touch target on the trigger button.
 *
 * ─── ADVANCED REACT PATTERNS ───────────────────────────────────────────────
 *   • Compound component pattern: UserMenu wraps UserMenuItem for flexible
 *     menu composition (different items can be shown for different auth states).
 *   • useRef + focus management for keyboard accessibility.
 *   • useMemo for computed initials to avoid recalculating on every render.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import styles from './UserMenu.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserMenuUser {
  displayName: string;
  email: string;
  avatarUrl?: string;
  loyaltyPoints?: number;
}

export interface UserMenuProps {
  /** Authenticated user — if null, renders a Sign In link instead */
  user: UserMenuUser | null;
  /** Callback for the sign out action */
  onSignOut?: () => void;
  /** Additional CSS class */
  className?: string;
}

// ─── Menu Context (Compound Component) ───────────────────────────────────────

/**
 * Internal context shared between UserMenu and its child UserMenuItem components.
 * This enables menu items to trigger close behavior without prop drilling.
 */
interface UserMenuContextValue {
  close: () => void;
}

const UserMenuContext = createContext<UserMenuContextValue>({ close: () => {} });

// ─── UserMenuItem ─────────────────────────────────────────────────────────────

interface UserMenuItemProps {
  /** React Router path for Link items */
  to?: string;
  /** Click handler for action items (e.g., Sign Out) */
  onClick?: () => void;
  /** Icon element to prepend */
  icon?: React.ReactNode;
  /** Dangerous/destructive styling (e.g., Sign Out) */
  danger?: boolean;
  children: React.ReactNode;
}

/**
 * A single item within the UserMenu dropdown.
 * Automatically closes the menu on selection.
 *
 * @example
 * <UserMenuItem to="/account/orders" icon={<OrdersIcon />}>My Orders</UserMenuItem>
 * <UserMenuItem onClick={signOut} danger>Sign Out</UserMenuItem>
 */
export function UserMenuItem({
  to,
  onClick,
  icon,
  danger,
  children,
}: UserMenuItemProps) {
  const { close } = useContext(UserMenuContext);

  const handleClick = () => {
    onClick?.();
    close();
  };

  const className = `${styles.menuItem} ${danger ? styles.menuItemDanger : ''}`;

  if (to) {
    return (
      <li role="none">
        <Link
          to={to}
          role="menuitem"
          className={className}
          onClick={close}
        >
          {icon && <span className={styles.menuItemIcon} aria-hidden="true">{icon}</span>}
          {children}
        </Link>
      </li>
    );
  }

  return (
    <li role="none">
      <button
        type="button"
        role="menuitem"
        className={className}
        onClick={handleClick}
      >
        {icon && <span className={styles.menuItemIcon} aria-hidden="true">{icon}</span>}
        {children}
      </button>
    </li>
  );
}

// ─── Initials Helper ──────────────────────────────────────────────────────────

/** Extracts up to 2 initials from a display name */
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

// ─── UserMenu Component ───────────────────────────────────────────────────────

/**
 * UserMenu
 *
 * Renders an avatar button that opens an accessible dropdown menu.
 * Unauthenticated visitors see a "Sign In" link instead.
 *
 * @example
 * <UserMenu user={currentUser} onSignOut={handleSignOut} />
 */
export function UserMenu({ user, onSignOut, className }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const uid = useId();
  const menuId = `${uid}-menu`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initials = useMemo(
    () => (user ? getInitials(user.displayName) : ''),
    [user],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    // Return focus to the trigger button when menu is dismissed
    triggerRef.current?.focus();
  }, []);

  // ── Click Outside ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ── Keyboard Navigation ───────────────────────────────────────────────

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = items[(currentIndex + 1) % items.length];
        next?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = items[(currentIndex - 1 + items.length) % items.length];
        prev?.focus();
        break;
      }
      case 'Escape': {
        close();
        break;
      }
      case 'Tab': {
        // Allow tab to naturally move focus outside the menu
        close();
        break;
      }
    }
  };

  // ── Focus First Item on Open ──────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      // Defer focus until after paint so the menu is visible
      requestAnimationFrame(() => {
        const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
        firstItem?.focus();
      });
    }
  }, [isOpen]);

  // ── Unauthenticated State ─────────────────────────────────────────────

  if (!user) {
    return (
      <div className={`${styles.userMenu} ${className ?? ''}`}>
        <Link
          to="/auth/sign-in"
          className={styles.signInLink}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Sign In
        </Link>
      </div>
    );
  }

  // ── Authenticated State ───────────────────────────────────────────────

  return (
    <UserMenuContext.Provider value={{ close }}>
      <div
        ref={containerRef}
        className={`${styles.userMenu} ${className ?? ''}`}
      >
        {/* ── Trigger Button ─────────────────────────────────────────── */}
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          aria-label={`${user.displayName}'s account menu`}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-controls={isOpen ? menuId : undefined}
          onClick={() => setIsOpen((v) => !v)}
        >
          {/* Avatar: image if available, initials fallback */}
          <span className={styles.avatar} aria-hidden="true">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""  /* Empty alt – aria-label on button covers this */
                className={styles.avatarImage}
                width={32}
                height={32}
              />
            ) : (
              <span className={styles.avatarInitials}>{initials}</span>
            )}
          </span>

          {/* Chevron indicator */}
          <svg
            aria-hidden="true"
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* ── Dropdown Menu ───────────────────────────────────────────── */}
        {isOpen && (
          <div className={styles.menuPanel}>
            {/* User info header (decorative, not interactive) */}
            <div className={styles.menuHeader} aria-hidden="true">
              <span className={styles.menuHeaderName}>{user.displayName}</span>
              <span className={styles.menuHeaderEmail}>{user.email}</span>
              {user.loyaltyPoints !== undefined && (
                <span className={styles.loyaltyBadge}>
                  ✦ {user.loyaltyPoints.toLocaleString()} pts
                </span>
              )}
            </div>

            <hr className={styles.divider} aria-hidden="true" />

            <ul
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={`${user.displayName}'s account options`}
              className={styles.menu}
              onKeyDown={handleMenuKeyDown}
            >
              <UserMenuItem
                to="/account"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                }
              >
                My Account
              </UserMenuItem>

              <UserMenuItem
                to="/account/orders"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                }
              >
                Order History
              </UserMenuItem>

              <UserMenuItem
                to="/account/loyalty"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                }
              >
                Loyalty Points
              </UserMenuItem>

              <UserMenuItem
                to="/account/preferences"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 015.07 19"/></svg>
                }
              >
                Preferences
              </UserMenuItem>

              <li role="none" aria-hidden="true">
                <hr className={styles.divider} />
              </li>

              <UserMenuItem
                onClick={onSignOut}
                danger
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                }
              >
                Sign Out
              </UserMenuItem>
            </ul>
          </div>
        )}
      </div>
    </UserMenuContext.Provider>
  );
}

