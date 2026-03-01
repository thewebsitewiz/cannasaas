#!/usr/bin/env zsh
# ============================================================
# CannaSaas — Section 8: Admin Portal
# Creates all files for apps/admin under cannasaas-platform/
#
# Usage:
#   chmod +x setup-section8-admin.zsh
#   ./setup-section8-admin.zsh
#
# Safe to re-run: existing files will be overwritten.
# ============================================================

set -euo pipefail

PLATFORM_ROOT="${1:-$HOME/cannasaas-platform}"

print -P "%F{green}▶ CannaSaas Admin Portal — Section 8 scaffold%f"
print -P "%F{cyan}  Target: $PLATFORM_ROOT%f"
echo ""

# ── Create directory structure ─────────────────────────────────
mkdir -p "$PLATFORM_ROOT/apps/admin/src/guards"
mkdir -p "$PLATFORM_ROOT/apps/admin/src/layouts"
mkdir -p "$PLATFORM_ROOT/apps/admin/src/pages/Compliance"
mkdir -p "$PLATFORM_ROOT/apps/admin/src/pages/Dashboard"
mkdir -p "$PLATFORM_ROOT/apps/admin/src/pages/Dashboard/components"
mkdir -p "$PLATFORM_ROOT/apps/admin/src/pages/Onboarding"
mkdir -p "$PLATFORM_ROOT/apps/admin/src/pages/Onboarding/steps"
mkdir -p "$PLATFORM_ROOT/apps/admin/src/pages/Orders"
mkdir -p "$PLATFORM_ROOT/apps/admin/src/pages/Orders/components"
mkdir -p "$PLATFORM_ROOT/apps/admin/src/pages/Products"
mkdir -p "$PLATFORM_ROOT/apps/admin/src/pages/Products/components"

print -P "%F{green}✓ Directories created%f"
echo ""

# ── Write source files ─────────────────────────────────────────

# ── apps/admin/src/layouts/AdminLayout.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/layouts/AdminLayout.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/layouts/AdminLayout.tsx" << 'FILE_EOF'
// apps/admin/src/layouts/AdminLayout.tsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Shield,
  Truck,
  LogOut,
  ChevronLeft,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '@cannasaas/stores';
