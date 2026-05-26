import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SchedulingPage } from './scheduling-page';
import {
  SchedulingService,
  type Driver,
  type DriverStats,
  type ScheduledShift,
  type TimeOff,
} from './scheduling.service';

interface FakeArgs {
  readonly shifts?: readonly ScheduledShift[];
  readonly drivers?: readonly Driver[];
  readonly driverStats?: DriverStats | null;
  readonly timeOff?: readonly TimeOff[];
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly publishing?: boolean;
  readonly weekOffset?: number;
  readonly weekStart?: string;
  readonly reassignError?: string | null;
  readonly publishWeek?: ReturnType<typeof vi.fn>;
  readonly shiftWeek?: ReturnType<typeof vi.fn>;
  readonly resetWeek?: ReturnType<typeof vi.fn>;
  readonly reassignShift?: ReturnType<typeof vi.fn>;
}

function makeSvc(args: FakeArgs): SchedulingService {
  return {
    shifts: signal<readonly ScheduledShift[]>(args.shifts ?? []).asReadonly(),
    drivers: signal<readonly Driver[]>(args.drivers ?? []).asReadonly(),
    driverStats: signal<DriverStats | null>(args.driverStats ?? null).asReadonly(),
    timeOff: signal<readonly TimeOff[]>(args.timeOff ?? []).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    publishing: signal<boolean>(args.publishing ?? false).asReadonly(),
    weekOffset: signal<number>(args.weekOffset ?? 0).asReadonly(),
    weekStart: signal<string>(args.weekStart ?? '2026-05-18').asReadonly(),
    reassignError: signal<string | null>(args.reassignError ?? null).asReadonly(),
    publishWeek: args.publishWeek ?? vi.fn().mockResolvedValue(undefined),
    shiftWeek: args.shiftWeek ?? vi.fn(),
    resetWeek: args.resetWeek ?? vi.fn(),
    reassignShift: args.reassignShift ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as SchedulingService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeSvc(args);
  TestBed.configureTestingModule({
    imports: [SchedulingPage],
    providers: [{ provide: SchedulingService, useValue: svc }],
  });
  const f = TestBed.createComponent(SchedulingPage);
  f.detectChanges();
  return { fixture: f, svc };
}

function shift(overrides: Partial<ScheduledShift> = {}): ScheduledShift {
  return {
    __typename: 'ScheduledShift',
    shiftId: 's-1',
    shiftDate: '2026-05-18',
    startTime: '09:00:00',
    endTime: '17:00:00',
    status: 'scheduled',
    published: false,
    ...overrides,
  } as ScheduledShift;
}

function driver(overrides: Partial<Driver> = {}): Driver {
  return {
    __typename: 'DriverProfile',
    driverId: 'd-1',
    vehicleMake: 'Toyota',
    vehicleModel: 'Prius',
    vehicleYear: 2022,
    vehicleColor: 'silver',
    licensePlate: 'ABC-123',
    status: 'available',
    ...overrides,
  } as Driver;
}

function timeOffReq(overrides: Partial<TimeOff> = {}): TimeOff {
  return {
    __typename: 'TimeOffRequest',
    requestId: 't-1',
    startDate: '2026-05-19',
    endDate: '2026-05-20',
    requestType: 'pto',
    reason: 'Wedding',
    status: 'pending',
    ...overrides,
  } as TimeOff;
}

describe('SchedulingPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders loading state', () => {
    const { fixture } = configure({ loading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading schedule…');
  });

  it('renders error banner', () => {
    const { fixture } = configure({ error: new Error('boom') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load schedule');
  });

  it('renders 7 day cells with Mon-Sun labels', () => {
    const { fixture } = configure({ weekStart: '2026-05-18' });
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '[aria-label^="Mon "], [aria-label^="Tue "], [aria-label^="Wed "], [aria-label^="Thu "], [aria-label^="Fri "], [aria-label^="Sat "], [aria-label^="Sun "]',
      ),
    );
    expect(labels.length).toBe(7);
  });

  it('renders a shift pill inside its day cell', () => {
    const { fixture } = configure({
      weekStart: '2026-05-18',
      shifts: [shift({ shiftDate: '2026-05-19', startTime: '10:30:00', endTime: '18:00:00' })],
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('10:30–18:00');
  });

  it('hides Publish button when all shifts are already published', () => {
    const { fixture } = configure({
      shifts: [shift({ shiftId: 'a', published: true })],
    });
    const btn = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim().startsWith('Publish '),
    );
    expect(btn).toBeUndefined();
  });

  it('shows "Publish N shifts" with the count of unpublished shifts', () => {
    const { fixture } = configure({
      shifts: [
        shift({ shiftId: 'b', published: false }),
        shift({ shiftId: 'c', published: false }),
      ],
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Publish 2 shifts');
  });

  it('clicking Publish calls svc.publishWeek', () => {
    const publishWeek = vi.fn();
    const { fixture } = configure({
      shifts: [shift({ published: false })],
      publishWeek,
    });
    const btn = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim().startsWith('Publish '),
    ) as HTMLButtonElement;
    btn.click();
    expect(publishWeek).toHaveBeenCalledTimes(1);
  });

  it('Prev/Next week buttons call svc.shiftWeek with +/-1', () => {
    const shiftWeek = vi.fn();
    const { fixture } = configure({ shiftWeek });
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('button[aria-label="Previous week"]') as HTMLButtonElement).click();
    (root.querySelector('button[aria-label="Next week"]') as HTMLButtonElement).click();
    expect(shiftWeek).toHaveBeenCalledTimes(2);
    expect(shiftWeek.mock.calls[0][0]).toBe(-1);
    expect(shiftWeek.mock.calls[1][0]).toBe(1);
  });

  it('hides Today link when weekOffset is 0', () => {
    const { fixture } = configure({ weekOffset: 0 });
    const btn = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Today',
    );
    expect(btn).toBeUndefined();
  });

  it('shows Today link when weekOffset is non-zero', () => {
    const { fixture } = configure({ weekOffset: -1 });
    const btn = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Today',
    );
    expect(btn).not.toBeUndefined();
  });

  it('renders a driver row with vehicle label + status', () => {
    const { fixture } = configure({
      drivers: [driver({ vehicleYear: 2024, vehicleMake: 'Honda', vehicleModel: 'CR-V' })],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('2024 Honda CR-V');
    expect(text).toContain('available');
  });

  it('renders driver stats when totalTrips > 0', () => {
    const { fixture } = configure({
      drivers: [driver()],
      driverStats: {
        __typename: 'DriverStats',
        totalTrips: 50,
        completed: 48,
        avgDeliveryMinutes: 22,
        avgRating: 4.7,
        totalMiles: 1230,
      } as unknown as DriverStats,
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('48');
    expect(text).toContain('Trips (30d)');
    expect(text).toContain('4.7');
    expect(text).toContain('1230');
  });

  it('renders pending time-off badge with count', () => {
    const { fixture } = configure({
      timeOff: [
        timeOffReq({ requestId: 'a', status: 'pending' }),
        timeOffReq({ requestId: 'b', status: 'pending' }),
        timeOffReq({ requestId: 'c', status: 'approved' }),
      ],
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('2 pending');
  });

  it('renders time-off request rows', () => {
    const { fixture } = configure({
      timeOff: [
        timeOffReq({
          requestType: 'sick',
          reason: 'Flu',
          startDate: '2026-05-20',
          endDate: '2026-05-22',
        }),
      ],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('2026-05-20 to 2026-05-22');
    expect(text).toContain('SICK — Flu');
  });

  it('renders empty messages when drivers / time-off are empty', () => {
    const { fixture } = configure({});
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No drivers configured');
    expect(text).toContain('No time-off requests');
  });

  // ── Drag-drop (sc-686) ─────────────────────────────────────────────────────

  it('renders shift cards with cdkDrag + day cells with cdkDropList', () => {
    const { fixture } = configure({
      weekStart: '2026-05-18',
      shifts: [shift({ shiftDate: '2026-05-19' })],
    });
    const root = fixture.nativeElement as HTMLElement;
    const dropLists = root.querySelectorAll('[cdkDropList], .cdk-drop-list');
    const drags = root.querySelectorAll('.cdk-drag');
    expect(dropLists.length).toBeGreaterThanOrEqual(7);
    expect(drags.length).toBeGreaterThanOrEqual(1);
  });

  it('dropping a shift on a different day calls svc.reassignShift with the new date', () => {
    const reassignShift = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      weekStart: '2026-05-18',
      shifts: [
        shift({
          shiftId: 's-99',
          shiftDate: '2026-05-19',
          ...({ profileId: 'p-7' } as Partial<ScheduledShift>),
        }),
      ],
      reassignShift,
    });
    // Synthesize a CdkDragDrop event onto the page handler.
    const page = fixture.componentInstance as unknown as {
      onShiftDropped: (e: unknown) => void;
    };
    page.onShiftDropped({
      previousContainer: { data: '2026-05-19' },
      container: { data: '2026-05-21' },
      item: {
        data: {
          shiftId: 's-99',
          profileId: 'p-7',
          shiftDate: '2026-05-19',
        },
      },
    });
    expect(reassignShift).toHaveBeenCalledTimes(1);
    expect(reassignShift.mock.calls[0]).toEqual(['s-99', 'p-7', '2026-05-21']);
  });

  it('dropping a shift on its own day is a no-op', () => {
    const reassignShift = vi.fn();
    const { fixture } = configure({ reassignShift });
    const page = fixture.componentInstance as unknown as {
      onShiftDropped: (e: unknown) => void;
    };
    page.onShiftDropped({
      previousContainer: { data: '2026-05-19' },
      container: { data: '2026-05-19' },
      item: { data: { shiftId: 's-1', profileId: 'p-1' } },
    });
    expect(reassignShift).not.toHaveBeenCalled();
  });

  it('renders the reassign error banner when the service reports one', () => {
    const { fixture } = configure({
      reassignError: 'Shift conflicts with existing schedule',
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Shift conflicts with existing schedule');
  });
});
