/**
 * ═══════════════════════════════════════════════════════════════════
 * SavedAddresses — Address Management List
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/account/SavedAddresses.tsx
 *
 * Route: /account/addresses
 *
 * Fetches saved addresses via GET /users/me/addresses and renders
 * them as AddressCard components. Provides an "Add Address" CTA
 * that opens the AddressFormDialog in create mode. Editing an
 * address opens the same dialog in edit mode.
 *
 * Accessibility (WCAG):
 *   - <section> with aria-labelledby (1.3.1)
 *   - role="list" on address grid (1.3.1)
 *   - Empty state: role="status" (4.1.2)
 *   - Add button: descriptive text (2.4.4)
 *
 * Responsive:
 *   - 1 column mobile, 2 columns sm+
 *   - Add button: full-width dashed card
 */

import { useState } from 'react';
import { useUserAddresses } from '@cannasaas/api-client';
import { AddressCard, type SavedAddress } from './AddressCard';
import { AddressFormDialog } from './AddressFormDialog';

export function SavedAddresses() {
  const { data: addresses = [], isLoading } = useUserAddresses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddr, setEditingAddr] = useState<SavedAddress | null>(null);

  const handleEdit = (addr: SavedAddress) => {
    setEditingAddr(addr);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingAddr(null);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingAddr(null);
  };

  return (
    <section aria-labelledby="addresses-heading">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 id="addresses-heading" className="text-xl sm:text-2xl font-bold">
            Saved Addresses
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your delivery addresses.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="
            hidden sm:inline-flex items-center gap-1.5
            px-4 py-2 min-h-[44px]
            text-sm font-medium text-primary
            border border-primary rounded-lg
            hover:bg-primary/5
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-1
            transition-colors
          "
        >
          + Add Address
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="status" aria-busy="true">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
          ))}
          <span className="sr-only">Loading addresses…</span>
        </div>
      ) : addresses.length === 0 ? (
        <div role="status" className="py-12 text-center">
          <span aria-hidden="true" className="text-5xl block mb-3">📍</span>
          <p className="text-base font-semibold mb-1">No saved addresses</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add a delivery address for faster checkout.
          </p>
          <button
            onClick={handleAdd}
            className="
              inline-flex items-center gap-1.5
              px-5 py-2.5 min-h-[44px]
              text-sm font-semibold text-primary-foreground bg-primary
              rounded-xl hover:bg-primary/90
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-1
              transition-colors
            "
          >
            + Add Your First Address
          </button>
        </div>
      ) : (
        <div role="list" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div role="listitem" key={addr.id}>
              <AddressCard address={addr} onEdit={handleEdit} />
            </div>
          ))}

          {/* Add address card — dashed border CTA */}
          <button
            onClick={handleAdd}
            aria-label="Add new address"
            className="
              flex flex-col items-center justify-center gap-2
              min-h-[140px] p-4
              border-2 border-dashed border-border rounded-xl
              text-muted-foreground hover:border-primary/40 hover:text-primary
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-1
              transition-colors
            "
          >
            <span className="text-2xl" aria-hidden="true">+</span>
            <span className="text-sm font-medium">Add Address</span>
          </button>
        </div>
      )}

      {/* Dialog */}
      <AddressFormDialog
        open={dialogOpen}
        editingAddress={editingAddr}
        onClose={handleClose}
      />
    </section>
  );
}
