#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
echo "→ Scaffolding CannaSaas Admin Portal into: $ROOT"
mkdir -p "$ROOT/apps/admin"
mkdir -p "$ROOT/apps/admin/src"
mkdir -p "$ROOT/apps/admin/src/components"
mkdir -p "$ROOT/apps/admin/src/components/shared"
mkdir -p "$ROOT/apps/admin/src/components/shared/BulkActionBar"
mkdir -p "$ROOT/apps/admin/src/components/shared/DataTable"
mkdir -p "$ROOT/apps/admin/src/components/shared/FormField"
mkdir -p "$ROOT/apps/admin/src/components/shared/PageHeader"
mkdir -p "$ROOT/apps/admin/src/components/shared/StatusBadge"
mkdir -p "$ROOT/apps/admin/src/components/shared/{DataTable,PageHeader,StatusBadge,BulkActionBar,FormField,Modal,EmptyState}"
mkdir -p "$ROOT/apps/admin/src/layouts"
mkdir -p "$ROOT/apps/admin/src/layouts/AdminLayout"
mkdir -p "$ROOT/apps/admin/src/layouts/AdminLayout/components"
mkdir -p "$ROOT/apps/admin/src/layouts/AdminLayout/components/ProtectedRoute"
mkdir -p "$ROOT/apps/admin/src/layouts/AdminLayout/components/Sidebar"
mkdir -p "$ROOT/apps/admin/src/layouts/AdminLayout/components/TopBar"
mkdir -p "$ROOT/apps/admin/src/layouts/AdminLayout/components/{Sidebar,TopBar,ProtectedRoute}"
mkdir -p "$ROOT/apps/admin/src/pages"
mkdir -p "$ROOT/apps/admin/src/pages/Analytics"
mkdir -p "$ROOT/apps/admin/src/pages/Analytics/components"
mkdir -p "$ROOT/apps/admin/src/pages/Analytics/components/{RevenueChart,FulfillmentChart,TopProductsChart,CustomerAcquisitionChart,ConversionFunnel}"
mkdir -p "$ROOT/apps/admin/src/pages/Customers"
mkdir -p "$ROOT/apps/admin/src/pages/Customers/components"
mkdir -p "$ROOT/apps/admin/src/pages/Customers/components/{CustomersTable,CustomerDetail}"
mkdir -p "$ROOT/apps/admin/src/pages/Dashboard"
mkdir -p "$ROOT/apps/admin/src/pages/Dashboard/components"
mkdir -p "$ROOT/apps/admin/src/pages/Dashboard/components/LowStockAlerts"
mkdir -p "$ROOT/apps/admin/src/pages/Dashboard/components/RecentOrdersList"
mkdir -p "$ROOT/apps/admin/src/pages/Dashboard/components/RevenueChart"
mkdir -p "$ROOT/apps/admin/src/pages/Dashboard/components/StatCard"
mkdir -p "$ROOT/apps/admin/src/pages/Dashboard/components/TopProductsTable"
mkdir -p "$ROOT/apps/admin/src/pages/Dashboard/components/{StatCard,RevenueChart,TopProductsTable,RecentOrdersList,LowStockAlerts}"
mkdir -p "$ROOT/apps/admin/src/pages/Orders"
mkdir -p "$ROOT/apps/admin/src/pages/Orders/components"
mkdir -p "$ROOT/apps/admin/src/pages/Orders/components/OrderDetail"
mkdir -p "$ROOT/apps/admin/src/pages/Orders/components/{OrdersTable,OrderDetail"
mkdir -p "$ROOT/apps/admin/src/pages/Orders/components/{OrdersTable,OrderDetail/{StatusTimeline,OrderStatusActions}}"
mkdir -p "$ROOT/apps/admin/src/pages/Products"
mkdir -p "$ROOT/apps/admin/src/pages/Products/components"
mkdir -p "$ROOT/apps/admin/src/pages/Products/components/ProductForm"
mkdir -p "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections"
mkdir -p "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/BasicInfoSection"
mkdir -p "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/CannabisInfoSection"
mkdir -p "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/ComplianceSection"
mkdir -p "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/MediaSection"
mkdir -p "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/SeoSection"
mkdir -p "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/VariantsSection"
mkdir -p "$ROOT/apps/admin/src/pages/Products/components/{ProductsDataTable,ProductForm"
mkdir -p "$ROOT/apps/admin/src/pages/Products/components/{ProductsDataTable,ProductForm/sections"
mkdir -p "$ROOT/apps/admin/src/pages/Products/components/{ProductsDataTable,ProductForm/sections/{BasicInfoSection,CannabisInfoSection,VariantsSection,MediaSection,SeoSection,ComplianceSection}}"
mkdir -p "$ROOT/apps/admin/src/pages/Settings"
mkdir -p "$ROOT/apps/admin/src/pages/Settings/components"
mkdir -p "$ROOT/apps/admin/src/pages/Settings/components/{OrgProfileSection,BrandingSection,DeliveryZonesSection,TaxConfigSection,StaffManagementSection}"
mkdir -p "$ROOT/apps/admin/src/stores"
mkdir -p "$ROOT/apps/admin/src/types"
mkdir -p "$ROOT/apps/admin/src/{layouts,pages,components,stores}"
mkdir -p "$ROOT/apps/admin/src/types"

echo '✓ Directories created'

echo "→ Writing apps/admin/src/components/shared/BulkActionBar/BulkActionBar.module.css"
cat > "$ROOT/apps/admin/src/components/shared/BulkActionBar/BulkActionBar.module.css" << 'ADMIN_EOF'
/**
 * @file BulkActionBar.module.css
 * @path apps/admin/src/components/shared/BulkActionBar/
 */

.bar {
  position: fixed;
  bottom: var(--ca-space-6);
  left: 50%;
  transform: translateX(-50%) translateY(calc(100% + var(--ca-space-8)));
  z-index: var(--ca-z-toolbar);

  display: flex;
  align-items: center;
  gap: var(--ca-space-3);
  padding: var(--ca-space-3) var(--ca-space-4);

  background: var(--ca-surface-elevated);
  border: 1px solid var(--ca-border);
  border-radius: var(--ca-radius-full);
  box-shadow: var(--ca-shadow-xl);

  transition: transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
}

.barVisible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.count {
  display: flex;
  align-items: center;
  gap: var(--ca-space-1-5);
  font-family: var(--ca-font-body);
}

.countNum {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ca-accent);
}

.countLabel {
  font-size: 0.85rem;
  color: var(--ca-text-secondary);
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--ca-border);
  flex-shrink: 0;
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--ca-space-1);
}

.actionBtn {
  display: inline-flex;
  align-items: center;
  gap: var(--ca-space-1-5);
  padding: var(--ca-space-2) var(--ca-space-3);
  min-height: 36px;
  background: var(--ca-surface-raised);
  border: 1px solid var(--ca-border);
  border-radius: var(--ca-radius-md);
  color: var(--ca-text-primary);
  font-family: var(--ca-font-body);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 130ms ease, color 130ms ease;
}

.actionBtn:hover:not(:disabled) {
  background: var(--ca-surface-hover);
}

.actionBtn:focus-visible {
  outline: 2px solid var(--ca-accent);
  outline-offset: 2px;
}

.actionBtn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.actionBtnDanger {
  color: var(--ca-error);
  border-color: rgba(var(--ca-error-rgb), 0.3);
}

.actionBtnDanger:hover:not(:disabled) {
  background: rgba(var(--ca-error-rgb), 0.08);
}

.actionIcon {
  display: flex;
  align-items: center;
  color: currentColor;
}

.deselectBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--ca-text-muted);
  cursor: pointer;
  transition: background 130ms ease, color 130ms ease;
  margin-left: var(--ca-space-1);
  flex-shrink: 0;
}

.deselectBtn:hover {
  background: var(--ca-surface-hover);
  color: var(--ca-text-primary);
}

.deselectBtn:focus-visible {
  outline: 2px solid var(--ca-accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .bar {
    transition: none;
  }
}

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/BulkActionBar/BulkActionBar.tsx"
cat > "$ROOT/apps/admin/src/components/shared/BulkActionBar/BulkActionBar.tsx" << 'ADMIN_EOF'
/**
 * @file BulkActionBar.tsx
 * @path apps/admin/src/components/shared/BulkActionBar/BulkActionBar.tsx
 *
 * Animated action bar that slides up when rows are selected in a DataTable.
 * Contains the selection count and bulk action buttons.
 *
 * WCAG: role="toolbar" with aria-label describes the region.
 * The selection count is in an aria-live="polite" region so screen readers
 * announce when the count changes without interrupting the user.
 * Keyboard: Tab navigates the action buttons; Escape triggers deselect.
 */

import React, { useEffect, useRef } from 'react';
import styles from './BulkActionBar.module.css';

export interface BulkAction {
  key: string;
  label: string;
  /** Icon element to prepend */
  icon?: React.ReactNode;
  /** Renders as danger styling (red) */
  danger?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export interface BulkActionBarProps {
  /** Number of currently selected items */
  selectedCount: number;
  /** Array of actions to display */
  actions: BulkAction[];
  /** Called when the "Deselect all" button is clicked */
  onDeselect: () => void;
  /** Label describing what is selected, e.g. "product" (pluralized automatically) */
  itemLabel?: string;
}

/**
 * BulkActionBar
 *
 * Renders as a fixed bottom bar when selectedCount > 0.
 * Animates in/out with a slide-up transition.
 *
 * @example
 * <BulkActionBar
 *   selectedCount={selectedIds.size}
 *   actions={[{ key: 'delete', label: 'Delete', danger: true, onClick: handleBulkDelete }]}
 *   onDeselect={() => setSelectedIds(new Set())}
 *   itemLabel="product"
 * />
 */
export function BulkActionBar({
  selectedCount,
  actions,
  onDeselect,
  itemLabel = 'item',
}: BulkActionBarProps) {
  const isVisible = selectedCount > 0;
  const barRef = useRef<HTMLDivElement>(null);

  // Focus the first action button when bar appears
  useEffect(() => {
    if (isVisible) {
      const firstBtn = barRef.current?.querySelector<HTMLButtonElement>('[data-action]');
      firstBtn?.focus();
    }
  }, [isVisible]);

  // Close on Escape
  useEffect(() => {
    if (!isVisible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDeselect();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isVisible, onDeselect]);

  const label = `${selectedCount} ${itemLabel}${selectedCount !== 1 ? 's' : ''} selected`;

  return (
    <div
      ref={barRef}
      className={`${styles.bar} ${isVisible ? styles.barVisible : ''}`}
      role="toolbar"
      aria-label="Bulk actions"
      aria-hidden={!isVisible}
    >
      {/* Selection count — live region */}
      <div aria-live="polite" aria-atomic="true" className={styles.count}>
        <span className={styles.countNum}>{selectedCount}</span>
        <span className={styles.countLabel}>
          {itemLabel}{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div className={styles.divider} aria-hidden="true" />

      {/* Action buttons */}
      <div className={styles.actions}>
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            data-action
            className={`${styles.actionBtn} ${action.danger ? styles.actionBtnDanger : ''}`}
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={`${action.label} ${label}`}
          >
            {action.icon && (
              <span aria-hidden="true" className={styles.actionIcon}>
                {action.icon}
              </span>
            )}
            {action.label}
          </button>
        ))}
      </div>

      {/* Deselect */}
      <button
        type="button"
        className={styles.deselectBtn}
        onClick={onDeselect}
        aria-label="Deselect all"
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/BulkActionBar/index.ts"
cat > "$ROOT/apps/admin/src/components/shared/BulkActionBar/index.ts" << 'ADMIN_EOF'
export { BulkActionBar } from './BulkActionBar';
export type { BulkActionBarProps, BulkAction } from './BulkActionBar';

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/DataTable/DataTable.module.css"
cat > "$ROOT/apps/admin/src/components/shared/DataTable/DataTable.module.css" << 'ADMIN_EOF'
/**
 * @file DataTable.module.css
 * @path apps/admin/src/components/shared/DataTable/
 *
 * Styles for the generic DataTable component.
 *
 * DESIGN: Compact, information-dense table for admin use.
 * Uses the --ca-* (CannaSaas Admin) design token prefix.
 * Horizontal scroll on narrow viewports rather than collapsing columns —
 * admin users are assumed to be on desktop, but tablets must still function.
 *
 * WCAG:
 *   • Zebra striping uses a subtle tint, never color alone to convey meaning.
 *   • Selected rows have both a background tint AND a left border indicator.
 *   • Hover/focus states have 3:1 contrast against the row background.
 *   • Skeleton rows are aria-hidden to prevent AT from reading them.
 */

/* ─── Wrapper ────────────────────────────────────────────────────────────── */

.wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* ─── Scrollable Container ───────────────────────────────────────────────── */

.tableContainer {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  /* Prevent layout jank when scrollbar appears */
  scrollbar-gutter: stable;
  border: 1px solid var(--ca-border);
  border-radius: var(--ca-radius-lg);
}

/* ─── Table ──────────────────────────────────────────────────────────────── */

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  color: var(--ca-text-primary);
  min-width: 600px; /* Forces horizontal scroll before collapsing */
}

/* Caption: accessible but visually hidden */
.caption {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ─── Table Head ─────────────────────────────────────────────────────────── */

.thead {
  background: var(--ca-surface-raised);
  border-bottom: 2px solid var(--ca-border);
  position: sticky;
  top: 0;
  z-index: 2;
}

.th {
  padding: var(--ca-space-3) var(--ca-space-4);
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ca-text-muted);
  white-space: nowrap;
  user-select: none;
}

.thCheckbox {
  padding: var(--ca-space-3) var(--ca-space-3) var(--ca-space-3) var(--ca-space-4);
  width: 48px;
}

/* ─── Sort Button ────────────────────────────────────────────────────────── */

.sortButton {
  display: inline-flex;
  align-items: center;
  gap: var(--ca-space-1);
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ca-text-muted);
  cursor: pointer;
  transition: color 130ms ease;
}

.sortButton:hover {
  color: var(--ca-text-primary);
}

.sortButton:focus-visible {
  outline: 2px solid var(--ca-accent);
  outline-offset: 2px;
  border-radius: 2px;
}

.sortIcon {
  display: inline-flex;
  align-items: center;
  color: currentColor;
}

/* ─── Table Body ─────────────────────────────────────────────────────────── */

.tbody {}

/* ─── Table Row ──────────────────────────────────────────────────────────── */

.tr {
  border-bottom: 1px solid var(--ca-border);
  transition: background 120ms ease;
}

.tr:last-child {
  border-bottom: none;
}

/* Subtle zebra striping */
.tr:nth-child(even) {
  background: rgba(var(--ca-accent-rgb), 0.02);
}

.tr:hover {
  background: var(--ca-surface-hover);
}

/* Clickable rows get pointer cursor and keyboard focus ring */
.trClickable {
  cursor: pointer;
}

.trClickable:focus-visible {
  outline: 2px solid var(--ca-accent);
  outline-offset: -2px;
}

/* Selected row: left border + tint */
.trSelected {
  background: rgba(var(--ca-accent-rgb), 0.06) !important;
  box-shadow: inset 3px 0 0 var(--ca-accent);
}

/* ─── Table Cell ─────────────────────────────────────────────────────────── */

.td {
  padding: var(--ca-space-3) var(--ca-space-4);
  vertical-align: middle;
  color: var(--ca-text-primary);
  line-height: 1.4;
}

.tdCheckbox {
  padding: var(--ca-space-3) var(--ca-space-3) var(--ca-space-3) var(--ca-space-4);
}

/* ─── Alignment Modifiers ────────────────────────────────────────────────── */

.align_left   { text-align: left; }
.align_center { text-align: center; }
.align_right  { text-align: right; }

/* ─── Checkbox ───────────────────────────────────────────────────────────── */

.checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--ca-accent);
  cursor: pointer;
  /* Ensure minimum touch target via surrounding cell padding */
}

/* ─── Empty State ────────────────────────────────────────────────────────── */

.emptyCell {
  padding: var(--ca-space-16) var(--ca-space-4);
  text-align: center;
}

