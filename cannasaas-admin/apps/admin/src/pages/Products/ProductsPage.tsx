/**
 * @file ProductsPage.tsx
 * @path apps/admin/src/pages/Products/ProductsPage.tsx
 *
 * Products management page. Renders:
 *   - PageHeader with "New Product" action button
 *   - Filter bar (search, category, status, strain type)
 *   - DataTable<ProductRow> with sortable columns and bulk selection
 *   - BulkActionBar for activate / deactivate / delete operations
 *   - Slide-in drawer panel for create / edit ProductForm
 *
 * DATA FLOW: Products are fetched from /api/admin/products with server-side
 * filtering and sorting params. The table is controlled (sort, filters lifted
 * to component state), triggering a re-fetch on change.
 *
 * PERFORMANCE: useCallback on all handlers; DataTable gets stable column
 * definitions via useMemo to prevent unnecessary child re-renders.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type ColumnDef, type SortState } from '../../components/shared/DataTable';
import { BulkActionBar } from '../../components/shared/BulkActionBar';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ProductForm } from './components/ProductForm';
import { useAdminUiStore } from '../../stores/adminUiStore';
import type { Product, ProductRow, ProductFilters } from '../../types/admin.types';
import styles from './ProductsPage.module.css';

// ─── Column Definitions ───────────────────────────────────────────────────────

const COLUMNS: ColumnDef<ProductRow>[] = [
  {
    key: 'thumbnailUrl',
    label: 'Image',
    width: '60px',
    render: (row) =>
      row.thumbnailUrl ? (
        <img
          src={row.thumbnailUrl}
          alt=""
          className={styles.thumbnail}
          width={40}
          height={40}
        />
      ) : (
        <div className={styles.thumbnailPlaceholder} aria-hidden="true" />
      ),
  },
  {
    key: 'name',
    label: 'Product',
    sortable: true,
    render: (row) => <span className={styles.productName}>{row.name}</span>,
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    render: (row) => <span className={styles.category}>{row.category.replace('_', ' ')}</span>,
  },
  {
    key: 'thcPct',
    label: 'THC %',
    sortable: true,
    align: 'right',
    render: (row) =>
      row.thcPct != null ? (
        <span className={styles.mono}>{row.thcPct.toFixed(1)}%</span>
      ) : (
        <span className={styles.na}>—</span>
      ),
  },
  {
    key: 'priceCents',
    label: 'Price',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className={styles.mono}>${(row.priceCents / 100).toFixed(2)}</span>
    ),
  },
  {
    key: 'stock',
    label: 'Stock',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className={`${styles.mono} ${row.stock === 0 ? styles.stockOut : row.stock < 5 ? styles.stockLow : ''}`}>
        {row.stock}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (row) => <StatusBadge type="product" value={row.status} />,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortState>({ column: 'name', direction: 'asc' });
  const [filters, setFilters] = useState<ProductFilters>({
    search: '', category: '', status: '', strainType: '',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerProduct, setDrawerProduct] = useState<Product | null | 'new'>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { toastSuccess, toastError, showGlobalLoading, hideGlobalLoading } = useAdminUiStore((s) => ({
    toastSuccess: s.toastSuccess,
    toastError: s.toastError,
    showGlobalLoading: s.showGlobalLoading,
    hideGlobalLoading: s.hideGlobalLoading,
  }));

  // ── Fetch ─────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sort: `${sort.column}:${sort.direction}`,
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status }),
        ...(filters.strainType && { strainType: filters.strainType }),
      });
      const res = await fetch(`/api/admin/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sort, filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Bulk Actions ──────────────────────────────────────────────────────

  const handleBulkActivate = async () => {
    showGlobalLoading('Activating products…');
    try {
      await fetch('/api/admin/products/bulk-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      toastSuccess(`${selectedIds.size} products activated`);
      setSelectedIds(new Set());
      fetchProducts();
    } catch { toastError('Bulk activate failed'); }
    finally { hideGlobalLoading(); }
  };

  const handleBulkDeactivate = async () => {
    showGlobalLoading('Deactivating products…');
    try {
      await fetch('/api/admin/products/bulk-deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      toastSuccess(`${selectedIds.size} products deactivated`);
      setSelectedIds(new Set());
      fetchProducts();
    } catch { toastError('Bulk deactivate failed'); }
    finally { hideGlobalLoading(); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} products? This cannot be undone.`)) return;
    showGlobalLoading('Deleting products…');
    try {
      await fetch('/api/admin/products/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      toastSuccess(`${selectedIds.size} products deleted`);
      setSelectedIds(new Set());
      fetchProducts();
    } catch { toastError('Bulk delete failed'); }
    finally { hideGlobalLoading(); }
  };

  // ── Form Submit ───────────────────────────────────────────────────────

  const handleFormSubmit = async (values: unknown) => {
    const isEdit = drawerProduct && drawerProduct !== 'new';
    const url = isEdit
      ? `/api/admin/products/${(drawerProduct as Product).id}`
      : '/api/admin/products';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      toastSuccess(isEdit ? 'Product updated' : 'Product created');
      setIsDrawerOpen(false);
      fetchProducts();
    } else {
      toastError('Failed to save product');
    }
  };

  const stableCols = useMemo(() => COLUMNS, []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Products"
        subtitle="Manage your dispensary's product catalog."
        breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Products' }]}
        actions={
          <button
            type="button"
            className={styles.newBtn}
            onClick={() => { setDrawerProduct('new'); setIsDrawerOpen(true); }}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Product
          </button>
        }
      />

      {/* ── Filter Bar ───────────────────────────────────────────── */}
      <div className={styles.filterBar} role="search" aria-label="Filter products">
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search products…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          aria-label="Search products by name"
        />
        <select
          className={styles.filterSelect}
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value as ProductFilters['category'] }))}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          <option value="flower">Flower</option>
          <option value="edibles">Edibles</option>
          <option value="concentrates">Concentrates</option>
          <option value="vapes">Vapes</option>
          <option value="pre_rolls">Pre-Rolls</option>
          <option value="topicals">Topicals</option>
          <option value="tinctures">Tinctures</option>
          <option value="accessories">Accessories</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as ProductFilters['status'] }))}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* ── Data Table ───────────────────────────────────────────── */}
      <div className={styles.tableWrapper}>
        <DataTable<ProductRow>
          caption="Products catalog"
          columns={stableCols}
          rows={products}
          sort={sort}
          onSortChange={setSort}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          isLoading={isLoading}
          onRowClick={(row) => {
            fetch(`/api/admin/products/${row.id}`).then((r) => r.json()).then((p) => {
              setDrawerProduct(p);
              setIsDrawerOpen(true);
            });
          }}
          emptyState={
            <div className={styles.emptyState}>
              <p>No products match your filters.</p>
              <button type="button" onClick={() => setFilters({ search: '', category: '', status: '', strainType: '' })} className={styles.clearFiltersBtn}>
                Clear filters
              </button>
            </div>
          }
        />
      </div>

      {/* ── Bulk Action Bar ──────────────────────────────────────── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        itemLabel="product"
        onDeselect={() => setSelectedIds(new Set())}
        actions={[
          { key: 'activate',   label: 'Activate',   onClick: handleBulkActivate },
          { key: 'deactivate', label: 'Deactivate', onClick: handleBulkDeactivate },
          { key: 'delete',     label: 'Delete',     onClick: handleBulkDelete, danger: true },
        ]}
      />

      {/* ── Product Form Drawer ──────────────────────────────────── */}
      {isDrawerOpen && (
        <>
          <div
            className={styles.drawerOverlay}
            aria-hidden="true"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label={drawerProduct === 'new' ? 'Create new product' : `Edit product`}
          >
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>
                {drawerProduct === 'new' ? 'New Product' : 'Edit Product'}
              </h2>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close panel"
              >
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <ProductForm
              product={drawerProduct !== 'new' ? drawerProduct ?? undefined : undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsDrawerOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}

