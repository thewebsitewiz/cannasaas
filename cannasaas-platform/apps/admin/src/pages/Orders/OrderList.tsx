/**
 * ═══════════════════════════════════════════════════════════════════
 * OrderList.tsx — Order Management
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/admin/src/pages/Orders/OrderList.tsx
 *
 * Features:
 *  - Order list with status, date range, fulfillment method filters
 *  - Quick status update from list
 *  - Pagination
 *
 * API: GET /orders  (Sprint 5)
 *      PUT /orders/:id/status  (Sprint 5)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShoppingCart, Search, ChevronLeft, ChevronRight,
  Clock, CheckCircle2, Truck, Package, XCircle,
  Eye, ArrowUpDown, Filter, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@cannasaas/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  fulfillmentMethod: 'pickup' | 'delivery';
  total: number;
  itemCount: number;
  createdAt: string;
  dispensaryName?: string;
}

interface OrdersResponse {
  data: Order[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  pending:          { label: 'Pending',          color: 'text-yellow-300',  bg: 'bg-yellow-900/30',   border: 'border-yellow-700/40', icon: Clock },
  confirmed:        { label: 'Confirmed',         color: 'text-blue-300',    bg: 'bg-blue-900/30',     border: 'border-blue-700/40',   icon: CheckCircle2 },
  preparing:        { label: 'Preparing',         color: 'text-purple-300',  bg: 'bg-purple-900/30',   border: 'border-purple-700/40', icon: Package },
  ready_for_pickup: { label: 'Ready for Pickup',  color: 'text-amber-300',   bg: 'bg-amber-900/30',    border: 'border-amber-700/40',  icon: CheckCircle2 },
  out_for_delivery: { label: 'Out for Delivery',  color: 'text-cyan-300',    bg: 'bg-cyan-900/30',     border: 'border-cyan-700/40',   icon: Truck },
  completed:        { label: 'Completed',         color: 'text-emerald-300', bg: 'bg-emerald-900/30',  border: 'border-emerald-700/40',icon: CheckCircle2 },
  cancelled:        { label: 'Cancelled',         color: 'text-red-300',     bg: 'bg-red-900/30',      border: 'border-red-700/40',    icon: XCircle },
  refunded:         { label: 'Refunded',          color: 'text-slate-300',   bg: 'bg-slate-800/50',    border: 'border-slate-700/40',  icon: RefreshCw },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border whitespace-nowrap ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon className="h-3 w-3 shrink-0" />
      {cfg.label}
    </span>
  );
}

const ALL_STATUSES = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }));

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const page = parseInt(searchParams.get('page') ?? '1');
  const search = searchParams.get('q') ?? '';
  const statusFilter = searchParams.get('status') ?? 'all';
  const fulfillmentFilter = searchParams.get('fulfillment') ?? 'all';
  const dateFrom = searchParams.get('from') ?? '';
  const dateTo = searchParams.get('to') ?? '';

  const updateParam = (key: string, val: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val && val !== 'all') next.set(key, val); else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });
  };

  // ── Query ──
  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['orders', { page, search, statusFilter, fulfillmentFilter, dateFrom, dateTo, sortField, sortDir }],
    queryFn: () => {
      const p = new URLSearchParams({
        page: String(page), limit: '25',
        sort: `${sortField}_${sortDir}`,
        ...(search && { q: search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(fulfillmentFilter !== 'all' && { fulfillmentMethod: fulfillmentFilter }),
        ...(dateFrom && { from: dateFrom }),
        ...(dateTo && { to: dateTo }),
      });
      return apiClient.get(`/orders?${p}`).then(r => r.data);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.put(`/orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
            <p className="text-slate-400 text-sm">{pagination?.total ?? '—'} total orders</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search order # or customer…"
            value={search}
            onChange={e => updateParam('q', e.target.value)}
            className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500/50 h-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={v => updateParam('status', v)}>
          <SelectTrigger className="bg-slate-900 border-slate-800 text-white h-9">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-white focus:bg-slate-800">All Statuses</SelectItem>
            {ALL_STATUSES.map(({ value, label }) => (
              <SelectItem key={value} value={value} className="text-white focus:bg-slate-800">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={fulfillmentFilter} onValueChange={v => updateParam('fulfillment', v)}>
          <SelectTrigger className="bg-slate-900 border-slate-800 text-white h-9">
            <SelectValue placeholder="Fulfillment" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-white focus:bg-slate-800">All Methods</SelectItem>
            <SelectItem value="pickup" className="text-white focus:bg-slate-800">Pickup</SelectItem>
            <SelectItem value="delivery" className="text-white focus:bg-slate-800">Delivery</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={e => updateParam('from', e.target.value)}
            className="bg-slate-900 border-slate-800 text-white h-9 text-sm"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">
                  <button onClick={() => toggleSort('orderNumber')} className="flex items-center gap-1 hover:text-white">
                    Order <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Fulfillment</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">
                  <button onClick={() => toggleSort('total')} className="flex items-center gap-1 hover:text-white">
                    Total <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">
                  <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 hover:text-white">
                    Date <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Update Status</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="bg-slate-950 divide-y divide-slate-900">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-5 bg-slate-800 rounded" style={{ width: j === 1 ? '120px' : '70px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <ShoppingCart className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400">No orders found</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-amber-400 text-sm font-medium">{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{order.customerName}</p>
                      <p className="text-slate-500 text-xs">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs border ${
                        order.fulfillmentMethod === 'delivery'
                          ? 'bg-cyan-900/20 border-cyan-800/30 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}>
                        {order.fulfillmentMethod === 'delivery' ? <Truck className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                        {order.fulfillmentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-white text-sm">{formatCurrency(order.total)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-sm">{order.itemCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-xs">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {/* Quick status update — only contextually relevant transitions */}
                      {order.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: order.id, status: 'confirmed' })}
                          className="h-6 px-2.5 text-xs bg-blue-900/20 border-blue-700/40 text-blue-300 hover:bg-blue-900/40">
                          Confirm
                        </Button>
                      )}
                      {order.status === 'confirmed' && (
                        <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: order.id, status: 'preparing' })}
                          className="h-6 px-2.5 text-xs bg-purple-900/20 border-purple-700/40 text-purple-300 hover:bg-purple-900/40">
                          Mark Preparing
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button size="sm" variant="outline"
                          onClick={() => statusMutation.mutate({
                            id: order.id,
                            status: order.fulfillmentMethod === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup',
                          })}
                          className="h-6 px-2.5 text-xs bg-amber-900/20 border-amber-700/40 text-amber-300 hover:bg-amber-900/40">
                          {order.fulfillmentMethod === 'delivery' ? 'Send Out' : 'Ready'}
                        </Button>
                      )}
                      {(order.status === 'out_for_delivery' || order.status === 'ready_for_pickup') && (
                        <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: order.id, status: 'completed' })}
                          className="h-6 px-2.5 text-xs bg-emerald-900/20 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40">
                          Complete
                        </Button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white hover:bg-slate-800">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              Showing {((page - 1) * pagination.pageSize) + 1}–{Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
                className="h-7 w-7 p-0 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-30">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-slate-400 font-mono">{page} / {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages}
                onClick={() => updateParam('page', String(page + 1))}
                className="h-7 w-7 p-0 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-30">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
