import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';

import { CartService } from '../../core/cart/cart.service';
import { KioskLayout } from './kiosk-layout';

/**
 * Covers the §3 "Automated coverage target" row for `KioskLayout` in
 * `packages/angular/projects/kiosk/TEST-PLAN.md`:
 *
 *   "Back button hides on `/`, cart badge reflects `itemCount`, reset
 *    button clears cart. Snapshot or text assertion."
 *
 * Tests target the protected class methods + computed signals directly
 * (matches the existing kiosk-spec style — keeps the test free of full
 * RouterLink / `createUrlTree` template wiring).
 */

interface RouterMock {
  events: ReturnType<typeof Subject.prototype.asObservable>;
  url: string;
  navigateByUrl: ReturnType<typeof vi.fn>;
}

interface LocationMock {
  back: ReturnType<typeof vi.fn>;
}

interface KioskLayoutExposed {
  isHome: () => boolean;
  itemCount: () => number;
  customer: () => unknown;
  goBack: () => void;
  reset: () => void;
}

function makeLayout(
  initialUrl: string,
  events: Subject<NavigationEnd>,
): {
  layout: KioskLayoutExposed;
  router: RouterMock;
  location: LocationMock;
  cart: CartService;
} {
  TestBed.resetTestingModule();
  const router: RouterMock = {
    events: events.asObservable(),
    url: initialUrl,
    navigateByUrl: vi.fn(),
  };
  const location: LocationMock = { back: vi.fn() };

  TestBed.configureTestingModule({
    providers: [
      { provide: Router, useValue: router },
      { provide: Location, useValue: location },
    ],
  });

  const layout = TestBed.runInInjectionContext(
    () => new KioskLayout() as unknown as KioskLayoutExposed,
  );
  const cart = TestBed.inject(CartService);
  return { layout, router, location, cart };
}

function navEnd(url: string): NavigationEnd {
  return new NavigationEnd(1, url, url);
}

beforeEach(() => {
  // CartService is providedIn: 'root' → TestBed gives us a singleton
  // per module. Wipe it between tests so customer + items don't leak.
  const cart = TestBed.inject(CartService);
  cart.clearCart();
});

describe('KioskLayout — back button (isHome) visibility', () => {
  it('isHome is true on initial / URL (back button hides)', () => {
    const events = new Subject<NavigationEnd>();
    const { layout } = makeLayout('/', events);
    expect(layout.isHome()).toBe(true);
  });

  it('isHome is false on non-root URL (back button shows)', () => {
    const events = new Subject<NavigationEnd>();
    const { layout } = makeLayout('/cart', events);
    expect(layout.isHome()).toBe(false);
  });

  it('reactively flips when a NavigationEnd to / fires', () => {
    const events = new Subject<NavigationEnd>();
    const { layout } = makeLayout('/cart', events);
    expect(layout.isHome()).toBe(false);

    events.next(navEnd('/'));

    expect(layout.isHome()).toBe(true);
  });

  it('reactively flips when a NavigationEnd away from / fires', () => {
    const events = new Subject<NavigationEnd>();
    const { layout } = makeLayout('/', events);
    expect(layout.isHome()).toBe(true);

    events.next(navEnd('/product/abc'));

    expect(layout.isHome()).toBe(false);
  });
});

describe('KioskLayout — cart badge (itemCount)', () => {
  it('itemCount is 0 on an empty cart (badge hidden)', () => {
    const events = new Subject<NavigationEnd>();
    const { layout } = makeLayout('/', events);
    expect(layout.itemCount()).toBe(0);
  });

  it('reflects the current CartService.itemCount when items are added', () => {
    const events = new Subject<NavigationEnd>();
    const { layout, cart } = makeLayout('/', events);

    cart.addItem({
      productId: 'p-1',
      variantId: 'v-1',
      name: 'Blue Dream',
      variantName: '1g',
      price: 12,
    });
    cart.addItem({
      productId: 'p-1',
      variantId: 'v-1',
      name: 'Blue Dream',
      variantName: '1g',
      price: 12,
    });

    expect(layout.itemCount()).toBe(2);
  });

  it('drops back to 0 after the cart is cleared', () => {
    const events = new Subject<NavigationEnd>();
    const { layout, cart } = makeLayout('/', events);

    cart.addItem({
      productId: 'p-1',
      variantId: 'v-1',
      name: 'Blue Dream',
      variantName: '1g',
      price: 12,
    });
    cart.clearCart();

    expect(layout.itemCount()).toBe(0);
  });
});

describe('KioskLayout — reset button', () => {
  it('clears the cart AND navigates to /', () => {
    const events = new Subject<NavigationEnd>();
    const { layout, router, cart } = makeLayout('/checkout', events);

    cart.addItem({
      productId: 'p-1',
      variantId: 'v-1',
      name: 'Blue Dream',
      variantName: '1g',
      price: 12,
    });
    cart.setCustomer({
      customerId: 'c-1',
      firstName: 'Alex',
      lastName: 'Doe',
      loyaltyPoints: 100,
    });

    layout.reset();

    expect(cart.items()).toEqual([]);
    expect(cart.customer()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});

describe('KioskLayout — goBack', () => {
  it('delegates to Location.back()', () => {
    const events = new Subject<NavigationEnd>();
    const { layout, location } = makeLayout('/cart', events);

    layout.goBack();

    expect(location.back).toHaveBeenCalledTimes(1);
  });
});

describe('KioskLayout — customer pill', () => {
  it('exposes the current CartService.customer (null = "Check In")', () => {
    const events = new Subject<NavigationEnd>();
    const { layout } = makeLayout('/', events);
    expect(layout.customer()).toBeNull();
  });

  it('reflects the checked-in customer for the pill template', () => {
    const events = new Subject<NavigationEnd>();
    const { layout, cart } = makeLayout('/', events);

    cart.setCustomer({
      customerId: 'c-1',
      firstName: 'Alex',
      lastName: 'Doe',
      loyaltyPoints: 250,
    });

    expect(layout.customer()).toMatchObject({
      customerId: 'c-1',
      firstName: 'Alex',
      loyaltyPoints: 250,
    });
  });
});
