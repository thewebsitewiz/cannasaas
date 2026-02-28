// apps/storefront/src/pages/Account/AccountPage.tsx
// STUB — implement in Part 7 follow-up
import React from 'react';
import { useAuthStore } from '@cannasaas/stores';

export default function AccountPage() {
  const { user } = useAuthStore();
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-4">My Account</h1>
      {user && <p className="text-[var(--color-text-secondary)]">Welcome, {user.firstName} {user.lastName}</p>}
    </div>
  );
}
