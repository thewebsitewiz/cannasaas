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