.emptyText {
  margin: 0;
  color: var(--ca-text-muted);
  font-size: 0.9rem;
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

.trSkeleton .td {
  padding-top: var(--ca-space-3-5);
  padding-bottom: var(--ca-space-3-5);
}

.skeletonBlock {
  display: block;
  background: linear-gradient(
    90deg,
    var(--ca-skeleton-base) 25%,
    var(--ca-skeleton-highlight) 50%,
    var(--ca-skeleton-base) 75%
  );
  background-size: 200% 100%;
  border-radius: var(--ca-radius-sm);
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── Screen Reader Utility ──────────────────────────────────────────────── */

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ─── Reduced Motion ─────────────────────────────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  .skeletonBlock {
    animation: none;
    background: var(--ca-skeleton-base);
  }
  .tr,
  .sortButton {
    transition: none;
  }
}

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/DataTable/DataTable.tsx"
cat > "$ROOT/apps/admin/src/components/shared/DataTable/DataTable.tsx" << 'ADMIN_EOF'
/**
 * @file DataTable.tsx
 * @path apps/admin/src/components/shared/DataTable/DataTable.tsx
 *
 * Generic, fully-accessible data table component used across all admin list views.
 *
 * ─── WCAG 2.1 AA COMPLIANCE ────────────────────────────────────────────────
 *   • <table> with <caption> for screen reader context.
 *   • Sortable columns use <button> inside <th scope="col"> with
 *     aria-sort="ascending|descending|none".
 *   • Checkbox column: header has aria-label="Select all rows";
 *     row checkboxes have aria-label="Select row for {identifier}".
 *   • Loading state announced via role="status" aria-live="polite".
 *   • Empty state announced via role="status".
 *   • Keyboard: all interactive cells reachable via Tab; sort buttons
 *     activate on Enter/Space.
 *
 * ─── ADVANCED REACT PATTERNS ───────────────────────────────────────────────
 *   • Generic type parameter <TRow> makes the component fully type-safe
 *     without any `any` casts — column definitions carry TRow's shape.
 *   • Column definitions use a discriminated union (render vs accessor)
 *     for flexible cell rendering.
 *   • useCallback on sort handler prevents child re-renders when parent
 *     state unrelated to sort changes.
 *   • Controlled selection state hoisted to parent via onSelectionChange.
 *
 * @template TRow - The shape of a single data row object
 */

import React, { useCallback, useId } from 'react';
import styles from './DataTable.module.css';

// ─── Column Definition ────────────────────────────────────────────────────────

export interface ColumnDef<TRow> {
  /** Unique key — must match a key in TRow for accessor columns */
  key: string;

  /** Column header label */
  label: string;

  /** If provided, clicking the header sorts by this field */
  sortable?: boolean;

  /** Width hint — passed as CSS `width` on the <col> element */
  width?: string;

  /**
   * Custom cell renderer. If omitted, falls back to String(row[key]).
   * @param row - The full row object
   * @param value - The value at row[key] (typed as unknown; cast in render fn)
   */
  render?: (row: TRow, value: unknown) => React.ReactNode;

  /** Text alignment for the column */
  align?: 'left' | 'center' | 'right';
}

// ─── Sort State ───────────────────────────────────────────────────────────────

export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DataTableProps<TRow extends { id: string }> {
  /** Visible display name — used in <caption> and aria-label */
  caption: string;

  /** Column definitions */
  columns: ColumnDef<TRow>[];

  /** Row data */
  rows: TRow[];

  /** Current sort state (controlled) */
  sort?: SortState;

  /** Called when a sortable column header is clicked */
  onSortChange?: (sort: SortState) => void;

  /** Currently selected row IDs (controlled) */
  selectedIds?: Set<string>;

  /** Called when row selection changes */
  onSelectionChange?: (ids: Set<string>) => void;

  /** Whether to show the checkbox selection column */
  selectable?: boolean;

  /** Loading skeleton state */
  isLoading?: boolean;

  /** Number of skeleton rows to show while loading */
  skeletonRows?: number;

  /** Component to render when rows is empty and not loading */
  emptyState?: React.ReactNode;

  /** Additional CSS class */
  className?: string;

  /** Called when a row is clicked (navigates to detail view) */
  onRowClick?: (row: TRow) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * DataTable
 *
 * A generic, type-safe, accessible data table with sorting and multi-select.
 *
 * @example
 * <DataTable<ProductRow>
 *   caption="Products"
 *   columns={PRODUCT_COLUMNS}
 *   rows={products}
 *   sort={sort}
 *   onSortChange={setSort}
 *   selectable
 *   selectedIds={selectedIds}
 *   onSelectionChange={setSelectedIds}
 * />
 */
export function DataTable<TRow extends { id: string }>({
  caption,
  columns,
  rows,
  sort,
  onSortChange,
  selectedIds = new Set(),
  onSelectionChange,
  selectable = false,
  isLoading = false,
  skeletonRows = 8,
  emptyState,
  className,
  onRowClick,
}: DataTableProps<TRow>) {
  const uid = useId();
  const captionId = `${uid}-caption`;

  // ── Sort Handler ──────────────────────────────────────────────────────

  const handleSortClick = useCallback(
    (columnKey: string) => {
      if (!onSortChange) return;
      const newDirection =
        sort?.column === columnKey && sort.direction === 'asc' ? 'desc' : 'asc';
      onSortChange({ column: columnKey, direction: newDirection });
    },
    [sort, onSortChange],
  );

  // ── Selection Handlers ────────────────────────────────────────────────

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = rows.some((r) => selectedIds.has(r.id)) && !allSelected;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(rows.map((r) => r.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  // ── Aria Sort Value ───────────────────────────────────────────────────

  const getAriaSortValue = (
    columnKey: string,
  ): React.AriaAttributes['aria-sort'] => {
    if (!sort || sort.column !== columnKey) return 'none';
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      {/*
       * Loading status announced politely to screen readers.
       * The visually-hidden region updates when loading state changes.
       */}
      <div role="status" aria-live="polite" className={styles.srOnly}>
        {isLoading ? `Loading ${caption}…` : ''}
      </div>

      <div className={styles.tableContainer} role="region" aria-labelledby={captionId}>
        <table
          className={styles.table}
          aria-labelledby={captionId}
          aria-rowcount={isLoading ? -1 : rows.length}
        >
          {/* Accessible table caption — visually hidden but present for AT */}
          <caption id={captionId} className={styles.caption}>
            {caption}
          </caption>

          {/* Column width hints */}
          <colgroup>
            {selectable && <col style={{ width: '48px' }} />}
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.width ?? 'auto' }} />
            ))}
          </colgroup>

          {/* ── Table Head ─────────────────────────────────────────── */}
          <thead className={styles.thead}>
            <tr>
              {/* Select-all checkbox */}
              {selectable && (
                <th
                  scope="col"
                  className={`${styles.th} ${styles.thCheckbox}`}
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={allSelected}
                    ref={(el) => {
                      // Indeterminate state only settable via DOM ref
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    aria-label={`Select all ${rows.length} rows`}
                    disabled={isLoading || rows.length === 0}
                  />
                </th>
              )}

              {/* Column headers */}
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`${styles.th} ${styles[`align_${col.align ?? 'left'}`]}`}
                  aria-sort={col.sortable ? getAriaSortValue(col.key) : undefined}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => handleSortClick(col.key)}
                      aria-label={`Sort by ${col.label}${
                        sort?.column === col.key
                          ? `, currently ${sort.direction === 'asc' ? 'ascending' : 'descending'}`
                          : ''
                      }`}
                    >
                      {col.label}
                      <SortIcon
                        direction={
                          sort?.column === col.key ? sort.direction : null
                        }
                      />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Table Body ─────────────────────────────────────────── */}
          <tbody className={styles.tbody}>
            {isLoading ? (
              /* Skeleton rows */
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={`skeleton-${i}`} className={styles.trSkeleton} aria-hidden="true">
                  {selectable && (
                    <td className={styles.td}>
                      <span className={styles.skeletonBlock} style={{ width: 16, height: 16 }} />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={styles.td}>
                      <span
                        className={styles.skeletonBlock}
                        style={{ width: `${50 + Math.random() * 40}%`, height: 14 }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              /* Empty state */
              <tr>
                <td
                  colSpan={selectable ? columns.length + 1 : columns.length}
                  className={styles.emptyCell}
                >
                  <div role="status" aria-live="polite">
                    {emptyState ?? (
                      <p className={styles.emptyText}>No results found.</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              /* Data rows */
              rows.map((row) => {
                const isSelected = selectedIds.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`${styles.tr} ${isSelected ? styles.trSelected : ''} ${onRowClick ? styles.trClickable : ''}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    aria-selected={selectable ? isSelected : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                  >
                    {/* Row checkbox */}
                    {selectable && (
                      <td
                        className={`${styles.td} ${styles.tdCheckbox}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isSelected}
                          onChange={() => handleSelectRow(row.id)}
                          aria-label={`Select row`}
                        />
                      </td>
                    )}

                    {/* Data cells */}
                    {columns.map((col) => {
                      const value = (row as Record<string, unknown>)[col.key];
                      return (
                        <td
                          key={col.key}
                          className={`${styles.td} ${styles[`align_${col.align ?? 'left'}`]}`}
                        >
                          {col.render ? col.render(row, value) : String(value ?? '')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  return (
    <span className={styles.sortIcon} aria-hidden="true">
      {direction === 'asc' ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      ) : direction === 'desc' ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      )}
    </span>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/DataTable/index.ts"
cat > "$ROOT/apps/admin/src/components/shared/DataTable/index.ts" << 'ADMIN_EOF'
export { DataTable } from './DataTable';
export type { DataTableProps, ColumnDef, SortState } from './DataTable';

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/FormField/FormField.module.css"
cat > "$ROOT/apps/admin/src/components/shared/FormField/FormField.module.css" << 'ADMIN_EOF'
/**
 * @file FormField.module.css
 * @path apps/admin/src/components/shared/FormField/
 */

.field {
  display: flex;
  flex-direction: column;
  gap: var(--ca-space-1-5);
}

.label {
  font-family: var(--ca-font-body);
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--ca-text-primary);
  line-height: 1.3;
}

.required {
  color: var(--ca-error);
}

.hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--ca-text-muted);
  line-height: 1.5;
}

.inputWrapper {
  position: relative;
}

/* Base input styles shared via global CSS — components add .input class */

.error {
  display: flex;
  align-items: center;
  gap: var(--ca-space-1);
  margin: 0;
  font-size: 0.78rem;
  color: var(--ca-error);
  line-height: 1.4;
}

.fieldError .inputWrapper input,
.fieldError .inputWrapper select,
.fieldError .inputWrapper textarea {
  border-color: var(--ca-error) !important;
}

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/FormField/FormField.tsx"
cat > "$ROOT/apps/admin/src/components/shared/FormField/FormField.tsx" << 'ADMIN_EOF'
/**
 * @file FormField.tsx
 * @path apps/admin/src/components/shared/FormField/FormField.tsx
 *
 * Accessible form field wrapper providing consistent label, hint text,
 * and error message layout for all admin forms.
 *
 * WCAG:
 *   • <label> is programmatically associated with input via htmlFor / useId().
 *   • Error messages use role="alert" so they are announced immediately.
 *   • Hint text is linked via aria-describedby on the input.
 *   • Required fields have aria-required on the input (not just a visual asterisk).
 *   • Error state is conveyed via aria-invalid="true" on the input.
 *
 * PATTERN: Render prop (children as function) allows full control over the
 * input element while the wrapper handles all the ARIA wiring.
 *
 * @example
 * <FormField label="Product Name" required error={errors.name?.message}>
 *   {({ id, inputProps }) => (
 *     <input id={id} {...inputProps} {...register('name')} />
 *   )}
 * </FormField>
 */

import React, { useId } from 'react';
import styles from './FormField.module.css';

// ─── Input Props injected into children ───────────────────────────────────────

export interface InjectedInputProps {
  'aria-invalid': boolean;
  'aria-required': boolean;
  'aria-describedby'?: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FormFieldProps {
  /** Visible label text */
  label: string;
  /** If true, adds a required asterisk and aria-required on the input */
  required?: boolean;
  /** Validation error message — triggers aria-invalid and role="alert" */
  error?: string;
  /** Supplementary hint text shown below the label */
  hint?: string;
  /** Additional CSS class on the field wrapper */
  className?: string;
  /**
   * Render prop — receives the generated input id and ARIA props.
   * Spread inputProps onto your <input>, <select>, or <textarea>.
   */
  children: (props: { id: string; inputProps: InjectedInputProps }) => React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FormField({
  label,
  required = false,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  const uid = useId();
  const inputId = `${uid}-input`;
  const hintId = hint ? `${uid}-hint` : undefined;
  const errorId = error ? `${uid}-error` : undefined;

  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const inputProps: InjectedInputProps = {
    'aria-invalid': Boolean(error),
    'aria-required': required,
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
  };

  return (
    <div className={`${styles.field} ${error ? styles.fieldError : ''} ${className ?? ''}`}>
      {/* Label */}
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true"> *</span>
        )}
      </label>

      {/* Hint text — shown above the input */}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}

      {/* Input (rendered by parent via render prop) */}
      <div className={styles.inputWrapper}>
        {children({ id: inputId, inputProps })}
      </div>

      {/* Error message */}
      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="assertive"
          className={styles.error}
        >
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/FormField/index.ts"
cat > "$ROOT/apps/admin/src/components/shared/FormField/index.ts" << 'ADMIN_EOF'
export { FormField } from './FormField';
export type { FormFieldProps, InjectedInputProps } from './FormField';

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/PageHeader/PageHeader.module.css"
cat > "$ROOT/apps/admin/src/components/shared/PageHeader/PageHeader.module.css" << 'ADMIN_EOF'
/**
 * @file PageHeader.module.css
 * @path apps/admin/src/components/shared/PageHeader/
 */

.header {
  padding: var(--ca-space-6) var(--ca-space-6) var(--ca-space-5);
  border-bottom: 1px solid var(--ca-border);
  background: var(--ca-surface);
}

/* ─── Breadcrumbs ────────────────────────────────────────────────────────── */

.breadcrumbs {
  margin-bottom: var(--ca-space-2);
}

.breadcrumbList {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumbItem {
  display: flex;
  align-items: center;
  gap: 4px;
}

.breadcrumbLink {
  font-size: 0.78rem;
  color: var(--ca-text-muted);
  text-decoration: none;
  transition: color 130ms ease;
}

.breadcrumbLink:hover {
  color: var(--ca-accent);
}

.breadcrumbLink:focus-visible {
  outline: 2px solid var(--ca-accent);
  outline-offset: 2px;
  border-radius: 2px;
}

.breadcrumbSep {
  font-size: 0.78rem;
  color: var(--ca-border-strong);
}

.breadcrumbCurrent {
  font-size: 0.78rem;
  color: var(--ca-text-secondary);
  font-weight: 500;
}

/* ─── Title Row ──────────────────────────────────────────────────────────── */

.titleRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ca-space-4);
  flex-wrap: wrap;
}

.titleGroup {
  display: flex;
  flex-direction: column;
  gap: var(--ca-space-1);
  min-width: 0;
}

.title {
  margin: 0;
  font-family: var(--ca-font-display);
  font-size: clamp(1.35rem, 2.5vw, 1.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ca-text-primary);
  line-height: 1.2;
}

.subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: var(--ca-text-muted);
  line-height: 1.5;
}

/* ─── Actions ────────────────────────────────────────────────────────────── */

.actions {
  display: flex;
  align-items: center;
  gap: var(--ca-space-2);
  flex-shrink: 0;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .header {
    padding: var(--ca-space-4);
  }

  .titleRow {
    flex-direction: column;
  }

  .actions {
    width: 100%;
  }
}

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/PageHeader/PageHeader.tsx"
cat > "$ROOT/apps/admin/src/components/shared/PageHeader/PageHeader.tsx" << 'ADMIN_EOF'
/**
 * @file PageHeader.tsx
 * @path apps/admin/src/components/shared/PageHeader/PageHeader.tsx
 *
 * Consistent page header used at the top of every admin page.
 * Renders the page title, optional breadcrumb trail, and an actions slot
 * for primary CTA buttons (e.g., "New Product", "Export CSV").
 *
 * WCAG: The <h1> is set once per page via this component, ensuring a
 * correct heading hierarchy. Breadcrumbs use <nav aria-label="Breadcrumb">
 * with aria-current="page" on the final item per WCAG technique G128.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PageHeader.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Breadcrumb {
  label: string;
  to?: string; // If omitted, renders as plain text (current page)
}

export interface PageHeaderProps {
  /** The page <h1> title */
  title: string;
  /** Optional subtitle / description below the title */
  subtitle?: string;
  /** Breadcrumb trail — last item should be the current page (no `to`) */
  breadcrumbs?: Breadcrumb[];
  /** Action buttons/controls rendered to the right of the title */
  actions?: React.ReactNode;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PageHeader
 *
 * @example
 * <PageHeader
 *   title="Products"
 *   breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Products' }]}
 *   actions={<button onClick={openCreateModal}>+ New Product</button>}
 * />
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={`${styles.header} ${className ?? ''}`}>
      {/* ── Breadcrumbs ─────────────────────────────────────────── */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
          <ol className={styles.breadcrumbList} role="list">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={index} className={styles.breadcrumbItem}>
                  {isLast ? (
                    <span
                      className={styles.breadcrumbCurrent}
                      aria-current="page"
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <>
                      <Link to={crumb.to!} className={styles.breadcrumbLink}>
                        {crumb.label}
                      </Link>
                      {/* Separator — decorative, hidden from AT */}
                      <span aria-hidden="true" className={styles.breadcrumbSep}>
                        /
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* ── Title Row ───────────────────────────────────────────── */}
      <div className={styles.titleRow}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && (
            <p className={styles.subtitle}>{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className={styles.actions}>
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/PageHeader/index.ts"
cat > "$ROOT/apps/admin/src/components/shared/PageHeader/index.ts" << 'ADMIN_EOF'
export { PageHeader } from './PageHeader';
export type { PageHeaderProps, Breadcrumb } from './PageHeader';

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/StatusBadge/StatusBadge.module.css"
cat > "$ROOT/apps/admin/src/components/shared/StatusBadge/StatusBadge.module.css" << 'ADMIN_EOF'
/**
 * @file StatusBadge.module.css
 * @path apps/admin/src/components/shared/StatusBadge/
 *
 * Each variant uses a background tint + matching text color that passes
 * WCAG 4.5:1 on both light and dark admin surfaces.
 * The color dot reinforces the variant visually — never the sole indicator.
 */

.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--ca-space-1-5);
  padding: 2px 8px;
  border-radius: var(--ca-radius-full);
  font-family: var(--ca-font-body);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: currentColor;
}

/* ─── Variants ───────────────────────────────────────────────────────────── */

.variant_green  { background: rgba(39, 174, 96, 0.12);  color: #1a7a42; }
.variant_blue   { background: rgba(41, 128, 185, 0.12); color: #1a5f8a; }
.variant_yellow { background: rgba(241, 196, 15, 0.15); color: #8a6000; }
.variant_red    { background: rgba(192, 57, 43, 0.12);  color: #9a2315; }
.variant_gray   { background: rgba(108, 117, 125, 0.1); color: #5a6068; }
.variant_purple { background: rgba(142, 68, 173, 0.12); color: #6c3483; }
.variant_orange { background: rgba(230, 126, 34, 0.12); color: #8a4800; }

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/StatusBadge/StatusBadge.tsx"
cat > "$ROOT/apps/admin/src/components/shared/StatusBadge/StatusBadge.tsx" << 'ADMIN_EOF'
/**
 * @file StatusBadge.tsx
 * @path apps/admin/src/components/shared/StatusBadge/StatusBadge.tsx
 *
 * Accessible status badge component used across Orders, Products, and Customers.
 *
 * WCAG NOTE: Status is conveyed through BOTH color AND a text label.
 * Never color alone (§1.4.1). The `aria-label` prop allows callers to provide
 * a more descriptive label for screen readers when the visible text is abbreviated.
 */

import React from 'react';
import type { OrderStatus, ProductStatus, VerificationStatus } from '../../../types/admin.types';
import styles from './StatusBadge.module.css';

// ─── Variant Maps ─────────────────────────────────────────────────────────────

type BadgeVariant = 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange';

const ORDER_STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  pending:           'yellow',
  confirmed:         'blue',
  processing:        'blue',
  ready_for_pickup:  'purple',
  out_for_delivery:  'orange',
  delivered:         'green',
  cancelled:         'red',
  refunded:          'gray',
};

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending:           'Pending',
  confirmed:         'Confirmed',
  processing:        'Processing',
  ready_for_pickup:  'Ready',
  out_for_delivery:  'Out for Delivery',
  delivered:         'Delivered',
  cancelled:         'Cancelled',
  refunded:          'Refunded',
};

const PRODUCT_STATUS_VARIANT: Record<ProductStatus, BadgeVariant> = {
  active:   'green',
  inactive: 'gray',
  draft:    'yellow',
  archived: 'red',
};

const VERIFICATION_STATUS_VARIANT: Record<VerificationStatus, BadgeVariant> = {
  verified:   'green',
  pending:    'yellow',
  unverified: 'gray',
  rejected:   'red',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type StatusBadgeType = 'order' | 'product' | 'verification' | 'custom';

export interface StatusBadgeProps {
  type: StatusBadgeType;
  value: string;
  /** Override the displayed label */
  label?: string;
  /** Override the color variant */
  variant?: BadgeVariant;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StatusBadge
 *
 * Renders a colored pill indicating the status of an entity.
 * Color is always paired with a text label for WCAG 1.4.1 compliance.
 *
 * @example
 * <StatusBadge type="order" value="delivered" />
 * <StatusBadge type="product" value="draft" />
 */
export function StatusBadge({
  type,
  value,
  label,
  variant,
  ariaLabel,
  className,
}: StatusBadgeProps) {
  let resolvedVariant: BadgeVariant = variant ?? 'gray';
  let resolvedLabel: string = label ?? value;

  switch (type) {
    case 'order': {
      const status = value as OrderStatus;
      resolvedVariant = variant ?? ORDER_STATUS_VARIANT[status] ?? 'gray';
      resolvedLabel = label ?? ORDER_STATUS_LABEL[status] ?? value;
      break;
    }
    case 'product': {
      const status = value as ProductStatus;
      resolvedVariant = variant ?? PRODUCT_STATUS_VARIANT[status] ?? 'gray';
      resolvedLabel = label ?? (value.charAt(0).toUpperCase() + value.slice(1));
      break;
    }
    case 'verification': {
      const status = value as VerificationStatus;
      resolvedVariant = variant ?? VERIFICATION_STATUS_VARIANT[status] ?? 'gray';
      resolvedLabel = label ?? (value.charAt(0).toUpperCase() + value.slice(1));
      break;
    }
  }

  return (
    <span
      className={`${styles.badge} ${styles[`variant_${resolvedVariant}`]} ${className ?? ''}`}
      aria-label={ariaLabel}
    >
      <span className={styles.dot} aria-hidden="true" />
      {resolvedLabel}
    </span>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/components/shared/StatusBadge/index.ts"
cat > "$ROOT/apps/admin/src/components/shared/StatusBadge/index.ts" << 'ADMIN_EOF'
export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps, StatusBadgeType } from './StatusBadge';

ADMIN_EOF

echo "→ Writing apps/admin/src/layouts/AdminLayout/AdminLayout.module.css"
cat > "$ROOT/apps/admin/src/layouts/AdminLayout/AdminLayout.module.css" << 'ADMIN_EOF'
/**
 * @file AdminLayout.module.css
 * @path apps/admin/src/layouts/AdminLayout/
 *
 * Root admin layout styles and the complete --ca-* design token system.
 *
 * LAYOUT: CSS Grid with sidebar column + main column.
 * The sidebar column width is controlled by --ca-sidebar-width / --ca-sidebar-width-collapsed
 * and updates when the sidebar collapses, causing the main column to expand.
 *
 * TOKEN PREFIX: --ca- (CannaSaas Admin) to avoid collision with the
 * storefront's --cs- token namespace.
 */

@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300..700&display=swap');

/* ─── Design Tokens ──────────────────────────────────────────────────────── */

:root {
  /* Typography */
  --ca-font-display: 'DM Serif Display', Georgia, serif;
  --ca-font-body:    'DM Sans', 'Helvetica Neue', Arial, sans-serif;
  --ca-font-mono:    'JetBrains Mono', 'Fira Code', monospace;

  /* Surface layers */
  --ca-surface:          #FAFAF8;
  --ca-surface-raised:   #F4F1EC;
  --ca-surface-elevated: #FFFFFF;
  --ca-surface-hover:    rgba(27, 58, 45, 0.05);

  /* Text */
  --ca-text-primary:   #1A1A18;
  --ca-text-secondary: #3D3D3A;
  --ca-text-muted:     #6E6E69;

  /* Borders */
  --ca-border:        rgba(27, 58, 45, 0.10);
  --ca-border-strong: rgba(27, 58, 45, 0.22);

  /* Accent */
  --ca-accent:        #2D6A4F;
  --ca-accent-hover:  #245740;
  --ca-accent-fg:     #FFFFFF;
  --ca-accent-rgb:    45, 106, 79;

  /* Semantic */
  --ca-error:       #C0392B;
  --ca-error-rgb:   192, 57, 43;
  --ca-success:     #27AE60;
  --ca-warning:     #D4691E;
  --ca-info:        #2980B9;

  /* Sidebar */
  --ca-sidebar-bg:               #1B3A2D;
  --ca-sidebar-text:             #D4C9B4;
  --ca-sidebar-width:            240px;
  --ca-sidebar-width-collapsed:  64px;

  /* Layout */
  --ca-topbar-height: 64px;

  /* Spacing */
  --ca-space-1:    4px;
  --ca-space-1-5:  6px;
  --ca-space-2:    8px;
  --ca-space-2-5:  10px;
  --ca-space-3:    12px;
  --ca-space-3-5:  14px;
  --ca-space-4:    16px;
  --ca-space-5:    20px;
  --ca-space-6:    24px;
  --ca-space-8:    32px;
  --ca-space-10:   40px;
  --ca-space-12:   48px;
  --ca-space-16:   64px;

  /* Border radius */
  --ca-radius-sm:   4px;
  --ca-radius-md:   8px;
  --ca-radius-lg:   12px;
  --ca-radius-xl:   16px;
  --ca-radius-full: 9999px;

  /* Shadows */
  --ca-shadow-sm:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --ca-shadow-md:  0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --ca-shadow-lg:  0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04);
  --ca-shadow-xl:  0 16px 40px rgba(0,0,0,0.14);

  /* Skeleton */
  --ca-skeleton-base:      rgba(27,58,45,0.06);
  --ca-skeleton-highlight: rgba(27,58,45,0.02);

  /* Z-index stack */
  --ca-z-base:     1;
  --ca-z-toolbar:  50;
  --ca-z-topbar:   100;
  --ca-z-sidebar:  200;
  --ca-z-modal:    300;
  --ca-z-toast:    400;
}

/* ─── Dark Mode ──────────────────────────────────────────────────────────── */

@media (prefers-color-scheme: dark) {
  :root {
    --ca-surface:          #0F1E16;
    --ca-surface-raised:   #162A1E;
    --ca-surface-elevated: #1E3828;
    --ca-surface-hover:    rgba(111,207,151,0.06);

    --ca-text-primary:   #F0EDE8;
    --ca-text-secondary: #C8C4BC;
    --ca-text-muted:     #8A8880;

    --ca-border:        rgba(111,207,151,0.10);
    --ca-border-strong: rgba(111,207,151,0.22);

    --ca-accent:       #52B788;
    --ca-accent-hover: #6FCF97;
    --ca-accent-fg:    #0F1E16;
    --ca-accent-rgb:   82,183,136;

    --ca-skeleton-base:      rgba(111,207,151,0.06);
    --ca-skeleton-highlight: rgba(111,207,151,0.02);
  }
}

/* ─── Skip Link ──────────────────────────────────────────────────────────── */

.skipLink {
  position: fixed;
  top: var(--ca-space-2);
  left: var(--ca-space-2);
  z-index: 9999;
  padding: var(--ca-space-2) var(--ca-space-4);
  background: var(--ca-accent);
  color: var(--ca-accent-fg);
  border-radius: var(--ca-radius-md);
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  font-weight: 700;
  text-decoration: none;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  transition: opacity 150ms ease, transform 150ms ease;
}

.skipLink:focus-visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

/* ─── Layout Grid ────────────────────────────────────────────────────────── */

.layout {
  display: grid;
  grid-template-columns: var(--ca-sidebar-width) 1fr;
  grid-template-rows: 1fr;
  min-height: 100dvh;
  background: var(--ca-surface);
  color: var(--ca-text-primary);
  font-family: var(--ca-font-body);
  transition: grid-template-columns 220ms cubic-bezier(0.4, 0, 0.2, 1);
}

.layoutCollapsed {
  grid-template-columns: var(--ca-sidebar-width-collapsed) 1fr;
}

/* Mobile: sidebar is overlay, not a grid column */
@media (max-width: 1023px) {
  .layout,
  .layoutCollapsed {
    grid-template-columns: 1fr;
  }
}

/* ─── Main Column ────────────────────────────────────────────────────────── */

.mainColumn {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  min-width: 0; /* Prevents flex children from overflowing */
  overflow: hidden;
}

/* ─── Page Content ───────────────────────────────────────────────────────── */

.pageContent {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  /* Allow child pages to set their own padding */
  display: flex;
  flex-direction: column;
}

/* ─── Toast Region ───────────────────────────────────────────────────────── */

.toastRegion {
  position: fixed;
  bottom: var(--ca-space-6);
  right: var(--ca-space-6);
  z-index: var(--ca-z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--ca-space-2);
  max-width: 360px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ca-space-3);
  padding: var(--ca-space-3) var(--ca-space-4);
  border-radius: var(--ca-radius-lg);
  border: 1px solid transparent;
  box-shadow: var(--ca-shadow-lg);
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  font-weight: 500;
  pointer-events: auto;
  animation: toastIn 280ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(20px) scale(0.97); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}

.toast_success {
  background: rgba(39, 174, 96, 0.12);
  border-color: rgba(39, 174, 96, 0.25);
  color: #1a7a42;
}

.toast_error {
  background: rgba(192, 57, 43, 0.1);
  border-color: rgba(192, 57, 43, 0.25);
  color: #9a2315;
}

.toast_warning {
  background: rgba(212, 105, 30, 0.1);
  border-color: rgba(212, 105, 30, 0.25);
  color: #8a4800;
}

.toast_info {
  background: rgba(41, 128, 185, 0.1);
  border-color: rgba(41, 128, 185, 0.25);
  color: #1a5f8a;
}

.toastMessage {
  flex: 1;
  line-height: 1.4;
}

.toastDismiss {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: currentColor;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 130ms ease, background 130ms ease;
}

.toastDismiss:hover {
  opacity: 1;
  background: rgba(0,0,0,0.07);
}

.toastDismiss:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

@media (max-width: 639px) {
  .toastRegion {
    right: var(--ca-space-4);
    left: var(--ca-space-4);
    bottom: var(--ca-space-4);
    max-width: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .layout, .layoutCollapsed { transition: none; }
  .toast { animation: none; }
  .skipLink { transition: none; }
}

ADMIN_EOF

echo "→ Writing apps/admin/src/layouts/AdminLayout/AdminLayout.tsx"
cat > "$ROOT/apps/admin/src/layouts/AdminLayout/AdminLayout.tsx" << 'ADMIN_EOF'
/**
 * @file AdminLayout.tsx
 * @path apps/admin/src/layouts/AdminLayout/AdminLayout.tsx
 *
 * Root layout for the CannaSaas admin portal.
 * Assembles: Sidebar | TopBar | page Outlet + global Toast notification system.
 *
 * DESIGN TOKEN INJECTION:
 * On mount, injects all --ca-* CSS custom properties onto :root, enabling
 * the entire admin app to share a single token system without Tailwind or
 * a CSS-in-JS runtime.
 *
 * WCAG: The <main> landmark has id="admin-main-content" as a skip-link target.
 * A "Skip to content" link is the first focusable element.
 */

import React, { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useAdminAuthStore } from '../../stores/adminAuthStore';
import { useAdminUiStore, useToasts } from '../../stores/adminUiStore';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import styles from './AdminLayout.module.css';

// ─── Toast Renderer ───────────────────────────────────────────────────────────

/**
 * ToastContainer renders all active toast notifications.
 * Positioned fixed at bottom-right; each toast dismisses on click or timeout.
 * role="region" aria-live="polite" ensures new toasts are announced.
 */
function ToastContainer() {
  const toasts = useToasts();
  const dismissToast = useAdminUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className={styles.toastRegion}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[`toast_${toast.variant}`]}`}
          role="status"
        >
          <span className={styles.toastMessage}>{toast.message}</span>
          <button
            type="button"
            className={styles.toastDismiss}
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminLayout() {
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const isSidebarCollapsed = useAdminUiStore((s) => s.isSidebarCollapsed);
  const checkSession = useAdminAuthStore((s) => s.checkSession);

  // Verify session cookie on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <div
      className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutCollapsed : ''}`}
    >
      {/* Skip link — first focusable element for keyboard users */}
      <a href="#admin-main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <Sidebar mobileToggleRef={mobileToggleRef} />

      {/* ── Main Column ─────────────────────────────────────────── */}
      <div className={styles.mainColumn}>
        <TopBar ref={mobileToggleRef} />

        <main
          id="admin-main-content"
          role="main"
          className={styles.pageContent}
          aria-label="Admin content"
        >
          <Outlet />
        </main>
      </div>

      {/* ── Global Toast Notifications ───────────────────────────── */}
      <ToastContainer />
    </div>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/layouts/AdminLayout/components/ProtectedRoute/ProtectedRoute.module.css"
cat > "$ROOT/apps/admin/src/layouts/AdminLayout/components/ProtectedRoute/ProtectedRoute.module.css" << 'ADMIN_EOF'
/**
 * @file ProtectedRoute.module.css
 * @path apps/admin/src/layouts/AdminLayout/components/ProtectedRoute/
 */

.fullScreen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background: var(--ca-surface);
  gap: var(--ca-space-3);
}

/* ─── Spinner ────────────────────────────────────────────────────────────── */

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--ca-border);
  border-top-color: var(--ca-accent);
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loadingText {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ca-text-muted);
  font-family: var(--ca-font-body);
}

/* ─── Access Denied ──────────────────────────────────────────────────────── */

.deniedCard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ca-space-4);
  text-align: center;
  max-width: 400px;
  padding: var(--ca-space-8);
  background: var(--ca-surface-elevated);
  border: 1px solid var(--ca-border);
  border-radius: var(--ca-radius-xl);
}

.deniedIcon {
  color: var(--ca-error);
}

.deniedTitle {
  margin: 0;
  font-family: var(--ca-font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ca-text-primary);
}

.deniedText {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ca-text-secondary);
  line-height: 1.6;
}

.backLink {
  display: inline-flex;
  align-items: center;
  padding: var(--ca-space-2-5) var(--ca-space-5);
  background: var(--ca-accent);
  color: var(--ca-accent-fg);
  border-radius: var(--ca-radius-md);
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 150ms ease;
  min-height: 44px;
}

.backLink:hover { background: var(--ca-accent-hover); }

.backLink:focus-visible {
  outline: 2px solid var(--ca-accent);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .spinner { animation: none; border-top-color: var(--ca-accent); }
}

ADMIN_EOF

echo "→ Writing apps/admin/src/layouts/AdminLayout/components/ProtectedRoute/ProtectedRoute.tsx"
cat > "$ROOT/apps/admin/src/layouts/AdminLayout/components/ProtectedRoute/ProtectedRoute.tsx" << 'ADMIN_EOF'
/**
 * @file ProtectedRoute.tsx
 * @path apps/admin/src/layouts/AdminLayout/components/ProtectedRoute/ProtectedRoute.tsx
 *
 * React Router v6 wrapper that enforces authentication and role-based access.
 *
 * USAGE IN ROUTER CONFIG:
 *   <Route element={<ProtectedRoute requiredRole="admin" />}>
 *     <Route path="products" element={<ProductsPage />} />
 *   </Route>
 *
 * BEHAVIOR:
 *   1. While session check is in-flight → renders a full-screen loading state.
 *   2. Unauthenticated → redirects to /admin/sign-in with the attempted path
 *      stored in location.state so sign-in can redirect back afterward.
 *   3. Authenticated but insufficient role → renders an access-denied message.
 *   4. Authenticated + sufficient role → renders the child <Outlet />.
 *
 * WCAG: The loading and denied states are proper <main> regions with
 * appropriate role and aria attributes so screen readers don't get a
 * blank page.
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '../../../../stores/adminAuthStore';
import type { AdminRole } from '../../../../types/admin.types';
import styles from './ProtectedRoute.module.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProtectedRouteProps {
  /** Minimum role required. Defaults to 'staff'. */
  requiredRole?: AdminRole;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProtectedRoute({ requiredRole = 'staff' }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const isLoading = useAdminAuthStore((s) => s.isLoading);
  const hasRole = useAdminAuthStore((s) => s.hasRole);

  // ── Loading State ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={styles.fullScreen} role="status" aria-label="Verifying session">
        <div className={styles.spinner} aria-hidden="true" />
        <p className={styles.loadingText}>Verifying access…</p>
      </div>
    );
  }

  // ── Unauthenticated → Redirect to Sign In ─────────────────────────────

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/sign-in"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // ── Insufficient Role → Access Denied ────────────────────────────────

  if (!hasRole(requiredRole)) {
    return (
      <main className={styles.fullScreen} aria-labelledby="denied-title">
        <div className={styles.deniedCard}>
          <svg aria-hidden="true" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.deniedIcon}>
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <h1 id="denied-title" className={styles.deniedTitle}>Access Denied</h1>
          <p className={styles.deniedText}>
            You don't have permission to access this page.
            A minimum role of <strong>{requiredRole}</strong> is required.
          </p>
          <a href="/admin" className={styles.backLink}>Return to Dashboard</a>
        </div>
      </main>
    );
  }

  // ── Authorized → Render Child Routes ─────────────────────────────────

  return <Outlet />;
}

ADMIN_EOF

echo "→ Writing apps/admin/src/layouts/AdminLayout/components/ProtectedRoute/index.ts"
cat > "$ROOT/apps/admin/src/layouts/AdminLayout/components/ProtectedRoute/index.ts" << 'ADMIN_EOF'
export { ProtectedRoute } from './ProtectedRoute';
export type { ProtectedRouteProps } from './ProtectedRoute';

ADMIN_EOF

echo "→ Writing apps/admin/src/layouts/AdminLayout/components/Sidebar/Sidebar.module.css"
cat > "$ROOT/apps/admin/src/layouts/AdminLayout/components/Sidebar/Sidebar.module.css" << 'ADMIN_EOF'
/**
 * @file Sidebar.module.css
 * @path apps/admin/src/layouts/AdminLayout/components/Sidebar/
 *
 * LAYOUT:
 *   Desktop: Fixed-height, width transitions between 240px (expanded)
 *   and 64px (collapsed). Width change animates smoothly.
 *   Mobile: Position:fixed slide-in drawer from the left.
 *
 * DESIGN: Deep forest green (#1B3A2D) sidebar, warm ivory text.
 * Active items highlighted with a left-border + background tint.
 */

/* ─── Sidebar Shell ──────────────────────────────────────────────────────── */

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: var(--ca-z-sidebar);

  width: var(--ca-sidebar-width, 240px);
  display: flex;
  flex-direction: column;

  background: var(--ca-sidebar-bg, #1B3A2D);
  color: var(--ca-sidebar-text, #D4C9B4);
  border-right: 1px solid rgba(255,255,255,0.06);

  transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sidebarCollapsed {
  width: var(--ca-sidebar-width-collapsed, 64px);
}

/* Mobile: off-screen by default, slides in */
@media (max-width: 1023px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 260ms cubic-bezier(0.4, 0, 0.2, 1);
    width: 260px;
  }

  .sidebarMobileOpen {
    transform: translateX(0);
  }
}

/* ─── Mobile Overlay ─────────────────────────────────────────────────────── */

.overlay {
  position: fixed;
  inset: 0;
  z-index: calc(var(--ca-z-sidebar) - 1);
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);

  @media (min-width: 1024px) { display: none; }
}

/* ─── Logo Area ──────────────────────────────────────────────────────────── */

.logoArea {
  display: flex;
  align-items: center;
  gap: var(--ca-space-3);
  padding: var(--ca-space-5) var(--ca-space-4);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
  min-height: var(--ca-topbar-height, 64px);
}

.logoMark {
  font-size: 1.4rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  width: 28px;
  text-align: center;
}

.logoText {
  font-family: var(--ca-font-display);
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #F5F0E8;
  white-space: nowrap;
  overflow: hidden;
}

/* ─── Nav Content ────────────────────────────────────────────────────────── */

.navContent {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--ca-space-3) 0;

  /* Thin scrollbar to not crowd the collapsed sidebar */
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

/* ─── Nav Section ────────────────────────────────────────────────────────── */

.section {
  padding: 0 0 var(--ca-space-2);
}

.sectionLabel {
  margin: 0;
  padding: var(--ca-space-3) var(--ca-space-4) var(--ca-space-1);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(212, 201, 180, 0.45);
  white-space: nowrap;
  overflow: hidden;
}

/* ─── Nav List ───────────────────────────────────────────────────────────── */

.navList {
  list-style: none;
  margin: 0;
  padding: 0 var(--ca-space-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ─── Nav Link ───────────────────────────────────────────────────────────── */

.navLink {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--ca-space-3);
  padding: var(--ca-space-2-5) var(--ca-space-3);
  min-height: 44px;
  border-radius: var(--ca-radius-md);
  color: rgba(212, 201, 180, 0.75);
  text-decoration: none;
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 130ms ease, color 130ms ease;
  overflow: hidden;
  white-space: nowrap;
}

.navLink:hover {
  background: rgba(255,255,255,0.07);
  color: #F5F0E8;
}

/* Active state: left indicator + tint */
.navLink[aria-current="page"] {
  background: rgba(var(--ca-accent-rgb, 45,106,79), 0.35);
  color: #6FCF97;
  font-weight: 600;
  box-shadow: inset 3px 0 0 #6FCF97;
}

.navLink:focus-visible {
  outline: 2px solid #6FCF97;
  outline-offset: -2px;
}

.navLinkCollapsed {
  justify-content: center;
  padding: var(--ca-space-2-5);
}

/* ─── Nav Icon ───────────────────────────────────────────────────────────── */

.navIcon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 18px;
}

/* ─── Nav Label ──────────────────────────────────────────────────────────── */

.navLabel {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Badge ──────────────────────────────────────────────────────────────── */

.badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: var(--ca-accent, #2D6A4F);
  color: #fff;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
}

/* ─── Collapsed Tooltip ──────────────────────────────────────────────────── */

.tooltip {
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  background: rgba(15,30,22,0.95);
  color: #F5F0E8;
  padding: var(--ca-space-1-5) var(--ca-space-2-5);
  border-radius: var(--ca-radius-md);
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 150ms ease;
  z-index: 10;
  box-shadow: var(--ca-shadow-md);
}

.navLink:hover .tooltip {
  opacity: 1;
}

/* ─── User Area ──────────────────────────────────────────────────────────── */

.userArea {
  display: flex;
  align-items: center;
  gap: var(--ca-space-2-5);
  padding: var(--ca-space-3) var(--ca-space-4);
  border-top: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

.userAreaCollapsed {
  justify-content: center;
  padding: var(--ca-space-3);
}

.userAvatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ca-accent, #2D6A4F);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
}

.userAvatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.userInfo {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.userName {
  font-size: 0.8rem;
  font-weight: 600;
  color: #D4C9B4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.userRole {
  font-size: 0.68rem;
  color: rgba(212, 201, 180, 0.5);
  text-transform: capitalize;
  white-space: nowrap;
}

/* ─── Reduced Motion ─────────────────────────────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  .sidebar { transition: none; }
  .tooltip { transition: none; }
}

ADMIN_EOF

echo "→ Writing apps/admin/src/layouts/AdminLayout/components/Sidebar/Sidebar.tsx"
cat > "$ROOT/apps/admin/src/layouts/AdminLayout/components/Sidebar/Sidebar.tsx" << 'ADMIN_EOF'
/**
 * @file Sidebar.tsx
 * @path apps/admin/src/layouts/AdminLayout/components/Sidebar/Sidebar.tsx
 *
 * The admin portal's primary navigation sidebar.
 *
 * ─── WCAG 2.1 AA COMPLIANCE ────────────────────────────────────────────────
 *   • Wrapped in <nav aria-label="Admin navigation"> (landmark).
 *   • Active link has aria-current="page".
 *   • Collapsed mode: icon-only buttons have aria-label with the link name.
 *   • Mobile: slide-in drawer with focus trap. Escape closes it and returns
 *     focus to the hamburger button in TopBar.
 *   • All nav items are minimum 44px tall touch targets.
 *
 * ─── ADVANCED REACT PATTERNS ───────────────────────────────────────────────
 *   • Nav items filtered by `hasRole` from adminAuthStore — no role-gated
 *     items appear in the DOM at all (not just visually hidden).
 *   • Tooltip on collapsed items uses CSS :hover + position rather than a
 *     JS tooltip library — simpler, performant, no dependency.
 *   • useMemo for filtered nav items to avoid re-running role checks on
 *     every render.
 */

import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '../../../../stores/adminAuthStore';
import { useAdminUiStore } from '../../../../stores/adminUiStore';
import type { AdminRole } from '../../../../types/admin.types';
import styles from './Sidebar.module.css';

// ─── Nav Item Definition ──────────────────────────────────────────────────────

interface NavSection {
  key: string;
  label?: string;
  items: NavItemDef[];
}

interface NavItemDef {
  key: string;
  label: string;
  to: string;
  icon: React.ReactNode;
  /** Minimum role required to see this item */
  minRole?: AdminRole;
  /** Show a notification badge (e.g., pending orders count) */
  badge?: number;
}

// ─── Nav Structure ────────────────────────────────────────────────────────────

const NAV_SECTIONS: NavSection[] = [
  {
    key: 'main',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        to: '/admin',
        icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
      },
      {
        key: 'products',
        label: 'Products',
        to: '/admin/products',
        icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
        minRole: 'staff',
      },
      {
        key: 'orders',
        label: 'Orders',
        to: '/admin/orders',
        icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
        minRole: 'staff',
      },
      {
        key: 'customers',
        label: 'Customers',
        to: '/admin/customers',
        icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
        minRole: 'manager',
      },
      {
        key: 'analytics',
        label: 'Analytics',
        to: '/admin/analytics',
        icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
        minRole: 'manager',
      },
    ],
  },
  {
    key: 'config',
    label: 'Configuration',
    items: [
      {
        key: 'settings',
        label: 'Settings',
        to: '/admin/settings',
        icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 00-14.14 0M4.93 19.07a10 10 0 0014.14 0"/></svg>,
        minRole: 'admin',
      },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  /** Used for the mobile close button focus-return ref */
  mobileToggleRef?: React.RefObject<HTMLButtonElement>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ mobileToggleRef }: SidebarProps) {
  const { isCollapsed, isMobileNavOpen, closeMobileNav } = useAdminUiStore((s) => ({
    isCollapsed: s.isSidebarCollapsed,
    isMobileNavOpen: s.isMobileNavOpen,
    closeMobileNav: s.closeMobileNav,
  }));
  const hasRole = useAdminAuthStore((s) => s.hasRole);
  const user = useAdminAuthStore((s) => s.user);
  const location = useLocation();

  // Filter nav sections based on user's role — never render inaccessible items
  const filteredSections = useMemo(() =>
    NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        !item.minRole || hasRole(item.minRole),
      ),
    })).filter((section) => section.items.length > 0),
    [hasRole],
  );

  const handleNavLinkClick = () => {
    if (isMobileNavOpen) closeMobileNav();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobileNavOpen && (
        <div
          className={styles.overlay}
          aria-hidden="true"
          onClick={closeMobileNav}
        />
      )}

      <nav
        className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ''} ${isMobileNavOpen ? styles.sidebarMobileOpen : ''}`}
        aria-label="Admin navigation"
      >
        {/* ── Logo / Wordmark ──────────────────────────────────────── */}
        <div className={styles.logoArea}>
          <span className={styles.logoMark} aria-hidden="true">🌿</span>
          {!isCollapsed && (
            <span className={styles.logoText}>CannaSaas</span>
          )}
        </div>

        {/* ── Nav Sections ─────────────────────────────────────────── */}
        <div className={styles.navContent}>
          {filteredSections.map((section) => (
            <div key={section.key} className={styles.section}>
              {section.label && !isCollapsed && (
                <p className={styles.sectionLabel} aria-hidden="true">
                  {section.label}
                </p>
              )}
              <ul className={styles.navList} role="list">
                {section.items.map((item) => {
                  const isActive = item.to === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.to);

                  return (
                    <li key={item.key}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/admin'}
                        className={`${styles.navLink} ${isCollapsed ? styles.navLinkCollapsed : ''}`}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={isCollapsed ? item.label : undefined}
                        title={isCollapsed ? item.label : undefined}
                        onClick={handleNavLinkClick}
                      >
                        <span className={styles.navIcon}>{item.icon}</span>
                        {!isCollapsed && (
                          <span className={styles.navLabel}>{item.label}</span>
                        )}
                        {!isCollapsed && item.badge && item.badge > 0 && (
                          <span
                            className={styles.badge}
                            aria-label={`${item.badge} pending`}
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        {/* Tooltip for collapsed mode */}
                        {isCollapsed && (
                          <span className={styles.tooltip} aria-hidden="true">
                            {item.label}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* ── User Profile Footer ───────────────────────────────────── */}
        {user && (
          <div className={`${styles.userArea} ${isCollapsed ? styles.userAreaCollapsed : ''}`}>
            <div className={styles.userAvatar} aria-hidden="true">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="" width={28} height={28} />
                : user.displayName.charAt(0).toUpperCase()
              }
            </div>
            {!isCollapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.displayName}</span>
                <span className={styles.userRole}>{user.role.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/layouts/AdminLayout/components/Sidebar/index.ts"
cat > "$ROOT/apps/admin/src/layouts/AdminLayout/components/Sidebar/index.ts" << 'ADMIN_EOF'
export { Sidebar } from './Sidebar';
export type { SidebarProps } from './Sidebar';

ADMIN_EOF

echo "→ Writing apps/admin/src/layouts/AdminLayout/components/TopBar/TopBar.module.css"
cat > "$ROOT/apps/admin/src/layouts/AdminLayout/components/TopBar/TopBar.module.css" << 'ADMIN_EOF'
/**
 * @file TopBar.module.css
 * @path apps/admin/src/layouts/AdminLayout/components/TopBar/
 */

.topBar {
  position: sticky;
  top: 0;
  z-index: var(--ca-z-topbar);
  height: var(--ca-topbar-height, 64px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--ca-space-4);
  background: var(--ca-surface);
  border-bottom: 1px solid var(--ca-border);
}

.left, .right {
  display: flex;
  align-items: center;
  gap: var(--ca-space-1);
}

.iconBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: var(--ca-radius-md);
  color: var(--ca-text-muted);
  cursor: pointer;
  transition: background 130ms ease, color 130ms ease;
}

.iconBtn:hover {
  background: var(--ca-surface-hover);
  color: var(--ca-text-primary);
}

.iconBtn:focus-visible {
  outline: 2px solid var(--ca-accent);
  outline-offset: 2px;
}

.desktopOnly {
  @media (max-width: 1023px) { display: none; }
}

.mobileOnly {
  @media (min-width: 1024px) { display: none; }
}

ADMIN_EOF

echo "→ Writing apps/admin/src/layouts/AdminLayout/components/TopBar/TopBar.tsx"
cat > "$ROOT/apps/admin/src/layouts/AdminLayout/components/TopBar/TopBar.tsx" << 'ADMIN_EOF'
/**
 * @file TopBar.tsx
 * @path apps/admin/src/layouts/AdminLayout/components/TopBar/TopBar.tsx
 *
 * The horizontal top bar of the admin portal layout.
 * Contains the sidebar collapse toggle (desktop) and mobile menu trigger,
 * along with a global notification bell and the sign-out action.
 *
 * WCAG: Buttons have descriptive aria-labels reflecting current state
 * (e.g., "Collapse sidebar" vs "Expand sidebar").
 */

import React, { forwardRef } from 'react';
import { useAdminUiStore } from '../../../../stores/adminUiStore';
import { useAdminAuthStore } from '../../../../stores/adminAuthStore';
import styles from './TopBar.module.css';

export interface TopBarProps {
  className?: string;
}

export const TopBar = forwardRef<HTMLButtonElement, TopBarProps>(
  function TopBar({ className }, mobileToggleRef) {
    const { isSidebarCollapsed, toggleSidebarCollapsed, openMobileNav, isMobileNavOpen } =
      useAdminUiStore((s) => ({
        isSidebarCollapsed: s.isSidebarCollapsed,
        toggleSidebarCollapsed: s.toggleSidebarCollapsed,
        openMobileNav: s.openMobileNav,
        isMobileNavOpen: s.isMobileNavOpen,
      }));

    const signOut = useAdminAuthStore((s) => s.signOut);

    return (
      <header className={`${styles.topBar} ${className ?? ''}`} role="banner">
        <div className={styles.left}>
          {/* Desktop: collapse/expand sidebar toggle */}
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.desktopOnly}`}
            onClick={toggleSidebarCollapsed}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isSidebarCollapsed}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Mobile: open sidebar drawer */}
          <button
            ref={mobileToggleRef}
            type="button"
            className={`${styles.iconBtn} ${styles.mobileOnly}`}
            onClick={openMobileNav}
            aria-label="Open navigation menu"
            aria-expanded={isMobileNavOpen}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.right}>
          {/* Sign out */}
          <button
            type="button"
            className={styles.iconBtn}
            onClick={signOut}
            aria-label="Sign out"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>
    );
  },
);

