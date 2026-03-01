# CannaSaas — Public Beta Deep-Dive Implementation Guide

**Sections 8.3 & 8.4 — Admin Portal (Missing Sections)**  
**Version 3.0 | February 2026**  
**Prepared for: Dennis Luken, Senior Architect / Site Lead**

> These two sections slot directly between **8.2 Analytics Dashboard** and **8.5 Compliance Dashboard** in `CannaSaas-PublicBeta-DeepDive.md`. All code follows the identical patterns, CSS token conventions, import aliases, and WCAG annotation style established in the surrounding document.

---

[↑ Back to top](#Table-of-Contents)

### 8.3 Product & Inventory Management

The products page is the operational core of the admin portal. It gives managers full CRUD control over the product catalog, per-variant inventory adjustment, bulk status toggling, and a low-stock alert surface. The page is composed of four isolated sub-components that are each independently testable: a toolbar, a data table, a create/edit form modal, and an inventory adjustment modal.

```tsx
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
```

```tsx
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
```

```tsx
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
```

```tsx
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
```

```tsx
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
```

---

[↑ Back to top](#Table-of-Contents)

### 8.4 Order Management & Fulfillment

The orders section gives admins and managers visibility across the full order lifecycle — from new pending orders through to completed or refunded states. It is split into a list view with status tab filtering and a detail view with inline status transitions, item breakdown, customer context, and the refund flow. Real-time updates are delivered by the WebSocket connection established in Section 11; this page falls back gracefully to polling when WebSocket is unavailable.

```tsx
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
```

```tsx
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
```

```tsx
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
```

```tsx
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
```

```tsx
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
```

---

[↑ Back to top](#Table-of-Contents)
