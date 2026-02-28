// apps/storefront/src/components/Navigation/StorefrontHeader.tsx
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { useCartStore, useAuthStore, useCurrentTenant } from '@cannasaas/stores';
import { useTheme, Button } from '@cannasaas/ui';
import { MobileNav } from './MobileNav';
import { SearchModal } from '../Search/SearchModal';

const NAV_LINKS = [
  { label: 'Flower',       href: '/products?category=flower'      },
  { label: 'Pre-rolls',    href: '/products?category=pre_roll'    },
  { label: 'Vapes',        href: '/products?category=vape'        },
  { label: 'Edibles',      href: '/products?category=edible'      },
  { label: 'Concentrates', href: '/products?category=concentrate' },
];

export function StorefrontHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const tenant = useCurrentTenant();
  const { colorScheme, setColorScheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <header className={[
        'sticky top-0 z-40 w-full',
        'bg-[var(--color-bg)]/95 backdrop-blur-md',
        'border-b border-[var(--color-border)]',
        'transition-shadow duration-[var(--p-dur-normal)]',
        scrolled ? 'shadow-[var(--p-shadow-md)]' : '',
      ].join(' ')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">

            {/* Logo */}
            <Link to="/" aria-label={`${tenant?.dispensaryName ?? 'Home'} — Return to homepage`} className="flex-shrink-0 flex items-center">
              {tenant?.brandingConfig?.logoUrl ? (
                <img src={tenant.brandingConfig.logoUrl} alt={tenant.dispensaryName ?? 'Logo'} className="h-8 object-contain" />
              ) : (
                <span className="text-[var(--p-text-xl)] font-black text-[var(--color-brand)]">
                  {tenant?.dispensaryName ?? 'CannaSaas'}
                </span>
              )}
            </Link>

            {/* Desktop nav */}
            <nav aria-label="Product categories" className="hidden md:flex items-center gap-1 ml-6 flex-1">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.href} to={link.href}
                  className={({ isActive }) => [
                    'px-3 py-2 rounded-[var(--p-radius-md)] text-[var(--p-text-sm)] font-semibold',
                    'transition-colors duration-[var(--p-dur-fast)]',
                    isActive
                      ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]',
                  ].join(' ')}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-1 ml-auto">
              <button type="button" onClick={() => setSearchOpen(true)} aria-label="Open search"
                className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <Search size={20} aria-hidden="true" />
              </button>

              <button type="button"
                onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
                aria-label={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-pressed={colorScheme === 'dark'}
                className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors hidden sm:flex">
                {colorScheme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-1">
                  <Link to="/account" aria-label={`My account — logged in as ${user?.firstName}`}
                    className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors hidden sm:flex">
                    <User size={20} aria-hidden="true" />
                  </Link>
                  <button type="button" onClick={() => { clearAuth(); navigate('/'); }} aria-label="Sign out"
                    className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors hidden sm:flex">
                    <LogOut size={20} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <Link to="/auth/login"
                  className="hidden sm:block text-[var(--p-text-sm)] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] px-3 py-2 rounded-[var(--p-radius-md)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  Sign in
                </Link>
              )}

              <Link to="/cart"
                aria-label={`Cart with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
                className="relative p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <ShoppingCart size={20} aria-hidden="true" />
                {itemCount > 0 && (
                  <span aria-hidden="true" className={[
                    'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1',
                    'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]',
                    'text-[10px] font-bold rounded-full flex items-center justify-center',
                  ].join(' ')}>
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              <button type="button"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-nav"
                aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                className="md:hidden p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]">
                {mobileNavOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileNav id="mobile-nav" isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} links={NAV_LINKS} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
