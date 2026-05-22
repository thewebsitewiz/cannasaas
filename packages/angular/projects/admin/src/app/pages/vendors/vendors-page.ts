import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { VendorsService } from './vendors.service';

interface CreateFormControls {
  readonly name: FormControl<string>;
  readonly vendorType: FormControl<string>;
  readonly state: FormControl<string>;
  readonly email: FormControl<string>;
  readonly phone: FormControl<string>;
  readonly paymentTerms: FormControl<string>;
  readonly contactName: FormControl<string>;
  readonly contactTitle: FormControl<string>;
}

const VENDOR_TYPES = [
  { value: 'cultivator', label: 'Cultivator' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'packaging', label: 'Packaging' },
];

const PAYMENT_TERMS = [
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_45', label: 'Net 45' },
];

const STATE_CODES = [
  'AK',
  'AL',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'HI',
  'IL',
  'KY',
  'LA',
  'MA',
  'MD',
  'ME',
  'MI',
  'MN',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SD',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
];

/**
 * Vendor management admin view. Mirrors React parity:
 * - 5 KPI cards (active vendors, total POs, open POs, total spend,
 *   outstanding).
 * - Toggleable create form (typed Reactive Forms).
 * - Vendor table with type badge, license, contact, payment terms,
 *   rating, PO count, total spend.
 * - Toggleable purchase-orders list (lazy-loaded, dispensary-scoped).
 *
 * Filed scope mentioned Metrc license validation + edit/archive flows
 * + per-vendor product-count link to ProductsPage. None of those
 * exist in the React admin and `validateMetrcLicense` isn't in the
 * schema — file follow-ups if/when those workflows are needed.
 */
