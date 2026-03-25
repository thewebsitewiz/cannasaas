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
    description?: string;
    variants?: { variantId: string; name: string; retailPrice?: number }[];
  };
}

const STRAIN_COLORS: Record<string, string> = {
  sativa: 'bg-orange-50 text-orange-700 border-orange-200',
  indica: 'bg-purple-50 text-purple-700 border-purple-200',
  hybrid: 'bg-green-50 text-green-700 border-green-200',
};

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const firstVariant = product.variants?.[0];
  const price = firstVariant?.retailPrice ? Number(firstVariant.retailPrice) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      variantId: firstVariant?.variantId ?? product.id,
      name: product.name,
      variantName: firstVariant?.name ?? 'Standard',
      price,
      strainType: product.strainType,
    });
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-surface rounded-xl border border-bdr overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image placeholder */}
      <div className="aspect-square bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center relative">
        <Leaf size={48} className="text-brand-400 opacity-30" />
        {product.strainType && (
          <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STRAIN_COLORS[product.strainType] ?? STRAIN_COLORS.hybrid}`}>
            {product.strainType}
          </span>
        )}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-3 right-3 bg-brand-600 text-txt-inverse p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-500"
          aria-label={`Add ${product.name} to cart`}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="font-semibold text-txt group-hover:text-brand-600 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center gap-3 mt-2 text-xs text-txt-muted">
          {product.thcPercent != null && <span>THC {product.thcPercent}%</span>}
          {product.cbdPercent != null && <span>CBD {product.cbdPercent}%</span>}
        </div>

        {price > 0 && (
          <p className="text-lg font-bold text-brand-600 mt-2">${price.toFixed(2)}</p>
        )}
      </div>
    </Link>
  );
}