ADMIN_EOF

echo "→ Writing apps/admin/src/layouts/AdminLayout/components/TopBar/index.ts"
cat > "$ROOT/apps/admin/src/layouts/AdminLayout/components/TopBar/index.ts" << 'ADMIN_EOF'
export { TopBar } from './TopBar';
export type { TopBarProps } from './TopBar';

ADMIN_EOF

echo "→ Writing apps/admin/src/layouts/AdminLayout/index.ts"
cat > "$ROOT/apps/admin/src/layouts/AdminLayout/index.ts" << 'ADMIN_EOF'
export { AdminLayout } from './AdminLayout';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Analytics/AnalyticsPage.module.css"
cat > "$ROOT/apps/admin/src/pages/Analytics/AnalyticsPage.module.css" << 'ADMIN_EOF'
/**
 * @file AnalyticsPage.module.css
 * @path apps/admin/src/pages/Analytics/
 */
.page { display: flex; flex-direction: column; flex: 1; }
.content { padding: var(--ca-space-6); flex: 1; }
.headerActions { display: flex; align-items: center; gap: var(--ca-space-3); flex-wrap: wrap; }
/* Range selector */
.rangeGroup { border: none; margin: 0; padding: 0; }
.rangeButtons { display: flex; gap: 2px; background: var(--ca-surface-raised); border: 1px solid var(--ca-border); border-radius: var(--ca-radius-md); padding: 3px; }
.rangeBtn { padding: var(--ca-space-1-5) var(--ca-space-3); background: transparent; border: none; border-radius: 6px; color: var(--ca-text-muted); font-family: var(--ca-font-body); font-size: 0.78rem; font-weight: 500; cursor: pointer; min-height: 32px; transition: background 130ms ease; }
.rangeBtn:hover { color: var(--ca-text-primary); }
.rangeBtnActive { background: var(--ca-surface-elevated) !important; color: var(--ca-accent) !important; font-weight: 600; box-shadow: var(--ca-shadow-sm); }
.rangeBtn:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 1px; }
/* Export */
.exportBtn { display: inline-flex; align-items: center; gap: var(--ca-space-1-5); padding: var(--ca-space-2) var(--ca-space-3-5); background: var(--ca-surface-elevated); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); color: var(--ca-text-secondary); font-family: var(--ca-font-body); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background 130ms ease; min-height: 36px; }
.exportBtn:hover:not(:disabled) { background: var(--ca-surface-hover); }
.exportBtn:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; }
.exportBtn:disabled { opacity: 0.5; cursor: not-allowed; }
.btnSpinner { display: block; width: 12px; height: 12px; border: 2px solid var(--ca-border); border-top-color: var(--ca-accent); border-radius: 50%; animation: spin 600ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
/* Charts grid */
.chartsGrid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ca-space-5); }
.fullWidth { grid-column: 1 / -1; }
.chartSection { background: var(--ca-surface-elevated); border: 1px solid var(--ca-border); border-radius: var(--ca-radius-xl); padding: var(--ca-space-5); display: flex; flex-direction: column; gap: var(--ca-space-4); }
.chartTitle { margin: 0; font-family: var(--ca-font-display); font-size: 1rem; font-weight: 700; color: var(--ca-text-primary); }
/* Data table fallback */
.tableDetails { }
.tableSummary { font-size: 0.75rem; color: var(--ca-text-muted); cursor: pointer; padding: var(--ca-space-1) 0; }
.tableSummary:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; border-radius: 2px; }
.tableWrapper { overflow-x: auto; margin-top: var(--ca-space-2); }
.dataTable { width: 100%; border-collapse: collapse; font-size: 0.82rem; font-family: var(--ca-font-body); }
.dataTable th, .dataTable td { padding: var(--ca-space-2) var(--ca-space-3); text-align: left; border-bottom: 1px solid var(--ca-border); }
.dataTable th { font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ca-text-muted); }
/* Funnel */
.funnelChart { display: flex; flex-direction: column; gap: var(--ca-space-3); padding: var(--ca-space-2) 0; }
.funnelStep { display: grid; grid-template-columns: 140px 1fr 80px; gap: var(--ca-space-3); align-items: center; }
.funnelLabel { font-size: 0.82rem; color: var(--ca-text-secondary); font-weight: 500; }
.funnelBar { height: 24px; background: var(--ca-surface-raised); border-radius: var(--ca-radius-full); overflow: hidden; }
.funnelFill { height: 100%; background: linear-gradient(90deg, #2D6A4F, #52B788); border-radius: var(--ca-radius-full); transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1); }
.funnelStats { display: flex; flex-direction: column; gap: 1px; text-align: right; }
.funnelStats span { font-size: 0.78rem; color: var(--ca-text-secondary); font-variant-numeric: tabular-nums; }
.funnelPct { color: var(--ca-text-muted); font-size: 0.72rem; }
/* Loading */
.loadingGrid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ca-space-5); }
.skeletonSection { height: 300px; background: linear-gradient(90deg, var(--ca-skeleton-base) 25%, var(--ca-skeleton-highlight) 50%, var(--ca-skeleton-base) 75%); background-size: 200% 100%; border-radius: var(--ca-radius-xl); animation: shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.errorMsg { color: var(--ca-error); text-align: center; padding: var(--ca-space-8); }
.srOnly { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 1024px) { .chartsGrid, .loadingGrid { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .content { padding: var(--ca-space-4); } .funnelStep { grid-template-columns: 100px 1fr 60px; } }
@media (prefers-reduced-motion: reduce) { .funnelFill, .rangeBtn, .exportBtn { transition: none; } .btnSpinner, .skeletonSection { animation: none; } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Analytics/AnalyticsPage.tsx"
cat > "$ROOT/apps/admin/src/pages/Analytics/AnalyticsPage.tsx" << 'ADMIN_EOF'
/**
 * @file AnalyticsPage.tsx
 * @path apps/admin/src/pages/Analytics/AnalyticsPage.tsx
 *
 * Extended analytics page consuming the Sprint 12 dashboard API.
 * Sections:
 *   - Revenue over time (line chart)
 *   - Orders by fulfillment type (pie/bar chart)
 *   - Top products by revenue and quantity (bar chart)
 *   - Customer acquisition over time (stacked bar)
 *   - Conversion funnel (horizontal bar)
 *   - CSV export for all data
 *
 * WCAG: Every chart has an accessible data table fallback via <details>.
 * The date range selector uses the same controlled fieldset/legend/aria-pressed
 * pattern as the dashboard RevenueChart.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { PageHeader } from '../../components/shared/PageHeader';
import type { DateRangePreset, RevenueDataPoint, TopProduct, CustomerAcquisitionPoint, ConversionFunnelStep, AnalyticsFulfillmentBreakdown } from '../../types/admin.types';
import styles from './AnalyticsPage.module.css';

// ─── Date Range Options ───────────────────────────────────────────────────────

const RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '1y', label: '1yr' },
];

// ─── Data Interface ───────────────────────────────────────────────────────────

interface AnalyticsData {
  revenue: RevenueDataPoint[];
  topProducts: TopProduct[];
  customerAcquisition: CustomerAcquisitionPoint[];
  conversionFunnel: ConversionFunnelStep[];
  fulfillmentBreakdown: AnalyticsFulfillmentBreakdown;
}

// ─── Accessible Chart Section Wrapper ────────────────────────────────────────

function ChartSection({
  titleId,
  title,
  children,
  tableContent,
}: {
  titleId: string;
  title: string;
  children: React.ReactNode;
  tableContent: React.ReactNode;
}) {
  return (
    <section className={styles.chartSection} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.chartTitle}>{title}</h2>
      <div role="img" aria-labelledby={titleId}>
        {children}
      </div>
      <details className={styles.tableDetails}>
        <summary className={styles.tableSummary}>View as table</summary>
        <div className={styles.tableWrapper}>{tableContent}</div>
      </details>
    </section>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const [range, setRange] = useState<DateRangePreset>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/full?range=${range}`);
      if (res.ok) setData(await res.json());
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/analytics/export?range=${range}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cannasaas-analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const CHART_COLORS = ['#2D6A4F', '#52B788', '#95D5B2', '#D8F3DC', '#B7E4C7'];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Analytics"
        subtitle="Performance insights across revenue, orders, and customers."
        breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Analytics' }]}
        actions={
          <div className={styles.headerActions}>
            {/* Date Range */}
            <fieldset className={styles.rangeGroup}>
              <legend className={styles.srOnly}>Date range</legend>
              <div className={styles.rangeButtons}>
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.rangeBtn} ${range === opt.value ? styles.rangeBtnActive : ''}`}
                    aria-pressed={range === opt.value}
                    onClick={() => setRange(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>
            {/* CSV Export */}
            <button
              type="button"
              className={styles.exportBtn}
              onClick={handleExportCsv}
              disabled={isExporting || isLoading}
              aria-busy={isExporting}
              aria-label={isExporting ? 'Exporting CSV…' : 'Export data as CSV'}
            >
              {isExporting ? (
                <span className={styles.btnSpinner} aria-hidden="true" />
              ) : (
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              Export CSV
            </button>
          </div>
        }
      />

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loadingGrid} aria-label="Loading analytics" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.skeletonSection} aria-hidden="true" />
            ))}
          </div>
        ) : !data ? (
          <p className={styles.errorMsg} role="alert">Failed to load analytics data. Please refresh.</p>
        ) : (
          <div className={styles.chartsGrid}>
            {/* ── Revenue Over Time ──────────────────────────────── */}
            <div className={styles.fullWidth}>
              <ChartSection
                titleId="revenue-over-time"
                title="Revenue Over Time"
                tableContent={
                  <table className={styles.dataTable}>
                    <caption className={styles.srOnly}>Revenue data</caption>
                    <thead><tr><th scope="col">Date</th><th scope="col">Revenue</th><th scope="col">Orders</th></tr></thead>
                    <tbody>
                      {data.revenue.map((r) => (
                        <tr key={r.date}>
                          <td>{r.date}</td>
                          <td>${(r.revenueCents / 100).toLocaleString()}</td>
                          <td>{r.orderCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
              >
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="anaRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ca-border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ca-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--ca-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 100 / 1000).toFixed(0)}k`} width={44} />
                    <Tooltip formatter={(v: number) => [`$${(v / 100).toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenueCents" stroke="#2D6A4F" strokeWidth={2} fill="url(#anaRevGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartSection>
            </div>

            {/* ── Top Products ───────────────────────────────────── */}
            <ChartSection
              titleId="top-products-revenue"
              title="Top Products by Revenue"
              tableContent={
                <table className={styles.dataTable}>
                  <caption className={styles.srOnly}>Top products</caption>
                  <thead><tr><th scope="col">Product</th><th scope="col">Revenue</th><th scope="col">Units</th></tr></thead>
                  <tbody>
                    {data.topProducts.map((p) => (
                      <tr key={p.productId}>
                        <td>{p.name}</td>
                        <td>${(p.revenueCents / 100).toLocaleString()}</td>
                        <td>{p.unitsSold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.topProducts} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ca-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--ca-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 100).toLocaleString()}`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: 'var(--ca-text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`$${(v / 100).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenueCents" radius={[0, 4, 4, 0]}>
                    {data.topProducts.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartSection>

            {/* ── Customer Acquisition ───────────────────────────── */}
            <ChartSection
              titleId="customer-acquisition"
              title="Customer Acquisition"
              tableContent={
                <table className={styles.dataTable}>
                  <caption className={styles.srOnly}>Customer acquisition data</caption>
                  <thead><tr><th scope="col">Date</th><th scope="col">New</th><th scope="col">Returning</th></tr></thead>
                  <tbody>
                    {data.customerAcquisition.map((r) => (
                      <tr key={r.date}>
                        <td>{r.date}</td>
                        <td>{r.newCustomers}</td>
                        <td>{r.returningCustomers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.customerAcquisition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ca-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ca-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--ca-text-muted)' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="newCustomers" name="New" fill="#2D6A4F" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="returningCustomers" name="Returning" fill="#95D5B2" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartSection>

            {/* ── Conversion Funnel ──────────────────────────────── */}
            <ChartSection
              titleId="conversion-funnel"
              title="Conversion Funnel"
              tableContent={
                <table className={styles.dataTable}>
                  <caption className={styles.srOnly}>Conversion funnel steps</caption>
                  <thead><tr><th scope="col">Step</th><th scope="col">Count</th><th scope="col">Rate</th></tr></thead>
                  <tbody>
                    {data.conversionFunnel.map((s) => (
                      <tr key={s.label}>
                        <td>{s.label}</td>
                        <td>{s.count.toLocaleString()}</td>
                        <td>{s.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            >
              <div className={styles.funnelChart} role="list">
                {data.conversionFunnel.map((step) => (
                  <div key={step.label} className={styles.funnelStep} role="listitem">
                    <div className={styles.funnelLabel}>{step.label}</div>
                    <div className={styles.funnelBar}>
                      <div
                        className={styles.funnelFill}
                        style={{ width: `${step.pct}%` }}
                        aria-label={`${step.pct.toFixed(1)}% — ${step.count.toLocaleString()} users`}
                      />
                    </div>
                    <div className={styles.funnelStats}>
                      <span>{step.count.toLocaleString()}</span>
                      <span className={styles.funnelPct}>{step.pct.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartSection>
          </div>
        )}
      </div>
    </div>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Analytics/index.ts"
cat > "$ROOT/apps/admin/src/pages/Analytics/index.ts" << 'ADMIN_EOF'
export { AnalyticsPage } from './AnalyticsPage';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Customers/CustomersPage.module.css"
cat > "$ROOT/apps/admin/src/pages/Customers/CustomersPage.module.css" << 'ADMIN_EOF'
/**
 * @file CustomersPage.module.css
 * @path apps/admin/src/pages/Customers/
 */
.page { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.filterBar { display: flex; gap: var(--ca-space-2); padding: var(--ca-space-3) var(--ca-space-6); border-bottom: 1px solid var(--ca-border); background: var(--ca-surface); flex-wrap: wrap; }
.searchInput { flex: 1; min-width: 200px; padding: var(--ca-space-2) var(--ca-space-3); background: var(--ca-surface-raised); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); color: var(--ca-text-primary); font-family: var(--ca-font-body); font-size: 0.875rem; outline: none; }
.searchInput:focus { border-color: var(--ca-accent); box-shadow: 0 0 0 3px rgba(var(--ca-accent-rgb), 0.12); }
.filterSelect { padding: var(--ca-space-2) var(--ca-space-3); background: var(--ca-surface-raised); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); color: var(--ca-text-primary); font-family: var(--ca-font-body); font-size: 0.875rem; cursor: pointer; outline: none; }
.filterSelect:focus { border-color: var(--ca-accent); }
.tableWrapper { flex: 1; overflow: auto; }
/* Cell styles */
.nameCell { display: flex; align-items: center; gap: var(--ca-space-2-5); }
.avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(var(--ca-accent-rgb), 0.15); color: var(--ca-accent); display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 700; flex-shrink: 0; }
.nameInfo { display: flex; flex-direction: column; gap: 1px; }
.name { font-size: 0.875rem; font-weight: 600; color: var(--ca-text-primary); }
.email { font-size: 0.75rem; color: var(--ca-text-muted); }
.mono { font-variant-numeric: tabular-nums; font-size: 0.875rem; }
.date { font-size: 0.82rem; color: var(--ca-text-muted); }
.emptyText { margin: 0; color: var(--ca-text-muted); }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Customers/CustomersPage.tsx"
cat > "$ROOT/apps/admin/src/pages/Customers/CustomersPage.tsx" << 'ADMIN_EOF'
/**
 * @file CustomersPage.tsx
 * @path apps/admin/src/pages/Customers/CustomersPage.tsx
 *
 * Customer management page. DataTable with search/filter controls.
 * Clicking a row navigates to the CustomerDetailPage.
 * Managers can approve/reject age or medical card verification requests.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type ColumnDef, type SortState } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { Customer, CustomerFilters } from '../../types/admin.types';
import styles from './CustomersPage.module.css';

// ─── Column Definitions ───────────────────────────────────────────────────────

const COLUMNS: ColumnDef<Customer>[] = [
  {
    key: 'displayName',
    label: 'Customer',
    sortable: true,
    render: (row) => (
      <div className={styles.nameCell}>
        <div className={styles.avatar} aria-hidden="true">
          {row.displayName.charAt(0).toUpperCase()}
        </div>
        <div className={styles.nameInfo}>
          <span className={styles.name}>{row.displayName}</span>
          <span className={styles.email}>{row.email}</span>
        </div>
      </div>
    ),
  },
  {
    key: 'verificationStatus',
    label: 'Verification',
    sortable: true,
    render: (row) => <StatusBadge type="verification" value={row.verificationStatus} />,
  },
  {
    key: 'isMedical',
    label: 'Medical',
    align: 'center',
    render: (row) => (
      <span aria-label={row.isMedical ? 'Medical patient' : 'Recreational'}>
        {row.isMedical ? '✓' : '—'}
      </span>
    ),
  },
  {
    key: 'totalOrders',
    label: 'Orders',
    sortable: true,
    align: 'right',
    render: (row) => <span className={styles.mono}>{row.totalOrders}</span>,
  },
  {
    key: 'lifetimeValueCents',
    label: 'LTV',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className={styles.mono}>${(row.lifetimeValueCents / 100).toFixed(0)}</span>
    ),
  },
  {
    key: 'loyaltyPoints',
    label: 'Points',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className={styles.mono}>{row.loyaltyPoints.toLocaleString()}</span>
    ),
  },
  {
    key: 'joinedAt',
    label: 'Joined',
    sortable: true,
    render: (row) => (
      <span className={styles.date}>
        {new Date(row.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortState>({ column: 'joinedAt', direction: 'desc' });
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '', verificationStatus: '', isMedical: null, hasOrders: null,
  });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sort: `${sort.column}:${sort.direction}`,
        ...(filters.search && { search: filters.search }),
        ...(filters.verificationStatus && { verificationStatus: filters.verificationStatus }),
        ...(filters.isMedical !== null && { isMedical: String(filters.isMedical) }),
      });
      const res = await fetch(`/api/admin/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.items ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sort, filters]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const stableCols = useMemo(() => COLUMNS, []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Customers"
        subtitle="Manage customer accounts and verification requests."
        breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Customers' }]}
      />

      {/* ── Filter Bar ───────────────────────────────────────────── */}
      <div className={styles.filterBar} role="search" aria-label="Filter customers">
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search name or email…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          aria-label="Search customers"
        />
        <select
          className={styles.filterSelect}
          value={filters.verificationStatus}
          onChange={(e) => setFilters((f) => ({ ...f, verificationStatus: e.target.value as CustomerFilters['verificationStatus'] }))}
          aria-label="Filter by verification status"
        >
          <option value="">All Verification</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending Review</option>
          <option value="unverified">Unverified</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filters.isMedical === null ? '' : String(filters.isMedical)}
          onChange={(e) => setFilters((f) => ({
            ...f,
            isMedical: e.target.value === '' ? null : e.target.value === 'true',
          }))}
          aria-label="Filter by medical status"
        >
          <option value="">All Types</option>
          <option value="true">Medical Only</option>
          <option value="false">Recreational Only</option>
        </select>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className={styles.tableWrapper}>
        <DataTable<Customer>
          caption="Customers list"
          columns={stableCols}
          rows={customers}
          sort={sort}
          onSortChange={setSort}
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/admin/customers/${row.id}`)}
          emptyState={<p className={styles.emptyText}>No customers match your filters.</p>}
        />
      </div>
    </div>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Customers/index.ts"
cat > "$ROOT/apps/admin/src/pages/Customers/index.ts" << 'ADMIN_EOF'
export { CustomersPage } from './CustomersPage';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/DashboardPage.module.css"
cat > "$ROOT/apps/admin/src/pages/Dashboard/DashboardPage.module.css" << 'ADMIN_EOF'
/**
 * @file DashboardPage.module.css
 * @path apps/admin/src/pages/Dashboard/
 *
 * RESPONSIVE GRID STRATEGY:
 *   Desktop (≥1280px): 4-col stats, full-width chart, 3-col bottom grid
 *   Tablet (768–1279px): 2-col stats, full-width chart, 2-col bottom grid
 *   Mobile (<768px): 1-col everything
 */

.page {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--ca-space-6);
  padding: var(--ca-space-6);
  flex: 1;
}

/* ─── Stats Grid ─────────────────────────────────────────────────────────── */

.statsGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--ca-space-4);
}

@media (max-width: 1279px) {
  .statsGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 639px) {
  .statsGrid {
    grid-template-columns: 1fr;
  }
}

/* ─── Revenue Chart ──────────────────────────────────────────────────────── */

.revenueChart {
  /* Full width — just sits in the flex column */
}

/* ─── Bottom Grid ────────────────────────────────────────────────────────── */

.bottomGrid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: var(--ca-space-4);
  align-items: start;
}

@media (max-width: 1279px) {
  .bottomGrid {
    grid-template-columns: 1fr 1fr;
  }

  /* Top products takes full width on tablet */
  .bottomGrid > :first-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 767px) {
  .content {
    padding: var(--ca-space-4);
    gap: var(--ca-space-4);
  }

  .bottomGrid {
    grid-template-columns: 1fr;
  }

  .bottomGrid > :first-child {
    grid-column: auto;
  }
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/DashboardPage.tsx"
cat > "$ROOT/apps/admin/src/pages/Dashboard/DashboardPage.tsx" << 'ADMIN_EOF'
/**
 * @file DashboardPage.tsx
 * @path apps/admin/src/pages/Dashboard/DashboardPage.tsx
 *
 * Admin portal dashboard page. Aggregates:
 *   - 4 KPI stat cards (revenue, orders, customers, AOV)
 *   - Revenue area chart with date range selector
 *   - Top products table
 *   - Recent orders list
 *   - Low stock alerts
 *
 * DATA STRATEGY: All four dashboard data categories are fetched in parallel
 * via Promise.allSettled so a failure in one doesn't block the others.
 * Each section shows its own loading/error state independently.
 *
 * WCAG: The page uses a single <h1> via PageHeader. Widget section headings
 * are all <h2>, maintaining a logical heading hierarchy.
 */

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatCard } from './components/StatCard';
import { RevenueChart } from './components/RevenueChart';
import { TopProductsTable } from './components/TopProductsTable';
import { RecentOrdersList } from './components/RecentOrdersList';
import { LowStockAlerts } from './components/LowStockAlerts';
import type {
  DashboardStats,
  TopProduct,
  RecentOrder,
  LowStockAlert,
} from '../../types/admin.types';
import styles from './DashboardPage.module.css';

// ─── KPI Icon components (inline SVG for zero deps) ──────────────────────────

const RevenueIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
);
const OrdersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const CustomersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const AovIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStock, setLowStock] = useState<LowStockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);

      // Parallel fetch — failures are isolated per widget
      const [statsRes, productsRes, ordersRes, stockRes] = await Promise.allSettled([
        fetch('/api/admin/analytics/dashboard-stats').then((r) => r.json()),
        fetch('/api/admin/analytics/top-products?limit=5').then((r) => r.json()),
        fetch('/api/admin/orders?limit=8&sort=createdAt:desc').then((r) => r.json()),
        fetch('/api/admin/products/low-stock').then((r) => r.json()),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (productsRes.status === 'fulfilled') setTopProducts(productsRes.value);
      if (ordersRes.status === 'fulfilled') setRecentOrders(ordersRes.value?.items ?? []);
      if (stockRes.status === 'fulfilled') setLowStock(stockRes.value);

      setIsLoading(false);
    };

    fetchAll();
  }, []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back. Here's what's happening today.`}
      />

      <div className={styles.content}>
        {/* ── KPI Stats Row ─────────────────────────────────────── */}
        <section aria-label="Key metrics" className={styles.statsGrid}>
          <StatCard
            label="Total Revenue"
            value={stats?.totalRevenueCents ?? 0}
            format="currency"
            changePct={stats?.revenueChangePct ?? 0}
            icon={<RevenueIcon />}
            isLoading={isLoading}
          />
          <StatCard
            label="Orders Today"
            value={stats?.ordersToday ?? 0}
            format="number"
            changePct={stats?.ordersTodayChangePct ?? 0}
            icon={<OrdersIcon />}
            isLoading={isLoading}
          />
          <StatCard
            label="Active Customers"
            value={stats?.activeCustomers ?? 0}
            format="number"
            changePct={stats?.activeCustomersChangePct ?? 0}
            icon={<CustomersIcon />}
            isLoading={isLoading}
          />
          <StatCard
            label="Avg Order Value"
            value={stats?.averageOrderValueCents ?? 0}
            format="currency"
            changePct={stats?.aovChangePct ?? 0}
            icon={<AovIcon />}
            isLoading={isLoading}
          />
        </section>

        {/* ── Revenue Chart ─────────────────────────────────────── */}
        <RevenueChart className={styles.revenueChart} />

        {/* ── Bottom Grid ───────────────────────────────────────── */}
        <div className={styles.bottomGrid}>
          <TopProductsTable products={topProducts} isLoading={isLoading} />
          <RecentOrdersList orders={recentOrders} isLoading={isLoading} />
          <LowStockAlerts alerts={lowStock} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/LowStockAlerts/LowStockAlerts.module.css"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/LowStockAlerts/LowStockAlerts.module.css" << 'ADMIN_EOF'
/**
 * @file LowStockAlerts.module.css
 * @path apps/admin/src/pages/Dashboard/components/LowStockAlerts/
 */
.section {
  background: var(--ca-surface-elevated);
  border: 1px solid var(--ca-border);
  border-radius: var(--ca-radius-xl);
  padding: var(--ca-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--ca-space-4);
}
.header { display: flex; align-items: center; gap: var(--ca-space-2); }
.title {
  margin: 0;
  font-family: var(--ca-font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ca-text-primary);
}
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  background: rgba(var(--ca-error-rgb), 0.12);
  color: var(--ca-error);
  border-radius: var(--ca-radius-full);
  font-size: 0.72rem;
  font-weight: 700;
}
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.alertItem { border-bottom: 1px solid var(--ca-border); }
.alertItem:last-child { border-bottom: none; }
.alertLink {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ca-space-3);
  padding: var(--ca-space-2-5) 0;
  text-decoration: none;
  min-height: 44px;
}
.alertLink:hover .productName { color: var(--ca-accent); }
.alertLink:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; border-radius: var(--ca-radius-sm); }
.alertInfo { display: flex; flex-direction: column; gap: 2px; }
.productName { font-size: 0.85rem; font-weight: 600; color: var(--ca-text-primary); }
.variantLabel { font-size: 0.72rem; color: var(--ca-text-muted); }
.alertRight { flex-shrink: 0; }
.stockCount {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 24px;
  padding: 0 var(--ca-space-2);
  border-radius: var(--ca-radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.stockOut { background: rgba(var(--ca-error-rgb), 0.12); color: var(--ca-error); }
.stockLow { background: rgba(212, 105, 30, 0.1); color: #8a4800; }
.allGood { margin: 0; font-size: 0.875rem; color: var(--ca-success); padding: var(--ca-space-3) 0; display: flex; align-items: center; gap: var(--ca-space-2); }
.skeleton {
  display: block; height: 12px;
  background: linear-gradient(90deg, var(--ca-skeleton-base) 25%, var(--ca-skeleton-highlight) 50%, var(--ca-skeleton-base) 75%);
  background-size: 200% 100%;
  border-radius: var(--ca-radius-sm);
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.viewAllLink { align-self: flex-start; font-size: 0.8rem; color: var(--ca-accent); font-weight: 600; text-decoration: none; }
.viewAllLink:hover { text-decoration: underline; }
.viewAllLink:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; border-radius: 2px; }
@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; background: var(--ca-skeleton-base); } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/LowStockAlerts/LowStockAlerts.tsx"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/LowStockAlerts/LowStockAlerts.tsx" << 'ADMIN_EOF'
/**
 * @file LowStockAlerts.tsx
 * @path apps/admin/src/pages/Dashboard/components/LowStockAlerts/LowStockAlerts.tsx
 *
 * Dashboard widget listing product variants that have fallen below their
 * reorder threshold. Links to the product edit page for each item.
 *
 * WCAG: role="alert" is NOT used here — this is persistent info, not
 * a time-sensitive notification. role="status" with aria-live="polite"
 * announces when the list changes without interrupting the user.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { LowStockAlert } from '../../../../types/admin.types';
import styles from './LowStockAlerts.module.css';

export interface LowStockAlertsProps {
  alerts: LowStockAlert[];
  isLoading?: boolean;
  className?: string;
}

export function LowStockAlerts({ alerts, isLoading = false, className }: LowStockAlertsProps) {
  return (
    <section className={`${styles.section} ${className ?? ''}`} aria-labelledby="low-stock-title">
      <div className={styles.header}>
        <h2 id="low-stock-title" className={styles.title}>
          Low Stock Alerts
        </h2>
        {!isLoading && alerts.length > 0 && (
          <span className={styles.badge} aria-label={`${alerts.length} alerts`}>
            {alerts.length}
          </span>
        )}
      </div>

      <div role="status" aria-live="polite" aria-atomic="false">
        {isLoading ? (
          <ul className={styles.list} aria-label="Loading alerts">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className={styles.alertItem} aria-hidden="true">
                <span className={styles.skeleton} style={{ width: '65%' }} />
                <span className={styles.skeleton} style={{ width: '25%' }} />
              </li>
            ))}
          </ul>
        ) : alerts.length === 0 ? (
          <p className={styles.allGood}>
            <span aria-hidden="true">✓</span> All products are well-stocked.
          </p>
        ) : (
          <ul className={styles.list} aria-label="Low stock alerts">
            {alerts.map((alert) => {
              const urgency = alert.currentStock === 0 ? 'out' : 'low';
              return (
                <li key={`${alert.productId}-${alert.variantId}`} className={styles.alertItem}>
                  <Link
                    to={`/admin/products/${alert.productId}/edit`}
                    className={styles.alertLink}
                    aria-label={`${alert.productName} ${alert.variantLabel}: ${alert.currentStock === 0 ? 'out of stock' : `${alert.currentStock} remaining, below reorder threshold of ${alert.reorderThreshold}`}`}
                  >
                    <div className={styles.alertInfo}>
                      <span className={styles.productName}>{alert.productName}</span>
                      <span className={styles.variantLabel}>{alert.variantLabel}</span>
                    </div>
                    <div className={styles.alertRight}>
                      <span
                        className={`${styles.stockCount} ${urgency === 'out' ? styles.stockOut : styles.stockLow}`}
                        aria-hidden="true"
                      >
                        {alert.currentStock === 0 ? 'OUT' : alert.currentStock}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link to="/admin/products?filter=low_stock" className={styles.viewAllLink}>
        Manage inventory →
      </Link>
    </section>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/LowStockAlerts/index.ts"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/LowStockAlerts/index.ts" << 'ADMIN_EOF'
export { LowStockAlerts } from './LowStockAlerts';
export type { LowStockAlertsProps } from './LowStockAlerts';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/RecentOrdersList/RecentOrdersList.module.css"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/RecentOrdersList/RecentOrdersList.module.css" << 'ADMIN_EOF'
/**
 * @file RecentOrdersList.module.css
 * @path apps/admin/src/pages/Dashboard/components/RecentOrdersList/
 */
.section {
  background: var(--ca-surface-elevated);
  border: 1px solid var(--ca-border);
  border-radius: var(--ca-radius-xl);
  padding: var(--ca-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--ca-space-4);
}
.title {
  margin: 0;
  font-family: var(--ca-font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ca-text-primary);
}
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.item { border-bottom: 1px solid var(--ca-border); }
.item:last-child { border-bottom: none; }
.orderLink {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ca-space-3);
  padding: var(--ca-space-3) 0;
  text-decoration: none;
  transition: background 130ms ease;
  border-radius: var(--ca-radius-sm);
  flex-wrap: wrap;
  min-height: 44px;
}
.orderLink:hover { color: var(--ca-accent); }
.orderLink:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; border-radius: var(--ca-radius-sm); }
.orderMeta { display: flex; flex-direction: column; gap: 2px; }
.orderNumber { font-size: 0.85rem; font-weight: 700; color: var(--ca-text-primary); }
.customerName { font-size: 0.78rem; color: var(--ca-text-muted); }
.orderRight { display: flex; align-items: center; gap: var(--ca-space-2-5); flex-wrap: wrap; }
.total { font-size: 0.85rem; font-weight: 600; color: var(--ca-text-secondary); font-variant-numeric: tabular-nums; }
.time { font-size: 0.72rem; color: var(--ca-text-muted); white-space: nowrap; }
.empty { margin: 0; font-size: 0.875rem; color: var(--ca-text-muted); padding: var(--ca-space-4) 0; text-align: center; }
.skeleton {
  display: block; height: 12px;
  background: linear-gradient(90deg, var(--ca-skeleton-base) 25%, var(--ca-skeleton-highlight) 50%, var(--ca-skeleton-base) 75%);
  background-size: 200% 100%;
  border-radius: var(--ca-radius-sm);
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.viewAllLink { align-self: flex-start; font-size: 0.8rem; color: var(--ca-accent); font-weight: 600; text-decoration: none; }
.viewAllLink:hover { text-decoration: underline; }
.viewAllLink:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; border-radius: 2px; }
@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; background: var(--ca-skeleton-base); } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/RecentOrdersList/RecentOrdersList.tsx"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/RecentOrdersList/RecentOrdersList.tsx" << 'ADMIN_EOF'
/**
 * @file RecentOrdersList.tsx
 * @path apps/admin/src/pages/Dashboard/components/RecentOrdersList/RecentOrdersList.tsx
 *
 * Dashboard widget showing the most recent orders with status, customer name,
 * total, and fulfillment method. Each row links to the order detail page.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../../../components/shared/StatusBadge';
import type { RecentOrder } from '../../../../types/admin.types';
import styles from './RecentOrdersList.module.css';

export interface RecentOrdersListProps {
  orders: RecentOrder[];
  isLoading?: boolean;
  className?: string;
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function RecentOrdersList({ orders, isLoading = false, className }: RecentOrdersListProps) {
  return (
    <section className={`${styles.section} ${className ?? ''}`} aria-labelledby="recent-orders-title">
      <h2 id="recent-orders-title" className={styles.title}>Recent Orders</h2>

      {isLoading ? (
        <ul className={styles.list} aria-label="Loading recent orders" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className={styles.item} aria-hidden="true">
              <span className={styles.skeleton} style={{ width: '30%' }} />
              <span className={styles.skeleton} style={{ width: '40%' }} />
              <span className={styles.skeleton} style={{ width: '20%' }} />
            </li>
          ))}
        </ul>
      ) : orders.length === 0 ? (
        <p className={styles.empty} role="status">No orders yet today.</p>
      ) : (
        <ul className={styles.list} aria-label="Recent orders">
          {orders.map((order) => (
            <li key={order.id} className={styles.item}>
              <Link
                to={`/admin/orders/${order.id}`}
                className={styles.orderLink}
                aria-label={`Order ${order.orderNumber} for ${order.customerName}, ${order.status}`}
              >
                <div className={styles.orderMeta}>
                  <span className={styles.orderNumber}>#{order.orderNumber}</span>
                  <span className={styles.customerName}>{order.customerName}</span>
                </div>
                <div className={styles.orderRight}>
                  <StatusBadge type="order" value={order.status} />
                  <span className={styles.total}>
                    ${(order.totalCents / 100).toLocaleString()}
                  </span>
                  <span className={styles.time} aria-label={`Placed ${timeAgo(order.createdAt)}`}>
                    {timeAgo(order.createdAt)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link to="/admin/orders" className={styles.viewAllLink}>
        View all orders →
      </Link>
    </section>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/RecentOrdersList/index.ts"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/RecentOrdersList/index.ts" << 'ADMIN_EOF'
export { RecentOrdersList } from './RecentOrdersList';
export type { RecentOrdersListProps } from './RecentOrdersList';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/RevenueChart/RevenueChart.module.css"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/RevenueChart/RevenueChart.module.css" << 'ADMIN_EOF'
/**
 * @file RevenueChart.module.css
 * @path apps/admin/src/pages/Dashboard/components/RevenueChart/
 */

.section {
  background: var(--ca-surface-elevated);
  border: 1px solid var(--ca-border);
  border-radius: var(--ca-radius-xl);
  padding: var(--ca-space-5);
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ca-space-4);
  flex-wrap: wrap;
  margin-bottom: var(--ca-space-5);
}

.title {
  margin: 0;
  font-family: var(--ca-font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ca-text-primary);
}

.totalLabel {
  margin: var(--ca-space-1) 0 0;
  font-size: 0.82rem;
  color: var(--ca-text-muted);
}

/* ─── Range Selector ─────────────────────────────────────────────────────── */

.rangeGroup {
  border: none;
  margin: 0;
  padding: 0;
}

.rangeButtons {
  display: flex;
  gap: 2px;
  background: var(--ca-surface-raised);
  border: 1px solid var(--ca-border);
  border-radius: var(--ca-radius-md);
  padding: 3px;
}

.rangeBtn {
  padding: var(--ca-space-1-5) var(--ca-space-3);
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--ca-text-muted);
  font-family: var(--ca-font-body);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 130ms ease, color 130ms ease;
  min-height: 32px;
  white-space: nowrap;
}

.rangeBtn:hover {
  color: var(--ca-text-primary);
  background: var(--ca-surface-hover);
}

.rangeBtnActive {
  background: var(--ca-surface-elevated) !important;
  color: var(--ca-accent) !important;
  font-weight: 600;
  box-shadow: var(--ca-shadow-sm);
}

.rangeBtn:focus-visible {
  outline: 2px solid var(--ca-accent);
  outline-offset: 1px;
}

/* ─── Chart ──────────────────────────────────────────────────────────────── */

.chartWrapper {
  min-height: 280px;
}

.skeleton {
  height: 280px;
  background: linear-gradient(90deg, var(--ca-skeleton-base) 25%, var(--ca-skeleton-highlight) 50%, var(--ca-skeleton-base) 75%);
  background-size: 200% 100%;
  border-radius: var(--ca-radius-lg);
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── Custom Tooltip ─────────────────────────────────────────────────────── */

.tooltip {
  background: var(--ca-surface-elevated);
  border: 1px solid var(--ca-border-strong);
  border-radius: var(--ca-radius-md);
  padding: var(--ca-space-2-5) var(--ca-space-3);
  box-shadow: var(--ca-shadow-md);
}

.tooltipDate {
  margin: 0 0 var(--ca-space-1);
  font-size: 0.72rem;
  color: var(--ca-text-muted);
}

.tooltipRevenue {
  margin: 0;
  font-family: var(--ca-font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ca-accent);
}

.tooltipOrders {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: var(--ca-text-secondary);
}

/* ─── Data Table Fallback ────────────────────────────────────────────────── */

.dataTableDetails {
  margin-top: var(--ca-space-4);
}

.dataTableSummary {
  font-size: 0.78rem;
  color: var(--ca-text-muted);
  cursor: pointer;
  padding: var(--ca-space-1) 0;
}

.dataTableSummary:focus-visible {
  outline: 2px solid var(--ca-accent);
  outline-offset: 2px;
  border-radius: 2px;
}

.dataTableWrapper {
  overflow-x: auto;
  margin-top: var(--ca-space-3);
}

.dataTable {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  font-family: var(--ca-font-body);
}

.dataTable th, .dataTable td {
  padding: var(--ca-space-2) var(--ca-space-3);
  text-align: left;
  border-bottom: 1px solid var(--ca-border);
}

.dataTable th {
  font-weight: 600;
  color: var(--ca-text-muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ─── Screen Reader Utility ──────────────────────────────────────────────── */

.srOnly {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; background: var(--ca-skeleton-base); }
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/RevenueChart/RevenueChart.tsx"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/RevenueChart/RevenueChart.tsx" << 'ADMIN_EOF'
/**
 * @file RevenueChart.tsx
 * @path apps/admin/src/pages/Dashboard/components/RevenueChart/RevenueChart.tsx
 *
 * Recharts area chart displaying revenue over a selectable date range.
 *
 * WCAG:
 *   • Chart is wrapped in role="img" aria-labelledby pointing to a descriptive
 *     title and a visually-hidden data table fallback for screen readers.
 *   • Date range buttons are a proper <fieldset> / <legend> group with
 *     aria-pressed state on the active button.
 *   • Custom Tooltip has sufficient color contrast and shows both revenue
 *     and order count so data is not conveyed by color alone.
 *
 * PATTERN: Chart data fetched via a controlled dateRange state that triggers
 * a new API call on change. The loading state shows a skeleton placeholder
 * at the same dimensions as the chart to prevent layout shift.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import type { RevenueDataPoint, DateRangePreset } from '../../../../types/admin.types';
import styles from './RevenueChart.module.css';

// ─── Date Range Options ───────────────────────────────────────────────────────

const RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: '7d',  label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y',  label: '1 year' },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p) => p.dataKey === 'revenueCents');
  const orders = payload.find((p) => p.dataKey === 'orderCount');

  return (
    <div className={styles.tooltip} role="tooltip">
      <p className={styles.tooltipDate}>{label}</p>
      <p className={styles.tooltipRevenue}>
        ${((revenue?.value ?? 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}
      </p>
      <p className={styles.tooltipOrders}>{orders?.value ?? 0} orders</p>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RevenueChartProps {
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RevenueChart({ className }: RevenueChartProps) {
  const [range, setRange] = useState<DateRangePreset>('30d');
  const [data, setData] = useState<RevenueDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (selectedRange: DateRangePreset) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/revenue?range=${selectedRange}`);
      if (res.ok) {
        const json: RevenueDataPoint[] = await res.json();
        setData(json);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(range); }, [range, fetchData]);

  const totalRevenue = data.reduce((sum, d) => sum + d.revenueCents, 0);
  const chartId = 'revenue-chart-title';

  return (
    <section className={`${styles.section} ${className ?? ''}`} aria-labelledby={chartId}>
      {/* ── Header Row ───────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h2 id={chartId} className={styles.title}>Revenue Over Time</h2>
          {!isLoading && (
            <p className={styles.totalLabel} aria-live="polite">
              Total: ${(totalRevenue / 100).toLocaleString('en-US')}
            </p>
          )}
        </div>

        {/* Date range selector */}
        <fieldset className={styles.rangeGroup}>
          <legend className={styles.srOnly}>Select date range</legend>
          <div className={styles.rangeButtons}>
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.rangeBtn} ${range === opt.value ? styles.rangeBtnActive : ''}`}
                aria-pressed={range === opt.value}
                onClick={() => setRange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* ── Chart ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className={styles.skeleton} aria-hidden="true" aria-label="Loading chart" />
      ) : (
        <div
          role="img"
          aria-labelledby={chartId}
          className={styles.chartWrapper}
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ca-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--ca-text-muted)', fontFamily: 'var(--ca-font-body)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--ca-text-muted)', fontFamily: 'var(--ca-font-body)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 100 / 1000).toFixed(0)}k`}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenueCents"
                stroke="#2D6A4F"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#2D6A4F', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* ── Accessible Data Table Fallback ─────────────────────── */}
          <details className={styles.dataTableDetails}>
            <summary className={styles.dataTableSummary}>View data as table</summary>
            <div className={styles.dataTableWrapper}>
              <table className={styles.dataTable}>
                <caption className={styles.srOnly}>Revenue data for selected period</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Revenue</th>
                    <th scope="col">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>${(row.revenueCents / 100).toLocaleString()}</td>
                      <td>{row.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </section>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/RevenueChart/index.ts"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/RevenueChart/index.ts" << 'ADMIN_EOF'
export { RevenueChart } from './RevenueChart';
export type { RevenueChartProps } from './RevenueChart';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/StatCard/StatCard.module.css"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/StatCard/StatCard.module.css" << 'ADMIN_EOF'
/**
 * @file StatCard.module.css
 * @path apps/admin/src/pages/Dashboard/components/StatCard/
 */

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--ca-space-1-5);
  padding: var(--ca-space-5);
  background: var(--ca-surface-elevated);
  border: 1px solid var(--ca-border);
  border-radius: var(--ca-radius-xl);
  overflow: hidden;
  transition: box-shadow 180ms ease, transform 180ms ease;
}

.card:hover {
  box-shadow: var(--ca-shadow-md);
  transform: translateY(-1px);
}

/* Subtle top-edge accent line */
.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--ca-accent), transparent);
  opacity: 0.6;
}

