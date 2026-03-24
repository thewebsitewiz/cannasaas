import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { useDashboard } from '../hooks/useDashboard';
import { ShoppingCart, Clock, CheckCircle, XCircle, Search, Eye, X, ChevronLeft, Ban } from 'lucide-react';

const ORDERS_QUERY = `
  query($dispensaryId: ID!, $limit: Int, $offset: Int) {
    orders(dispensaryId: $dispensaryId, limit: $limit, offset: $offset) {
      orderId dispensaryId customerUserId orderType orderStatus
      subtotal taxTotal total paymentMethod createdAt updatedAt
    }
  }
`;

const ORDER_DETAIL_QUERY = `
  query($orderId: ID!, $dispensaryId: ID) {
    order(orderId: $orderId, dispensaryId: $dispensaryId) {
      orderId dispensaryId customerUserId orderType orderStatus
      subtotal discountTotal taxTotal total paymentMethod
      metrcReceiptId metrcSyncStatus notes cancellationReason
      createdAt updatedAt
    }
  }
`;

const CANCEL_ORDER = `
  mutation($orderId: ID!, $reason: String!, $dispensaryId: ID) {
    cancelOrder(orderId: $orderId, reason: $reason, dispensaryId: $dispensaryId)
  }
`;

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'completed', 'cancelled'] as const;

