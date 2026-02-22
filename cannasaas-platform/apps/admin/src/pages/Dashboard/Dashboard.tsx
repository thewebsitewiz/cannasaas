/**
 * ═══════════════════════════════════════════════════════════════════
 * Dashboard.tsx — Admin Portal Overview
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/admin/src/pages/Dashboard/Dashboard.tsx
 *
 * Displays:
 *  - 4 KPI stat cards (revenue, orders, customers, AOV) w/ % change
 *  - Revenue area/line chart via Recharts (7d / 30d / 90d selector)
 *  - Top products table
 *  - Recent orders list
 *  - Low-stock alerts panel
 *
 * API: GET /analytics/dashboard  (Sprint 12)
 *      GET /products/low-stock   (Sprint 4)
 *      GET /orders?limit=5       (Sprint 5)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingCart, Users,
  DollarSign, BarChart3, AlertTriangle, ArrowRight,
  Package, Clock, CheckCircle2, Truck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@cannasaas/utils';
import { Link } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DashboardMetrics {
  revenue: { total: number; change: number; byDay: { date: string; value: number }[] };
  orders: { total: number; change: number; byDay: { date: string; value: number }[] };
  customers: { total: number; new: number; returning: number; change: number };
  avgOrderValue: { value: number; change: number };
  topProducts: { productId: string; name: string; revenue: number; quantity: number; category: string }[];
  recentOrders: {
    id: string; orderNumber: string; customerName: string;
    total: number; status: string; createdAt: string; fulfillmentMethod: string;
  }[];
}

interface LowStockItem {
  id: string; name: string; variantName: string;
  quantity: number; threshold: number; category: string;
}

// ─── Date Range Options ──────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
] as const;

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  title, value, change, icon: Icon, formatter = (v: number) => v.toLocaleString(), loading,
}: {
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  formatter?: (v: number) => string;
  loading?: boolean;
}) {
  const isPositive = change >= 0;

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-3 bg-slate-800" />
          <Skeleton className="h-8 w-32 mb-2 bg-slate-800" />
          <Skeleton className="h-3 w-20 bg-slate-800" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</span>
          <div className="p-2 rounded-lg bg-slate-800">
            <Icon className="h-4 w-4 text-amber-400" />
          </div>
        </div>
        <div className="text-3xl font-bold text-white font-mono tracking-tight mb-2">
          {formatter(value)}
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{Math.abs(change).toFixed(1)}% vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:          'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
    confirmed:        'bg-blue-900/40 text-blue-300 border-blue-700/50',
    preparing:        'bg-purple-900/40 text-purple-300 border-purple-700/50',
    ready_for_pickup: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
    out_for_delivery: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
    completed:        'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
    cancelled:        'bg-red-900/40 text-red-300 border-red-700/50',
  };
  const icons: Record<string, React.ElementType> = {
    pending: Clock, confirmed: CheckCircle2, preparing: Package,
    ready_for_pickup: CheckCircle2, out_for_delivery: Truck, completed: CheckCircle2,
  };
  const StatusIcon = icons[status] || Clock;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${styles[status] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
      <StatusIcon className="h-3 w-3" />
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Custom Chart Tooltip ────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-mono font-bold text-amber-400">
        {formatCurrency(payload[0]?.value ?? 0)}
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<7 | 30 | 90>(30);
  const [chartType, setChartType] = useState<'area' | 'line'>('area');

  // ── Data Fetching ──
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['analytics', 'dashboard', dateRange],
    queryFn: () => apiClient.get(`/analytics/dashboard?days=${dateRange}`).then(r => r.data),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 min
  });

  const { data: lowStockItems } = useQuery<LowStockItem[]>({
    queryKey: ['products', 'low-stock'],
    queryFn: () => apiClient.get('/products/low-stock').then(r => r.data),
  });

  // ── Chart Data ──
  const chartData = metrics?.revenue.byDay ?? [];

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;
  const DataComponent = chartType === 'area' ? Area : Line;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="h-6 w-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        </div>
        <p className="text-slate-400 text-sm">Overview of your dispensary performance</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Revenue"
          value={metrics?.revenue.total ?? 0}
          change={metrics?.revenue.change ?? 0}
          icon={DollarSign}
          formatter={formatCurrency}
          loading={metricsLoading}
        />
        <StatCard
          title="Orders Today"
          value={metrics?.orders.total ?? 0}
          change={metrics?.orders.change ?? 0}
          icon={ShoppingCart}
          loading={metricsLoading}
        />
        <StatCard
          title="Active Customers"
          value={metrics?.customers.total ?? 0}
          change={metrics?.customers.change ?? 0}
          icon={Users}
          loading={metricsLoading}
        />
        <StatCard
          title="Avg Order Value"
          value={metrics?.avgOrderValue.value ?? 0}
          change={metrics?.avgOrderValue.change ?? 0}
          icon={TrendingUp}
          formatter={formatCurrency}
          loading={metricsLoading}
        />
      </div>

      {/* ── Revenue Chart ── */}
      <Card className="bg-slate-900 border-slate-800 mb-8">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white text-lg">Revenue Over Time</CardTitle>
              <p className="text-slate-400 text-sm mt-0.5">Daily revenue for selected period</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Chart type toggle */}
              <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                {(['area', 'line'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                      chartType === type
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {/* Date range selector */}
              <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                {DATE_RANGES.map(({ label, days }) => (
                  <button
                    key={days}
                    onClick={() => setDateRange(days as 7 | 30 | 90)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      dateRange === days
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {metricsLoading ? (
            <Skeleton className="h-64 w-full bg-slate-800" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <ChartComponent data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#1E293B' }}
                />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#D97706', strokeWidth: 1, strokeDasharray: '4 4' }} />
                {chartType === 'area' ? (
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#D97706"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#D97706', strokeWidth: 0 }}
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#D97706"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#D97706', strokeWidth: 0 }}
                  />
                )}
              </ChartComponent>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Bottom Grid: Top Products + Recent Orders + Low Stock ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Top Products */}
        <Card className="bg-slate-900 border-slate-800 xl:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">Top Products</CardTitle>
              <Link to="/products">
                <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-slate-800 h-7 px-2 text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {metricsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 bg-slate-800 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {(metrics?.topProducts ?? []).slice(0, 5).map((product, idx) => (
                  <div key={product.productId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                    <span className="text-xs font-mono text-slate-500 w-4 shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-medium">{product.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{product.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono text-amber-400 font-medium">{formatCurrency(product.revenue)}</p>
                      <p className="text-xs text-slate-500">{product.quantity} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="bg-slate-900 border-slate-800 xl:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">Recent Orders</CardTitle>
              <Link to="/orders">
                <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-slate-800 h-7 px-2 text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {metricsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 bg-slate-800 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(metrics?.recentOrders ?? []).map((order) => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-300">{order.orderNumber}</span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-xs text-slate-500 truncate">{order.customerName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-mono text-white font-medium">{formatCurrency(order.total)}</p>
                        <p className="text-xs text-slate-500 capitalize">{order.fulfillmentMethod}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="bg-slate-900 border-slate-800 xl:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-white text-base">Low Stock Alerts</CardTitle>
                {(lowStockItems?.length ?? 0) > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {lowStockItems!.length}
                  </span>
                )}
              </div>
              <Link to="/products?filter=low-stock">
                <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-slate-800 h-7 px-2 text-xs gap-1">
                  Manage <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {!lowStockItems ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-14 bg-slate-800 rounded-lg" />
                ))}
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                <p className="text-sm text-slate-400">All products well-stocked</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => {
                  const pct = Math.round((item.quantity / item.threshold) * 100);
                  const isCritical = item.quantity <= 2;
                  return (
                    <div key={item.id} className={`p-2.5 rounded-lg border ${isCritical ? 'border-red-800/50 bg-red-900/10' : 'border-amber-800/30 bg-amber-900/5'}`}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white font-medium truncate">{item.name}</p>
                          <p className="text-xs text-slate-500 truncate">{item.variantName}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <AlertTriangle className={`h-3 w-3 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
                          <span className={`text-sm font-mono font-bold ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                            {item.quantity}
                          </span>
                          <span className="text-xs text-slate-500">left</span>
                        </div>
                      </div>
                      {/* Stock bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
