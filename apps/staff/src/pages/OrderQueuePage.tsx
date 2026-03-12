import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { Clock, CheckCircle, ChefHat, Truck, Package } from 'lucide-react';

const DASHBOARD_QUERY = `
  query { dashboard(days: 1) {
    sales { totalOrders completedOrders pendingOrders totalRevenue averageOrderValue }
    metrcSync { ordersAwaitingSync failedCount }
  }}
`;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; next?: string; nextLabel?: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock, next: 'confirmed', nextLabel: 'Confirm' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle, next: 'preparing', nextLabel: 'Start Prep' },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-800', icon: ChefHat, next: 'ready_for_pickup', nextLabel: 'Mark Ready' },
  ready_for_pickup: { label: 'Ready', color: 'bg-green-100 text-green-800', icon: Package, next: 'picked_up', nextLabel: 'Complete' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800', icon: Truck, next: 'delivered', nextLabel: 'Delivered' },
};

const UPDATE_STATUS = `
  mutation UpdateStatus($orderId: ID!, $dispensaryId: ID!, $status: String!, $notes: String) {
    updateFulfillmentStatus(orderId: $orderId, dispensaryId: $dispensaryId, status: $status, notes: $notes) {
      trackingId status
    }
  }
`;

export function OrderQueuePage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['staffDashboard'],
    queryFn: () => gqlRequest<{ dashboard: any }>(DASHBOARD_QUERY),
    refetchInterval: 15_000, // Poll every 15s
  });

  const { data: orders } = useQuery({
    queryKey: ['activeOrders', dispensaryId],
    queryFn: async () => {
      // Get active orders directly from DB via analytics
      const result = await gqlRequest<{ dashboard: any }>(`
        query { dashboard(days: 1) { sales { totalOrders pendingOrders completedOrders } } }
      `);
      return result.dashboard.sales;
    },
    refetchInterval: 10_000,
  });

  const updateStatus = useMutation({
    mutationFn: (vars: { orderId: string; status: string }) =>
      gqlRequest(UPDATE_STATUS, { ...vars, dispensaryId, notes: null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activeOrders'] }),
  });

  const sales = data?.dashboard?.sales;
  const metrc = data?.dashboard?.metrcSync;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Order Queue</h1>

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

      {/* Order Queue Placeholder */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Active Orders</h2>
          <span className="text-xs text-gray-400">Auto-refreshes every 10s</span>
        </div>

        {/* Status lanes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['pending', 'confirmed', 'preparing', 'ready_for_pickup'].map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            return (
              <div key={status} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={16} className="text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700">{config.label}</h3>
                </div>

                {/* Placeholder cards — in production these would map over real order data */}
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-lg p-3 text-center text-xs text-gray-400">
                    Order data will appear here when the orders list query is expanded
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-gray-400 mt-4 text-center">
          The fulfillment status pipeline is wired to the backend. Orders flow through:
          pending → confirmed → preparing → ready → picked_up/delivered
        </p>
      </div>
    </div>
  );
}
