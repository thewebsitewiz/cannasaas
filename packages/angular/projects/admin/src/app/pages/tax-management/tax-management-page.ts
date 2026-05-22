import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { TaxRulesService, type TaxRule } from './tax-rules.service';

const TAX_BASIS_OPTIONS = [
  { value: 'retail_price', label: 'Retail price (%)' },
  { value: 'per_mg_thc', label: 'Per mg THC ($)' },
  { value: 'wholesale_price', label: 'Wholesale price (%)' },
];

interface AddFormControls {
  readonly state: FormControl<string>;
  readonly code: FormControl<string>;
  readonly name: FormControl<string>;
  readonly rate: FormControl<string>;
  readonly taxBasis: FormControl<string>;
  readonly statutoryReference: FormControl<string>;
}

interface EditFormControls {
  readonly name: FormControl<string>;
  readonly rate: FormControl<string>;
}

interface RuleGroup {
  readonly state: string;
  readonly rules: readonly TaxRule[];
  readonly combinedPercentLabel: string;
}

/**
 * Super_admin-only Tax Management. Lists all platform tax rules
 * grouped by state, allows adding a new rule (state / code / name /
 * rate / basis / optional statutory reference), inline-edit of name
 * + rate, and toggling `is_active`. Route is gated by
 * `roleGuard('super_admin')` (sc-622 factory) — the sidebar already
 * filters the Tax Rules item to super_admin (sc-623), so this is
 * defense-in-depth.
 */
