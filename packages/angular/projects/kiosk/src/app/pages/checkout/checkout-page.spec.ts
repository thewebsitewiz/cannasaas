import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CreateOrderGQL } from '@cannasaas/ui-ng';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { KIOSK_ORDER_DEFAULTS } from '../../core/order/kiosk-order-defaults';
import { environment } from '../../../environments/environment';
import { CheckoutPage } from './checkout-page';

/**
 * Covers the §3 "Automated coverage target" row for `CheckoutPage` in
 * `packages/angular/projects/kiosk/TEST-PLAN.md`:
 *
 *   "Empty-cart guard, happy-path mutation, 401 retry, post-success
 *    cart clear + nav. Mock CreateOrderGQL."
 *
 * The actual 401 retry lives one layer down in `auth-retry-link.ts`
 * (Apollo link) — see `AuthService` spec for the
 * `clearAccessToken()` device-only-no-op safeguard. From CheckoutPage's
 * vantage point, the integration assertion is "we call
 * auth.ensureLoggedIn() BEFORE mutate, and if either throws we surface
 * the error" — the mid-call retry happens transparently below.
 */

interface CreateOrderGQLMock {
  mutate: ReturnType<typeof vi.fn>;
}

interface AuthServiceMock {
  ensureLoggedIn: ReturnType<typeof vi.fn>;
}

interface RouterMock {
  navigateByUrl: ReturnType<typeof vi.fn>;
}

interface CheckoutPageExposed {
  cart: CartService;
  loading: () => boolean;
  error: () => string | null;
  goHome: () => void;
  placeOrder: () => Promise<void>;
}

function makeComponent(
  createOrderGQL: CreateOrderGQLMock,
  router: RouterMock,
  authOverride?: AuthServiceMock,
) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: CreateOrderGQL, useValue: createOrderGQL },
      { provide: Router, useValue: router },
      ...(authOverride
        ? [{ provide: AuthService, useValue: authOverride }]
        : []),
    ],
  });
  const fixture = TestBed.createComponent(CheckoutPage);
  return {
    cmp: fixture.componentInstance as unknown as CheckoutPageExposed,
    fixture,
    cart: TestBed.inject(CartService),
  };
}

const BLUE_DREAM_ADD = {
  productId: 'p-1',
  variantId: 'v-1g',
  name: 'Blue Dream',
  variantName: '1g',
  price: 12,
};
const SOUR_DIESEL_ADD = {
  productId: 'p-2',
  variantId: 'v-sd-1g',
  name: 'Sour Diesel',
  variantName: '1g',
  price: 14,
};

beforeEach(() => {
  // CartService is providedIn: 'root' → singleton per module; wipe so
  // state from a prior `it` doesn't leak.
  TestBed.inject(CartService).clearCart();
});

