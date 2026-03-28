import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { Warehouse, Search, AlertTriangle, Package } from 'lucide-react';

const PRODUCTS_QUERY = `
  query($dispensaryId: ID!, $limit: Int, $offset: Int, $search: String) {
    products(dispensaryId: $dispensaryId, limit: $limit, offset: $offset, search: $search) {
      id name sku strainName strainType thcPercent cbdPercent isActive
      variants {
        variantId name sku retailPrice stockQuantity stockStatus barcode isActive
      }
    }
  }
`;

interface Variant {
  variantId: string;
  name: string;
  sku: string | null;
  retailPrice: number | null;
  stockQuantity: number | null;
  stockStatus: string | null;
  barcode: string | null;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  strainName: string | null;
  strainType: string | null;
  thcPercent: number | null;
  cbdPercent: number | null;
  isActive: boolean;
  variants: Variant[];
}

const STOCK_STYLES: Record<string, string> = {
  in_stock: 'bg-green-50 text-green-700',
  low_stock: 'bg-yellow-50 text-yellow-700',
  out_of_stock: 'bg-red-50 text-red-700',
};

function stockLabel(status: string | null): string {
  if (!status) return '—';
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function InventoryPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['staffProducts', dispensaryId, search],
    queryFn: () =>
      gqlRequest<{ products: Product[] }>(PRODUCTS_QUERY, {
        dispensaryId,
        limit: 200,
        offset: 0,
        search: search || null,
      }),
    select: (d) => d.products,
    enabled: !!dispensaryId,
  });

  const products = data ?? [];
  const allVariants = products.flatMap(p => p.variants);
  const inStockCount = allVariants.filter(v => v.stockStatus === 'in_stock').length;
  const lowStockCount = allVariants.filter(v => v.stockStatus === 'low_stock').length;
  const outOfStockCount = allVariants.filter(v => v.stockStatus === 'out_of_stock').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <span className="text-sm text-gray-400">{products.length} products</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <Package size={18} className="text-gray-400 mb-2" />
          <p className="text-2xl font-bold">{products.length}</p>
          <p className="text-xs text-gray-500">Products</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <Warehouse size={18} className="text-green-400 mb-2" />
          <p className="text-2xl font-bold text-green-600">{inStockCount}</p>
          <p className="text-xs text-gray-500">In Stock</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <AlertTriangle size={18} className="text-yellow-400 mb-2" />
          <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
          <p className="text-xs text-gray-500">Low Stock</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <AlertTriangle size={18} className="text-red-400 mb-2" />
          <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
          <p className="text-xs text-gray-500">Out of Stock</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      {/* Product List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-48 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400">No products found{search ? ` matching "${search}"` : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Product Header */}
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
                    {!product.isActive && (
                      <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {product.sku && <span className="text-xs font-mono text-gray-400">{product.sku}</span>}
                    {product.strainName && (
                      <span className="text-xs text-gray-400">
                        {product.strainName}
                        {product.strainType && ` (${product.strainType})`}
                      </span>
                    )}
                    {product.thcPercent != null && product.thcPercent > 0 && (
                      <span className="text-xs text-gray-400">THC {product.thcPercent}%</span>
                    )}
                    {product.cbdPercent != null && product.cbdPercent > 0 && (
                      <span className="text-xs text-gray-400">CBD {product.cbdPercent}%</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Variants Table */}
              {product.variants.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="text-left px-5 py-2 text-xs font-medium text-gray-400">Variant</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-400">SKU</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-400">Price</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-400">Qty</th>
                      <th className="text-center px-5 py-2 text-xs font-medium text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {product.variants.map(v => (
                      <tr key={v.variantId} className={!v.isActive ? 'opacity-50' : ''}>
                        <td className="px-5 py-2.5 text-gray-700">{v.name || '—'}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-400">{v.sku || '—'}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                          {v.retailPrice != null ? `$${parseFloat(String(v.retailPrice)).toFixed(2)}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-gray-900">
                          {v.stockQuantity ?? '—'}
                        </td>
                        <td className="px-5 py-2.5 text-center">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STOCK_STYLES[v.stockStatus ?? ''] ?? 'bg-gray-50 text-gray-400'}`}>
                            {stockLabel(v.stockStatus)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
