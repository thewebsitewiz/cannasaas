import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import {
  Warehouse, ArrowRightLeft, AlertTriangle, Clock, PackageX, RotateCcw, Skull,
  ClipboardCheck, CheckCircle, XCircle, ChevronDown, ChevronUp, Truck, Package,
} from 'lucide-react';

const HEALTH_QUERY = `query($id: ID!) { inventoryHealth(dispensaryId: $id) {
  totalSkus totalUnits lowStock outOfStock expired expiring30d deadStock pendingTransfers pendingAdjustments
}}`;

const ADJUSTMENTS_QUERY = `query($id: ID!, $limit: Int) { inventoryAdjustments(dispensaryId: $id, limit: $limit) {
  adjustmentId productName quantityChange quantityBefore quantityAfter status notes createdAt
}}`;

const TRANSFERS_QUERY = `query($id: ID!, $dir: String) { inventoryTransfers(dispensaryId: $id, direction: $dir) {
  transferId fromDispensaryId toDispensaryId status notes
  requestedByUserId approvedByUserId
  approvedAt shippedAt receivedAt rejectionReason createdAt
}}`;

const TRANSFER_ITEMS_QUERY = `query($id: ID!) { transferItems(transferId: $id) {
  itemId variantId productName variantName quantityRequested quantityShipped quantityReceived
}}`;

const START_COUNT = `mutation($id: ID!, $type: String, $notes: String) {
  startInventoryCount(dispensaryId: $id, countType: $type, notes: $notes) {
    countId dispensaryId countType status totalItems itemsCounted
  }
}`;

const COUNT_ITEMS_QUERY = `query($id: ID!) { countItems(countId: $id) {
  countItemId variantId productName variantName expectedQuantity countedQuantity variance countedAt
}}`;

const RECORD_COUNT = `mutation($itemId: ID!, $qty: Int!, $notes: String) {
  recordCountItem(countItemId: $itemId, countedQuantity: $qty, notes: $notes) {
    countItemId countedQuantity variance
  }
}`;

const COMPLETE_COUNT = `mutation($id: ID!, $auto: Boolean) {
  completeInventoryCount(countId: $id, autoAdjust: $auto) {
    countId status varianceCount
  }
}`;

const APPROVE_ADJ = `mutation($id: ID!) { approveAdjustment(adjustmentId: $id) { adjustmentId status } }`;

const APPROVE_TRANSFER = `mutation($id: ID!) { approveTransfer(transferId: $id) { transferId status } }`;
const SHIP_TRANSFER = `mutation($id: ID!) { shipTransfer(transferId: $id) { transferId status } }`;

type Tab = 'overview' | 'transfers' | 'counts' | 'adjustments';

const transferStatusBadge = (s: string) => {
  switch (s) {
    case 'approved': return 'bg-blue-50 text-blue-700';
    case 'shipped': case 'in_transit': return 'bg-indigo-50 text-indigo-700';
    case 'received': return 'bg-green-50 text-green-700';
    case 'rejected': return 'bg-red-50 text-red-700';
    default: return 'bg-amber-50 text-amber-700';
  }
};

