import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  CreateOrderGQL,
  CreateWalkInCustomerGQL,
  ProductsGQL,
  SearchCustomersGQL,
} from '@cannasaas/ui-ng';
import { AuthService } from '../../core/auth/auth.service';

interface Variant {
  readonly variantId: string;
  readonly name: string;
  readonly retailPrice: number | null;
  readonly stockQuantity: number | null;
  readonly stockStatus: string | null;
}

interface Product {
  readonly id: string;
  readonly name: string;
  readonly strainType: string | null;
  readonly thcPercent: number | null;
  readonly cbdPercent: number | null;
  readonly variants: readonly Variant[];
}

interface CustomerResult {
  readonly userId: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly phone: string | null;
  readonly ageVerified: boolean;
  readonly totalOrders: number;
}

interface CartItem {
  readonly productId: string;
  readonly variantId: string;
  readonly productName: string;
  readonly variantName: string;
  readonly price: number;
  quantity: number;
  readonly maxStock: number;
}

interface OrderResult {
  readonly orderId: string;
  readonly orderStatus: string;
  readonly subtotal: number;
  readonly taxTotal: number;
  readonly total: number;
  readonly lineItemCount: number;
}

@Component({
  selector: 'cs-new-order-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    @if (orderResult(); as result) {
      <section
        class="mx-auto max-w-lg rounded-2xl border border-(--color-border) bg-(--color-surface) p-8 text-center"
      >
        <h2 class="text-2xl font-bold">Order Placed</h2>
        <p class="mt-1 text-sm text-(--color-text-muted)">
          #{{ result.orderId.slice(0, 8).toUpperCase() }}
        </p>
        <dl class="mt-6 space-y-1 text-sm">
          <div class="flex justify-between">
            <dt>Items</dt>
            <dd>{{ result.lineItemCount }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>Subtotal</dt>
            <dd class="tabular-nums">\${{ result.subtotal.toFixed(2) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>Tax</dt>
            <dd class="tabular-nums">\${{ result.taxTotal.toFixed(2) }}</dd>
          </div>
          <div class="flex justify-between border-t border-(--color-border) pt-2 text-lg font-bold">
            <dt>Total</dt>
            <dd class="tabular-nums">\${{ result.total.toFixed(2) }}</dd>
          </div>
        </dl>
        <button
          type="button"
          class="mt-6 rounded-xl bg-(--color-primary) px-8 py-3 font-semibold text-white hover:bg-(--color-primary-hover)"
          (click)="startNewOrder()"
        >
          New Order
        </button>
      </section>
    } @else {
      <div class="grid h-[calc(100vh-7rem)] grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <!-- LEFT: Product browser -->
        <section class="flex min-w-0 flex-col">
          <header class="mb-4 flex items-center gap-3">
            <h1 class="text-xl font-bold whitespace-nowrap">New Order</h1>
            <input
              type="text"
              placeholder="Search products…"
              class="min-h-11 flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm"
              [ngModel]="productSearch()"
              (ngModelChange)="productSearch.set($event)"
            />
          </header>
          <div class="-mr-2 flex-1 overflow-y-auto pr-2">
            @if (productsLoading()) {
              <p class="py-8 text-center text-sm text-(--color-text-muted)">Loading products…</p>
            } @else if (products().length === 0) {
              <p class="py-12 text-center text-sm text-(--color-text-muted)">No products found</p>
            } @else {
              <ul class="grid grid-cols-1 gap-3 lg:grid-cols-2">
                @for (product of products(); track product.id) {
                  <li class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                    <div class="mb-2 flex items-center gap-2">
                      <h3 class="truncate text-sm font-semibold">{{ product.name }}</h3>
                      @if (product.strainType) {
                        <span
                          class="shrink-0 rounded-full bg-(--color-surface-alt) px-2 py-0.5 text-[10px] font-semibold uppercase"
                        >
                          {{ product.strainType }}
                        </span>
                      }
                    </div>
                    <p class="mb-3 flex gap-3 text-xs text-(--color-text-muted)">
                      @if (product.thcPercent != null) {
                        <span>THC {{ product.thcPercent }}%</span>
                      }
                      @if (product.cbdPercent != null) {
                        <span>CBD {{ product.cbdPercent }}%</span>
                      }
                    </p>
                    <ul class="space-y-1.5">
                      @for (variant of product.variants; track variant.variantId) {
                        @let oos = isOutOfStock(variant);
                        @let inCart = cartItemFor(variant.variantId);
                        <li
                          class="flex items-center justify-between rounded-lg px-2 py-1.5"
                          [class.opacity-40]="oos"
                        >
                          <span class="min-w-0 truncate text-xs font-medium">
                            {{ variant.name }}
                          </span>
                          <span class="flex shrink-0 items-center gap-2">
                            <span class="text-sm font-bold tabular-nums">
                              {{ formatPrice(variant.retailPrice) }}
                            </span>
                            @if (oos) {
                              <span class="w-16 text-center text-[10px] font-medium text-rose-600">
                                Sold Out
                              </span>
                            } @else {
                              <button
                                type="button"
                                class="min-h-9 rounded-md bg-(--color-primary) px-3 text-sm font-semibold text-white disabled:opacity-50"
                                [disabled]="
                                  inCart != null && inCart.quantity >= maxStockFor(variant)
                                "
                                (click)="addToCart(product, variant)"
                              >
                                Add
                              </button>
                            }
                          </span>
                        </li>
                      }
                    </ul>
                  </li>
                }
              </ul>
            }
          </div>
        </section>

        <!-- RIGHT: Cart + customer -->
        <aside
          class="flex min-h-0 flex-col rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
        >
          <div class="mb-4 border-b border-(--color-border) pb-4">
            <h2 class="mb-2 text-sm font-semibold uppercase text-(--color-text-muted)">Customer</h2>
            @if (customer(); as c) {
              <div class="flex items-center justify-between">
                <span class="text-sm">
                  @if (isWalkIn(c)) {
                    Walk-in customer
                  } @else {
                    {{ c.firstName }} {{ c.lastName }}
                  }
                </span>
                <button
                  type="button"
                  class="text-xs text-(--color-text-muted) underline"
                  (click)="clearCustomer()"
                >
                  Change
                </button>
              </div>
            } @else {
              <div class="space-y-2">
                <input
                  type="text"
                  placeholder="Search by name/phone/email…"
                  class="min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm"
                  [ngModel]="customerSearch()"
                  (ngModelChange)="customerSearch.set($event)"
                />
                @if (customerResults().length > 0) {
                  <ul class="max-h-40 overflow-y-auto rounded-md border border-(--color-border)">
                    @for (c of customerResults(); track c.userId) {
                      <li>
                        <button
                          type="button"
                          class="block w-full px-3 py-2 text-left text-xs hover:bg-(--color-surface-hover)"
                          (click)="selectCustomer(c)"
                        >
                          {{ c.firstName }} {{ c.lastName }}
                          <span class="block text-(--color-text-muted)">{{ c.phone }}</span>
                        </button>
                      </li>
                    }
                  </ul>
                }
                <button
                  type="button"
                  class="min-h-11 w-full rounded-md border border-(--color-border) px-3 py-2 text-sm font-medium hover:bg-(--color-surface-hover) disabled:opacity-50"
                  [disabled]="walkinCreating()"
                  (click)="createWalkIn()"
                >
                  @if (walkinCreating()) {
                    Creating…
                  } @else {
                    + Walk-in customer
                  }
                </button>
              </div>
            }
          </div>

          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-semibold uppercase text-(--color-text-muted)">
              Cart ({{ cartCount() }})
            </h2>
            @if (cart().length > 0) {
              <button
                type="button"
                class="text-xs text-(--color-text-muted) underline"
                (click)="emptyCart()"
              >
                Empty
              </button>
            }
          </div>

          <ul class="-mx-2 flex-1 overflow-y-auto px-2">
            @for (item of cart(); track item.variantId) {
              <li class="mb-2 flex items-start gap-2 rounded-md border border-(--color-border) p-2">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ item.productName }}</p>
                  <p class="truncate text-xs text-(--color-text-muted)">
                    {{ item.variantName }} · \${{ item.price.toFixed(2) }}
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    class="min-h-9 w-9 rounded-md border border-(--color-border)"
                    (click)="updateQty(item.variantId, item.quantity - 1)"
                  >
                    −
                  </button>
                  <span class="w-8 text-center text-sm tabular-nums">
                    {{ item.quantity }}
                  </span>
                  <button
                    type="button"
                    class="min-h-9 w-9 rounded-md border border-(--color-border) disabled:opacity-50"
                    [disabled]="item.quantity >= item.maxStock"
                    (click)="updateQty(item.variantId, item.quantity + 1)"
                  >
                    +
                  </button>
                </div>
              </li>
            } @empty {
              <li class="py-6 text-center text-sm text-(--color-text-muted)">Cart is empty</li>
            }
          </ul>

          <div class="mt-4 border-t border-(--color-border) pt-4">
            <p class="mb-3 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span class="tabular-nums">\${{ cartTotal().toFixed(2) }}</span>
            </p>
            @if (errorMessage(); as err) {
              <p class="mb-2 text-sm text-rose-600">{{ err }}</p>
            }
            <button
              type="button"
              class="min-h-11 w-full rounded-md bg-(--color-primary) px-4 py-2 font-semibold text-white hover:bg-(--color-primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
              [disabled]="!canPlaceOrder()"
              (click)="placeOrder()"
            >
              @if (placing()) {
                Placing…
              } @else {
                Place Order
              }
            </button>
          </div>
        </aside>
      </div>
    }
  `,
})
export class NewOrderPage {
  private readonly auth = inject(AuthService);
  private readonly productsGQL = inject(ProductsGQL);
  private readonly searchCustomersGQL = inject(SearchCustomersGQL);
  private readonly createWalkInGQL = inject(CreateWalkInCustomerGQL);
  private readonly createOrderGQL = inject(CreateOrderGQL);

  protected readonly productSearch = signal('');
  protected readonly customerSearch = signal('');
  protected readonly cart = signal<CartItem[]>([]);
  protected readonly customer = signal<CustomerResult | null>(null);
  protected readonly orderResult = signal<OrderResult | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly walkinCreating = signal(false);
  protected readonly placing = signal(false);

  protected readonly products = signal<readonly Product[]>([]);
  protected readonly productsLoading = signal(false);
  protected readonly customerResults = signal<readonly CustomerResult[]>([]);

  private readonly debouncedProductSearch = toSignal(
    toObservable(this.productSearch).pipe(debounceTime(250), distinctUntilChanged()),
    { initialValue: '' },
  );

  private readonly debouncedCustomerSearch = toSignal(
    toObservable(this.customerSearch).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  private readonly dispensaryId = computed(() => this.auth.user()?.dispensaryId ?? null);

  protected readonly cartTotal = computed(() =>
    this.cart().reduce((sum, i) => sum + i.price * i.quantity, 0),
  );

  protected readonly cartCount = computed(() =>
    this.cart().reduce((sum, i) => sum + i.quantity, 0),
  );

  protected readonly canPlaceOrder = computed(() => {
    if (this.placing()) return false;
    if (this.cart().length === 0) return false;
    if (!this.customer()) return false;
    return true;
  });

  constructor() {
    effect(() => {
      const id = this.dispensaryId();
      const search = this.debouncedProductSearch();
      if (!id) return;
      void this.loadProducts(id, search);
    });

    effect(() => {
      const id = this.dispensaryId();
      const q = this.debouncedCustomerSearch();
      if (!id || q.length < 2) {
        this.customerResults.set([]);
        return;
      }
      void this.loadCustomers(id, q);
    });
  }

  private async loadProducts(dispensaryId: string, search: string): Promise<void> {
    this.productsLoading.set(true);
    try {
      const result = await this.productsGQL
        .fetch({
          variables: {
            dispensaryId,
            search: search || undefined,
            limit: 30,
          },
          fetchPolicy: 'network-only',
        })
        .toPromise();
      const rows = (result?.data?.products ?? []) as unknown as Product[];
      this.products.set(rows);
    } catch {
      this.products.set([]);
    } finally {
      this.productsLoading.set(false);
    }
  }

  private async loadCustomers(dispensaryId: string, query: string): Promise<void> {
    try {
      const result = await this.searchCustomersGQL
        .fetch({
          variables: { dispensaryId, query, limit: 8 },
          fetchPolicy: 'network-only',
        })
        .toPromise();
      const rows = (result?.data?.searchCustomers ?? []) as unknown as CustomerResult[];
      this.customerResults.set(rows);
    } catch {
      this.customerResults.set([]);
    }
  }

  protected isOutOfStock(variant: Variant): boolean {
    if (variant.stockStatus === 'out_of_stock') return true;
    return variant.stockQuantity === 0;
  }

  protected maxStockFor(variant: Variant): number {
    return variant.stockQuantity ?? 999;
  }

  protected formatPrice(p: number | null): string {
    return p != null && p > 0 ? `$${p.toFixed(2)}` : '—';
  }

  protected cartItemFor(variantId: string): CartItem | undefined {
    return this.cart().find((i) => i.variantId === variantId);
  }

  protected isWalkIn(c: CustomerResult): boolean {
    return c.email.startsWith('walkin-');
  }

  protected addToCart(product: Product, variant: Variant): void {
    const price = variant.retailPrice ?? 0;
    const maxStock = this.maxStockFor(variant);
    if (maxStock <= 0) return;

    const existing = this.cart().find((i) => i.variantId === variant.variantId);
    if (existing) {
      if (existing.quantity >= maxStock) return;
      this.cart.update((items) =>
        items.map((i) =>
          i.variantId === variant.variantId
            ? { ...i, quantity: Math.min(i.quantity + 1, maxStock) }
            : i,
        ),
      );
      return;
    }
    this.cart.update((items) => [
      ...items,
      {
        productId: product.id,
        variantId: variant.variantId,
        productName: product.name,
        variantName: variant.name,
        price,
        quantity: 1,
        maxStock,
      },
    ]);
  }

  protected updateQty(variantId: string, qty: number): void {
    if (qty <= 0) {
      this.cart.update((items) => items.filter((i) => i.variantId !== variantId));
      return;
    }
    this.cart.update((items) =>
      items.map((i) =>
        i.variantId === variantId ? { ...i, quantity: Math.min(qty, i.maxStock) } : i,
      ),
    );
  }

  protected emptyCart(): void {
    this.cart.set([]);
  }

  protected selectCustomer(c: CustomerResult): void {
    this.customer.set(c);
    this.customerSearch.set('');
    this.customerResults.set([]);
  }

  protected clearCustomer(): void {
    this.customer.set(null);
  }

  protected async createWalkIn(): Promise<void> {
    const id = this.dispensaryId();
    if (!id || this.walkinCreating()) return;
    this.walkinCreating.set(true);
    try {
      const result = await this.createWalkInGQL
        .mutate({
          variables: {
            input: {
              dispensaryId: id,
              firstName: '',
              lastName: '',
            },
          },
        })
        .toPromise();
      const c = result?.data?.createWalkInCustomer as unknown as CustomerResult | undefined;
      if (!c) throw new Error('Walk-in creation returned no customer');
      this.customer.set(c);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create walk-in';
      this.errorMessage.set(message);
    } finally {
      this.walkinCreating.set(false);
    }
  }

  protected async placeOrder(): Promise<void> {
    const id = this.dispensaryId();
    const c = this.customer();
    if (!id || !c || this.placing() || this.cart().length === 0) return;

    this.placing.set(true);
    this.errorMessage.set(null);
    try {
      const result = await this.createOrderGQL
        .mutate({
          variables: {
            input: {
              dispensaryId: id,
              customerUserId: c.userId,
              orderType: 'in_store',
              lineItems: this.cart().map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
              })),
            },
          },
        })
        .toPromise();
      const order = result?.data?.createOrder;
      if (!order) throw new Error('Order creation returned no result');
      this.orderResult.set({
        orderId: order.orderId,
        orderStatus: order.orderStatus,
        subtotal: Number(order.subtotal),
        taxTotal: Number(order.taxTotal),
        total: Number(order.total),
        lineItemCount: order.lineItemCount,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place order';
      this.errorMessage.set(message);
    } finally {
      this.placing.set(false);
    }
  }

  protected startNewOrder(): void {
    this.cart.set([]);
    this.customer.set(null);
    this.orderResult.set(null);
    this.productSearch.set('');
    this.customerSearch.set('');
    this.errorMessage.set(null);
    this.customerResults.set([]);
  }
}
