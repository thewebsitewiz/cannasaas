import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { OrderConfirmPage } from './order-confirm-page';

/**
 * Covers the §3 "Automated coverage target" row for `OrderConfirmPage`
 * in `packages/angular/projects/kiosk/TEST-PLAN.md`:
 *
 *   "Countdown ticks, manual reset, auto-redirect at zero. Fake timers."
 *
 * Initial countdown is 15s. Each 1s tick decrements by one. At 0 the
 * interval clears + `router.navigateByUrl('/')` fires. The "Start New
 * Order" button performs the same nav manually.
 */

const RESET_SECONDS = 15;

interface RouterMock {
  navigateByUrl: ReturnType<typeof vi.fn>;
}

function makeFixture(orderId: string | null, routerMock: RouterMock) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [OrderConfirmPage],
    providers: [
      { provide: Router, useValue: routerMock },
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap(orderId !== null ? { orderId } : {})),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(OrderConfirmPage);
  fixture.detectChanges();
  return fixture;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('OrderConfirmPage — initial state', () => {
  it('starts the countdown at 15 seconds', () => {
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const fixture = makeFixture('abcdef1234567890', router);
    const cmp = fixture.componentInstance as unknown as {
      countdown: () => number;
    };
    expect(cmp.countdown()).toBe(RESET_SECONDS);
  });

  it('renders shortOrderId as the first 8 chars uppercased', () => {
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const fixture = makeFixture('abcdef1234567890', router);
    const cmp = fixture.componentInstance as unknown as {
      shortOrderId: () => string;
    };
    expect(cmp.shortOrderId()).toBe('ABCDEF12');
  });

  it('falls back to "—" when route has no orderId', () => {
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const fixture = makeFixture(null, router);
    const cmp = fixture.componentInstance as unknown as {
      shortOrderId: () => string;
    };
    expect(cmp.shortOrderId()).toBe('—');
  });
});

describe('OrderConfirmPage — countdown ticks', () => {
  it('decrements by 1 after each 1s tick', () => {
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const fixture = makeFixture('test', router);
    const cmp = fixture.componentInstance as unknown as {
      countdown: () => number;
    };

    expect(cmp.countdown()).toBe(15);
    vi.advanceTimersByTime(1000);
    expect(cmp.countdown()).toBe(14);
    vi.advanceTimersByTime(1000);
    expect(cmp.countdown()).toBe(13);
  });

  it('handles partial-second advances without flipping the value', () => {
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const fixture = makeFixture('test', router);
    const cmp = fixture.componentInstance as unknown as {
      countdown: () => number;
    };

    vi.advanceTimersByTime(500);
    expect(cmp.countdown()).toBe(15);
    vi.advanceTimersByTime(499);
    expect(cmp.countdown()).toBe(15);
    vi.advanceTimersByTime(1);
    expect(cmp.countdown()).toBe(14);
  });
});

describe('OrderConfirmPage — auto-redirect at zero', () => {
  it('navigates to / when countdown reaches 0', () => {
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const fixture = makeFixture('test', router);
    const cmp = fixture.componentInstance as unknown as {
      countdown: () => number;
    };

    // Burn the full 15s window.
    vi.advanceTimersByTime(15_000);

    expect(cmp.countdown()).toBe(0);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('clears the interval at zero — no further ticks fire', () => {
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const fixture = makeFixture('test', router);
    const cmp = fixture.componentInstance as unknown as {
      countdown: () => number;
    };

    vi.advanceTimersByTime(15_000);
    expect(cmp.countdown()).toBe(0);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);

    // Advance another 10s. If the interval wasn't cleared, the
    // countdown would either go negative or trigger more navigations.
    vi.advanceTimersByTime(10_000);

    expect(cmp.countdown()).toBe(0);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
  });
});

describe('OrderConfirmPage — manual reset (Start New Order)', () => {
  it('goHome() navigates to / without waiting for the countdown', () => {
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const fixture = makeFixture('test', router);
    const cmp = fixture.componentInstance as unknown as {
      goHome: () => void;
    };

    vi.advanceTimersByTime(3000); // 3s in
    cmp.goHome();

    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('manual reset does NOT stop the countdown — the interval is left running until destroy', () => {
    // Documents the current behavior: goHome() only fires a nav.
    // The interval keeps ticking until DestroyRef.onDestroy runs (which
    // happens when Angular tears the component down post-navigation in
    // a real router). The countdown signal will still update under
    // fake timers, which is fine — the consumer is already navigating away.
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const fixture = makeFixture('test', router);
    const cmp = fixture.componentInstance as unknown as {
      countdown: () => number;
      goHome: () => void;
    };

    cmp.goHome();
    vi.advanceTimersByTime(1000);

    // Interval still alive → still ticking.
    expect(cmp.countdown()).toBe(14);
  });
});

describe('OrderConfirmPage — destroy lifecycle', () => {
  it('clears the interval when the component is destroyed', () => {
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const fixture = makeFixture('test', router);
    const cmp = fixture.componentInstance as unknown as {
      countdown: () => number;
    };

    fixture.destroy();
    vi.advanceTimersByTime(15_000);

    // Without the clearInterval in onDestroy, the countdown would
    // have ticked down to 0 and called navigateByUrl. Both must NOT
    // happen post-destroy.
    expect(cmp.countdown()).toBe(15);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
