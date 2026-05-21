import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  InventoryTransfersGQL,
  type InventoryTransfersQuery,
  type ReceiveItemInput,
  ReceiveTransferGQL,
  TransferItemsGQL,
  type TransferItemsQuery,
} from '@cannasaas/ui-ng';
import { firstValueFrom, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

type Transfer = InventoryTransfersQuery['inventoryTransfers'][number];
type TransferItem = TransferItemsQuery['transferItems'][number];

export type IncomingTransfer = Transfer;
export type IncomingTransferItem = TransferItem;

/**
 * Drives the Receiving tab. Lists incoming transfers awaiting receipt
 * (`status in (shipped, in_transit)`), exposes per-transfer items on
 * expand, and submits `receiveTransfer` with the actual counted
 * quantities — backend reconciles inventory + writes any variance
 * adjustment as a side-effect of the mutation.
 *
 * Receipt isn't role-gated here: any signed-in admin role can record
 * what arrived at their dispensary. (Approvals on the outbound side
 * are still org_admin / super_admin only — see sc-649.)
 */
@Injectable({ providedIn: 'root' })
export class InventoryReceivingService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _reload = signal<number>(0);
  private readonly _expandedId = signal<string | null>(null);
  private readonly _submittingId = signal<string | null>(null);

  readonly expandedId = this._expandedId.asReadonly();
  readonly submittingId = this._submittingId.asReadonly();

  toggleExpanded(transferId: string): void {
    this._expandedId.update((current) => (current === transferId ? null : transferId));
  }

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  async receive(transferId: string, items: readonly ReceiveItemInput[]): Promise<void> {
    this._submittingId.set(transferId);
    try {
      const gql = this.injector.get(ReceiveTransferGQL);
      await firstValueFrom(
        gql.mutate({ variables: { transferId, items: items as ReceiveItemInput[] } }),
      );
      this._expandedId.set(null);
      this.reload();
    } finally {
      this._submittingId.set(null);
    }
  }

  readonly transfersResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(InventoryTransfersGQL);
      return gql
        .fetch({
          variables: { dispensaryId: params.dispensaryId, direction: 'incoming' },
        })
        .pipe(
          map((r): readonly IncomingTransfer[] => {
            const all = r.data?.inventoryTransfers ?? [];
            return all.filter((t) => t.status === 'shipped' || t.status === 'in_transit');
          }),
        );
    },
  });

  readonly transfers = computed<readonly IncomingTransfer[]>(
    () => this.transfersResource.value() ?? [],
  );
  readonly isLoading = this.transfersResource.isLoading;
  readonly error = this.transfersResource.error;

  readonly itemsResource = rxResource({
    params: () => ({ transferId: this._expandedId() }),
    stream: ({ params }) => {
      if (!params.transferId) {
        return of<readonly IncomingTransferItem[]>([]);
      }
      const gql = this.injector.get(TransferItemsGQL);
      return gql
        .fetch({ variables: { transferId: params.transferId } })
        .pipe(map((r): readonly IncomingTransferItem[] => r.data?.transferItems ?? []));
    },
  });

  readonly expandedItems = computed<readonly IncomingTransferItem[]>(() => {
    return this.itemsResource.value() ?? ([] as readonly IncomingTransferItem[]);
  });
  readonly itemsLoading = this.itemsResource.isLoading;
}
