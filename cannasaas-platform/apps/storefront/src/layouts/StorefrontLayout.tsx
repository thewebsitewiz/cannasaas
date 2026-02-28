// apps/storefront/src/layouts/StorefrontLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { StorefrontHeader } from '../components/Navigation/StorefrontHeader';
import { StorefrontFooter } from '../components/Navigation/StorefrontFooter';
import { CartDrawer } from '../components/Cart/CartDrawer';
import { Toaster } from '@cannasaas/ui';

export function StorefrontLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg)]">
      <StorefrontHeader />
      <main id="main-content" className="flex-1 w-full" tabIndex={-1}>
        <Outlet />
      </main>
      <StorefrontFooter />
      <CartDrawer />
      <Toaster />
    </div>
  );
}
