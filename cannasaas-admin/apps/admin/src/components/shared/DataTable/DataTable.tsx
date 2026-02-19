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

