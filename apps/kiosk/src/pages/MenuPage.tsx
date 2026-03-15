import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { gql, DISPENSARY_ID } from '../lib/graphql';
import { useCartStore } from '../stores/cart.store';
import { Leaf, Plus, Check } from 'lucide-react';

const PRODUCTS_QUERY = `query($id: ID!) { products(dispensaryId: $id) {
  id name strainType thcPercent cbdPercent description
  variants { variantId name sku }
}}`;

const FILTERS = ['All', 'Flower', 'Edible', 'Vape', 'Pre-Roll', 'Concentrate'];

export function MenuPage() {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [filter, setFilter] = useState('All');
  const [addedId, setAddedId] = useState<string | null>(null);

  const { data: products } = useQuery({
    queryKey: ['kioskProducts'],
    queryFn: () => gql<any>(PRODUCTS_QUERY, { id: DISPENSARY_ID }),
    select: (d) => d.products,
  });

  // Placeholder price — in production, pricing comes from inventory/POS
  const getPrice = (p: any) => {
    return 25.00; // Default price; will be replaced with real pricing query
  };

  const handleAdd = (product: any) => {
    const v = product.variants?.[0];
    if (!v) return;
    addItem({ productId: product.id, variantId: v.variantId, name: product.name, variantName: v.name, price: getPrice(product), strainType: product.strainType });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const filtered = (products ?? []).filter((p: any) => filter === 'All' || p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-6 py-3 rounded-xl text-base font-semibold whitespace-nowrap transition-colors ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 active:bg-gray-100'
            }`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p: any) => {
          const price = getPrice(p);
          const isAdded = addedId === p.id;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md active:shadow-sm transition-all">
              <button onClick={() => navigate('/product/' + p.id)} className="w-full aspect-[4/3] bg-gradient-to-br from-brand-50 to-emerald-50 flex items-center justify-center relative">
                <Leaf size={56} className="text-brand-200" />
                {p.strainType && (
                  <span className={`absolute top-3 left-3 text-xs font-bold uppercase px-3 py-1 rounded-full ${
                    p.strainType === 'indica' ? 'bg-purple-100 text-purple-700' :
                    p.strainType === 'sativa' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  }`}>{p.strainType}</span>
                )}
              </button>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-lg truncate">{p.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  {p.thcPercent && <span>THC {p.thcPercent}%</span>}
                  {p.cbdPercent && <span>CBD {p.cbdPercent}%</span>}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-2xl font-bold text-brand-700">${price.toFixed(2)}</span>
                  <button onClick={() => handleAdd(p)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-semibold transition-all ${
                      isAdded ? 'bg-green-600 text-white' : 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800'
                    }`}>
                    {isAdded ? <><Check size={20} /> Added</> : <><Plus size={20} /> Add</>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
