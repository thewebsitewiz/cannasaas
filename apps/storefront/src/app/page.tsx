'use client';

import Link from 'next/link';
import { useProductSearch } from '@/hooks/useProductSearch';
import { ProductCard } from '@/components/product/ProductCard';
import { Leaf, Truck, ShieldCheck, Clock } from 'lucide-react';

export default function HomePage() {
  const { data } = useProductSearch({ limit: 4, sortBy: 'newest' });
  const products = data?.products ?? [];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4">
            <Leaf size={48} className="text-brand-200" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Welcome to GreenLeaf</h1>
          <p className="text-lg text-brand-100 max-w-2xl mx-auto mb-8">
            Licensed cannabis dispensary in Nyack, NY. Browse our curated menu and order for pickup or delivery.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/products"
              className="bg-white text-brand-700 font-semibold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors"
            >
              Shop Menu
            </Link>
            <Link
              href="/products"
              className="border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              View Strains
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-100">
            <Truck size={24} className="text-brand-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Delivery & Pickup</h3>
              <p className="text-sm text-gray-500 mt-1">Free local delivery within 3 miles. Same-day pickup available.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-100">
            <ShieldCheck size={24} className="text-brand-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">100% Compliant</h3>
              <p className="text-sm text-gray-500 mt-1">All products tested and tracked via Metrc. Fully licensed in NY.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-100">
            <Clock size={24} className="text-brand-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Order Ahead</h3>
              <p className="text-sm text-gray-500 mt-1">Schedule your pickup time and skip the wait.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/products" className="text-sm text-brand-600 font-medium hover:text-brand-700">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
