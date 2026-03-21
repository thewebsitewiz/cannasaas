import { useDashboard } from '../hooks/useDashboard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Package, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: any; sub?: string }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-brand-50 rounded-lg"><Icon size={18} className="text-brand-600" /></div>
        <span className="text-sm font-medium text-txt-secondary">{label}</span>
      </div>
      <p className="text-2xl font-bold text-txt tabular-nums">{value}</p>
      {sub && <p className="text-xs text-txt-muted mt-1">{sub}</p>}
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard(30);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-txt">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface rounded-xl border border-border p-5 animate-pulse">
              <div className="w-20 h-4 bg-gray-100 rounded mb-3" />
              <div className="w-28 h-7 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-bg text-danger rounded-xl p-6">
        <h2 className="font-semibold">Failed to load dashboard</h2>
        <p className="text-sm mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  if (!data) return null;

  const { sales, salesTrend, topProducts, categoryBreakdown, inventory, lowStockItems, metrcSync, compliance } = data;
  const fmt = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-txt">Dashboard</h1>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={fmt(sales.totalRevenue)} icon={DollarSign} sub={`${sales.totalOrders} orders`} />
        <StatCard label="Avg Order Value" value={fmt(sales.averageOrderValue)} icon={TrendingUp} />
        <StatCard label="Completed" value={sales.completedOrders} icon={ShoppingCart} sub={`${sales.pendingOrders} pending`} />
        <StatCard label="Compliance" value={`${compliance.compliancePercent}%`} icon={ShieldCheck} sub={`${compliance.compliantProducts}/${compliance.totalProducts} products`} />
      </div>

      {/* ── Sales Trend + Top Products ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-txt mb-4">Sales Trend (30d)</h2>
          {salesTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={salesTrend}>
                <XAxis dataKey="period" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-txt-muted text-sm py-12 text-center">No sales data for this period</p>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-txt mb-4">Top Products</h2>
          {topProducts.length > 0 ? (
            <ul className="space-y-3">
              {topProducts.map((p: any, i: number) => (
                <li key={p.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-txt-muted w-5">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-txt">{p.productName}</p>
                      <p className="text-xs text-txt-muted">{p.unitsSold} units</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-txt tabular-nums">{fmt(p.revenue)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-txt-muted text-sm py-8 text-center">No product data</p>
          )}
        </div>
      </div>

      {/* ── Category Breakdown + Inventory ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-txt mb-4">Sales by Category</h2>
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category }: any) => category}>
                  {categoryBreakdown.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-txt-muted text-sm py-8 text-center">No category data</p>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-txt mb-4">Inventory Health</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-txt-secondary">Total Variants</p>
              <p className="text-xl font-bold">{inventory.totalVariants}</p>
            </div>
            <div>
              <p className="text-sm text-txt-secondary">Units Available</p>
              <p className="text-xl font-bold">{inventory.totalUnitsAvailable}</p>
            </div>
            <div>
              <p className="text-sm text-txt-secondary">Est. Value</p>
              <p className="text-xl font-bold">{fmt(inventory.estimatedInventoryValue)}</p>
            </div>
            <div>
              <p className="text-sm text-txt-secondary">Low / Out of Stock</p>
              <p className="text-xl font-bold">
                <span className={inventory.lowStockCount > 0 ? 'text-amber-600' : ''}>{inventory.lowStockCount}</span>
                {' / '}
                <span className={inventory.outOfStockCount > 0 ? 'text-red-600' : ''}>{inventory.outOfStockCount}</span>
              </p>
            </div>
          </div>

          {lowStockItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <AlertTriangle size={14} className="text-amber-500" /> Low Stock
              </h3>
              <ul className="space-y-1">
                {lowStockItems.slice(0, 5).map((item: any) => (
                  <li key={item.variantId} className="flex justify-between text-xs">
                    <span className="text-gray-600">{item.productName}</span>
                    <span className="font-medium text-amber-600">{item.quantityAvailable} left</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Metrc Sync + Compliance ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-txt mb-4 flex items-center gap-2">
            <RefreshCw size={18} /> Metrc Sync Status
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-txt-secondary">Total Syncs</p>
              <p className="text-xl font-bold">{metrcSync.totalSyncs}</p>
            </div>
            <div>
              <p className="text-sm text-txt-secondary">Success Rate</p>
              <p className={`text-xl font-bold ${metrcSync.successRate >= 90 ? 'text-green-600' : metrcSync.successRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {metrcSync.successRate}%
              </p>
            </div>
            <div>
              <p className="text-sm text-txt-secondary">Failed</p>
              <p className={`text-xl font-bold ${metrcSync.failedCount > 0 ? 'text-red-600' : ''}`}>{metrcSync.failedCount}</p>
            </div>
            <div>
              <p className="text-sm text-txt-secondary">Awaiting Sync</p>
              <p className={`text-xl font-bold ${metrcSync.ordersAwaitingSync > 0 ? 'text-amber-600' : ''}`}>{metrcSync.ordersAwaitingSync}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-txt mb-4 flex items-center gap-2">
            <ShieldCheck size={18} /> Compliance Overview
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-txt-secondary">Compliance</p>
              <p className={`text-xl font-bold ${compliance.compliancePercent === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                {compliance.compliancePercent}%
              </p>
            </div>
            <div>
              <p className="text-sm text-txt-secondary">Compliant</p>
              <p className="text-xl font-bold">{compliance.compliantProducts}/{compliance.totalProducts}</p>
            </div>
            <div>
              <p className="text-sm text-txt-secondary">Missing UID</p>
              <p className={`text-xl font-bold ${compliance.missingUid > 0 ? 'text-red-600' : ''}`}>{compliance.missingUid}</p>
            </div>
            <div>
              <p className="text-sm text-txt-secondary">Missing Labels</p>
              <p className={`text-xl font-bold ${compliance.missingPackageLabel > 0 ? 'text-red-600' : ''}`}>{compliance.missingPackageLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
