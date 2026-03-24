import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { gql, DISPENSARY_ID } from '../lib/graphql';
import { useCartStore } from '../stores/cart.store';
import { Leaf, ShoppingCart, Check, Minus, Plus } from 'lucide-react';

const QUERY = `query($id: ID!) { products(dispensaryId: $id) {
  id name description strainType thcPercent cbdPercent effects
  variants { variantId name sku retailPrice }
}}`;

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

  if (!product) return <div className="p-12 text-center text-gray-400 text-xl">Loading...</div>;

  const variants = product.variants ?? [];
  const active = selVariant ? variants.find((v: any) => v.variantId === selVariant) : variants[0];
  const price = active?.retailPrice ? Number(active.retailPrice) : 0;
  const effects = product.effects ? (typeof product.effects === 'string' ? (() => { try { return JSON.parse(product.effects); } catch { return []; } })() : Array.isArray(product.effects) ? product.effects : []) : [];

  const handleAdd = () => {
    if (!active) return;
    for (let i = 0; i < qty; i++) addItem({ productId: product.id, variantId: active.variantId, name: product.name, variantName: active.name, price, strainType: product.strainType });
    setAdded(true);
    setTimeout(() => { setAdded(false); navigate('/'); }, 1500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gradient-to-br from-brand-50 to-emerald-50 rounded-2xl flex items-center justify-center">
          <Leaf size={96} className="text-brand-200" />
        </div>

        <div className="flex flex-col justify-center">
          {product.strainType && (
            <span className={`self-start text-sm font-bold uppercase px-3 py-1 rounded-full mb-3 ${
              product.strainType === 'indica' ? 'bg-purple-100 text-purple-700' : product.strainType === 'sativa' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
            }`}>{product.strainType}</span>
          )}

          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex gap-4 mt-3">
            {product.thcPercent && <div className="bg-gray-100 rounded-xl px-4 py-2"><span className="text-xs text-gray-500">THC</span><p className="text-lg font-bold">{product.thcPercent}%</p></div>}
            {product.cbdPercent && <div className="bg-gray-100 rounded-xl px-4 py-2"><span className="text-xs text-gray-500">CBD</span><p className="text-lg font-bold">{product.cbdPercent}%</p></div>}
          </div>

          {product.description && <p className="text-gray-600 mt-4 leading-relaxed">{product.description}</p>}

          {effects.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {effects.map((e: string, i: number) => <span key={i} className="bg-emerald-50 text-emerald-700 text-sm px-3 py-1 rounded-full">{e}</span>)}
            </div>
          )}

          {variants.length > 1 && (
            <div className="flex gap-2 mt-6">
              {variants.map((v: any) => (
                <button key={v.variantId} onClick={() => setSelVariant(v.variantId)}
                  className={`px-5 py-3 rounded-xl text-sm font-semibold border transition-colors ${(selVariant || variants[0]?.variantId) === v.variantId ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
                  {v.name}
                </button>
              ))}
            </div>
          )}

          <p className="text-4xl font-bold text-brand-700 mt-6">${price.toFixed(2)}</p>

          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center border border-gray-200 rounded-xl">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-4"><Minus size={20} /></button>
              <span className="px-4 text-xl font-bold tabular-nums">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-4"><Plus size={20} /></button>
            </div>
            <button onClick={handleAdd}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-bold text-white transition-all ${added ? 'bg-green-600' : 'bg-brand-600 hover:bg-brand-700 active:bg-brand-800'}`}>
              {added ? <><Check size={24} /> Added!</> : <><ShoppingCart size={24} /> Add — ${(price * qty).toFixed(2)}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
