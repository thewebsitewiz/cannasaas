// apps/storefront/src/pages/Auth/RegisterPage.tsx
// STUB — implement using useRegister hook
import React from 'react';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--color-bg-secondary)]">
      <div className="w-full max-w-md bg-[var(--color-surface)] rounded-[var(--p-radius-lg)] border border-[var(--color-border)] shadow-[var(--p-shadow-lg)] p-8">
        <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-6">Create Account</h1>
        <p className="text-[var(--color-text-secondary)] mb-8">Registration form stub — full implementation pending.</p>
        <p className="text-center text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-[var(--color-brand)] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
