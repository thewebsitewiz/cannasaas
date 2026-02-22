/**
 * ═══════════════════════════════════════════════════════════════════
 * Analytics.tsx — Extended Analytics Dashboard
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/admin/src/pages/Analytics/Analytics.tsx
 *
 * Charts:
 *  - Revenue over time (area, date range selector)
 *  - Orders by fulfillment type (stacked bar)
 *  - Top products by revenue & quantity (horizontal bar)
 *  - Customer acquisition over time (line)
 *  - Conversion funnel (sessions → cart → checkout → order)
 *  - CSV export button
 *
 * API:
 *  GET /analytics/dashboard  (Sprint 12)
 *  GET /analytics/products   (Sprint 12)
 *  GET /analytics/customers  (Sprint 12)
 *  GET /analytics/export     (Sprint 12)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell,
} from 'recharts';
import {
  BarChart3, Download, Loader2, TrendingUp, Users,
  ShoppingCart, Package, RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@cannasaas/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardData {
  revenue: { total: number; change: number; byDay: { date: string; value: number }[] };
  orders: {
    total: number; change: number;
    byFulfillment: { date: string; pickup: number; delivery: number }[];
  };
  customers: { total: number; new: number; returning: number; byDay: { date: string; new: number; returning: number }[] };
  avgOrderValue: { value: number; change: number };
  topProducts: { productId: string; name: string; category: string; revenue: number; quantity: number }[];
  funnel: { stage: string; count: number }[];
}

// ─── Date Ranges ──────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: '7 Days',   days: 7 },
  { label: '30 Days',  days: 30 },
  { label: '90 Days',  days: 90 },
  { label: '1 Year',   days: 365 },
] as const;

// ─── Colors ───────────────────────────────────────────────────────────────────

const CHART_COLORS = {
  amber:   '#D97706',
  emerald: '#10B981',
  cyan:    '#06B6D4',
  purple:  '#8B5CF6',
  rose:    '#F43F5E',
  slate:   '#64748B',
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, valueFormatter = String }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-sm">
      <p className="text-xs text-slate-400 mb-1.5">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-mono font-medium" style={{ color: entry.color }}>
            {valueFormatter(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Funnel Bar ───────────────────────────────────────────────────────────────

function FunnelBar({ stage, count, maxCount, color }: { stage: string; count: number; maxCount: number; color: string }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="w-28 text-sm text-slate-400 text-right shrink-0 capitalize">
        {stage.replace(/_/g, ' ')}
      </span>
      <div className="flex-1 bg-slate-800 rounded-full h-7 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white font-medium">
          {count.toLocaleString()}
        </span>
      </div>
      <span className="w-12 text-xs text-slate-500 text-right font-mono shrink-0">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Analytics() {
  const [days, setDays] = useState<number>(30);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery<DashboardData>({
    queryKey: ['analytics', 'full', days],
    queryFn: () => apiClient.get(`/analytics/dashboard?days=${days}`).then(r => r.data),
  });

  const { data: productData } = useQuery({
    queryKey: ['analytics', 'products', days],
    queryFn: () => apiClient.get(`/analytics/products?days=${days}`).then(r => r.data),
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await apiClient.get(`/analytics/export?format=csv&days=${days}`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `cannasaas-analytics-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // toast error
    }
    setExporting(false);
  };

  const topProducts = (data?.topProducts ?? []).slice(0, 8);
  const maxFunnelCount = data?.funnel?.[0]?.count ?? 1;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-slate-400 text-sm">Performance insights across your dispensary</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => refetch()}
            disabled={isFetching}
            className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5">
            <RefreshCcw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {/* Date range */}
          <Select value={String(days)} onValueChange={v => setDays(parseInt(v))}>
            <SelectTrigger className="w-[120px] bg-slate-900 border-slate-800 text-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              {DATE_RANGES.map(({ label, days: d }) => (
                <SelectItem key={d} value={String(d)} className="text-white focus:bg-slate-800">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleExport}
            disabled={exporting}
            variant="outline"
            className="gap-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 h-9"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── KPI Summary Row ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Revenue', icon: TrendingUp,
            value: data ? formatCurrency(data.revenue.total) : '—',
            change: data?.revenue.change,
          },
          {
            label: 'Orders', icon: ShoppingCart,
            value: data?.orders.total.toLocaleString() ?? '—',
            change: data?.orders.change,
          },
          {
            label: 'New Customers', icon: Users,
            value: data?.customers.new.toLocaleString() ?? '—',
            change: null,
          },
          {
            label: 'Avg Order Value', icon: Package,
            value: data ? formatCurrency(data.avgOrderValue.value) : '—',
            change: data?.avgOrderValue.change,
          },
        ].map(({ label, icon: Icon, value, change }) => (
          <Card key={label} className="bg-slate-900 border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
                <Icon className="h-4 w-4 text-amber-400" />
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-24 bg-slate-800" />
              ) : (
                <>
                  <p className="text-2xl font-mono font-bold text-white">{value}</p>
                  {change != null && (
                    <p className={`text-xs mt-1 ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs prior period
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts Grid ── */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 p-1">
          {[
            { value: 'revenue',    label: 'Revenue' },
            { value: 'orders',     label: 'Orders' },
            { value: 'products',   label: 'Products' },
            { value: 'customers',  label: 'Customers' },
            { value: 'funnel',     label: 'Conversion Funnel' },
          ].map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 data-[state=active]:font-semibold text-slate-400 text-sm"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Revenue Over Time ── */}
        <TabsContent value="revenue">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-72 bg-slate-800 rounded" /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data?.revenue.byDay ?? []}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.amber} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={CHART_COLORS.amber} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#1E293B' }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false}
                      tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip valueFormatter={formatCurrency} />} />
                    <Area type="monotone" dataKey="value" name="Revenue" stroke={CHART_COLORS.amber}
                      strokeWidth={2} fill="url(#revGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Orders by Fulfillment ── */}
        <TabsContent value="orders">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Orders by Fulfillment Type</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-72 bg-slate-800 rounded" /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.orders.byFulfillment ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#1E293B' }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#1E293B' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 16 }} />
                    <Bar dataKey="pickup" name="Pickup" fill={CHART_COLORS.amber} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="delivery" name="Delivery" fill={CHART_COLORS.cyan} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Top Products ── */}
        <TabsContent value="products">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* By Revenue */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Top Products by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-64 bg-slate-800 rounded" /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart layout="vertical" data={topProducts} margin={{ left: 0, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false}
                        tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} />
                      <Tooltip content={<ChartTooltip valueFormatter={formatCurrency} />} cursor={{ fill: '#1E293B' }} />
                      <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                        {topProducts.map((_, idx) => (
                          <Cell key={idx} fill={`hsl(${38 + idx * 12}, 80%, ${55 - idx * 2}%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* By Quantity */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Top Products by Units Sold</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-64 bg-slate-800 rounded" /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart layout="vertical" data={topProducts} margin={{ left: 0, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: '#1E293B' }} />
                      <Bar dataKey="quantity" name="Units" radius={[0, 4, 4, 0]}>
                        {topProducts.map((_, idx) => (
                          <Cell key={idx} fill={`hsl(${170 + idx * 8}, 60%, ${50 - idx * 2}%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Customer Acquisition ── */}
        <TabsContent value="customers">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Customer Acquisition</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-72 bg-slate-800 rounded" /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.customers.byDay ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#1E293B' }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 16 }} />
                    <Line type="monotone" dataKey="new" name="New Customers"
                      stroke={CHART_COLORS.emerald} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="returning" name="Returning"
                      stroke={CHART_COLORS.purple} strokeWidth={2} dot={false} strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Conversion Funnel ── */}
        <TabsContent value="funnel">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent className="py-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 bg-slate-800 rounded-full" />)}
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl mx-auto">
                  {(data?.funnel ?? []).map((item, idx) => {
                    const hue = 38 + idx * 30;
                    return (
                      <FunnelBar
                        key={item.stage}
                        stage={item.stage}
                        count={item.count}
                        maxCount={maxFunnelCount}
                        color={`hsl(${hue}, 75%, 55%)`}
                      />
                    );
                  })}
                  {data?.funnel && data.funnel.length >= 2 && (
                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <p className="text-sm text-slate-400">
                        Overall conversion:{' '}
                        <span className="text-amber-400 font-mono font-bold">
                          {((data.funnel[data.funnel.length - 1].count / data.funnel[0].count) * 100).toFixed(1)}%
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
