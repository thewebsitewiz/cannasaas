import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { Warehouse, ArrowRightLeft, AlertTriangle, Clock, PackageX, RotateCcw, Skull } from 'lucide-react';

const HEALTH_QUERY = `query($id: ID!) { inventoryHealth(dispensaryId: $id) {
  totalSkus totalUnits lowStock outOfStock expired expiring30d deadStock pendingTransfers pendingAdjustments
}}`;

const ADJUSTMENTS_QUERY = `query($id: ID!) { inventoryAdjustments(dispensaryId: $id, limit: 15) {
  adjustmentId productName quantityChange quantityBefore quantityAfter status notes createdAt
}}`;

export function InventoryControlPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);

  const { data: health, isLoading } = useQuery({
    queryKey: ['inventoryHealth', dispensaryId],
    queryFn: () => gqlRequest<any>(HEALTH_QUERY, { id: dispensaryId }),
    select: (d) => d.inventoryHealth,
    enabled: !!dispensaryId,
  });

  const { data: adjustments } = useQuery({
    queryKey: ['adjustments', dispensaryId],
    queryFn: () => gqlRequest<any>(ADJUSTMENTS_QUERY, { id: dispensaryId }),
    select: (d) => d.inventoryAdjustments,
    enabled: !!dispensaryId,
  });

  if (isLoading) return <div className="text-gray-400 p-8">Loading inventory...</div>;

  const h = health ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Inventory Control</h1>

      {/* Health Dashboard */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <Warehouse size={18} className="mx-auto text-brand-600 mb-1" />
          <p className="text-2xl font-bold">{h.totalSkus ?? 0}</p>
          <p className="text-xs text-gray-500">Total SKUs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold">{(h.totalUnits ?? 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Units</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <AlertTriangle size={18} className="mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold text-amber-600">{h.lowStock ?? 0}</p>
          <p className="text-xs text-gray-500">Low Stock</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <PackageX size={18} className="mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold text-red-600">{h.outOfStock ?? 0}</p>
          <p className="text-xs text-gray-500">Out of Stock</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <Skull size={18} className="mx-auto text-gray-400 mb-1" />
          <p className="text-2xl font-bold text-gray-600">{h.deadStock ?? 0}</p>
          <p className="text-xs text-gray-500">Dead Stock</p>
        </div>
      </div>

      {/* Alert Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(h.expired ?? 0) > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <Clock size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">{h.expired} Expired Items</p>
              <p className="text-xs text-red-600">Remove from shelves immediately</p>
            </div>
          </div>
        )}
        {(h.expiring30d ?? 0) > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <Clock size={20} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">{h.expiring30d} Expiring in 30 Days</p>
              <p className="text-xs text-amber-600">Consider discounting or transferring</p>
            </div>
          </div>
        )}
        {(h.pendingTransfers ?? 0) > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <ArrowRightLeft size={20} className="text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">{h.pendingTransfers} Pending Transfers</p>
              <p className="text-xs text-blue-600">Review and approve</p>
            </div>
          </div>
        )}
        {(h.pendingAdjustments ?? 0) > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
            <RotateCcw size={20} className="text-purple-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-purple-800">{h.pendingAdjustments} Pending Adjustments</p>
              <p className="text-xs text-purple-600">Requires manager approval</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Adjustments */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Adjustments</h2>
        </div>
        {adjustments && adjustments.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Product</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500">Change</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500">Before</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500">After</th>
                <th className="text-center px-4 py-2 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {adjustments.map((adj: any) => (
                <tr key={adj.adjustmentId}>
                  <td className="px-4 py-3 font-medium text-gray-900">{adj.productName}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-semibold ${adj.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {adj.quantityChange > 0 ? '+' : ''}{adj.quantityChange}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-500">{adj.quantityBefore}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{adj.quantityAfter}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      adj.status === 'approved' ? 'bg-green-50 text-green-700' :
                      adj.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                    }`}>{adj.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-400">No recent adjustments</div>
        )}
      </div>
    </div>
  );
}