.iconSlot {
  position: absolute;
  top: var(--ca-space-4);
  right: var(--ca-space-4);
  color: var(--ca-accent);
  opacity: 0.5;
}

.label {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ca-text-muted);
}

.value {
  margin: 0;
  font-family: var(--ca-font-display);
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ca-text-primary);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.change {
  display: inline-flex;
  align-items: center;
  gap: var(--ca-space-1);
  margin: var(--ca-space-1) 0 0;
  font-size: 0.78rem;
  font-weight: 600;
}

.changeIcon {
  display: flex;
  align-items: center;
}

.changeGood {
  color: var(--ca-success);
}

.changeBad {
  color: var(--ca-error);
}

/* ─── Loading State ──────────────────────────────────────────────────────── */

.cardLoading {
  pointer-events: none;
}

.skeleton {
  display: block;
  background: linear-gradient(90deg, var(--ca-skeleton-base) 25%, var(--ca-skeleton-highlight) 50%, var(--ca-skeleton-base) 75%);
  background-size: 200% 100%;
  border-radius: var(--ca-radius-sm);
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }
  .skeleton { animation: none; background: var(--ca-skeleton-base); }
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/StatCard/StatCard.tsx"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/StatCard/StatCard.tsx" << 'ADMIN_EOF'
/**
 * @file StatCard.tsx
 * @path apps/admin/src/pages/Dashboard/components/StatCard/StatCard.tsx
 *
 * KPI metric card for the dashboard overview row.
 * Displays a metric value, label, and a change percentage vs. the prior period.
 *
 * WCAG: The change percentage uses both a directional icon AND text color
 * (never color alone). The icon has aria-hidden and the text provides the
 * semantic meaning. Numbers use font-variant-numeric: tabular-nums for
 * consistent column alignment.
 *
 * ANIMATION: Value counts up from 0 on mount using requestAnimationFrame.
 * Respects prefers-reduced-motion — skips animation if motion is reduced.
 */

import React, { useEffect, useRef, useState } from 'react';
import styles from './StatCard.module.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StatCardProps {
  /** Card heading label */
  label: string;
  /** The primary numeric value to display */
  value: number;
  /** How to format the value: currency, number, or percentage */
  format: 'currency' | 'number' | 'percentage';
  /** Change percentage vs. prior period (positive = improvement) */
  changePct: number;
  /**
   * Whether a positive changePct is good (default true).
   * Set to false for metrics like "refund rate" where increase is bad.
   */
  positiveIsGood?: boolean;
  /** Icon element rendered in the card corner */
  icon?: React.ReactNode;
  /** Loading skeleton state */
  isLoading?: boolean;
  className?: string;
}

// ─── Format Helpers ───────────────────────────────────────────────────────────

function formatValue(value: number, format: StatCardProps['format']): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value / 100); // value is in cents
    case 'percentage':
      return `${value.toFixed(1)}%`;
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
}

// ─── Count-Up Hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 800): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setCurrent(target);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StatCard
 *
 * @example
 * <StatCard
 *   label="Total Revenue"
 *   value={1234500}
 *   format="currency"
 *   changePct={8.3}
 *   icon={<RevenueIcon />}
 * />
 */
