'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { gql, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';
import { useCartStore } from '@/stores/cart.store';
import { Leaf, ShoppingCart, ChevronLeft, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const PRODUCT_QUERY = `query($dispensaryId: ID!) {
  products(dispensaryId: $dispensaryId) {
    id name description strainType thcPercent cbdPercent imageUrl
    effects terpenes
    variants { variantId name sku weightGrams }
    pricing { variantId priceType price }
  }
}`;

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const data = await gql<any>(PRODUCT_QUERY, { dispensaryId: DEFAULT_DISPENSARY_ID });
      return (data.products ?? []).find((p: any) => p.id === id);
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-32 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">Product not found</p>
        <Link href="/products" className="text-brand-600 hover:text-brand-700 font-medium">Back to Menu</Link>
      </div>
    );
  }

  const variants = product.variants ?? [];
  const active = selectedVariant ? variants.find((v: any) => v.variantId === selectedVariant) : variants[0];
  const activeVariantId = active?.variantId;

  const getPrice = (variantId: string) => {
    const p = (product.pricing ?? []).find((pr: any) => pr.variantId === variantId && pr.priceType === 'retail');
    return p ? parseFloat(p.price) : 0;
  };

  const price = activeVariantId ? getPrice(activeVariantId) : 0;
  const effects = product.effects ? (typeof product.effects === 'string' ? JSON.parse(product.effects) : product.effects) : [];
  const terpenes = product.terpenes ? (typeof product.terpenes === 'string' ? JSON.parse(product.terpenes) : product.terpenes) : [];

  const handleAddToCart = () => {
    if (!active) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        variantId: active.variantId,
        name: product.name,
        variantName: active.name,
        price,
        strainType: product.strainType,
        imageUrl: product.imageUrl,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Image */}
        <div className="aspect-square bg-gradient-to-br from-brand-50 to-emerald-50 rounded-2xl flex items-center justify-center relative overflow-hidden">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
          ) : (
            <Leaf size={96} className="text-brand-200" />
          )}
          {product.strainType && (
            <span className={`absolute top-4 left-4 text-xs font-bold uppercase px-3 py-1 rounded-full ${
              product.strainType === 'indica' ? 'bg-purple-100 text-purple-700' :
              product.strainType === 'sativa' ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            }`}>
              {product.strainType}
            </span>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {/* THC / CBD */}
          <div className="flex items-center gap-4 mt-3">
            {product.thcPercent && (
              <div className="bg-gray-100 rounded-lg px-3 py-1.5">
                <span className="text-xs text-gray-500">THC</span>
                <p className="text-sm font-bold">{product.thcPercent}%</p>
              </div>
            )}
            {product.cbdPercent && (
              <div className="bg-gray-100 rounded-lg px-3 py-1.5">
                <span className="text-xs text-gray-500">CBD</span>
                <p className="text-sm font-bold">{product.cbdPercent}%</p>
              </div>
            )}
          </div>

          {/* Price */}
          <p className="text-3xl font-bold text-brand-700 mt-6">${price.toFixed(2)}</p>

          {/* Variants */}
          {variants.length > 1 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v: any) => (
                  <button
                    key={v.variantId}
                    onClick={() => setSelectedVariant(v.variantId)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      (selectedVariant || variants[0]?.variantId) === v.variantId
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {v.name}
                    {v.weightGrams && <span className="text-xs text-gray-400 ml-1">({v.weightGrams}g)</span>}
                    <span className="ml-2 font-bold">${getPrice(v.variantId).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 text-gray-500 hover:text-gray-900">−</button>
              <span className="px-3 py-2 font-medium tabular-nums">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 text-gray-500 hover:text-gray-900">+</button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!active}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all ${
                added ? 'bg-green-600' : 'bg-brand-600 hover:bg-brand-700'
              }`}
            >
              {added ? (
                <>
                  <Check size={20} /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart size={20} /> Add to Cart — ${(price * quantity).toFixed(2)}
                </>
              )}
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Effects */}
          {effects.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Effects</h3>
              <div className="flex flex-wrap gap-2">
                {effects.map((effect: string, i: number) => (
                  <span key={i} className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1 rounded-full">{effect}</span>
                ))}
              </div>
            </div>
          )}

          {/* Terpenes */}
          {terpenes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Terpenes</h3>
              <div className="flex flex-wrap gap-2">
                {terpenes.map((terp: string, i: number) => (
                  <span key={i} className="bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-full">{terp}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
