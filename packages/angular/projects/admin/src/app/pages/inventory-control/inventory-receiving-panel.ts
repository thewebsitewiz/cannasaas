import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { type ReceiveItemInput } from '@cannasaas/ui-ng';

import {
  type IncomingTransfer,
  type IncomingTransferItem,
  InventoryReceivingService,
} from './inventory-receiving.service';

interface ReceiveRowControls {
  readonly itemId: FormControl<string>;
  readonly expected: FormControl<number>;
  readonly received: FormControl<number>;
  readonly notes: FormControl<string>;
}

/**
 * Receiving tab — lists incoming transfers awaiting receipt, lets the
 * admin record actual quantities (with optional notes per line), and
 * submits a single `receiveTransfer` mutation. Backend reconciles the
 * variance into stock adjustments as a side-effect.
 */
@Component({
  selector: 'cs-inventory-receiving-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-4">
      @if (isLoading()) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          Loading incoming transfers…
        </p>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load transfers</h2>
          <p class="mt-1 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else if (transfers().length === 0) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          No incoming transfers awaiting receipt.
        </p>
      } @else {
        <ul class="space-y-3">
          @for (t of transfers(); track t.transferId) {
            <li
              class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)"
            >
              <button
                type="button"
                (click)="onToggle(t)"
                class="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-(--color-surface-hover)"
                [attr.aria-expanded]="expandedId() === t.transferId"
              >
                <div>
                  <p class="text-sm font-medium text-(--color-text)">
                    From {{ t.fromDispensaryId }}
                  </p>
                  <p class="mt-1 text-xs text-(--color-text-muted)">
                    Shipped: {{ formatDate(t.shippedAt) }} · Status: {{ t.status }}
                  </p>
                </div>
                <span class="text-xs text-(--color-primary)">
                  {{ expandedId() === t.transferId ? 'Hide form' : 'Record receipt' }}
                </span>
              </button>

              @if (expandedId() === t.transferId) {
                <div class="border-t border-(--color-border) bg-(--color-bg) p-6">
                  @if (itemsLoading()) {
                    <p class="text-xs text-(--color-text-muted)">Loading items…</p>
                  } @else if (form(); as f) {
                    <form [formGroup]="f" (ngSubmit)="onSubmit(t.transferId)">
                      <table class="w-full text-sm">
                        <thead>
                          <tr class="text-left text-xs text-(--color-text-secondary)">
                            <th class="py-2">Product</th>
                            <th class="py-2 text-right">Expected</th>
                            <th class="py-2 text-right">Received</th>
                            <th class="py-2 text-left">Notes</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-(--color-border)">
                          @for (
                            row of rowArray.controls;
                            track row.controls.itemId.value;
                            let i = $index
                          ) {
                            <tr [formGroup]="row">
                              <td class="py-2 text-(--color-text)">
                                {{ items()[i].productName }}
                                <span class="text-xs text-(--color-text-muted)">
                                  · {{ items()[i].variantName ?? '' }}
                                </span>
                              </td>
                              <td
                                class="py-2 text-right tabular-nums text-(--color-text-secondary)"
                              >
                                {{ row.controls.expected.value }}
                              </td>
                              <td class="py-2 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  formControlName="received"
                                  class="w-20 rounded border border-(--color-border) bg-(--color-surface) px-2 py-1 text-right text-sm text-(--color-text)"
                                  [attr.aria-label]="
                                    'Received quantity for ' + items()[i].productName
                                  "
                                />
                                @if (row.controls.received.value !== row.controls.expected.value) {
                                  <span
                                    class="ml-2 text-xs"
                                    [class]="
                                      row.controls.received.value < row.controls.expected.value
                                        ? 'text-rose-500'
                                        : 'text-amber-500'
                                    "
                                  >
                                    Δ
                                    {{ row.controls.received.value - row.controls.expected.value }}
                                  </span>
                                }
                              </td>
                              <td class="py-2">
                                <input
                                  type="text"
                                  formControlName="notes"
                                  placeholder="Optional"
                                  class="w-full rounded border border-(--color-border) bg-(--color-surface) px-2 py-1 text-sm text-(--color-text)"
                                  [attr.aria-label]="'Notes for ' + items()[i].productName"
                                />
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                      <div class="mt-4 flex items-center justify-end gap-2">
                        @if (hasVariance()) {
                          <span class="mr-auto text-xs text-amber-500">
                            Variance detected — backend will record adjustments.
                          </span>
                        }
                        <button
                          type="submit"
                          [disabled]="f.invalid || submittingId() === t.transferId"
                          class="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                          @if (submittingId() === t.transferId) {
                            Recording…
                          } @else {
                            Record receipt
                          }
                        </button>
                      </div>
                    </form>
                  }
                </div>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class InventoryReceivingPanel {
  private readonly svc = inject(InventoryReceivingService);

  protected readonly transfers = this.svc.transfers;
  protected readonly isLoading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly expandedId = this.svc.expandedId;
  protected readonly items = this.svc.expandedItems;
  protected readonly itemsLoading = this.svc.itemsLoading;
  protected readonly submittingId = this.svc.submittingId;

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load incoming transfers.';
  });

  /** Form is rebuilt every time the expanded transfer's items resolve. */
  protected readonly form = computed<FormGroup<{
    rows: FormArray<FormGroup<ReceiveRowControls>>;
  }> | null>(() => {
    if (!this.expandedId() || this.itemsLoading()) return null;
    const items = this.items();
    if (items.length === 0) return null;
    const rows = items.map((item) => makeRow(item));
    return new FormGroup({ rows: new FormArray(rows) });
  });

  protected get rowArray(): FormArray<FormGroup<ReceiveRowControls>> {
    return this.form()!.controls.rows;
  }

  /**
   * Plain method (not a `computed`) so it re-runs on every change
   * detection cycle — FormGroup value changes don't notify signals,
   * but they do mark the OnPush view dirty via Angular Forms.
   */
  protected hasVariance(): boolean {
    const f = this.form();
    if (!f) return false;
    return f.controls.rows.controls.some(
      (row) => row.controls.received.value !== row.controls.expected.value,
    );
  }

  protected onToggle(t: IncomingTransfer): void {
    this.svc.toggleExpanded(t.transferId);
  }

  protected onSubmit(transferId: string): void {
    const f = this.form();
    if (!f || f.invalid) return;
    const payload: ReceiveItemInput[] = f.controls.rows.controls.map((row) => ({
      itemId: row.controls.itemId.value,
      quantityReceived: row.controls.received.value,
      notes: row.controls.notes.value || null,
    }));
    void this.svc.receive(transferId, payload);
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  }
}

/* eslint-disable @typescript-eslint/unbound-method --
 * Angular's reactive-forms API expects raw `Validators.*` references; the
 * `unbound-method` rule's `this:void` warning is a false positive for these
 * pure-function validator references.
 */
function makeRow(item: IncomingTransferItem): FormGroup<ReceiveRowControls> {
  const expected = item.quantityShipped ?? item.quantityRequested;
  return new FormGroup<ReceiveRowControls>({
    itemId: new FormControl(item.itemId, { nonNullable: true }),
    expected: new FormControl(expected, { nonNullable: true }),
    received: new FormControl(expected, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    notes: new FormControl('', { nonNullable: true }),
  });
}
/* eslint-enable @typescript-eslint/unbound-method */
