import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { environment } from '../../../environments/environment';
import { IdleService } from './idle.service';

/**
 * Covers the §3 "Automated coverage target" row for `IdleService` in
 * `packages/angular/projects/kiosk/TEST-PLAN.md`:
 *
 *   "Fires `isIdle` after timeout, suppresses further fires until
 *    `reset()`, listens on all 3 event types. Use fake timers; do not
 *    rely on real `setTimeout`."
 */

const ACTIVITY_EVENTS = ['pointerdown', 'touchstart', 'keydown'] as const;
const TIMEOUT_MS = environment.idleTimeoutMs;

interface DocumentLike {
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

function makeDocumentMock(): DocumentLike {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

function makeService(docMock: DocumentLike): IdleService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [IdleService, { provide: DOCUMENT, useValue: docMock }],
  });
  return TestBed.inject(IdleService);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('IdleService — event registration', () => {
  it('listens on pointerdown / touchstart / keydown when start() is called', () => {
    const doc = makeDocumentMock();
    const service = makeService(doc);

    service.start();

    expect(doc.addEventListener).toHaveBeenCalledTimes(3);
    const registeredEvents = doc.addEventListener.mock.calls.map(
      (call) => call[0] as string,
    );
    expect(registeredEvents.sort()).toEqual([...ACTIVITY_EVENTS].sort());
  });

  it('start() is idempotent — second call does NOT re-register listeners', () => {
    const doc = makeDocumentMock();
    const service = makeService(doc);

    service.start();
    service.start();

    expect(doc.addEventListener).toHaveBeenCalledTimes(3);
  });

  it('stop() removes all three event listeners', () => {
    const doc = makeDocumentMock();
    const service = makeService(doc);

    service.start();
    service.stop();

    expect(doc.removeEventListener).toHaveBeenCalledTimes(3);
    const removed = doc.removeEventListener.mock.calls.map(
      (call) => call[0] as string,
    );
    expect(removed.sort()).toEqual([...ACTIVITY_EVENTS].sort());
  });

  it('stop() is idempotent — calling without start is a safe no-op', () => {
    const doc = makeDocumentMock();
    const service = makeService(doc);

    service.stop();

    expect(doc.removeEventListener).not.toHaveBeenCalled();
  });

  it('start() then stop() then start() re-registers cleanly', () => {
    const doc = makeDocumentMock();
    const service = makeService(doc);

    service.start();
    service.stop();
    service.start();

    expect(doc.addEventListener).toHaveBeenCalledTimes(6); // 3 × 2 cycles
  });
});

describe('IdleService — timeout behavior', () => {
  it('does not fire isIdle before the timeout elapses', () => {
    const doc = makeDocumentMock();
    const service = makeService(doc);

    service.start();
    vi.advanceTimersByTime(TIMEOUT_MS - 1);

    expect(service.isIdle()).toBe(false);
  });

  it('fires isIdle exactly at the timeout boundary', () => {
    const doc = makeDocumentMock();
    const service = makeService(doc);

    service.start();
    vi.advanceTimersByTime(TIMEOUT_MS);

    expect(service.isIdle()).toBe(true);
  });

  it('does NOT schedule a fire if start() was never called', () => {
    const doc = makeDocumentMock();
    const service = makeService(doc);

    vi.advanceTimersByTime(TIMEOUT_MS * 2);

    expect(service.isIdle()).toBe(false);
  });
});

describe('IdleService — activity resets the timer (pre-idle)', () => {
  /**
   * Grab the listener callback the service registered, then invoke it to
   * simulate a user gesture. Avoids dispatching a real DOM event since
   * `DOCUMENT` is fully mocked.
   */
  function getActivityHandler(doc: DocumentLike): () => void {
    const call = doc.addEventListener.mock.calls[0];
    return call?.[1] as () => void;
  }

  it('a single activity event halfway through the window pushes the fire out', () => {
    const doc = makeDocumentMock();
    const service = makeService(doc);

    service.start();
    vi.advanceTimersByTime(TIMEOUT_MS / 2);
    expect(service.isIdle()).toBe(false);

    // Simulate the user touching the screen at the halfway mark.
    getActivityHandler(doc)();

    // The remaining half of the original window should NOT fire.
    vi.advanceTimersByTime(TIMEOUT_MS / 2);
    expect(service.isIdle()).toBe(false);

    // A full timeout from the activity moment fires.
    vi.advanceTimersByTime(TIMEOUT_MS / 2);
    expect(service.isIdle()).toBe(true);
  });
});

describe('IdleService — suppresses further fires until reset()', () => {
  function getActivityHandler(doc: DocumentLike): () => void {
    const call = doc.addEventListener.mock.calls[0];
    return call?.[1] as () => void;
  }

  it('activity events after isIdle do NOT clear the state or reschedule', () => {
    const doc = makeDocumentMock();
    const service = makeService(doc);

    service.start();
    vi.advanceTimersByTime(TIMEOUT_MS);
    expect(service.isIdle()).toBe(true);

    // User taps inside the attract overlay — handler runs, but the
    // service intentionally ignores it. The AttractMode component is
    // the only thing allowed to clear idle (via reset()).
    getActivityHandler(doc)();
    vi.advanceTimersByTime(TIMEOUT_MS);

    expect(service.isIdle()).toBe(true);
  });

  it('reset() clears isIdle and restarts the timer', () => {
    const doc = makeDocumentMock();
    const service = makeService(doc);

    service.start();
    vi.advanceTimersByTime(TIMEOUT_MS);
    expect(service.isIdle()).toBe(true);

    service.reset();

    expect(service.isIdle()).toBe(false);

    // After reset, a full new timeout window must elapse before the
    // next fire — confirms the timer was rescheduled, not left stale.
    vi.advanceTimersByTime(TIMEOUT_MS - 1);
    expect(service.isIdle()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(service.isIdle()).toBe(true);
  });

  it('reset() before start() clears isIdle but does NOT schedule a fire', () => {
    const doc = makeDocumentMock();
    const service = makeService(doc);

    // Manually flip the signal via a reset — equivalent to a stale
    // idle state being carried in from a prior session.
    service.reset();
    vi.advanceTimersByTime(TIMEOUT_MS * 2);

    // No start() means no scheduled fire.
    expect(service.isIdle()).toBe(false);
  });
});
