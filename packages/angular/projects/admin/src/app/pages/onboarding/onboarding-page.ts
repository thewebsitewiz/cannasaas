import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import {
  ONBOARDING_PRESETS,
  type OnboardingData,
  OnboardingService,
  type StepKey,
  type StepStatus,
  TOTAL_STEPS,
} from './onboarding.service';

interface ProgressRow {
  readonly key: StepKey;
  readonly label: string;
  readonly status: StepStatus;
  readonly error?: string;
}

const STEPS = ['Dispensary Info', 'Products', 'Compliance', 'Payments', 'Theme', 'Done'] as const;

const PRODUCT_CATEGORIES = [
  'Flower',
  'Edible',
  'Concentrate',
  'Pre-Roll',
  'Topical',
  'Accessory',
] as const;

const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
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
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
] as const;

/**
 * New-dispensary onboarding wizard. 6 steps (Dispensary info →
 * Products → Compliance → Payments → Theme → Done), each persisted
 * to sessionStorage via `OnboardingService` so a refresh resumes
 * mid-flow.
 *
 * **Backend integration deferred.** The React reference calls four
 * mutations on launch (`createDispensary`, `saveCompliance`,
 * `savePaymentConfig`, `saveThemeConfig`) but the first three either
 * don't exist in the current schema or have diverged input shapes.
 * This port wires the full UX end-to-end; finalize() clears persisted
 * state and routes back to /. A follow-up story should align the
 * backend ops with the wizard's data shape and wire the launch
 * mutation chain.
 */