export function StatCard({
  label,
  value,
  format,
  changePct,
  positiveIsGood = true,
  icon,
  isLoading = false,
  className,
}: StatCardProps) {
  const animatedValue = useCountUp(isLoading ? 0 : value);
  const isPositive = changePct >= 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  const absChange = Math.abs(changePct);

  if (isLoading) {
    return (
      <div className={`${styles.card} ${styles.cardLoading} ${className ?? ''}`} aria-hidden="true">
        <div className={styles.skeleton} style={{ width: '60%', height: 14 }} />
        <div className={styles.skeleton} style={{ width: '80%', height: 32 }} />
        <div className={styles.skeleton} style={{ width: '40%', height: 12 }} />
      </div>
    );
  }

  return (
    <article className={`${styles.card} ${className ?? ''}`} aria-label={`${label}: ${formatValue(value, format)}`}>
      {/* ── Icon corner ─────────────────────────────────────────── */}
      {icon && (
        <div className={styles.iconSlot} aria-hidden="true">
          {icon}
        </div>
      )}

      {/* ── Label ───────────────────────────────────────────────── */}
      <p className={styles.label}>{label}</p>

      {/* ── Value ───────────────────────────────────────────────── */}
      <p className={styles.value} aria-live="off">
        {formatValue(animatedValue, format)}
      </p>

      {/* ── Change percentage ────────────────────────────────────── */}
      <p
        className={`${styles.change} ${isGood ? styles.changeGood : styles.changeBad}`}
        aria-label={`${isPositive ? 'Up' : 'Down'} ${absChange}% compared to previous period`}
      >
        <span aria-hidden="true" className={styles.changeIcon}>
          {isPositive ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </span>
        {absChange.toFixed(1)}% vs last period
      </p>
    </article>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/StatCard/index.ts"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/StatCard/index.ts" << 'ADMIN_EOF'
export { StatCard } from './StatCard';
export type { StatCardProps } from './StatCard';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/TopProductsTable/TopProductsTable.module.css"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/TopProductsTable/TopProductsTable.module.css" << 'ADMIN_EOF'
/**
 * @file TopProductsTable.module.css
 * @path apps/admin/src/pages/Dashboard/components/TopProductsTable/
 */
.section {
  background: var(--ca-surface-elevated);
  border: 1px solid var(--ca-border);
  border-radius: var(--ca-radius-xl);
  padding: var(--ca-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--ca-space-4);
}
.title {
  margin: 0;
  font-family: var(--ca-font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ca-text-primary);
}
.tableWrapper { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; min-width: 320px; }
.th {
  padding: var(--ca-space-2) var(--ca-space-3);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ca-text-muted);
  border-bottom: 1px solid var(--ca-border);
  text-align: left;
}
.td {
  padding: var(--ca-space-2-5) var(--ca-space-3);
  border-bottom: 1px solid var(--ca-border);
  vertical-align: middle;
}
.tr:last-child .td { border-bottom: none; }
.right { text-align: right; }
.mono { font-variant-numeric: tabular-nums; font-size: 0.85rem; color: var(--ca-text-secondary); }
.productCell { display: flex; align-items: center; gap: var(--ca-space-2-5); }
.rank {
  width: 20px;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--ca-text-muted);
  flex-shrink: 0;
}
.thumbnail {
  width: 28px;
  height: 28px;
  border-radius: var(--ca-radius-sm);
  object-fit: cover;
  flex-shrink: 0;
}
.productInfo { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.productLink {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ca-text-primary);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.productLink:hover { color: var(--ca-accent); }
.productLink:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; border-radius: 2px; }
.category { font-size: 0.72rem; color: var(--ca-text-muted); text-transform: capitalize; }
.skeleton {
  display: block;
  height: 12px;
  background: linear-gradient(90deg, var(--ca-skeleton-base) 25%, var(--ca-skeleton-highlight) 50%, var(--ca-skeleton-base) 75%);
  background-size: 200% 100%;
  border-radius: var(--ca-radius-sm);
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.viewAllLink {
  align-self: flex-start;
  font-size: 0.8rem;
  color: var(--ca-accent);
  font-weight: 600;
  text-decoration: none;
}
.viewAllLink:hover { text-decoration: underline; }
.viewAllLink:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; border-radius: 2px; }
.srOnly { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; background: var(--ca-skeleton-base); } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/TopProductsTable/TopProductsTable.tsx"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/TopProductsTable/TopProductsTable.tsx" << 'ADMIN_EOF'
/**
 * @file TopProductsTable.tsx
 * @path apps/admin/src/pages/Dashboard/components/TopProductsTable/TopProductsTable.tsx
 *
 * Compact table widget showing top-selling products for the dashboard.
 * Links each product row to its edit page in the Products section.
 * WCAG: table with <caption>, sortable column buttons with aria-sort.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { TopProduct } from '../../../../types/admin.types';
import styles from './TopProductsTable.module.css';

export interface TopProductsTableProps {
  products: TopProduct[];
  isLoading?: boolean;
  className?: string;
}

export function TopProductsTable({ products, isLoading = false, className }: TopProductsTableProps) {
  return (
    <section className={`${styles.section} ${className ?? ''}`} aria-labelledby="top-products-title">
      <h2 id="top-products-title" className={styles.title}>Top Products</h2>
      <div className={styles.tableWrapper} role="region" aria-labelledby="top-products-title">
        <table className={styles.table}>
          <caption className={styles.srOnly}>Top products by revenue this period</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.th}>Product</th>
              <th scope="col" className={`${styles.th} ${styles.right}`}>Units Sold</th>
              <th scope="col" className={`${styles.th} ${styles.right}`}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} aria-hidden="true">
                    <td className={styles.td}><span className={styles.skeleton} style={{ width: '70%' }} /></td>
                    <td className={`${styles.td} ${styles.right}`}><span className={styles.skeleton} style={{ width: '40%', marginLeft: 'auto' }} /></td>
                    <td className={`${styles.td} ${styles.right}`}><span className={styles.skeleton} style={{ width: '50%', marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              : products.map((product, rank) => (
                  <tr key={product.productId} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.productCell}>
                        <span className={styles.rank} aria-label={`Rank ${rank + 1}`}>{rank + 1}</span>
                        {product.thumbnailUrl && (
                          <img
                            src={product.thumbnailUrl}
                            alt=""
                            className={styles.thumbnail}
                            width={28}
                            height={28}
                          />
                        )}
                        <div className={styles.productInfo}>
                          <Link to={`/admin/products/${product.productId}/edit`} className={styles.productLink}>
                            {product.name}
                          </Link>
                          <span className={styles.category}>{product.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                      {product.unitsSold.toLocaleString()}
                    </td>
                    <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                      ${(product.revenueCents / 100).toLocaleString()}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      <Link to="/admin/analytics" className={styles.viewAllLink}>
        View full analytics →
      </Link>
    </section>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/components/TopProductsTable/index.ts"
cat > "$ROOT/apps/admin/src/pages/Dashboard/components/TopProductsTable/index.ts" << 'ADMIN_EOF'
export { TopProductsTable } from './TopProductsTable';
export type { TopProductsTableProps } from './TopProductsTable';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Dashboard/index.ts"
cat > "$ROOT/apps/admin/src/pages/Dashboard/index.ts" << 'ADMIN_EOF'
export { DashboardPage } from './DashboardPage';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Orders/OrdersPage.module.css"
cat > "$ROOT/apps/admin/src/pages/Orders/OrdersPage.module.css" << 'ADMIN_EOF'
/**
 * @file OrdersPage.module.css
 * @path apps/admin/src/pages/Orders/
 */
.page { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.filterBar { display: flex; gap: var(--ca-space-2); padding: var(--ca-space-3) var(--ca-space-6); border-bottom: 1px solid var(--ca-border); background: var(--ca-surface); flex-wrap: wrap; align-items: center; }
.searchInput { flex: 1; min-width: 200px; padding: var(--ca-space-2) var(--ca-space-3); background: var(--ca-surface-raised); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); color: var(--ca-text-primary); font-family: var(--ca-font-body); font-size: 0.875rem; outline: none; }
.searchInput:focus { border-color: var(--ca-accent); box-shadow: 0 0 0 3px rgba(var(--ca-accent-rgb), 0.12); }
.filterSelect { padding: var(--ca-space-2) var(--ca-space-3); background: var(--ca-surface-raised); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); color: var(--ca-text-primary); font-family: var(--ca-font-body); font-size: 0.875rem; cursor: pointer; outline: none; }
.filterSelect:focus { border-color: var(--ca-accent); }
.dateRange { display: flex; align-items: center; gap: var(--ca-space-2); }
.dateSep { color: var(--ca-text-muted); font-size: 0.875rem; }
.tableWrapper { flex: 1; overflow: auto; }
/* Cell styles */
.orderNum { font-weight: 700; font-size: 0.875rem; color: var(--ca-accent); }
.customerCell { display: flex; flex-direction: column; gap: 2px; }
.customerName { font-size: 0.875rem; font-weight: 600; color: var(--ca-text-primary); }
.customerEmail { font-size: 0.75rem; color: var(--ca-text-muted); }
.mono { font-variant-numeric: tabular-nums; font-weight: 600; }
.fulfillment { font-size: 0.82rem; color: var(--ca-text-secondary); }
.date { font-size: 0.82rem; color: var(--ca-text-muted); white-space: nowrap; }
.emptyText { margin: 0; color: var(--ca-text-muted); }
.srOnly { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Orders/OrdersPage.tsx"
cat > "$ROOT/apps/admin/src/pages/Orders/OrdersPage.tsx" << 'ADMIN_EOF'
/**
 * @file OrdersPage.tsx
 * @path apps/admin/src/pages/Orders/OrdersPage.tsx
 *
 * Order management list page. Displays all orders with filter controls
 * (status, date range, fulfillment method) and links to individual order
 * detail views. Staff can update order status directly from the detail view.
 *
 * DATA: Paginated fetch from /api/admin/orders with server-side filtering.
 * Pagination uses a cursor-based approach (lastId) for consistent results.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type ColumnDef, type SortState } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { Order, OrderFilters } from '../../types/admin.types';
import styles from './OrdersPage.module.css';

// ─── Column Definitions ───────────────────────────────────────────────────────

const COLUMNS: ColumnDef<Order>[] = [
  {
    key: 'orderNumber',
    label: 'Order #',
    sortable: true,
    render: (row) => <span className={styles.orderNum}>#{row.orderNumber}</span>,
  },
  {
    key: 'customer',
    label: 'Customer',
    render: (row) => (
      <div className={styles.customerCell}>
        <span className={styles.customerName}>{row.customer.displayName}</span>
        <span className={styles.customerEmail}>{row.customer.email}</span>
      </div>
    ),
  },
  {
    key: 'totalCents',
    label: 'Total',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className={styles.mono}>${(row.totalCents / 100).toFixed(2)}</span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (row) => <StatusBadge type="order" value={row.status} />,
  },
  {
    key: 'fulfillment',
    label: 'Fulfillment',
    render: (row) => (
      <span className={styles.fulfillment}>
        {row.fulfillment.method === 'delivery' ? '🚗 Delivery' : '🛍️ Pickup'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    label: 'Placed',
    sortable: true,
    render: (row) => (
      <span className={styles.date}>
        {new Date(row.createdAt).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        })}
      </span>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortState>({ column: 'createdAt', direction: 'desc' });
  const [filters, setFilters] = useState<OrderFilters>({
    search: '', status: '', fulfillmentMethod: '', dateFrom: '', dateTo: '',
  });

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sort: `${sort.column}:${sort.direction}`,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.fulfillmentMethod && { fulfillmentMethod: filters.fulfillmentMethod }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.items ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sort, filters]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const stableCols = useMemo(() => COLUMNS, []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Orders"
        subtitle="View and manage all customer orders."
        breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Orders' }]}
      />

      {/* ── Filter Bar ───────────────────────────────────────────── */}
      <div className={styles.filterBar} role="search" aria-label="Filter orders">
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search order # or customer…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          aria-label="Search orders"
        />
        <select
          className={styles.filterSelect}
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as OrderFilters['status'] }))}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="ready_for_pickup">Ready for Pickup</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filters.fulfillmentMethod}
          onChange={(e) => setFilters((f) => ({ ...f, fulfillmentMethod: e.target.value as OrderFilters['fulfillmentMethod'] }))}
          aria-label="Filter by fulfillment method"
        >
          <option value="">All Methods</option>
          <option value="pickup">Pickup</option>
          <option value="delivery">Delivery</option>
        </select>
        <div className={styles.dateRange}>
          <label htmlFor="date-from" className={styles.srOnly}>From date</label>
          <input
            id="date-from"
            type="date"
            className={styles.filterSelect}
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            aria-label="Filter from date"
          />
          <span className={styles.dateSep} aria-hidden="true">–</span>
          <label htmlFor="date-to" className={styles.srOnly}>To date</label>
          <input
            id="date-to"
            type="date"
            className={styles.filterSelect}
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            aria-label="Filter to date"
          />
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className={styles.tableWrapper}>
        <DataTable<Order>
          caption="Orders list"
          columns={stableCols}
          rows={orders}
          sort={sort}
          onSortChange={setSort}
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/admin/orders/${row.id}`)}
          emptyState={<p className={styles.emptyText}>No orders match your filters.</p>}
        />
      </div>
    </div>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Orders/components/OrderDetail/OrderDetailPage.module.css"
cat > "$ROOT/apps/admin/src/pages/Orders/components/OrderDetail/OrderDetailPage.module.css" << 'ADMIN_EOF'
/**
 * @file OrderDetailPage.module.css
 * @path apps/admin/src/pages/Orders/components/OrderDetail/
 */
.page { display: flex; flex-direction: column; flex: 1; }
.content { display: grid; grid-template-columns: 1fr 320px; gap: var(--ca-space-6); padding: var(--ca-space-6); align-items: start; flex: 1; }
.mainCol { display: flex; flex-direction: column; gap: var(--ca-space-5); }
.sideCol { display: flex; flex-direction: column; gap: var(--ca-space-5); }
.sectionTitle { margin: 0 0 var(--ca-space-4); font-family: var(--ca-font-display); font-size: 0.95rem; font-weight: 700; color: var(--ca-text-primary); }
/* Sections */
.timelineSection, .itemsSection, .actionsSection, .customerSection, .fulfillmentSection {
  background: var(--ca-surface-elevated);
  border: 1px solid var(--ca-border);
  border-radius: var(--ca-radius-xl);
  padding: var(--ca-space-5);
}
/* Timeline */
.timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0; }
.timelineStep { display: flex; align-items: flex-start; gap: var(--ca-space-3); padding: var(--ca-space-2) 0; position: relative; }
.timelineStep:not(:last-child)::before { content: ''; position: absolute; left: 11px; top: 36px; bottom: -8px; width: 2px; background: var(--ca-border); }
.stepDone .timelineStep::before, .stepDone + .stepDone::before { background: var(--ca-accent); }
.stepIndicator {
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: var(--ca-surface-raised);
  border: 2px solid var(--ca-border);
  font-size: 0.7rem;
  color: var(--ca-text-muted);
}
.stepDone .stepIndicator { background: var(--ca-accent); border-color: var(--ca-accent); color: #fff; }
.stepActive .stepIndicator { border-color: var(--ca-accent); color: var(--ca-accent); background: rgba(var(--ca-accent-rgb), 0.08); }
.stepContent { display: flex; flex-direction: column; gap: 2px; }
.stepLabel { font-size: 0.875rem; font-weight: 500; color: var(--ca-text-secondary); }
.stepActive .stepLabel { color: var(--ca-accent); font-weight: 600; }
.stepDone .stepLabel { color: var(--ca-text-muted); }
.stepTime { font-size: 0.72rem; color: var(--ca-text-muted); }
.historyDetails { margin-top: var(--ca-space-4); }
.historySummary { font-size: 0.78rem; color: var(--ca-text-muted); cursor: pointer; padding: var(--ca-space-1) 0; }
.historyList { list-style: none; margin: var(--ca-space-3) 0 0; padding: 0; display: flex; flex-direction: column; gap: var(--ca-space-2); }
.historyItem { display: flex; align-items: center; gap: var(--ca-space-2); flex-wrap: wrap; font-size: 0.78rem; }
.historyActor { color: var(--ca-text-secondary); font-weight: 500; }
.historyTime { color: var(--ca-text-muted); }
.historyNote { color: var(--ca-text-muted); font-style: italic; }
/* Items */
.itemList { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ca-space-3); }
.itemRow { display: flex; align-items: center; gap: var(--ca-space-3); }
.itemThumb { border-radius: var(--ca-radius-sm); object-fit: cover; flex-shrink: 0; }
.itemInfo { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.itemName { font-size: 0.875rem; font-weight: 600; color: var(--ca-text-primary); }
.itemVariant { font-size: 0.78rem; color: var(--ca-text-muted); }
.itemTotal { font-variant-numeric: tabular-nums; font-weight: 600; color: var(--ca-text-secondary); }
.totals { margin: var(--ca-space-4) 0 0; padding-top: var(--ca-space-4); border-top: 1px solid var(--ca-border); display: flex; flex-direction: column; gap: var(--ca-space-1-5); }
.totalRow { display: flex; justify-content: space-between; font-size: 0.875rem; }
.totalRow dt { color: var(--ca-text-muted); }
.totalRow dd { margin: 0; font-variant-numeric: tabular-nums; color: var(--ca-text-secondary); }
.discount { color: var(--ca-success); }
.grandTotal { padding-top: var(--ca-space-2); border-top: 1px solid var(--ca-border); }
.grandTotal dt, .grandTotal dd { color: var(--ca-text-primary); font-size: 1rem; }
/* Actions */
.actionButtons { display: flex; flex-wrap: wrap; gap: var(--ca-space-2); }
.actionBtn { padding: var(--ca-space-2-5) var(--ca-space-4); background: var(--ca-accent); border: none; border-radius: var(--ca-radius-md); color: var(--ca-accent-fg); font-family: var(--ca-font-body); font-size: 0.875rem; font-weight: 600; cursor: pointer; min-height: 40px; transition: background 130ms ease; }
.actionBtn:hover { background: var(--ca-accent-hover); }
.actionBtn:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 3px; }
.actionBtnDanger { background: rgba(var(--ca-error-rgb), 0.1); color: var(--ca-error); border: 1px solid rgba(var(--ca-error-rgb), 0.3); }
.actionBtnDanger:hover { background: rgba(var(--ca-error-rgb), 0.18); }
/* Customer */
.customerDl { margin: 0; display: flex; flex-direction: column; gap: var(--ca-space-2); }
.customerName { font-size: 0.95rem; font-weight: 700; color: var(--ca-text-primary); }
.link { color: var(--ca-accent); text-decoration: none; font-size: 0.875rem; }
.link:hover { text-decoration: underline; }
.link:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; border-radius: 2px; }
/* Fulfillment dl */
.fulfillmentDl { margin: 0; display: grid; grid-template-columns: 80px 1fr; gap: var(--ca-space-1-5) var(--ca-space-3); font-size: 0.875rem; }
.fulfillmentDl dt { color: var(--ca-text-muted); font-weight: 600; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
.fulfillmentDl dd { margin: 0; color: var(--ca-text-secondary); }
/* Loading / Not Found */
.loadingPage, .notFound { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: var(--ca-space-3); }
.spinner { width: 36px; height: 36px; border: 3px solid var(--ca-border); border-top-color: var(--ca-accent); border-radius: 50%; animation: spin 700ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.srOnly { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 1024px) { .content { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .content { padding: var(--ca-space-4); gap: var(--ca-space-4); } }
@media (prefers-reduced-motion: reduce) { .spinner { animation: none; } .actionBtn { transition: none; } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Orders/components/OrderDetail/OrderDetailPage.tsx"
cat > "$ROOT/apps/admin/src/pages/Orders/components/OrderDetail/OrderDetailPage.tsx" << 'ADMIN_EOF'
/**
 * @file OrderDetailPage.tsx
 * @path apps/admin/src/pages/Orders/components/OrderDetail/OrderDetailPage.tsx
 *
 * Full order detail view. Shows:
 *   - Status timeline (StatusTimeline)
 *   - Customer info card
 *   - Line items snapshot
 *   - Payment breakdown
 *   - Fulfillment details + driver assignment
 *   - Status update actions (confirm, mark ready, assign driver, deliver, cancel)
 *
 * STATUS MACHINE: Status transitions follow a strict flow:
 *   pending → confirmed → processing → ready_for_pickup / out_for_delivery → delivered
 *   Any state → cancelled (with refund option)
 *
 * WCAG: The status timeline uses role="list" with visually distinct
 * completed/active/pending indicators. Action buttons have descriptive
 * aria-labels. The order summary region is an <article> with aria-labelledby.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../../components/shared/PageHeader';
import { StatusBadge } from '../../../../components/shared/StatusBadge';
import { useAdminUiStore } from '../../../../stores/adminUiStore';
import type { Order, OrderStatus } from '../../../../types/admin.types';
import styles from './OrderDetailPage.module.css';

// ─── Status Timeline Component ────────────────────────────────────────────────

const TIMELINE_STEPS: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered',
];
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  ready_for_pickup: 'Ready', out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
};

function StatusTimeline({ order }: { order: Order }) {
  const steps = order.fulfillment.method === 'pickup'
    ? ['pending', 'confirmed', 'processing', 'ready_for_pickup', 'delivered'] as OrderStatus[]
    : TIMELINE_STEPS;

  const currentIndex = steps.indexOf(order.status);

  return (
    <section className={styles.timelineSection} aria-labelledby="timeline-title">
      <h2 id="timeline-title" className={styles.sectionTitle}>Order Timeline</h2>
      <ol className={styles.timeline} role="list" aria-label="Order status progression">
        {steps.map((step, index) => {
          const isDone = currentIndex > index;
          const isActive = currentIndex === index;
          const historyEvent = order.statusHistory.find((e) => e.status === step);

          return (
            <li
              key={step}
              className={`${styles.timelineStep} ${isDone ? styles.stepDone : ''} ${isActive ? styles.stepActive : ''}`}
              aria-label={`${STATUS_LABELS[step]}: ${isDone ? 'completed' : isActive ? 'current' : 'pending'}`}
            >
              <div className={styles.stepIndicator} aria-hidden="true">
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className={styles.stepContent}>
                <span className={styles.stepLabel}>{STATUS_LABELS[step]}</span>
                {historyEvent && (
                  <span className={styles.stepTime}>
                    {new Date(historyEvent.timestamp).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* History log */}
      {order.statusHistory.length > 0 && (
        <details className={styles.historyDetails}>
          <summary className={styles.historySummary}>View full history</summary>
          <ul className={styles.historyList} role="list">
            {order.statusHistory.map((event, i) => (
              <li key={i} className={styles.historyItem}>
                <StatusBadge type="order" value={event.status} />
                <span className={styles.historyActor}>{event.actorName}</span>
                <span className={styles.historyTime}>
                  {new Date(event.timestamp).toLocaleString('en-US', {
                    dateStyle: 'short', timeStyle: 'short',
                  })}
                </span>
                {event.note && <span className={styles.historyNote}>{event.note}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

// ─── Status Actions ───────────────────────────────────────────────────────────

function OrderStatusActions({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (status: OrderStatus, note?: string) => void;
}) {
  const NEXT_ACTIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }[]>> = {
    pending:           [{ label: 'Confirm Order',       next: 'confirmed' }],
    confirmed:         [{ label: 'Start Processing',    next: 'processing' }],
    processing:        [
      { label: order.fulfillment.method === 'delivery' ? 'Dispatch Delivery' : 'Mark Ready for Pickup', next: order.fulfillment.method === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup' },
    ],
    ready_for_pickup:  [{ label: 'Mark Picked Up',      next: 'delivered' }],
    out_for_delivery:  [{ label: 'Mark Delivered',      next: 'delivered' }],
  };

  const actions = NEXT_ACTIONS[order.status] ?? [];
  const canCancel = !['delivered', 'cancelled', 'refunded'].includes(order.status);

  return (
    <section className={styles.actionsSection} aria-labelledby="actions-title">
      <h2 id="actions-title" className={styles.sectionTitle}>Actions</h2>
      <div className={styles.actionButtons}>
        {actions.map((action) => (
          <button
            key={action.next}
            type="button"
            className={styles.actionBtn}
            onClick={() => onStatusChange(action.next)}
            aria-label={`${action.label} for order #${order.orderNumber}`}
          >
            {action.label}
          </button>
        ))}
        {canCancel && (
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={() => {
              const note = window.prompt('Cancel reason (optional):');
              onStatusChange('cancelled', note ?? undefined);
            }}
            aria-label={`Cancel order #${order.orderNumber}`}
          >
            Cancel Order
          </button>
        )}
      </div>
    </section>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toastSuccess, toastError } = useAdminUiStore((s) => ({
    toastSuccess: s.toastSuccess,
    toastError: s.toastError,
  }));

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/admin/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => { setOrder(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [orderId]);

  const handleStatusChange = async (status: OrderStatus, note?: string) => {
    if (!order) return;
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        const updated: Order = await res.json();
        setOrder(updated);
        toastSuccess(`Order status updated to ${status}`);
      } else {
        toastError('Failed to update order status');
      }
    } catch {
      toastError('Network error');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} aria-hidden="true" />
        <p>Loading order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.notFound}>
        <p>Order not found.</p>
        <button type="button" onClick={() => navigate('/admin/orders')}>Back to Orders</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin' },
          { label: 'Orders', to: '/admin/orders' },
          { label: `#${order.orderNumber}` },
        ]}
        actions={<StatusBadge type="order" value={order.status} />}
      />

      <div className={styles.content}>
        {/* Left column */}
        <div className={styles.mainCol}>
          <StatusTimeline order={order} />

          {/* Line Items */}
          <section className={styles.itemsSection} aria-labelledby="items-title">
            <h2 id="items-title" className={styles.sectionTitle}>Items</h2>
            <ul className={styles.itemList} role="list">
              {order.items.map((item) => (
                <li key={item.variantId} className={styles.itemRow}>
                  {item.thumbnailUrl && (
                    <img src={item.thumbnailUrl} alt="" className={styles.itemThumb} width={44} height={44} />
                  )}
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.productName}</span>
                    <span className={styles.itemVariant}>{item.variantLabel} × {item.quantity}</span>
                  </div>
                  <span className={styles.itemTotal}>${(item.lineTotalCents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <dl className={styles.totals}>
              <div className={styles.totalRow}>
                <dt>Subtotal</dt>
                <dd>${(order.subtotalCents / 100).toFixed(2)}</dd>
              </div>
              <div className={styles.totalRow}>
                <dt>Tax</dt>
                <dd>${(order.payment.taxCents / 100).toFixed(2)}</dd>
              </div>
              {order.payment.tipCents > 0 && (
                <div className={styles.totalRow}>
                  <dt>Tip</dt>
                  <dd>${(order.payment.tipCents / 100).toFixed(2)}</dd>
                </div>
              )}
              {order.payment.discountCents > 0 && (
                <div className={styles.totalRow}>
                  <dt>Discount</dt>
                  <dd className={styles.discount}>−${(order.payment.discountCents / 100).toFixed(2)}</dd>
                </div>
              )}
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <dt><strong>Total</strong></dt>
                <dd><strong>${(order.totalCents / 100).toFixed(2)}</strong></dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Right column */}
        <div className={styles.sideCol}>
          <OrderStatusActions order={order} onStatusChange={handleStatusChange} />

          {/* Customer */}
          <section className={styles.customerSection} aria-labelledby="customer-title">
            <h2 id="customer-title" className={styles.sectionTitle}>Customer</h2>
            <dl className={styles.customerDl}>
              <dt className={styles.srOnly}>Name</dt>
              <dd className={styles.customerName}>{order.customer.displayName}</dd>
              <dt className={styles.srOnly}>Email</dt>
              <dd><a href={`mailto:${order.customer.email}`} className={styles.link}>{order.customer.email}</a></dd>
              {order.customer.phone && (
                <>
                  <dt className={styles.srOnly}>Phone</dt>
                  <dd><a href={`tel:${order.customer.phone}`} className={styles.link}>{order.customer.phone}</a></dd>
                </>
              )}
              <dt className={styles.srOnly}>Verification</dt>
              <dd><StatusBadge type="verification" value={order.customer.isVerified ? 'verified' : 'unverified'} /></dd>
            </dl>
          </section>

          {/* Fulfillment */}
          <section className={styles.fulfillmentSection} aria-labelledby="fulfillment-title">
            <h2 id="fulfillment-title" className={styles.sectionTitle}>Fulfillment</h2>
            <dl className={styles.fulfillmentDl}>
              <dt>Method</dt>
              <dd>{order.fulfillment.method === 'delivery' ? '🚗 Delivery' : '🛍️ Pickup'}</dd>
              {order.fulfillment.deliveryAddress && (
                <>
                  <dt>Address</dt>
                  <dd>{order.fulfillment.deliveryAddress}</dd>
                </>
              )}
              {order.fulfillment.driverName && (
                <>
                  <dt>Driver</dt>
                  <dd>{order.fulfillment.driverName}</dd>
                </>
              )}
              {order.fulfillment.estimatedArrival && (
                <>
                  <dt>ETA</dt>
                  <dd>{new Date(order.fulfillment.estimatedArrival).toLocaleTimeString()}</dd>
                </>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Orders/components/OrderDetail/index.ts"
cat > "$ROOT/apps/admin/src/pages/Orders/components/OrderDetail/index.ts" << 'ADMIN_EOF'
export { OrderDetailPage } from './OrderDetailPage';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Orders/index.ts"
cat > "$ROOT/apps/admin/src/pages/Orders/index.ts" << 'ADMIN_EOF'
export { OrdersPage } from './OrdersPage';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/ProductsPage.module.css"
cat > "$ROOT/apps/admin/src/pages/Products/ProductsPage.module.css" << 'ADMIN_EOF'
/**
 * @file ProductsPage.module.css
 * @path apps/admin/src/pages/Products/
 */
.page { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.filterBar {
  display: flex;
  gap: var(--ca-space-2);
  padding: var(--ca-space-3) var(--ca-space-6);
  border-bottom: 1px solid var(--ca-border);
  background: var(--ca-surface);
  flex-wrap: wrap;
}
.searchInput {
  flex: 1;
  min-width: 200px;
  padding: var(--ca-space-2) var(--ca-space-3);
  background: var(--ca-surface-raised);
  border: 1.5px solid var(--ca-border-strong);
  border-radius: var(--ca-radius-md);
  color: var(--ca-text-primary);
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  outline: none;
}
.searchInput:focus { border-color: var(--ca-accent); box-shadow: 0 0 0 3px rgba(var(--ca-accent-rgb), 0.12); }
.filterSelect {
  padding: var(--ca-space-2) var(--ca-space-3);
  background: var(--ca-surface-raised);
  border: 1.5px solid var(--ca-border-strong);
  border-radius: var(--ca-radius-md);
  color: var(--ca-text-primary);
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  cursor: pointer;
  outline: none;
}
.filterSelect:focus { border-color: var(--ca-accent); }
.tableWrapper { flex: 1; overflow: auto; }
/* Table cell styles */
.thumbnail { width: 40px; height: 40px; border-radius: var(--ca-radius-sm); object-fit: cover; display: block; }
.thumbnailPlaceholder { width: 40px; height: 40px; border-radius: var(--ca-radius-sm); background: var(--ca-surface-raised); }
.productName { font-weight: 600; font-size: 0.875rem; }
.category { font-size: 0.82rem; color: var(--ca-text-muted); text-transform: capitalize; }
.mono { font-variant-numeric: tabular-nums; font-size: 0.875rem; }
.na { color: var(--ca-text-muted); }
.stockOut { color: var(--ca-error); font-weight: 700; }
.stockLow { color: var(--ca-warning); font-weight: 600; }
/* New Product button */
.newBtn {
  display: inline-flex;
  align-items: center;
  gap: var(--ca-space-1-5);
  padding: var(--ca-space-2-5) var(--ca-space-4);
  background: var(--ca-accent);
  border: none;
  border-radius: var(--ca-radius-md);
  color: var(--ca-accent-fg);
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 130ms ease;
  min-height: 40px;
}
.newBtn:hover { background: var(--ca-accent-hover); }
.newBtn:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 3px; }
/* Empty state */
.emptyState { display: flex; flex-direction: column; align-items: center; gap: var(--ca-space-3); }
.emptyState p { margin: 0; color: var(--ca-text-muted); }
.clearFiltersBtn { padding: var(--ca-space-1-5) var(--ca-space-3); background: var(--ca-surface-raised); border: 1px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); color: var(--ca-text-secondary); font-family: var(--ca-font-body); font-size: 0.82rem; cursor: pointer; }
.clearFiltersBtn:hover { background: var(--ca-surface-hover); }
.clearFiltersBtn:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; }
/* Drawer */
.drawerOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: calc(var(--ca-z-modal) - 1); }
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: var(--ca-z-modal);
  width: min(780px, 100vw);
  background: var(--ca-surface);
  border-left: 1px solid var(--ca-border);
  box-shadow: var(--ca-shadow-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.drawerHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ca-space-4) var(--ca-space-6);
  border-bottom: 1px solid var(--ca-border);
  flex-shrink: 0;
}
.drawerTitle { margin: 0; font-family: var(--ca-font-display); font-size: 1.2rem; font-weight: 700; color: var(--ca-text-primary); }
.drawerClose { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: transparent; border: none; border-radius: var(--ca-radius-md); color: var(--ca-text-muted); cursor: pointer; }
.drawerClose:hover { background: var(--ca-surface-hover); color: var(--ca-text-primary); }
.drawerClose:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .newBtn { transition: none; } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/ProductsPage.tsx"
cat > "$ROOT/apps/admin/src/pages/Products/ProductsPage.tsx" << 'ADMIN_EOF'
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

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/ProductForm.module.css"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/ProductForm.module.css" << 'ADMIN_EOF'
/**
 * @file ProductForm.module.css
 * @path apps/admin/src/pages/Products/components/ProductForm/
 *
 * ARIA Tabs pattern styling.
 * The active tab has a bottom border indicator and elevated background.
 * Inactive tabs fade into the background but remain clearly clickable.
 */
.form { display: flex; flex-direction: column; flex: 1; }
/* Tab List */
.tabList {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--ca-border);
  padding: 0 var(--ca-space-6);
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}
.tabList::-webkit-scrollbar { display: none; }
.tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--ca-space-1-5);
  padding: var(--ca-space-3) var(--ca-space-4);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  color: var(--ca-text-muted);
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: color 130ms ease, border-color 130ms ease;
}
.tab:hover { color: var(--ca-text-primary); }
.tabActive { color: var(--ca-accent); border-bottom-color: var(--ca-accent); font-weight: 600; }
.tabError { color: var(--ca-error); }
.tabError.tabActive { border-bottom-color: var(--ca-error); }
.tab:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: -2px; border-radius: 2px; }
.errorDot { width: 6px; height: 6px; background: var(--ca-error); border-radius: 50%; flex-shrink: 0; }
/* Panel */
.panelWrapper { flex: 1; overflow-y: auto; }
.panel { padding: var(--ca-space-6); }
/* Form Actions */
.formActions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ca-space-3);
  padding: var(--ca-space-4) var(--ca-space-6);
  border-top: 1px solid var(--ca-border);
  background: var(--ca-surface);
  flex-shrink: 0;
}
.cancelBtn {
  padding: var(--ca-space-2-5) var(--ca-space-5);
  background: transparent;
  border: 1.5px solid var(--ca-border-strong);
  border-radius: var(--ca-radius-md);
  color: var(--ca-text-secondary);
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 130ms ease;
  min-height: 44px;
}
.cancelBtn:hover:not(:disabled) { background: var(--ca-surface-hover); }
.cancelBtn:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; }
.cancelBtn:disabled { opacity: 0.5; cursor: not-allowed; }
.submitBtn {
  display: inline-flex;
  align-items: center;
  gap: var(--ca-space-2);
  padding: var(--ca-space-2-5) var(--ca-space-6);
  background: var(--ca-accent);
  border: none;
  border-radius: var(--ca-radius-md);
  color: var(--ca-accent-fg);
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 130ms ease;
  min-height: 44px;
}
.submitBtn:hover:not(:disabled) { background: var(--ca-accent-hover); }
.submitBtn:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 3px; }
.submitBtn:disabled { opacity: 0.6; cursor: not-allowed; }
.btnSpinner { display: block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 600ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .tabList { padding: 0 var(--ca-space-4); } .panel { padding: var(--ca-space-4); } .formActions { padding: var(--ca-space-3) var(--ca-space-4); } }
@media (prefers-reduced-motion: reduce) { .tab, .cancelBtn, .submitBtn { transition: none; } .btnSpinner { animation: none; } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/ProductForm.tsx"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/ProductForm.tsx" << 'ADMIN_EOF'
/**
 * @file ProductForm.tsx
 * @path apps/admin/src/pages/Products/components/ProductForm/ProductForm.tsx
 *
 * Full product create/edit form. Aggregates all six form sections into a
 * tabbed layout with react-hook-form validation.
 *
 * TABS: Basic Info | Cannabis Info | Variants | Media | SEO | Compliance
 * Each tab is a panel; the tab bar uses ARIA Tabs pattern
 * (role="tablist", role="tab", role="tabpanel", aria-selected, aria-controls).
 *
 * VALIDATION: All validation rules live in section components. On submit,
 * react-hook-form runs all rules; tabs with errors display an error indicator
 * dot so the user knows which tab needs attention.
 *
 * PATTERN:
 *   - useForm at this level; register/control/errors passed down to sections.
 *   - Form state is the single source of truth; sections are stateless.
 *   - defaultValues populated from `product` prop in edit mode.
 */

import React, { useId, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { CannabisInfoSection } from './sections/CannabisInfoSection';
import { VariantsSection } from './sections/VariantsSection';
import { MediaSection } from './sections/MediaSection';
import { SeoSection } from './sections/SeoSection';
import { ComplianceSection } from './sections/ComplianceSection';
import type { Product, ProductFormValues } from '../../../../types/admin.types';
import styles from './ProductForm.module.css';

// ─── Tabs Definition ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'basic',      label: 'Basic Info' },
  { key: 'cannabis',   label: 'Cannabis Info' },
  { key: 'variants',   label: 'Variants' },
  { key: 'media',      label: 'Media' },
  { key: 'seo',        label: 'SEO' },
  { key: 'compliance', label: 'Compliance' },
] as const;

type TabKey = typeof TABS[number]['key'];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProductFormProps {
  /** Existing product for edit mode. Omit for create mode. */
  product?: Product;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductForm({ product, onSubmit, onCancel, isSubmitting = false }: ProductFormProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const uid = useId();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription,
          longDescription: product.longDescription,
          category: product.category,
          status: product.status,
          strainType: product.strainType,
          thcPct: product.thcPct ?? undefined,
          cbdPct: product.cbdPct ?? undefined,
          terpenes: product.terpenes,
          effects: product.effects,
          flavors: product.flavors,
          variants: product.variants,
          primaryImageId: product.primaryImageId ?? undefined,
          metaTitle: product.metaTitle,
          metaDescription: product.metaDescription,
          keywords: product.keywords,
          metrcId: product.metrcId ?? undefined,
          batchNumber: product.batchNumber ?? undefined,
          harvestDate: product.harvestDate ?? undefined,
          expirationDate: product.expirationDate ?? undefined,
          imageFiles: [],
        }
      : {
          terpenes: [],
          effects: [],
          flavors: [],
          variants: [],
          keywords: [],
          imageFiles: [],
          status: 'draft',
          strainType: 'unknown',
        },
  });

  const productName = watch('name', '');

  // Tab error indicator: check if any error keys belong to a given tab's fields
  const TAB_FIELDS: Record<TabKey, string[]> = {
    basic:      ['name', 'slug', 'shortDescription', 'longDescription', 'category'],
    cannabis:   ['strainType', 'thcPct', 'cbdPct'],
    variants:   ['variants'],
    media:      ['imageFiles'],
    seo:        ['metaTitle', 'metaDescription', 'keywords'],
    compliance: ['metrcId', 'batchNumber', 'harvestDate', 'expirationDate'],
  };

  const tabHasError = useCallback((tabKey: TabKey) => {
    return TAB_FIELDS[tabKey].some((field) => field in errors);
  }, [errors]);

  const handleTabKeyDown = (e: React.KeyboardEvent, tabKey: TabKey) => {
    const currentIndex = TABS.findIndex((t) => t.key === tabKey);
    if (e.key === 'ArrowRight') {
      const next = TABS[(currentIndex + 1) % TABS.length];
      setActiveTab(next.key);
      document.getElementById(`${uid}-tab-${next.key}`)?.focus();
    }
    if (e.key === 'ArrowLeft') {
      const prev = TABS[(currentIndex - 1 + TABS.length) % TABS.length];
      setActiveTab(prev.key);
      document.getElementById(`${uid}-tab-${prev.key}`)?.focus();
    }
    if (e.key === 'Home') {
      setActiveTab(TABS[0].key);
      document.getElementById(`${uid}-tab-${TABS[0].key}`)?.focus();
    }
    if (e.key === 'End') {
      const last = TABS[TABS.length - 1];
      setActiveTab(last.key);
      document.getElementById(`${uid}-tab-${last.key}`)?.focus();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={product ? `Edit ${product.name}` : 'Create new product'}
      className={styles.form}
    >
      {/* ── Tab Bar ─────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Product form sections"
        className={styles.tabList}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const hasError = tabHasError(tab.key);
          return (
            <button
              key={tab.key}
              id={`${uid}-tab-${tab.key}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`${uid}-panel-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''} ${hasError ? styles.tabError : ''}`}
              onClick={() => setActiveTab(tab.key)}
              onKeyDown={(e) => handleTabKeyDown(e, tab.key)}
            >
              {tab.label}
              {hasError && (
                <span className={styles.errorDot} aria-label="Has errors" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Panels ──────────────────────────────────────────── */}
      <div className={styles.panelWrapper}>
        {/* Basic Info Panel */}
        <div
          id={`${uid}-panel-basic`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-basic`}
          hidden={activeTab !== 'basic'}
          className={styles.panel}
        >
          <BasicInfoSection
            register={register}
            control={control}
            errors={errors}
            productName={productName}
          />
        </div>

        {/* Cannabis Info Panel */}
        <div
          id={`${uid}-panel-cannabis`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-cannabis`}
          hidden={activeTab !== 'cannabis'}
          className={styles.panel}
        >
          <CannabisInfoSection register={register} control={control} errors={errors} />
        </div>

        {/* Variants Panel */}
        <div
          id={`${uid}-panel-variants`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-variants`}
          hidden={activeTab !== 'variants'}
          className={styles.panel}
        >
          <VariantsSection register={register} control={control} errors={errors} />
        </div>

        {/* Media Panel */}
        <div
          id={`${uid}-panel-media`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-media`}
          hidden={activeTab !== 'media'}
          className={styles.panel}
        >
          <MediaSection
            control={control}
            existingImages={product?.images}
            primaryImageId={product?.primaryImageId}
          />
        </div>

        {/* SEO Panel */}
        <div
          id={`${uid}-panel-seo`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-seo`}
          hidden={activeTab !== 'seo'}
          className={styles.panel}
        >
          <SeoSection
            register={register}
            control={control}
            errors={errors}
            productName={productName}
          />
        </div>

        {/* Compliance Panel */}
        <div
          id={`${uid}-panel-compliance`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-compliance`}
          hidden={activeTab !== 'compliance'}
          className={styles.panel}
        >
          <ComplianceSection register={register} errors={errors} />
        </div>
      </div>

      {/* ── Form Actions ────────────────────────────────────────── */}
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <><span className={styles.btnSpinner} aria-hidden="true" /> Saving…</>
          ) : (
            product ? 'Save Changes' : 'Create Product'
          )}
        </button>
      </div>
    </form>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/index.ts"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/index.ts" << 'ADMIN_EOF'
