import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SearchProductsLookupGQL } from '@cannasaas/ui-ng';
import { AuthService } from '../../core/auth/auth.service';

interface ProductHit {
  readonly productId: string;
  readonly name: string;
  readonly strainType: string | null;
  readonly thcPercent: number | null;
  readonly cbdPercent: number | null;
  readonly effects: readonly string[] | null;
  readonly flavors: readonly string[] | null;
}

@Component({
  selector: 'cs-product-lookup-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <header class="mb-6">
      <h1 class="text-2xl font-bold">Product Lookup</h1>
    </header>

    <div class="mb-6 max-w-xl">
      <input
        type="text"
        autofocus
        placeholder="Search by name, strain, effects…"
        class="min-h-11 w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-sm"
        [ngModel]="search()"
        (ngModelChange)="search.set($event)"
      />
    </div>

    @if (loading()) {
      <p class="text-sm text-(--color-text-muted)">Searching…</p>
    } @else if (results().length > 0) {
      <ul class="grid grid-cols-1 gap-4 md:grid-cols-2">
        @for (p of results(); track p.productId) {
          <li class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold">{{ p.name }}</h3>
              @if (p.strainType) {
                <span
                  class="rounded-full bg-(--color-surface-alt) px-2 py-0.5 text-[10px] font-semibold uppercase"
                >
                  {{ p.strainType }}
                </span>
              }
            </div>
            <div class="mt-2 flex gap-4 text-xs text-(--color-text-muted)">
              @if (p.thcPercent != null) {
                <span class="font-medium">THC: {{ p.thcPercent }}%</span>
              }
              @if (p.cbdPercent != null) {
                <span class="font-medium">CBD: {{ p.cbdPercent }}%</span>
              }
            </div>
            @if ((p.effects?.length ?? 0) > 0) {
              <div class="mt-2 flex flex-wrap gap-1">
                @for (e of p.effects ?? []; track e) {
                  <span
                    class="rounded-full bg-(--color-primary-xlight) px-2 py-0.5 text-[10px] text-(--color-primary)"
                  >
                    {{ e }}
                  </span>
                }
              </div>
            }
            @if ((p.flavors?.length ?? 0) > 0) {
              <div class="mt-1 flex flex-wrap gap-1">
                @for (f of p.flavors ?? []; track f) {
                  <span class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                    {{ f }}
                  </span>
                }
              </div>
            }
          </li>
        }
      </ul>
    } @else if (debouncedSearch().length > 0) {
      <p class="py-12 text-center text-sm text-(--color-text-muted)">
        No products found for "{{ debouncedSearch() }}"
      </p>
    } @else {
      <p class="py-12 text-center text-sm text-(--color-text-muted)">
        Start typing to search products
      </p>
    }
  `,
})
export class ProductLookupPage {
  private readonly auth = inject(AuthService);
  private readonly searchGQL = inject(SearchProductsLookupGQL);

  protected readonly search = signal('');
  protected readonly results = signal<readonly ProductHit[]>([]);
  protected readonly loading = signal(false);

  protected readonly debouncedSearch = toSignal(
    toObservable(this.search).pipe(debounceTime(250), distinctUntilChanged()),
    { initialValue: '' },
  );

  constructor() {
    effect(() => {
      const id = this.auth.user()?.dispensaryId;
      const q = this.debouncedSearch();
      if (!id || !q) {
        this.results.set([]);
        return;
      }
      void this.runSearch(id, q);
    });
  }

  private async runSearch(dispensaryId: string, query: string): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.searchGQL
        .fetch({
          variables: { dispensaryId, query, limit: 20 },
          fetchPolicy: 'network-only',
        })
        .toPromise();
      const rows = (result?.data?.searchProducts ?? []) as unknown as ProductHit[];
      this.results.set(rows);
    } catch {
      this.results.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
