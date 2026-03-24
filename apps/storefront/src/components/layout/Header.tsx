'use client';

import Link from 'next/link';
import { ShoppingCart, Search, Leaf, User, Zap } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useState, useEffect } from 'react';

export function Header() {
  const itemCount = useCartStore((s) => s.itemCount());
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isLoggedIn = mounted && isAuthenticated();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Leaf size={24} className="text-brand-600" />
          <span className="text-xl font-bold text-gray-900">GreenLeaf</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Shop</Link>
          <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Menu</Link>
          <Link href="/express-checkout" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"><Zap size={14} />Express</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/products" className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
            <Search size={20} />
          </Link>

          <Link href="/cart" className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {isLoggedIn ? (
            <Link href="/account" className="flex items-center gap-2 p-2 text-gray-500 hover:text-gray-900 transition-colors">
              <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center">
                <User size={14} className="text-brand-700" />
              </div>
              <span className="hidden sm:inline text-sm font-medium text-gray-700">
                {user?.firstName || user?.email?.split('@')[0]}
              </span>
            </Link>
          ) : (
            <Link href="/login" className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors px-3 py-1.5 border border-brand-200 rounded-lg hover:bg-brand-50">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
