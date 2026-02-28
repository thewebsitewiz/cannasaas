// apps/storefront/src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@cannasaas/ui';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-[120px] font-black leading-none text-[var(--color-brand)] opacity-20 select-none" aria-hidden="true">404</p>
        <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-3 -mt-8">Page Not Found</h1>
        <p className="text-[var(--color-text-secondary)] mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Button variant="primary" size="lg" as={Link} to="/">Return Home</Button>
      </div>
    </main>
  );
}
