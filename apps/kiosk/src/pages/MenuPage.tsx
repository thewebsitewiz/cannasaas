import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { gql, DISPENSARY_ID } from '../lib/graphql';
import { useCartStore } from '../stores/cart.store';
import { Plus, Check, ShoppingBag, Sparkles } from 'lucide-react';

const PRODUCTS_QUERY = `query($id: ID!) { products(dispensaryId: $id) {
  id name strainType strainName thcPercent cbdPercent description effects flavors
  variants { variantId name sku retailPrice }
}}`;

const FILTERS = ['All', 'Flower', 'Edible', 'Vape', 'Pre-Roll', 'Concentrate'];

const STRAIN_STYLE: Record<string, { bg: string; badge: string }> = {
  sativa:  { bg: 'from-amber-100 via-orange-50 to-yellow-50', badge: 'bg-amber-500 text-white' },
  indica:  { bg: 'from-violet-100 via-purple-50 to-indigo-50', badge: 'bg-violet-500 text-white' },
  hybrid:  { bg: 'from-emerald-100 via-green-50 to-teal-50', badge: 'bg-emerald-500 text-white' },
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
  return Math.abs(hash);
}

export function MenuPage() {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [filter, setFilter] = useState('All');
  const [addedId, setAddedId] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['kioskProducts'],
    queryFn: () => gql<any>(PRODUCTS_QUERY, { id: DISPENSARY_ID }),
    select: (d) => d.products,
  });

  const getPrice = (p: any) => p.variants?.[0]?.retailPrice ? Number(p.variants[0].retailPrice) : 0;

  const handleAdd = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    const v = product.variants?.[0];
    if (!v) return;
    addItem({ productId: product.id, variantId: v.variantId, name: product.name, variantName: v.name, price: getPrice(product), strainType: product.strainType });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const filtered = (products ?? []).filter((p: any) =>
    filter === 'All' || p.name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Hero banner */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-medium tracking-wider uppercase mb-3">
          <Sparkles size={12} /> Welcome
        </div>
        <h1 className="text-3xl lg:text-4xl font-light text-gray-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Browse Our <span className="italic text-emerald-700">Menu</span>
        </h1>
        <p className="text-sm text-gray-400 mt-2">Tap a product to learn more, or add directly to your cart</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 justify-center">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${
              filter === f
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-200 hover:text-emerald-700'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-20 text-gray-400">
          <div className="w-8 h-8 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading menu...
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((p: any) => {
          const price = getPrice(p);
          const isAdded = addedId === p.id;
          const strain = STRAIN_STYLE[p.strainType || 'hybrid'] || STRAIN_STYLE.hybrid;
          const hash = hashCode(p.name);

          return (
            <button key={p.id} onClick={() => navigate('/product/' + p.id)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 text-left active:scale-[0.98]">

              {/* Product visual */}
              <div className={`aspect-[4/3] bg-gradient-to-br ${strain.bg} relative overflow-hidden`}>
                <div className="absolute rounded-full opacity-20 blur-xl"
                  style={{
                    width: `${60 + (hash % 40)}%`, height: `${60 + (hash % 40)}%`,
                    top: `${10 + (hash % 30)}%`, left: `${10 + ((hash >> 4) % 30)}%`,
                    background: p.strainType === 'sativa' ? '#f59e0b' : p.strainType === 'indica' ? '#8b5cf6' : '#10b981',
                  }} />
                {p.strainType && (
                  <span className={`absolute top-3 left-3 text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full ${strain.badge} shadow-sm`}>
                    {p.strainType}
                  </span>
                )}
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  {p.thcPercent != null && p.thcPercent > 0 && (
                    <span className="text-[11px] font-bold bg-white/80 backdrop-blur-sm text-gray-700 px-2.5 py-1 rounded-full">
                      THC {p.thcPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 text-lg leading-tight">{p.name}</h3>
                {p.strainName && p.strainName !== p.name && (
                  <p className="text-xs text-gray-400 mt-0.5 italic">{p.strainName}</p>
                )}

                {p.effects && p.effects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {p.effects.slice(0, 3).map((effect: string) => (
                      <span key={effect} className="text-[10px] font-medium bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                        {effect}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <span className="text-2xl font-bold text-gray-900">${price.toFixed(2)}</span>
                  <div onClick={(e) => handleAdd(e, p)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all active:scale-95 ${
                      isAdded
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-500/20'
                    }`}>
                    {isAdded ? <><Check size={18} /> Added</> : <><Plus size={18} /> Add</>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">No products found</p>
        </div>
      )}
    </div>
  );
}