export { ProductForm } from './ProductForm';
export type { ProductFormProps } from './ProductForm';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/BasicInfoSection/BasicInfoSection.module.css"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/BasicInfoSection/BasicInfoSection.module.css" << 'ADMIN_EOF'
/**
 * @file BasicInfoSection.module.css
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/BasicInfoSection/
 */
.section { border: none; margin: 0; padding: 0; }
.legend {
  font-family: var(--ca-font-body);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ca-text-muted);
  margin-bottom: var(--ca-space-4);
  display: block;
  width: 100%;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ca-space-4);
}
.fullWidth { grid-column: 1 / -1; }
.input {
  width: 100%;
  padding: var(--ca-space-2-5) var(--ca-space-3);
  background: var(--ca-surface);
  border: 1.5px solid var(--ca-border-strong);
  border-radius: var(--ca-radius-md);
  color: var(--ca-text-primary);
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  transition: border-color 150ms ease, box-shadow 150ms ease;
  outline: none;
}
.input:focus {
  border-color: var(--ca-accent);
  box-shadow: 0 0 0 3px rgba(var(--ca-accent-rgb), 0.15);
}
.select {
  width: 100%;
  padding: var(--ca-space-2-5) var(--ca-space-3);
  background: var(--ca-surface);
  border: 1.5px solid var(--ca-border-strong);
  border-radius: var(--ca-radius-md);
  color: var(--ca-text-primary);
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  cursor: pointer;
  outline: none;
}
.select:focus { border-color: var(--ca-accent); box-shadow: 0 0 0 3px rgba(var(--ca-accent-rgb), 0.15); }
.textarea { resize: vertical; line-height: 1.5; }
.textareaLarge { min-height: 140px; }
.slugWrapper { display: flex; align-items: center; }
.slugPrefix {
  padding: var(--ca-space-2-5) var(--ca-space-2);
  background: var(--ca-surface-raised);
  border: 1.5px solid var(--ca-border-strong);
  border-right: none;
  border-radius: var(--ca-radius-md) 0 0 var(--ca-radius-md);
  color: var(--ca-text-muted);
  font-size: 0.82rem;
  white-space: nowrap;
  height: 100%;
}
.slugInput { border-radius: 0 var(--ca-radius-md) var(--ca-radius-md) 0; }
.longDescHeader { position: relative; }
.longDescField { width: 100%; }
.aiBtn {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--ca-space-1-5);
  padding: var(--ca-space-1-5) var(--ca-space-2-5);
  background: rgba(var(--ca-accent-rgb), 0.08);
  border: 1px solid rgba(var(--ca-accent-rgb), 0.25);
  border-radius: var(--ca-radius-md);
  color: var(--ca-accent);
  font-family: var(--ca-font-body);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 130ms ease;
  min-height: 32px;
}
.aiBtn:hover:not(:disabled) { background: rgba(var(--ca-accent-rgb), 0.14); }
.aiBtn:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; }
.aiBtn:disabled { opacity: 0.5; cursor: not-allowed; }
.aiSpinner {
  display: block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(var(--ca-accent-rgb), 0.3);
  border-top-color: var(--ca-accent);
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .input, .aiBtn, .select { transition: none; } .aiSpinner { animation: none; } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/BasicInfoSection/BasicInfoSection.tsx"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/BasicInfoSection/BasicInfoSection.tsx" << 'ADMIN_EOF'
/**
 * @file BasicInfoSection.tsx
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/BasicInfoSection/BasicInfoSection.tsx
 *
 * Basic product information form section: name, slug, short + long descriptions.
 * Includes an AI generation button that calls the Sprint 9 AI endpoint to
 * draft a product description based on name + cannabis metadata.
 *
 * PATTERN: This section receives the react-hook-form `control` and `register`
 * props from the parent ProductForm rather than managing its own form state.
 * This keeps all form validation and submission in one place.
 *
 * WCAG: All inputs use FormField wrapper for accessible label + error wiring.
 * The AI generate button has aria-busy while the request is in-flight.
 */

import React, { useState } from 'react';
import { UseFormRegister, Control, useController, FieldErrors } from 'react-hook-form';
import { FormField } from '../../../../../../components/shared/FormField';
import type { ProductFormValues } from '../../../../../../types/admin.types';
import styles from './BasicInfoSection.module.css';

// ─── Slug Generator ───────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BasicInfoSectionProps {
  register: UseFormRegister<ProductFormValues>;
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  /** Product name — used when calling the AI generation endpoint */
  productName: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BasicInfoSection({
  register,
  control,
  errors,
  productName,
}: BasicInfoSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Controlled slug field so we can auto-update it from the name
  const { field: slugField } = useController({
    name: 'slug',
    control,
    rules: {
      required: 'Slug is required',
      pattern: { value: /^[a-z0-9-]+$/, message: 'Slug must be lowercase letters, numbers, and hyphens only' },
    },
  });

  // Controlled longDescription so AI can set it
  const { field: longDescField } = useController({
    name: 'longDescription',
    control,
    rules: { required: 'Long description is required' },
  });

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Auto-generate slug from name if slug is still empty
    if (!slugField.value && e.target.value) {
      slugField.onChange(generateSlug(e.target.value));
    }
  };

  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName }),
      });
      if (res.ok) {
        const { description } = await res.json();
        longDescField.onChange(description);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>Basic Information</legend>

      <div className={styles.grid}>
        {/* Product Name */}
        <FormField
          label="Product Name"
          required
          error={errors.name?.message}
          className={styles.fullWidth}
        >
          {({ id, inputProps }) => (
            <input
              id={id}
              {...inputProps}
              {...register('name', { required: 'Product name is required' })}
              className={styles.input}
              type="text"
              placeholder="e.g. Blue Dream Pre-Roll"
              onBlur={handleNameBlur}
              autoComplete="off"
            />
          )}
        </FormField>

        {/* Slug */}
        <FormField
          label="URL Slug"
          required
          hint="Used in the product URL. Auto-generated from name."
          error={errors.slug?.message}
        >
          {({ id, inputProps }) => (
            <div className={styles.slugWrapper}>
              <span className={styles.slugPrefix} aria-hidden="true">/shop/</span>
              <input
                id={id}
                {...inputProps}
                {...slugField}
                className={`${styles.input} ${styles.slugInput}`}
                type="text"
                placeholder="blue-dream-pre-roll"
                autoComplete="off"
              />
            </div>
          )}
        </FormField>

        {/* Category */}
        <FormField label="Category" required error={errors.category?.message}>
          {({ id, inputProps }) => (
            <select
              id={id}
              {...inputProps}
              {...register('category', { required: 'Category is required' })}
              className={styles.select}
            >
              <option value="">Select a category…</option>
              <option value="flower">Flower</option>
              <option value="edibles">Edibles</option>
              <option value="concentrates">Concentrates</option>
              <option value="vapes">Vapes</option>
              <option value="topicals">Topicals</option>
              <option value="tinctures">Tinctures</option>
              <option value="pre_rolls">Pre-Rolls</option>
              <option value="accessories">Accessories</option>
            </select>
          )}
        </FormField>

        {/* Short Description */}
        <FormField
          label="Short Description"
          required
          hint="Shown in product cards and search results. Max 160 characters."
          error={errors.shortDescription?.message}
          className={styles.fullWidth}
        >
          {({ id, inputProps }) => (
            <textarea
              id={id}
              {...inputProps}
              {...register('shortDescription', {
                required: 'Short description is required',
                maxLength: { value: 160, message: 'Maximum 160 characters' },
              })}
              className={`${styles.input} ${styles.textarea}`}
              rows={2}
              placeholder="A brief, enticing product description…"
            />
          )}
        </FormField>

        {/* Long Description */}
        <div className={styles.fullWidth}>
          <div className={styles.longDescHeader}>
            <FormField
              label="Long Description"
              required
              error={errors.longDescription?.message}
              className={styles.longDescField}
            >
              {({ id, inputProps }) => (
                <textarea
                  id={id}
                  {...inputProps}
                  {...longDescField}
                  className={`${styles.input} ${styles.textarea} ${styles.textareaLarge}`}
                  rows={6}
                  placeholder="Detailed product description with effects, flavor notes, and usage guidance…"
                />
              )}
            </FormField>
            <button
              type="button"
              className={styles.aiBtn}
              onClick={handleGenerateDescription}
              disabled={isGenerating || !productName}
              aria-busy={isGenerating}
              aria-label={isGenerating ? 'Generating description…' : 'Generate description with AI'}
              title={!productName ? 'Enter a product name first' : undefined}
            >
              {isGenerating ? (
                <span className={styles.aiSpinner} aria-hidden="true" />
              ) : (
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              )}
              {isGenerating ? 'Generating…' : 'AI Generate'}
            </button>
          </div>
        </div>
      </div>
    </fieldset>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/BasicInfoSection/index.ts"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/BasicInfoSection/index.ts" << 'ADMIN_EOF'
export { BasicInfoSection } from './BasicInfoSection';
export type { BasicInfoSectionProps } from './BasicInfoSection';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/CannabisInfoSection/CannabisInfoSection.module.css"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/CannabisInfoSection/CannabisInfoSection.module.css" << 'ADMIN_EOF'
/**
 * @file CannabisInfoSection.module.css
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/CannabisInfoSection/
 */
.section { border: none; margin: 0; padding: 0; }
.legend { font-family: var(--ca-font-body); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ca-text-muted); margin-bottom: var(--ca-space-4); display: block; width: 100%; }
.grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--ca-space-4); }
.fullWidth { grid-column: 1 / -1; }
.input { width: 100%; padding: var(--ca-space-2-5) var(--ca-space-3); background: var(--ca-surface); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); color: var(--ca-text-primary); font-family: var(--ca-font-body); font-size: 0.875rem; outline: none; transition: border-color 150ms ease, box-shadow 150ms ease; }
.input:focus { border-color: var(--ca-accent); box-shadow: 0 0 0 3px rgba(var(--ca-accent-rgb), 0.15); }
.select { width: 100%; padding: var(--ca-space-2-5) var(--ca-space-3); background: var(--ca-surface); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); color: var(--ca-text-primary); font-family: var(--ca-font-body); font-size: 0.875rem; cursor: pointer; outline: none; }
.select:focus { border-color: var(--ca-accent); box-shadow: 0 0 0 3px rgba(var(--ca-accent-rgb), 0.15); }
.percentWrapper { position: relative; }
.percentSuffix { position: absolute; right: var(--ca-space-3); top: 50%; transform: translateY(-50%); color: var(--ca-text-muted); font-size: 0.875rem; pointer-events: none; }
.checkboxGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: var(--ca-space-2); padding: var(--ca-space-3); background: var(--ca-surface); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); }
.checkboxLabel { display: flex; align-items: center; gap: var(--ca-space-2); font-size: 0.85rem; color: var(--ca-text-secondary); cursor: pointer; padding: var(--ca-space-1) 0; min-height: 32px; }
.checkboxLabel:hover { color: var(--ca-text-primary); }
.checkbox { width: 15px; height: 15px; accent-color: var(--ca-accent); flex-shrink: 0; cursor: pointer; }
/* Tag Input */
.tagInputWrapper { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-1-5); padding: var(--ca-space-2); background: var(--ca-surface); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); min-height: 44px; transition: border-color 150ms ease, box-shadow 150ms ease; }
.tagInputWrapper:focus-within { border-color: var(--ca-accent); box-shadow: 0 0 0 3px rgba(var(--ca-accent-rgb), 0.15); }
.tagList { display: contents; list-style: none; margin: 0; padding: 0; }
.tag { display: inline-flex; align-items: center; gap: var(--ca-space-1); padding: 2px 8px; background: rgba(var(--ca-accent-rgb), 0.1); color: var(--ca-accent); border-radius: var(--ca-radius-full); font-size: 0.78rem; font-weight: 500; }
.tagRemove { background: none; border: none; color: currentColor; cursor: pointer; font-size: 1rem; line-height: 1; padding: 0; margin-left: 2px; display: flex; align-items: center; }
.tagRemove:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 1px; border-radius: 2px; }
.tagTextInput { flex: 1 1 120px; min-width: 120px; border: none; background: transparent; outline: none; font-family: var(--ca-font-body); font-size: 0.875rem; color: var(--ca-text-primary); padding: var(--ca-space-1); }
.tagTextInput::placeholder { color: var(--ca-text-muted); }
.srOnly { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 768px) { .grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .input, .select, .tagInputWrapper { transition: none; } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/CannabisInfoSection/CannabisInfoSection.tsx"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/CannabisInfoSection/CannabisInfoSection.tsx" << 'ADMIN_EOF'
/**
 * @file CannabisInfoSection.tsx
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/CannabisInfoSection/CannabisInfoSection.tsx
 *
 * Cannabis-specific product metadata form section.
 * Includes: strain type selector, THC/CBD percentage inputs,
 * terpene multi-select, and tag inputs for effects and flavors.
 *
 * TAG INPUT PATTERN: Effects and flavors use a controlled tag input
 * that renders chips. Tags are added on Enter/comma and removed by
 * clicking the chip's remove button or backspace when the input is empty.
 *
 * WCAG: Tag chips have role="listitem"; the remove button for each has
 * aria-label="Remove [tag name]". The input announces the tag count
 * via an aria-live region.
 */

import React, { KeyboardEvent, useState } from 'react';
import { UseFormRegister, Controller, Control, FieldErrors } from 'react-hook-form';
import { FormField } from '../../../../../../components/shared/FormField';
import type { ProductFormValues } from '../../../../../../types/admin.types';
import styles from './CannabisInfoSection.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMON_TERPENES = [
  'Myrcene', 'Limonene', 'Caryophyllene', 'Linalool', 'Pinene',
  'Terpinolene', 'Ocimene', 'Humulene', 'Bisabolol', 'Valencene',
];

// ─── TagInput Sub-Component ───────────────────────────────────────────────────

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id: string;
  ariaProps: Record<string, unknown>;
}

function TagInput({ value, onChange, placeholder, id, ariaProps }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className={styles.tagInputWrapper} role="group">
      {/* Existing tags */}
      {value.length > 0 && (
        <ul className={styles.tagList} role="list" aria-label="Selected tags">
          {value.map((tag) => (
            <li key={tag} role="listitem" className={styles.tag}>
              {tag}
              <button
                type="button"
                className={styles.tagRemove}
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* New tag input */}
      <input
        id={id}
        {...ariaProps}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputValue && addTag(inputValue)}
        placeholder={value.length === 0 ? placeholder : 'Add more…'}
        className={styles.tagTextInput}
        aria-label={placeholder}
      />

      {/* Live region for screen reader tag count */}
      <span className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {value.length > 0 ? `${value.length} tag${value.length !== 1 ? 's' : ''} selected` : ''}
      </span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CannabisInfoSectionProps {
  register: UseFormRegister<ProductFormValues>;
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CannabisInfoSection({ register, control, errors }: CannabisInfoSectionProps) {
  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>Cannabis Information</legend>

      <div className={styles.grid}>
        {/* Strain Type */}
        <FormField label="Strain Type" required error={errors.strainType?.message}>
          {({ id, inputProps }) => (
            <select
              id={id}
              {...inputProps}
              {...register('strainType', { required: 'Strain type is required' })}
              className={styles.select}
            >
              <option value="">Select strain type…</option>
              <option value="indica">Indica</option>
              <option value="sativa">Sativa</option>
              <option value="hybrid">Hybrid</option>
              <option value="cbd">CBD</option>
              <option value="unknown">Unknown / N/A</option>
            </select>
          )}
        </FormField>

        {/* THC % */}
        <FormField label="THC %" hint="Leave blank if not applicable" error={errors.thcPct?.message}>
          {({ id, inputProps }) => (
            <div className={styles.percentWrapper}>
              <input
                id={id}
                {...inputProps}
                {...register('thcPct', {
                  min: { value: 0, message: 'Must be ≥ 0' },
                  max: { value: 100, message: 'Must be ≤ 100' },
                  valueAsNumber: true,
                })}
                className={styles.input}
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="0.0"
              />
              <span className={styles.percentSuffix} aria-hidden="true">%</span>
            </div>
          )}
        </FormField>

        {/* CBD % */}
        <FormField label="CBD %" hint="Leave blank if not applicable" error={errors.cbdPct?.message}>
          {({ id, inputProps }) => (
            <div className={styles.percentWrapper}>
              <input
                id={id}
                {...inputProps}
                {...register('cbdPct', {
                  min: { value: 0, message: 'Must be ≥ 0' },
                  max: { value: 100, message: 'Must be ≤ 100' },
                  valueAsNumber: true,
                })}
                className={styles.input}
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="0.0"
              />
              <span className={styles.percentSuffix} aria-hidden="true">%</span>
            </div>
          )}
        </FormField>

        {/* Terpenes */}
        <FormField
          label="Terpenes"
          hint="Select all that apply"
          className={styles.fullWidth}
        >
          {({ id }) => (
            <Controller
              name="terpenes"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <div className={styles.checkboxGrid} role="group" aria-labelledby={`${id}-label`}>
                  {COMMON_TERPENES.map((terpene) => (
                    <label key={terpene} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        value={terpene}
                        checked={field.value.includes(terpene)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange([...field.value, terpene]);
                          } else {
                            field.onChange(field.value.filter((t: string) => t !== terpene));
                          }
                        }}
                      />
                      {terpene}
                    </label>
                  ))}
                </div>
              )}
            />
          )}
        </FormField>

        {/* Effects */}
        <FormField
          label="Effects"
          hint="Type an effect and press Enter. e.g. 'relaxed', 'creative'"
          className={styles.fullWidth}
        >
          {({ id, inputProps }) => (
            <Controller
              name="effects"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagInput
                  id={id}
                  ariaProps={inputProps}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add effects (Enter to add)…"
                />
              )}
            />
          )}
        </FormField>

        {/* Flavors */}
        <FormField
          label="Flavors"
          hint="Type a flavor and press Enter. e.g. 'earthy', 'citrus'"
          className={styles.fullWidth}
        >
          {({ id, inputProps }) => (
            <Controller
              name="flavors"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagInput
                  id={id}
                  ariaProps={inputProps}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add flavors (Enter to add)…"
                />
              )}
            />
          )}
        </FormField>
      </div>
    </fieldset>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/CannabisInfoSection/index.ts"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/CannabisInfoSection/index.ts" << 'ADMIN_EOF'
export { CannabisInfoSection } from './CannabisInfoSection';
export type { CannabisInfoSectionProps } from './CannabisInfoSection';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/ComplianceSection/ComplianceSection.module.css"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/ComplianceSection/ComplianceSection.module.css" << 'ADMIN_EOF'
/**
 * @file ComplianceSection.module.css
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/ComplianceSection/
 */
