'use client';

import {
  ArrowRight,
  Clock,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import { DEFAULT_DISPENSARY_ID, gql } from '@/lib/graphql';
import { useEffect, useState } from 'react';

import { Leaf } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';
import { useQuery } from '@tanstack/react-query';

const CATEGORIES = [
  {
    name: 'Flower',
    emoji: '🌿',
    gradient: 'from-emerald-500/10 to-green-600/5',
  },
  {
    name: 'Edibles',
    emoji: '🍬',
    gradient: 'from-amber-500/10 to-orange-500/5',
  },
  { name: 'Vapes', emoji: '💨', gradient: 'from-sky-500/10 to-blue-500/5' },
  { name: 'Pre-Rolls', emoji: '🔥', gradient: 'from-rose-500/10 to-red-500/5' },
  {
    name: 'Concentrates',
    emoji: '💎',
    gradient: 'from-violet-500/10 to-purple-500/5',
  },
  { name: 'Topicals', emoji: '🧴', gradient: 'from-teal-500/10 to-cyan-500/5' },
];

const FEATURED_PRODUCTS = `
  query FeaturedProducts($dispensaryId: ID!, $limit: Int) {
    products(dispensaryId: $dispensaryId, limit: $limit) {
      id name description strainType thcPercent cbdPercent
    }
  }
`;

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-500 text-txt-inverse py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4">
            <Leaf size={48} className="opacity-70" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Welcome to GreenLeaf
          </h1>
          <p className="text-lg opacity-80 max-w-2xl mx-auto mb-8">
            Licensed cannabis dispensary in Tappan, NY. Browse our curated menu
            and order for pickup or delivery.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/products"
              className="bg-surface text-brand-600 font-semibold px-6 py-3 rounded-xl hover:bg-bg-alt transition-colors"
            >
              Shop Menu
            </Link>
            <Link
              href="/products"
              className="border border-white/30 text-txt-inverse font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              View Strains
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-16 text-white/30 text-xs font-medium tracking-wider uppercase">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} /> Metrc Verified
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1.5">
              <Star size={14} /> 4.9 Rating
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1.5">
              <Truck size={14} /> Same-Day Delivery
            </span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.name}
              href={`/products?category=${cat.name.toLowerCase()}`}
              className={`group bg-white rounded-2xl p-5 text-center border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${i * 80 + 800}ms` }}
            >
              <div
                className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform duration-300`}
              >
                {cat.emoji}
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Value Props */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4 p-6 bg-surface rounded-xl border border-bdr">
            <Truck size={24} className="text-brand-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-txt">Delivery & Pickup</h3>
              <p className="text-sm text-txt-muted mt-1">
                Free local delivery within 3 miles. Same-day pickup available.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 bg-surface rounded-xl border border-bdr">
            <ShieldCheck size={24} className="text-brand-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-txt">100% Compliant</h3>
              <p className="text-sm text-txt-muted mt-1">
                All products tested and tracked via Metrc. Fully licensed in NY.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 bg-surface rounded-xl border border-bdr">
            <Clock size={24} className="text-brand-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-txt">Order Ahead</h3>
              <p className="text-sm text-txt-muted mt-1">
                Schedule your pickup time and skip the wait.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-txt">Featured Products</h2>
            <Link
              href="/products"
              className="text-sm text-brand-600 font-medium hover:text-brand-500"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.map((p: any, i: number) => (
              <div
                key={p.id || p.productId}
                className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 100 + 1500}ms` }}
              >
                <ProductCard product={p} />
              </div>
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
