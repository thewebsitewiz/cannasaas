import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { Package, Search, CheckCircle, AlertCircle } from 'lucide-react';

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useProducts({ search: search || undefined, limit: 50 });

  const products = data?.adminProducts ?? [];
  const total = data?.productCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products ({total})</h1>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Product</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Strain</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">THC %</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Metrc UID</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-50 rounded-lg"><Package size={16} className="text-brand-600" /></div>
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        {p.effects?.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">{p.effects.slice(0, 3).join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-700">{p.strainName ?? '-'}</p>
                      {p.strainType && (
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                          p.strainType === 'sativa' ? 'bg-orange-50 text-orange-700' :
                          p.strainType === 'indica' ? 'bg-purple-50 text-purple-700' :
                          'bg-green-50 text-green-700'
                        }`}>{p.strainType}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 tabular-nums">{p.thcPercent ? `${p.thcPercent}%` : '-'}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.metrcItemUid ?? '-'}</td>
                  <td className="px-6 py-4">
                    {p.isApproved && p.metrcItemUid && p.metrcItemCategoryId ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={14} /> Compliant</span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-xs"><AlertCircle size={14} /> Incomplete</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
