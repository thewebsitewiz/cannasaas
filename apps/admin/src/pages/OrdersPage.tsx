import { useDashboard } from '../hooks/useDashboard';
import { ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';

export function OrdersPage() {
  const { data, isLoading } = useDashboard(30);

  if (isLoading) return <div className="text-txt-muted">Loading...</div>;

  const sales = data?.sales;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-txt">Orders</h1>

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

      <div className="bg-surface rounded-xl border border-border p-12 text-center text-txt-muted">
        <p>Order list with filtering and status management coming next.</p>
        <p className="text-sm mt-1">The order data is flowing through the dashboard API.</p>
      </div>
    </div>
  );
}
