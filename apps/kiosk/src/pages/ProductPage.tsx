import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { gql, DISPENSARY_ID } from '../lib/graphql';
import { useCartStore } from '../stores/cart.store';
import { ShoppingBag, Check, Minus, Plus } from 'lucide-react';

const QUERY = `query($id: ID!) { products(dispensaryId: $id) {
  id name description strainType strainName thcPercent cbdPercent effects flavors
  variants { variantId name sku retailPrice }
}}`;

const STRAIN_STYLE: Record<string, { bg: string; badge: string; orb: string }> = {
  sativa:  { bg: 'from-amber-100 via-orange-50 to-yellow-50', badge: 'bg-amber-500 text-white', orb: '#f59e0b' },
  indica:  { bg: 'from-violet-100 via-purple-50 to-indigo-50', badge: 'bg-violet-500 text-white', orb: '#8b5cf6' },
  hybrid:  { bg: 'from-emerald-100 via-green-50 to-teal-50', badge: 'bg-emerald-500 text-white', orb: '#10b981' },
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
  return Math.abs(hash);
}

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [selVariant, setSelVariant] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: product } = useQuery({
    queryKey: ['kioskProduct', id],
    queryFn: async () => {
      const d = await gql<any>(QUERY, { id: DISPENSARY_ID });
      return (d.products ?? []).find((p: any) => p.id === id);
    },
  });

  if (!product) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const variants = product.variants ?? [];
  const active = selVariant ? variants.find((v: any) => v.variantId === selVariant) : variants[0];
  const price = active?.retailPrice ? Number(active.retailPrice) : 0;
  const effects: string[] = Array.isArray(product.effects) ? product.effects : [];
  const flavors: string[] = Array.isArray(product.flavors) ? product.flavors : [];
  const strain = STRAIN_STYLE[product.strainType || 'hybrid'] || STRAIN_STYLE.hybrid;
  const hash = hashCode(product.name);

  const handleAdd = () => {
    if (!active) return;
    for (let i = 0; i < qty; i++) addItem({ productId: product.id, variantId: active.variantId, name: product.name, variantName: active.name, price, strainType: product.strainType });
    setAdded(true);
    setTimeout(() => { setAdded(false); navigate('/'); }, 1500);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product visual */}
        <div className={`aspect-square bg-gradient-to-br ${strain.bg} rounded-3xl overflow-hidden relative`}>
          <div className="absolute rounded-full opacity-20 blur-3xl"
            style={{
              width: `${60 + (hash % 30)}%`, height: `${60 + (hash % 30)}%`,
              top: `${10 + (hash % 25)}%`, left: `${10 + ((hash >> 4) % 25)}%`,
              background: strain.orb,
            }} />
          <div className="absolute rounded-full opacity-10 blur-2xl"
            style={{
              width: `${40 + ((hash >> 8) % 25)}%`, height: `${40 + ((hash >> 8) % 25)}%`,
              bottom: `${10 + ((hash >> 12) % 20)}%`, right: `${10 + ((hash >> 16) % 20)}%`,
              background: strain.orb,
            }} />
          {product.strainType && (
            <span className={`absolute top-5 left-5 text-sm font-bold tracking-wider uppercase px-4 py-1.5 rounded-full ${strain.badge} shadow-md`}>
              {product.strainType}
            </span>
          )}
          <div className="absolute bottom-5 left-5 flex gap-2">
            {product.thcPercent != null && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">THC</span>
                <p className="text-lg font-bold text-gray-900">{product.thcPercent}%</p>
              </div>
            )}
            {product.cbdPercent != null && product.cbdPercent > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">CBD</span>
                <p className="text-lg font-bold text-gray-900">{product.cbdPercent}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl lg:text-4xl font-light text-gray-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {product.name}
          </h1>
          {product.strainName && product.strainName !== product.name && (
            <p className="text-sm text-gray-400 mt-1 italic">{product.strainName}</p>
          )}

          {product.description && (
            <p className="text-gray-500 mt-5 leading-relaxed">{product.description}</p>
          )}

          {effects.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Effects</p>
              <div className="flex flex-wrap gap-2">
                {effects.map((e: string) => (
                  <span key={e} className="bg-emerald-50 text-emerald-700 text-sm font-medium px-3 py-1.5 rounded-full border border-emerald-100">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          {flavors.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Flavors</p>
              <div className="flex flex-wrap gap-2">
                {flavors.map((f: string) => (
                  <span key={f} className="bg-orange-50 text-orange-700 text-sm font-medium px-3 py-1.5 rounded-full border border-orange-100">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {variants.length > 1 && (
            <div className="mt-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Options</p>
              <div className="flex gap-2">
                {variants.map((v: any) => (
                  <button key={v.variantId} onClick={() => setSelVariant(v.variantId)}
                    className={`px-5 py-3 rounded-full text-sm font-semibold border-2 transition-all active:scale-95 ${
                      (selVariant || variants[0]?.variantId) === v.variantId
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-500 hover:border-emerald-200'
                    }`}>
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price + Add */}
          <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <span className="text-4xl font-bold text-gray-900">${price.toFixed(2)}</span>
              {variants[0]?.name && variants[0].name !== 'Standard' && (
                <span className="text-sm text-gray-400">/ {active?.name}</span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white border border-gray-200 rounded-full">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-4 hover:bg-gray-50 rounded-l-full active:bg-gray-100">
                  <Minus size={20} className="text-gray-600" />
                </button>
                <span className="px-5 text-xl font-bold tabular-nums text-gray-900">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="p-4 hover:bg-gray-50 rounded-r-full active:bg-gray-100">
                  <Plus size={20} className="text-gray-600" />
                </button>
              </div>

              <button onClick={handleAdd}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-full text-lg font-semibold text-white transition-all active:scale-95 ${
                  added
                    ? 'bg-emerald-400'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
                }`}>
                {added ? <><Check size={22} /> Added!</> : <><ShoppingBag size={22} /> Add — ${(price * qty).toFixed(2)}</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
