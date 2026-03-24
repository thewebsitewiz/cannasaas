'use client';

import Link from 'next/link';
import { Plus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { useState } from 'react';

interface ProductCardProps {
  product: {
    id?: string;
    productId?: string;
    name: string;
    strainName?: string;
    strainType?: string;
    thcPercent?: number;
    cbdPercent?: number;
    effects?: string[];
    flavors?: string[];
    description?: string;
    variants?: { variantId?: string; name?: string; retailPrice?: number }[];
  };
}

// Unique gradient backgrounds per strain type — no more generic leaf icons
const STRAIN_GRADIENTS: Record<string, { bg: string; accent: string; badge: string }> = {
  sativa: {
    bg: 'from-amber-100 via-orange-50 to-yellow-50',
    accent: 'text-amber-700',
    badge: 'bg-amber-500 text-white',
  },
  indica: {
    bg: 'from-violet-100 via-purple-50 to-indigo-50',
    accent: 'text-violet-700',
    badge: 'bg-violet-500 text-white',
  },
  hybrid: {
    bg: 'from-emerald-100 via-green-50 to-teal-50',
    accent: 'text-emerald-700',
    badge: 'bg-emerald-500 text-white',
  },
};

// Generate a unique visual pattern based on product name (deterministic)
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const productId = product.id || product.productId || '';
  const strain = STRAIN_GRADIENTS[product.strainType || 'hybrid'] || STRAIN_GRADIENTS.hybrid;
  const price = product.variants?.[0]?.retailPrice ? Number(product.variants[0].retailPrice) : 0;
  const hash = hashCode(product.name);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId,
      variantId: product.variants?.[0]?.variantId ?? productId,
      name: product.name,
      variantName: product.variants?.[0]?.name ?? 'Standard',
      price,
      strainType: product.strainType,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link
      href={`/products/${productId}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500"
    >
      {/* Product visual — generative botanical pattern instead of placeholder */}
      <div className={`aspect-[4/3] bg-gradient-to-br ${strain.bg} relative overflow-hidden`}>
        {/* Decorative botanical circles — unique per product */}
        <div
          className="absolute rounded-full opacity-20 blur-xl"
          style={{
            width: `${60 + (hash % 40)}%`,
            height: `${60 + (hash % 40)}%`,
            top: `${10 + (hash % 30)}%`,
            left: `${10 + ((hash >> 4) % 30)}%`,
            background: product.strainType === 'sativa' ? '#f59e0b' : product.strainType === 'indica' ? '#8b5cf6' : '#10b981',
          }}
        />
        <div
          className="absolute rounded-full opacity-10 blur-2xl"
          style={{
            width: `${40 + ((hash >> 8) % 30)}%`,
            height: `${40 + ((hash >> 8) % 30)}%`,
            bottom: `${5 + ((hash >> 12) % 20)}%`,
            right: `${5 + ((hash >> 16) % 20)}%`,
            background: product.strainType === 'sativa' ? '#d97706' : product.strainType === 'indica' ? '#7c3aed' : '#059669',
          }}
        />

        {/* Strain badge */}
        {product.strainType && (
          <span className={`absolute top-3 left-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${strain.badge} shadow-sm`}>
            {product.strainType}
          </span>
        )}

        {/* THC/CBD pills */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {product.thcPercent != null && product.thcPercent > 0 && (
            <span className="text-[10px] font-bold bg-white/80 backdrop-blur-sm text-gray-700 px-2 py-0.5 rounded-full">
              THC {product.thcPercent}%
            </span>
          )}
          {product.cbdPercent != null && product.cbdPercent > 0 && (
            <span className="text-[10px] font-bold bg-white/80 backdrop-blur-sm text-gray-700 px-2 py-0.5 rounded-full">
              CBD {product.cbdPercent}%
            </span>
          )}
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          className={`absolute bottom-3 right-3 p-2.5 rounded-full shadow-lg transition-all duration-300 ${
            added
              ? 'bg-emerald-500 text-white scale-110'
              : 'bg-white text-gray-700 opacity-0 group-hover:opacity-100 hover:bg-emerald-500 hover:text-white'
          }`}
          aria-label={`Add ${product.name} to cart`}
        >
          {added ? <ShoppingBag size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {/* Product info */}
      <div className="p-4 pb-5">
        <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors leading-tight">
          {product.name}
        </h3>

        {product.strainName && product.strainName !== product.name && (
          <p className="text-xs text-gray-400 mt-0.5 italic">{product.strainName}</p>
        )}

        {/* Effects tags */}
        {product.effects && product.effects.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {product.effects.slice(0, 3).map((effect) => (
              <span
                key={effect}
                className="text-[10px] font-medium bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100"
              >
                {effect}
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        {price > 0 && (
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-lg font-bold text-gray-900">${price.toFixed(2)}</span>
            {product.variants?.[0]?.name && product.variants[0].name !== 'Standard' && (
              <span className="text-xs text-gray-400">/ {product.variants[0].name}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
