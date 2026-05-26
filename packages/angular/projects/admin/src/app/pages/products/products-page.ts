import { type CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { ProductsService, type Product, type ProductVariant } from './products.service';

type PanelMode = 'detail' | 'edit' | 'create' | null;

interface ProductFormControls {
  readonly name: FormControl<string>;
  readonly description: FormControl<string>;
  readonly strainType: FormControl<string>;
  readonly strainName: FormControl<string>;
  readonly thcPercent: FormControl<string>;
  readonly cbdPercent: FormControl<string>;
  readonly isActive: FormControl<boolean>;
  // Create-only — ignored on edit.
  readonly variantName: FormControl<string>;
  readonly variantQuantityG: FormControl<string>;
  readonly retailPrice: FormControl<string>;
}

const STRAIN_OPTIONS = ['hybrid', 'sativa', 'indica'] as const;

/**
 * Admin products list + side-panel CRUD. Mirrors the React
 * `ProductsPage`: list with search, click row → detail panel,
 * Add Product opens create form, Edit opens edit form, inline price
 * edit on the active variant, delete-with-confirm.
 *
 * Bulk operations, per-row variant drawer, and drag-to-reorder
 * are deferred — the React admin doesn't surface those either.
 */
@Component({
  selector: 'cs-products-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DragDropModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-(--color-text)">
          Products ({{ filteredProducts().length }})
        </h1>
        <button
          type="button"
          (click)="onAdd()"
          class="rounded-lg bg-(--color-primary) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-primary-hover)"
        >
          + Add product
        </button>
      </header>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="relative max-w-md flex-1">
          <input
            type="text"
            [value]="search()"
            (input)="onSearchInput($event)"
            placeholder="Search products…"
            aria-label="Search products"
            class="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
          />
        </div>
        @if (selectedCount() > 0) {
          <div
            class="flex flex-wrap items-center gap-2 rounded-lg border border-(--color-primary) bg-(--color-primary)/10 px-3 py-2 text-sm"
            role="region"
            aria-label="Bulk actions"
          >
            <span class="font-medium text-(--color-text)" aria-label="Selected count">
              {{ selectedCount() }} selected
            </span>
            <button
              type="button"
              (click)="onBulkSetActive(true)"
              [disabled]="saving()"
              aria-label="Enable selected products"
              class="rounded-md border border-(--color-border) px-2 py-1 text-xs text-(--color-text) hover:text-(--color-primary) disabled:opacity-50"
            >
              Enable
            </button>
            <button
              type="button"
              (click)="onBulkSetActive(false)"
              [disabled]="saving()"
              aria-label="Disable selected products"
              class="rounded-md border border-(--color-border) px-2 py-1 text-xs text-(--color-text) hover:text-(--color-primary) disabled:opacity-50"
            >
              Disable
            </button>
            @if (!confirmBulkDelete()) {
              <button
                type="button"
                (click)="openBulkDeleteConfirm()"
                aria-label="Delete selected products"
                class="rounded-md border border-rose-500/30 px-2 py-1 text-xs text-rose-500 hover:bg-rose-500/10"
              >
                Delete
              </button>
            } @else {
              <button
                type="button"
                (click)="onConfirmBulkDelete()"
                [disabled]="deleting()"
                aria-label="Confirm bulk delete"
                class="rounded-md bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-500 disabled:opacity-50"
              >
                @if (deleting()) {
                  Deleting…
                } @else {
                  Confirm delete {{ selectedCount() }}
                }
              </button>
              <button
                type="button"
                (click)="cancelBulkDelete()"
                class="rounded-md border border-(--color-border) px-2 py-1 text-xs text-(--color-text-secondary)"
              >
                No
              </button>
            }
            <button
              type="button"
              (click)="onClearSelection()"
              aria-label="Clear selection"
              class="text-xs text-(--color-text-muted) underline"
            >
              Clear
            </button>
          </div>
        }
      </div>

      <div class="grid grid-cols-1 gap-6" [class.md:grid-cols-3]="showPanel()">
        <div
          class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)"
          [class.md:col-span-2]="showPanel()"
        >
          @if (isLoading()) {
            <p class="p-12 text-center text-sm text-(--color-text-muted)">Loading…</p>
          } @else if (error(); as err) {
            <div class="p-6 text-rose-300" role="alert">
              <h2 class="font-semibold">Failed to load products</h2>
              <p class="mt-1 text-sm">{{ productsErrorMessage() }}</p>
            </div>
          } @else if (filteredProducts().length === 0) {
            <p class="p-12 text-center text-sm text-(--color-text-muted)">
              No products match this search.
            </p>
          } @else {
            <table class="w-full text-sm">
              <thead class="border-b border-(--color-border) bg-(--color-bg)">
                <tr>
                  <th class="w-8 px-2 py-3" aria-label="Drag handle column"></th>
                  <th class="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      [checked]="allOnPageSelected()"
                      [indeterminate]="someOnPageSelected()"
                      (change)="onToggleSelectAll($event)"
                      aria-label="Select all products"
                      class="h-4 w-4 cursor-pointer accent-(--color-primary)"
                    />
                  </th>
                  <th class="px-5 py-3 text-left font-medium text-(--color-text-secondary)">
                    Product
                  </th>
                  <th class="px-5 py-3 text-left font-medium text-(--color-text-secondary)">
                    Strain
                  </th>
                  <th class="px-5 py-3 text-right font-medium text-(--color-text-secondary)">
                    Price
                  </th>
                  <th class="px-5 py-3 text-center font-medium text-(--color-text-secondary)">
                    Stock
                  </th>
                  <th class="px-5 py-3 text-center font-medium text-(--color-text-secondary)">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody
                class="divide-y divide-(--color-border)"
                cdkDropList
                (cdkDropListDropped)="onProductDrop($event)"
              >
                @for (p of displayProducts(); track p.id) {
                  <tr
                    cdkDrag
                    [cdkDragData]="p"
                    class="cursor-pointer transition-colors"
                    [class]="
                      selectedId() === p.id
                        ? 'bg-(--color-primary)/10'
                        : 'hover:bg-(--color-surface-hover)'
                    "
                    (click)="onSelect(p)"
                  >
                    <td
                      class="w-8 cursor-grab px-2 py-4 text-center text-(--color-text-muted)"
                      (click)="$event.stopPropagation()"
                      cdkDragHandle
                      [attr.aria-label]="'Drag handle for ' + p.name"
                    >
                      ⋮⋮
                    </td>
                    <td class="w-10 px-3 py-4 text-center" (click)="$event.stopPropagation()">
                      <input
                        type="checkbox"
                        [checked]="isProductSelected(p.id)"
                        (change)="onToggleProduct(p.id, $event)"
                        [attr.aria-label]="'Select ' + p.name"
                        class="h-4 w-4 cursor-pointer accent-(--color-primary)"
                      />
                    </td>
                    <td class="px-5 py-4">
                      <p class="font-medium text-(--color-text)">{{ p.name }}</p>
                      @if (firstVariant(p); as v) {
                        <p class="text-xs text-(--color-text-muted)">{{ v.name }} · {{ v.sku }}</p>
                      }
                    </td>
                    <td class="px-5 py-4">
                      @if (p.strainType) {
                        <span
                          class="rounded-full px-2 py-0.5 text-xs font-medium"
                          [class]="strainBadgeClass(p.strainType)"
                        >
                          {{ p.strainType }}
                        </span>
                      }
                      @if (p.thcPercent != null) {
                        <span class="ml-2 text-xs text-(--color-text-muted)">
                          THC {{ p.thcPercent }}%
                        </span>
                      }
                    </td>
                    <td class="px-5 py-4 text-right font-semibold tabular-nums text-(--color-text)">
                      @if (firstVariant(p); as v) {
                        {{ formatMoney(v.retailPrice) }}
                      } @else {
                        —
                      }
                    </td>
                    <td class="px-5 py-4 text-center">
                      @if (firstVariant(p); as v) {
                        <span
                          class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          [class]="stockBadgeClass(v.stockStatus)"
                        >
                          {{ stockLabel(v.stockStatus) }}
                        </span>
                      }
                    </td>
                    <td class="px-5 py-4 text-center">
                      @if (p.isActive) {
                        <span
                          class="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500"
                        >
                          Active
                        </span>
                      } @else {
                        <span
                          class="rounded-full bg-(--color-surface-hover) px-2 py-0.5 text-[10px] font-medium text-(--color-text-muted)"
                        >
                          Inactive
                        </span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        @if (showPanel()) {
          <aside
            class="space-y-5 rounded-xl border border-(--color-border) bg-(--color-surface) p-5"
          >
            <header class="flex items-center justify-between">
              <h3 class="font-semibold text-(--color-text)">
                {{ panelTitle() }}
              </h3>
              <button
                type="button"
                (click)="closePanel()"
                class="text-(--color-text-muted) hover:text-(--color-text)"
                aria-label="Close panel"
              >
                ✕
              </button>
            </header>

            @if (panelMode() === 'create' || panelMode() === 'edit') {
              <form
                [formGroup]="form"
                (ngSubmit)="onSubmitForm()"
                class="space-y-4"
                [attr.aria-label]="panelMode() === 'create' ? 'Create product' : 'Edit product'"
              >
                <label class="block">
                  <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                    Name *
                  </span>
                  <input
                    type="text"
                    formControlName="name"
                    class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                  />
                </label>

                <label class="block">
                  <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                    Description
                  </span>
                  <textarea
                    formControlName="description"
                    rows="3"
                    class="w-full resize-none rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                  ></textarea>
                </label>

                <div class="grid grid-cols-2 gap-3">
                  <label class="block">
                    <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                      Strain type
                    </span>
                    <select
                      formControlName="strainType"
                      class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                    >
                      @for (s of strainOptions; track s) {
                        <option [value]="s">{{ s }}</option>
                      }
                    </select>
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                      Strain name
                    </span>
                    <input
                      type="text"
                      formControlName="strainName"
                      class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                    />
                  </label>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <label class="block">
                    <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                      THC %
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      formControlName="thcPercent"
                      class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                    />
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                      CBD %
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      formControlName="cbdPercent"
                      class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                    />
                  </label>
                </div>

                @if (panelMode() === 'create') {
                  <div class="space-y-3 border-t border-(--color-border) pt-4">
                    <p class="text-xs font-semibold text-(--color-text-secondary)">
                      Default variant
                    </p>
                    <div class="grid grid-cols-2 gap-3">
                      <label class="block">
                        <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                          Variant name
                        </span>
                        <input
                          type="text"
                          formControlName="variantName"
                          class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                        />
                      </label>
                      <label class="block">
                        <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                          Weight (g)
                        </span>
                        <input
                          type="number"
                          step="0.5"
                          formControlName="variantQuantityG"
                          class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                        />
                      </label>
                    </div>
                    <label class="block">
                      <span class="mb-1 block text-xs font-medium text-(--color-text-secondary)">
                        Retail price ($)
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        formControlName="retailPrice"
                        class="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                      />
                    </label>
                  </div>
                }

                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    formControlName="isActive"
                    class="rounded border-(--color-border)"
                  />
                  <span class="text-sm text-(--color-text-secondary)">
                    Active (visible on storefront)
                  </span>
                </label>

                <div class="flex gap-2 pt-2">
                  <button
                    type="submit"
                    [disabled]="form.invalid || saving()"
                    class="flex-1 rounded-lg bg-(--color-primary) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-primary-hover) disabled:opacity-50"
                  >
                    @if (saving()) {
                      Saving…
                    } @else if (panelMode() === 'create') {
                      Create product
                    } @else {
                      Save changes
                    }
                  </button>
                  <button
                    type="button"
                    (click)="closePanel()"
                    class="rounded-lg border border-(--color-border) px-4 py-2 text-sm text-(--color-text-secondary) hover:text-(--color-text)"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            } @else if (selected(); as p) {
              <div class="space-y-4">
                <div>
                  <p class="text-lg font-semibold text-(--color-text)">{{ p.name }}</p>
                  @if (p.strainType) {
                    <span
                      class="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      [class]="strainBadgeClass(p.strainType)"
                    >
                      {{ p.strainType }}
                    </span>
                  }
                </div>

                @if (p.description) {
                  <p class="text-sm text-(--color-text-secondary)">{{ p.description }}</p>
                }

                <div class="grid grid-cols-2 gap-3 text-sm">
                  @if (p.thcPercent != null) {
                    <div class="rounded-lg bg-(--color-bg) p-3">
                      <p class="text-xs text-(--color-text-muted)">THC</p>
                      <p class="font-bold text-(--color-text)">{{ p.thcPercent }}%</p>
                    </div>
                  }
                  @if (p.cbdPercent != null) {
                    <div class="rounded-lg bg-(--color-bg) p-3">
                      <p class="text-xs text-(--color-text-muted)">CBD</p>
                      <p class="font-bold text-(--color-text)">{{ p.cbdPercent }}%</p>
                    </div>
                  }
                </div>

                <div class="flex gap-2 text-sm">
                  @if (p.isActive) {
                    <span class="text-emerald-500">● Active</span>
                  } @else {
                    <span class="text-(--color-text-muted)">○ Inactive</span>
                  }
                  @if (p.isApproved) {
                    <span class="text-emerald-500">● Approved</span>
                  }
                </div>

                <p
                  class="border-t border-(--color-border) pt-3 text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)"
                >
                  Variants ({{ p.variants.length }})
                </p>
                @for (v of p.variants; track v.variantId) {
                  <div class="space-y-2 border-t border-(--color-border) pt-4 text-sm">
                    <div class="flex items-center justify-between">
                      <p class="text-xs font-semibold text-(--color-text-secondary)">
                        Variant: {{ v.name }}
                      </p>
                      @if (deletingVariantId() === v.variantId) {
                        <div class="flex items-center gap-1 text-xs">
                          <button
                            type="button"
                            (click)="onConfirmDeleteVariant(v)"
                            [disabled]="deleting()"
                            class="rounded-md bg-rose-600 px-2 py-1 text-white hover:bg-rose-500 disabled:opacity-50"
                            [attr.aria-label]="'Confirm delete variant ' + v.name"
                          >
                            @if (deleting()) {
                              …
                            } @else {
                              Delete
                            }
                          </button>
                          <button
                            type="button"
                            (click)="cancelDeleteVariant()"
                            class="rounded-md border border-(--color-border) px-2 py-1 text-(--color-text-secondary)"
                          >
                            No
                          </button>
                        </div>
                      } @else {
                        <button
                          type="button"
                          (click)="openDeleteVariant(v.variantId)"
                          [attr.aria-label]="'Delete variant ' + v.name"
                          class="text-xs text-rose-500 hover:text-rose-400"
                        >
                          ✕
                        </button>
                      }
                    </div>
                    <div class="flex justify-between">
                      <span class="text-(--color-text-secondary)">SKU</span>
                      <span class="font-mono text-xs text-(--color-text)">{{ v.sku }}</span>
                    </div>
                    @if (v.quantityPerUnit != null) {
                      <div class="flex justify-between">
                        <span class="text-(--color-text-secondary)">Weight</span>
                        <span class="text-(--color-text)">{{ v.quantityPerUnit }}g</span>
                      </div>
                    }
                    <div class="flex justify-between">
                      <span class="text-(--color-text-secondary)">Stock</span>
                      <span
                        class="rounded-full px-2 py-0.5 text-xs font-medium"
                        [class]="stockBadgeClass(v.stockStatus)"
                      >
                        {{ v.stockQuantity ?? 0 }} ({{ stockLabel(v.stockStatus) }})
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-(--color-text-secondary)">Price</span>
                      <div class="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          [value]="priceEdit()"
                          (input)="onPriceEditInput($event)"
                          [attr.aria-label]="'Price for ' + v.name"
                          class="w-24 rounded border border-(--color-border) bg-(--color-bg) px-2 py-1 text-right text-sm tabular-nums text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                        />
                        @if (canSavePrice(v)) {
                          <button
                            type="button"
                            (click)="onSavePrice(v)"
                            [disabled]="savingPrice()"
                            class="text-xs font-medium text-(--color-primary) hover:text-(--color-primary-hover) disabled:opacity-50"
                            [attr.aria-label]="'Save price for ' + v.name"
                          >
                            @if (savingPrice()) {
                              …
                            } @else {
                              Save
                            }
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                }

                @if (addingVariant()) {
                  <form
                    (submit)="onSubmitNewVariant(p, $event)"
                    class="space-y-2 rounded-md border border-(--color-border) bg-(--color-bg) p-3 text-xs"
                  >
                    <p class="font-semibold text-(--color-text-secondary)">New variant</p>
                    <label class="block">
                      <span class="text-(--color-text-secondary)">Name</span>
                      <input
                        type="text"
                        [value]="newVariant().name"
                        (input)="onNewVariantField('name', $event)"
                        aria-label="New variant name"
                        placeholder="3.5g"
                        class="mt-1 block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-1 text-sm text-(--color-text)"
                      />
                    </label>
                    <div class="grid grid-cols-2 gap-2">
                      <label class="block">
                        <span class="text-(--color-text-secondary)">Weight (g)</span>
                        <input
                          type="number"
                          step="0.01"
                          [value]="newVariant().quantityPerUnit"
                          (input)="onNewVariantField('quantityPerUnit', $event)"
                          aria-label="New variant weight"
                          class="mt-1 block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-1 text-sm text-right tabular-nums text-(--color-text)"
                        />
                      </label>
                      <label class="block">
                        <span class="text-(--color-text-secondary)">Price</span>
                        <input
                          type="number"
                          step="0.01"
                          [value]="newVariant().retailPrice"
                          (input)="onNewVariantField('retailPrice', $event)"
                          aria-label="New variant price"
                          class="mt-1 block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-1 text-sm text-right tabular-nums text-(--color-text)"
                        />
                      </label>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="submit"
                        [disabled]="saving() || !newVariant().name.trim()"
                        class="rounded-md bg-(--color-primary) px-3 py-1 text-xs font-semibold text-white hover:bg-(--color-primary-hover) disabled:opacity-50"
                      >
                        @if (saving()) {
                          Adding…
                        } @else {
                          Add variant
                        }
                      </button>
                      <button
                        type="button"
                        (click)="cancelAddVariant()"
                        class="rounded-md border border-(--color-border) px-3 py-1 text-xs text-(--color-text-secondary)"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                } @else {
                  <button
                    type="button"
                    (click)="openAddVariant()"
                    aria-label="Add variant"
                    class="rounded-md border border-dashed border-(--color-border) px-3 py-2 text-xs text-(--color-text-secondary) hover:border-(--color-primary) hover:text-(--color-primary)"
                  >
                    + Add variant
                  </button>
                }

                <div class="flex gap-2 border-t border-(--color-border) pt-3">
                  <button
                    type="button"
                    (click)="onEdit(p)"
                    class="flex-1 rounded-lg bg-(--color-primary) px-3 py-2 text-xs font-medium text-white hover:bg-(--color-primary-hover)"
                  >
                    Edit
                  </button>
                  @if (!confirmDelete()) {
                    <button
                      type="button"
                      (click)="openDeleteConfirm()"
                      class="rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10"
                    >
                      Delete
                    </button>
                  } @else {
                    <button
                      type="button"
                      (click)="onConfirmDelete(p)"
                      [disabled]="deleting()"
                      class="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-50"
                      [attr.aria-label]="'Confirm delete ' + p.name"
                    >
                      @if (deleting()) {
                        Deleting…
                      } @else {
                        Confirm delete
                      }
                    </button>
                    <button
                      type="button"
                      (click)="closeDeleteConfirm()"
                      class="rounded-lg border border-(--color-border) px-3 py-2 text-xs text-(--color-text-secondary) hover:text-(--color-text)"
                    >
                      No
                    </button>
                  }
                </div>
              </div>
            }
          </aside>
        }
      </div>
    </section>
  `,
})
export class ProductsPage {
  private readonly svc = inject(ProductsService);
  private readonly auth = inject(AuthService);

  protected readonly strainOptions = STRAIN_OPTIONS;

  protected readonly filteredProducts = this.svc.filteredProducts;
  protected readonly isLoading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly saving = this.svc.saving;
  protected readonly savingPrice = this.svc.savingPrice;
  protected readonly deleting = this.svc.deleting;
  protected readonly search = this.svc.search;

  protected readonly selected = signal<Product | null>(null);
  protected readonly panelMode = signal<PanelMode>(null);
  protected readonly priceEdit = signal<string>('');
  protected readonly confirmDelete = signal<boolean>(false);
  protected readonly addingVariant = signal<boolean>(false);
  protected readonly deletingVariantId = signal<string | null>(null);

  /** Set of selected product ids for bulk-ops (sc-682b). */
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly confirmBulkDelete = signal<boolean>(false);

  protected readonly selectedCount = computed(() => this.selectedIds().size);

  protected readonly allOnPageSelected = computed(() => {
    const visible = this.filteredProducts();
    if (visible.length === 0) return false;
    const selected = this.selectedIds();
    return visible.every((p) => selected.has(p.id));
  });

  protected readonly someOnPageSelected = computed(() => {
    const selected = this.selectedIds();
    if (selected.size === 0) return false;
    return !this.allOnPageSelected();
  });
  protected readonly newVariant = signal<{
    name: string;
    quantityPerUnit: string;
    retailPrice: string;
  }>({ name: '', quantityPerUnit: '', retailPrice: '' });

  /**
   * Mirrors `filteredProducts()` into a local mutable signal so CDK
   * drag-drop can reorder rows optimistically (sc-682c). An effect
   * resyncs whenever the server-side list changes.
   */
  protected readonly displayProducts = signal<readonly Product[]>([]);

  constructor() {
    effect(() => {
      this.displayProducts.set(this.filteredProducts());
    });
  }

  protected readonly selectedId = computed(() => this.selected()?.id ?? null);
  protected readonly showPanel = computed(() => this.panelMode() !== null);

  protected readonly panelTitle = computed(() => {
    switch (this.panelMode()) {
      case 'create':
        return 'New product';
      case 'edit':
        return 'Edit product';
      case 'detail':
        return 'Product details';
      default:
        return '';
    }
  });

  protected readonly productsErrorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load products.';
  });

  /* eslint-disable @typescript-eslint/unbound-method --
   * Validators.* are pure functions; the unbound-method rule's
   * `this:void` warning is a false positive for these references.
   */
  protected readonly form = new FormGroup<ProductFormControls>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    strainType: new FormControl('hybrid', { nonNullable: true }),
    strainName: new FormControl('', { nonNullable: true }),
    thcPercent: new FormControl('', { nonNullable: true }),
    cbdPercent: new FormControl('', { nonNullable: true }),
    isActive: new FormControl(true, { nonNullable: true }),
    variantName: new FormControl('3.5g Jar', { nonNullable: true }),
    variantQuantityG: new FormControl('3.5', { nonNullable: true }),
    retailPrice: new FormControl('', { nonNullable: true }),
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.svc.setSearch(value);
  }

  protected onSelect(product: Product): void {
    if (this.panelMode() === 'create' || this.panelMode() === 'edit') return;
    this.selected.set(product);
    this.panelMode.set('detail');
    this.confirmDelete.set(false);
    this.priceEdit.set(this.firstVariant(product)?.retailPrice?.toString() ?? '');
  }

  protected onAdd(): void {
    this.selected.set(null);
    this.panelMode.set('create');
    this.confirmDelete.set(false);
    this.form.reset({
      name: '',
      description: '',
      strainType: 'hybrid',
      strainName: '',
      thcPercent: '',
      cbdPercent: '',
      isActive: true,
      variantName: '3.5g Jar',
      variantQuantityG: '3.5',
      retailPrice: '',
    });
  }

  protected onEdit(product: Product): void {
    this.selected.set(product);
    this.panelMode.set('edit');
    this.confirmDelete.set(false);
    const v = this.firstVariant(product);
    this.form.reset({
      name: product.name,
      description: product.description ?? '',
      strainType: product.strainType ?? 'hybrid',
      strainName: product.strainName ?? '',
      thcPercent: product.thcPercent?.toString() ?? '',
      cbdPercent: product.cbdPercent?.toString() ?? '',
      isActive: product.isActive,
      variantName: v?.name ?? '',
      variantQuantityG: v?.quantityPerUnit?.toString() ?? '',
      retailPrice: v?.retailPrice?.toString() ?? '',
    });
    this.priceEdit.set(v?.retailPrice?.toString() ?? '');
  }

  protected closePanel(): void {
    this.selected.set(null);
    this.panelMode.set(null);
    this.confirmDelete.set(false);
  }

  protected openDeleteConfirm(): void {
    this.confirmDelete.set(true);
  }

  protected closeDeleteConfirm(): void {
    this.confirmDelete.set(false);
  }

  protected onPriceEditInput(event: Event): void {
    this.priceEdit.set((event.target as HTMLInputElement).value);
  }

  protected canSavePrice(variant: ProductVariant): boolean {
    const current = variant.retailPrice?.toString() ?? '';
    const edit = this.priceEdit();
    return edit !== '' && edit !== current;
  }

  protected async onSavePrice(variant: ProductVariant): Promise<void> {
    const dispensaryId = this.auth.user()?.dispensaryId;
    const price = parseFloat(this.priceEdit());
    if (!dispensaryId || Number.isNaN(price)) return;
    await this.svc.updateVariantPrice({ variantId: variant.variantId, dispensaryId, price });
  }

  protected async onSubmitForm(): Promise<void> {
    if (this.form.invalid) return;
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) return;
    const v = this.form.getRawValue();
    if (this.panelMode() === 'create') {
      await this.svc.create({
        dispensaryId,
        name: v.name,
        description: v.description || undefined,
        strainType: v.strainType || undefined,
        strainName: v.strainName || undefined,
        thcPercent: v.thcPercent ? parseFloat(v.thcPercent) : undefined,
        cbdPercent: v.cbdPercent ? parseFloat(v.cbdPercent) : undefined,
        isActive: v.isActive,
        variantName: v.variantName || undefined,
        variantQuantityG: v.variantQuantityG ? parseFloat(v.variantQuantityG) : undefined,
        retailPrice: v.retailPrice ? parseFloat(v.retailPrice) : undefined,
      });
      this.closePanel();
    } else if (this.panelMode() === 'edit') {
      const productId = this.selected()?.id;
      if (!productId) return;
      await this.svc.update({
        productId,
        dispensaryId,
        name: v.name,
        description: v.description || undefined,
        strainType: v.strainType || undefined,
        strainName: v.strainName || undefined,
        thcPercent: v.thcPercent ? parseFloat(v.thcPercent) : undefined,
        cbdPercent: v.cbdPercent ? parseFloat(v.cbdPercent) : undefined,
        isActive: v.isActive,
      });
      this.closePanel();
    }
  }

  protected async onConfirmDelete(product: Product): Promise<void> {
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) return;
    await this.svc.deleteProduct(product.id, dispensaryId);
    this.closePanel();
  }

  protected firstVariant(p: Product): ProductVariant | undefined {
    return p.variants[0];
  }

  protected formatMoney(value: number | null | undefined): string {
    if (value == null) return '—';
    return (
      '$' +
      value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  protected stockLabel(status: string | null | undefined): string {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Sold Out';
      default:
        return 'Unknown';
    }
  }

  protected stockBadgeClass(status: string | null | undefined): string {
    switch (status) {
      case 'in_stock':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'low_stock':
        return 'bg-amber-500/10 text-amber-500';
      case 'out_of_stock':
        return 'bg-rose-500/10 text-rose-500';
      default:
        return 'bg-(--color-surface-hover) text-(--color-text-secondary)';
    }
  }

  protected strainBadgeClass(strain: string | null | undefined): string {
    switch (strain) {
      case 'sativa':
        return 'bg-orange-500/10 text-orange-500';
      case 'indica':
        return 'bg-purple-500/10 text-purple-500';
      case 'hybrid':
      default:
        return 'bg-emerald-500/10 text-emerald-500';
    }
  }

  // ── Variant CRUD (sc-682a) ────────────────────────────────────────────

  protected openAddVariant(): void {
    this.addingVariant.set(true);
    this.newVariant.set({ name: '', quantityPerUnit: '', retailPrice: '' });
  }

  protected cancelAddVariant(): void {
    this.addingVariant.set(false);
  }

  protected onNewVariantField(
    field: 'name' | 'quantityPerUnit' | 'retailPrice',
    event: Event,
  ): void {
    const value = (event.target as HTMLInputElement).value;
    this.newVariant.update((prev) => ({ ...prev, [field]: value }));
  }

  protected async onSubmitNewVariant(p: Product, event?: Event): Promise<void> {
    event?.preventDefault();
    const { name: rawName, quantityPerUnit, retailPrice } = this.newVariant();
    const name = rawName.trim();
    if (!name) return;
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) return;
    const qty = quantityPerUnit.trim() ? Number(quantityPerUnit) : undefined;
    const price = retailPrice.trim() ? Number(retailPrice) : undefined;
    await this.svc.createVariant({
      productId: p.id,
      dispensaryId,
      name,
      quantityPerUnit: qty != null && Number.isFinite(qty) ? qty : undefined,
      retailPrice: price != null && Number.isFinite(price) ? price : undefined,
    });
    this.addingVariant.set(false);
    this.newVariant.set({ name: '', quantityPerUnit: '', retailPrice: '' });
  }

  protected openDeleteVariant(variantId: string): void {
    this.deletingVariantId.set(variantId);
  }

  protected cancelDeleteVariant(): void {
    this.deletingVariantId.set(null);
  }

  protected async onConfirmDeleteVariant(v: ProductVariant): Promise<void> {
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) return;
    await this.svc.deleteVariant(v.variantId, dispensaryId);
    this.deletingVariantId.set(null);
  }

  // ── Bulk-ops (sc-682b) ─────────────────────────────────────────────────

  protected isProductSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  protected onToggleProduct(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  protected onToggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const visible = this.filteredProducts();
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      for (const p of visible) {
        if (checked) next.add(p.id);
        else next.delete(p.id);
      }
      return next;
    });
  }

  protected onClearSelection(): void {
    this.selectedIds.set(new Set());
    this.confirmBulkDelete.set(false);
  }

  protected async onBulkSetActive(isActive: boolean): Promise<void> {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) return;
    await this.svc.setProductsActive(dispensaryId, ids, isActive);
    this.onClearSelection();
  }

  protected openBulkDeleteConfirm(): void {
    this.confirmBulkDelete.set(true);
  }

  protected cancelBulkDelete(): void {
    this.confirmBulkDelete.set(false);
  }

  protected async onConfirmBulkDelete(): Promise<void> {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) return;
    await this.svc.deleteProducts(dispensaryId, ids);
    this.onClearSelection();
  }

  // ── Drag-to-reorder (sc-682c) ─────────────────────────────────────────

  protected async onProductDrop(event: CdkDragDrop<readonly Product[]>): Promise<void> {
    if (event.previousIndex === event.currentIndex) return;
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) return;
    const next = [...this.displayProducts()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.displayProducts.set(next);
    await this.svc.setProductsSortOrder(
      dispensaryId,
      next.map((p) => p.id),
    );
  }
}
