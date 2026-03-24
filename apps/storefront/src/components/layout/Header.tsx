'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Search, User, Zap, Menu, X } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useState, useEffect } from 'react';

export function Header() {
  const itemCount = useCartStore((s) => s.itemCount());
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Only use transparent header on homepage
  const isHomepage = pathname === '/';

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isLoggedIn = mounted && isAuthenticated();
  const solid = !isHomepage || scrolled;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      solid
        ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black tracking-tighter transition-colors duration-300 ${
            solid ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white backdrop-blur-sm border border-white/20'
          }`}>GL</div>
          <span className={`text-lg font-semibold tracking-tight transition-colors duration-300 ${
            solid ? 'text-gray-900' : 'text-white'
          }`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>GreenLeaf</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { href: '/products', label: 'Menu' },
            { href: '/products?category=flower', label: 'Flower' },
            { href: '/products?category=edibles', label: 'Edibles' },
            { href: '/products?category=vapes', label: 'Vapes' },
          ].map((link) => (
            <Link key={link.href} href={link.href}
              className={`text-sm font-medium transition-colors duration-300 ${
                solid ? 'text-gray-500 hover:text-gray-900' : 'text-white/60 hover:text-white'
              }`}>{link.label}</Link>
          ))}
          <Link href="/express-checkout"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-300 ${
              solid ? 'text-emerald-600 hover:text-emerald-700' : 'text-emerald-300 hover:text-emerald-200'
            }`}><Zap size={13} /> Express</Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link href="/products" aria-label="Search"
            className={`p-2.5 rounded-full transition-all duration-300 ${
              solid ? 'text-gray-400 hover:text-gray-900 hover:bg-gray-100' : 'text-white/50 hover:text-white hover:bg-white/10'
            }`}><Search size={18} /></Link>

          <Link href="/cart" aria-label="Cart"
            className={`relative p-2.5 rounded-full transition-all duration-300 ${
              solid ? 'text-gray-400 hover:text-gray-900 hover:bg-gray-100' : 'text-white/50 hover:text-white hover:bg-white/10'
            }`}>
            <ShoppingBag size={18} />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full min-w-[18px] min-h-[18px] flex items-center justify-center shadow-sm">
                {itemCount}
              </span>
            )}
          </Link>

          {isLoggedIn ? (
            <Link href="/account"
              className={`hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full transition-all duration-300 ${
                solid ? 'hover:bg-gray-100' : 'hover:bg-white/10'
              }`}>
              <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-700">
                  {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </span>
              </div>
              <span className={`text-sm font-medium transition-colors duration-300 ${solid ? 'text-gray-700' : 'text-white/80'}`}>
                {user?.firstName || user?.email?.split('@')[0]}
              </span>
            </Link>
          ) : (
            <Link href="/login"
              className={`hidden sm:flex items-center text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 ${
                solid
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  : 'text-white bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm'
              }`}>Sign In</Link>
          )}

          {/* Mobile menu */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2.5 rounded-full transition-colors ${
              solid ? 'text-gray-600 hover:bg-gray-100' : 'text-white/70 hover:bg-white/10'
            }`} aria-label="Toggle menu">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
            {['Menu', 'Flower', 'Edibles', 'Vapes', 'Pre-Rolls'].map((item) => (
              <Link key={item} href={item === 'Menu' ? '/products' : `/products?category=${item.toLowerCase()}`}
                className="text-sm font-medium text-gray-600 hover:text-emerald-700 py-2.5 border-b border-gray-50 last:border-0"
                onClick={() => setMobileOpen(false)}>{item}</Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