describe('CheckoutPage — empty-cart guard', () => {
  it('placeOrder() is a no-op when cart is empty (no auth, no mutate, no nav)', async () => {
    const createOrderGQL: CreateOrderGQLMock = { mutate: vi.fn() };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const auth: AuthServiceMock = { ensureLoggedIn: vi.fn() };
    const { cmp } = makeComponent(createOrderGQL, router, auth);

    await cmp.placeOrder();

    expect(auth.ensureLoggedIn).not.toHaveBeenCalled();
    expect(createOrderGQL.mutate).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(cmp.loading()).toBe(false);
    expect(cmp.error()).toBeNull();
  });

  it('goHome() navigates to /', () => {
    const createOrderGQL: CreateOrderGQLMock = { mutate: vi.fn() };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(createOrderGQL, router);

    cmp.goHome();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});

describe('CheckoutPage — happy path mutation', () => {
  it('passes dispensaryId + kiosk defaults + lineItems (walk-in: no customerUserId)', async () => {
    const createOrderGQL: CreateOrderGQLMock = {
      mutate: vi
        .fn()
        .mockReturnValue(of({ data: { createOrder: { orderId: 'order-xyz' } } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const auth: AuthServiceMock = {
      ensureLoggedIn: vi.fn().mockResolvedValue('device-jwt'),
    };
    const { cmp, cart } = makeComponent(createOrderGQL, router, auth);

    cart.addItem(BLUE_DREAM_ADD);
    cart.addItem(BLUE_DREAM_ADD); // qty 2
    cart.addItem(SOUR_DIESEL_ADD); // qty 1 separate variant

    await cmp.placeOrder();

    expect(auth.ensureLoggedIn).toHaveBeenCalledOnce();
    expect(createOrderGQL.mutate).toHaveBeenCalledOnce();
    expect(createOrderGQL.mutate).toHaveBeenCalledWith({
      variables: {
        input: {
          dispensaryId: environment.dispensaryId,
          ...KIOSK_ORDER_DEFAULTS,
          lineItems: [
            { productId: 'p-1', variantId: 'v-1g', quantity: 2 },
            { productId: 'p-2', variantId: 'v-sd-1g', quantity: 1 },
          ],
          // No customerUserId on walk-in.
        },
      },
    });
  });

  it('attaches customerUserId when a customer is checked in', async () => {
    const createOrderGQL: CreateOrderGQLMock = {
      mutate: vi
        .fn()
        .mockReturnValue(of({ data: { createOrder: { orderId: 'order-1' } } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const auth: AuthServiceMock = {
      ensureLoggedIn: vi.fn().mockResolvedValue('device-jwt'),
    };
    const { cmp, cart } = makeComponent(createOrderGQL, router, auth);

    cart.addItem(BLUE_DREAM_ADD);
    cart.setCustomer({
      customerId: 'cust-42',
      firstName: 'Alex',
      lastName: 'Doe',
      loyaltyPoints: 150,
    });

    await cmp.placeOrder();

    expect(createOrderGQL.mutate).toHaveBeenCalledWith({
      variables: {
        input: {
          dispensaryId: environment.dispensaryId,
          ...KIOSK_ORDER_DEFAULTS,
          lineItems: [{ productId: 'p-1', variantId: 'v-1g', quantity: 1 }],
          customerUserId: 'cust-42',
        },
      },
    });
  });

  it('on success: clears cart + navigates to /confirm/:orderId', async () => {
    const createOrderGQL: CreateOrderGQLMock = {
      mutate: vi
        .fn()
        .mockReturnValue(of({ data: { createOrder: { orderId: 'order-abc' } } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const auth: AuthServiceMock = {
      ensureLoggedIn: vi.fn().mockResolvedValue('device-jwt'),
    };
    const { cmp, cart } = makeComponent(createOrderGQL, router, auth);

    cart.addItem(BLUE_DREAM_ADD);
    cart.setCustomer({
      customerId: 'cust-1',
      firstName: 'A',
      lastName: 'B',
      loyaltyPoints: 0,
    });

    await cmp.placeOrder();

    expect(cart.items()).toEqual([]);
    expect(cart.customer()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/confirm/order-abc');
    expect(cmp.loading()).toBe(false);
    expect(cmp.error()).toBeNull();
  });
});

describe('CheckoutPage — auth gateway (401 retry surface)', () => {
  it('calls auth.ensureLoggedIn BEFORE mutate', async () => {
    const callOrder: string[] = [];
    const auth: AuthServiceMock = {
      ensureLoggedIn: vi.fn(() => {
        callOrder.push('auth');
        return Promise.resolve('jwt');
      }),
    };
    const createOrderGQL: CreateOrderGQLMock = {
      mutate: vi.fn().mockImplementation(() => {
        callOrder.push('mutate');
        return of({ data: { createOrder: { orderId: 'order-1' } } });
      }),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, cart } = makeComponent(createOrderGQL, router, auth);
    cart.addItem(BLUE_DREAM_ADD);

    await cmp.placeOrder();

    expect(callOrder).toEqual(['auth', 'mutate']);
  });

  it('when ensureLoggedIn throws KIOSK_NOT_PROVISIONED: surface error, no mutate, cart preserved', async () => {
    const auth: AuthServiceMock = {
      ensureLoggedIn: vi.fn().mockRejectedValue(new Error('KIOSK_NOT_PROVISIONED')),
    };
    const createOrderGQL: CreateOrderGQLMock = { mutate: vi.fn() };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, cart } = makeComponent(createOrderGQL, router, auth);
    cart.addItem(BLUE_DREAM_ADD);

    await cmp.placeOrder();

    expect(createOrderGQL.mutate).not.toHaveBeenCalled();
    expect(cart.items()).toHaveLength(1); // NOT cleared
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(cmp.loading()).toBe(false);
    expect(cmp.error()).toBe('KIOSK_NOT_PROVISIONED');
  });
});

describe('CheckoutPage — error paths', () => {
  it('mutation network/GraphQL error: surface message, cart preserved, no nav', async () => {
    const createOrderGQL: CreateOrderGQLMock = {
      mutate: vi
        .fn()
        .mockReturnValue(throwError(() => new Error('Network down'))),
    };
    const auth: AuthServiceMock = {
      ensureLoggedIn: vi.fn().mockResolvedValue('jwt'),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, cart } = makeComponent(createOrderGQL, router, auth);
    cart.addItem(BLUE_DREAM_ADD);

    await cmp.placeOrder();

    expect(cart.items()).toHaveLength(1); // preserved → user can retry
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(cmp.loading()).toBe(false);
    expect(cmp.error()).toBe('Network down');
  });

  it('response without orderId: surface "Order failed — please try again", cart preserved', async () => {
    const createOrderGQL: CreateOrderGQLMock = {
      mutate: vi.fn().mockReturnValue(of({ data: { createOrder: null } })),
    };
    const auth: AuthServiceMock = {
      ensureLoggedIn: vi.fn().mockResolvedValue('jwt'),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, cart } = makeComponent(createOrderGQL, router, auth);
    cart.addItem(BLUE_DREAM_ADD);

    await cmp.placeOrder();

    expect(cart.items()).toHaveLength(1);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(cmp.error()).toBe('Order failed — please try again');
    expect(cmp.loading()).toBe(false);
  });

  it('non-Error thrown value: falls back to "Order failed"', async () => {
    const createOrderGQL: CreateOrderGQLMock = {
      mutate: vi.fn().mockReturnValue(throwError(() => 'some string')),
    };
    const auth: AuthServiceMock = {
      ensureLoggedIn: vi.fn().mockResolvedValue('jwt'),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, cart } = makeComponent(createOrderGQL, router, auth);
    cart.addItem(BLUE_DREAM_ADD);

    await cmp.placeOrder();

    expect(cmp.error()).toBe('Order failed');
  });

  it('clears a previous error on the next placeOrder attempt', async () => {
    const createOrderGQL: CreateOrderGQLMock = { mutate: vi.fn() };
    let mutationCount = 0;
    createOrderGQL.mutate.mockImplementation(() => {
      mutationCount += 1;
      return mutationCount === 1
        ? throwError(() => new Error('first failure'))
        : of({ data: { createOrder: { orderId: 'order-after-retry' } } });
    });
    const auth: AuthServiceMock = {
      ensureLoggedIn: vi.fn().mockResolvedValue('jwt'),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, cart } = makeComponent(createOrderGQL, router, auth);
    cart.addItem(BLUE_DREAM_ADD);

    await cmp.placeOrder();
    expect(cmp.error()).toBe('first failure');

    await cmp.placeOrder();
    expect(cmp.error()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/confirm/order-after-retry');
  });
});

describe('CheckoutPage — re-entry guard', () => {
  it('second placeOrder() while still loading is a no-op (single mutation)', async () => {
    // Use a promise we can resolve later to keep the first placeOrder
    // suspended in its await.
    let resolveAuth!: (token: string) => void;
    const authPromise = new Promise<string>((res) => {
      resolveAuth = res;
    });
    const auth: AuthServiceMock = {
      ensureLoggedIn: vi.fn().mockReturnValue(authPromise),
    };
    const createOrderGQL: CreateOrderGQLMock = {
      mutate: vi
        .fn()
        .mockReturnValue(of({ data: { createOrder: { orderId: 'order-1' } } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, cart } = makeComponent(createOrderGQL, router, auth);
    cart.addItem(BLUE_DREAM_ADD);

    const first = cmp.placeOrder();
    expect(cmp.loading()).toBe(true);

    // Second tap while loading — no extra calls.
    await cmp.placeOrder();
    expect(auth.ensureLoggedIn).toHaveBeenCalledOnce();
    expect(createOrderGQL.mutate).not.toHaveBeenCalled();

    // Now let the first complete.
    resolveAuth('jwt');
    await first;

    expect(createOrderGQL.mutate).toHaveBeenCalledOnce();
    expect(cmp.loading()).toBe(false);
  });
});
