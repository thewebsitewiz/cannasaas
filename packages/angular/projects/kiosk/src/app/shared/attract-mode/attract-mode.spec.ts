import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AttractMode } from './attract-mode';

/**
 * Covers the §3 "Automated coverage target" row for `AttractMode` in
 * `packages/angular/projects/kiosk/TEST-PLAN.md`:
 *
 *   "Renders when `isIdle`, slide rotation interval, tap-to-exit
 *    clears cart + resets. Use `TestBed.tick()`."
 *
 * AttractMode itself is presentational — it owns the slide rotation
 * + emits an `exit` output when tapped. The "renders when isIdle"
 * and "clears cart + resets" parts are the parent's responsibility
 * (the layout gates `@if (isIdle)` and the parent's exit handler
 * calls `CartService.clearCart()` + `IdleService.reset()`). This
 * spec verifies the unit contract: rotation timing, exit emission
 * on click + touchstart, interval cleanup on destroy.
 */

const SLIDE_INTERVAL_MS = 5000;
const SLIDE_COUNT = 3;

interface AttractModeExposed {
  exit: { emit: ReturnType<typeof vi.fn> } & {
    subscribe: (cb: (v: unknown) => void) => { unsubscribe: () => void };
  };
  slides: ReadonlyArray<{ title: string; subtitle: string; bg: string }>;
  index: () => number;
  currentSlide: () => { title: string; subtitle: string; bg: string };
}

function makeFixture() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [AttractMode] });
  const fixture = TestBed.createComponent(AttractMode);
  fixture.detectChanges();
  return {
    fixture,
    cmp: fixture.componentInstance as unknown as AttractModeExposed,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AttractMode — initial render', () => {
  it('starts on index 0 / SLIDES[0]', () => {
    const { cmp } = makeFixture();
    expect(cmp.index()).toBe(0);
    expect(cmp.currentSlide().title).toBe('Premium Cannabis');
  });

  it('exposes the full 3-slide deck', () => {
    const { cmp } = makeFixture();
    expect(cmp.slides).toHaveLength(SLIDE_COUNT);
    expect(cmp.slides.map((s) => s.title)).toEqual([
      'Premium Cannabis',
      'Tap to begin',
      'Locally grown',
    ]);
  });
});

describe('AttractMode — slide rotation interval', () => {
  it('does not advance before the 5000ms boundary', () => {
    const { cmp } = makeFixture();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS - 1);
    expect(cmp.index()).toBe(0);
  });

  it('advances to the next slide at the 5000ms boundary', () => {
    const { cmp } = makeFixture();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS);
    expect(cmp.index()).toBe(1);
    expect(cmp.currentSlide().title).toBe('Tap to begin');
  });

  it('continues rotating across multiple intervals', () => {
    const { cmp } = makeFixture();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS); // 1
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS); // 2
    expect(cmp.index()).toBe(2);
    expect(cmp.currentSlide().title).toBe('Locally grown');
  });

  it('wraps around at the end of the deck (2 → 0, not 3)', () => {
    const { cmp } = makeFixture();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS * SLIDE_COUNT); // 3 advances → wrap
    expect(cmp.index()).toBe(0);
    expect(cmp.currentSlide().title).toBe('Premium Cannabis');
  });

  it('rotates continuously over a long soak (10 cycles, no drift)', () => {
    const { cmp } = makeFixture();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS * 10);
    expect(cmp.index()).toBe(10 % SLIDE_COUNT); // = 1
  });
});

describe('AttractMode — tap-to-exit emission', () => {
  it('emits exit on host click', () => {
    const { fixture, cmp } = makeFixture();
    const spy = vi.fn();
    cmp.exit.subscribe(spy);

    fixture.nativeElement.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('emits exit on host touchstart (real kiosk hardware)', () => {
    const { fixture, cmp } = makeFixture();
    const spy = vi.fn();
    cmp.exit.subscribe(spy);

    fixture.nativeElement.dispatchEvent(
      new Event('touchstart', { bubbles: true }),
    );

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('emits exit once per gesture (no debounce — parent handles re-entry)', () => {
    const { fixture, cmp } = makeFixture();
    const spy = vi.fn();
    cmp.exit.subscribe(spy);

    fixture.nativeElement.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    fixture.nativeElement.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );

    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe('AttractMode — destroy lifecycle', () => {
  it('clears the rotation interval on destroy (no leak after teardown)', () => {
    const { fixture, cmp } = makeFixture();
    expect(cmp.index()).toBe(0);

    fixture.destroy();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS * 3);

    // Index must NOT have advanced past 0 — confirms clearInterval ran.
    expect(cmp.index()).toBe(0);
  });
});
