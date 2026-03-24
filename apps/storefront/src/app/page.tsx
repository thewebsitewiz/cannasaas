'use client';

import Link from 'next/link';
import { useProductSearch } from '@/hooks/useProductSearch';
import { ProductCard } from '@/components/product/ProductCard';
import { Truck, ShieldCheck, Clock, Star, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const CATEGORIES = [
  { name: 'Flower', emoji: '🌿', gradient: 'from-emerald-500/10 to-green-600/5' },
  { name: 'Edibles', emoji: '🍬', gradient: 'from-amber-500/10 to-orange-500/5' },
  { name: 'Vapes', emoji: '💨', gradient: 'from-sky-500/10 to-blue-500/5' },
  { name: 'Pre-Rolls', emoji: '🔥', gradient: 'from-rose-500/10 to-red-500/5' },
  { name: 'Concentrates', emoji: '💎', gradient: 'from-violet-500/10 to-purple-500/5' },
  { name: 'Topicals', emoji: '🧴', gradient: 'from-teal-500/10 to-cyan-500/5' },
];

export default function HomePage() {
  const { data } = useProductSearch({ limit: 8, sortBy: 'newest' });
  const products = data?.products ?? [];
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0a1a0f]">
          <div className="absolute inset-0 opacity-30" style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #2d6a4f 0%, transparent 70%), radial-gradient(ellipse 50% 80% at 80% 20%, #1b4332 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 80%, #245c3a 0%, transparent 60%)',
          }} />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-green-400/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        </div>
        <div className={`relative z-10 max-w-5xl mx-auto px-6 text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-emerald-300/80 text-xs font-medium tracking-wider uppercase mb-8 backdrop-blur-sm">
            <Sparkles size={12} /> Licensed & Lab-Tested
          </div>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-light text-white tracking-tight leading-[0.9] mb-6" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Curated<br /><span className="italic text-emerald-300">Cannabis</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/50 max-w-xl mx-auto mb-10 font-light leading-relaxed">
            Thoughtfully sourced. Rigorously tested. Delivered to your door or ready for pickup.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/products" className="group inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium px-8 py-4 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
              Browse Menu <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/products" className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-medium px-8 py-4 rounded-full border border-white/10 transition-all duration-300 backdrop-blur-sm">
              View Strains
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-16 text-white/30 text-xs font-medium tracking-wider uppercase">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Metrc Verified</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1.5"><Star size={14} /> 4.9 Rating</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1.5"><Truck size={14} /> Same-Day Delivery</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIES.map((cat, i) => (
            <Link key={cat.name} href={`/products?category=${cat.name.toLowerCase()}`}
              className={`group bg-white rounded-2xl p-5 text-center border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${i * 80 + 800}ms` }}>
              <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform duration-300`}>{cat.emoji}</div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700 transition-colors">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Value Props */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Truck, title: 'Free Local Delivery', desc: 'Complimentary delivery within our service area. Orders placed before 5pm arrive same day.' },
            { icon: ShieldCheck, title: 'Lab Tested & Tracked', desc: 'Every product verified through state compliance. Full COA available for each batch.' },
            { icon: Clock, title: 'Skip the Line', desc: 'Order ahead and pick up in minutes. Express checkout for returning customers.' },
          ].map((prop, i) => (
            <div key={prop.title} className={`group p-8 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 hover:border-emerald-100 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${i * 100 + 1200}ms` }}>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <prop.icon size={22} className="text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{prop.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{prop.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-medium tracking-wider uppercase text-emerald-600 mb-2">Our Selection</p>
              <h2 className="text-3xl sm:text-4xl font-light text-gray-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Featured <span className="italic">Products</span>
              </h2>
            </div>
            <Link href="/products" className="group hidden sm:flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
              View all <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.map((p: any, i: number) => (
              <div key={p.id || p.productId} className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 100 + 1500}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[#0a1a0f] text-white py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-emerald-400/60 text-xs font-medium tracking-wider uppercase mb-6">Join Our Community</p>
          <h2 className="text-3xl sm:text-5xl font-light mb-6" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Earn Rewards on <span className="italic text-emerald-300">Every Visit</span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto mb-10 font-light">
            Join our loyalty program and earn points with every purchase. Unlock exclusive discounts, early access, and birthday bonuses.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium px-8 py-4 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
            Create Account <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