@Component({
  selector: 'cs-tax-management-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      @if (toast(); as msg) {
        <div
          class="fixed right-6 top-6 z-50 rounded-lg bg-(--color-primary) px-4 py-2 text-sm text-white shadow-lg"
          role="status"
        >
          {{ msg }}
        </div>
      }

      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-(--color-text)">Tax management</h1>
          <p class="mt-1 text-sm text-(--color-text-muted)">
            {{ rules().length }} rules across {{ states().length }} states
          </p>
        </div>
        <button
          type="button"
          (click)="toggleAddForm()"
          class="rounded-lg bg-(--color-primary) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-primary-hover)"
        >
          {{ showAddForm() ? 'Cancel' : '+ Add tax rule' }}
        </button>
      </header>

      @if (showAddForm()) {
        <form
          [formGroup]="addForm"
          (ngSubmit)="onSubmitAdd()"
          class="space-y-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-6"
          aria-label="Add tax rule"
        >
          <h2 class="text-lg font-semibold text-(--color-text)">New tax rule</h2>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                State code
              </span>
              <input
                type="text"
                formControlName="state"
                maxlength="2"
                placeholder="e.g. NY"
                class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm uppercase text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                Code
              </span>
              <input
                type="text"
                formControlName="code"
                placeholder="e.g. NY_RETAIL_EXCISE"
                class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm uppercase text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                Tax basis
              </span>
              <select
                formControlName="taxBasis"
                class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              >
                @for (o of taxBasisOptions; track o.value) {
                  <option [value]="o.value">{{ o.label }}</option>
                }
              </select>
            </label>

            <label class="block md:col-span-2">
              <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                Display name
              </span>
              <input
                type="text"
                formControlName="name"
                placeholder="e.g. NY Retail Cannabis Excise (9%)"
                class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                Rate
                @if (addForm.controls.taxBasis.value === 'per_mg_thc') {
                  ($/mg)
                } @else {
                  (decimal, e.g. 0.09 = 9%)
                }
              </span>
              <input
                type="number"
                step="any"
                formControlName="rate"
                [attr.placeholder]="
                  addForm.controls.taxBasis.value === 'per_mg_thc' ? '0.005' : '0.09'
                "
                class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              />
            </label>

            <label class="block md:col-span-3">
              <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                Statutory reference (optional)
              </span>
              <input
                type="text"
                formControlName="statutoryReference"
                placeholder="e.g. NY Cannabis Law § 130(2)"
                class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              />
            </label>
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              [disabled]="addForm.invalid || saving()"
              class="rounded-lg bg-(--color-primary) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-primary-hover) disabled:opacity-50"
            >
              @if (saving()) {
                Saving…
              } @else {
                Save rule
              }
            </button>
          </div>
        </form>
      }

      <div class="flex items-center gap-3">
        <select
          [value]="stateFilter()"
          (change)="onStateFilterChange($event)"
          aria-label="Filter by state"
          class="cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text) focus:outline-none"
        >
          <option value="">All states ({{ rules().length }})</option>
          @for (s of states(); track s) {
            <option [value]="s">{{ s }} ({{ ruleCountForState(s) }})</option>
          }
        </select>
        @if (stateFilter()) {
          <button
            type="button"
            (click)="clearStateFilter()"
            class="rounded-full border border-(--color-border) px-3 py-1.5 text-xs text-(--color-text-muted) hover:text-(--color-text)"
          >
            Clear filter
          </button>
        }
      </div>

      @if (isLoading()) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          Loading tax rules…
        </p>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load tax rules</h2>
          <p class="mt-1 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else if (grouped().length === 0) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-12 text-center text-sm text-(--color-text-muted)"
        >
          No tax rules found{{ stateFilter() ? ' for ' + stateFilter() : '' }}.
        </p>
      } @else {
        @for (group of grouped(); track group.state) {
          <div
            class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)"
          >
            <header
              class="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg) px-6 py-4"
            >
              <div>
                <h2 class="text-lg font-semibold text-(--color-text)">{{ group.state }}</h2>
                <p class="text-xs text-(--color-text-muted)">
                  {{ group.rules.length }} tax {{ group.rules.length === 1 ? 'rule' : 'rules' }}
                </p>
              </div>
              <span class="font-mono text-xs text-(--color-text-muted)">
                {{ group.combinedPercentLabel }}
              </span>
            </header>
            <ul class="divide-y divide-(--color-border)">
              @for (rule of group.rules; track rule.tax_category_id) {
                <li
                  class="flex items-center justify-between gap-4 px-6 py-4"
                  [class.opacity-50]="!rule.is_active"
                >
                  <div class="min-w-0 flex-1">
                    @if (editingId() === rule.tax_category_id) {
                      <input
                        type="text"
                        [formControl]="editForm.controls.name"
                        class="w-full rounded border border-(--color-border) bg-(--color-bg) px-2 py-1 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                        [attr.aria-label]="'Edit name for ' + rule.code"
                      />
                    } @else {
                      <div class="text-sm font-medium text-(--color-text)">{{ rule.name }}</div>
                    }
                    <div class="mt-1 flex items-center gap-3 text-xs text-(--color-text-muted)">
                      <span class="font-mono">{{ rule.code }}</span>
                      <span aria-hidden="true">·</span>
                      <span>{{ basisLabel(rule.tax_basis) }}</span>
                      @if (rule.statutory_reference) {
                        <span aria-hidden="true">·</span>
                        <span class="italic">{{ rule.statutory_reference }}</span>
                      }
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    @if (editingId() === rule.tax_category_id) {
                      <input
                        type="number"
                        step="any"
                        [formControl]="editForm.controls.rate"
                        class="w-24 rounded border border-(--color-border) bg-(--color-bg) px-2 py-1 text-right text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                        [attr.aria-label]="'Edit rate for ' + rule.code"
                      />
                      <button
                        type="button"
                        (click)="onSaveEdit(rule)"
                        [disabled]="saving()"
                        class="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-50"
                        [attr.aria-label]="'Save edits for ' + rule.code"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        (click)="cancelEdit()"
                        class="rounded p-1.5 text-(--color-text-muted) hover:bg-(--color-surface-hover)"
                        aria-label="Cancel edit"
                      >
                        ✕
                      </button>
                    } @else {
                      <span
                        class="w-20 text-right text-sm font-semibold tabular-nums text-(--color-text)"
                      >
                        {{ formatRate(rule) }}
                      </span>
                      <button
                        type="button"
                        (click)="startEdit(rule)"
                        class="rounded p-1.5 text-(--color-text-muted) hover:bg-(--color-surface-hover) hover:text-(--color-text)"
                        [attr.aria-label]="'Edit ' + rule.code"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        (click)="onToggleActive(rule)"
                        [disabled]="saving()"
                        class="rounded p-1.5 disabled:opacity-50"
                        [class]="
                          rule.is_active
                            ? 'text-emerald-500 hover:bg-emerald-500/10'
                            : 'text-(--color-text-muted) hover:bg-(--color-surface-hover)'
                        "
                        [attr.aria-label]="
                          (rule.is_active ? 'Deactivate ' : 'Activate ') + rule.code
                        "
                        [attr.title]="rule.is_active ? 'Deactivate' : 'Activate'"
                      >
                        {{ rule.is_active ? '●' : '○' }}
                      </button>
                    }
                  </div>
                </li>
              }
            </ul>
          </div>
        }
      }
    </section>
  `,
})
export class TaxManagementPage {
  private readonly svc = inject(TaxRulesService);

  protected readonly taxBasisOptions = TAX_BASIS_OPTIONS;
  protected readonly rules = this.svc.rules;
  protected readonly isLoading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly saving = this.svc.saving;

  protected readonly stateFilter = signal<string>('');
  protected readonly showAddForm = signal<boolean>(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly toast = signal<string | null>(null);

  protected readonly states = computed<readonly string[]>(() => {
    return [...new Set(this.rules().map((r) => r.state))].sort();
  });

  protected readonly grouped = computed<readonly RuleGroup[]>(() => {
    const filter = this.stateFilter();
    const filtered = filter ? this.rules().filter((r) => r.state === filter) : this.rules();
    const byState = new Map<string, TaxRule[]>();
    for (const r of filtered) {
      const list = byState.get(r.state) ?? [];
      list.push(r);
      byState.set(r.state, list);
    }
    return Array.from(byState.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([state, rules]) => ({
        state,
        rules,
        combinedPercentLabel: combinedLabel(rules),
      }));
  });

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load tax rules.';
  });

  /* eslint-disable @typescript-eslint/unbound-method --
   * Angular's reactive-forms API expects raw `Validators.*` references; the
   * `unbound-method` rule's `this:void` warning is a false positive for
   * these pure-function validator references.
   */
  protected readonly addForm = new FormGroup<AddFormControls>({
    state: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(2)],
    }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    taxBasis: new FormControl('retail_price', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    statutoryReference: new FormControl('', { nonNullable: true }),
  });

  protected readonly editForm = new FormGroup<EditFormControls>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  protected toggleAddForm(): void {
    this.showAddForm.update((v) => !v);
  }

  protected onStateFilterChange(event: Event): void {
    this.stateFilter.set((event.target as HTMLSelectElement).value);
  }

  protected clearStateFilter(): void {
    this.stateFilter.set('');
  }

  protected ruleCountForState(state: string): number {
    return this.rules().filter((r) => r.state === state).length;
  }

  protected startEdit(rule: TaxRule): void {
    this.editingId.set(rule.tax_category_id);
    this.editForm.reset({ name: rule.name, rate: String(rule.rate) });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected async onSaveEdit(rule: TaxRule): Promise<void> {
    if (this.editForm.invalid) return;
    const v = this.editForm.getRawValue();
    const rate = parseFloat(v.rate);
    if (Number.isNaN(rate) || rate < 0) return;
    const namePatch = v.name !== rule.name ? v.name : undefined;
    const ratePatch = rate !== rule.rate ? rate : undefined;
    if (namePatch === undefined && ratePatch === undefined) {
      this.cancelEdit();
      return;
    }
    await this.svc.update({
      taxCategoryId: rule.tax_category_id,
      name: namePatch,
      rate: ratePatch,
    });
    this.editingId.set(null);
    this.flashToast('Tax rule updated');
  }

  protected async onToggleActive(rule: TaxRule): Promise<void> {
    await this.svc.update({
      taxCategoryId: rule.tax_category_id,
      isActive: !rule.is_active,
    });
    this.flashToast(rule.is_active ? 'Tax rule deactivated' : 'Tax rule activated');
  }

  protected async onSubmitAdd(): Promise<void> {
    if (this.addForm.invalid) return;
    const v = this.addForm.getRawValue();
    const rate = parseFloat(v.rate);
    if (Number.isNaN(rate)) return;
    await this.svc.add({
      state: v.state.toUpperCase(),
      code: v.code.toUpperCase(),
      name: v.name,
      rate,
      taxBasis: v.taxBasis,
      statutoryReference: v.statutoryReference.trim() || null,
    });
    this.addForm.reset({
      state: '',
      code: '',
      name: '',
      rate: '',
      taxBasis: 'retail_price',
      statutoryReference: '',
    });
    this.showAddForm.set(false);
    this.flashToast('Tax rule added');
  }

  protected formatRate(rule: TaxRule): string {
    if (rule.tax_basis === 'per_mg_thc') return '$' + rule.rate + '/mg';
    const pct = rule.rate * 100;
    return pct.toFixed(pct % 1 === 0 ? 0 : 3) + '%';
  }

  protected basisLabel(basis: string): string {
    return TAX_BASIS_OPTIONS.find((o) => o.value === basis)?.label ?? basis;
  }

  private flashToast(message: string): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(null), 3000);
  }
}

function combinedLabel(rules: readonly TaxRule[]): string {
  const sum = rules
    .filter((r) => r.is_active && r.tax_basis !== 'per_mg_thc')
    .reduce((acc, r) => acc + r.rate * 100, 0);
  return 'Combined: ' + sum.toFixed(2) + '% + THC excise';
}
