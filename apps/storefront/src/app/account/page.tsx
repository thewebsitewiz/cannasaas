'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { gqlAuth } from '@/lib/graphql';
import { useAuthStore } from '@/stores/auth.store';
import { User, Package, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const ME_QUERY = `query { me { id email role } }`;

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [isAuthenticated, router]);

  // Refresh user data from API
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => gqlAuth<any>(ME_QUERY),
    select: (d) => d.me,
    enabled: isAuthenticated(),
  });

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user.email.split('@')[0];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-txt">My Account</h1>
          <p className="text-sm text-txt-muted">{user.email}</p>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-txt-muted hover:text-danger transition-colors">
          <LogOut size={16} /> Sign out
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-surface border border-bdr rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center">
            <User size={24} className="text-brand-600" />
          </div>
          <div>
            <p className="font-semibold text-txt">{displayName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-txt-muted capitalize">{meData?.role || user.role}</span>
              {user.ageVerified ? (
                <span className="flex items-center gap-1 text-xs text-success">
                  <ShieldCheck size={12} /> Age Verified
                </span>
              ) : (
                <Link href="/account/verify" className="flex items-center gap-1 text-xs text-warning hover:text-warning/80">
                  <ShieldCheck size={12} /> Verify Age to Order <ChevronRight size={12} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link href="/products" className="bg-surface border border-bdr rounded-2xl p-6 hover:bg-surface-hover transition-colors">
          <Package size={24} className="text-brand-600 mb-3" />
          <h3 className="font-semibold text-txt mb-1">Browse Menu</h3>
          <p className="text-sm text-txt-muted">Explore our curated cannabis menu</p>
        </Link>
        {!user.ageVerified && (
          <Link href="/account/verify" className="bg-surface border border-bdr rounded-2xl p-6 hover:bg-surface-hover transition-colors">
            <ShieldCheck size={24} className="text-warning mb-3" />
            <h3 className="font-semibold text-txt mb-1">Verify Your Age</h3>
            <p className="text-sm text-txt-muted">Required before placing orders</p>
          </Link>
        )}
      </div>

      {/* Order History Placeholder */}
      <div className="bg-surface border border-bdr rounded-2xl p-6">
        <h2 className="font-semibold text-txt flex items-center gap-2 mb-4">
          <Package size={18} /> Order History
        </h2>
        <div className="text-center py-8">
          <Package size={32} className="mx-auto text-txt-faint mb-2" />
          <p className="text-sm text-txt-muted">Your order history will appear here</p>
          <Link href="/products" className="text-sm text-brand-600 hover:text-brand-500 font-medium mt-2 inline-block">
            Browse Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
