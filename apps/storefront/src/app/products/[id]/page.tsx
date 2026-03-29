'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { gql, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';
import { useCartStore } from '@/stores/cart.store';
import { Leaf, ShoppingCart, ChevronLeft, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const PRODUCT_QUERY = `query($id: ID!, $dispensaryId: ID!) {
  product(id: $id, dispensaryId: $dispensaryId) {
    id name description strainType thcPercent cbdPercent
    variants { variantId name sku quantityPerUnit retailPrice stockQuantity stockStatus }
  }
}`;

const STOCK_INFO: Record<string, { label: string; className: string }> = {
  in_stock: { label: 'In Stock', className: 'text-success' },
  low_stock: { label: 'Low Stock — Order Soon', className: 'text-warning' },
  out_of_stock: { label: 'Out of Stock', className: 'text-danger' },
};

export default function ProductDetailPage() {
  const params = useParams(); const id = params?.id;
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const data = await gql<{ product: Record<string, unknown> }>(PRODUCT_QUERY, {
        id,
        dispensaryId: DEFAULT_DISPENSARY_ID,
      });
      return data.product;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-bg-alt rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-bg-alt rounded w-3/4" />
            <div className="h-4 bg-bg-alt rounded w-1/2" />
            <div className="h-32 bg-bg-alt rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <AlertTriangle size={48} className="mx-auto text-txt-muted mb-4" />
        <p className="text-txt-muted mb-4">Product not found</p>
        <Link href="/products" className="text-brand-600 hover:text-brand-500 font-medium">Back to Menu</Link>
      </div>
    );
  }

  const variants = (product.variants as Array<{ variantId: string; name: string; sku?: string; quantityPerUnit?: number; retailPrice?: number; stockQuantity?: number; stockStatus?: string }>) ?? [];
  const active = selectedVariant
    ? variants.find((v) => v.variantId === selectedVariant)
    : variants[0];

  const price = active?.retailPrice ? Number(active.retailPrice) : 0;
  const stockStatus = active?.stockStatus ?? 'in_stock';
  const stockQty = active?.stockQuantity != null ? Number(active.stockQuantity) : null;
  const isOutOfStock = stockStatus === 'out_of_stock';
  const stockInfo = STOCK_INFO[stockStatus] ?? STOCK_INFO.in_stock;

  // Check how many are already in cart for this variant
  const inCart = cartItems.find(
    (i) => i.productId === (product.id as string) && i.variantId === active?.variantId,
  );
  const inCartQty = inCart?.quantity ?? 0;
  const maxAddable = stockQty != null ? Math.max(0, stockQty - inCartQty) : 99;

  const strainColors: Record<string, string> = {
    indica: 'bg-purple-100 text-purple-700',
    sativa: 'bg-orange-50 text-orange-700',
    hybrid: 'bg-green-100 text-green-700',
  };

  const handleAddToCart = () => {
    if (!active || isOutOfStock || maxAddable <= 0) return;
    const qtyToAdd = Math.min(quantity, maxAddable);
    for (let i = 0; i < qtyToAdd; i++) {
      addItem({
        productId: product.id as string,
        variantId: active.variantId,
        name: product.name as string,
        variantName: active.name,
        price,
        maxQuantity: stockQty ?? undefined,
        strainType: product.strainType as string | undefined,
      });
    }
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-txt-muted hover:text-txt mb-6">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="aspect-square bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
          <Leaf size={96} className="text-brand-400 opacity-30" />
          {(product.strainType as string) && (
            <span className={`absolute top-4 left-4 text-xs font-bold uppercase px-3 py-1 rounded-full ${
              strainColors[product.strainType as string] ?? strainColors.hybrid
            }`}>
              {product.strainType as string}
            </span>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-bg/60 flex items-center justify-center">
              <span className="bg-danger text-txt-inverse font-bold text-sm px-4 py-2 rounded-full">Sold Out</span>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold font-display text-txt">{product.name as string}</h1>

          <div className="flex items-center gap-4 mt-3">
            {(product.thcPercent as number) != null && (
              <div className="bg-bg-alt rounded-lg px-3 py-1.5">
                <span className="text-xs text-txt-muted">THC</span>
                <p className="text-sm font-bold text-txt">{product.thcPercent as number}%</p>
              </div>
            )}
            {(product.cbdPercent as number) != null && (
              <div className="bg-bg-alt rounded-lg px-3 py-1.5">
                <span className="text-xs text-txt-muted">CBD</span>
                <p className="text-sm font-bold text-txt">{product.cbdPercent as number}%</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <p className="text-3xl font-bold text-brand-600">
              {price > 0 ? `$${price.toFixed(2)}` : 'Price unavailable'}
            </p>
            <span className={`text-sm font-medium ${stockInfo.className}`}>
              {stockInfo.label}
            </span>
          </div>

          {stockQty != null && stockStatus === 'low_stock' && (
            <p className="text-xs text-warning mt-1">Only {stockQty} left</p>
          )}

          {inCartQty > 0 && (
            <p className="text-xs text-brand-600 mt-1">{inCartQty} already in cart</p>
          )}

          {/* Variants */}
          {variants.length > 1 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-txt-secondary mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const vPrice = v.retailPrice ? Number(v.retailPrice) : 0;
                  const vOos = v.stockStatus === 'out_of_stock';
                  return (
                    <button
                      key={v.variantId}
                      onClick={() => { setSelectedVariant(v.variantId); setQuantity(1); }}
                      disabled={vOos}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        vOos
                          ? 'border-bdr text-txt-faint line-through opacity-50 cursor-not-allowed'
                          : (selectedVariant || variants[0]?.variantId) === v.variantId
                          ? 'border-brand-600 bg-brand-50 text-brand-600'
                          : 'border-bdr text-txt-secondary hover:border-bdr-strong'
                      }`}
                    >
                      {v.name}
                      {v.quantityPerUnit && (
                        <span className="text-xs text-txt-muted ml-1">({v.quantityPerUnit}g)</span>
                      )}
                      {vPrice > 0 && <span className="ml-2 font-bold">${vPrice.toFixed(2)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {variants.length === 1 && active && (
            <p className="text-sm text-txt-muted mt-3">
              {active.name}
              {active.quantityPerUnit && ` · ${active.quantityPerUnit}g`}
            </p>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-4 mt-8">
            {!isOutOfStock && maxAddable > 0 && (
              <div className="flex items-center border border-bdr rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 text-txt-muted hover:text-txt">−</button>
                <span className="px-3 py-2 font-medium tabular-nums text-txt">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(quantity + 1, maxAddable))}
                  disabled={quantity >= maxAddable}
                  className="px-3 py-2 text-txt-muted hover:text-txt disabled:opacity-40 disabled:cursor-not-allowed"
                >+</button>
              </div>
            )}
            <button
              onClick={handleAddToCart}
              disabled={!active || isOutOfStock || price === 0 || maxAddable <= 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                isOutOfStock || maxAddable <= 0
                  ? 'bg-bg-alt text-txt-muted cursor-not-allowed'
                  : added
                  ? 'bg-success text-txt-inverse'
                  : 'bg-brand-600 hover:bg-brand-500 text-txt-inverse'
              } disabled:opacity-50`}
            >
              {isOutOfStock ? (
                'Out of Stock'
              ) : maxAddable <= 0 ? (
                'Maximum in Cart'
              ) : added ? (
                <><Check size={20} /> Added to Cart</>
              ) : (
                <><ShoppingCart size={20} /> Add to Cart — ${(price * Math.min(quantity, maxAddable)).toFixed(2)}</>
              )}
            </button>
          </div>

          {(product.description as string) && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-txt mb-2">About</h3>
              <p className="text-sm text-txt-secondary leading-relaxed">{product.description as string}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
