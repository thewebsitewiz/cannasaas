'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { gqlAuth, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';
import { useAuthStore } from '@/stores/auth.store';
import { User, MapPin, Package, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const PROFILE_QUERY = `query { myProfile {
  profileId phone dateOfBirth ageVerified totalOrders totalSpent loyaltyPoints
  marketingOptIn smsOptIn isMedicalPatient
}}`;

const ADDRESSES_QUERY = `query { myAddresses {
  addressId label addressLine1 addressLine2 city state zip isDefault
}}`;

const ORDERS_QUERY = `query($limit: Int!) { myOrders(limit: $limit) {
  total orders { orderId dispensaryName orderType orderStatus subtotal total itemCount createdAt }
}}`;

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: profile } = useQuery({
    queryKey: ['myProfile'],
    queryFn: () => gqlAuth<any>(PROFILE_QUERY),
    select: (d) => d.myProfile,
    enabled: isAuthenticated(),
  });

  const { data: addresses } = useQuery({
    queryKey: ['myAddresses'],
    queryFn: () => gqlAuth<any>(ADDRESSES_QUERY),
    select: (d) => d.myAddresses,
    enabled: isAuthenticated(),
  });

  const { data: orderData } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => gqlAuth<any>(ORDERS_QUERY, { limit: 10 }),
    select: (d) => d.myOrders,
    enabled: isAuthenticated(),
  });

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': case 'delivered': case 'picked_up': return 'bg-green-50 text-green-700';
      case 'preparing': case 'ready_for_pickup': return 'bg-blue-50 text-blue-700';
      case 'cancelled': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
          <LogOut size={16} /> Sign out
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
            <User size={24} className="text-brand-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.firstName || user.email.split('@')[0]} {user.lastName || ''}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {profile?.ageVerified ? (
                <span className="flex items-center gap-1 text-xs text-green-600"><ShieldCheck size={12} /> Age Verified</span>
              ) : (
                <Link href="/account/verify" className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700">
                  <ShieldCheck size={12} /> Verify Age to Order <ChevronRight size={12} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {profile && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xl font-bold text-brand-700">{profile.totalOrders}</p>
              <p className="text-xs text-gray-500">Orders</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-brand-700">${parseFloat(profile.totalSpent || 0).toFixed(0)}</p>
              <p className="text-xs text-gray-500">Total Spent</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-brand-700">{profile.loyaltyPoints}</p>
              <p className="text-xs text-gray-500">Points</p>
            </div>
          </div>
        )}
      </div>

      {/* Addresses */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <MapPin size={18} /> Saved Addresses
        </h2>
        {addresses && addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map((addr: any) => (
              <div key={addr.addressId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium">
                    {addr.label}
                    {addr.isDefault && <span className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Default</span>}
                  </p>
                  <p className="text-xs text-gray-500">{addr.addressLine1}, {addr.city}, {addr.state} {addr.zip}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No saved addresses yet</p>
        )}
      </div>

      {/* Order History */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Package size={18} /> Order History
          {orderData?.total > 0 && <span className="text-xs text-gray-400 font-normal ml-1">({orderData.total} total)</span>}
        </h2>
        {orderData?.orders && orderData.orders.length > 0 ? (
          <div className="space-y-3">
            {orderData.orders.map((order: any) => (
              <div key={order.orderId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    #{order.orderId.slice(0, 8).toUpperCase()}
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order.itemCount} item{order.itemCount !== 1 ? 's' : ''} · {order.orderType}
                    {order.dispensaryName && ` · ${order.dispensaryName}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums">${parseFloat(order.total).toFixed(2)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(order.orderStatus)}`}>
                    {order.orderStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No orders yet</p>
            <Link href="/products" className="text-sm text-brand-600 hover:text-brand-700 font-medium mt-2 inline-block">
              Browse Menu
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