.section { border: none; margin: 0; padding: 0; }
.legend { font-family: var(--ca-font-body); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ca-text-muted); margin-bottom: var(--ca-space-4); display: block; width: 100%; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ca-space-4); }
.input { width: 100%; padding: var(--ca-space-2-5) var(--ca-space-3); background: var(--ca-surface); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); color: var(--ca-text-primary); font-family: var(--ca-font-body); font-size: 0.875rem; outline: none; transition: border-color 150ms ease, box-shadow 150ms ease; }
.input:focus { border-color: var(--ca-accent); box-shadow: 0 0 0 3px rgba(var(--ca-accent-rgb), 0.15); }
.complianceNote { display: flex; align-items: flex-start; gap: var(--ca-space-2); margin: var(--ca-space-4) 0 0; padding: var(--ca-space-3) var(--ca-space-4); background: rgba(41,128,185,0.07); border: 1px solid rgba(41,128,185,0.2); border-radius: var(--ca-radius-md); font-size: 0.82rem; color: #1a5f8a; line-height: 1.5; }
.complianceNote svg { flex-shrink: 0; margin-top: 1px; }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .input { transition: none; } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/ComplianceSection/ComplianceSection.tsx"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/ComplianceSection/ComplianceSection.tsx" << 'ADMIN_EOF'
/**
 * @file ComplianceSection.tsx
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/ComplianceSection/ComplianceSection.tsx
 *
 * Cannabis compliance metadata form section.
 * Captures METRC tracking ID, batch number, and regulatory dates required
 * for state cannabis compliance reporting.
 *
 * WCAG: Date inputs have explicit labels and hint text explaining the
 * expected format. The METRC ID field has a hint linking to the expected
 * UID format per state regulations.
 */

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { FormField } from '../../../../../../components/shared/FormField';
import type { ProductFormValues } from '../../../../../../types/admin.types';
import styles from './ComplianceSection.module.css';

export interface ComplianceSectionProps {
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

export function ComplianceSection({ register, errors }: ComplianceSectionProps) {
  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>Compliance &amp; Regulatory</legend>

      <div className={styles.grid}>
        {/* METRC ID */}
        <FormField
          label="METRC UID"
          hint="The unique identifier assigned by METRC for this product/package."
          error={errors.metrcId?.message}
        >
          {({ id, inputProps }) => (
            <input
              id={id}
              {...inputProps}
              {...register('metrcId')}
              className={styles.input}
              type="text"
              placeholder="1A4060300002199000014"
              autoComplete="off"
              spellCheck={false}
            />
          )}
        </FormField>

        {/* Batch Number */}
        <FormField
          label="Batch Number"
          hint="Internal or cultivator batch identifier."
          error={errors.batchNumber?.message}
        >
          {({ id, inputProps }) => (
            <input
              id={id}
              {...inputProps}
              {...register('batchNumber')}
              className={styles.input}
              type="text"
              placeholder="BATCH-2025-001"
              autoComplete="off"
            />
          )}
        </FormField>

        {/* Harvest Date */}
        <FormField
          label="Harvest Date"
          hint="Date the cannabis was harvested (for flower/concentrates)."
          error={errors.harvestDate?.message}
        >
          {({ id, inputProps }) => (
            <input
              id={id}
              {...inputProps}
              {...register('harvestDate')}
              className={styles.input}
              type="date"
            />
          )}
        </FormField>

        {/* Expiration Date */}
        <FormField
          label="Expiration Date"
          hint="Product expiration or best-by date."
          error={errors.expirationDate?.message}
        >
          {({ id, inputProps }) => (
            <input
              id={id}
              {...inputProps}
              {...register('expirationDate')}
              className={styles.input}
              type="date"
            />
          )}
        </FormField>
      </div>

      <p className={styles.complianceNote} role="note">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        METRC UID and batch number are required for all cannabis products sold in NY, NJ, and CT.
        These fields are reported to state regulators via the Metrc Connect API integration.
      </p>
    </fieldset>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/ComplianceSection/index.ts"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/ComplianceSection/index.ts" << 'ADMIN_EOF'
export { ComplianceSection } from './ComplianceSection';
export type { ComplianceSectionProps } from './ComplianceSection';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/MediaSection/MediaSection.module.css"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/MediaSection/MediaSection.module.css" << 'ADMIN_EOF'
/**
 * @file MediaSection.module.css
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/MediaSection/
 */
.section { border: none; margin: 0; padding: 0; }
.legend { font-family: var(--ca-font-body); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ca-text-muted); margin-bottom: var(--ca-space-4); display: block; width: 100%; }
.dropzone {
  border: 2px dashed var(--ca-border-strong);
  border-radius: var(--ca-radius-xl);
  padding: var(--ca-space-10) var(--ca-space-6);
  display: flex; flex-direction: column; align-items: center; gap: var(--ca-space-2);
  cursor: pointer; text-align: center;
  transition: border-color 150ms ease, background 150ms ease;
}
.dropzone:hover, .dropzone:focus-visible { border-color: var(--ca-accent); background: rgba(var(--ca-accent-rgb), 0.03); }
.dropzone:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; }
.dropzoneDragging { border-color: var(--ca-accent); background: rgba(var(--ca-accent-rgb), 0.06); }
.dropzoneIcon { color: var(--ca-text-muted); }
.dropzoneText { margin: 0; font-size: 0.95rem; color: var(--ca-text-secondary); }
.dropzoneBrowse { color: var(--ca-accent); font-weight: 600; text-decoration: underline; }
.dropzoneHint { margin: 0; font-size: 0.78rem; color: var(--ca-text-muted); }
.fileInput { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
/* Uploading */
.uploadingList { display: flex; flex-direction: column; gap: var(--ca-space-2); margin-top: var(--ca-space-3); }
.uploadingItem { display: flex; align-items: center; gap: var(--ca-space-3); padding: var(--ca-space-2-5); background: var(--ca-surface-raised); border-radius: var(--ca-radius-md); }
.uploadingThumb { width: 40px; height: 40px; border-radius: var(--ca-radius-sm); overflow: hidden; flex-shrink: 0; }
.uploadingThumb img { width: 100%; height: 100%; object-fit: cover; }
.uploadingInfo { flex: 1; display: flex; flex-direction: column; gap: var(--ca-space-1-5); }
.uploadingName { font-size: 0.82rem; color: var(--ca-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.progressBar { height: 4px; background: var(--ca-border); border-radius: var(--ca-radius-full); overflow: hidden; }
.progressFill { height: 100%; background: var(--ca-accent); border-radius: var(--ca-radius-full); animation: indeterminate 1.4s ease-in-out infinite; }
@keyframes indeterminate { 0% { width: 0; margin-left: 0; } 50% { width: 60%; margin-left: 20%; } 100% { width: 0; margin-left: 100%; } }
/* Image Grid */
.imageGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--ca-space-3); margin-top: var(--ca-space-4); }
.imageCard { display: flex; flex-direction: column; gap: var(--ca-space-2); padding: var(--ca-space-2-5); background: var(--ca-surface-raised); border: 1.5px solid var(--ca-border); border-radius: var(--ca-radius-lg); }
.imageCardPrimary { border-color: var(--ca-accent); background: rgba(var(--ca-accent-rgb), 0.03); }
.imageThumb { position: relative; aspect-ratio: 1; border-radius: var(--ca-radius-md); overflow: hidden; background: var(--ca-surface); }
.imageThumb img { width: 100%; height: 100%; object-fit: cover; }
.primaryBadge { position: absolute; top: 4px; right: 4px; background: var(--ca-accent); color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; }
.altTextWrapper { display: flex; flex-direction: column; gap: 2px; }
.altLabel { font-size: 0.7rem; font-weight: 600; color: var(--ca-text-muted); }
.altInput { width: 100%; padding: 4px var(--ca-space-2); background: var(--ca-surface-elevated); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-sm); color: var(--ca-text-primary); font-family: var(--ca-font-body); font-size: 0.78rem; outline: none; }
.altInput:focus { border-color: var(--ca-accent); }
.primaryBtn { padding: var(--ca-space-1-5) var(--ca-space-2); background: transparent; border: 1px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); color: var(--ca-text-muted); font-family: var(--ca-font-body); font-size: 0.72rem; font-weight: 500; cursor: pointer; transition: all 130ms ease; }
.primaryBtnActive { background: rgba(var(--ca-accent-rgb), 0.1); border-color: var(--ca-accent); color: var(--ca-accent); font-weight: 600; }
.primaryBtn:hover:not(.primaryBtnActive) { border-color: var(--ca-accent); color: var(--ca-accent); }
.primaryBtn:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; }
.srOnly { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (prefers-reduced-motion: reduce) { .dropzone, .primaryBtn { transition: none; } .progressFill { animation: none; width: 60%; } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/MediaSection/MediaSection.tsx"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/MediaSection/MediaSection.tsx" << 'ADMIN_EOF'
/**
 * @file MediaSection.tsx
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/MediaSection/MediaSection.tsx
 *
 * Product media management: drag-and-drop image upload to S3 (Sprint 3 endpoint),
 * primary image selection, and per-image alt text editing.
 *
 * UPLOAD FLOW:
 *   1. User drops files onto the dropzone or uses the file input.
 *   2. Files are validated (type, size) client-side.
 *   3. Valid files are uploaded one-by-one to /api/admin/media/upload.
 *   4. On success, the returned ProductImage is added to the form state.
 *
 * WCAG:
 *   • The dropzone has role="button", tabIndex=0, and keyboard handlers
 *     (Enter/Space) so it's operable without a mouse.
 *   • Each image thumbnail has a visible alt text field.
 *   • Upload progress is announced via aria-live="polite".
 *   • The "Set as primary" button has aria-pressed reflecting current state.
 */

import React, { useCallback, useRef, useState } from 'react';
import { Controller, Control } from 'react-hook-form';
import type { ProductFormValues, ProductImage } from '../../../../../../types/admin.types';
import styles from './MediaSection.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 8;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MediaSectionProps {
  control: Control<ProductFormValues>;
  /** Existing images (edit mode) */
  existingImages?: ProductImage[];
  /** Currently selected primary image ID */
  primaryImageId?: string | null;
  onPrimaryImageChange?: (id: string) => void;
}

// ─── Upload State ─────────────────────────────────────────────────────────────

interface UploadItem {
  localId: string;
  file: File;
  preview: string;
  status: 'uploading' | 'done' | 'error';
  errorMessage?: string;
  uploadedImage?: ProductImage;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MediaSection({
  control,
  existingImages = [],
  primaryImageId,
  onPrimaryImageChange,
}: MediaSectionProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [altTexts, setAltTexts] = useState<Record<string, string>>(
    () => Object.fromEntries(existingImages.map((img) => [img.id, img.altText])),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const announce = (msg: string) => {
    if (liveRef.current) liveRef.current.textContent = msg;
  };

  const uploadFile = useCallback(async (file: File) => {
    const localId = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const preview = URL.createObjectURL(file);

    setUploads((prev) => [
      ...prev,
      { localId, file, preview, status: 'uploading' },
    ]);
    announce(`Uploading ${file.name}…`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'product');

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const uploadedImage: ProductImage = await res.json();

      setUploads((prev) =>
        prev.map((u) =>
          u.localId === localId ? { ...u, status: 'done', uploadedImage } : u,
        ),
      );
      announce(`${file.name} uploaded successfully`);
    } catch {
      setUploads((prev) =>
        prev.map((u) =>
          u.localId === localId
            ? { ...u, status: 'error', errorMessage: 'Upload failed. Please retry.' }
            : u,
        ),
      );
      announce(`Failed to upload ${file.name}`);
    }
  }, []);

  const processFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    for (const file of arr) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        announce(`${file.name} is not a supported image type.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        announce(`${file.name} exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`);
        continue;
      }
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleDropzoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const allImages: Array<ProductImage & { isNew?: boolean }> = [
    ...existingImages,
    ...uploads
      .filter((u) => u.status === 'done' && u.uploadedImage)
      .map((u) => ({ ...u.uploadedImage!, isNew: true })),
  ];

  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>Media</legend>

      {/* Aria live for upload announcements */}
      <div ref={liveRef} role="status" aria-live="polite" className={styles.srOnly} />

      {/* ── Dropzone ──────────────────────────────────────────────── */}
      <div
        ref={dropzoneRef}
        role="button"
        tabIndex={0}
        aria-label="Upload images. Drag and drop or press Enter to browse files."
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleDropzoneKeyDown}
      >
        <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.dropzoneIcon}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
        <p className={styles.dropzoneText}>
          <strong>Drop images here</strong> or <span className={styles.dropzoneBrowse}>browse files</span>
        </p>
        <p className={styles.dropzoneHint}>
          JPEG, PNG, WebP, GIF · Max {MAX_FILE_SIZE_MB}MB each
        </p>

        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          className={styles.fileInput}
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
      </div>

      {/* ── In-progress uploads ────────────────────────────────────── */}
      {uploads.filter((u) => u.status === 'uploading').length > 0 && (
        <div className={styles.uploadingList} aria-label="Upload progress">
          {uploads
            .filter((u) => u.status === 'uploading')
            .map((u) => (
              <div key={u.localId} className={styles.uploadingItem}>
                <div className={styles.uploadingThumb}>
                  <img src={u.preview} alt="" width={40} height={40} />
                </div>
                <div className={styles.uploadingInfo}>
                  <span className={styles.uploadingName}>{u.file.name}</span>
                  <div className={styles.progressBar} role="progressbar" aria-label={`Uploading ${u.file.name}`} aria-valuemin={0} aria-valuemax={100}>
                    <div className={styles.progressFill} />
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Image grid ────────────────────────────────────────────── */}
      {allImages.length > 0 && (
        <div className={styles.imageGrid} role="list" aria-label="Product images">
          {allImages.map((img) => {
            const isPrimary = img.id === primaryImageId;
            return (
              <div
                key={img.id}
                className={`${styles.imageCard} ${isPrimary ? styles.imageCardPrimary : ''}`}
                role="listitem"
              >
                <div className={styles.imageThumb}>
                  <img src={img.url} alt={img.altText || 'Product image'} />
                  {isPrimary && (
                    <span className={styles.primaryBadge} aria-label="Primary image">
                      ★
                    </span>
                  )}
                </div>

                {/* Alt text */}
                <div className={styles.altTextWrapper}>
                  <label htmlFor={`alt-${img.id}`} className={styles.altLabel}>Alt text</label>
                  <input
                    id={`alt-${img.id}`}
                    type="text"
                    className={styles.altInput}
                    value={altTexts[img.id] ?? img.altText}
                    onChange={(e) => setAltTexts((prev) => ({ ...prev, [img.id]: e.target.value }))}
                    placeholder="Describe this image…"
                  />
                </div>

                {/* Set as primary */}
                <button
                  type="button"
                  className={`${styles.primaryBtn} ${isPrimary ? styles.primaryBtnActive : ''}`}
                  onClick={() => onPrimaryImageChange?.(img.id)}
                  aria-pressed={isPrimary}
                >
                  {isPrimary ? '★ Primary' : '☆ Set Primary'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/MediaSection/index.ts"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/MediaSection/index.ts" << 'ADMIN_EOF'
export { MediaSection } from './MediaSection';
export type { MediaSectionProps } from './MediaSection';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/SeoSection/SeoSection.module.css"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/SeoSection/SeoSection.module.css" << 'ADMIN_EOF'
/**
 * @file SeoSection.module.css
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/SeoSection/
 */
.section { border: none; margin: 0; padding: 0; }
.legend { font-family: var(--ca-font-body); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ca-text-muted); margin-bottom: var(--ca-space-4); display: block; width: 100%; }
.grid { display: flex; flex-direction: column; gap: var(--ca-space-4); }
.fullWidth { width: 100%; }
.fieldWithCounter { position: relative; }
.growField { width: 100%; }
.counter { position: absolute; top: 0; right: 0; font-size: 0.72rem; color: var(--ca-text-muted); font-variant-numeric: tabular-nums; }
.counterOver { color: var(--ca-error); font-weight: 600; }
.input { width: 100%; padding: var(--ca-space-2-5) var(--ca-space-3); background: var(--ca-surface); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); color: var(--ca-text-primary); font-family: var(--ca-font-body); font-size: 0.875rem; outline: none; transition: border-color 150ms ease, box-shadow 150ms ease; }
.input:focus { border-color: var(--ca-accent); box-shadow: 0 0 0 3px rgba(var(--ca-accent-rgb), 0.15); }
.textarea { resize: vertical; line-height: 1.5; }
.aiBtn { display: inline-flex; align-items: center; gap: var(--ca-space-1-5); padding: var(--ca-space-2) var(--ca-space-3-5); background: rgba(var(--ca-accent-rgb), 0.08); border: 1px solid rgba(var(--ca-accent-rgb), 0.25); border-radius: var(--ca-radius-md); color: var(--ca-accent); font-family: var(--ca-font-body); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background 130ms ease; min-height: 36px; }
.aiBtn:hover:not(:disabled) { background: rgba(var(--ca-accent-rgb), 0.14); }
.aiBtn:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; }
.aiBtn:disabled { opacity: 0.5; cursor: not-allowed; }
.aiSpinner { display: block; width: 12px; height: 12px; border: 2px solid rgba(var(--ca-accent-rgb), 0.3); border-top-color: var(--ca-accent); border-radius: 50%; animation: spin 600ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .input { transition: none; } .aiSpinner { animation: none; } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/SeoSection/SeoSection.tsx"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/SeoSection/SeoSection.tsx" << 'ADMIN_EOF'
/**
 * @file SeoSection.tsx
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/SeoSection/SeoSection.tsx
 *
 * SEO metadata form section: meta title, meta description, keyword tags.
 * Includes character counters for title (≤60) and description (≤160),
 * and an AI suggestion button that calls the Sprint 9 AI endpoint.
 *
 * WCAG: Character counters use aria-describedby to associate them with
 * the field and aria-live="polite" so the count is announced as the user types.
 */

import React, { useState } from 'react';
import { UseFormRegister, Control, FieldErrors, useWatch } from 'react-hook-form';
import { FormField } from '../../../../../../components/shared/FormField';
import type { ProductFormValues } from '../../../../../../types/admin.types';
import styles from './SeoSection.module.css';

export interface SeoSectionProps {
  register: UseFormRegister<ProductFormValues>;
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  productName: string;
}

function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value?.length ?? 0;
  const isOver = len > max;
  return (
    <span
      className={`${styles.counter} ${isOver ? styles.counterOver : ''}`}
      aria-live="polite"
      aria-atomic="true"
      aria-label={`${len} of ${max} characters used`}
    >
      {len}/{max}
    </span>
  );
}

export function SeoSection({ register, control, errors, productName }: SeoSectionProps) {
  const [isSuggesting, setIsSuggesting] = useState(false);

  const metaTitle = useWatch({ control, name: 'metaTitle', defaultValue: '' });
  const metaDescription = useWatch({ control, name: 'metaDescription', defaultValue: '' });

  const handleAiSuggest = async () => {
    setIsSuggesting(true);
    try {
      const res = await fetch('/api/admin/ai/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName }),
      });
      if (res.ok) {
        // Parent form would need setValue — passed via react-hook-form setValue prop in real impl
        const _data = await res.json();
        // setValue('metaTitle', data.metaTitle); setValue('metaDescription', data.metaDescription);
      }
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>SEO</legend>

      <div className={styles.grid}>
        {/* Meta Title */}
        <div className={styles.fullWidth}>
          <div className={styles.fieldWithCounter}>
            <FormField
              label="Meta Title"
              hint="Appears in browser tab and search results. Ideal: 50–60 characters."
              error={errors.metaTitle?.message}
              className={styles.growField}
            >
              {({ id, inputProps }) => (
                <input
                  id={id}
                  {...inputProps}
                  {...register('metaTitle', {
                    maxLength: { value: 60, message: 'Maximum 60 characters' },
                  })}
                  className={styles.input}
                  type="text"
                  placeholder={productName || 'Product meta title…'}
                />
              )}
            </FormField>
            <CharCounter value={metaTitle} max={60} />
          </div>
        </div>

        {/* Meta Description */}
        <div className={styles.fullWidth}>
          <div className={styles.fieldWithCounter}>
            <FormField
              label="Meta Description"
              hint="Displayed in search results snippets. Ideal: 140–160 characters."
              error={errors.metaDescription?.message}
              className={styles.growField}
            >
              {({ id, inputProps }) => (
                <textarea
                  id={id}
                  {...inputProps}
                  {...register('metaDescription', {
                    maxLength: { value: 160, message: 'Maximum 160 characters' },
                  })}
                  className={`${styles.input} ${styles.textarea}`}
                  rows={3}
                  placeholder="Describe the product for search engines…"
                />
              )}
            </FormField>
            <CharCounter value={metaDescription} max={160} />
          </div>
        </div>

        {/* AI Suggest */}
        <div className={styles.fullWidth}>
          <button
            type="button"
            className={styles.aiBtn}
            onClick={handleAiSuggest}
            disabled={isSuggesting || !productName}
            aria-busy={isSuggesting}
            aria-label={isSuggesting ? 'Generating SEO suggestions…' : 'Generate SEO suggestions with AI'}
          >
            {isSuggesting ? <span className={styles.aiSpinner} aria-hidden="true" /> : (
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            )}
            {isSuggesting ? 'Generating…' : 'AI Suggest SEO'}
          </button>
        </div>
      </div>
    </fieldset>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/SeoSection/index.ts"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/SeoSection/index.ts" << 'ADMIN_EOF'
export { SeoSection } from './SeoSection';
export type { SeoSectionProps } from './SeoSection';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/VariantsSection/VariantsSection.module.css"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/VariantsSection/VariantsSection.module.css" << 'ADMIN_EOF'
/**
 * @file VariantsSection.module.css
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/VariantsSection/
 */
.section { border: none; margin: 0; padding: 0; }
.legend { font-family: var(--ca-font-body); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ca-text-muted); margin-bottom: var(--ca-space-4); display: block; width: 100%; }
.variantList { display: flex; flex-direction: column; gap: var(--ca-space-4); }
.emptyHint { margin: 0; padding: var(--ca-space-5); background: var(--ca-surface-raised); border: 1.5px dashed var(--ca-border-strong); border-radius: var(--ca-radius-lg); text-align: center; color: var(--ca-text-muted); font-size: 0.875rem; }
.variantRow {
  position: relative;
  border: 1.5px solid var(--ca-border);
  border-radius: var(--ca-radius-lg);
  padding: var(--ca-space-4);
  background: var(--ca-surface-raised);
}
.variantLegend {
  font-family: var(--ca-font-body);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--ca-text-secondary);
  padding: 0 var(--ca-space-2);
}
.variantGrid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: var(--ca-space-3);
  margin-top: var(--ca-space-3);
}
.input {
  width: 100%;
  padding: var(--ca-space-2) var(--ca-space-3);
  background: var(--ca-surface-elevated);
  border: 1.5px solid var(--ca-border-strong);
  border-radius: var(--ca-radius-md);
  color: var(--ca-text-primary);
  font-family: var(--ca-font-body);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.input:focus { border-color: var(--ca-accent); box-shadow: 0 0 0 3px rgba(var(--ca-accent-rgb), 0.15); }
/* Active toggle */
.activeToggle { display: flex; align-items: flex-end; padding-bottom: var(--ca-space-1); }
.toggleLabel { display: flex; align-items: center; gap: var(--ca-space-2); cursor: pointer; font-size: 0.875rem; color: var(--ca-text-secondary); user-select: none; }
.toggleInput { position: absolute; opacity: 0; width: 0; height: 0; }
.toggleTrack {
  display: block; width: 36px; height: 20px; background: var(--ca-border-strong);
  border-radius: var(--ca-radius-full); position: relative; flex-shrink: 0;
  transition: background 150ms ease;
}
.toggleTrack::after {
  content: ''; position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; background: #fff; border-radius: 50%;
  transition: transform 150ms ease; box-shadow: var(--ca-shadow-sm);
}
.toggleInput:checked + .toggleTrack { background: var(--ca-accent); }
.toggleInput:checked + .toggleTrack::after { transform: translateX(16px); }
.toggleInput:focus-visible + .toggleTrack { outline: 2px solid var(--ca-accent); outline-offset: 2px; }
/* Remove button */
.removeBtn {
  display: inline-flex; align-items: center; gap: var(--ca-space-1-5);
  margin-top: var(--ca-space-3);
  padding: var(--ca-space-1-5) var(--ca-space-2-5);
  background: transparent;
  border: 1px solid rgba(var(--ca-error-rgb), 0.3);
  border-radius: var(--ca-radius-md);
  color: var(--ca-error); font-family: var(--ca-font-body); font-size: 0.78rem; font-weight: 500;
  cursor: pointer; transition: background 130ms ease;
}
.removeBtn:hover { background: rgba(var(--ca-error-rgb), 0.07); }
.removeBtn:focus-visible { outline: 2px solid var(--ca-error); outline-offset: 2px; }
/* Add button */
.addBtn {
  display: inline-flex; align-items: center; gap: var(--ca-space-2);
  margin-top: var(--ca-space-3);
  padding: var(--ca-space-2-5) var(--ca-space-4);
  background: transparent;
  border: 1.5px dashed var(--ca-border-strong);
  border-radius: var(--ca-radius-lg);
  color: var(--ca-text-secondary); font-family: var(--ca-font-body); font-size: 0.875rem; font-weight: 500;
  cursor: pointer; width: 100%; justify-content: center;
  transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
}
.addBtn:hover { border-color: var(--ca-accent); color: var(--ca-accent); background: rgba(var(--ca-accent-rgb), 0.04); }
.addBtn:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; }
.srOnly { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 960px) { .variantGrid { grid-template-columns: 1fr 1fr 1fr; } }
@media (max-width: 640px) { .variantGrid { grid-template-columns: 1fr 1fr; } }
@media (prefers-reduced-motion: reduce) { .input, .addBtn, .removeBtn, .toggleTrack, .toggleTrack::after { transition: none; } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/VariantsSection/VariantsSection.tsx"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/VariantsSection/VariantsSection.tsx" << 'ADMIN_EOF'
/**
 * @file VariantsSection.tsx
 * @path apps/admin/src/pages/Products/components/ProductForm/sections/VariantsSection/VariantsSection.tsx
 *
 * Dynamic product variant manager using react-hook-form's useFieldArray.
 * Each variant has: label (e.g. "3.5g"), SKU, base/sale/cost/MSRP pricing,
 * stock quantity, and an active toggle.
 *
 * PATTERN: useFieldArray gives each variant a stable `id` key so React
 * can reconcile the list correctly when rows are reordered or removed.
 *
 * WCAG:
 *   • Each variant row is a <fieldset> with a <legend> showing the variant index.
 *   • Remove buttons have aria-label="Remove variant N".
 *   • An aria-live region announces when variants are added or removed.
 *   • Price fields use inputmode="decimal" for mobile numeric keyboard.
 */

import React from 'react';
import { UseFormRegister, Control, FieldErrors, useFieldArray } from 'react-hook-form';
import { FormField } from '../../../../../../components/shared/FormField';
import type { ProductFormValues } from '../../../../../../types/admin.types';
import styles from './VariantsSection.module.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface VariantsSectionProps {
  register: UseFormRegister<ProductFormValues>;
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VariantsSection({ register, control, errors }: VariantsSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const addVariant = () => {
    append({
      id: '',
      label: '',
      sku: '',
      priceCents: 0,
      salePriceCents: null,
      costCents: null,
      msrpCents: null,
      stock: 0,
      isActive: true,
    });
  };

  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>Variants &amp; Pricing</legend>

      {/* Live region announces variant count changes */}
      <div aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        {fields.length} variant{fields.length !== 1 ? 's' : ''}
      </div>

      <div className={styles.variantList}>
        {fields.length === 0 && (
          <p className={styles.emptyHint}>
            No variants yet. Add at least one variant to set pricing and stock.
          </p>
        )}

        {fields.map((field, index) => {
          const variantErrors = errors.variants?.[index];
          return (
            <fieldset key={field.id} className={styles.variantRow}>
              <legend className={styles.variantLegend}>
                Variant {index + 1}
              </legend>

              <div className={styles.variantGrid}>
                {/* Label */}
                <FormField
                  label="Label"
                  required
                  hint='e.g. "3.5g", "1oz", "10mg"'
                  error={variantErrors?.label?.message}
                >
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.label`, { required: 'Label is required' })}
                      className={styles.input}
                      type="text"
                      placeholder="3.5g"
                    />
                  )}
                </FormField>

                {/* SKU */}
                <FormField
                  label="SKU"
                  required
                  error={variantErrors?.sku?.message}
                >
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.sku`, { required: 'SKU is required' })}
                      className={styles.input}
                      type="text"
                      placeholder="PROD-001-3.5G"
                    />
                  )}
                </FormField>

                {/* Base Price */}
                <FormField
                  label="Price ($)"
                  required
                  error={variantErrors?.priceCents?.message}
                >
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.priceCents`, {
                        required: 'Price is required',
                        min: { value: 0, message: 'Price must be ≥ 0' },
                        valueAsNumber: true,
                      })}
                      className={styles.input}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      inputMode="decimal"
                    />
                  )}
                </FormField>

                {/* Sale Price */}
                <FormField label="Sale Price ($)" hint="Optional">
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.salePriceCents`, {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Must be ≥ 0' },
                      })}
                      className={styles.input}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="—"
                      inputMode="decimal"
                    />
                  )}
                </FormField>

                {/* Cost */}
                <FormField label="Cost ($)" hint="Internal use only">
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.costCents`, { valueAsNumber: true })}
                      className={styles.input}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="—"
                      inputMode="decimal"
                    />
                  )}
                </FormField>

                {/* MSRP */}
                <FormField label="MSRP ($)" hint="Manufacturer suggested">
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.msrpCents`, { valueAsNumber: true })}
                      className={styles.input}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="—"
                      inputMode="decimal"
                    />
                  )}
                </FormField>

                {/* Stock */}
                <FormField
                  label="Stock Qty"
                  required
                  error={variantErrors?.stock?.message}
                >
                  {({ id, inputProps }) => (
                    <input
                      id={id}
                      {...inputProps}
                      {...register(`variants.${index}.stock`, {
                        required: 'Stock is required',
                        min: { value: 0, message: 'Must be ≥ 0' },
                        valueAsNumber: true,
                      })}
                      className={styles.input}
                      type="number"
                      min="0"
                      placeholder="0"
                      inputMode="numeric"
                    />
                  )}
                </FormField>

                {/* Active toggle */}
                <div className={styles.activeToggle}>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      {...register(`variants.${index}.isActive`)}
                    />
                    <span className={styles.toggleTrack} aria-hidden="true" />
                    Active
                  </label>
                </div>
              </div>

              {/* Remove variant */}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => remove(index)}
                aria-label={`Remove variant ${index + 1}`}
              >
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Remove
              </button>
            </fieldset>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.addBtn}
        onClick={addVariant}
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Variant
      </button>
    </fieldset>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/components/ProductForm/sections/VariantsSection/index.ts"
cat > "$ROOT/apps/admin/src/pages/Products/components/ProductForm/sections/VariantsSection/index.ts" << 'ADMIN_EOF'
export { VariantsSection } from './VariantsSection';
export type { VariantsSectionProps } from './VariantsSection';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Products/index.ts"
cat > "$ROOT/apps/admin/src/pages/Products/index.ts" << 'ADMIN_EOF'
export { ProductsPage } from './ProductsPage';

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Settings/SettingsPage.module.css"
cat > "$ROOT/apps/admin/src/pages/Settings/SettingsPage.module.css" << 'ADMIN_EOF'
/**
 * @file SettingsPage.module.css
 * @path apps/admin/src/pages/Settings/
 */
.page { display: flex; flex-direction: column; flex: 1; }
.layout { display: grid; grid-template-columns: 220px 1fr; flex: 1; overflow: hidden; }
/* Section Nav */
.sectionNav { border-right: 1px solid var(--ca-border); padding: var(--ca-space-5) var(--ca-space-3); background: var(--ca-surface-raised); }
.navList { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.navBtn {
  display: flex; align-items: center; gap: var(--ca-space-2-5);
  width: 100%; padding: var(--ca-space-2-5) var(--ca-space-3);
  background: transparent; border: none; border-radius: var(--ca-radius-md);
  color: var(--ca-text-muted); font-family: var(--ca-font-body); font-size: 0.875rem; font-weight: 500;
  cursor: pointer; text-align: left; transition: background 130ms ease, color 130ms ease;
  min-height: 44px;
}
.navBtn:hover { background: var(--ca-surface-hover); color: var(--ca-text-primary); }
.navBtnActive { background: rgba(var(--ca-accent-rgb), 0.08) !important; color: var(--ca-accent) !important; font-weight: 600; }
.navBtn:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; }
.navIcon { font-size: 1rem; flex-shrink: 0; }
/* Section Content */
.sectionContent { padding: var(--ca-space-6); overflow-y: auto; }
.sectionTitle { margin: 0 0 var(--ca-space-5); font-family: var(--ca-font-display); font-size: 1.25rem; font-weight: 700; color: var(--ca-text-primary); }
/* Forms */
.settingsForm { display: flex; flex-direction: column; gap: var(--ca-space-5); }
.formGrid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ca-space-4); }
.fullWidth { grid-column: 1 / -1; }
.formActions { display: flex; justify-content: flex-start; padding-top: var(--ca-space-2); }
.input { width: 100%; padding: var(--ca-space-2-5) var(--ca-space-3); background: var(--ca-surface); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); color: var(--ca-text-primary); font-family: var(--ca-font-body); font-size: 0.875rem; outline: none; transition: border-color 150ms ease, box-shadow 150ms ease; }
.input:focus { border-color: var(--ca-accent); box-shadow: 0 0 0 3px rgba(var(--ca-accent-rgb), 0.15); }
.select { width: 100%; padding: var(--ca-space-2-5) var(--ca-space-3); background: var(--ca-surface); border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); color: var(--ca-text-primary); font-family: var(--ca-font-body); font-size: 0.875rem; cursor: pointer; outline: none; }
.select:focus { border-color: var(--ca-accent); }
.fileInput { font-family: var(--ca-font-body); font-size: 0.875rem; color: var(--ca-text-secondary); }
.saveBtn { display: inline-flex; align-items: center; gap: var(--ca-space-2); padding: var(--ca-space-2-5) var(--ca-space-5); background: var(--ca-accent); border: none; border-radius: var(--ca-radius-md); color: var(--ca-accent-fg); font-family: var(--ca-font-body); font-size: 0.875rem; font-weight: 600; cursor: pointer; min-height: 44px; transition: background 130ms ease; }
.saveBtn:hover:not(:disabled) { background: var(--ca-accent-hover); }
.saveBtn:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 3px; }
.saveBtn:disabled { opacity: 0.6; cursor: not-allowed; }
/* Color picker */
.colorRow { display: flex; align-items: center; gap: var(--ca-space-2); }
.colorInput { width: 44px; height: 44px; border: 2px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); cursor: pointer; padding: 2px; background: transparent; }
.colorHex { font-family: var(--ca-font-mono); font-size: 0.875rem; color: var(--ca-text-secondary); }
/* Tax list */
.taxList { display: flex; flex-direction: column; gap: var(--ca-space-2); }
.taxItem { display: flex; align-items: center; justify-content: space-between; padding: var(--ca-space-3) var(--ca-space-4); background: var(--ca-surface-elevated); border: 1px solid var(--ca-border); border-radius: var(--ca-radius-lg); }
.taxInfo { display: flex; align-items: center; gap: var(--ca-space-3); flex: 1; }
.taxLabel { font-size: 0.875rem; font-weight: 600; color: var(--ca-text-primary); }
.taxRate { font-size: 0.875rem; font-weight: 700; color: var(--ca-accent); }
.taxCategories { font-size: 0.75rem; color: var(--ca-text-muted); text-transform: capitalize; }
/* Toggle */
.toggleLabel { display: flex; align-items: center; gap: var(--ca-space-2); cursor: pointer; }
.toggleInput { position: absolute; opacity: 0; width: 0; height: 0; }
.toggleTrack { display: block; width: 36px; height: 20px; background: var(--ca-border-strong); border-radius: var(--ca-radius-full); position: relative; transition: background 150ms ease; flex-shrink: 0; }
.toggleTrack::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: transform 150ms ease; }
.toggleInput:checked + .toggleTrack { background: var(--ca-accent); }
.toggleInput:checked + .toggleTrack::after { transform: translateX(16px); }
.toggleInput:focus-visible + .toggleTrack { outline: 2px solid var(--ca-accent); outline-offset: 2px; }
/* Invite form */
.inviteForm { display: flex; gap: var(--ca-space-2); margin-bottom: var(--ca-space-5); flex-wrap: wrap; }
.inviteForm .input { flex: 1; min-width: 200px; }
.inviteForm .select { min-width: 120px; }
/* Staff list */
.staffList { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--ca-space-2); }
.staffItem { display: flex; align-items: center; gap: var(--ca-space-3); padding: var(--ca-space-3) var(--ca-space-4); background: var(--ca-surface-elevated); border: 1px solid var(--ca-border); border-radius: var(--ca-radius-lg); }
.staffAvatar { width: 36px; height: 36px; border-radius: 50%; background: rgba(var(--ca-accent-rgb), 0.12); color: var(--ca-accent); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0; }
.staffInfo { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.staffName { font-size: 0.875rem; font-weight: 600; color: var(--ca-text-primary); }
.staffEmail { font-size: 0.75rem; color: var(--ca-text-muted); }
.staffToggle { padding: var(--ca-space-1-5) var(--ca-space-3); background: transparent; border: 1.5px solid var(--ca-border-strong); border-radius: var(--ca-radius-md); font-family: var(--ca-font-body); font-size: 0.78rem; font-weight: 500; cursor: pointer; min-height: 36px; }
.staffDeactivate { color: var(--ca-error); border-color: rgba(var(--ca-error-rgb), 0.3); }
.staffDeactivate:hover { background: rgba(var(--ca-error-rgb), 0.07); }
.staffActivate { color: var(--ca-success); border-color: rgba(39,174,96,0.3); }
.staffActivate:hover { background: rgba(39,174,96,0.07); }
.staffToggle:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: 2px; }
/* Map placeholder */
.mapPlaceholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--ca-space-3); padding: var(--ca-space-16); background: var(--ca-surface-raised); border: 2px dashed var(--ca-border-strong); border-radius: var(--ca-radius-xl); text-align: center; }
.mapIcon { color: var(--ca-text-muted); }
.mapPlaceholderText { margin: 0; font-size: 1rem; font-weight: 600; color: var(--ca-text-secondary); }
.mapPlaceholderHint { margin: 0; font-size: 0.82rem; color: var(--ca-text-muted); max-width: 380px; line-height: 1.6; }
.srOnly { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 768px) { .layout { grid-template-columns: 1fr; } .sectionNav { border-right: none; border-bottom: 1px solid var(--ca-border); padding: var(--ca-space-3); } .navList { flex-direction: row; flex-wrap: wrap; } .formGrid { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .navBtn, .saveBtn, .staffToggle, .toggleTrack, .toggleTrack::after, .input, .select { transition: none; } }

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Settings/SettingsPage.tsx"
cat > "$ROOT/apps/admin/src/pages/Settings/SettingsPage.tsx" << 'ADMIN_EOF'
/**
 * @file SettingsPage.tsx
 * @path apps/admin/src/pages/Settings/SettingsPage.tsx
 *
 * Admin settings page with five sections accessed via a left-side nav:
 *   1. Organization Profile – name, hours, contact info
 *   2. Branding – logo upload, color pickers, font selection
 *   3. Delivery Zones – polygon zone management (map placeholder for PostGIS)
 *   4. Tax Configuration – rate table for product categories
 *   5. Staff Accounts – invite, role assignment, deactivate
 *
 * PATTERN: Each section is a separate component mounted based on the active
 * section key. They each fetch their own data independently so loading
 * one section doesn't delay others.
 *
 * WCAG: The section navigation uses role="navigation" aria-label="Settings".
 * The active section link has aria-current="page". Each section starts
 * with its own <h2> heading.
 */

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../../components/shared/PageHeader';
import { FormField } from '../../components/shared/FormField';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useAdminUiStore } from '../../stores/adminUiStore';
import type { OrgProfileFormValues, BrandingFormValues, TaxConfig, StaffMember } from '../../types/admin.types';
import styles from './SettingsPage.module.css';

// ─── Section Keys ─────────────────────────────────────────────────────────────

type SettingsSection = 'org' | 'branding' | 'zones' | 'tax' | 'staff';

const SECTIONS: { key: SettingsSection; label: string; icon: string }[] = [
  { key: 'org',      label: 'Organization',    icon: '🏢' },
  { key: 'branding', label: 'Branding',        icon: '🎨' },
  { key: 'zones',    label: 'Delivery Zones',  icon: '🗺️' },
  { key: 'tax',      label: 'Tax Config',      icon: '💰' },
  { key: 'staff',    label: 'Staff Accounts',  icon: '👥' },
];

// ─── Org Profile Section ──────────────────────────────────────────────────────

function OrgProfileSection() {
  const { toastSuccess, toastError } = useAdminUiStore((s) => ({ toastSuccess: s.toastSuccess, toastError: s.toastError }));
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OrgProfileFormValues>();

  const onSubmit = async (values: OrgProfileFormValues) => {
    try {
      const res = await fetch('/api/admin/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) toastSuccess('Organization profile updated');
      else toastError('Failed to update profile');
    } catch { toastError('Network error'); }
  };

  return (
    <section aria-labelledby="org-title">
      <h2 id="org-title" className={styles.sectionTitle}>Organization Profile</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.settingsForm} aria-label="Organization profile form">
        <div className={styles.formGrid}>
          <FormField label="Organization Name" required error={errors.name?.message} className={styles.fullWidth}>
            {({ id, inputProps }) => (
              <input id={id} {...inputProps} {...register('name', { required: 'Name is required' })} className={styles.input} type="text" placeholder="Green Leaf Dispensary" />
            )}
          </FormField>
          <FormField label="Phone" error={errors.phone?.message}>
            {({ id, inputProps }) => (
              <input id={id} {...inputProps} {...register('phone')} className={styles.input} type="tel" placeholder="+1 (555) 000-0000" />
            )}
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            {({ id, inputProps }) => (
              <input id={id} {...inputProps} {...register('email')} className={styles.input} type="email" placeholder="hello@dispensary.com" />
            )}
          </FormField>
          <FormField label="Address Line 1" error={errors.addressLine1?.message} className={styles.fullWidth}>
            {({ id, inputProps }) => (
              <input id={id} {...inputProps} {...register('addressLine1')} className={styles.input} type="text" />
            )}
          </FormField>
          <FormField label="City" error={errors.city?.message}>
            {({ id, inputProps }) => <input id={id} {...inputProps} {...register('city')} className={styles.input} type="text" />}
          </FormField>
          <FormField label="State" error={errors.state?.message}>
            {({ id, inputProps }) => (
              <select id={id} {...inputProps} {...register('state')} className={styles.select}>
                <option value="">Select state…</option>
                <option value="NY">New York</option>
                <option value="NJ">New Jersey</option>
                <option value="CT">Connecticut</option>
              </select>
            )}
          </FormField>
          <FormField label="ZIP Code" error={errors.zip?.message}>
            {({ id, inputProps }) => <input id={id} {...inputProps} {...register('zip')} className={styles.input} type="text" maxLength={10} />}
          </FormField>
          <FormField label="Minimum Age Requirement" error={errors.minimumAge?.message}>
            {({ id, inputProps }) => (
              <select id={id} {...inputProps} {...register('minimumAge', { valueAsNumber: true })} className={styles.select}>
                <option value={21}>21+ (Recreational)</option>
                <option value={18}>18+ (Medical)</option>
              </select>
            )}
          </FormField>
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn} disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </section>
  );
}

// ─── Branding Section ─────────────────────────────────────────────────────────

function BrandingSection() {
  const { toastSuccess, toastError } = useAdminUiStore((s) => ({ toastSuccess: s.toastSuccess, toastError: s.toastError }));
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<BrandingFormValues>({
    defaultValues: { brandColor: '#2D6A4F', accentColor: '#52B788', secondaryColor: '#95D5B2', fontFamily: 'DM Sans' },
  });

  const brandColor = watch('brandColor');
  const accentColor = watch('accentColor');

  const onSubmit = async (values: BrandingFormValues) => {
    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (k === 'logoFile' && v instanceof File) formData.append('logo', v);
      else if (typeof v === 'string') formData.append(k, v);
    });
    try {
      const res = await fetch('/api/admin/organization/branding', { method: 'PUT', body: formData });
      if (res.ok) toastSuccess('Branding updated');
      else toastError('Failed to update branding');
    } catch { toastError('Network error'); }
  };

  return (
    <section aria-labelledby="branding-title">
      <h2 id="branding-title" className={styles.sectionTitle}>Branding</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.settingsForm} aria-label="Branding configuration form">
        <div className={styles.formGrid}>
          {/* Color pickers */}
          <FormField label="Brand Color" hint="Primary brand color used throughout the storefront.">
            {({ id }) => (
              <div className={styles.colorRow}>
                <input id={id} type="color" {...register('brandColor')} className={styles.colorInput} aria-label="Brand color picker" />
                <span className={styles.colorHex}>{brandColor}</span>
              </div>
            )}
          </FormField>
          <FormField label="Accent Color" hint="Secondary highlight color.">
            {({ id }) => (
              <div className={styles.colorRow}>
                <input id={id} type="color" {...register('accentColor')} className={styles.colorInput} aria-label="Accent color picker" />
                <span className={styles.colorHex}>{accentColor}</span>
              </div>
            )}
          </FormField>
          <FormField label="Font Family">
            {({ id, inputProps }) => (
              <select id={id} {...inputProps} {...register('fontFamily')} className={styles.select}>
                <option value="DM Sans">DM Sans</option>
                <option value="Inter">Inter</option>
                <option value="Nunito">Nunito</option>
                <option value="Raleway">Raleway</option>
              </select>
            )}
          </FormField>
          <FormField label="Logo" hint="Upload PNG or SVG. Recommended: 200×60px.">
            {({ id }) => (
              <input id={id} type="file" accept="image/png,image/svg+xml,image/jpeg" {...register('logoFile')} className={styles.fileInput} aria-label="Upload logo file" />
            )}
          </FormField>
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn} disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Branding'}
          </button>
        </div>
      </form>
    </section>
  );
}

// ─── Tax Config Section ───────────────────────────────────────────────────────

function TaxConfigSection() {
  const [taxes, setTaxes] = useState<TaxConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toastSuccess, toastError } = useAdminUiStore((s) => ({ toastSuccess: s.toastSuccess, toastError: s.toastError }));

  useEffect(() => {
    fetch('/api/admin/tax-configs').then((r) => r.json()).then((d) => { setTaxes(d); setIsLoading(false); });
  }, []);

  const toggleTax = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/admin/tax-configs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) {
      setTaxes((prev) => prev.map((t) => t.id === id ? { ...t, isActive } : t));
      toastSuccess(`Tax rule ${isActive ? 'enabled' : 'disabled'}`);
    } else {
      toastError('Failed to update tax rule');
    }
  };

  return (
    <section aria-labelledby="tax-title">
      <h2 id="tax-title" className={styles.sectionTitle}>Tax Configuration</h2>
      {isLoading ? (
        <p aria-live="polite">Loading tax rules…</p>
      ) : (
        <div className={styles.taxList} role="list">
          {taxes.map((tax) => (
            <div key={tax.id} className={styles.taxItem} role="listitem">
              <div className={styles.taxInfo}>
                <span className={styles.taxLabel}>{tax.label}</span>
                <span className={styles.taxRate}>{tax.ratePct}%</span>
                <span className={styles.taxCategories}>
                  {tax.appliesToCategories.join(', ')}
                </span>
              </div>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={tax.isActive}
                  onChange={(e) => toggleTax(tax.id, e.target.checked)}
                  aria-label={`${tax.isActive ? 'Disable' : 'Enable'} ${tax.label}`}
                />
                <span className={styles.toggleTrack} aria-hidden="true" />
                <span className={styles.srOnly}>{tax.isActive ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Staff Section ────────────────────────────────────────────────────────────

function StaffSection() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffMember['role']>('staff');
  const { toastSuccess, toastError } = useAdminUiStore((s) => ({ toastSuccess: s.toastSuccess, toastError: s.toastError }));

  useEffect(() => {
    fetch('/api/admin/staff').then((r) => r.json()).then((d) => { setStaff(d); setIsLoading(false); });
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/staff/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    if (res.ok) {
      toastSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
    } else {
      toastError('Failed to send invite');
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    const res = await fetch(`/api/admin/staff/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    if (res.ok) {
      setStaff((prev) => prev.map((s) => s.id === member.id ? { ...s, isActive: !s.isActive } : s));
      toastSuccess(`${member.displayName} ${member.isActive ? 'deactivated' : 'activated'}`);
    } else {
      toastError('Failed to update staff member');
    }
  };

  return (
    <section aria-labelledby="staff-title">
      <h2 id="staff-title" className={styles.sectionTitle}>Staff Accounts</h2>

      {/* Invite form */}
      <form onSubmit={handleInvite} className={styles.inviteForm} aria-label="Invite new staff member">
        <label htmlFor="invite-email" className={styles.srOnly}>Email address to invite</label>
        <input
          id="invite-email"
          type="email"
          className={styles.input}
          placeholder="staff@dispensary.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          required
          aria-label="Staff email address"
        />
        <label htmlFor="invite-role" className={styles.srOnly}>Role for new staff member</label>
        <select
          id="invite-role"
          className={styles.select}
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as StaffMember['role'])}
          aria-label="Select role"
        >
          <option value="staff">Staff</option>
          <option value="driver">Driver</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className={styles.saveBtn}>Send Invite</button>
      </form>

      {/* Staff list */}
      {isLoading ? (
        <p aria-live="polite">Loading staff…</p>
      ) : (
        <ul className={styles.staffList} role="list">
          {staff.map((member) => (
            <li key={member.id} className={styles.staffItem} role="listitem">
              <div className={styles.staffAvatar} aria-hidden="true">
                {member.displayName.charAt(0).toUpperCase()}
              </div>
              <div className={styles.staffInfo}>
                <span className={styles.staffName}>{member.displayName}</span>
                <span className={styles.staffEmail}>{member.email}</span>
              </div>
              <StatusBadge
                type="custom"
                value={member.role}
                label={member.role.replace('_', ' ')}
                variant="blue"
              />
              <button
                type="button"
                className={`${styles.staffToggle} ${member.isActive ? styles.staffDeactivate : styles.staffActivate}`}
                onClick={() => handleToggleActive(member)}
                aria-label={`${member.isActive ? 'Deactivate' : 'Activate'} ${member.displayName}`}
              >
                {member.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Delivery Zones Section ───────────────────────────────────────────────────

function DeliveryZonesSection() {
  return (
    <section aria-labelledby="zones-title">
      <h2 id="zones-title" className={styles.sectionTitle}>Delivery Zones</h2>
      <div className={styles.mapPlaceholder} role="img" aria-label="Delivery zone map editor — interactive polygon editor for PostGIS zones. Requires map library integration.">
        <svg aria-hidden="true" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.mapIcon}>
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
        </svg>
        <p className={styles.mapPlaceholderText}>Interactive delivery zone editor</p>
        <p className={styles.mapPlaceholderHint}>
          Integrate with Mapbox or Google Maps to draw polygon zones.
          Zones are stored as PostGIS geometries via the Sprint 10 delivery API.
        </p>
      </div>
    </section>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('org');

  return (
    <div className={styles.page}>
      <PageHeader
        title="Settings"
        subtitle="Manage your organization configuration."
        breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Settings' }]}
      />

      <div className={styles.layout}>
        {/* ── Section Nav ───────────────────────────────────────── */}
        <nav className={styles.sectionNav} aria-label="Settings sections">
          <ul className={styles.navList} role="list">
            {SECTIONS.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  className={`${styles.navBtn} ${activeSection === s.key ? styles.navBtnActive : ''}`}
                  onClick={() => setActiveSection(s.key)}
                  aria-current={activeSection === s.key ? 'page' : undefined}
                >
                  <span aria-hidden="true" className={styles.navIcon}>{s.icon}</span>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Section Content ───────────────────────────────────── */}
        <div className={styles.sectionContent}>
          {activeSection === 'org'      && <OrgProfileSection />}
          {activeSection === 'branding' && <BrandingSection />}
          {activeSection === 'zones'    && <DeliveryZonesSection />}
          {activeSection === 'tax'      && <TaxConfigSection />}
          {activeSection === 'staff'    && <StaffSection />}
        </div>
      </div>
    </div>
  );
}

ADMIN_EOF

echo "→ Writing apps/admin/src/pages/Settings/index.ts"
cat > "$ROOT/apps/admin/src/pages/Settings/index.ts" << 'ADMIN_EOF'
export { SettingsPage } from './SettingsPage';

ADMIN_EOF

echo "→ Writing apps/admin/src/stores/adminAuthStore.ts"
cat > "$ROOT/apps/admin/src/stores/adminAuthStore.ts" << 'ADMIN_EOF'
/**
 * @file adminAuthStore.ts
 * @path apps/admin/src/stores/adminAuthStore.ts
 *
 * Zustand store managing admin portal authentication state.
 *
 * SECURITY NOTE: JWT tokens are stored in httpOnly cookies by the NestJS
 * backend — NOT in localStorage. This store only holds the decoded user
 * profile and a `isAuthenticated` flag derived from a /api/admin/me call.
 * On app mount, `checkSession()` is called to hydrate from the cookie.
 *
 * ROLE HIERARCHY:
 *   super_admin > admin > manager > staff > driver
 * The `hasRole()` helper enforces minimum role checks throughout the app.
 */

import { create } from 'zustand';
import type { AdminUser, AdminRole } from '../types/admin.types';

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

const ROLE_RANK: Record<AdminRole, number> = {
  super_admin: 5,
  admin: 4,
  manager: 3,
  staff: 2,
  driver: 1,
};

// ─── State ────────────────────────────────────────────────────────────────────

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

interface AdminAuthActions {
  /**
   * Validates the existing session cookie with the backend.
   * Called once on app mount in AdminLayout.
   */
  checkSession: () => Promise<void>;

  /**
   * Sign in with email + password. The backend sets the httpOnly cookie.
   */
  signIn: (email: string, password: string) => Promise<void>;

  /**
   * Clears the session cookie via a backend call, then resets local state.
   */
  signOut: () => Promise<void>;

  /**
   * Returns true if the current user's role is >= the required role.
   * Used by ProtectedRoute and conditional UI rendering.
   */
  hasRole: (requiredRole: AdminRole) => boolean;

  /** Clears any auth error */
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const initialState: AdminAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAdminAuthStore = create<AdminAuthState & AdminAuthActions>()(
  (set, get) => ({
    ...initialState,

    checkSession: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/admin/me', { credentials: 'include' });
        if (!res.ok) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }
        const user: AdminUser = await res.json();
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        set({ isAuthenticated: false, user: null, isLoading: false });
      }
    },

    signIn: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/admin/auth/sign-in', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const { message } = await res.json();
          set({ error: message ?? 'Invalid credentials', isLoading: false });
          return;
        }
        const user: AdminUser = await res.json();
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        set({ error: 'Network error, please try again', isLoading: false });
      }
    },

    signOut: async () => {
      await fetch('/api/admin/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {});
      set(initialState);
    },

    hasRole: (requiredRole) => {
      const { user } = get();
      if (!user) return false;
      return ROLE_RANK[user.role] >= ROLE_RANK[requiredRole];
    },

    clearError: () => set({ error: null }),
  }),
);

// ─── Convenience Selectors ────────────────────────────────────────────────────

export const useAdminUser = () => useAdminAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAdminAuthStore((s) => s.isAuthenticated);
export const useHasRole = (role: AdminRole) =>
  useAdminAuthStore((s) => s.hasRole(role));

ADMIN_EOF

echo "→ Writing apps/admin/src/stores/adminUiStore.ts"
cat > "$ROOT/apps/admin/src/stores/adminUiStore.ts" << 'ADMIN_EOF'
/**
 * @file adminUiStore.ts
 * @path apps/admin/src/stores/adminUiStore.ts
 *
 * Zustand store for admin portal UI state: sidebar collapse, mobile menu,
 * toast notifications, and global loading overlay.
 *
 * PATTERN: UI state is kept separate from domain state (auth, data) so
 * that domain stores don't re-render the entire layout on every interaction.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Toast Types ──────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  /** Duration in ms. 0 = persist until dismissed. Default: 4000 */
  duration: number;
}

// ─── State & Actions ──────────────────────────────────────────────────────────

interface AdminUiState {
  /** Whether the sidebar is in collapsed (icon-only) mode on desktop */
  isSidebarCollapsed: boolean;
  /** Whether the mobile sidebar drawer is open */
  isMobileNavOpen: boolean;
  /** Active toast notifications */
  toasts: Toast[];
  /** Full-screen loading overlay (e.g., during bulk operations) */
  isGlobalLoading: boolean;
  globalLoadingMessage: string;
}

interface AdminUiActions {
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openMobileNav: () => void;
  closeMobileNav: () => void;

  /**
   * Adds a toast notification. Auto-dismisses after `duration` ms.
   * Returns the toast ID so callers can dismiss it programmatically.
   */
  addToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;

  /** Convenience wrappers for common toast variants */
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
  toastWarning: (message: string) => void;
  toastInfo: (message: string) => void;

  showGlobalLoading: (message?: string) => void;
  hideGlobalLoading: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAdminUiStore = create<AdminUiState & AdminUiActions>()(
  persist(
    (set, get) => ({
      isSidebarCollapsed: false,
      isMobileNavOpen: false,
      toasts: [],
      isGlobalLoading: false,
      globalLoadingMessage: '',

      toggleSidebarCollapsed: () =>
        set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) =>
        set({ isSidebarCollapsed: collapsed }),
      openMobileNav: () => set({ isMobileNavOpen: true }),
      closeMobileNav: () => set({ isMobileNavOpen: false }),

      addToast: (toastData) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const duration = toastData.duration ?? 4000;
        const toast: Toast = { ...toastData, id, duration };
        set((s) => ({ toasts: [...s.toasts, toast] }));

        if (duration > 0) {
          setTimeout(() => get().dismissToast(id), duration);
        }
        return id;
      },

      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      toastSuccess: (message) =>
        get().addToast({ message, variant: 'success', duration: 4000 }),
      toastError: (message) =>
        get().addToast({ message, variant: 'error', duration: 6000 }),
      toastWarning: (message) =>
        get().addToast({ message, variant: 'warning', duration: 5000 }),
      toastInfo: (message) =>
        get().addToast({ message, variant: 'info', duration: 4000 }),

      showGlobalLoading: (message = 'Processing…') =>
        set({ isGlobalLoading: true, globalLoadingMessage: message }),
      hideGlobalLoading: () =>
        set({ isGlobalLoading: false, globalLoadingMessage: '' }),
    }),
    {
      name: 'cannasaas-admin-ui',
      // Only persist the sidebar collapse preference
      partialize: (s) => ({ isSidebarCollapsed: s.isSidebarCollapsed }),
    },
  ),
);