const statusBadge = (status: string) => {
  switch (status) {
    case 'completed': case 'delivered': case 'picked_up':
      return 'bg-green-50 text-green-700';
    case 'confirmed': case 'preparing': case 'ready_for_pickup':
      return 'bg-blue-50 text-blue-700';
    case 'pending':
      return 'bg-amber-50 text-amber-700';
    case 'cancelled':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export function OrdersPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const queryClient = useQueryClient();
  const { data: dashData, isLoading: dashLoading } = useDashboard(30);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const sales = dashData?.sales;

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['ordersList', dispensaryId],
    queryFn: () => gqlRequest<{ orders: any[] }>(ORDERS_QUERY, { dispensaryId, limit: 100, offset: 0 }),
    enabled: !!dispensaryId,
  });

  const { data: orderDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['orderDetail', selectedOrderId],
    queryFn: () => gqlRequest<{ order: any }>(ORDER_DETAIL_QUERY, { orderId: selectedOrderId, dispensaryId }),
    enabled: !!selectedOrderId,
  });

  const cancelMutation = useMutation({
    mutationFn: (vars: { orderId: string; reason: string }) =>
      gqlRequest(CANCEL_ORDER, { ...vars, dispensaryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordersList'] });
      queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowCancelDialog(false);
      setCancelReason('');
    },
  });

  const allOrders = ordersData?.orders ?? [];
  const filtered = statusFilter === 'all'
    ? allOrders
    : allOrders.filter((o: any) => o.orderStatus === statusFilter);

  const detail = orderDetail?.order;

  if (dashLoading) return <div className="text-txt-muted">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-txt">Orders</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-txt-secondary text-sm mb-2"><ShoppingCart size={16} /> Total</div>
          <p className="text-2xl font-bold">{sales?.totalOrders ?? 0}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-2"><CheckCircle size={16} /> Completed</div>
          <p className="text-2xl font-bold text-green-600">{sales?.completedOrders ?? 0}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-amber-600 text-sm mb-2"><Clock size={16} /> Pending</div>
          <p className="text-2xl font-bold text-amber-600">{sales?.pendingOrders ?? 0}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-red-600 text-sm mb-2"><XCircle size={16} /> Cancelled</div>
          <p className="text-2xl font-bold text-red-600">{sales?.cancelledOrders ?? 0}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'text-txt-secondary hover:bg-bg-alt'
              }`}
            >
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <span className="text-xs text-txt-muted">{filtered.length} orders</span>
      </div>

      {/* Two-panel layout: Table + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Table */}
        <div className={`${selectedOrderId ? 'lg:col-span-2' : 'lg:col-span-3'} bg-surface rounded-xl border border-border overflow-hidden`}>
          {ordersLoading ? (
            <div className="p-12 text-center text-txt-muted">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-txt-muted">No orders found for this filter.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-bg-alt border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-txt-secondary">Order ID</th>
                  <th className="text-left px-4 py-3 font-medium text-txt-secondary">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-txt-secondary">Type</th>
                  <th className="text-center px-4 py-3 font-medium text-txt-secondary">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-txt-secondary">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-txt-secondary">Date</th>
                  <th className="text-center px-4 py-3 font-medium text-txt-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order: any) => (
                  <tr
                    key={order.orderId}
                    className={`transition-colors cursor-pointer ${
                      selectedOrderId === order.orderId
                        ? 'bg-brand-50'
                        : 'hover:bg-bg-alt'
                    }`}
                    onClick={() => setSelectedOrderId(order.orderId)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-txt">
                      #{order.orderId.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-txt-secondary text-xs">
                      {order.customerUserId ? order.customerUserId.slice(0, 8) + '...' : 'Walk-in'}
                    </td>
                    <td className="px-4 py-3 text-txt-secondary capitalize text-xs">
                      {order.orderType}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge(order.orderStatus)}`}>
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-txt">
                      ${parseFloat(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-txt-secondary">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order.orderId); }}
                        className="text-brand-600 hover:text-brand-700"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Order Detail Panel */}
        {selectedOrderId && (
          <div className="bg-surface rounded-xl border border-border p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-txt">Order Details</h3>
              <button onClick={() => setSelectedOrderId(null)} className="text-txt-muted hover:text-txt">
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="text-sm text-txt-muted py-8 text-center">Loading...</div>
            ) : detail ? (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-txt-secondary">Order ID</span>
                    <span className="font-mono text-xs font-medium">{detail.orderId.slice(0, 12).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-txt-secondary">Status</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge(detail.orderStatus)}`}>
                      {detail.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-txt-secondary">Type</span>
                    <span className="capitalize">{detail.orderType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-txt-secondary">Payment</span>
                    <span className="capitalize">{detail.paymentMethod ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-txt-secondary">Created</span>
                    <span>{new Date(detail.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-txt-secondary">Subtotal</span>
                      <span className="tabular-nums">${parseFloat(detail.subtotal).toFixed(2)}</span>
                    </div>
                    {parseFloat(detail.discountTotal) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-txt-secondary">Discount</span>
                        <span className="tabular-nums text-green-600">-${parseFloat(detail.discountTotal).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-txt-secondary">Tax</span>
                      <span className="tabular-nums">${parseFloat(detail.taxTotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span>Total</span>
                      <span className="tabular-nums">${parseFloat(detail.total).toFixed(2)}</span>
                    </div>
                  </div>

                  {detail.metrcSyncStatus && (
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-txt-secondary">Metrc Sync</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          detail.metrcSyncStatus === 'synced' ? 'bg-green-50 text-green-700' :
                          detail.metrcSyncStatus === 'failed' ? 'bg-red-50 text-red-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>{detail.metrcSyncStatus}</span>
                      </div>
                      {detail.metrcReceiptId && (
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-txt-secondary">Receipt ID</span>
                          <span className="font-mono text-xs">{detail.metrcReceiptId}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {detail.notes && (
                    <div className="border-t border-border pt-3">
                      <p className="text-xs text-txt-secondary mb-1">Notes</p>
                      <p className="text-sm text-txt">{detail.notes}</p>
                    </div>
                  )}

                  {detail.cancellationReason && (
                    <div className="border-t border-border pt-3">
                      <p className="text-xs text-red-600 mb-1">Cancellation Reason</p>
                      <p className="text-sm text-red-700">{detail.cancellationReason}</p>
                    </div>
                  )}
                </div>

                {/* Cancel button for non-terminal orders */}
                {!['completed', 'cancelled', 'picked_up', 'delivered'].includes(detail.orderStatus) && (
                  <div className="pt-3 border-t border-border">
                    {showCancelDialog ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Cancellation reason..."
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => cancelMutation.mutate({ orderId: detail.orderId, reason: cancelReason })}
                            disabled={!cancelReason.trim() || cancelMutation.isPending}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                          >
                            <Ban size={14} /> Confirm Cancel
                          </button>
                          <button
                            onClick={() => { setShowCancelDialog(false); setCancelReason(''); }}
                            className="px-3 py-2 text-xs text-txt-secondary hover:text-txt border border-border rounded-lg"
                          >
                            Back
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCancelDialog(true)}
                        className="w-full flex items-center justify-center gap-1.5 text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      >
                        <XCircle size={14} /> Cancel Order
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-txt-muted py-8 text-center">Order not found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
