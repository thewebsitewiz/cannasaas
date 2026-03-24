'use client';

import Link from 'next/link';
import { Leaf, Plus } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    strainName?: string;
    strainType?: string;
    thcPercent?: number;
    cbdPercent?: number;
    effects?: string[];
    flavors?: string[];
    description?: string;
  };
}

const STRAIN_COLORS: Record<string, string> = {
  sativa: 'bg-orange-50 text-orange-700 border-orange-200',
  indica: 'bg-purple-50 text-purple-700 border-purple-200',
  hybrid: 'bg-green-50 text-green-700 border-green-200',
};

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      variantId: product.variants?.[0]?.variantId ?? product.id,
      name: product.name,
      variantName: product.variants?.[0]?.name ?? 'Standard',
      price: product.variants?.[0]?.retailPrice ? Number(product.variants[0].retailPrice) : 0,
      strainType: product.strainType,
    });
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image placeholder */}
      <div className="aspect-square bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center relative">
        <Leaf size={48} className="text-brand-300" />
        {product.strainType && (
          <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STRAIN_COLORS[product.strainType] ?? STRAIN_COLORS.hybrid}`}>
            {product.strainType}
          </span>
        )}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-3 right-3 bg-brand-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-700"
          aria-label={`Add ${product.name} to cart`}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
          {product.name}
        </h3>
        {product.strainName && product.strainName !== product.name && (
          <p className="text-xs text-gray-500 mt-0.5">{product.strainName}</p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          {product.thcPercent && <span>THC {product.thcPercent}%</span>}
          {product.cbdPercent && <span>CBD {product.cbdPercent}%</span>}
        </div>

        {product.effects && product.effects.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.effects.slice(0, 3).map((effect) => (
              <span key={effect} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {effect}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
