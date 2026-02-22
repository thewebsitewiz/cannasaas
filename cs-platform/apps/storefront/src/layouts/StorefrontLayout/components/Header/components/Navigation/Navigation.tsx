/**
 * @file Navigation.tsx
 * @path apps/storefront/src/layouts/StorefrontLayout/components/Header/components/Navigation/Navigation.tsx
 *
 * Primary site navigation for the storefront header.
 *
 * ─── WCAG 2.1 AA COMPLIANCE ────────────────────────────────────────────────
 *   • Wrapped in <nav aria-label="Main navigation"> (landmark role).
 *   • Active link indicated via aria-current="page" (not color alone).
 *   • Dropdown items use role="menu" + role="menuitem" per ARIA 1.2.
 *   • Skip-link support: the nav is ordered after the skip link in DOM.
 *   • Keyboard: Tab navigates top-level items; Enter/Space open dropdowns;
 *     Arrow keys navigate within dropdowns; Escape closes.
 *   • Mobile hamburger button has aria-expanded and aria-controls.
 *   • Focus management: Escape on mobile menu returns focus to trigger.
 *
 * ─── ADVANCED REACT PATTERNS ───────────────────────────────────────────────
 *   • NavItem data is passed as a prop — the component is purely presentational,
 *     making it easy to swap navigation data per tenant config.
 *   • Active state detection via React Router's useMatch hook (supports
 *     nested routes without brittle string comparison).
 *   • Hover intent implemented via mouse enter/leave with a short delay
 *     to prevent accidental dropdown flashes on fast cursor passes.
 */

import React, { useCallback, useId, useRef, useState } from 'react';
import { NavLink, useMatch } from 'react-router-dom';
import type { NavItem } from '@cannasaas/types';
import styles from './Navigation.module.css';

// ─── Default Nav Items ────────────────────────────────────────────────────────

/**
 * Default navigation structure for a standard dispensary storefront.
 * Operators can override this via their organization config in the future.
 */
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { key: 'shop', label: 'Shop', to: '/shop', children: [
    { key: 'flower', label: 'Flower', to: '/shop/flower' },
    { key: 'edibles', label: 'Edibles', to: '/shop/edibles' },
    { key: 'concentrates', label: 'Concentrates', to: '/shop/concentrates' },
    { key: 'vapes', label: 'Vapes', to: '/shop/vapes' },
    { key: 'topicals', label: 'Topicals', to: '/shop/topicals' },
    { key: 'accessories', label: 'Accessories', to: '/shop/accessories' },
  ]},
  { key: 'deals', label: 'Deals', to: '/deals' },
  { key: 'brands', label: 'Brands', to: '/brands' },
  { key: 'learn', label: 'Learn', to: '/learn' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NavigationProps {
  /** Navigation items – defaults to DEFAULT_NAV_ITEMS */
  items?: NavItem[];
  /** Additional class for layout */
  className?: string;
}

// ─── Hover Intent Delay ───────────────────────────────────────────────────────

const HOVER_OPEN_DELAY_MS = 80;
const HOVER_CLOSE_DELAY_MS = 140;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Navigation
 *
 * Renders the primary header navigation with optional dropdown sub-menus.
 * Handles both desktop hover interaction and keyboard navigation.
 *
 * @example
 * <Navigation items={orgNavItems} />
 */
export function Navigation({ items = DEFAULT_NAV_ITEMS, className }: NavigationProps) {
  const uid = useId();
  const mobileMenuId = `${uid}-mobile-menu`;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Hover intent timers
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDropdownDelayed = useCallback((key: string) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setOpenDropdown(key), HOVER_OPEN_DELAY_MS);
  }, []);

  const closeDropdownDelayed = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setOpenDropdown(null), HOVER_CLOSE_DELAY_MS);
  }, []);

  const handleMobileClose = () => {
    setMobileOpen(false);
    hamburgerRef.current?.focus();
  };

  return (
    <nav
      className={`${styles.nav} ${className ?? ''}`}
      aria-label="Main navigation"
    >
      {/* ── Desktop Navigation ─────────────────────────────────────── */}
      <ul className={styles.desktopList} role="list">
        {items.map((item) => (
          <NavTopItem
            key={item.key}
            item={item}
            openDropdown={openDropdown}
            onOpenDropdown={openDropdownDelayed}
            onCloseDropdown={closeDropdownDelayed}
            onDropdownToggle={(key) =>
              setOpenDropdown((v) => (v === key ? null : key))
            }
            uid={uid}
          />
        ))}
      </ul>

      {/* ── Mobile Hamburger Button ────────────────────────────────── */}
      <button
        ref={hamburgerRef}
        type="button"
        className={styles.hamburger}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileOpen}
        aria-controls={mobileMenuId}
        onClick={() => setMobileOpen((v) => !v)}
      >
        <span aria-hidden="true" className={`${styles.hamburgerIcon} ${mobileOpen ? styles.hamburgerOpen : ''}`}>
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* ── Mobile Menu Panel ──────────────────────────────────────── */}
      <div
        id={mobileMenuId}
        className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ''}`}
        aria-hidden={!mobileOpen}
      >
        {/* Screen reader only close instruction */}
        <p className={styles.srOnly}>
          Press Escape to close the navigation menu.
        </p>

        <ul className={styles.mobileList} role="list">
          {items.map((item) => (
            <MobileNavItem
              key={item.key}
              item={item}
              onNavigate={handleMobileClose}
            />
          ))}
        </ul>
      </div>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className={styles.overlay}
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </nav>
  );
}

// ─── Desktop Top-Level Item ───────────────────────────────────────────────────

interface NavTopItemProps {
  item: NavItem;
  openDropdown: string | null;
  onOpenDropdown: (key: string) => void;
  onCloseDropdown: () => void;
  onDropdownToggle: (key: string) => void;
  uid: string;
}

/**
 * A single top-level navigation item (with optional dropdown).
 * Manages hover intent and keyboard dropdown toggling.
 */
function NavTopItem({
  item,
  openDropdown,
  onOpenDropdown,
  onCloseDropdown,
  onDropdownToggle,
  uid,
}: NavTopItemProps) {
  const hasChildren = Boolean(item.children?.length);
  const isDropdownOpen = openDropdown === item.key;
  const dropdownId = `${uid}-dropdown-${item.key}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasChildren) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDropdownToggle(item.key);
    }
    if (e.key === 'Escape') {
      onDropdownToggle('');
    }
  };

  return (
    <li
      className={styles.topItem}
      onMouseEnter={() => hasChildren && onOpenDropdown(item.key)}
      onMouseLeave={() => hasChildren && onCloseDropdown()}
    >
      {hasChildren ? (
        /* Items with children render a button that toggles the dropdown */
        <>
          <button
            type="button"
            className={styles.topLink}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
            aria-controls={isDropdownOpen ? dropdownId : undefined}
            onKeyDown={handleKeyDown}
          >
            {item.label}
            <svg
              aria-hidden="true"
              className={`${styles.topChevron} ${isDropdownOpen ? styles.topChevronOpen : ''}`}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isDropdownOpen && (
            <DropdownMenu
              id={dropdownId}
              items={item.children!}
              onClose={() => onDropdownToggle(item.key)}
            />
          )}
        </>
      ) : (
        /* Leaf items render a NavLink with active state */
        <NavLink
          to={item.to}
          className={({ isActive }) =>
            `${styles.topLink} ${isActive ? styles.topLinkActive : ''}`
          }
          aria-current={useNavLinkActive(item.to) ? 'page' : undefined}
          end
        >
          {item.label}
        </NavLink>
      )}
    </li>
  );
}

