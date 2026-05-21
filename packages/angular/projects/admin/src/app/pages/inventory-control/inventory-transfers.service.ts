import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  ApproveTransferGQL,
  InventoryTransfersGQL,
  type InventoryTransfersQuery,
  ShipTransferGQL,
  TransferItemsGQL,
  type TransferItemsQuery,
} from '@cannasaas/ui-ng';
import { firstValueFrom, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type InventoryTransfer = InventoryTransfersQuery['inventoryTransfers'][number];
export type InventoryTransferItem = TransferItemsQuery['transferItems'][number];
export type TransferDirection = 'all' | 'incoming' | 'outgoing';

/**
 * Wraps the transfer queries + approve / ship mutations for the
 * Transfers tab. `expand(transferId)` lazily loads transfer items.
 * Each mutation bumps the reload counter so the list refetches.
 */
@Injectable({ providedIn: 'root' })
export class InventoryTransfersService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _direction = signal<TransferDirection>('all');
  private readonly _reload = signal<number>(0);
  private readonly _expandedId = signal<string | null>(null);
  private readonly _mutatingId = signal<string | null>(null);

  readonly direction = this._direction.asReadonly();
  readonly expandedId = this._expandedId.asReadonly();
  readonly mutatingId = this._mutatingId.asReadonly();

  setDirection(direction: TransferDirection): void {
    this._direction.set(direction);
    this._expandedId.set(null);
  }

  toggleExpanded(transferId: string): void {
    this._expandedId.update((current) => (current === transferId ? null : transferId));
  }

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  async approve(transferId: string): Promise<void> {
    this._mutatingId.set(transferId);
    try {
      const gql = this.injector.get(ApproveTransferGQL);
      await firstValueFrom(gql.mutate({ variables: { transferId } }));
      this.reload();
    } finally {
      this._mutatingId.set(null);
    }
  }

  async ship(transferId: string): Promise<void> {
    this._mutatingId.set(transferId);
    try {
      const gql = this.injector.get(ShipTransferGQL);
      await firstValueFrom(gql.mutate({ variables: { transferId } }));
      this.reload();
    } finally {
      this._mutatingId.set(null);
    }
  }

  readonly transfersResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      direction: this._direction(),
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(InventoryTransfersGQL);
      return gql
        .fetch({
          variables: {
            dispensaryId: params.dispensaryId,
            direction: params.direction === 'all' ? null : params.direction,
          },
        })
        .pipe(map((r) => r.data?.inventoryTransfers ?? []));
    },
  });

  readonly transfers = computed<readonly InventoryTransfer[]>(
    () => this.transfersResource.value() ?? [],
  );
  readonly isLoading = this.transfersResource.isLoading;
  readonly error = this.transfersResource.error;

  readonly itemsResource = rxResource({
    params: () => ({ transferId: this._expandedId() }),
    stream: ({ params }) => {
      if (!params.transferId) {
        return of<readonly InventoryTransferItem[]>([]);
      }
      const gql = this.injector.get(TransferItemsGQL);
      return gql
        .fetch({ variables: { transferId: params.transferId } })
        .pipe(map((r): readonly InventoryTransferItem[] => r.data?.transferItems ?? []));
    },
  });

  readonly expandedItems = computed<readonly InventoryTransferItem[]>(() => {
    const items = this.itemsResource.value();
    return items ?? ([] as readonly InventoryTransferItem[]);
  });
  readonly itemsLoading = this.itemsResource.isLoading;
}