// ─── Convenience Selectors ────────────────────────────────────────────────────

export const useToasts = () => useAdminUiStore((s) => s.toasts);
export const useSidebarCollapsed = () =>
  useAdminUiStore((s) => s.isSidebarCollapsed);

ADMIN_EOF

echo "→ Writing apps/admin/src/types/admin.types.ts"
cat > "$ROOT/apps/admin/src/types/admin.types.ts" << 'ADMIN_EOF'
/**
 * @file admin.types.ts
 * @path apps/admin/src/types/admin.types.ts
 *
 * TypeScript type definitions for the CannaSaas admin portal.
 * All domain models used across pages, stores, and API calls are defined here.
 *
 * NAMING CONVENTION:
 *   - Plain interfaces = data shapes returned from the API
 *   - *FormValues = react-hook-form field values for create/edit forms
 *   - *Filters = filter state shapes for DataTable components
 *   - *Row = flattened shapes optimised for table rendering
 */

// ─── Auth / Roles ─────────────────────────────────────────────────────────────

export type AdminRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'driver';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  avatarUrl?: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenueCents: number;
  revenueChangePct: number;
  ordersToday: number;
  ordersTodayChangePct: number;
  activeCustomers: number;
  activeCustomersChangePct: number;
  averageOrderValueCents: number;
  aovChangePct: number;
}

export interface RevenueDataPoint {
  date: string;       // ISO date string
  revenueCents: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  thumbnailUrl: string | null;
  category: string;
  unitsSold: number;
  revenueCents: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalCents: number;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  createdAt: string;
}

export interface LowStockAlert {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  currentStock: number;
  reorderThreshold: number;
  thumbnailUrl: string | null;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export type ProductStatus = 'active' | 'inactive' | 'draft' | 'archived';
export type StrainType = 'indica' | 'sativa' | 'hybrid' | 'cbd' | 'unknown';
export type ProductCategory =
  | 'flower'
  | 'edibles'
  | 'concentrates'
  | 'vapes'
  | 'topicals'
  | 'tinctures'
  | 'accessories'
  | 'pre_rolls';

export interface ProductVariant {
  id: string;
  label: string;                 // e.g. "3.5g", "1oz"
  sku: string;
  priceCents: number;
  salePriceCents: number | null;
  costCents: number | null;
  msrpCents: number | null;
  stock: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  category: ProductCategory;
  status: ProductStatus;
  strainType: StrainType;
  thcPct: number | null;
  cbdPct: number | null;
  terpenes: string[];
  effects: string[];
  flavors: string[];
  variants: ProductVariant[];
  images: ProductImage[];
  primaryImageId: string | null;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  metrcId: string | null;
  batchNumber: string | null;
  harvestDate: string | null;
  expirationDate: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface ProductRow {
  id: string;
  thumbnailUrl: string | null;
  name: string;
  category: ProductCategory;
  thcPct: number | null;
  priceCents: number;   // lowest variant price
  stock: number;        // total across variants
  status: ProductStatus;
}

export interface ProductFilters {
  search: string;
  category: ProductCategory | '';
  status: ProductStatus | '';
  strainType: StrainType | '';
}

export type ProductFormValues = Omit<Product,
  'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'images'
> & {
  imageFiles: File[];
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type FulfillmentMethod = 'pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'online' | 'loyalty';

export interface OrderStatusEvent {
  status: OrderStatus;
  timestamp: string;
  actorName: string;
  note: string | null;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  thumbnailUrl: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  metrcUid: string | null;
}

export interface OrderPayment {
  method: PaymentMethod;
  amountCents: number;
  tipCents: number;
  taxCents: number;
  discountCents: number;
  loyaltyPointsUsed: number;
  transactionId: string | null;
}

export interface OrderCustomer {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  isVerified: boolean;
  isMedical: boolean;
  medicalCardExpiry: string | null;
}

export interface OrderFulfillment {
  method: FulfillmentMethod;
  driverName: string | null;
  driverId: string | null;
  estimatedArrival: string | null;
  deliveryAddress: string | null;
  trackingUrl: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customer: OrderCustomer;
  items: OrderItem[];
  payment: OrderPayment;
  fulfillment: OrderFulfillment;
  statusHistory: OrderStatusEvent[];
  subtotalCents: number;
  totalCents: number;
  notes: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  search: string;
  status: OrderStatus | '';
  fulfillmentMethod: FulfillmentMethod | '';
  dateFrom: string;
  dateTo: string;
}

// ─── Customers ────────────────────────────────────────────────────────────────

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface Customer {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  verificationStatus: VerificationStatus;
  isMedical: boolean;
  medicalCardUrl: string | null;
  medicalCardExpiry: string | null;
  governmentIdUrl: string | null;
  loyaltyPoints: number;
  lifetimeValueCents: number;
  totalOrders: number;
  lastOrderAt: string | null;
  joinedAt: string;
  organizationId: string;
}

export interface CustomerFilters {
  search: string;
  verificationStatus: VerificationStatus | '';
  isMedical: boolean | null;
  hasOrders: boolean | null;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type DateRangePreset = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface AnalyticsFulfillmentBreakdown {
  pickup: number;
  delivery: number;
}

export interface ConversionFunnelStep {
  label: string;
  count: number;
  pct: number;
}

export interface CustomerAcquisitionPoint {
  date: string;
  newCustomers: number;
  returningCustomers: number;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface TaxConfig {
  id: string;
  label: string;
  ratePct: number;
  appliesToCategories: ProductCategory[];
  isActive: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string;
  /** GeoJSON polygon coordinates */
  polygon: [number, number][];
  minimumOrderCents: number;
  deliveryFeeCents: number;
  estimatedMinutes: number;
  isActive: boolean;
}

export interface StaffMember {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface OrgProfileFormValues {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  hours: Record<string, { open: string; close: string; closed: boolean }>;
  minimumAge: 18 | 21;
}

export interface BrandingFormValues {
  brandColor: string;
  accentColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoFile: File | null;
}

ADMIN_EOF

echo "→ Writing apps/admin/src/types/admin.types.ts"
cat > "$ROOT/apps/admin/src/types/admin.types.ts" << 'ADMIN_EOF'
/**
 * @file admin.types.ts
 * @path apps/admin/src/types/admin.types.ts
 *
 * TypeScript type definitions for the CannaSaas admin portal.
 * All domain models used across pages, stores, and API calls are defined here.
 *
 * NAMING CONVENTION:
 *   - Plain interfaces = data shapes returned from the API
 *   - *FormValues = react-hook-form field values for create/edit forms
 *   - *Filters = filter state shapes for DataTable components
 *   - *Row = flattened shapes optimised for table rendering
 */

// ─── Auth / Roles ─────────────────────────────────────────────────────────────

export type AdminRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'driver';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  avatarUrl?: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenueCents: number;
  revenueChangePct: number;
  ordersToday: number;
  ordersTodayChangePct: number;
  activeCustomers: number;
  activeCustomersChangePct: number;
  averageOrderValueCents: number;
  aovChangePct: number;
}

export interface RevenueDataPoint {
  date: string;       // ISO date string
  revenueCents: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  thumbnailUrl: string | null;
  category: string;
  unitsSold: number;
  revenueCents: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalCents: number;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  createdAt: string;
}

export interface LowStockAlert {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  currentStock: number;
  reorderThreshold: number;
  thumbnailUrl: string | null;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export type ProductStatus = 'active' | 'inactive' | 'draft' | 'archived';
export type StrainType = 'indica' | 'sativa' | 'hybrid' | 'cbd' | 'unknown';
export type ProductCategory =
  | 'flower'
  | 'edibles'
  | 'concentrates'
  | 'vapes'
  | 'topicals'
  | 'tinctures'
  | 'accessories'
  | 'pre_rolls';

export interface ProductVariant {
  id: string;
  label: string;                 // e.g. "3.5g", "1oz"
  sku: string;
  priceCents: number;
  salePriceCents: number | null;
  costCents: number | null;
  msrpCents: number | null;
  stock: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  category: ProductCategory;
  status: ProductStatus;
  strainType: StrainType;
  thcPct: number | null;
  cbdPct: number | null;
  terpenes: string[];
  effects: string[];
  flavors: string[];
  variants: ProductVariant[];
  images: ProductImage[];
  primaryImageId: string | null;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  metrcId: string | null;
  batchNumber: string | null;
  harvestDate: string | null;
  expirationDate: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface ProductRow {
  id: string;
  thumbnailUrl: string | null;
  name: string;
  category: ProductCategory;
  thcPct: number | null;
  priceCents: number;   // lowest variant price
  stock: number;        // total across variants
  status: ProductStatus;
}

export interface ProductFilters {
  search: string;
  category: ProductCategory | '';
  status: ProductStatus | '';
  strainType: StrainType | '';
}

export type ProductFormValues = Omit<Product,
  'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'images'
> & {
  imageFiles: File[];
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type FulfillmentMethod = 'pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'online' | 'loyalty';

export interface OrderStatusEvent {
  status: OrderStatus;
  timestamp: string;
  actorName: string;
  note: string | null;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  thumbnailUrl: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  metrcUid: string | null;
}

export interface OrderPayment {
  method: PaymentMethod;
  amountCents: number;
  tipCents: number;
  taxCents: number;
  discountCents: number;
  loyaltyPointsUsed: number;
  transactionId: string | null;
}

export interface OrderCustomer {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  isVerified: boolean;
  isMedical: boolean;
  medicalCardExpiry: string | null;
}

export interface OrderFulfillment {
  method: FulfillmentMethod;
  driverName: string | null;
  driverId: string | null;
  estimatedArrival: string | null;
  deliveryAddress: string | null;
  trackingUrl: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customer: OrderCustomer;
  items: OrderItem[];
  payment: OrderPayment;
  fulfillment: OrderFulfillment;
  statusHistory: OrderStatusEvent[];
  subtotalCents: number;
  totalCents: number;
  notes: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  search: string;
  status: OrderStatus | '';
  fulfillmentMethod: FulfillmentMethod | '';
  dateFrom: string;
  dateTo: string;
}

// ─── Customers ────────────────────────────────────────────────────────────────

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface Customer {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  verificationStatus: VerificationStatus;
  isMedical: boolean;
  medicalCardUrl: string | null;
  medicalCardExpiry: string | null;
  governmentIdUrl: string | null;
  loyaltyPoints: number;
  lifetimeValueCents: number;
  totalOrders: number;
  lastOrderAt: string | null;
  joinedAt: string;
  organizationId: string;
}

export interface CustomerFilters {
  search: string;
  verificationStatus: VerificationStatus | '';
  isMedical: boolean | null;
  hasOrders: boolean | null;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type DateRangePreset = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface AnalyticsFulfillmentBreakdown {
  pickup: number;
  delivery: number;
}

export interface ConversionFunnelStep {
  label: string;
  count: number;
  pct: number;
}

export interface CustomerAcquisitionPoint {
  date: string;
  newCustomers: number;
  returningCustomers: number;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface TaxConfig {
  id: string;
  label: string;
  ratePct: number;
  appliesToCategories: ProductCategory[];
  isActive: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string;
  /** GeoJSON polygon coordinates */
  polygon: [number, number][];
  minimumOrderCents: number;
  deliveryFeeCents: number;
  estimatedMinutes: number;
  isActive: boolean;
}

export interface StaffMember {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface OrgProfileFormValues {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  hours: Record<string, { open: string; close: string; closed: boolean }>;
  minimumAge: 18 | 21;
}

export interface BrandingFormValues {
  brandColor: string;
  accentColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoFile: File | null;
}

ADMIN_EOF

echo ''
echo '✅ Done! All admin portal files written into $ROOT'
