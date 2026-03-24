import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { Maximize, Minimize, Leaf } from 'lucide-react';

const PRODUCTS_QUERY = `query($dispensaryId: ID!) {
  adminProducts(dispensaryId: $dispensaryId) {
    id name strainType thcPercent cbdPercent
    variants { variantId name retailPrice }
    category
  }
}`;

const PROMOTIONS_QUERY = `query($dispensaryId: ID!) {
  activePromotions(dispensaryId: $dispensaryId) {
    id title description productIds discountPercent
  }
}`;

const CATEGORIES = ['Flower', 'Edible', 'Vape', 'Pre-Roll', 'Concentrate', 'Topical', 'Tincture'];

const STRAIN_BADGE: Record<string, string> = {
  sativa: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  indica: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  hybrid: 'bg-green-500/20 text-green-300 border border-green-500/30',
};

export function MenuBoardPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clock, setClock] = useState(new Date());

  // Clock update every second
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-rotate categories every 15 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setActiveCategoryIndex((prev) => (prev + 1) % CATEGORIES.length);
    }, 15_000);
    return () => clearInterval(id);
  }, []);

  // Products query — auto-refresh every 60s
  const { data: products } = useQuery({
    queryKey: ['menuBoardProducts', dispensaryId],
    queryFn: () => gqlRequest<any>(PRODUCTS_QUERY, { dispensaryId }),
    select: (d) => d.adminProducts ?? [],
    enabled: !!dispensaryId,
    refetchInterval: 60_000,
  });

  const { data: promotions } = useQuery({
    queryKey: ['menuBoardPromos', dispensaryId],
    queryFn: () => gqlRequest<any>(PROMOTIONS_QUERY, { dispensaryId }),
    select: (d) => d.activePromotions ?? [],
    enabled: !!dispensaryId,
    refetchInterval: 60_000,
  });

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const activeCategory = CATEGORIES[activeCategoryIndex];
  const filtered = (products ?? []).filter(
    (p: any) => (p.category ?? '').toLowerCase() === activeCategory.toLowerCase(),
  );

  const promoProductIds = new Set(
    (promotions ?? []).flatMap((promo: any) => promo.productIds ?? []),
  );

  const getPrice = (p: any) => {
    const v = p.variants?.[0];
    return v?.retailPrice ? Number(v.retailPrice) : 0;
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-950 text-white -m-8 p-8 relative">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Leaf size={32} className="text-brand-400" />
          <h1 className="text-3xl font-bold">Menu Board</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-2xl font-mono text-gray-400 tabular-nums">{formatTime(clock)}</span>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat}
            onClick={() => setActiveCategoryIndex(i)}
            className={`px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              i === activeCategoryIndex
                ? 'bg-brand-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Promotions banner */}
      {promotions && promotions.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-brand-600/20 to-purple-600/20 border border-brand-500/30 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-brand-400 mb-2">Daily Specials</h2>
          <div className="flex flex-wrap gap-4">
            {promotions.map((promo: any) => (
              <div key={promo.id} className="bg-gray-900/50 rounded-xl px-5 py-3">
                <p className="font-semibold text-white">{promo.title}</p>
                {promo.discountPercent && (
                  <p className="text-brand-400 text-sm font-bold">{promo.discountPercent}% OFF</p>
                )}
                {promo.description && (
                  <p className="text-gray-400 text-sm mt-1">{promo.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p: any) => {
            const price = getPrice(p);
            const isPromo = promoProductIds.has(p.id);
            return (
              <div
                key={p.id}
                className={`bg-gray-900 rounded-2xl p-6 border transition-colors ${
                  isPromo ? 'border-brand-500/50 ring-1 ring-brand-500/20' : 'border-gray-800'
                }`}
              >
                {isPromo && (
                  <span className="inline-block text-xs font-bold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full mb-3">
                    SPECIAL
                  </span>
                )}
                <h3 className="text-xl font-bold text-white mb-2 leading-tight">{p.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  {p.strainType && (
                    <span className={`text-xs font-semibold uppercase px-3 py-1 rounded-full ${
                      STRAIN_BADGE[p.strainType] ?? STRAIN_BADGE.hybrid
                    }`}>
                      {p.strainType}
                    </span>
                  )}
                  {p.thcPercent && (
                    <span className="text-xs font-medium text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                      THC {p.thcPercent}%
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-brand-400">${price.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-600">
          <p className="text-xl">No products in {activeCategory}</p>
        </div>
      )}
    </div>
  );
}
