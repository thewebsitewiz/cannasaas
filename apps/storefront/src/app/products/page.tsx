'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gql, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';
import Link from 'next/link';
import { Search, Filter, Leaf } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';

const PRODUCTS_QUERY = `query($dispensaryId: ID!) {
  products(dispensaryId: $dispensaryId) {
    id name description strainType thcPercent cbdPercent imageUrl
    variants { variantId name sku weightGrams }
    pricing { variantId priceType price }
  }
}`;

const STRAIN_TYPES = ['All', 'Indica', 'Sativa', 'Hybrid'];

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [strainFilter, setStrainFilter] = useState('All');
  const addItem = useCartStore((s) => s.addItem);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', DEFAULT_DISPENSARY_ID],
    queryFn: () => gql<any>(PRODUCTS_QUERY, { dispensaryId: DEFAULT_DISPENSARY_ID }),
    select: (d) => d.products,
  });

  const filtered = (products ?? []).filter((p: any) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStrain = strainFilter === 'All' || p.strainType?.toLowerCase() === strainFilter.toLowerCase();
    return matchesSearch && matchesStrain;
  });

  const getPrice = (p: any) => {
    const retail = p.pricing?.find((pr: any) => pr.priceType === 'retail');
    return retail ? parseFloat(retail.price) : 0;
  };

  const handleQuickAdd = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = product.variants?.[0];
    if (!variant) return;
    addItem({
      productId: product.id,
      variantId: variant.variantId,
      name: product.name,
      variantName: variant.name,
      price: getPrice(product),
      strainType: product.strainType,
      imageUrl: product.imageUrl,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Our Menu</h1>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          {STRAIN_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setStrainFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                strainFilter === type
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-72" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Leaf size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product: any) => {
            const price = getPrice(product);
            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-brand-200 transition-all"
              >
                <div className="aspect-square bg-gradient-to-br from-brand-50 to-emerald-50 flex items-center justify-center relative">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                  ) : (
                    <Leaf size={48} className="text-brand-300" />
                  )}
                  {product.strainType && (
                    <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      product.strainType === 'indica' ? 'bg-purple-100 text-purple-700' :
                      product.strainType === 'sativa' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {product.strainType}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm group-hover:text-brand-700 transition-colors truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    {product.thcPercent && <span>THC {product.thcPercent}%</span>}
                    {product.cbdPercent && <span>CBD {product.cbdPercent}%</span>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-lg font-bold text-brand-700">${price.toFixed(2)}</p>
                    <button
                      onClick={(e) => handleQuickAdd(product, e)}
                      className="bg-brand-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
