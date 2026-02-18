/**
 * ═══════════════════════════════════════════════════════════════════
 * AddressCard — Single Saved Address with Actions
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/account/AddressCard.tsx
 *
 * Renders one saved address as a card with Edit, Delete, and
 * Set Default actions. Used inside SavedAddresses list.
 *
 * Visual:
 *   ┌────────────────────────────────────┐
 *   │ 🏠 Home                  [Default] │
 *   │ 456 Oak Ave                        │
 *   │ Denver, CO 80203                   │
 *   │ "Ring doorbell"                    │
 *   │                                    │
 *   │ [Edit]  [Delete]  [Set Default]    │
 *   └────────────────────────────────────┘
 *
 * Accessibility (WCAG):
 *   - <article> with aria-label (4.1.2)
 *   - Default badge: non-color indicator (text) (1.4.1)
 *   - Delete: confirmation pattern (prevents accidental loss)
 *   - Action buttons: aria-label with address context (4.1.2)
 *   - focus-visible rings (2.4.7)
 *   - Touch targets ≥ 44px (2.5.8)
 */

import { useState, useCallback } from 'react';
import { useDeleteAddress, useSetDefaultAddress } from '@cannasaas/api-client';

export interface SavedAddress {
  id: string;
  type: string;
  label: string;
  street: string;
  apt?: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
  deliveryInstructions?: string;
}

interface AddressCardProps {
  address: SavedAddress;
  onEdit: (address: SavedAddress) => void;
}

const TYPE_ICONS: Record<string, string> = {
  home: '🏠',
  work: '🏢',
  other: '📍',
};

export function AddressCard({ address, onEdit }: AddressCardProps) {
  const { mutate: deleteAddr, isPending: isDeleting } = useDeleteAddress();
  const { mutate: setDefault, isPending: isSetting } = useSetDefaultAddress();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = useCallback(() => {
    if (confirmDelete) {
      deleteAddr(address.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }, [confirmDelete, deleteAddr, address.id]);

  return (
    <article
      aria-label={`${address.label} address: ${address.street}, ${address.city}`}
      className={`
        relative p-4 sm:p-5
        border-2 rounded-xl transition-colors
        ${address.isDefault ? 'border-primary bg-primary/[0.02]' : 'border-border'}
      `}
    >
      {/* Header: icon + label + default badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-lg">
            {TYPE_ICONS[address.type] ?? '📍'}
          </span>
          <span className="font-semibold text-sm">{address.label}</span>
        </div>
        {address.isDefault && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
            Default
          </span>
        )}
      </div>

      {/* Address text */}
      <div className="text-sm text-muted-foreground space-y-0.5 mb-3">
        <p>{address.street}{address.apt ? `, ${address.apt}` : ''}</p>
        <p>{address.city}, {address.state} {address.zip}</p>
        {address.deliveryInstructions && (
          <p className="text-xs italic mt-1">"{address.deliveryInstructions}"</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onEdit(address)}
          aria-label={`Edit ${address.label} address`}
          className="
            px-3 py-1.5 min-h-[44px]
            text-xs font-medium text-primary
            hover:bg-primary/5 rounded-lg
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-1
            transition-colors
          "
        >
          Edit
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting || address.isDefault}
          aria-label={
            confirmDelete
              ? `Confirm delete ${address.label} address`
              : `Delete ${address.label} address`
          }
          className={`
            px-3 py-1.5 min-h-[44px]
            text-xs font-medium rounded-lg
            disabled:opacity-40 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-destructive focus-visible:ring-offset-1
            transition-colors
            ${confirmDelete
              ? 'bg-destructive text-destructive-foreground'
              : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'}
          `}
        >
          {confirmDelete ? 'Confirm?' : 'Delete'}
        </button>

        {!address.isDefault && (
          <button
            onClick={() => setDefault(address.id)}
            disabled={isSetting}
            aria-label={`Set ${address.label} as default address`}
            className="
              ml-auto
              px-3 py-1.5 min-h-[44px]
              text-xs font-medium text-muted-foreground
              hover:text-foreground hover:bg-muted rounded-lg
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-1
              transition-colors
            "
          >
            Set Default
          </button>
        )}
      </div>
    </article>
  );
}
