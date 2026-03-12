import { useDashboard } from '../hooks/useDashboard';
import { Warehouse, AlertTriangle } from 'lucide-react';

export function InventoryPage() {
  const { data, isLoading } = useDashboard(30);

  if (isLoading) return <div className="text-gray-400">Loading...</div>;

  const inv = data?.inventory;
  const lowStock = data?.lowStockItems ?? [];
  const fmt = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Variants</p>
          <p className="text-2xl font-bold">{inv?.totalVariants ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Units On Hand</p>
          <p className="text-2xl font-bold">{inv?.totalUnitsOnHand ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Est. Value</p>
          <p className="text-2xl font-bold">{fmt(inv?.estimatedInventoryValue ?? 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">Low / Out of Stock</p>
          <p className="text-2xl font-bold">
            <span className="text-amber-600">{inv?.lowStockCount ?? 0}</span>
            {' / '}
            <span className="text-red-600">{inv?.outOfStockCount ?? 0}</span>
          </p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Low Stock Items
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Product</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Variant</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500">On Hand</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lowStock.map((item: any) => (
                <tr key={item.variantId}>
                  <td className="px-4 py-3 text-gray-900">{item.productName}</td>
                  <td className="px-4 py-3 text-gray-500">{item.variantName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{item.quantityOnHand}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-amber-600 font-medium">{item.quantityAvailable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
