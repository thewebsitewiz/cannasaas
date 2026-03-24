import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { Search, Leaf, ScanLine } from 'lucide-react';
import { BarcodeScanner } from '../components/BarcodeScanner';

const SEARCH_QUERY = `
  query($input: ProductSearchInput!) {
    searchProducts(input: $input) {
      total
      products { id name strainName strainType description thcPercent cbdPercent effects flavors }
    }
  }
`;

const STRAIN_COLORS: Record<string, string> = {
  sativa: 'bg-orange-100 text-orange-700',
  indica: 'bg-purple-100 text-purple-700',
  hybrid: 'bg-green-100 text-green-700',
};

export function ProductLookupPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleChange = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__pTimeout);
    (window as any).__pTimeout = setTimeout(() => setDebounced(val), 250);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['productLookup', dispensaryId, debounced],
    queryFn: () => gqlRequest<{ searchProducts: any }>(SEARCH_QUERY, {
      input: { dispensaryId, search: debounced || undefined, limit: 20 },
    }),
    select: (d) => d.searchProducts,
    enabled: !!dispensaryId,
  });

  const products = data?.products ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Product Lookup</h1>

      <div className="flex gap-3 max-w-xl">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, strain, effects..."
            value={search}
            onChange={(e) => handleChange(e.target.value)}
            autoFocus
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none bg-white"
          />
        </div>
        <button
          onClick={() => setShowScanner(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors"
        >
          <ScanLine size={18} /> Scan
        </button>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={(barcode) => { setShowScanner(false); handleChange(barcode); }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {isLoading ? (
        <div className="text-gray-400 text-sm">Searching...</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p: any) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-50 rounded-lg shrink-0">
                  <Leaf size={20} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    {p.strainType && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STRAIN_COLORS[p.strainType] ?? STRAIN_COLORS.hybrid}`}>
                        {p.strainType}
                      </span>
                    )}
                  </div>

                  {p.strainName && p.strainName !== p.name && (
                    <p className="text-xs text-gray-500 mt-0.5">Strain: {p.strainName}</p>
                  )}

                  <div className="flex gap-4 mt-2 text-xs text-gray-600">
                    {p.thcPercent && <span className="font-medium">THC: {p.thcPercent}%</span>}
                    {p.cbdPercent && <span className="font-medium">CBD: {p.cbdPercent}%</span>}
                  </div>

                  {p.effects?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.effects.map((e: string) => (
                        <span key={e} className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{e}</span>
                      ))}
                    </div>
                  )}

                  {p.flavors?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.flavors.map((f: string) => (
                        <span key={f} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  )}

                  {p.description && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{p.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : debounced ? (
        <div className="text-center py-12 text-gray-400">
          <p>No products found for "{debounced}"</p>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p>Start typing to search products</p>
        </div>
      )}
    </div>
  );
}