import { useCurrentUser } from '@cannasaas/stores';
import { cn } from '@cannasaas/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[]; // Only show for these roles
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Orders', href: '/orders', icon: ShoppingBag },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Delivery', href: '/delivery', icon: Truck },
  {
    label: 'Compliance',
    href: '/compliance',
    icon: Shield,
    roles: ['admin', 'manager', 'owner'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'owner'],
  },
];

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const user = useCurrentUser();
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      !item.roles ||
      item.roles.some((role) => user?.roles.includes(role as any)),
  );

  const handleLogout = () => {
    clearAuth();
    navigate('/auth/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-secondary)]">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)]',
          'transition-all duration-[var(--p-dur-normal)]',
          'flex-shrink-0',
          sidebarCollapsed ? 'w-16' : 'w-60',
        )}
        aria-label="Main navigation"
      >
        {/* Logo / brand */}
        <div className="flex items-center h-16 px-4 border-b border-[var(--color-border)]">
          {!sidebarCollapsed && (
            <span className="text-[var(--p-text-lg)] font-black text-[var(--color-brand)] truncate">
              CannaSaas
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={
              sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
            aria-expanded={!sidebarCollapsed}
            className="ml-auto p-1.5 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
          >
            <ChevronLeft
              size={18}
              className={cn(
                'transition-transform duration-[var(--p-dur-normal)]',
                sidebarCollapsed && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-2 overflow-y-auto" aria-label="Admin sections">
          {visibleItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[var(--p-radius-md)]',
                  'text-[var(--p-text-sm)] font-semibold',
                  'transition-colors duration-[var(--p-dur-fast)]',
                  'mb-0.5 relative',
                  isActive
                    ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]',
                )
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon
                size={18}
                className="flex-shrink-0"
                aria-hidden="true"
              />
              {!sidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={cn(
                    'absolute right-2 min-w-[20px] h-5 px-1',
                    'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]',
                    'text-[10px] font-bold rounded-full flex items-center justify-center',
                    sidebarCollapsed && 'right-0.5 top-0.5',
                  )}
                  aria-label={`${item.badge} unread`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-[var(--color-border)] p-2">
          {!sidebarCollapsed && user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] truncate">
                {user.roles[0]}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5',
              'rounded-[var(--p-radius-md)]',
              'text-[var(--p-text-sm)] font-semibold',
              'text-[var(--color-text-secondary)] hover:text-[var(--color-error)]',
              'hover:bg-red-50 dark:hover:bg-red-950/20',
              'transition-colors',
            )}
            aria-label="Sign out"
          >
            <LogOut size={18} className="flex-shrink-0" aria-hidden="true" />
            {!sidebarCollapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center h-16 px-6 bg-[var(--color-bg)] border-b border-[var(--color-border)] flex-shrink-0"
          aria-label="Admin top bar"
        >
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
            >
              <Bell size={20} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Dashboard/DashboardPage.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Dashboard/DashboardPage.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Dashboard/DashboardPage.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Dashboard/DashboardPage.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  useAnalyticsDashboard,
  useLowStockProducts,
} from '@cannasaas/api-client';
import { StatCard } from './components/StatCard';
import { TopProductsTable } from './components/TopProductsTable';
import { Skeleton } from '@cannasaas/ui';
import { formatCurrency } from '@cannasaas/utils';

export default function DashboardPage() {
  const { data: analytics, isLoading } = useAnalyticsDashboard();
  const { data: lowStock } = useLowStockProducts();

  return (
    <>
      <Helmet>
        <title>Dashboard | CannaSaas Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)]">
            Dashboard
          </h1>
          <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* KPI Cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          aria-label="Key performance indicators"
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-[var(--p-radius-lg)]" />
            ))
          ) : (
            <>
              <StatCard
                title="Total Revenue"
                value={formatCurrency(analytics?.revenue.total ?? 0)}
                change={analytics?.revenue.change ?? 0}
                icon={DollarSign}
                description="Revenue compared to last period"
              />
              <StatCard
                title="Total Orders"
                value={analytics?.orders.total.toLocaleString() ?? '0'}
                change={analytics?.orders.change ?? 0}
                icon={ShoppingBag}
                description="Orders compared to last period"
              />
              <StatCard
                title="Avg Order Value"
                value={formatCurrency(analytics?.avgOrderValue.value ?? 0)}
                change={analytics?.avgOrderValue.change ?? 0}
                icon={TrendingUp}
                description="AOV compared to last period"
              />
              <StatCard
                title="Customers"
                value={analytics?.customers.total.toLocaleString() ?? '0'}
                change={0}
                icon={Users}
                subtitle={`${analytics?.customers.new ?? 0} new this period`}
                description="Total unique customers"
              />
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Revenue trend */}
          <section
            aria-labelledby="revenue-chart-heading"
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6"
          >
            <h2
              id="revenue-chart-heading"
              className="font-bold text-[var(--color-text)] mb-4"
            >
              Revenue Trend
            </h2>
            {isLoading ? (
              <Skeleton className="h-56" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={analytics?.revenue.byDay ?? []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      'Revenue',
                    ]}
                    contentStyle={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--p-radius-md)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-brand)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: 'var(--color-brand)' }}
                    // WCAG 1.4.1: chart is supplementary; data table also provided
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* Top products */}
          <section
            aria-labelledby="top-products-heading"
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6"
          >
            <h2
              id="top-products-heading"
              className="font-bold text-[var(--color-text)] mb-4"
            >
              Top Products
            </h2>
            <TopProductsTable
              products={analytics?.topProducts ?? []}
              isLoading={isLoading}
            />
          </section>
        </div>

        {/* Low stock alert */}
        {lowStock && lowStock.length > 0 && (
          <section
            aria-labelledby="low-stock-heading"
            className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 rounded-[var(--p-radius-lg)] p-6"
          >
            <h2
              id="low-stock-heading"
              className="font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2"
            >
              ⚠ Low Stock Alerts ({lowStock.length} products)
            </h2>
            <ul className="space-y-2">
              {lowStock.slice(0, 5).map((product) => (
                <li
                  key={product.id}
                  className="text-sm text-amber-700 dark:text-amber-400 flex justify-between"
                >
                  <span>{product.name}</span>
                  <span className="font-bold">
                    {product.variants[0]?.quantity ?? 0} remaining
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Dashboard/components/StatCard.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Dashboard/components/StatCard.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Dashboard/components/StatCard.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Dashboard/components/StatCard.tsx
import React, { type ElementType } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@cannasaas/utils';

interface StatCardProps {
  title: string;
  value: string;
  change: number; // Percentage change from previous period
  icon: ElementType;
  description: string;
  subtitle?: string;
}

/**
 * StatCard — KPI summary card
 *
 * WCAG 1.3.3: trend is conveyed by icon + text, not color alone
 * WCAG 1.4.3: text has minimum 4.5:1 contrast ratio via token system
 */
export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  subtitle,
}: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <article
      className={[
        'bg-[var(--color-surface)] border border-[var(--color-border)]',
        'rounded-[var(--p-radius-lg)] p-5',
        'hover:shadow-[var(--p-shadow-md)] transition-shadow',
      ].join(' ')}
      aria-label={`${title}: ${value}, ${isPositive ? 'up' : 'down'} ${Math.abs(change)}% from last period`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text-secondary)] mb-1 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-[var(--p-text-3xl)] font-black text-[var(--color-text)]">
            {value}
          </p>
          {subtitle && (
            <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-[var(--p-radius-md)] bg-[var(--color-brand-subtle)] flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <Icon className="w-6 h-6 text-[var(--color-brand)]" />
        </div>
      </div>

      {/* Change indicator */}
      {change !== 0 && (
        <div className="flex items-center gap-1 mt-3">
          {isPositive ? (
            <TrendingUp
              size={14}
              className="text-[var(--color-success)]"
              aria-hidden="true"
            />
          ) : (
            <TrendingDown
              size={14}
              className="text-[var(--color-error)]"
              aria-hidden="true"
            />
          )}
          <span
            className={cn(
              'text-[var(--p-text-sm)] font-bold',
              isPositive
                ? 'text-[var(--color-success)]'
                : 'text-[var(--color-error)]',
            )}
          >
            {isPositive ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          <span className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            vs last period
          </span>
        </div>
      )}

      {/* Hidden description for assistive technology context */}
      <p className="sr-only">{description}</p>
    </article>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Products/ProductsAdminPage.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Products/ProductsAdminPage.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Products/ProductsAdminPage.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Products/ProductsAdminPage.tsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Download } from 'lucide-react';
import { useProducts, useDeleteProduct, useExportProducts } from '@cannasaas/api-client';
import { Button } from '@cannasaas/ui';
import { ProductsToolbar } from './components/ProductsToolbar';
import { ProductsTable } from './components/ProductsTable';
import { ProductFormModal } from './components/ProductFormModal';
import { InventoryAdjustModal } from './components/InventoryAdjustModal';
import type { Product } from '@cannasaas/types';
import { useSearchParams } from 'react-router-dom';

/**
 * ProductsAdminPage — Root page for the admin product catalog.
 *
 * State strategy: filter state lives in the URL (useSearchParams) so
 * that filtered views are shareable and bookmarkable, and the browser
 * back button works correctly. Modal state is local because it does not
 * need to persist across page loads.
 */
export default function ProductsAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Derive filter state from URL — preserves state across refreshes
  const filters = {
    search:   searchParams.get('search') ?? '',
    category: searchParams.get('category') ?? '',
    status:   searchParams.get('status') ?? '',
    page:     Number(searchParams.get('page') ?? '1'),
    limit:    20,
  };

  const { data, isLoading, error } = useProducts(filters);
  const { mutate: deleteProduct } = useDeleteProduct();
  const { mutate: exportProducts, isPending: isExporting } = useExportProducts();

  function handleFilterChange(key: string, value: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      value ? next.set(key, value) : next.delete(key);
      next.set('page', '1'); // Reset to page 1 on any filter change
      return next;
    });
  }

  function handleOpenCreate() {
    setEditingProduct(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(product: Product) {
    setEditingProduct(product);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingProduct(null);
  }

  function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.length} products? This cannot be undone.`)) return;
    selectedIds.forEach(id => deleteProduct(id));
    setSelectedIds([]);
  }

  return (
    <>
      <Helmet>
        <title>Products | CannaSaas Admin</title>
      </Helmet>

      <div className="space-y-5">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)]">
              Products
            </h1>
            {/* Live count announced to screen readers on filter change */}
            <p
              className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] mt-0.5"
              aria-live="polite"
              aria-atomic="true"
            >
              {data ? `${data.pagination.total} products` : 'Loading…'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={15} aria-hidden="true" />}
              isLoading={isExporting}
              loadingText="Exporting CSV…"
              onClick={() => exportProducts({ format: 'csv' })}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} aria-hidden="true" />}
              onClick={handleOpenCreate}
              aria-label="Add new product"
            >
              Add Product
            </Button>
          </div>
        </div>

        {/* Search + filter toolbar */}
        <ProductsToolbar
          filters={filters}
          onFilterChange={handleFilterChange}
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
        />

        {/* Data table */}
        <ProductsTable
          products={data?.data ?? []}
          isLoading={isLoading}
          error={error ? 'Failed to load products. Please refresh or try again.' : undefined}
          pagination={data?.pagination}
          currentPage={filters.page}
          onPageChange={page => handleFilterChange('page', String(page))}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={handleOpenEdit}
          onAdjustInventory={product => setAdjustingProduct(product)}
          onDelete={id => deleteProduct(id)}
        />
      </div>

      {/* Create / Edit modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        product={editingProduct}
        onClose={handleCloseForm}
      />

      {/* Inventory adjust modal */}
      <InventoryAdjustModal
        isOpen={!!adjustingProduct}
        product={adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
      />
    </>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Products/components/ProductsToolbar.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Products/components/ProductsToolbar.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Products/components/ProductsToolbar.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Products/components/ProductsToolbar.tsx
import React from 'react';
import { Search, Trash2 } from 'lucide-react';
import { Button } from '@cannasaas/ui';
import { cn } from '@cannasaas/utils';

interface ProductFilters {
  search: string;
  category: string;
  status: string;
  page: number;
  limit: number;
}

interface ProductsToolbarProps {
  filters: ProductFilters;
  onFilterChange: (key: string, value: string) => void;
  selectedCount: number;
  onBulkDelete: () => void;
}

/**
 * ProductsToolbar — Search field, category/status filters, and bulk action bar.
 *
 * WCAG 3.3.2: All inputs have visible, associated labels. The search
 * input uses a visually hidden label so the layout stays compact while
 * remaining fully accessible to assistive technology.
 *
 * The bulk action bar slides in when rows are selected, giving users
 * a clear affordance for mass operations without cluttering the default UI.
 */
export function ProductsToolbar({
  filters,
  onFilterChange,
  selectedCount,
  onBulkDelete,
}: ProductsToolbarProps) {
  return (
    <div className="space-y-3">
      {/* Search + filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <label htmlFor="product-search" className="sr-only">
            Search products by name or brand
          </label>
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="product-search"
            type="search"
            placeholder="Search by name or brand…"
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
            className={[
              'w-full h-9 pl-9 pr-4 rounded-[var(--p-radius-md)]',
              'border border-[var(--color-border)] bg-[var(--color-bg)]',
              'text-[var(--p-text-sm)] text-[var(--color-text)]',
              'placeholder:text-[var(--color-text-secondary)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
              'transition-[border-color] duration-[var(--p-dur-fast)]',
            ].join(' ')}
          />
        </div>

        {/* Category filter */}
        <div>
          <label htmlFor="filter-category" className="sr-only">
            Filter by category
          </label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={e => onFilterChange('category', e.target.value)}
            className={[
              'h-9 px-3 rounded-[var(--p-radius-md)]',
              'border border-[var(--color-border)] bg-[var(--color-bg)]',
              'text-[var(--p-text-sm)] text-[var(--color-text)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
            ].join(' ')}
          >
            <option value="">All Categories</option>
            <option value="flower">Flower</option>
            <option value="concentrate">Concentrate</option>
            <option value="edible">Edible</option>
            <option value="vape">Vape</option>
            <option value="tincture">Tincture</option>
            <option value="topical">Topical</option>
            <option value="accessory">Accessory</option>
          </select>
        </div>

        {/* Status filter */}
        <div>
          <label htmlFor="filter-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={e => onFilterChange('status', e.target.value)}
            className={[
              'h-9 px-3 rounded-[var(--p-radius-md)]',
              'border border-[var(--color-border)] bg-[var(--color-bg)]',
              'text-[var(--p-text-sm)] text-[var(--color-text)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
            ].join(' ')}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Bulk action bar — only rendered when rows are selected */}
      {selectedCount > 0 && (
        <div
          role="status"
          aria-live="polite"
          className={[
            'flex items-center justify-between',
            'px-4 py-2.5 rounded-[var(--p-radius-md)]',
            'bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]',
          ].join(' ')}
        >
          <span className="text-[var(--p-text-sm)] font-semibold text-[var(--color-brand)]">
            {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="danger"
            size="xs"
            leftIcon={<Trash2 size={13} aria-hidden="true" />}
            onClick={onBulkDelete}
            aria-label={`Delete ${selectedCount} selected products`}
          >
            Delete Selected
          </Button>
        </div>
      )}
    </div>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Products/components/ProductsTable.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Products/components/ProductsTable.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Products/components/ProductsTable.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Products/components/ProductsTable.tsx
import React from 'react';
import { Edit2, SlidersHorizontal, Trash2, MoreHorizontal } from 'lucide-react';
import { Button, Skeleton } from '@cannasaas/ui';
import { StrainTypeBadge } from '@cannasaas/ui';
import { formatCurrency } from '@cannasaas/utils';
import { cn } from '@cannasaas/utils';
import type { Product, PaginationMeta } from '@cannasaas/types';

interface ProductsTableProps {
  products: Product[];
  isLoading: boolean;
  error?: string;
  pagination?: PaginationMeta;
  currentPage: number;
  onPageChange: (page: number) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (product: Product) => void;
  onAdjustInventory: (product: Product) => void;
  onDelete: (id: string) => void;
}

/**
 * ProductsTable — Accessible data table for the admin product catalog.
 *
 * WCAG 1.3.1: Uses semantic <table> with <caption>, <th scope>, <thead>,
 *             and <tbody> — never a CSS grid pretending to be a table.
 * WCAG 2.1.1: Sort and selection controls are real <button> elements.
 * WCAG 4.1.2: aria-sort on <th> communicates sort state to screen readers.
 * WCAG 4.1.3: Selection count changes are announced via aria-live.
 *
 * Responsive: The table wraps in a scrollable region at narrow viewports.
 * The region itself is keyboard-focusable (tabIndex={0}) so keyboard users
 * can access the full scroll area — WCAG 2.1.1.
 */
export function ProductsTable({
  products,
  isLoading,
  error,
  pagination,
  currentPage,
  onPageChange,
  selectedIds,
  onSelectionChange,
  onEdit,
  onAdjustInventory,
  onDelete,
}: ProductsTableProps) {
  const allSelected = selectedIds.length === products.length && products.length > 0;
  const someSelected = selectedIds.length > 0 && !allSelected;

  function toggleSelectAll() {
    onSelectionChange(allSelected ? [] : products.map(p => p.id));
  }

  function toggleSelectRow(id: string) {
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter(s => s !== id)
        : [...selectedIds, id],
    );
  }

  function getStockStatus(quantity: number): { label: string; className: string } {
    if (quantity === 0) return { label: 'Out of Stock', className: 'text-[var(--color-error)] bg-red-50 dark:bg-red-950/20' };
    if (quantity <= 5)  return { label: 'Low Stock',    className: 'text-[var(--color-warning)] bg-amber-50 dark:bg-amber-950/20' };
    return                     { label: 'In Stock',     className: 'text-[var(--color-success)] bg-green-50 dark:bg-green-950/20' };
  }

  // ── ERROR STATE ──────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-[var(--p-radius-lg)] border border-[var(--color-error)] bg-red-50 dark:bg-red-950/20 p-6 text-center"
      >
        <p className="text-[var(--color-error)] font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Scrollable table wrapper — WCAG 2.1.1: tabIndex makes it keyboard-reachable */}
      <div
        className="overflow-x-auto rounded-[var(--p-radius-lg)] border border-[var(--color-border)]"
        role="region"
        aria-label="Product catalog table"
        tabIndex={0}
      >
        <table className="w-full text-[var(--p-text-sm)] border-collapse">
          <caption className="sr-only">
            Product catalog.{pagination ? ` Page ${currentPage} of ${pagination.totalPages}, showing ${products.length} of ${pagination.total} products.` : ''}
          </caption>

          <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
            <tr>
              {/* Select-all checkbox */}
              <th scope="col" className="w-12 px-4 py-3">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  aria-label={allSelected ? 'Deselect all products' : 'Select all products on this page'}
                  aria-pressed={allSelected}
                  className="flex items-center justify-center w-5 h-5 rounded border-2 border-[var(--color-border-strong)] text-[var(--color-brand)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                >
                  {allSelected && <span aria-hidden="true" className="text-xs leading-none">✓</span>}
                  {someSelected && <span aria-hidden="true" className="text-xs leading-none">—</span>}
                </button>
              </th>

              <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">
                Product
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">
                Category
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">
                THC
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">
                Price
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">
                Stock
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">
                Status
              </th>
              {/* Actions column — no visible label, described by sr-only */}
              <th scope="col" className="w-24 px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody
            className="divide-y divide-[var(--color-border)]"
            aria-busy={isLoading}
          >
            {isLoading
              ? // Skeleton rows shown while data loads
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-10 bg-[var(--color-bg-tertiary)] rounded animate-pulse" aria-hidden="true" />
                    </td>
                  </tr>
                ))
              : products.length === 0
              ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-[var(--color-text-secondary)]"
                  >
                    <p className="font-medium">No products found.</p>
                    <p className="text-[var(--p-text-xs)] mt-1">
                      Try adjusting your search or filter criteria.
                    </p>
                  </td>
                </tr>
              )
              : products.map(product => {
                  const primaryVariant = product.variants[0];
                  const totalStock = product.variants.reduce((sum, v) => sum + v.quantity, 0);
                  const stockStatus = getStockStatus(totalStock);
                  const isSelected = selectedIds.includes(product.id);

                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        'bg-[var(--color-bg)] transition-colors duration-[var(--p-dur-fast)]',
                        'hover:bg-[var(--color-bg-secondary)]',
                        isSelected && 'bg-[var(--color-brand-subtle)]',
                      )}
                    >
                      {/* Row checkbox */}
                      <td className="w-12 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(product.id)}
                          aria-label={`${isSelected ? 'Deselect' : 'Select'} ${product.name}`}
                          aria-pressed={isSelected}
                          className="flex items-center justify-center w-5 h-5 rounded border-2 border-[var(--color-border-strong)] text-[var(--color-brand)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                        >
                          {isSelected && <span aria-hidden="true" className="text-xs leading-none">✓</span>}
                        </button>
                      </td>

                      {/* Product name + brand + thumbnail */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images[0] ? (
                            <img
                              src={product.images[0].url}
                              alt=""  // Decorative — product name in adjacent cell provides context
                              aria-hidden="true"
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-[var(--p-radius-sm)] object-cover flex-shrink-0 bg-[var(--color-bg-tertiary)]"
                            />
                          ) : (
                            <div
                              aria-hidden="true"
                              className="h-10 w-10 rounded-[var(--p-radius-sm)] bg-[var(--color-bg-tertiary)] flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--color-text)] truncate">
                              {product.name}
                            </p>
                            <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] truncate">
                              {product.brand}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category + optional strain badge */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="capitalize text-[var(--color-text)]">
                            {product.category}
                          </span>
                          {product.strainType && (
                            <StrainTypeBadge strainType={product.strainType} size="sm" />
                          )}
                        </div>
                      </td>

                      {/* THC content — WCAG 1.4.1: value conveyed in text, not color only */}
                      <td className="px-4 py-3">
                        {product.thcContent != null ? (
                          <span
                            className="font-medium text-[var(--color-text)]"
                            aria-label={`THC: ${product.thcContent}%`}
                          >
                            {product.thcContent}%
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-secondary)]" aria-label="THC: not applicable">
                            —
                          </span>
                        )}
                      </td>

                      {/* Starting price from primary variant */}
                      <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                        {primaryVariant
                          ? formatCurrency(primaryVariant.price)
                          : <span className="text-[var(--color-text-secondary)]">—</span>
                        }
                        {product.variants.length > 1 && (
                          <span className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] ml-1">
                            +{product.variants.length - 1} more
                          </span>
                        )}
                      </td>

                      {/* Stock quantity + status badge */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-[var(--color-text)]">
                            {totalStock} units
                          </span>
                          <span
                            className={cn(
                              'text-[var(--p-text-xs)] font-semibold px-2 py-0.5 rounded-full w-fit',
                              stockStatus.className,
                            )}
                            // WCAG 1.4.1: status is conveyed by text label + color together
                            aria-label={`Stock status: ${stockStatus.label}`}
                          >
                            {stockStatus.label}
                          </span>
                        </div>
                      </td>

                      {/* Active / Inactive badge */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'text-[var(--p-text-xs)] font-semibold px-2.5 py-1 rounded-full',
                            product.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'
                              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
                          )}
                          aria-label={product.isActive ? 'Status: Active' : 'Status: Inactive'}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Row actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => onEdit(product)}
                            aria-label={`Edit ${product.name}`}
                            className="p-1.5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                          >
                            <Edit2 size={15} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onAdjustInventory(product)}
                            aria-label={`Adjust inventory for ${product.name}`}
                            className="p-1.5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                          >
                            <SlidersHorizontal size={15} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
                                onDelete(product.id);
                              }
                            }}
                            aria-label={`Delete ${product.name}`}
                            className="p-1.5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-error)] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <nav
          aria-label="Product list pagination"
          className="flex items-center justify-between"
        >
          <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
            Page {currentPage} of {pagination.totalPages} &middot; {pagination.total} products
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Go to previous page"
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Go to next page"
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Products/components/ProductFormModal.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Products/components/ProductFormModal.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Products/components/ProductFormModal.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Products/components/ProductFormModal.tsx
import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@cannasaas/ui';
import { useCreateProduct, useUpdateProduct } from '@cannasaas/api-client';
import { useFocusTrap } from '@cannasaas/ui';
import type { Product } from '@cannasaas/types';

// ── VALIDATION SCHEMA ──────────────────────────────────────────────────────
const productSchema = z.object({
  name:        z.string().min(2, 'Product name must be at least 2 characters'),
  brand:       z.string().min(1, 'Brand is required'),
  category:    z.enum(['flower', 'concentrate', 'edible', 'vape', 'tincture', 'topical', 'accessory'], {
                 errorMap: () => ({ message: 'Please select a category' }),
               }),
  strainType:  z.enum(['sativa', 'indica', 'hybrid', 'sativa_dominant_hybrid', 'indica_dominant_hybrid', 'cbd_dominant']).optional(),
  thcContent:  z.number({ invalid_type_error: 'Must be a number' }).min(0).max(100).optional(),
  cbdContent:  z.number({ invalid_type_error: 'Must be a number' }).min(0).max(100).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price:       z.number({ invalid_type_error: 'Must be a number' }).positive('Price must be greater than $0'),
  sku:         z.string().min(1, 'SKU is required'),
  quantity:    z.number({ invalid_type_error: 'Must be a whole number' }).int().min(0, 'Quantity cannot be negative'),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  product: Product | null; // null = create mode, Product = edit mode
  onClose: () => void;
}

/**
 * ProductFormModal — Create / Edit product dialog.
 *
 * Uses react-hook-form + zod for validation. All fields are validated
 * client-side before submission; server-side errors are surfaced in a
 * live region at the top of the form.
 *
 * WCAG 2.1.2: Focus is trapped within the dialog while open.
 * WCAG 3.3.1: Every validation error is associated with its input
 *             via aria-describedby pointing to a role="alert" element.
 * WCAG 3.3.2: All inputs have a visible <label>; required fields are
 *             marked visually (*) and with aria-required="true".
 * WCAG 4.1.3: The error summary at the top is in an aria-live="assertive"
 *             region so screen readers announce it on submission failure.
 */
export function ProductFormModal({ isOpen, product, onClose }: ProductFormModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingId = React.useId();
  const isEditing = !!product;

  useFocusTrap(containerRef, isOpen, onClose);

  const { mutate: createProduct, isPending: isCreating, error: createError } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating, error: updateError } = useUpdateProduct();
  const isPending = isCreating || isUpdating;
  const serverError = createError ?? updateError;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name:        product.name,
          brand:       product.brand,
          category:    product.category as ProductFormValues['category'],
          strainType:  product.strainType as ProductFormValues['strainType'],
          thcContent:  product.thcContent ?? undefined,
          cbdContent:  product.cbdContent ?? undefined,
          description: product.description,
          price:       product.variants[0]?.price,
          sku:         product.variants[0]?.sku,
          quantity:    product.variants[0]?.quantity,
        }
      : {},
  });

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const errorCount = Object.keys(errors).length;

  function onSubmit(values: ProductFormValues) {
    if (isEditing) {
      updateProduct({ id: product!.id, ...values }, { onSuccess: onClose });
    } else {
      createProduct(values as any, { onSuccess: onClose });
    }
  }

  if (!isOpen) return null;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={[
          'w-full max-w-2xl max-h-[90vh] overflow-y-auto',
          'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
          'border border-[var(--color-border)]',
          'shadow-[var(--p-shadow-xl)]',
        ].join(' ')}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] z-10">
          <h2 id={headingId} className="text-[var(--p-text-lg)] font-bold text-[var(--color-text)]">
            {isEditing ? `Edit: ${product!.name}` : 'Add New Product'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Error summary — WCAG 3.3.1 + 4.1.3 */}
        {isSubmitted && errorCount > 0 && (
          <div
            role="alert"
            aria-live="assertive"
            className="mx-6 mt-4 p-3 rounded-[var(--p-radius-md)] bg-red-50 dark:bg-red-950/20 border border-[var(--color-error)]"
          >
            <p className="text-[var(--p-text-sm)] font-semibold text-[var(--color-error)]">
              Please fix {errorCount} error{errorCount !== 1 ? 's' : ''} before saving:
            </p>
            <ul className="mt-1.5 ml-4 list-disc text-[var(--p-text-sm)] text-[var(--color-error)] space-y-0.5">
              {Object.entries(errors).map(([field, err]) => (
                <li key={field}>
                  {/* Clicking a summary item focuses the offending input */}
                  <button
                    type="button"
                    className="underline hover:no-underline text-left"
                    onClick={() => document.getElementById(field)?.focus()}
                  >
                    {err?.message}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Server error */}
        {serverError && (
          <div role="alert" className="mx-6 mt-4 p-3 rounded-[var(--p-radius-md)] bg-red-50 dark:bg-red-950/20 border border-[var(--color-error)]">
            <p className="text-[var(--p-text-sm)] text-[var(--color-error)]">
              Server error: {(serverError as any)?.message ?? 'Something went wrong. Please try again.'}
            </p>
          </div>
        )}

        {/* Form body */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-6 pb-6 pt-5 space-y-5">

          {/* Row 1: Name + Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="name" label="Product Name" required error={errors.name?.message}>
              <input
                id="name"
                type="text"
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className={inputClass(!!errors.name)}
                {...register('name')}
              />
            </FormField>

            <FormField id="brand" label="Brand" required error={errors.brand?.message}>
              <input
                id="brand"
                type="text"
                aria-required="true"
                aria-invalid={!!errors.brand}
                aria-describedby={errors.brand ? 'brand-error' : undefined}
                className={inputClass(!!errors.brand)}
                {...register('brand')}
              />
            </FormField>
          </div>

          {/* Row 2: Category + Strain Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="category" label="Category" required error={errors.category?.message}>
              <select
                id="category"
                aria-required="true"
                aria-invalid={!!errors.category}
                aria-describedby={errors.category ? 'category-error' : undefined}
                className={inputClass(!!errors.category)}
                {...register('category')}
              >
                <option value="">Select a category…</option>
                <option value="flower">Flower</option>
                <option value="concentrate">Concentrate</option>
                <option value="edible">Edible</option>
                <option value="vape">Vape</option>
                <option value="tincture">Tincture</option>
                <option value="topical">Topical</option>
                <option value="accessory">Accessory</option>
              </select>
            </FormField>

            <FormField id="strainType" label="Strain Type" hint="Leave blank for non-cannabis products">
              <select
                id="strainType"
                className={inputClass(false)}
                {...register('strainType')}
              >
                <option value="">Not applicable</option>
                <option value="sativa">Sativa</option>
                <option value="indica">Indica</option>
                <option value="hybrid">Hybrid</option>
                <option value="sativa_dominant_hybrid">Sativa-Dominant Hybrid</option>
                <option value="indica_dominant_hybrid">Indica-Dominant Hybrid</option>
                <option value="cbd_dominant">CBD Dominant</option>
              </select>
            </FormField>
          </div>

          {/* Row 3: THC + CBD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="thcContent" label="THC Content (%)" hint="0–100. Leave blank if not applicable." error={errors.thcContent?.message}>
              <input
                id="thcContent"
                type="number"
                min={0} max={100} step={0.1}
                aria-invalid={!!errors.thcContent}
                aria-describedby={errors.thcContent ? 'thcContent-error' : 'thcContent-hint'}
                className={inputClass(!!errors.thcContent)}
                {...register('thcContent', { valueAsNumber: true })}
              />
            </FormField>

            <FormField id="cbdContent" label="CBD Content (%)" hint="0–100. Leave blank if not applicable." error={errors.cbdContent?.message}>
              <input
                id="cbdContent"
                type="number"
                min={0} max={100} step={0.1}
                aria-invalid={!!errors.cbdContent}
                aria-describedby={errors.cbdContent ? 'cbdContent-error' : 'cbdContent-hint'}
                className={inputClass(!!errors.cbdContent)}
                {...register('cbdContent', { valueAsNumber: true })}
              />
            </FormField>
          </div>

          {/* Description */}
          <FormField id="description" label="Description" required error={errors.description?.message}>
            <textarea
              id="description"
              rows={4}
              aria-required="true"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
              placeholder="Describe this product — effects, flavor profile, recommended use cases…"
              className={[inputClass(!!errors.description), 'resize-y min-h-[96px]'].join(' ')}
              {...register('description')}
            />
          </FormField>

          {/* Inventory & Pricing fieldset */}
          <fieldset className="border border-[var(--color-border)] rounded-[var(--p-radius-md)] px-4 pb-4 pt-3">
            <legend className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] px-1">
              Inventory &amp; Pricing
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              <FormField id="price" label="Price" required error={errors.price?.message}>
                <div className="relative">
                  <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] text-[var(--p-text-sm)]">$</span>
                  <input
                    id="price"
                    type="number"
                    min={0} step={0.01}
                    aria-required="true"
                    aria-invalid={!!errors.price}
                    aria-describedby={errors.price ? 'price-error' : undefined}
                    aria-label="Price in dollars"
                    className={[inputClass(!!errors.price), 'pl-7'].join(' ')}
                    {...register('price', { valueAsNumber: true })}
                  />
                </div>
              </FormField>

              <FormField id="sku" label="SKU" required error={errors.sku?.message}>
                <input
                  id="sku"
                  type="text"
                  aria-required="true"
                  aria-invalid={!!errors.sku}
                  aria-describedby={errors.sku ? 'sku-error' : undefined}
                  className={inputClass(!!errors.sku)}
                  {...register('sku')}
                />
              </FormField>

              <FormField id="quantity" label="Qty in Stock" required error={errors.quantity?.message}>
                <input
                  id="quantity"
                  type="number"
                  min={0}
                  aria-required="true"
                  aria-invalid={!!errors.quantity}
                  aria-describedby={errors.quantity ? 'quantity-error' : undefined}
                  className={inputClass(!!errors.quantity)}
                  {...register('quantity', { valueAsNumber: true })}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Modal footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
              loadingText={isEditing ? 'Saving…' : 'Creating…'}
            >
              {isEditing ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── SHARED HELPERS ──────────────────────────────────────────────────────────

/** Returns Tailwind classes for a form input, toggling error state styles. */
function inputClass(hasError: boolean): string {
  return [
    'w-full h-9 px-3 rounded-[var(--p-radius-md)] text-[var(--p-text-sm)]',
    'bg-[var(--color-bg)] text-[var(--color-text)]',
    'border transition-[border-color] duration-[var(--p-dur-fast)]',
    'placeholder:text-[var(--color-text-secondary)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
    hasError
      ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
      : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
  ].join(' ');
}

/** Wrapper that renders a label, child input, optional hint, and error message. */
function FormField({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-[var(--color-error)]">*</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[var(--p-text-xs)] text-[var(--color-error)] flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Products/components/InventoryAdjustModal.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Products/components/InventoryAdjustModal.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Products/components/InventoryAdjustModal.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Products/components/InventoryAdjustModal.tsx
import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@cannasaas/ui';
import { useUpdateInventory } from '@cannasaas/api-client';
import { useFocusTrap } from '@cannasaas/ui';
import { formatWeight } from '@cannasaas/utils';
import type { Product } from '@cannasaas/types';

const adjustSchema = z.object({
  variantId:   z.string().min(1, 'Please select a variant'),
  newQuantity: z.number({ invalid_type_error: 'Must be a whole number' }).int().min(0, 'Quantity cannot be negative'),
  reason:      z.enum(['received', 'damage', 'theft', 'audit_correction', 'destruction', 'other'], {
                 errorMap: () => ({ message: 'Please select a reason' }),
               }),
  notes:       z.string().max(500).optional(),
});

type AdjustFormValues = z.infer<typeof adjustSchema>;

interface InventoryAdjustModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

/**
 * InventoryAdjustModal — Adjusts stock for a specific product variant.
 *
 * Every adjustment is logged to the compliance_logs table with the reason
 * code and the user who performed it, satisfying the state audit trail
 * requirement for inventory changes per the compliance guide.
 *
 * The new quantity field shows the delta against current stock in real
 * time so managers can see the impact before confirming.
 */
export function InventoryAdjustModal({ isOpen, product, onClose }: InventoryAdjustModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingId = React.useId();
  useFocusTrap(containerRef, isOpen, onClose);

  const { mutate: updateInventory, isPending } = useUpdateInventory();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      variantId: product?.variants[0]?.id ?? '',
    },
  });

  const watchedVariantId  = watch('variantId');
  const watchedNewQty     = watch('newQuantity');
  const selectedVariant   = product?.variants.find(v => v.id === watchedVariantId);
  const currentQty        = selectedVariant?.quantity ?? 0;
  const delta             = typeof watchedNewQty === 'number' ? watchedNewQty - currentQty : null;

  function onSubmit(values: AdjustFormValues) {
    updateInventory({ variantId: values.variantId, quantity: values.newQuantity, reason: values.reason, notes: values.notes }, { onSuccess: onClose });
  }

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={[
          'w-full max-w-md',
          'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
          'border border-[var(--color-border)] shadow-[var(--p-shadow-xl)]',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 id={headingId} className="text-[var(--p-text-lg)] font-bold text-[var(--color-text)]">
            Adjust Inventory
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-6 py-5 space-y-5">
          <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
            Adjusting inventory for: <span className="font-semibold text-[var(--color-text)]">{product.name}</span>
          </p>

          {/* Variant selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="variantId" className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
              Variant <span aria-hidden="true" className="text-[var(--color-error)]">*</span>
            </label>
            <select
              id="variantId"
              aria-required="true"
              aria-invalid={!!errors.variantId}
              className={[
                'h-9 px-3 rounded-[var(--p-radius-md)] text-[var(--p-text-sm)]',
                'border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
              ].join(' ')}
              {...register('variantId')}
            >
              {product.variants.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} — {formatWeight(v.weight, v.weightUnit)} · {v.quantity} in stock · SKU {v.sku}
                </option>
              ))}
            </select>
            {errors.variantId && (
              <p role="alert" className="text-[var(--p-text-xs)] text-[var(--color-error)]">
                {errors.variantId.message}
              </p>
            )}
          </div>

          {/* New quantity input with live delta indicator */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="newQuantity" className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
              New Quantity <span aria-hidden="true" className="text-[var(--color-error)]">*</span>
            </label>
            <input
              id="newQuantity"
              type="number"
              min={0}
              aria-required="true"
              aria-invalid={!!errors.newQuantity}
              aria-describedby="newQuantity-delta"
              className={[
                'h-9 px-3 rounded-[var(--p-radius-md)] text-[var(--p-text-sm)]',
                'border bg-[var(--color-bg)] text-[var(--color-text)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                errors.newQuantity ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]',
              ].join(' ')}
              {...register('newQuantity', { valueAsNumber: true })}
            />
            {/* Live delta indicator — announced via aria-live */}
            <p
              id="newQuantity-delta"
              aria-live="polite"
              aria-atomic="true"
              className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]"
            >
              Current stock: {currentQty} units.
              {delta !== null && delta !== 0 && (
                <span className={delta > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}>
                  {' '}{delta > 0 ? `+${delta}` : delta} units
                </span>
              )}
            </p>
            {errors.newQuantity && (
              <p role="alert" className="text-[var(--p-text-xs)] text-[var(--color-error)]">
                {errors.newQuantity.message}
              </p>
            )}
          </div>

          {/* Reason code — required for compliance audit trail */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reason" className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
              Reason <span aria-hidden="true" className="text-[var(--color-error)]">*</span>
            </label>
            <select
              id="reason"
              aria-required="true"
              aria-invalid={!!errors.reason}
              className={[
                'h-9 px-3 rounded-[var(--p-radius-md)] text-[var(--p-text-sm)]',
                'border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
              ].join(' ')}
              {...register('reason')}
            >
              <option value="">Select a reason…</option>
              <option value="received">Inventory received from supplier</option>
              <option value="damage">Product damage or spoilage</option>
              <option value="theft">Theft or unexplained loss</option>
              <option value="audit_correction">Audit correction</option>
              <option value="destruction">Regulatory destruction</option>
              <option value="other">Other (add notes below)</option>
            </select>
            {errors.reason && (
              <p role="alert" className="text-[var(--p-text-xs)] text-[var(--color-error)]">
                {errors.reason.message}
              </p>
            )}
          </div>

          {/* Optional notes */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
              Notes <span className="text-[var(--color-text-secondary)] font-normal">(optional)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={500}
              placeholder="Additional context for this adjustment…"
              className={[
                'w-full px-3 py-2 rounded-[var(--p-radius-md)] text-[var(--p-text-sm)]',
                'border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]',
                'placeholder:text-[var(--color-text-secondary)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                'resize-y',
              ].join(' ')}
              {...register('notes')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1 border-t border-[var(--color-border)]">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending} loadingText="Saving adjustment…">
              Save Adjustment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Orders/OrdersAdminPage.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Orders/OrdersAdminPage.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Orders/OrdersAdminPage.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Orders/OrdersAdminPage.tsx
import React, { useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrders } from '@cannasaas/api-client';
import { formatCurrency, formatDate } from '@cannasaas/utils';
import { OrderStatusBadge } from './components/OrderStatusBadge';
import type { Order, OrderStatus } from '@cannasaas/types';

// All statuses surfaced in the admin view — including terminal states
const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All',           value: 'all' },
  { label: 'Pending',       value: 'pending' },
  { label: 'Confirmed',     value: 'confirmed' },
  { label: 'Preparing',     value: 'preparing' },
  { label: 'Ready',         value: 'ready_for_pickup' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Completed',     value: 'completed' },
  { label: 'Cancelled',     value: 'cancelled' },
  { label: 'Refunded',      value: 'refunded' },
];

/**
 * OrdersAdminPage — Filterable, paginated order list.
 *
 * Status filter lives in the URL (via useSearchParams) so that navigating
 * to Order Detail and pressing Back returns the user to the same filtered
 * view. The tab list implements the ARIA tab pattern with keyboard navigation
 * so screen reader users can navigate between status filters efficiently.
 */
export default function OrdersAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeStatus = (searchParams.get('status') ?? 'all') as OrderStatus | 'all';
  const currentPage  = Number(searchParams.get('page') ?? '1');

  const { data, isLoading } = useOrders({
    status: activeStatus === 'all' ? undefined : [activeStatus],
    page: currentPage,
    limit: 25,
    sort: 'createdAt_desc',
    // Poll every 60s — WebSocket provides faster updates when available
    refetchInterval: 1000 * 60,
  });

  const handleTabChange = useCallback((status: OrderStatus | 'all') => {
    setSearchParams({ status, page: '1' });
  }, [setSearchParams]);

  function handleKeyDown(e: React.KeyboardEvent, currentIndex: number) {
    // Arrow key navigation per ARIA APG tablist pattern
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % STATUS_TABS.length;
    if (e.key === 'ArrowLeft')  nextIndex = (currentIndex - 1 + STATUS_TABS.length) % STATUS_TABS.length;
    if (e.key === 'Home')       nextIndex = 0;
    if (e.key === 'End')        nextIndex = STATUS_TABS.length - 1;

    if (nextIndex !== currentIndex) {
      e.preventDefault();
      handleTabChange(STATUS_TABS[nextIndex].value);
      // Move DOM focus to the newly active tab
      (document.querySelector(`[data-tab="${STATUS_TABS[nextIndex].value}"]`) as HTMLElement)?.focus();
    }
  }

  const orders = data?.data ?? [];

  return (
    <>
      <Helmet>
        <title>Orders | CannaSaas Admin</title>
      </Helmet>

      <div className="space-y-5">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)]">
            Orders
          </h1>
          <p
            className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]"
            aria-live="polite"
            aria-atomic="true"
          >
            {data ? `${data.pagination.total} orders` : 'Loading…'}
          </p>
        </div>

        {/* Status tabs — ARIA tablist pattern */}
        <div
          role="tablist"
          aria-label="Filter orders by status"
          className="flex gap-1 flex-wrap border-b border-[var(--color-border)]"
        >
          {STATUS_TABS.map((tab, idx) => {
            const isActive = activeStatus === tab.value;
            return (
              <button
                key={tab.value}
                role="tab"
                data-tab={tab.value}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabChange(tab.value)}
                onKeyDown={e => handleKeyDown(e, idx)}
                className={[
                  'px-3 py-2 text-[var(--p-text-sm)] font-medium rounded-t-[var(--p-radius-sm)]',
                  'border-b-2 -mb-px whitespace-nowrap transition-colors duration-[var(--p-dur-fast)]',
                  'focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]',
                  isActive
                    ? 'border-b-[var(--color-brand)] text-[var(--color-brand)]'
                    : 'border-b-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-b-[var(--color-border-strong)]',
                ].join(' ')}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Order table */}
        <div
          className="overflow-x-auto rounded-[var(--p-radius-lg)] border border-[var(--color-border)]"
          role="region"
          aria-label="Order list"
          tabIndex={0}
        >
          <table className="w-full text-[var(--p-text-sm)] border-collapse">
            <caption className="sr-only">
              Orders filtered by status: {activeStatus}. {data ? `${data.pagination.total} orders total.` : ''}
            </caption>
            <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Order #</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Customer</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Type</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-[var(--color-text-secondary)]">Total</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Placed</th>
                <th scope="col" className="w-20 px-4 py-3"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody
              className="divide-y divide-[var(--color-border)]"
              aria-busy={isLoading}
            >
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-8 bg-[var(--color-bg-tertiary)] rounded animate-pulse" aria-hidden="true" />
                      </td>
                    </tr>
                  ))
                : orders.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-[var(--color-text-secondary)]">
                      No orders found for this status.
                    </td>
                  </tr>
                )
                : orders.map(order => (
                    <tr
                      key={order.id}
                      className="bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--p-dur-fast)] cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-[var(--color-text)]">
                        #{order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text)]">{order.customerName}</td>
                      <td className="px-4 py-3 text-[var(--color-text)] capitalize">{order.type}</td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[var(--color-text)]">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                        <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {/* The entire row is clickable; this is an additional keyboard affordance */}
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}
                          aria-label={`View order #${order.orderNumber}`}
                          className="text-[var(--color-brand)] text-[var(--p-text-xs)] font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <nav aria-label="Orders pagination" className="flex items-center justify-between">
            <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
              Page {currentPage} of {data.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setSearchParams({ status: activeStatus, page: String(currentPage - 1) })}
                aria-label="Previous page"
                className="px-3 py-1.5 rounded-[var(--p-radius-md)] text-[var(--p-text-sm)] border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= data.pagination.totalPages}
                onClick={() => setSearchParams({ status: activeStatus, page: String(currentPage + 1) })}
                aria-label="Next page"
                className="px-3 py-1.5 rounded-[var(--p-radius-md)] text-[var(--p-text-sm)] border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </div>
    </>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Orders/components/OrderStatusBadge.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Orders/components/OrderStatusBadge.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Orders/components/OrderStatusBadge.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Orders/components/OrderStatusBadge.tsx
import React from 'react';
import { cn } from '@cannasaas/utils';
import type { OrderStatus } from '@cannasaas/types';

// WCAG 1.4.1: every badge conveys status via text label AND color
const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending:          { label: 'Pending',          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400' },
  confirmed:        { label: 'Confirmed',        className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400' },
  preparing:        { label: 'Preparing',        className: 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400' },
  ready_for_pickup: { label: 'Ready',            className: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400' },
  out_for_delivery: { label: 'Out for Delivery', className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400' },
  delivered:        { label: 'Delivered',        className: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400' },
  completed:        { label: 'Completed',        className: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]' },
  cancelled:        { label: 'Cancelled',        className: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400' },
  refunded:         { label: 'Refunded',         className: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={cn('px-2.5 py-1 text-[var(--p-text-xs)] font-semibold rounded-full whitespace-nowrap', className)}
      aria-label={`Order status: ${label}`}
    >
      {label}
    </span>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Orders/OrderDetailPage.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Orders/OrderDetailPage.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Orders/OrderDetailPage.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Orders/OrderDetailPage.tsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useOrder, useUpdateOrderStatus } from '@cannasaas/api-client';
import { Button, Skeleton } from '@cannasaas/ui';
import { formatCurrency, formatDate, formatRelativeTime } from '@cannasaas/utils';
import { OrderStatusBadge } from './components/OrderStatusBadge';
import { OrderTimeline } from './components/OrderTimeline';
import { RefundModal } from './components/RefundModal';
import type { OrderStatus } from '@cannasaas/types';

// Valid forward transitions from each status — enforces the state machine
// defined in the API reference order status lifecycle:
//   pending → confirmed → preparing → ready_for_pickup → completed
//                      → out_for_delivery → delivered → completed
//   pending → cancelled
//   completed → refunded (via RefundModal, not here)
const NEXT_TRANSITIONS: Partial<Record<OrderStatus, { label: string; status: OrderStatus }[]>> = {
  pending:          [{ label: 'Confirm Order',    status: 'confirmed' },  { label: 'Cancel Order', status: 'cancelled' }],
  confirmed:        [{ label: 'Start Preparing',  status: 'preparing' },  { label: 'Cancel Order', status: 'cancelled' }],
  preparing:        [{ label: 'Mark Ready',       status: 'ready_for_pickup' }],
  ready_for_pickup: [{ label: 'Mark Completed',   status: 'completed' }],
  // Delivery path: out_for_delivery → delivered (driver confirms drop-off) → completed
  out_for_delivery: [{ label: 'Mark Delivered',   status: 'delivered' }],
  delivered:        [{ label: 'Mark Completed',   status: 'completed' }],
};

/**
 * OrderDetailPage — Full order view for admin and manager roles.
 *
 * Surfaces: order items, pricing breakdown, customer info, delivery/pickup
 * details, payment method, order timeline, status transitions, and refund.
 *
 * WCAG 2.4.2: Page title includes the order number for screen reader navigation.
 * WCAG 1.3.1: All information groups use <section> with aria-labelledby headings
 *             so AT users can jump between sections using landmark navigation.
 */
export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [isRefundOpen, setIsRefundOpen] = useState(false);

  const { data: order, isLoading, error } = useOrder(orderId!);
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateOrderStatus();

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading order details…">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-[var(--p-radius-lg)]" />
        <Skeleton className="h-48 rounded-[var(--p-radius-lg)]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div role="alert" className="p-6 rounded-[var(--p-radius-lg)] border border-[var(--color-error)] bg-red-50 dark:bg-red-950/20">
        <p className="text-[var(--color-error)] font-semibold">Order not found or failed to load.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-3 text-[var(--p-text-sm)] text-[var(--color-brand)] underline hover:no-underline"
        >
          Go back to orders
        </button>
      </div>
    );
  }

  const transitions = NEXT_TRANSITIONS[order.status] ?? [];
  const canRefund = order.status === 'completed' && order.paymentStatus === 'paid';

  return (
    <>
      <Helmet>
        <title>Order #{order.orderNumber} | CannaSaas Admin</title>
      </Helmet>

      <div className="space-y-6 max-w-4xl">
        {/* Back nav + page header */}
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[var(--p-text-sm)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-4 transition-colors"
            aria-label="Go back to orders list"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Orders
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)]">
                Order #{order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>

            {/* Status transition buttons */}
            {transitions.length > 0 && (
              <div className="flex gap-2 flex-wrap" role="group" aria-label="Order status actions">
                {transitions.map(t => (
                  <Button
                    key={t.status}
                    variant={t.status === 'cancelled' ? 'danger' : 'primary'}
                    size="sm"
                    isLoading={isUpdatingStatus}
                    loadingText={`Updating to ${t.label}…`}
                    onClick={() => updateStatus({ orderId: order.id, status: t.status })}
                    aria-label={`${t.label} — change status from ${order.status} to ${t.status}`}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Refund button — only available on completed paid orders */}
            {canRefund && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCw size={14} aria-hidden="true" />}
                onClick={() => setIsRefundOpen(true)}
                aria-label={`Issue refund for order #${order.orderNumber}`}
              >
                Refund
              </Button>
            )}
          </div>

          <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] mt-1.5">
            Placed <time dateTime={order.createdAt}>{formatRelativeTime(order.createdAt)}</time>
            {' · '}{order.type === 'pickup' ? 'In-store pickup' : 'Delivery'}
          </p>
        </div>

        {/* Main grid: items + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left / main: order items */}
          <div className="lg:col-span-2 space-y-5">

            {/* Items section */}
            <section
              aria-labelledby="items-heading"
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] overflow-hidden"
            >
              <h2
                id="items-heading"
                className="px-5 py-4 font-bold text-[var(--color-text)] border-b border-[var(--color-border)]"
              >
                Items ({order.items.length})
              </h2>

              <ul aria-label="Order items" className="divide-y divide-[var(--color-border)]">
                {order.items.map(item => (
                  <li key={item.id} className="flex items-start gap-4 px-5 py-4">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt=""
                        aria-hidden="true"
                        width={52}
                        height={52}
                        className="h-13 w-13 rounded-[var(--p-radius-sm)] object-cover flex-shrink-0 bg-[var(--color-bg-tertiary)]"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--color-text)] truncate">{item.productName}</p>
                      <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
                        {item.variantName} · Qty {item.quantity}
                        {item.batchNumber && ` · Batch ${item.batchNumber}`}
                      </p>
                      {item.thcContent && (
                        <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]"
                           aria-label={`THC: ${item.thcContent}%`}>
                          THC {item.thcContent}%
                        </p>
                      )}
                    </div>
                    <p
                      className="font-semibold text-[var(--color-text)] flex-shrink-0"
                      aria-label={`Line total: ${formatCurrency(item.totalPrice)}`}
                    >
                      {formatCurrency(item.totalPrice)}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Pricing breakdown */}
              <div
                className="px-5 py-4 border-t border-[var(--color-border)] space-y-2 bg-[var(--color-bg-secondary)]"
                role="region"
                aria-label="Order pricing breakdown"
              >
                <div className="flex justify-between text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.promoDiscount > 0 && (
                  <div className="flex justify-between text-[var(--p-text-sm)] text-[var(--color-success)]">
                    <span>Promo discount</span>
                    <span>−{formatCurrency(order.promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                {order.deliveryFee != null && order.deliveryFee > 0 && (
                  <div className="flex justify-between text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
                    <span>Delivery fee</span>
                    <span>{formatCurrency(order.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[var(--color-text)] border-t border-[var(--color-border)] pt-2 mt-2">
                  <span>Total</span>
                  <span aria-label={`Order total: ${formatCurrency(order.total)}`}>
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </section>

            {/* Order timeline */}
            <section
              aria-labelledby="timeline-heading"
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-5"
            >
              <h2 id="timeline-heading" className="font-bold text-[var(--color-text)] mb-4">
                Order Timeline
              </h2>
              <OrderTimeline events={order.statusHistory} />
            </section>
          </div>

          {/* Right sidebar: customer + payment + fulfillment */}
          <div className="space-y-5">

            {/* Customer info */}
            <section
              aria-labelledby="customer-heading"
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-5"
            >
              <h2 id="customer-heading" className="font-bold text-[var(--color-text)] mb-3">
                Customer
              </h2>
              <dl className="space-y-2 text-[var(--p-text-sm)]">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-secondary)]">Name</dt>
                  <dd className="font-medium text-[var(--color-text)] text-right">{order.customerName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-secondary)]">Email</dt>
                  <dd className="font-medium text-[var(--color-text)] text-right truncate max-w-[160px]">
                    <a
                      href={`mailto:${order.customerEmail}`}
                      className="text-[var(--color-brand)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded"
                    >
                      {order.customerEmail}
                    </a>
                  </dd>
                </div>
                {order.customerPhone && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-secondary)]">Phone</dt>
                    <dd className="font-medium text-[var(--color-text)]">{order.customerPhone}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-secondary)]">ID Verified</dt>
                  <dd
                    className={order.idVerified ? 'text-[var(--color-success)] font-semibold' : 'text-[var(--color-warning)] font-semibold'}
                    aria-label={`ID verification status: ${order.idVerified ? 'Verified' : 'Pending verification'}`}
                  >
                    {order.idVerified ? '✓ Verified' : 'Pending'}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Fulfillment details */}
            <section
              aria-labelledby="fulfillment-heading"
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-5"
            >
              <h2 id="fulfillment-heading" className="font-bold text-[var(--color-text)] mb-3">
                Fulfillment
              </h2>
              <dl className="space-y-2 text-[var(--p-text-sm)]">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-secondary)]">Type</dt>
                  <dd className="font-medium text-[var(--color-text)] capitalize">{order.type}</dd>
                </div>
                {order.type === 'delivery' && order.deliveryAddress && (
                  <div>
                    <dt className="text-[var(--color-text-secondary)] mb-1">Delivery Address</dt>
                    <dd className="font-medium text-[var(--color-text)]">
                      <address className="not-italic text-[var(--p-text-sm)]">
                        {order.deliveryAddress.street}<br />
                        {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zip}
                      </address>
                    </dd>
                  </div>
                )}
                {order.driverName && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-secondary)]">Driver</dt>
                    <dd className="font-medium text-[var(--color-text)]">{order.driverName}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Payment info */}
            <section
              aria-labelledby="payment-heading"
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-5"
            >
              <h2 id="payment-heading" className="font-bold text-[var(--color-text)] mb-3">
                Payment
              </h2>
              <dl className="space-y-2 text-[var(--p-text-sm)]">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-secondary)]">Status</dt>
                  <dd
                    className={[
                      'font-semibold capitalize',
                      order.paymentStatus === 'paid' ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]',
                    ].join(' ')}
                    aria-label={`Payment status: ${order.paymentStatus}`}
                  >
                    {order.paymentStatus}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--color-text-secondary)]">Method</dt>
                  <dd className="font-medium text-[var(--color-text)] capitalize">
                    {order.paymentMethod ?? 'Card'}
                  </dd>
                </div>
                {order.stripePaymentIntentId && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-text-secondary)]">Stripe ID</dt>
                    <dd className="font-mono text-[var(--p-text-xs)] text-[var(--color-text-secondary)] truncate max-w-[140px]" title={order.stripePaymentIntentId}>
                      {order.stripePaymentIntentId}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          </div>
        </div>
      </div>

      {/* Refund modal */}
      <RefundModal
        isOpen={isRefundOpen}
        order={order}
        onClose={() => setIsRefundOpen(false)}
      />
    </>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Orders/components/OrderTimeline.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Orders/components/OrderTimeline.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Orders/components/OrderTimeline.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Orders/components/OrderTimeline.tsx