@Component({
  selector: 'cs-onboarding-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-(--color-bg) flex items-center justify-center p-4">
      <div class="w-full max-w-2xl">
        <!-- Progress -->
        <div class="mb-8">
          <div class="mb-2 flex items-center justify-between">
            <h2 class="text-lg font-bold text-(--color-text)">Setup your dispensary</h2>
            <span class="text-sm text-(--color-text-secondary)">
              Step {{ step() + 1 }} of {{ totalSteps }}
            </span>
          </div>
          <div class="h-2 w-full overflow-hidden rounded-full bg-(--color-surface)">
            <div
              class="h-full rounded-full bg-(--color-primary) transition-all"
              [style.width.%]="progressPercent()"
            ></div>
          </div>
          <ol class="mt-2 flex justify-between">
            @for (label of steps; track label; let i = $index) {
              <li
                class="text-[10px] font-medium"
                [class]="i <= step() ? 'text-(--color-primary)' : 'text-(--color-text-muted)'"
              >
                {{ label }}
              </li>
            }
          </ol>
        </div>

        <!-- Step content -->
        <div class="mb-6 rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          @switch (step()) {
            @case (0) {
              <div class="space-y-4">
                <h3 class="text-xl font-bold text-(--color-text)">Dispensary info</h3>
                <p class="text-sm text-(--color-text-secondary)">Tell us about your dispensary.</p>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-(--color-text)">
                    Dispensary name
                  </span>
                  <input
                    type="text"
                    [value]="data().name"
                    (input)="onField('name', $event)"
                    placeholder="Green Leaf Dispensary"
                    aria-label="Dispensary name"
                    class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text)"
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-(--color-text)"> Address </span>
                  <input
                    type="text"
                    [value]="data().address"
                    (input)="onField('address', $event)"
                    placeholder="123 Main St, Denver, CO 80202"
                    aria-label="Address"
                    class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text)"
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-(--color-text)">Phone</span>
                  <input
                    type="tel"
                    [value]="data().phone"
                    (input)="onField('phone', $event)"
                    placeholder="(555) 123-4567"
                    aria-label="Phone"
                    class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text)"
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-(--color-text)">
                    Operating hours
                  </span>
                  <input
                    type="text"
                    [value]="data().hours"
                    (input)="onField('hours', $event)"
                    placeholder="Mon-Sat 9am-9pm, Sun 10am-6pm"
                    aria-label="Operating hours"
                    class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text)"
                  />
                </label>
              </div>
            }

            @case (1) {
              <div class="space-y-4">
                <h3 class="text-xl font-bold text-(--color-text)">Products</h3>
                <p class="text-sm text-(--color-text-secondary)">
                  Add your initial product catalog. (Bulk CSV import lands in a follow-up.)
                </p>
                <div class="flex flex-wrap gap-2">
                  <input
                    type="text"
                    [value]="newProduct().name"
                    (input)="onNewProduct('name', $event)"
                    placeholder="Product name"
                    aria-label="New product name"
                    class="min-w-0 flex-1 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text)"
                  />
                  <select
                    [value]="newProduct().category"
                    (change)="onNewProduct('category', $event)"
                    aria-label="New product category"
                    class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text)"
                  >
                    @for (c of productCategories; track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                  <input
                    type="text"
                    [value]="newProduct().price"
                    (input)="onNewProduct('price', $event)"
                    placeholder="Price"
                    aria-label="New product price"
                    class="w-24 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text)"
                  />
                  <button
                    type="button"
                    (click)="onAddProduct()"
                    [disabled]="!newProduct().name || !newProduct().price"
                    class="rounded-lg bg-(--color-primary) px-3 py-2 text-sm font-medium text-white hover:bg-(--color-primary-hover) disabled:opacity-50"
                  >
                    + Add
                  </button>
                </div>
                @if (data().products.length > 0) {
                  <ul class="space-y-1">
                    @for (p of data().products; track $index) {
                      <li
                        class="flex items-center justify-between rounded-lg bg-(--color-bg) px-3 py-2 text-sm"
                      >
                        <span class="font-medium text-(--color-text)">{{ p.name }}</span>
                        <span class="text-(--color-text-secondary)">
                          {{ p.category }} — \${{ p.price }}
                        </span>
                      </li>
                    }
                  </ul>
                }
              </div>
            }

            @case (2) {
              <div class="space-y-4">
                <h3 class="text-xl font-bold text-(--color-text)">Compliance</h3>
                <p class="text-sm text-(--color-text-secondary)">
                  Configure state compliance and tracking integrations.
                </p>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-(--color-text)">State</span>
                  <select
                    [value]="data().state"
                    (change)="onField('state', $event)"
                    aria-label="State"
                    class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text)"
                  >
                    <option value="">Select state…</option>
                    @for (s of usStates; track s) {
                      <option [value]="s">{{ s }}</option>
                    }
                  </select>
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-(--color-text)">
                    License number
                  </span>
                  <input
                    type="text"
                    [value]="data().licenseNumber"
                    (input)="onField('licenseNumber', $event)"
                    placeholder="403R-00123"
                    aria-label="License number"
                    class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text)"
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-(--color-text)">
                    Metrc API key (optional)
                  </span>
                  <input
                    type="text"
                    [value]="data().metrcKey"
                    (input)="onField('metrcKey', $event)"
                    placeholder="Enter Metrc API key"
                    aria-label="Metrc API key"
                    class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text)"
                  />
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-(--color-text)">
                    BioTrack API key (optional)
                  </span>
                  <input
                    type="text"
                    [value]="data().biotrackKey"
                    (input)="onField('biotrackKey', $event)"
                    placeholder="Enter BioTrack API key"
                    aria-label="BioTrack API key"
                    class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text)"
                  />
                </label>
              </div>
            }

            @case (3) {
              <div class="space-y-4">
                <h3 class="text-xl font-bold text-(--color-text)">Payments</h3>
                <p class="text-sm text-(--color-text-secondary)">
                  Enable payment methods for your store.
                </p>
                <label
                  class="flex cursor-pointer items-center justify-between rounded-lg bg-(--color-bg) p-4"
                >
                  <div>
                    <p class="text-sm font-medium text-(--color-text)">Cash payments</p>
                    <p class="text-xs text-(--color-text-secondary)">Accept cash at pickup</p>
                  </div>
                  <input
                    type="checkbox"
                    [checked]="data().cashEnabled"
                    (change)="onBoolField('cashEnabled', $event)"
                    aria-label="Enable cash payments"
                    class="h-5 w-5 accent-(--color-primary)"
                  />
                </label>
                <label
                  class="flex cursor-pointer items-center justify-between rounded-lg bg-(--color-bg) p-4"
                >
                  <div>
                    <p class="text-sm font-medium text-(--color-text)">CanPay</p>
                    <p class="text-xs text-(--color-text-secondary)">
                      Cannabis-specific debit payments
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    [checked]="data().canPayEnabled"
                    (change)="onBoolField('canPayEnabled', $event)"
                    aria-label="Enable CanPay"
                    class="h-5 w-5 accent-(--color-primary)"
                  />
                </label>
              </div>
            }

            @case (4) {
              <div class="space-y-4">
                <h3 class="text-xl font-bold text-(--color-text)">Choose a theme</h3>
                <p class="text-sm text-(--color-text-secondary)">
                  Select a visual style for your storefront.
                </p>
                <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  @for (p of presets; track p.id) {
                    <li>
                      <button
                        type="button"
                        (click)="onSelectPreset(p.id)"
                        [attr.aria-pressed]="data().themePreset === p.id"
                        [attr.aria-label]="'Use preset ' + p.label"
                        class="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors"
                        [class]="
                          data().themePreset === p.id
                            ? 'border-(--color-primary) ring-2 ring-(--color-primary)/20 bg-(--color-bg)'
                            : 'border-(--color-border) hover:bg-(--color-surface-hover)'
                        "
                      >
                        <span class="flex shrink-0 gap-0.5" aria-hidden="true">
                          @for (sw of p.swatches; track $index) {
                            <span
                              class="block h-5 w-5 rounded border border-(--color-border)"
                              [style.background-color]="sw"
                            ></span>
                          }
                        </span>
                        <span class="min-w-0 flex-1">
                          <span class="block text-sm font-bold text-(--color-text)">
                            {{ p.label }}
                            @if (data().themePreset === p.id) {
                              <span class="ml-1 text-(--color-primary)">✓</span>
                            }
                          </span>
                          <span class="block truncate text-[11px] text-(--color-text-secondary)">
                            {{ p.description }}
                          </span>
                        </span>
                      </button>
                    </li>
                  }
                </ul>
              </div>
            }

            @case (5) {
              <div class="space-y-6 py-4 text-center">
                <p class="text-4xl" aria-hidden="true">🚀</p>
                <h3 class="text-2xl font-bold text-(--color-text)">You're all set!</h3>
                <p class="mx-auto max-w-md text-sm text-(--color-text-secondary)">
                  Review your setup below and launch your dispensary when ready.
                </p>
                <dl
                  class="space-y-2 rounded-lg bg-(--color-bg) p-4 text-left text-sm"
                  aria-label="Onboarding summary"
                >
                  <div class="flex justify-between">
                    <dt class="text-(--color-text-secondary)">Dispensary</dt>
                    <dd class="font-medium text-(--color-text)">
                      {{ data().name || '(not set)' }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-(--color-text-secondary)">Address</dt>
                    <dd class="font-medium text-(--color-text)">
                      {{ data().address || '(not set)' }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-(--color-text-secondary)">Phone</dt>
                    <dd class="font-medium text-(--color-text)">
                      {{ data().phone || '(not set)' }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-(--color-text-secondary)">Products</dt>
                    <dd class="font-medium text-(--color-text)">
                      {{ data().products.length }} added
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-(--color-text-secondary)">State</dt>
                    <dd class="font-medium text-(--color-text)">
                      {{ data().state || '(not set)' }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-(--color-text-secondary)">License</dt>
                    <dd class="font-medium text-(--color-text)">
                      {{ data().licenseNumber || '(not set)' }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-(--color-text-secondary)">Payments</dt>
                    <dd class="font-medium text-(--color-text)">
                      {{ paymentsLabel() }}
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-(--color-text-secondary)">Theme</dt>
                    <dd class="font-medium capitalize text-(--color-text)">
                      {{ data().themePreset }}
                    </dd>
                  </div>
                </dl>
                @if (showProgress()) {
                  <ul
                    class="space-y-1 rounded-lg border border-(--color-border) bg-(--color-bg) p-3 text-left text-sm"
                    aria-label="Launch progress"
                  >
                    @for (row of progressRows(); track row.key) {
                      <li class="flex items-start justify-between gap-2">
                        <span class="text-(--color-text-secondary)">{{ row.label }}</span>
                        <span class="flex-1" aria-hidden="true"></span>
                        <span
                          [class]="statusClass(row.status)"
                          [attr.aria-label]="row.label + ' ' + row.status"
                        >
                          {{ statusGlyph(row.status) }}
                        </span>
                      </li>
                      @if (row.error) {
                        <li
                          class="ml-1 text-xs text-rose-600"
                          [attr.aria-label]="row.label + ' error'"
                        >
                          {{ row.error }}
                        </li>
                      }
                    }
                  </ul>
                }
                <button
                  type="button"
                  (click)="onLaunch()"
                  [disabled]="launching()"
                  class="rounded-xl bg-(--color-primary) px-8 py-3 text-lg font-bold text-white hover:bg-(--color-primary-hover) disabled:opacity-50"
                  [attr.aria-label]="hasFinalizeFailure() ? 'Retry launch' : 'Launch your store'"
                >
                  @if (launching()) {
                    Launching…
                  } @else if (hasFinalizeFailure()) {
                    Retry launch
                  } @else {
                    Launch your store
                  }
                </button>
              </div>
            }
          }
        </div>

        <!-- Nav buttons -->
        @if (step() < totalSteps - 1) {
          <div class="flex justify-between">
            <button
              type="button"
              (click)="onBack()"
              [disabled]="step() === 0"
              class="rounded-lg px-4 py-2 text-sm font-medium text-(--color-text-secondary) hover:text-(--color-text) disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Back"
            >
              ← Back
            </button>
            <button
              type="button"
              (click)="onNext()"
              class="rounded-lg bg-(--color-primary) px-6 py-2 text-sm font-bold text-white hover:bg-(--color-primary-hover)"
              aria-label="Next"
            >
              Next →
            </button>
          </div>
        } @else {
          <div class="flex justify-start">
            <button
              type="button"
              (click)="onBack()"
              class="rounded-lg px-4 py-2 text-sm font-medium text-(--color-text-secondary) hover:text-(--color-text)"
              aria-label="Back"
            >
              ← Back
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class OnboardingPage {
  private readonly svc = inject(OnboardingService);
  private readonly router = inject(Router);

  protected readonly steps = STEPS;
  protected readonly totalSteps = TOTAL_STEPS;
  protected readonly productCategories = PRODUCT_CATEGORIES;
  protected readonly usStates = US_STATES;
  protected readonly presets = ONBOARDING_PRESETS;

  protected readonly step = this.svc.step;
  protected readonly data = this.svc.data;
  protected readonly progressPercent = this.svc.progressPercent;

  protected readonly launching = signal<boolean>(false);
  protected readonly finalizeProgress = this.svc.finalizeProgress;

  protected readonly progressRows = computed<readonly ProgressRow[]>(() => {
    const p = this.finalizeProgress();
    return [
      {
        key: 'dispensary',
        label: 'Dispensary info',
        status: p.dispensary,
        error: p.errors.dispensary,
      },
      { key: 'products', label: 'Products', status: p.products, error: p.errors.products },
      { key: 'compliance', label: 'Compliance', status: p.compliance, error: p.errors.compliance },
      { key: 'payments', label: 'Payments', status: p.payments, error: p.errors.payments },
      { key: 'theme', label: 'Theme', status: p.theme, error: p.errors.theme },
    ];
  });

  protected readonly showProgress = computed(() =>
    this.progressRows().some((r) => r.status !== 'idle'),
  );

  protected readonly hasFinalizeFailure = computed(() =>
    this.progressRows().some((r) => r.status === 'failed'),
  );

  protected readonly newProduct = signal({
    name: '',
    category: PRODUCT_CATEGORIES[0],
    price: '',
  });

  protected onField(key: keyof OnboardingData, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.svc.update(key, value as never);
  }

  protected onBoolField(key: keyof OnboardingData, event: Event): void {
    const value = (event.target as HTMLInputElement).checked;
    this.svc.update(key, value as never);
  }

  protected onNewProduct(field: 'name' | 'category' | 'price', event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.newProduct.update((prev) => ({ ...prev, [field]: value }));
  }

  protected onAddProduct(): void {
    const p = this.newProduct();
    this.svc.addProduct({ name: p.name, category: p.category, price: p.price });
    this.newProduct.set({ name: '', category: PRODUCT_CATEGORIES[0], price: '' });
  }

  protected onSelectPreset(id: string): void {
    this.svc.update('themePreset', id);
  }

  protected onBack(): void {
    this.svc.back();
  }

  protected onNext(): void {
    this.svc.next();
  }

  protected async onLaunch(): Promise<void> {
    this.launching.set(true);
    try {
      const result = await this.svc.finalize();
      if (result.ok) {
        await this.router.navigateByUrl('/');
      }
      // On failure, stay on the page — the progress UI surfaces what
      // went wrong and the button label flips to "Retry launch".
    } finally {
      this.launching.set(false);
    }
  }

  protected paymentsLabel(): string {
    const labels: string[] = [];
    if (this.data().cashEnabled) labels.push('Cash');
    if (this.data().canPayEnabled) labels.push('CanPay');
    return labels.length > 0 ? labels.join(', ') : 'None';
  }

  protected statusClass(status: StepStatus): string {
    switch (status) {
      case 'ok':
        return 'text-emerald-500';
      case 'failed':
        return 'text-rose-500';
      case 'in_flight':
        return 'text-(--color-primary)';
      default:
        return 'text-(--color-text-muted)';
    }
  }

  protected statusGlyph(status: StepStatus): string {
    switch (status) {
      case 'ok':
        return '✓';
      case 'failed':
        return '✗';
      case 'in_flight':
        return '…';
      default:
        return '·';
    }
  }
}
