import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { Warehouse, AlertTriangle } from 'lucide-react';

export function InventoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['staffInventory'],
    queryFn: () => gqlRequest<{ dashboard: any }>(`
      query { dashboard(days: 30) {
        inventory { totalVariants totalUnitsOnHand totalUnitsReserved totalUnitsAvailable estimatedInventoryValue lowStockCount outOfStockCount }
        lowStockItems { variantId productName variantName quantityOnHand quantityAvailable reorderThreshold }
      }}
    `),
    select: (d) => d.dashboard,
  });

  if (isLoading) return <div className="text-gray-400">Loading inventory...</div>;

  const inv = data?.inventory;
  const lowStock = data?.lowStockItems ?? [];
  const fmt = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <Warehouse size={18} className="text-gray-400 mb-2" />
          <p className="text-2xl font-bold">{inv?.totalVariants ?? 0}</p>
          <p className="text-xs text-gray-500">SKUs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold">{inv?.totalUnitsOnHand ?? 0}</p>
          <p className="text-xs text-gray-500">Units On Hand</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold">{fmt(inv?.estimatedInventoryValue ?? 0)}</p>
          <p className="text-xs text-gray-500">Est. Value</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold">
            <span className="text-amber-600">{inv?.lowStockCount ?? 0}</span>
            {' / '}
            <span className="text-red-600">{inv?.outOfStockCount ?? 0}</span>
          </p>
          <p className="text-xs text-gray-500">Low / Out</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Low Stock Alerts
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Product</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Variant</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500">On Hand</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500">Available</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500">Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lowStock.map((item: any) => (
                <tr key={item.variantId} className={item.quantityAvailable <= 0 ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                  <td className="px-4 py-3 text-gray-500">{item.variantName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{item.quantityOnHand}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-amber-600">{item.quantityAvailable}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-400">{item.reorderThreshold ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lowStock.length === 0 && (
        <div className="bg-green-50 rounded-xl p-8 text-center">
          <p className="text-green-700 font-medium">All stock levels are healthy</p>
        </div>
      )}
    </div>
  );
}