@Component({
  selector: 'cs-vendors-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-(--color-text)">Vendor management</h1>
        <div class="flex gap-2">
          <button
            type="button"
            (click)="togglePOs()"
            class="rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-2 text-sm font-medium text-(--color-text-secondary) hover:text-(--color-text)"
          >
            {{ showPOs() ? 'Hide POs' : 'Show POs' }}
          </button>
          <button
            type="button"
            (click)="toggleCreate()"
            class="rounded-lg bg-(--color-primary) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-primary-hover)"
          >
            {{ showCreate() ? 'Cancel' : '+ New vendor' }}
          </button>
        </div>
      </header>

      @if (loading()) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          Loading vendors…
        </p>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load vendors</h2>
          <p class="mt-1 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else {
        @if (stats(); as s) {
          <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
            <article
              class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
            >
              <p class="text-xl font-bold text-(--color-text) tabular-nums">
                {{ s.activeVendors }}
              </p>
              <p class="text-xs text-(--color-text-secondary)">Active vendors</p>
            </article>
            <article
              class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
            >
              <p class="text-xl font-bold text-(--color-text) tabular-nums">
                {{ s.totalPOs }}
              </p>
              <p class="text-xs text-(--color-text-secondary)">Total POs</p>
            </article>
            <article
              class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
            >
              <p class="text-xl font-bold text-amber-500 tabular-nums">{{ s.openPOs }}</p>
              <p class="text-xs text-(--color-text-secondary)">Open POs</p>
            </article>
            <article
              class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
            >
              <p class="text-xl font-bold text-(--color-text) tabular-nums">
                {{ formatMoney(s.totalSpend) }}
              </p>
              <p class="text-xs text-(--color-text-secondary)">Total spend</p>
            </article>
            <article
              class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
            >
              <p class="text-xl font-bold text-rose-500 tabular-nums">
                {{ formatMoney(s.outstanding) }}
              </p>
              <p class="text-xs text-(--color-text-secondary)">Outstanding</p>
            </article>
          </div>
        }

        @if (showCreate()) {
          <form
            [formGroup]="createForm"
            (ngSubmit)="onSubmit()"
            class="space-y-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-6"
            aria-label="Create vendor"
          >
            <h2 class="text-lg font-semibold text-(--color-text)">New vendor</h2>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                type="text"
                formControlName="name"
                placeholder="Vendor name *"
                aria-label="Vendor name"
                class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              />
              <select
                formControlName="vendorType"
                aria-label="Vendor type"
                class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              >
                @for (t of vendorTypes; track t.value) {
                  <option [value]="t.value">{{ t.label }}</option>
                }
              </select>
              <input
                type="email"
                formControlName="email"
                placeholder="Email"
                aria-label="Vendor email"
                class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              />
              <input
                type="text"
                formControlName="phone"
                placeholder="Phone"
                aria-label="Vendor phone"
                class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              />
              <select
                formControlName="state"
                aria-label="State"
                class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              >
                @for (s of stateCodes; track s) {
                  <option [value]="s">{{ s }}</option>
                }
              </select>
              <select
                formControlName="paymentTerms"
                aria-label="Payment terms"
                class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              >
                @for (p of paymentTerms; track p.value) {
                  <option [value]="p.value">{{ p.label }}</option>
                }
              </select>
              <input
                type="text"
                formControlName="contactName"
                placeholder="Primary contact name"
                aria-label="Contact name"
                class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              />
              <input
                type="text"
                formControlName="contactTitle"
                placeholder="Contact title"
                aria-label="Contact title"
                class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              />
            </div>
            <button
              type="submit"
              [disabled]="createForm.invalid || saving()"
              class="rounded-lg bg-(--color-primary) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-primary-hover) disabled:opacity-50"
            >
              @if (saving()) {
                Saving…
              } @else {
                Create vendor
              }
            </button>
          </form>
        }

        <!-- Vendor table -->
        <div class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)">
          @if (vendors().length === 0) {
            <p class="p-12 text-center text-sm text-(--color-text-muted)">No vendors yet.</p>
          } @else {
            <table class="w-full text-sm">
              <thead class="border-b border-(--color-border) bg-(--color-bg)">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-(--color-text-secondary)">
                    Vendor
                  </th>
                  <th class="px-4 py-3 text-center font-medium text-(--color-text-secondary)">
                    Type
                  </th>
                  <th class="px-4 py-3 text-left font-medium text-(--color-text-secondary)">
                    License
                  </th>
                  <th class="px-4 py-3 text-left font-medium text-(--color-text-secondary)">
                    Contact
                  </th>
                  <th class="px-4 py-3 text-center font-medium text-(--color-text-secondary)">
                    Terms
                  </th>
                  <th class="px-4 py-3 text-center font-medium text-(--color-text-secondary)">
                    Rating
                  </th>
                  <th class="px-4 py-3 text-right font-medium text-(--color-text-secondary)">
                    POs
                  </th>
                  <th class="px-4 py-3 text-right font-medium text-(--color-text-secondary)">
                    Total spend
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-(--color-border)">
                @for (v of vendors(); track v.vendor_id) {
                  <tr class="hover:bg-(--color-surface-hover)">
                    <td class="px-4 py-3 font-medium text-(--color-text)">{{ v.name }}</td>
                    <td class="px-4 py-3 text-center">
                      <span
                        class="rounded-full px-2 py-0.5 text-xs font-medium"
                        [class]="typeBadgeClass(v.vendor_type)"
                      >
                        {{ v.vendor_type }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-xs text-(--color-text-secondary)">
                      {{ v.license_number ?? '—' }}
                    </td>
                    <td class="px-4 py-3 text-xs text-(--color-text-muted)">
                      {{ v.email ?? '—' }}
                    </td>
                    <td class="px-4 py-3 text-center text-xs text-(--color-text-secondary)">
                      {{ termsLabel(v.payment_terms) }}
                    </td>
                    <td class="px-4 py-3 text-center text-xs">
                      @if (v.rating != null) {
                        <span class="text-amber-500">★ {{ v.rating.toFixed(1) }}</span>
                      } @else {
                        —
                      }
                    </td>
                    <td class="px-4 py-3 text-right tabular-nums text-(--color-text)">
                      {{ v.total_pos ?? 0 }}
                    </td>
                    <td class="px-4 py-3 text-right font-medium tabular-nums text-(--color-text)">
                      {{ formatMoney(v.total_spend ?? 0) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        @if (showPOs()) {
          <div
            class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)"
          >
            <header
              class="border-b border-(--color-border) bg-(--color-bg) px-4 py-3 font-semibold text-(--color-text)"
            >
              Purchase orders
            </header>
            @if (purchaseOrdersLoading()) {
              <p class="p-6 text-center text-sm text-(--color-text-muted)">Loading POs…</p>
            } @else if (purchaseOrders().length === 0) {
              <p class="p-6 text-center text-sm text-(--color-text-muted)">
                No purchase orders yet.
              </p>
            } @else {
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-(--color-text-secondary)">
                    <th class="px-4 py-2 text-left">PO #</th>
                    <th class="px-4 py-2 text-left">Vendor</th>
                    <th class="px-4 py-2 text-center">Status</th>
                    <th class="px-4 py-2 text-right">Total</th>
                    <th class="px-4 py-2 text-center">Payment</th>
                    <th class="px-4 py-2 text-right">Items</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-(--color-border)">
                  @for (po of purchaseOrders(); track po.po_id) {
                    <tr>
                      <td class="px-4 py-2 font-mono text-xs text-(--color-text)">
                        {{ po.po_number }}
                      </td>
                      <td class="px-4 py-2 text-(--color-text)">{{ po.vendor_name ?? '—' }}</td>
                      <td class="px-4 py-2 text-center">
                        <span
                          class="rounded-full bg-(--color-surface-hover) px-2 py-0.5 text-xs text-(--color-text-secondary)"
                        >
                          {{ po.status }}
                        </span>
                      </td>
                      <td class="px-4 py-2 text-right tabular-nums text-(--color-text)">
                        {{ formatMoney(po.total) }}
                      </td>
                      <td class="px-4 py-2 text-center">
                        <span
                          class="text-xs"
                          [class]="
                            po.payment_status === 'paid' ? 'text-emerald-500' : 'text-amber-500'
                          "
                        >
                          {{ po.payment_status }}
                        </span>
                      </td>
                      <td class="px-4 py-2 text-right tabular-nums text-(--color-text-secondary)">
                        {{ po.line_items }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }
      }
    </section>
  `,
})
export class VendorsPage {
  private readonly svc = inject(VendorsService);

  protected readonly vendorTypes = VENDOR_TYPES;
  protected readonly paymentTerms = PAYMENT_TERMS;
  protected readonly stateCodes = STATE_CODES;

  protected readonly vendors = this.svc.vendors;
  protected readonly stats = this.svc.stats;
  protected readonly loading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly saving = this.svc.saving;
  protected readonly showPOs = this.svc.showPurchaseOrders;
  protected readonly purchaseOrders = this.svc.purchaseOrders;
  protected readonly purchaseOrdersLoading = this.svc.purchaseOrdersLoading;

  protected readonly showCreate = signal<boolean>(false);

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load vendors.';
  });

  /* eslint-disable @typescript-eslint/unbound-method --
   * Validators.* are pure functions; the rule's `this:void` warning
   * is a false positive for these references.
   */
  protected readonly createForm = new FormGroup<CreateFormControls>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    vendorType: new FormControl('cultivator', { nonNullable: true }),
    state: new FormControl('NY', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    paymentTerms: new FormControl('net_30', { nonNullable: true }),
    contactName: new FormControl('', { nonNullable: true }),
    contactTitle: new FormControl('', { nonNullable: true }),
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  protected toggleCreate(): void {
    this.showCreate.update((v) => !v);
  }

  protected togglePOs(): void {
    this.svc.togglePurchaseOrders();
  }

  protected async onSubmit(): Promise<void> {
    if (this.createForm.invalid) return;
    const v = this.createForm.getRawValue();
    await this.svc.create({
      name: v.name,
      vendorType: v.vendorType,
      state: v.state || null,
      email: v.email || null,
      phone: v.phone || null,
      paymentTerms: v.paymentTerms || null,
      contactName: v.contactName || null,
      contactTitle: v.contactTitle || null,
    });
    this.createForm.reset({
      name: '',
      vendorType: 'cultivator',
      state: 'NY',
      email: '',
      phone: '',
      paymentTerms: 'net_30',
      contactName: '',
      contactTitle: '',
    });
    this.showCreate.set(false);
  }

  protected typeBadgeClass(type: string): string {
    switch (type) {
      case 'cultivator':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'manufacturer':
        return 'bg-sky-500/10 text-sky-500';
      case 'distributor':
        return 'bg-purple-500/10 text-purple-500';
      case 'packaging':
        return 'bg-amber-500/10 text-amber-500';
      default:
        return 'bg-(--color-surface-hover) text-(--color-text-secondary)';
    }
  }

  protected termsLabel(terms: string | null | undefined): string {
    return terms ? terms.replace(/_/g, ' ') : '—';
  }

  protected formatMoney(value: number): string {
    return (
      '$' +
      value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  }
}