export function InventoryControlPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [expandedTransfer, setExpandedTransfer] = useState<string | null>(null);
  const [activeCountId, setActiveCountId] = useState<string | null>(null);
  const [countInputs, setCountInputs] = useState<Record<string, string>>({});

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: health, isLoading } = useQuery({
    queryKey: ['inventoryHealth', dispensaryId],
    queryFn: () => gqlRequest<any>(HEALTH_QUERY, { id: dispensaryId }),
    select: (d) => d.inventoryHealth,
    enabled: !!dispensaryId,
  });

  const { data: adjustments } = useQuery({
    queryKey: ['adjustments', dispensaryId],
    queryFn: () => gqlRequest<any>(ADJUSTMENTS_QUERY, { id: dispensaryId, limit: 50 }),
    select: (d) => d.inventoryAdjustments,
    enabled: !!dispensaryId,
  });

  const { data: transfers } = useQuery({
    queryKey: ['transfers', dispensaryId],
    queryFn: () => gqlRequest<any>(TRANSFERS_QUERY, { id: dispensaryId, dir: null }),
    select: (d) => d.inventoryTransfers,
    enabled: !!dispensaryId && (tab === 'transfers' || tab === 'overview'),
  });

  const { data: transferItems } = useQuery({
    queryKey: ['transferItems', expandedTransfer],
    queryFn: () => gqlRequest<any>(TRANSFER_ITEMS_QUERY, { id: expandedTransfer }),
    select: (d) => d.transferItems,
    enabled: !!expandedTransfer,
  });

  const { data: countItems } = useQuery({
    queryKey: ['countItems', activeCountId],
    queryFn: () => gqlRequest<any>(COUNT_ITEMS_QUERY, { id: activeCountId }),
    select: (d) => d.countItems,
    enabled: !!activeCountId,
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const startCountMut = useMutation({
    mutationFn: (vars: { countType: string; notes?: string }) =>
      gqlRequest<{ startInventoryCount: any }>(START_COUNT, { id: dispensaryId, type: vars.countType, notes: vars.notes ?? null }),
    onSuccess: (data) => {
      setActiveCountId(data.startInventoryCount.countId);
      setTab('counts');
      queryClient.invalidateQueries({ queryKey: ['inventoryHealth'] });
    },
  });

  const recordCountMut = useMutation({
    mutationFn: (vars: { itemId: string; qty: number }) =>
      gqlRequest(RECORD_COUNT, { itemId: vars.itemId, qty: vars.qty, notes: null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['countItems'] }),
  });

  const completeCountMut = useMutation({
    mutationFn: (autoAdjust: boolean) =>
      gqlRequest(COMPLETE_COUNT, { id: activeCountId, auto: autoAdjust }),
    onSuccess: () => {
      setActiveCountId(null);
      queryClient.invalidateQueries({ queryKey: ['inventoryHealth'] });
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
    },
  });

  const approveAdjMut = useMutation({
    mutationFn: (id: string) => gqlRequest(APPROVE_ADJ, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryHealth'] });
    },
  });

  const approveTransferMut = useMutation({
    mutationFn: (id: string) => gqlRequest(APPROVE_TRANSFER, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] }),
  });

  const shipTransferMut = useMutation({
    mutationFn: (id: string) => gqlRequest(SHIP_TRANSFER, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] }),
  });

  if (isLoading) return <div className="text-txt-muted p-8">Loading inventory...</div>;

  const h = health ?? {};
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: Warehouse },
    { key: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
    { key: 'counts', label: 'Physical Counts', icon: ClipboardCheck },
    { key: 'adjustments', label: 'Adjustments', icon: RotateCcw },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-txt">Inventory Control</h1>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-brand-600 text-white' : 'text-txt-secondary hover:bg-bg-alt'
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <>
          {/* Health Dashboard */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <Warehouse size={18} className="mx-auto text-brand-600 mb-1" />
              <p className="text-2xl font-bold">{h.totalSkus ?? 0}</p>
              <p className="text-xs text-txt-secondary">Total SKUs</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold">{(h.totalUnits ?? 0).toLocaleString()}</p>
              <p className="text-xs text-txt-secondary">Total Units</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <AlertTriangle size={18} className="mx-auto text-amber-500 mb-1" />
              <p className="text-2xl font-bold text-amber-600">{h.lowStock ?? 0}</p>
              <p className="text-xs text-txt-secondary">Low Stock</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <PackageX size={18} className="mx-auto text-red-500 mb-1" />
              <p className="text-2xl font-bold text-red-600">{h.outOfStock ?? 0}</p>
              <p className="text-xs text-txt-secondary">Out of Stock</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <Skull size={18} className="mx-auto text-txt-muted mb-1" />
              <p className="text-2xl font-bold text-gray-600">{h.deadStock ?? 0}</p>
              <p className="text-xs text-txt-secondary">Dead Stock</p>
            </div>
          </div>

          {/* Alert Banners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(h.expired ?? 0) > 0 && (
              <div className="bg-danger-bg border border-red-200 rounded-xl p-4 flex items-center gap-3">
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
              <button onClick={() => setTab('transfers')} className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 text-left hover:bg-blue-100 transition-colors">
                <ArrowRightLeft size={20} className="text-blue-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">{h.pendingTransfers} Pending Transfers</p>
                  <p className="text-xs text-blue-600">Review and approve</p>
                </div>
              </button>
            )}
            {(h.pendingAdjustments ?? 0) > 0 && (
              <button onClick={() => setTab('adjustments')} className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3 text-left hover:bg-purple-100 transition-colors">
                <RotateCcw size={20} className="text-purple-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-purple-800">{h.pendingAdjustments} Pending Adjustments</p>
                  <p className="text-xs text-purple-600">Requires manager approval</p>
                </div>
              </button>
            )}
          </div>

          {/* Recent Adjustments (compact) */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-txt">Recent Adjustments</h2>
              <button onClick={() => setTab('adjustments')} className="text-xs text-brand-600 hover:text-brand-700 font-medium">View All</button>
            </div>
            {adjustments && adjustments.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-bg-alt border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-txt-secondary">Product</th>
                    <th className="text-right px-4 py-2 font-medium text-txt-secondary">Change</th>
                    <th className="text-right px-4 py-2 font-medium text-txt-secondary">Before</th>
                    <th className="text-right px-4 py-2 font-medium text-txt-secondary">After</th>
                    <th className="text-center px-4 py-2 font-medium text-txt-secondary">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(adjustments as any[]).slice(0, 10).map((adj: any) => (
                    <tr key={adj.adjustmentId}>
                      <td className="px-4 py-3 font-medium text-txt">{adj.productName}</td>
                      <td className={`px-4 py-3 text-right tabular-nums font-semibold ${adj.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {adj.quantityChange > 0 ? '+' : ''}{adj.quantityChange}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-txt-secondary">{adj.quantityBefore}</td>
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
              <div className="p-8 text-center text-txt-muted">No recent adjustments</div>
            )}
          </div>
        </>
      )}

      {/* ── Transfers Tab ─────────────────────────────────────────────────── */}
      {tab === 'transfers' && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-txt">Inventory Transfers</h2>
          </div>
          {transfers && transfers.length > 0 ? (
            <div className="divide-y divide-border">
              {transfers.map((t: any) => (
                <div key={t.transferId}>
                  <button
                    onClick={() => setExpandedTransfer(expandedTransfer === t.transferId ? null : t.transferId)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-alt transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <ArrowRightLeft size={16} className="text-txt-muted shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-txt">
                          {t.fromDispensaryId.slice(0, 8)}... &rarr; {t.toDispensaryId.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-txt-muted">{new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${transferStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                      {t.status === 'requested' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); approveTransferMut.mutate(t.transferId); }}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md font-medium hover:bg-blue-700"
                        >
                          Approve
                        </button>
                      )}
                      {t.status === 'approved' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); shipTransferMut.mutate(t.transferId); }}
                          className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-md font-medium hover:bg-indigo-700"
                        >
                          Mark Shipped
                        </button>
                      )}
                      {expandedTransfer === t.transferId ? <ChevronUp size={16} className="text-txt-muted" /> : <ChevronDown size={16} className="text-txt-muted" />}
                    </div>
                  </button>

                  {expandedTransfer === t.transferId && (
                    <div className="px-6 pb-4">
                      {t.notes && <p className="text-xs text-txt-muted mb-3">Notes: {t.notes}</p>}
                      {t.rejectionReason && <p className="text-xs text-red-600 mb-3">Rejected: {t.rejectionReason}</p>}

                      <div className="flex gap-4 text-xs text-txt-muted mb-3">
                        {t.approvedAt && <span>Approved: {new Date(t.approvedAt).toLocaleDateString()}</span>}
                        {t.shippedAt && <span>Shipped: {new Date(t.shippedAt).toLocaleDateString()}</span>}
                        {t.receivedAt && <span>Received: {new Date(t.receivedAt).toLocaleDateString()}</span>}
                      </div>

                      {transferItems && transferItems.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 font-medium text-txt-secondary text-xs">Product</th>
                              <th className="text-left py-2 font-medium text-txt-secondary text-xs">Variant</th>
                              <th className="text-right py-2 font-medium text-txt-secondary text-xs">Requested</th>
                              <th className="text-right py-2 font-medium text-txt-secondary text-xs">Shipped</th>
                              <th className="text-right py-2 font-medium text-txt-secondary text-xs">Received</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {transferItems.map((item: any) => (
                              <tr key={item.itemId}>
                                <td className="py-2 text-txt">{item.productName}</td>
                                <td className="py-2 text-txt-secondary">{item.variantName ?? '-'}</td>
                                <td className="py-2 text-right tabular-nums">{item.quantityRequested}</td>
                                <td className="py-2 text-right tabular-nums">{item.quantityShipped ?? '-'}</td>
                                <td className="py-2 text-right tabular-nums">{item.quantityReceived ?? '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-xs text-txt-muted">Loading items...</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-txt-muted">No transfers found</div>
          )}
        </div>
      )}

      {/* ── Physical Counts Tab ───────────────────────────────────────────── */}
      {tab === 'counts' && (
        <div className="space-y-4">
          {!activeCountId ? (
            <div className="bg-surface rounded-xl border border-border p-8 text-center space-y-4">
              <ClipboardCheck size={40} className="mx-auto text-txt-muted" />
              <h3 className="text-lg font-semibold text-txt">Start a Physical Count</h3>
              <p className="text-sm text-txt-muted max-w-md mx-auto">
                Begin a cycle count or full inventory count. All active variants will be loaded for counting.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => startCountMut.mutate({ countType: 'cycle', notes: 'Routine cycle count' })}
                  disabled={startCountMut.isPending}
                  className="bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
                >
                  {startCountMut.isPending ? 'Starting...' : 'Cycle Count'}
                </button>
                <button
                  onClick={() => startCountMut.mutate({ countType: 'full', notes: 'Full inventory count' })}
                  disabled={startCountMut.isPending}
                  className="border border-border text-txt px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-bg-alt disabled:opacity-50"
                >
                  {startCountMut.isPending ? 'Starting...' : 'Full Count'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold text-txt">Count Items</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => completeCountMut.mutate(false)}
                    disabled={completeCountMut.isPending}
                    className="text-xs border border-border px-3 py-1.5 rounded-lg font-medium hover:bg-bg-alt disabled:opacity-50"
                  >
                    Complete (No Auto-Adjust)
                  </button>
                  <button
                    onClick={() => completeCountMut.mutate(true)}
                    disabled={completeCountMut.isPending}
                    className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
                  >
                    Complete & Auto-Adjust
                  </button>
                </div>
              </div>

              {countItems && countItems.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-bg-alt border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-txt-secondary">Product</th>
                      <th className="text-left px-4 py-2 font-medium text-txt-secondary">Variant</th>
                      <th className="text-right px-4 py-2 font-medium text-txt-secondary">Expected</th>
                      <th className="text-right px-4 py-2 font-medium text-txt-secondary">Counted</th>
                      <th className="text-right px-4 py-2 font-medium text-txt-secondary">Variance</th>
                      <th className="text-center px-4 py-2 font-medium text-txt-secondary">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {countItems.map((item: any) => (
                      <tr key={item.countItemId} className={item.countedAt ? 'bg-green-50/30' : ''}>
                        <td className="px-4 py-3 font-medium text-txt">{item.productName}</td>
                        <td className="px-4 py-3 text-txt-secondary">{item.variantName ?? '-'}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{item.expectedQuantity}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {item.countedAt ? item.countedQuantity : '-'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {item.countedAt ? (
                            <span className={`font-semibold ${
                              item.variance === 0 ? 'text-green-600' :
                              item.variance > 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {item.variance > 0 ? '+' : ''}{item.variance}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.countedAt ? (
                            <CheckCircle size={16} className="mx-auto text-green-500" />
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                value={countInputs[item.countItemId] ?? ''}
                                onChange={(e) => setCountInputs({ ...countInputs, [item.countItemId]: e.target.value })}
                                placeholder="Qty"
                                className="w-16 px-2 py-1 border border-border rounded text-xs text-center"
                              />
                              <button
                                onClick={() => {
                                  const qty = parseInt(countInputs[item.countItemId] ?? '');
                                  if (!isNaN(qty)) recordCountMut.mutate({ itemId: item.countItemId, qty });
                                }}
                                disabled={recordCountMut.isPending}
                                className="bg-brand-600 text-white text-xs px-2 py-1 rounded font-medium hover:bg-brand-700 disabled:opacity-50"
                              >
                                Save
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-txt-muted">Loading count items...</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Adjustments Tab ───────────────────────────────────────────────── */}
      {tab === 'adjustments' && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-txt">Adjustment Log</h2>
          </div>
          {adjustments && adjustments.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-bg-alt border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-txt-secondary">Product</th>
                  <th className="text-right px-4 py-2 font-medium text-txt-secondary">Change</th>
                  <th className="text-right px-4 py-2 font-medium text-txt-secondary">Before</th>
                  <th className="text-right px-4 py-2 font-medium text-txt-secondary">After</th>
                  <th className="text-left px-4 py-2 font-medium text-txt-secondary">Notes</th>
                  <th className="text-center px-4 py-2 font-medium text-txt-secondary">Status</th>
                  <th className="text-right px-4 py-2 font-medium text-txt-secondary">Date</th>
                  <th className="text-center px-4 py-2 font-medium text-txt-secondary">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {adjustments.map((adj: any) => (
                  <tr key={adj.adjustmentId}>
                    <td className="px-4 py-3 font-medium text-txt">{adj.productName}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-semibold ${adj.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {adj.quantityChange > 0 ? '+' : ''}{adj.quantityChange}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-txt-secondary">{adj.quantityBefore}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{adj.quantityAfter}</td>
                    <td className="px-4 py-3 text-xs text-txt-muted max-w-[160px] truncate">{adj.notes ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        adj.status === 'approved' ? 'bg-green-50 text-green-700' :
                        adj.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>{adj.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-txt-muted">
                      {new Date(adj.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {adj.status === 'pending' && (
                        <button
                          onClick={() => approveAdjMut.mutate(adj.adjustmentId)}
                          disabled={approveAdjMut.isPending}
                          className="text-xs bg-green-600 text-white px-2.5 py-1 rounded font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-txt-muted">No adjustments found</div>
          )}
        </div>
      )}
    </div>
  );
}
