'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { gql, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';
import { ProductCard } from '@/components/product/ProductCard';
import { Leaf, Truck, ShieldCheck, Clock } from 'lucide-react';

const FEATURED_PRODUCTS = `
  query FeaturedProducts($dispensaryId: ID!, $limit: Int) {
    products(dispensaryId: $dispensaryId, limit: $limit) {
      id name description strainType thcPercent cbdPercent
      variants { variantId name retailPrice stockQuantity stockStatus }
    }
  }
`;

export default function HomePage() {
  const { data } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () =>
      gql<{ products: any[] }>(FEATURED_PRODUCTS, {
        dispensaryId: DEFAULT_DISPENSARY_ID,
        limit: 8,
      }),
    select: (d) => d.products,
  });

  const products = data ?? [];

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-600 to-brand-500 text-txt-inverse py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4">
            <Leaf size={48} className="opacity-70" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">Welcome to GreenLeaf</h1>
          <p className="text-lg opacity-80 max-w-2xl mx-auto mb-8">
            Licensed cannabis dispensary in Tappan, NY. Browse our curated menu and order for pickup or delivery.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/products" className="bg-surface text-brand-600 font-semibold px-6 py-3 rounded-xl hover:bg-bg-alt transition-colors">
              Shop Menu
            </Link>
            <Link href="/products" className="border border-white/30 text-txt-inverse font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
              View Strains
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4 p-6 bg-surface rounded-xl border border-bdr">
            <Truck size={24} className="text-brand-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-txt">Delivery & Pickup</h3>
              <p className="text-sm text-txt-muted mt-1">Free local delivery within 3 miles. Same-day pickup available.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 bg-surface rounded-xl border border-bdr">
            <ShieldCheck size={24} className="text-brand-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-txt">100% Compliant</h3>
              <p className="text-sm text-txt-muted mt-1">All products tested and tracked via Metrc. Fully licensed in NY.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 bg-surface rounded-xl border border-bdr">
            <Clock size={24} className="text-brand-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-txt">Order Ahead</h3>
              <p className="text-sm text-txt-muted mt-1">Schedule your pickup time and skip the wait.</p>
            </div>
          </div>
        </div>
      </section>

      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-txt">Featured Products</h2>
            <Link href="/products" className="text-sm text-brand-600 font-medium hover:text-brand-500">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {products.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 text-center">
          <p className="text-txt-muted py-12">Loading products...</p>
        </section>
      )}
    </div>
  );
}
