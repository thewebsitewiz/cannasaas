import { type CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { MenuCategoriesService, type ProductTypeConfig } from './menu-categories.service';

/**
 * Menu categories editor — drag-to-reorder via `@angular/cdk/drag-drop`
 * (admin's CLAUDE.md explicitly permits CDK in this app). Local edit
 * signals diverge from the server snapshot so the user can dirty-check
 * the list and reset before saving. Save sends the full ordered array;
 * backend persists `sortOrder` sequentially.
 *
 * Toggle (eye/eye-off) flips `isEnabled` per row.
 */
@Component({
  selector: 'cs-menu-categories-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DragDropModule],
  template: `
    <section class="max-w-2xl space-y-6">
      <header>
        <h1 class="text-2xl font-bold text-(--color-text)">Menu categories</h1>
        <p class="mt-1 text-sm text-(--color-text-muted)">
          Choose which product types appear on your storefront menu and set their display order.
          Drag to reorder, toggle to show or hide.
        </p>
      </header>

      @if (isLoading()) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          Loading menu categories…
        </p>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load menu categories</h2>
          <p class="mt-1 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else {
        <div class="flex items-center gap-4 text-sm">
          <span class="text-(--color-text-secondary)">
            <strong class="text-(--color-text)">{{ enabledCount() }}</strong>
            of {{ items().length }} categories visible
          </span>
          @if (dirty()) {
            <span class="font-medium text-amber-500">Unsaved changes</span>
          }
          @if (savedTick()) {
            <span class="font-medium text-emerald-500" role="status">Saved!</span>
          }
        </div>

        <ul
          cdkDropList
          (cdkDropListDropped)="onDrop($event)"
          class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)"
          aria-label="Menu categories"
        >
          @for (item of items(); track item.productTypeId; let i = $index) {
            <li
              cdkDrag
              class="flex items-center gap-3 border-b border-(--color-border) px-4 py-3 transition-colors last:border-b-0"
              [class.opacity-50]="!item.isEnabled"
            >
              <span
                cdkDragHandle
                class="cursor-grab p-1 text-(--color-text-muted) hover:text-(--color-text) active:cursor-grabbing"
                [attr.aria-label]="'Drag to reorder ' + item.name"
                aria-hidden="false"
              >
                ⠿
              </span>

              <span class="w-6 text-center font-mono text-xs text-(--color-text-muted)">
                {{ i + 1 }}
              </span>

              <span
                class="flex-1 text-sm font-medium"
                [class]="
                  item.isEnabled ? 'text-(--color-text)' : 'text-(--color-text-muted) line-through'
                "
              >
                {{ item.name }}
              </span>

              <span
                class="rounded bg-(--color-bg) px-2 py-0.5 font-mono text-[10px] text-(--color-text-muted)"
              >
                {{ item.code }}
              </span>

              <button
                type="button"
                (click)="onToggle(i)"
                [attr.aria-label]="(item.isEnabled ? 'Hide ' : 'Show ') + item.name"
                class="rounded-lg p-2 transition-colors"
                [class]="
                  item.isEnabled
                    ? 'text-emerald-500 hover:bg-emerald-500/10'
                    : 'text-(--color-text-muted) hover:bg-(--color-surface-hover)'
                "
              >
                {{ item.isEnabled ? '👁' : '🚫' }}
              </button>
            </li>
          }
        </ul>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="onSave()"
            [disabled]="!dirty() || saving()"
            class="rounded-lg bg-(--color-primary) px-6 py-2.5 text-sm font-semibold text-white hover:bg-(--color-primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
          >
            @if (saving()) {
              Saving…
            } @else {
              Save order
            }
          </button>
          @if (dirty()) {
            <button
              type="button"
              (click)="onReset()"
              class="px-4 py-2.5 text-sm text-(--color-text-muted) hover:text-(--color-text)"
              aria-label="Reset to saved order"
            >
              ↺ Reset
            </button>
          }
        </div>

        <div class="space-y-1 text-xs text-(--color-text-muted)">
          <p>
            Customers see only enabled categories on the storefront menu, in the order shown above.
          </p>
          <p>
            Disabling a category hides it from the menu but does not affect existing products or
            inventory.
          </p>
        </div>
      }
    </section>
  `,
})
export class MenuCategoriesPage {
  private readonly svc = inject(MenuCategoriesService);

  protected readonly isLoading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly saving = this.svc.saving;

  /** Local edit state — diverges from server until Save or Reset. */
  protected readonly items = signal<readonly ProductTypeConfig[]>([]);
  protected readonly savedTick = signal<boolean>(false);

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load menu categories.';
  });

  protected readonly enabledCount = computed(() => this.items().filter((t) => t.isEnabled).length);

  protected readonly dirty = computed(() => {
    const server = this.svc.types();
    const local = this.items();
    if (server.length !== local.length) return true;
    for (let i = 0; i < server.length; i++) {
      if (
        server[i].productTypeId !== local[i].productTypeId ||
        server[i].isEnabled !== local[i].isEnabled
      ) {
        return true;
      }
    }
    return false;
  });

  constructor() {
    // Re-seed local edit state whenever the server snapshot changes.
    effect(() => {
      const server = this.svc.types();
      this.items.set([...server]);
    });
  }

  protected onDrop(event: CdkDragDrop<readonly ProductTypeConfig[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.items.update((prev) => {
      const next = [...prev];
      moveItemInArray(next, event.previousIndex, event.currentIndex);
      return next;
    });
  }

  protected onToggle(index: number): void {
    this.items.update((prev) =>
      prev.map((item, i) => (i === index ? { ...item, isEnabled: !item.isEnabled } : item)),
    );
  }

  protected async onSave(): Promise<void> {
    const payload = this.items().map((t, i) => ({
      productTypeId: t.productTypeId,
      isEnabled: t.isEnabled,
      sortOrder: i,
    }));
    await this.svc.save(payload);
    this.savedTick.set(true);
    setTimeout(() => this.savedTick.set(false), 3000);
  }

  protected onReset(): void {
    this.items.set([...this.svc.types()]);
  }
}
