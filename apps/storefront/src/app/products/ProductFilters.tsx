'use client';

import { useState } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { Search, ShoppingBag } from 'lucide-react';

const STRAIN_TYPES = ['All', 'Indica', 'Sativa', 'Hybrid'];

export default function ProductFilters({ products }: { products: any[] }) {
  const [search, setSearch] = useState('');
  const [strainFilter, setStrainFilter] = useState('All');

  const filtered = products.filter((p) => {
    const matchesSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStrain = strainFilter === 'All' || p.strainType?.toLowerCase() === strainFilter.toLowerCase();
    return matchesSearch && matchesStrain;
  });

  return (
    <>
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-muted" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-bdr rounded-full text-sm bg-surface text-txt focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          {STRAIN_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setStrainFilter(type)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                strainFilter === type
                  ? 'bg-brand-600 text-txt-inverse shadow-md'
                  : 'bg-bg-alt text-txt-muted hover:bg-surface-hover'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="mx-auto text-txt-faint mb-4" />
          <p className="text-txt-muted">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
