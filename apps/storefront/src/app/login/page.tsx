'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Leaf, LogIn, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/account';
  const expired = searchParams?.get('expired') === 'true';
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Leaf size={40} className="mx-auto text-brand-600 mb-3" />
          <h1 className="text-2xl font-bold font-display text-txt">Welcome back</h1>
          <p className="text-sm text-txt-muted mt-1">Sign in to your account</p>
        </div>

        {expired && (
          <div className="mb-4 bg-warning-bg border border-warning/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-warning shrink-0" />
            <p className="text-sm text-txt">Your session has expired. Please sign in again.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger-bg border border-danger/20 text-danger text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-bdr rounded-xl text-sm bg-surface text-txt focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              placeholder="you@email.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-bdr rounded-xl text-sm bg-surface text-txt focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-brand-600 text-txt-inverse py-3 rounded-xl font-semibold hover:bg-brand-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        <p className="text-center text-sm text-txt-muted mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand-600 hover:text-brand-500 font-medium">Create one</Link>
        </p>

        <div className="mt-8 p-4 bg-bg-alt rounded-xl text-xs text-txt-muted">
          <p className="font-medium text-txt-secondary mb-1">Test account:</p>
          <p>customer@greenleaf.com / password123</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-txt-muted">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