import React from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatDate } from '@cannasaas/utils';
import type { OrderStatusEvent } from '@cannasaas/types';

interface OrderTimelineProps {
  events: OrderStatusEvent[];
}

/**
 * OrderTimeline — Vertical chronological status history.
 *
 * Uses an <ol> (ordered list) because the sequence is meaningful —
 * each step follows causally from the previous one.
 *
 * WCAG 1.3.1: Status icons are decorative (aria-hidden). The status
 *             label and timestamp provide the complete textual record.
 */
export function OrderTimeline({ events }: OrderTimelineProps) {
  if (!events || events.length === 0) {
    return <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">No status history available.</p>;
  }

  return (
    <ol aria-label="Order status history" className="space-y-4">
      {events.map((event, idx) => {
        const isLatest   = idx === events.length - 1;
        const isFinal    = ['completed', 'cancelled', 'refunded'].includes(event.status);
        const isCancelled = event.status === 'cancelled' || event.status === 'refunded';

        return (
          <li key={event.id} className="flex items-start gap-3">
            {/* Status icon */}
            <div
              className={[
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5',
                isLatest && isFinal && !isCancelled ? 'bg-green-100 dark:bg-green-950/30' :
                isCancelled                          ? 'bg-red-100 dark:bg-red-950/20'     :
                isLatest                             ? 'bg-[var(--color-brand-subtle)]'     :
                                                       'bg-[var(--color-bg-tertiary)]',
              ].join(' ')}
              aria-hidden="true"
            >
              {isCancelled
                ? <XCircle size={16} className="text-[var(--color-error)]" />
                : isLatest
                ? <Clock size={16} className="text-[var(--color-brand)]" />
                : <CheckCircle size={16} className="text-[var(--color-success)]" />
              }
            </div>

            {/* Status text */}
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] capitalize">
                {event.status.replace(/_/g, ' ')}
              </p>
              {event.note && (
                <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] mt-0.5">
                  {event.note}
                </p>
              )}
              <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] mt-0.5">
                <time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>
                {event.performedByName && ` · ${event.performedByName}`}
              </p>
            </div>

            {/* Connecting line between items (not on the last item) */}
            {idx < events.length - 1 && (
              <div
                aria-hidden="true"
                className="absolute left-[15px] mt-9 w-px h-4 bg-[var(--color-border)]"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Orders/components/RefundModal.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Orders/components/RefundModal.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Orders/components/RefundModal.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Orders/components/RefundModal.tsx
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@cannasaas/ui';
import { useRefundOrder } from '@cannasaas/api-client';
import { useFocusTrap } from '@cannasaas/ui';
import { formatCurrency } from '@cannasaas/utils';
import type { Order } from '@cannasaas/types';

const refundSchema = z.object({
  type:   z.enum(['full', 'partial']),
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be greater than $0').optional(),
  reason: z.string().min(5, 'Please provide a reason for the refund (min 5 characters)'),
}).refine(data => {
  // If partial, amount is required
  if (data.type === 'partial' && (data.amount == null || data.amount <= 0)) {
    return false;
  }
  return true;
}, {
  message: 'Refund amount is required for partial refunds',
  path: ['amount'],
});

type RefundFormValues = z.infer<typeof refundSchema>;

interface RefundModalProps {
  isOpen: boolean;
  order: Order;
  onClose: () => void;
}

/**
 * RefundModal — Issues a full or partial refund through Stripe.
 *
 * A confirmed refund is irreversible. To prevent accidental submissions,
 * the user must explicitly choose refund type, supply a reason, and
 * acknowledge the confirmation toggle before the submit button enables.
 *
 * WCAG 2.1.2: Focus is trapped within the dialog.
 * WCAG 3.3.4: The confirmation checkbox acts as an error prevention
 *             mechanism for this high-consequence, irreversible action.
 */
export function RefundModal({ isOpen, order, onClose }: RefundModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingId    = React.useId();
  const [confirmed, setConfirmed] = useState(false);

  useFocusTrap(containerRef, isOpen, onClose);

  const { mutate: refundOrder, isPending, error: refundError } = useRefundOrder();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: { type: 'full' },
  });

  const refundType = watch('type');

  function onSubmit(values: RefundFormValues) {
    const amount = values.type === 'full' ? order.total : values.amount!;
    refundOrder(
      { orderId: order.id, amount, reason: values.reason },
      { onSuccess: onClose },
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={[
          'w-full max-w-md',
          'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
          'border border-[var(--color-border)] shadow-[var(--p-shadow-xl)]',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 id={headingId} className="text-[var(--p-text-lg)] font-bold text-[var(--color-text)] flex items-center gap-2">
            <AlertTriangle size={20} className="text-[var(--color-warning)]" aria-hidden="true" />
            Issue Refund — #{order.orderNumber}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close dialog"
            className="p-1.5 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Server error */}
        {refundError && (
          <div role="alert" className="mx-6 mt-4 p-3 rounded-[var(--p-radius-md)] bg-red-50 dark:bg-red-950/20 border border-[var(--color-error)]">
            <p className="text-[var(--p-text-sm)] text-[var(--color-error)]">
              Refund failed: {(refundError as any)?.message ?? 'Please try again or contact support.'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-6 py-5 space-y-5">

          {/* Refund type */}
          <fieldset>
            <legend className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] mb-2">
              Refund Type <span aria-hidden="true" className="text-[var(--color-error)]">*</span>
            </legend>
            <div className="flex gap-4">
              {(['full', 'partial'] as const).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={type}
                    className="text-[var(--color-brand)] focus:ring-[var(--color-focus-ring)]"
                    {...register('type')}
                  />
                  <span className="text-[var(--p-text-sm)] text-[var(--color-text)] capitalize">
                    {type} {type === 'full' && `(${formatCurrency(order.total)})`}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Partial amount input — conditionally shown */}
          {refundType === 'partial' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="amount" className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
                Refund Amount <span aria-hidden="true" className="text-[var(--color-error)]">*</span>
              </label>
              <div className="relative">
                <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] text-[var(--p-text-sm)]">$</span>
                <input
                  id="amount"
                  type="number"
                  min={0.01}
                  max={order.total}
                  step={0.01}
                  aria-required="true"
                  aria-invalid={!!errors.amount}
                  aria-describedby={errors.amount ? 'amount-error' : 'amount-hint'}
                  className={[
                    'w-full h-9 pl-7 pr-3 rounded-[var(--p-radius-md)] text-[var(--p-text-sm)]',
                    'border bg-[var(--color-bg)] text-[var(--color-text)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                    errors.amount ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]',
                  ].join(' ')}
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              <p id="amount-hint" className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
                Maximum refundable: {formatCurrency(order.total)}
              </p>
              {errors.amount && (
                <p id="amount-error" role="alert" className="text-[var(--p-text-xs)] text-[var(--color-error)]">
                  {errors.amount.message}
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reason" className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
              Reason <span aria-hidden="true" className="text-[var(--color-error)]">*</span>
            </label>
            <textarea
              id="reason"
              rows={3}
              aria-required="true"
              aria-invalid={!!errors.reason}
              aria-describedby={errors.reason ? 'reason-error' : undefined}
              placeholder="Describe the reason for this refund…"
              className={[
                'w-full px-3 py-2 rounded-[var(--p-radius-md)] text-[var(--p-text-sm)]',
                'border bg-[var(--color-bg)] text-[var(--color-text)]',
                'placeholder:text-[var(--color-text-secondary)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                'resize-y',
                errors.reason ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]',
              ].join(' ')}
              {...register('reason')}
            />
            {errors.reason && (
              <p id="reason-error" role="alert" className="text-[var(--p-text-xs)] text-[var(--color-error)]">
                {errors.reason.message}
              </p>
            )}
          </div>

          {/* Confirmation checkbox — WCAG 3.3.4 error prevention for irreversible action */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-[var(--color-brand)] focus:ring-[var(--color-focus-ring)]"
              aria-required="true"
              aria-describedby="confirm-description"
            />
            <span id="confirm-description" className="text-[var(--p-text-sm)] text-[var(--color-text)]">
              I understand this refund is <strong>irreversible</strong> and will be processed immediately through Stripe.
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={!confirmed}
              isLoading={isPending}
              loadingText="Processing refund…"
              aria-describedby={!confirmed ? 'confirm-description' : undefined}
            >
              Process Refund
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Compliance/ComplianceDashboard.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Compliance/ComplianceDashboard.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Compliance/ComplianceDashboard.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Compliance/ComplianceDashboard.tsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  useComplianceLogs,
  useMetrcSyncStatus,
  useGenerateDailyReport,
} from '@cannasaas/api-client';
import { Button, DataTable } from '@cannasaas/ui';
import { ComplianceLogRow } from './components/ComplianceLogRow';
import { PurchaseLimitChart } from './components/PurchaseLimitChart';
import { MetrcStatusPanel } from './components/MetrcStatusPanel';
import { formatCurrency } from '@cannasaas/utils';

export default function ComplianceDashboard() {
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const { data: logs, isLoading: logsLoading } = useComplianceLogs({
    limit: 50,
    sort: 'createdAt_desc',
  });
  const { data: metrcStatus } = useMetrcSyncStatus();
  const { mutate: generateReport, isPending: isGenerating } =
    useGenerateDailyReport();

  const handleGenerateReport = () => {
    generateReport({ date: reportDate });
  };

  return (
    <>
      <Helmet>
        <title>Compliance | CannaSaas Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield
            className="text-[var(--color-brand)] w-8 h-8"
            aria-hidden="true"
          />
          <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)]">
            Compliance Dashboard
          </h1>
        </div>

        {/* Metrc integration status */}
        <MetrcStatusPanel status={metrcStatus} />

        {/* Daily report generation */}
        <section
          aria-labelledby="report-heading"
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6"
        >
          <h2
            id="report-heading"
            className="font-bold text-[var(--color-text)] mb-4 flex items-center gap-2"
          >
            <FileText size={20} aria-hidden="true" />
            Daily Sales Reports
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div>
              <label
                htmlFor="report-date"
                className="block text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] mb-1.5"
              >
                Report Date
              </label>
              <input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className={[
                  'h-10 px-4 rounded-[var(--p-radius-md)]',
                  'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
                  'text-[var(--color-text)] text-[var(--p-text-sm)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                ].join(' ')}
              />
            </div>
            <Button
              variant="primary"
              onClick={handleGenerateReport}
              isLoading={isGenerating}
              loadingText="Generating..."
              leftIcon={<RefreshCw size={16} aria-hidden="true" />}
            >
              Generate Report
            </Button>
          </div>
        </section>

        {/* Purchase limit violations chart */}
        <section
          aria-labelledby="limits-heading"
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6"
        >
          <h2
            id="limits-heading"
            className="font-bold text-[var(--color-text)] mb-4"
          >
            Purchase Limit Checks (Last 30 Days)
          </h2>
          <PurchaseLimitChart />
        </section>

        {/* Audit log */}
        <section
          aria-labelledby="audit-heading"
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6"
        >
          <h2
            id="audit-heading"
            className="font-bold text-[var(--color-text)] mb-4"
          >
            Audit Log
          </h2>
          <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] mb-4">
            All compliance events are retained for 7 years per state regulatory
            requirements.
          </p>

          {/* WCAG 1.3.1: table is used for tabular compliance data */}
          <div
            className="overflow-x-auto"
            role="region"
            aria-label="Compliance audit log"
            tabIndex={0} // WCAG 2.1.1: scrollable region is keyboard focusable
          >
            <table className="w-full text-[var(--p-text-sm)]">
              <caption className="sr-only">
                Compliance audit log showing event type, timestamp, and details
              </caption>
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-semibold text-[var(--color-text-secondary)]"
                  >
                    Event Type
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-semibold text-[var(--color-text-secondary)]"
                  >
                    Timestamp
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-semibold text-[var(--color-text-secondary)]"
                  >
                    Performed By
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-semibold text-[var(--color-text-secondary)]"
                  >
                    Details
                  </th>
                </tr>
              </thead>
              <tbody aria-busy={logsLoading}>
                {logsLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="py-3 px-4">
                          <div
                            className="h-5 bg-[var(--color-bg-tertiary)] rounded animate-pulse"
                            aria-hidden="true"
                          />
                        </td>
                      </tr>
                    ))
                  : logs?.data.map((log) => (
                      <ComplianceLogRow key={log.id} log={log} />
                    ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Onboarding/OnboardingPage.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Onboarding/OnboardingPage.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Onboarding/OnboardingPage.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Onboarding/OnboardingPage.tsx
import React, { useReducer, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useCompleteOnboarding } from '@cannasaas/api-client';
import { useAuthStore } from '@cannasaas/stores';
import { cn } from '@cannasaas/utils';

// ── STEP DEFINITIONS ──────────────────────────────────────────────────────────
import { StepOrganization }  from './steps/StepOrganization';
import { StepDispensary }    from './steps/StepDispensary';
import { StepBranding }      from './steps/StepBranding';
import { StepCompliance }    from './steps/StepCompliance';
import { StepHours }         from './steps/StepHours';
import { StepPOS }           from './steps/StepPOS';
import { StepReview }        from './steps/StepReview';

export interface OnboardingData {
  organization: {
    name: string;
    slug: string;
    contactEmail: string;
    contactPhone: string;
    website?: string;
  };
  dispensary: {
    name: string;
    licenseNumber: string;
    licenseType: 'medical' | 'recreational' | 'medical_recreational';
    state: 'NY' | 'NJ' | 'CT';
    street: string;
    city: string;
    zip: string;
    deliveryAvailable: boolean;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    headingFont: string;
    bodyFont: string;
    logoFile?: File;
    faviconFile?: File;
    customDomain?: string;
  };
  compliance: {
    metrcEnabled: boolean;
    metrcApiKey?: string;
    metrcUserKey?: string;
    metrcFacilityLicenseNumber?: string;
    idVerificationProvider: 'manual' | 'onfido' | 'jumio';
  };
  hours: {
    [day: string]: { open: string; close: string; closed: boolean };
  };
  pos: {
    provider: 'none' | 'dutchie' | 'treez';
    apiKey?: string;
    siteId?: string;
  };
}

type OnboardingAction =
  | { type: 'SET_STEP_DATA'; step: keyof OnboardingData; data: any }
  | { type: 'NEXT' }
  | { type: 'PREV' };

interface OnboardingState {
  currentStep: number;
  data: Partial<OnboardingData>;
}

const STEPS = [
  { id: 'organization', label: 'Organization',  description: 'Business identity' },
  { id: 'dispensary',   label: 'Dispensary',    description: 'Location & license' },
  { id: 'branding',     label: 'Branding',      description: 'Colors & logo' },
  { id: 'compliance',   label: 'Compliance',    description: 'Metrc & ID verification' },
  { id: 'hours',        label: 'Hours',         description: 'Operating schedule' },
  { id: 'pos',          label: 'POS',           description: 'Point of sale' },
  { id: 'review',       label: 'Review',        description: 'Confirm & launch' },
];

function reducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_STEP_DATA':
      return {
        ...state,
        data: { ...state.data, [action.step]: action.data },
      };
    case 'NEXT':
      return { ...state, currentStep: Math.min(state.currentStep + 1, STEPS.length - 1) };
    case 'PREV':
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0) };
    default:
      return state;
  }
}

/**
 * OnboardingPage — Multi-step setup wizard for new dispensary tenants.
 *
 * State is managed with useReducer rather than URL params because the wizard
 * should not be navigable via the back button mid-session — the guard will
 * redirect incomplete setups back to step 1.
 *
 * WCAG 2.4.2: Step title updates the <title> element dynamically.
 * WCAG 1.3.1: Step progress is conveyed by both a visual stepper and an
 *             aria-label on the <nav> element.
 * WCAG 2.4.3: Focus moves to the step heading on each transition so keyboard
 *             and screen reader users are oriented immediately.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, {
    currentStep: 0,
    data: {
      branding: {
        primaryColor: '#16a34a',
        secondaryColor: '#15803d',
        accentColor: '#22c55e',
        headingFont: 'Inter',
        bodyFont: 'Inter',
      },
      hours: {
        monday:    { open: '09:00', close: '21:00', closed: false },
        tuesday:   { open: '09:00', close: '21:00', closed: false },
        wednesday: { open: '09:00', close: '21:00', closed: false },
        thursday:  { open: '09:00', close: '21:00', closed: false },
        friday:    { open: '09:00', close: '22:00', closed: false },
        saturday:  { open: '10:00', close: '22:00', closed: false },
        sunday:    { open: '10:00', close: '20:00', closed: false },
      },
      compliance: { metrcEnabled: true, idVerificationProvider: 'manual' },
      pos: { provider: 'none' },
    },
  });

  const { mutate: completeOnboarding, isPending } = useCompleteOnboarding();
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  const current = STEPS[state.currentStep];

  function handleStepComplete(stepId: keyof OnboardingData, data: any) {
    dispatch({ type: 'SET_STEP_DATA', step: stepId, data });
    dispatch({ type: 'NEXT' });
    // Move focus to the new step's heading for screen reader orientation
    setTimeout(() => stepHeadingRef.current?.focus(), 80);
  }

  function handleBack() {
    dispatch({ type: 'PREV' });
    setTimeout(() => stepHeadingRef.current?.focus(), 80);
  }

  function handleFinish() {
    completeOnboarding(state.data as OnboardingData, {
      onSuccess: () => navigate('/dashboard', { replace: true }),
    });
  }

  return (
    <>
      <Helmet>
        <title>
          {`Step ${state.currentStep + 1} of ${STEPS.length}: ${current.label} — CannaSaas Setup`}
        </title>
      </Helmet>

      <div className="min-h-screen bg-[var(--color-bg-secondary)] flex flex-col">
        {/* Top branding bar */}
        <header className="h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center px-6">
          <span className="text-[var(--p-text-lg)] font-black text-[var(--color-brand)]">
            CannaSaas
          </span>
          <span className="ml-3 text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
            Dispensary Setup
          </span>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar progress stepper */}
          <nav
            aria-label={`Setup progress: Step ${state.currentStep + 1} of ${STEPS.length}`}
            className="hidden lg:flex flex-col w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] p-6 flex-shrink-0"
          >
            <p className="text-[var(--p-text-xs)] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-6">
              Setup Progress
            </p>
            <ol aria-label="Wizard steps" className="space-y-1">
              {STEPS.map((step, idx) => {
                const isComplete = idx < state.currentStep;
                const isCurrent  = idx === state.currentStep;
                const isPending  = idx > state.currentStep;

                return (
                  <li key={step.id}>
                    <div
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-[var(--p-radius-md)]',
                        isCurrent && 'bg-[var(--color-brand-subtle)]',
                      )}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {/* Step indicator */}
                      <div
                        className={cn(
                          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[var(--p-text-xs)] font-bold',
                          isComplete
                            ? 'bg-[var(--color-success)] text-white'
                            : isCurrent
                            ? 'bg-[var(--color-brand)] text-white'
                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
                        )}
                        aria-hidden="true"
                      >
                        {isComplete ? '✓' : idx + 1}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={cn(
                            'text-[var(--p-text-sm)] font-semibold truncate',
                            isCurrent
                              ? 'text-[var(--color-brand)]'
                              : isComplete
                              ? 'text-[var(--color-text)]'
                              : 'text-[var(--color-text-secondary)]',
                          )}
                        >
                          {step.label}
                        </p>
                        <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] truncate">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Connector line — not on last item */}
                    {idx < STEPS.length - 1 && (
                      <div
                        aria-hidden="true"
                        className={cn(
                          'ml-[22px] w-px h-3 my-0.5',
                          isComplete ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]',
                        )}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Main step content area */}
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto p-6 lg:p-10"
          >
            {/* Mobile progress bar */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center justify-between text-[var(--p-text-sm)] text-[var(--color-text-secondary)] mb-2">
                <span>Step {state.currentStep + 1} of {STEPS.length}</span>
                <span className="font-semibold text-[var(--color-text)]">{current.label}</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={state.currentStep + 1}
                aria-valuemin={1}
                aria-valuemax={STEPS.length}
                aria-label={`Setup progress: Step ${state.currentStep + 1} of ${STEPS.length}`}
                className="h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden"
              >
                <div
                  aria-hidden="true"
                  className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-[var(--p-dur-normal)]"
                  style={{ width: `${((state.currentStep + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Step heading — receives focus on transition */}
            <h1
              ref={stepHeadingRef}
              tabIndex={-1}
              className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-1 outline-none"
            >
              {current.label}
            </h1>
            <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] mb-8">
              {current.description}
            </p>

            {/* Render the active step component */}
            <div className="max-w-2xl">
              {current.id === 'organization' && (
                <StepOrganization
                  defaultValues={state.data.organization}
                  onComplete={data => handleStepComplete('organization', data)}
                />
              )}
              {current.id === 'dispensary' && (
                <StepDispensary
                  defaultValues={state.data.dispensary}
                  onComplete={data => handleStepComplete('dispensary', data)}
                  onBack={handleBack}
                />
              )}
              {current.id === 'branding' && (
                <StepBranding
                  defaultValues={state.data.branding}
                  onComplete={data => handleStepComplete('branding', data)}
                  onBack={handleBack}
                />
              )}
              {current.id === 'compliance' && (
                <StepCompliance
                  defaultValues={state.data.compliance}
                  dispensaryState={state.data.dispensary?.state ?? 'NY'}
                  onComplete={data => handleStepComplete('compliance', data)}
                  onBack={handleBack}
                />
              )}
              {current.id === 'hours' && (
                <StepHours
                  defaultValues={state.data.hours}
                  onComplete={data => handleStepComplete('hours', data)}
                  onBack={handleBack}
                />
              )}
              {current.id === 'pos' && (
                <StepPOS
                  defaultValues={state.data.pos}
                  onComplete={data => handleStepComplete('pos', data)}
                  onBack={handleBack}
                />
              )}
              {current.id === 'review' && (
                <StepReview
                  data={state.data as OnboardingData}
                  onBack={handleBack}
                  onFinish={handleFinish}
                  isSubmitting={isPending}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Onboarding/steps/StepOrganization.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Onboarding/steps/StepOrganization.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Onboarding/steps/StepOrganization.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Onboarding/steps/StepOrganization.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@cannasaas/ui';
import type { OnboardingData } from '../OnboardingPage';

const schema = z.object({
  name:         z.string().min(2, 'Organization name must be at least 2 characters'),
  slug:         z.string()
                  .min(2, 'Slug must be at least 2 characters')
                  .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  contactEmail: z.string().email('Must be a valid email address'),
  contactPhone: z.string().min(10, 'Must be a valid phone number'),
  website:      z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type StepValues = z.infer<typeof schema>;

interface StepOrganizationProps {
  defaultValues?: Partial<StepValues>;
  onComplete: (data: OnboardingData['organization']) => void;
}

/**
 * StepOrganization — Collects the top-level holding entity information.
 *
 * The "slug" field becomes the PostgreSQL schema name prefix
 * (org_{slug}) and the subdomain root, so it is strictly validated
 * to URL-safe characters only.
 */
export function StepOrganization({ defaultValues, onComplete }: StepOrganizationProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<StepValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {},
  });

  const slugValue = watch('slug') ?? '';

  return (
    <form onSubmit={handleSubmit(data => onComplete(data))} noValidate className="space-y-5">
      <WizardField id="name" label="Organization / Holding Company Name" required error={errors.name?.message}>
        <input
          id="name"
          type="text"
          placeholder="Green Leaf Holdings LLC"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={wizardInputClass(!!errors.name)}
          {...register('name')}
        />
      </WizardField>

      <WizardField
        id="slug"
        label="Subdomain Slug"
        required
        hint={`Your storefront will live at shop.${slugValue || 'your-slug'}.cannasaas.com`}
        error={errors.slug?.message}
      >
        <input
          id="slug"
          type="text"
          placeholder="green-leaf"
          aria-required="true"
          aria-invalid={!!errors.slug}
          aria-describedby={errors.slug ? 'slug-error' : 'slug-hint'}
          className={wizardInputClass(!!errors.slug)}
          {...register('slug')}
        />
      </WizardField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WizardField id="contactEmail" label="Contact Email" required error={errors.contactEmail?.message}>
          <input
            id="contactEmail"
            type="email"
            placeholder="admin@greenleaf.com"
            aria-required="true"
            aria-invalid={!!errors.contactEmail}
            aria-describedby={errors.contactEmail ? 'contactEmail-error' : undefined}
            className={wizardInputClass(!!errors.contactEmail)}
            {...register('contactEmail')}
          />
        </WizardField>

        <WizardField id="contactPhone" label="Contact Phone" required error={errors.contactPhone?.message}>
          <input
            id="contactPhone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            aria-required="true"
            aria-invalid={!!errors.contactPhone}
            aria-describedby={errors.contactPhone ? 'contactPhone-error' : undefined}
            className={wizardInputClass(!!errors.contactPhone)}
            {...register('contactPhone')}
          />
        </WizardField>
      </div>

      <WizardField id="website" label="Website" hint="Optional" error={errors.website?.message}>
        <input
          id="website"
          type="url"
          placeholder="https://greenleaf.com"
          aria-invalid={!!errors.website}
          aria-describedby={errors.website ? 'website-error' : 'website-hint'}
          className={wizardInputClass(!!errors.website)}
          {...register('website')}
        />
      </WizardField>

      <WizardActions onBack={undefined} nextLabel="Continue to Dispensary →" />
    </form>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Onboarding/steps/StepDispensary.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Onboarding/steps/StepDispensary.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Onboarding/steps/StepDispensary.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Onboarding/steps/StepDispensary.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { OnboardingData } from '../OnboardingPage';
import { WizardField, WizardActions, wizardInputClass } from '../OnboardingHelpers';

const schema = z.object({
  name:            z.string().min(2, 'Dispensary name is required'),
  licenseNumber:   z.string().min(1, 'License number is required'),
  licenseType:     z.enum(['medical', 'recreational', 'medical_recreational'], {
                     errorMap: () => ({ message: 'Please select a license type' }),
                   }),
  state:           z.enum(['NY', 'NJ', 'CT'], {
                     errorMap: () => ({ message: 'State is required — CannaSaas currently supports NY, NJ, and CT' }),
                   }),
  street:          z.string().min(5, 'Street address is required'),
  city:            z.string().min(2, 'City is required'),
  zip:             z.string().regex(/^\d{5}(-\d{4})?$/, 'Must be a valid ZIP code'),
  deliveryAvailable: z.boolean(),
});

type StepValues = z.infer<typeof schema>;

interface StepDispensaryProps {
  defaultValues?: Partial<StepValues>;
  onComplete: (data: OnboardingData['dispensary']) => void;
  onBack: () => void;
}

/**
 * StepDispensary — Physical dispensary location, license, and delivery availability.
 *
 * State selection determines which purchase limits and Metrc endpoint
 * are applied — NY enforces the most complex rolling-window rules
 * (3 oz flower / 24g concentrate per 24 hours per the compliance guide).
 */
export function StepDispensary({ defaultValues, onComplete, onBack }: StepDispensaryProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<StepValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { deliveryAvailable: false },
  });

  return (
    <form onSubmit={handleSubmit(data => onComplete(data))} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WizardField id="name" label="Dispensary Name" required error={errors.name?.message}>
          <input id="name" type="text" placeholder="Green Leaf Brooklyn"
            aria-required="true" aria-invalid={!!errors.name}
            className={wizardInputClass(!!errors.name)} {...register('name')} />
        </WizardField>

        <WizardField id="licenseNumber" label="License Number" required error={errors.licenseNumber?.message}>
          <input id="licenseNumber" type="text" placeholder="NY-OCM-R-000001"
            aria-required="true" aria-invalid={!!errors.licenseNumber}
            className={wizardInputClass(!!errors.licenseNumber)} {...register('licenseNumber')} />
        </WizardField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WizardField id="state" label="State" required error={errors.state?.message}>
          <select id="state" aria-required="true" aria-invalid={!!errors.state}
            className={wizardInputClass(!!errors.state)} {...register('state')}>
            <option value="">Select state…</option>
            <option value="NY">New York</option>
            <option value="NJ">New Jersey</option>
            <option value="CT">Connecticut</option>
          </select>
        </WizardField>

        <WizardField id="licenseType" label="License Type" required error={errors.licenseType?.message}>
          <select id="licenseType" aria-required="true" aria-invalid={!!errors.licenseType}
            className={wizardInputClass(!!errors.licenseType)} {...register('licenseType')}>
            <option value="">Select type…</option>
            <option value="recreational">Recreational Only</option>
            <option value="medical">Medical Only</option>
            <option value="medical_recreational">Medical + Recreational</option>
          </select>
        </WizardField>
      </div>

      <WizardField id="street" label="Street Address" required error={errors.street?.message}>
        <input id="street" type="text" placeholder="123 Main St"
          aria-required="true" aria-invalid={!!errors.street}
          className={wizardInputClass(!!errors.street)} {...register('street')} />
      </WizardField>

      <div className="grid grid-cols-2 gap-4">
        <WizardField id="city" label="City" required error={errors.city?.message}>
          <input id="city" type="text" placeholder="Brooklyn"
            aria-required="true" aria-invalid={!!errors.city}
            className={wizardInputClass(!!errors.city)} {...register('city')} />
        </WizardField>

        <WizardField id="zip" label="ZIP Code" required error={errors.zip?.message}>
          <input id="zip" type="text" placeholder="11201"
            aria-required="true" aria-invalid={!!errors.zip}
            className={wizardInputClass(!!errors.zip)} {...register('zip')} />
        </WizardField>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" className="h-4 w-4 rounded text-[var(--color-brand)] focus:ring-[var(--color-focus-ring)]"
          {...register('deliveryAvailable')} />
        <span className="text-[var(--p-text-sm)] text-[var(--color-text)]">
          This dispensary offers delivery (PostGIS delivery zones can be drawn after setup)
        </span>
      </label>

      <WizardActions onBack={onBack} nextLabel="Continue to Branding →" />
    </form>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Onboarding/steps/StepBranding.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Onboarding/steps/StepBranding.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Onboarding/steps/StepBranding.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Onboarding/steps/StepBranding.tsx
import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload } from 'lucide-react';
import type { OnboardingData } from '../OnboardingPage';
import { WizardField, WizardActions, wizardInputClass } from '../OnboardingHelpers';
import { validateBrandContrast } from '@cannasaas/utils';

const GOOGLE_FONTS = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Nunito', 'Montserrat'];

const schema = z.object({
  primaryColor:   z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  accentColor:    z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  headingFont:    z.string().min(1, 'Required'),
  bodyFont:       z.string().min(1, 'Required'),
  customDomain:   z.string().optional(),
});

type StepValues = z.infer<typeof schema>;

interface StepBrandingProps {
  defaultValues?: Partial<OnboardingData['branding']>;
  onComplete: (data: OnboardingData['branding']) => void;
  onBack: () => void;
}

/**
 * StepBranding — Logo upload, color palette, and typography selection.
 *
 * Colors are validated for WCAG 4.5:1 contrast against white and black
 * immediately on change, giving managers real-time feedback before they
 * commit. The ThemeProvider (Section 6) will apply these same CSS custom
 * properties at runtime to the storefront.
 *
 * Logo and favicon files are held in local state as File objects and
 * submitted via FormData to POST /dispensaries/:id/branding/logo after
 * the organization and dispensary are provisioned in StepReview.
 */
export function StepBranding({ defaultValues, onComplete, onBack }: StepBrandingProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<StepValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      primaryColor:   defaultValues?.primaryColor   ?? '#16a34a',
      secondaryColor: defaultValues?.secondaryColor ?? '#15803d',
      accentColor:    defaultValues?.accentColor    ?? '#22c55e',
      headingFont:    defaultValues?.headingFont    ?? 'Inter',
      bodyFont:       defaultValues?.bodyFont       ?? 'Inter',
      customDomain:   defaultValues?.customDomain   ?? '',
    },
  });

  const watchedPrimary = watch('primaryColor');
  const contrastOk = validateBrandContrast(watchedPrimary);

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }, []);

  function onSubmit(values: StepValues) {
    onComplete({ ...values, logoFile: logoFile ?? undefined, faviconFile: faviconFile ?? undefined });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Logo upload */}
      <fieldset className="border border-[var(--color-border)] rounded-[var(--p-radius-md)] p-4">
        <legend className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] px-1">
          Logo &amp; Favicon
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          {/* Logo */}
          <div>
            <label
              htmlFor="logo-upload"
              className="block text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] mb-2"
            >
              Primary Logo
            </label>
            {logoPreview && (
              <img src={logoPreview} alt="Logo preview" className="h-12 mb-2 object-contain" />
            )}
            <label
              htmlFor="logo-upload"
              className={[
                'flex items-center justify-center gap-2 h-10 px-4 rounded-[var(--p-radius-md)]',
                'border-2 border-dashed border-[var(--color-border)] cursor-pointer',
                'text-[var(--p-text-sm)] text-[var(--color-text-secondary)]',
                'hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]',
                'transition-colors duration-[var(--p-dur-fast)]',
              ].join(' ')}
            >
              <Upload size={15} aria-hidden="true" />
              {logoFile ? logoFile.name : 'Upload PNG/SVG'}
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/png,image/svg+xml,image/webp"
              className="sr-only"
              onChange={handleLogoChange}
              aria-label="Upload primary logo"
            />
          </div>

          {/* Favicon */}
          <div>
            <label
              htmlFor="favicon-upload"
              className="block text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] mb-2"
            >
              Favicon <span className="text-[var(--color-text-secondary)] font-normal">(optional)</span>
            </label>
            <label
              htmlFor="favicon-upload"
              className={[
                'flex items-center justify-center gap-2 h-10 px-4 rounded-[var(--p-radius-md)]',
                'border-2 border-dashed border-[var(--color-border)] cursor-pointer',
                'text-[var(--p-text-sm)] text-[var(--color-text-secondary)]',
                'hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]',
                'transition-colors',
              ].join(' ')}
            >
              <Upload size={15} aria-hidden="true" />
              {faviconFile ? faviconFile.name : 'Upload ICO/PNG'}
            </label>
            <input
              id="favicon-upload"
              type="file"
              accept="image/x-icon,image/png"
              className="sr-only"
              onChange={e => setFaviconFile(e.target.files?.[0] ?? null)}
              aria-label="Upload favicon"
            />
          </div>
        </div>
      </fieldset>

      {/* Colors */}
      <fieldset className="border border-[var(--color-border)] rounded-[var(--p-radius-md)] p-4">
        <legend className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] px-1">
          Brand Colors
        </legend>

        {/* Contrast warning — surfaced in real time */}
        {!contrastOk && (
          <div
            role="alert"
            className="mt-3 mb-2 px-3 py-2 rounded-[var(--p-radius-sm)] bg-amber-50 dark:bg-amber-950/20 border border-amber-300 text-[var(--p-text-xs)] text-amber-800 dark:text-amber-300"
          >
            ⚠ Primary color may have insufficient contrast against white text (WCAG 1.4.3 requires 4.5:1). Consider a darker shade.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
          {(
            [
              { id: 'primaryColor',   label: 'Primary',   hint: 'Buttons, links, active states' },
              { id: 'secondaryColor', label: 'Secondary',  hint: 'Hover states, secondary actions' },
              { id: 'accentColor',    label: 'Accent',     hint: 'Badges, highlights' },
            ] as const
          ).map(({ id, label, hint }) => (
            <div key={id} className="flex flex-col gap-1.5">
              <label htmlFor={id} className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
                {label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`${id}-picker`}
                  type="color"
                  className="h-9 w-12 rounded border border-[var(--color-border)] cursor-pointer p-0.5 bg-[var(--color-bg)]"
                  aria-label={`${label} color picker`}
                  {...register(id)}
                />
                <input
                  id={id}
                  type="text"
                  maxLength={7}
                  placeholder="#16a34a"
                  aria-invalid={!!errors[id]}
                  className={[wizardInputClass(!!errors[id]), 'font-mono text-[var(--p-text-xs)]'].join(' ')}
                  {...register(id)}
                />
              </div>
              <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">{hint}</p>
              {errors[id] && (
                <p role="alert" className="text-[var(--p-text-xs)] text-[var(--color-error)]">
                  {errors[id]?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </fieldset>

      {/* Typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WizardField id="headingFont" label="Heading Font" required error={errors.headingFont?.message}>
          <select id="headingFont" aria-required="true"
            className={wizardInputClass(!!errors.headingFont)} {...register('headingFont')}>
            {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </WizardField>

        <WizardField id="bodyFont" label="Body Font" required error={errors.bodyFont?.message}>
          <select id="bodyFont" aria-required="true"
            className={wizardInputClass(!!errors.bodyFont)} {...register('bodyFont')}>
            {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </WizardField>
      </div>

      {/* Custom domain */}
      <WizardField id="customDomain" label="Custom Domain"
        hint="Optional. Example: shop.greenleafbrooklyn.com — requires CNAME pointed at CloudFront.">
        <input id="customDomain" type="text" placeholder="shop.greenleafbrooklyn.com"
          className={wizardInputClass(false)} {...register('customDomain')} />
      </WizardField>

      <WizardActions onBack={onBack} nextLabel="Continue to Compliance →" />
    </form>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Onboarding/steps/StepCompliance.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Onboarding/steps/StepCompliance.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Onboarding/steps/StepCompliance.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Onboarding/steps/StepCompliance.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield } from 'lucide-react';
import type { OnboardingData } from '../OnboardingPage';
import { WizardField, WizardActions, wizardInputClass } from '../OnboardingHelpers';

// Metrc fields are conditionally required when metrcEnabled is true
const schema = z.object({
  metrcEnabled:              z.boolean(),
  metrcApiKey:               z.string().optional(),
  metrcUserKey:              z.string().optional(),
  metrcFacilityLicenseNumber: z.string().optional(),
  idVerificationProvider:    z.enum(['manual', 'onfido', 'jumio']),
}).superRefine((val, ctx) => {
  if (val.metrcEnabled) {
    if (!val.metrcApiKey) ctx.addIssue({ path: ['metrcApiKey'],               code: 'custom', message: 'Metrc API key is required when Metrc is enabled' });
    if (!val.metrcUserKey) ctx.addIssue({ path: ['metrcUserKey'],             code: 'custom', message: 'Metrc user key is required when Metrc is enabled' });
    if (!val.metrcFacilityLicenseNumber) ctx.addIssue({ path: ['metrcFacilityLicenseNumber'], code: 'custom', message: 'Facility license number is required for Metrc' });
  }
});

type StepValues = z.infer<typeof schema>;

// State-specific purchase limit info — surfaced as informational context
const STATE_LIMITS: Record<string, string> = {
  NY: 'New York: 3 oz flower + 24g concentrate per 24-hour rolling window (recreational)',
  NJ: 'New Jersey: 1 oz flower per transaction (recreational)',
  CT: 'Connecticut: 1.5 oz flower per transaction (recreational)',
};

interface StepComplianceProps {
  defaultValues?: Partial<StepValues>;
  dispensaryState: 'NY' | 'NJ' | 'CT';
  onComplete: (data: OnboardingData['compliance']) => void;
  onBack: () => void;
}

/**
 * StepCompliance — Metrc seed-to-sale credentials and ID verification provider.
 *
 * Metrc is state-mandated for NY and NJ. The API keys entered here are stored
 * encrypted at rest via AWS KMS (architecture.md §9 — POS Credentials pattern
 * also applies to Metrc keys). The backend's MetrcService uses the state-specific
 * endpoint resolved from the dispensary's state field set in StepDispensary.
 *
 * The purchase limit table from compliance-guide.md §3.1 is shown as context
 * so managers understand what CannaSaas will enforce automatically.
 */
export function StepCompliance({ defaultValues, dispensaryState, onComplete, onBack }: StepComplianceProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<StepValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { metrcEnabled: true, idVerificationProvider: 'manual' },
  });

  const metrcEnabled = watch('metrcEnabled');

  return (
    <form onSubmit={handleSubmit(data => onComplete(data))} noValidate className="space-y-6">
      {/* Purchase limits context banner */}
      <div
        className="flex gap-3 p-4 rounded-[var(--p-radius-md)] bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]"
        role="note"
        aria-label="State purchase limits that CannaSaas will enforce automatically"
      >
        <Shield size={18} className="text-[var(--color-brand)] flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-[var(--p-text-sm)] font-semibold text-[var(--color-brand)]">
            Automatic Purchase Limit Enforcement
          </p>
          <p className="text-[var(--p-text-xs)] text-[var(--color-text)] mt-0.5">
            {STATE_LIMITS[dispensaryState]}
          </p>
          <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] mt-1">
            CannaSaas enforces these limits at both add-to-cart and checkout. No configuration needed.
          </p>
        </div>
      </div>

      {/* Metrc toggle */}
      <fieldset className="border border-[var(--color-border)] rounded-[var(--p-radius-md)] p-4">
        <legend className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] px-1">
          Metrc Seed-to-Sale Integration
        </legend>

        <label className="flex items-center gap-3 cursor-pointer mt-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded text-[var(--color-brand)] focus:ring-[var(--color-focus-ring)]"
            {...register('metrcEnabled')}
          />
          <span className="text-[var(--p-text-sm)] text-[var(--color-text)]">
            Enable Metrc reporting (required for NY and NJ licensees)
          </span>
        </label>

        {metrcEnabled && (
          <div className="mt-4 space-y-4">
            <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
              Metrc credentials are encrypted at rest using AWS KMS and are never logged or exposed
              via the API. Contact your Metrc state administrator for API access.
            </p>

            <WizardField id="metrcFacilityLicenseNumber" label="Facility License Number" required error={errors.metrcFacilityLicenseNumber?.message}>
              <input id="metrcFacilityLicenseNumber" type="text" placeholder="NY-OCM-R-000001"
                aria-required="true" aria-invalid={!!errors.metrcFacilityLicenseNumber}
                className={wizardInputClass(!!errors.metrcFacilityLicenseNumber)}
                {...register('metrcFacilityLicenseNumber')} />
            </WizardField>

            <WizardField id="metrcApiKey" label="Metrc Software API Key" required error={errors.metrcApiKey?.message}>
              <input id="metrcApiKey" type="password" placeholder="••••••••••••••••"
                autoComplete="new-password"
                aria-required="true" aria-invalid={!!errors.metrcApiKey}
                aria-describedby="metrcApiKey-hint"
                className={wizardInputClass(!!errors.metrcApiKey)}
                {...register('metrcApiKey')} />
              <p id="metrcApiKey-hint" className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
                This is the software key issued by Metrc to your POS/software vendor.
              </p>
            </WizardField>

            <WizardField id="metrcUserKey" label="Metrc User API Key" required error={errors.metrcUserKey?.message}>
              <input id="metrcUserKey" type="password" placeholder="••••••••••••••••"
                autoComplete="new-password"
                aria-required="true" aria-invalid={!!errors.metrcUserKey}
                className={wizardInputClass(!!errors.metrcUserKey)}
                {...register('metrcUserKey')} />
            </WizardField>
          </div>
        )}
      </fieldset>

      {/* ID Verification provider */}
      <WizardField
        id="idVerificationProvider"
        label="ID Verification Method"
        required
        hint="Budtenders can always manually verify IDs at pickup regardless of this setting."
        error={errors.idVerificationProvider?.message}
      >
        <select id="idVerificationProvider" aria-required="true"
          className={wizardInputClass(!!errors.idVerificationProvider)}
          {...register('idVerificationProvider')}>
          <option value="manual">Manual only — budtender checks ID at counter or door</option>
          <option value="onfido">Onfido — automated ID scan + selfie verification</option>
          <option value="jumio">Jumio — automated ID scan + liveness check</option>
        </select>
      </WizardField>

      <WizardActions onBack={onBack} nextLabel="Continue to Hours →" />
    </form>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Onboarding/steps/StepHours.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Onboarding/steps/StepHours.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Onboarding/steps/StepHours.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Onboarding/steps/StepHours.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import type { OnboardingData } from '../OnboardingPage';
import { WizardActions, wizardInputClass } from '../OnboardingHelpers';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface StepHoursProps {
  defaultValues?: OnboardingData['hours'];
  onComplete: (data: OnboardingData['hours']) => void;
  onBack: () => void;
}

/**
 * StepHours — Operating schedule for each day of the week.
 *
 * The hours object maps directly to the dispensary's `operatingHours`
 * field that is returned in GET /dispensaries/nearby and shown on the
 * storefront. The closed toggle sets open/close to null in the backend.
 *
 * WCAG 1.3.1: Each day's row uses a <fieldset> + <legend> so screen readers
 *             identify the day context for the open/close time inputs.
 */
export function StepHours({ defaultValues, onComplete, onBack }: StepHoursProps) {
  const { register, handleSubmit, watch } = useForm<any>({
    defaultValues: defaultValues ?? {},
  });

  const watchedHours = watch();

  return (
    <form onSubmit={handleSubmit(data => onComplete(data))} noValidate className="space-y-3">
      <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] mb-4">
        Set your regular operating hours. These can be adjusted later in Settings → Dispensary.
      </p>

      {DAYS.map(day => {
        const isClosed = watchedHours?.[day]?.closed;

        return (
          <fieldset
            key={day}
            className={[
              'flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-[var(--p-radius-md)]',
              'border border-[var(--color-border)] bg-[var(--color-surface)]',
            ].join(' ')}
          >
            <legend className="sr-only">{day.charAt(0).toUpperCase() + day.slice(1)} hours</legend>

            {/* Day label */}
            <span className="w-28 capitalize font-semibold text-[var(--p-text-sm)] text-[var(--color-text)] flex-shrink-0">
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </span>

            {/* Closed toggle */}
            <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                className="h-4 w-4 rounded text-[var(--color-brand)] focus:ring-[var(--color-focus-ring)]"
                {...register(`${day}.closed`)}
                aria-label={`${day.charAt(0).toUpperCase() + day.slice(1)}: closed`}
              />
              <span className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">Closed</span>
            </label>

            {/* Open / close times — disabled when closed */}
            <div className={['flex items-center gap-3 flex-1', isClosed ? 'opacity-40' : ''].join(' ')}>
              <div className="flex flex-col gap-1">
                <label htmlFor={`${day}-open`} className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">Opens</label>
                <input
                  id={`${day}-open`}
                  type="time"
                  disabled={isClosed}
                  className={wizardInputClass(false)}
                  {...register(`${day}.open`)}
                />
              </div>
              <span aria-hidden="true" className="text-[var(--color-text-secondary)] mt-4">–</span>
              <div className="flex flex-col gap-1">
                <label htmlFor={`${day}-close`} className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">Closes</label>
                <input
                  id={`${day}-close`}
                  type="time"
                  disabled={isClosed}
                  className={wizardInputClass(false)}
                  {...register(`${day}.close`)}
                />
              </div>
            </div>
          </fieldset>
        );
      })}

      <WizardActions onBack={onBack} nextLabel="Continue to POS →" />
    </form>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Onboarding/steps/StepPOS.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Onboarding/steps/StepPOS.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Onboarding/steps/StepPOS.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Onboarding/steps/StepPOS.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { OnboardingData } from '../OnboardingPage';
import { WizardField, WizardActions, wizardInputClass } from '../OnboardingHelpers';

const schema = z.object({
  provider: z.enum(['none', 'dutchie', 'treez']),
  apiKey:   z.string().optional(),
  siteId:   z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.provider !== 'none') {
    if (!val.apiKey) ctx.addIssue({ path: ['apiKey'], code: 'custom', message: 'API key is required for this POS provider' });
    if (!val.siteId) ctx.addIssue({ path: ['siteId'], code: 'custom', message: 'Site ID is required for this POS provider' });
  }
});

type StepValues = z.infer<typeof schema>;

interface StepPOSProps {
  defaultValues?: Partial<StepValues>;
  onComplete: (data: OnboardingData['pos']) => void;
  onBack: () => void;
}

/**
 * StepPOS — Optional point-of-sale integration.
 *
 * CannaSaas supports Dutchie (GraphQL) and Treez (REST) via the adapter
 * pattern defined in the `pos` module (Sprint 11, architecture.md §4).
 * POS credentials are encrypted at rest via AWS KMS — the same pattern
 * used for Metrc keys. Skipping this step is safe; the POS can be
 * connected later in Settings → POS Integration.
 */
export function StepPOS({ defaultValues, onComplete, onBack }: StepPOSProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<StepValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { provider: 'none' },
  });

  const provider = watch('provider');

  return (
    <form onSubmit={handleSubmit(data => onComplete(data))} noValidate className="space-y-5">
      <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
        Connect your existing POS system for real-time inventory sync. This step is optional —
        you can also manage inventory directly in CannaSaas.
      </p>

      <WizardField id="provider" label="POS Provider" required error={errors.provider?.message}>
        <select id="provider" aria-required="true"
          className={wizardInputClass(!!errors.provider)} {...register('provider')}>
          <option value="none">No POS integration — manage inventory in CannaSaas</option>
          <option value="dutchie">Dutchie</option>
          <option value="treez">Treez</option>
        </select>
      </WizardField>

      {provider !== 'none' && (
        <div className="space-y-4 border border-[var(--color-border)] rounded-[var(--p-radius-md)] p-4">
          <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            {provider === 'dutchie'
              ? 'Enter your Dutchie API key and retailer ID. Credentials are stored encrypted and never exposed.'
              : 'Enter your Treez API key and site ID. Credentials are stored encrypted and never exposed.'}
          </p>

          <WizardField id="apiKey" label={provider === 'dutchie' ? 'Dutchie API Key' : 'Treez API Key'} required error={errors.apiKey?.message}>
            <input id="apiKey" type="password" autoComplete="new-password"
              aria-required="true" aria-invalid={!!errors.apiKey}
              className={wizardInputClass(!!errors.apiKey)} {...register('apiKey')} />
          </WizardField>

          <WizardField id="siteId" label={provider === 'dutchie' ? 'Retailer ID' : 'Treez Site ID'} required error={errors.siteId?.message}>
            <input id="siteId" type="text"
              aria-required="true" aria-invalid={!!errors.siteId}
              className={wizardInputClass(!!errors.siteId)} {...register('siteId')} />
          </WizardField>
        </div>
      )}

      <WizardActions onBack={onBack} nextLabel="Review & Launch →" />
    </form>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Onboarding/steps/StepReview.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Onboarding/steps/StepReview.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Onboarding/steps/StepReview.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Onboarding/steps/StepReview.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@cannasaas/ui';
import type { OnboardingData } from '../OnboardingPage';

interface StepReviewProps {
  data: OnboardingData;
  onBack: () => void;
  onFinish: () => void;
  isSubmitting: boolean;
}

/**
 * StepReview — Summary of all collected data before submission.
 *
 * This step does NOT re-validate — each preceding step was validated
 * individually and prevented forward navigation on error. The review
 * is a transparency step so managers can spot obvious mistakes before
 * the backend provisions schemas, uploads assets to S3, and activates
 * Metrc credentials.
 *
 * WCAG 3.3.4: Providing a review screen before submitting an action with
 *             significant consequences is an error prevention technique.
 *
 * On submit: POST /organizations → POST /companies → POST /dispensaries
 * → PUT /dispensaries/:id/branding → POST /compliance/metrc/configure
 * → POST /dispensaries/:id/pos/configure (if applicable)
 * → PATCH /organizations/:id { onboardingComplete: true }
 * The backend onboarding module (Sprint 7) wraps this in a transaction.
 */
export function StepReview({ data, onBack, onFinish, isSubmitting }: StepReviewProps) {
  const { organization, dispensary, branding, compliance, pos } = data;

  return (
    <div className="space-y-5">
      <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
        Review your setup below. Click "Launch Dispensary" to provision your account.
        This will create your organization schema, apply branding, and activate compliance monitoring.
      </p>

      {/* Organization */}
      <ReviewSection title="Organization">
        <ReviewRow label="Name"    value={organization?.name} />
        <ReviewRow label="Slug"    value={organization?.slug} />
        <ReviewRow label="Email"   value={organization?.contactEmail} />
        <ReviewRow label="Phone"   value={organization?.contactPhone} />
      </ReviewSection>

      {/* Dispensary */}
      <ReviewSection title="Dispensary">
        <ReviewRow label="Name"         value={dispensary?.name} />
        <ReviewRow label="License"      value={`${dispensary?.licenseType} · ${dispensary?.licenseNumber}`} />
        <ReviewRow label="State"        value={dispensary?.state} />
        <ReviewRow label="Address"      value={`${dispensary?.street}, ${dispensary?.city} ${dispensary?.zip}`} />
        <ReviewRow label="Delivery"     value={dispensary?.deliveryAvailable ? 'Enabled' : 'Disabled'} />
      </ReviewSection>

      {/* Branding */}
      <ReviewSection title="Branding">
        <ReviewRow label="Primary color"  value={
          <span className="flex items-center gap-2">
            <span
              className="inline-block w-4 h-4 rounded-sm border border-[var(--color-border)]"
              style={{ background: branding?.primaryColor }}
              aria-hidden="true"
            />
            {branding?.primaryColor}
          </span>
        } />
        <ReviewRow label="Heading font"   value={branding?.headingFont} />
        <ReviewRow label="Logo"           value={branding?.logoFile ? `${branding.logoFile.name} (ready to upload)` : 'Not uploaded'} />
        <ReviewRow label="Custom domain"  value={branding?.customDomain || 'Using CannaSaas subdomain'} />
      </ReviewSection>

      {/* Compliance */}
      <ReviewSection title="Compliance">
        <ReviewRow label="Metrc"          value={compliance?.metrcEnabled ? '✓ Enabled' : 'Disabled'} />
        <ReviewRow label="ID Verification" value={compliance?.idVerificationProvider} />
        <ReviewRow label="Purchase limits" value="Enforced automatically by CannaSaas" />
        <ReviewRow label="Audit logging"   value="Enabled — 7-year retention" />
      </ReviewSection>

      {/* POS */}
      <ReviewSection title="POS Integration">
        <ReviewRow label="Provider" value={pos?.provider === 'none' ? 'None (manage in CannaSaas)' : pos?.provider} />
      </ReviewSection>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
          ← Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          loadingText="Provisioning your dispensary…"
          onClick={onFinish}
          leftIcon={<CheckCircle size={18} aria-hidden="true" />}
          aria-label="Launch dispensary and complete setup"
        >
          Launch Dispensary
        </Button>
      </div>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      aria-labelledby={`review-${title.toLowerCase()}`}
      className="border border-[var(--color-border)] rounded-[var(--p-radius-md)] overflow-hidden"
    >
      <h2
        id={`review-${title.toLowerCase()}`}
        className="px-4 py-2.5 bg-[var(--color-bg-secondary)] font-semibold text-[var(--p-text-sm)] text-[var(--color-text)] border-b border-[var(--color-border)]"
      >
        {title}
      </h2>
      <dl className="divide-y divide-[var(--color-border)]">
        {children}
      </dl>
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5 text-[var(--p-text-sm)]">
      <dt className="text-[var(--color-text-secondary)]">{label}</dt>
      <dd className="font-medium text-[var(--color-text)] text-right max-w-[60%] truncate">
        {value ?? <span className="text-[var(--color-text-secondary)] italic">Not set</span>}
      </dd>
    </div>
  );
}
FILE_EOF

# ── apps/admin/src/pages/Onboarding/OnboardingHelpers.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/pages/Onboarding/OnboardingHelpers.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/pages/Onboarding/OnboardingHelpers.tsx" << 'FILE_EOF'
// apps/admin/src/pages/Onboarding/OnboardingHelpers.tsx
/**
 * OnboardingHelpers — Shared sub-components and utilities used across wizard steps.
 * Kept in a single file so each step imports one thing, not six.
 */
import React from 'react';
import { Button } from '@cannasaas/ui';

/** Tailwind input class for wizard fields — toggles error border state */
export function wizardInputClass(hasError: boolean): string {
  return [
    'w-full h-9 px-3 rounded-[var(--p-radius-md)] text-[var(--p-text-sm)]',
    'bg-[var(--color-bg)] text-[var(--color-text)]',
    'border transition-[border-color] duration-[var(--p-dur-fast)]',
    'placeholder:text-[var(--color-text-secondary)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
    hasError
      ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
      : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
  ].join(' ');
}

/** Wraps a label, input, optional hint, and optional error message. */
export function WizardField({
  id, label, required, hint, error, children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
        {label}
        {required && <span aria-hidden="true" className="ml-0.5 text-[var(--color-error)]">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[var(--p-text-xs)] text-[var(--color-error)]">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}

/** Back / Next button row used by every wizard step. */
export function WizardActions({
  onBack, nextLabel = 'Continue →',
}: {
  onBack?: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      ) : (
        <div />
      )}
      <Button type="submit" variant="primary">
        {nextLabel}
      </Button>
    </div>
  );
}
FILE_EOF

# ── apps/admin/src/guards/OnboardingGuard.tsx ──
print -P "%F{cyan}  Writing apps/admin/src/guards/OnboardingGuard.tsx%f"
cat > "$PLATFORM_ROOT/apps/admin/src/guards/OnboardingGuard.tsx" << 'FILE_EOF'
// apps/admin/src/guards/OnboardingGuard.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentOrganization } from '@cannasaas/stores';

/**
 * OnboardingGuard — Enforces the onboarding flow for new organizations.
 *
 * Newly provisioned organizations have `onboardingComplete: false`.
 * This guard wraps all authenticated admin routes. If onboarding is
 * incomplete, the user is redirected to /onboarding regardless of the
 * URL they attempted to visit. Once onboardingComplete becomes true
 * (set by the backend after StepReview submission), the guard dissolves
 * and the user can access any admin route normally.
 */
export function OnboardingGuard() {
  const organization = useCurrentOrganization();

  if (organization && !organization.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
FILE_EOF


# ── Summary ────────────────────────────────────────────────────
print -P "%F{green}✓ Section 8 complete — 24 files written%f"
echo ""
print -P "%F{cyan}Directory tree:%f"
tree "$PLATFORM_ROOT/apps/admin/src" 2>/dev/null || find "$PLATFORM_ROOT/apps/admin/src" -type f | sort