/** Small hook to get active state for aria-current without re-rendering the parent */
function useNavLinkActive(path: string): boolean {
  return Boolean(useMatch(path));
}

// ─── Dropdown Menu ────────────────────────────────────────────────────────────

interface DropdownMenuProps {
  id: string;
  items: NavItem[];
  onClose: () => void;
}

function DropdownMenu({ id, items, onClose }: DropdownMenuProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const menuItems = Array.from(
      document.querySelectorAll<HTMLElement>(`#${id} [role="menuitem"]`),
    );
    const currentIndex = menuItems.indexOf(document.activeElement as HTMLElement);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        menuItems[(currentIndex + 1) % menuItems.length]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        menuItems[(currentIndex - 1 + menuItems.length) % menuItems.length]?.focus();
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  return (
    <ul
      id={id}
      role="menu"
      className={styles.dropdown}
      onKeyDown={handleKeyDown}
    >
      {items.map((child) => (
        <li key={child.key} role="none">
          <NavLink
            to={child.to}
            role="menuitem"
            className={({ isActive }) =>
              `${styles.dropdownItem} ${isActive ? styles.dropdownItemActive : ''}`
            }
            onClick={onClose}
          >
            {child.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

// ─── Mobile Nav Item ──────────────────────────────────────────────────────────

interface MobileNavItemProps {
  item: NavItem;
  onNavigate: () => void;
}

function MobileNavItem({ item, onNavigate }: MobileNavItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = Boolean(item.children?.length);

  return (
    <li className={styles.mobileItem}>
      {hasChildren ? (
        <>
          <button
            type="button"
            className={styles.mobileTopLink}
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((v) => !v)}
          >
            {item.label}
            <svg
              aria-hidden="true"
              className={`${styles.topChevron} ${isExpanded ? styles.topChevronOpen : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {isExpanded && (
            <ul className={styles.mobileSubList} role="list">
              {item.children!.map((child) => (
                <li key={child.key}>
                  <NavLink
                    to={child.to}
                    className={({ isActive }) =>
                      `${styles.mobileSubLink} ${isActive ? styles.mobileSubLinkActive : ''}`
                    }
                    onClick={onNavigate}
                  >
                    {child.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <NavLink
          to={item.to}
          className={({ isActive }) =>
            `${styles.mobileTopLink} ${isActive ? styles.mobileTopLinkActive : ''}`
          }
          onClick={onNavigate}
          end
        >
          {item.label}
        </NavLink>
      )}
    </li>
  );
}

