'use client';

import Link from 'next/link';
import { Leaf, Plus } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    strainType?: string;
    thcPercent?: number;
    cbdPercent?: number;
    description?: string;
    variants?: { variantId: string; name: string; retailPrice?: number; stockQuantity?: number; stockStatus?: string }[];
  };
}

const STRAIN_COLORS: Record<string, string> = {
  sativa: 'bg-orange-50 text-orange-700 border-orange-200',
  indica: 'bg-purple-50 text-purple-700 border-purple-200',
  hybrid: 'bg-green-50 text-green-700 border-green-200',
};

const STOCK_BADGE: Record<string, { label: string; className: string }> = {
  in_stock: { label: 'In Stock', className: 'bg-success-bg text-success' },
  low_stock: { label: 'Low Stock', className: 'bg-warning-bg text-warning' },
  out_of_stock: { label: 'Sold Out', className: 'bg-danger-bg text-danger' },
};

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const firstVariant = product.variants?.[0];
  const price = firstVariant?.retailPrice ? Number(firstVariant.retailPrice) : 0;
  const stockStatus = firstVariant?.stockStatus ?? 'in_stock';
  const stockQuantity = firstVariant?.stockQuantity ?? undefined;
  const isOutOfStock = stockStatus === 'out_of_stock';
  const badge = STOCK_BADGE[stockStatus] ?? STOCK_BADGE.in_stock;

  // Check if already at max in cart
  const inCart = cartItems.find(
    (i) => i.productId === product.id && i.variantId === (firstVariant?.variantId ?? product.id),
  );
  const atMax = stockQuantity != null && inCart != null && inCart.quantity >= stockQuantity;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock || atMax) return;
    addItem({
      productId: product.id,
      variantId: firstVariant?.variantId ?? product.id,
      name: product.name,
      variantName: firstVariant?.name ?? 'Standard',
      price,
      maxQuantity: stockQuantity,
      strainType: product.strainType,
    });
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className={`group bg-surface rounded-xl border border-bdr overflow-hidden hover:shadow-md transition-shadow ${isOutOfStock ? 'opacity-70' : ''}`}
    >
      {/* Image placeholder */}
      <div className="aspect-square bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center relative">
        <Leaf size={48} className="text-brand-400 opacity-30" />
        {product.strainType && (
          <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STRAIN_COLORS[product.strainType] ?? STRAIN_COLORS.hybrid}`}>
            {product.strainType}
          </span>
        )}
        {/* Stock badge */}
        {stockStatus !== 'in_stock' && (
          <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        )}
        {!isOutOfStock && (
          <button
            onClick={handleAddToCart}
            disabled={atMax}
            className={`absolute bottom-3 right-3 p-2 rounded-full transition-opacity ${
              atMax
                ? 'bg-gray-400 text-white cursor-not-allowed opacity-100'
                : 'bg-brand-600 text-txt-inverse opacity-0 group-hover:opacity-100 hover:bg-brand-500'
            }`}
            aria-label={atMax ? `${product.name} — maximum quantity in cart` : `Add ${product.name} to cart`}
          >
            <Plus size={16} />
          </button>
        )}
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

        <div className="flex items-center justify-between mt-2">
          {price > 0 && (
            <p className="text-lg font-bold text-brand-600">${price.toFixed(2)}</p>
          )}
          {stockStatus === 'in_stock' && (
            <span className="text-[10px] text-success font-medium">In Stock</span>
          )}
        </div>
      </div>
    </Link>
  );
}
