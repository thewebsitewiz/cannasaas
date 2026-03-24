import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { Clock, CheckCircle, ChefHat, Package, AlertCircle, RefreshCw } from 'lucide-react';

const DASHBOARD_QUERY = `
  query { dashboard(days: 1) {
    sales { totalOrders completedOrders pendingOrders totalRevenue averageOrderValue }
    metrcSync { ordersAwaitingSync failedCount }
  }}
`;

const ORDERS_QUERY = `
  query($dispensaryId: ID!, $limit: Int, $offset: Int) {
    orders(dispensaryId: $dispensaryId, limit: $limit, offset: $offset) {
      orderId dispensaryId customerUserId orderType orderStatus
      subtotal taxTotal total createdAt updatedAt
    }
  }
`;

const UPDATE_STATUS = `
  mutation UpdateStatus($orderId: ID!, $dispensaryId: ID!, $status: String!, $notes: String) {
    updateFulfillmentStatus(orderId: $orderId, dispensaryId: $dispensaryId, status: $status, notes: $notes) {
      trackingId status
    }
  }
`;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; next?: string; nextLabel?: string }> = {
  pending:          { label: 'Pending',   color: 'text-yellow-800', bg: 'bg-yellow-50 border-yellow-200', icon: Clock,       next: 'confirmed',        nextLabel: 'Confirm' },
  confirmed:        { label: 'Confirmed', color: 'text-blue-800',   bg: 'bg-blue-50 border-blue-200',     icon: CheckCircle, next: 'preparing',        nextLabel: 'Start Prep' },
  preparing:        { label: 'Preparing', color: 'text-purple-800', bg: 'bg-purple-50 border-purple-200', icon: ChefHat,     next: 'ready_for_pickup', nextLabel: 'Mark Ready' },
  ready_for_pickup: { label: 'Ready',     color: 'text-green-800',  bg: 'bg-green-50 border-green-200',   icon: Package,     next: 'picked_up',        nextLabel: 'Complete' },
};

const LANE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready_for_pickup'] as const;

export function OrderQueuePage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['staffDashboard'],
    queryFn: () => gqlRequest<{ dashboard: any }>(DASHBOARD_QUERY),
    refetchInterval: 15_000,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['activeOrders', dispensaryId],
    queryFn: () => gqlRequest<{ orders: any[] }>(ORDERS_QUERY, { dispensaryId, limit: 100, offset: 0 }),
    enabled: !!dispensaryId,
    refetchInterval: 10_000,
  });

  const updateStatus = useMutation({
    mutationFn: (vars: { orderId: string; status: string }) =>
      gqlRequest(UPDATE_STATUS, { ...vars, dispensaryId, notes: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['staffDashboard'] });
    },
  });

  const allOrders = ordersData?.orders ?? [];
  const sales = data?.dashboard?.sales;
  const metrc = data?.dashboard?.metrcSync;

  const ordersByStatus = (status: string) =>
    allOrders.filter((o: any) => o.orderStatus === status);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const minutesAgo = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Order Queue</h1>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '3s' }} />
          Auto-refreshes every 10s
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{sales?.pendingOrders ?? 0}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{sales?.completedOrders ?? 0}</p>
          <p className="text-xs text-gray-500">Completed Today</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold">{sales?.totalOrders ?? 0}</p>
          <p className="text-xs text-gray-500">Total Today</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold">${(sales?.totalRevenue ?? 0).toFixed(0)}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className={`text-2xl font-bold ${(metrc?.ordersAwaitingSync ?? 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {metrc?.ordersAwaitingSync ?? 0}
          </p>
          <p className="text-xs text-gray-500">Metrc Pending</p>
        </div>
      </div>

      {/* Kanban Lanes */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Active Orders</h2>
          <span className="text-xs text-gray-400">{allOrders.length} orders loaded</span>
        </div>

        {ordersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {LANE_STATUSES.map((s) => (
              <div key={s} className="border border-gray-100 rounded-lg p-4 animate-pulse">
                <div className="h-4 w-20 bg-gray-100 rounded mb-3" />
                <div className="h-16 bg-gray-50 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {LANE_STATUSES.map((status) => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              const orders = ordersByStatus(status);
              return (
                <div key={status} className="border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-gray-500" />
                      <h3 className="text-sm font-semibold text-gray-700">{config.label}</h3>
                    </div>
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {orders.length}
                    </span>
                  </div>

                  <div className="p-3 space-y-2 max-h-[480px] overflow-y-auto">
                    {orders.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-300">
                        No orders
                      </div>
                    ) : (
                      orders.map((order: any) => (
                        <div
                          key={order.orderId}
                          className={`rounded-lg border p-3 ${config.bg}`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-gray-900 font-mono">
                              #{order.orderId.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {minutesAgo(order.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500 capitalize">
                              {order.orderType}
                            </span>
                            <span className="text-sm font-bold tabular-nums text-gray-900">
                              ${parseFloat(order.total).toFixed(2)}
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-400 mb-2">
                            {formatTime(order.createdAt)}
                          </div>

                          {config.next && (
                            <button
                              onClick={() => updateStatus.mutate({ orderId: order.orderId, status: config.next! })}
                              disabled={updateStatus.isPending}
                              className={`w-full text-center text-xs font-semibold py-2 rounded-md transition-colors ${
                                updateStatus.isPending
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              {updateStatus.isPending ? 'Updating...' : config.nextLabel}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {updateStatus.isError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
            <AlertCircle size={16} />
            Failed to update order status. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
