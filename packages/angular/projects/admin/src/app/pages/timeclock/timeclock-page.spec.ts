import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../core/auth/auth.service';
import { CsvDownloadService } from '../../core/csv/csv-download.service';
import { TimeclockPage } from './timeclock-page';
import { TimeclockService, type ActiveClock, type PayrollRow } from './timeclock.service';

interface FakeArgs {
  readonly activeClocks?: readonly ActiveClock[];
  readonly payroll?: readonly PayrollRow[];
  readonly payrollLoading?: boolean;
  readonly payrollError?: unknown;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly dispensaryId?: string | null;
  readonly setStartDate?: ReturnType<typeof vi.fn>;
  readonly setEndDate?: ReturnType<typeof vi.fn>;
  readonly downloadCsv?: ReturnType<typeof vi.fn>;
  readonly downloadingPath?: string | null;
}

function makeSvc(args: FakeArgs): TimeclockService {
  return {
    activeClocks: signal<readonly ActiveClock[]>(args.activeClocks ?? []).asReadonly(),
    payroll: signal<readonly PayrollRow[]>(args.payroll ?? []).asReadonly(),
    payrollLoading: signal<boolean>(args.payrollLoading ?? false).asReadonly(),
    payrollError: signal<unknown>(args.payrollError ?? null).asReadonly(),
    startDate: signal<string>(args.startDate ?? '2026-05-08').asReadonly(),
    endDate: signal<string>(args.endDate ?? '2026-05-22').asReadonly(),
    setStartDate: args.setStartDate ?? vi.fn(),
    setEndDate: args.setEndDate ?? vi.fn(),
  } as unknown as TimeclockService;
}

function makeAuth(dispensaryId: string | null): AuthService {
  return {
    user: () =>
      dispensaryId == null
        ? null
        : { id: 'u-1', email: 'a@a.com', role: 'dispensary_admin', dispensaryId },
  } as unknown as AuthService;
}

function makeCsv(args: FakeArgs): CsvDownloadService {
  return {
    downloading: signal<string | null>(args.downloadingPath ?? null).asReadonly(),
    download: args.downloadCsv ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as CsvDownloadService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeSvc(args);
  const csv = makeCsv(args);
  TestBed.configureTestingModule({
    imports: [TimeclockPage],
    providers: [
      { provide: TimeclockService, useValue: svc },
      {
        provide: AuthService,
        useValue: makeAuth(args.dispensaryId === undefined ? 'disp-1' : args.dispensaryId),
      },
      { provide: CsvDownloadService, useValue: csv },
    ],
  });
  const f = TestBed.createComponent(TimeclockPage);
  f.detectChanges();
  return { fixture: f, svc, csv };
}

function clock(overrides: Partial<ActiveClock> = {}): ActiveClock {
  return {
    __typename: 'ActiveClock',
    entryId: 'e-1',
    profileId: 'p-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    positionName: 'Budtender',
    clockIn: '2026-05-22T09:00:00Z',
    hoursSoFar: 3.5,
    ...overrides,
  } as ActiveClock;
}

function row(overrides: Partial<PayrollRow> = {}): PayrollRow {
  return {
    __typename: 'PayrollRow',
    employeeNumber: 'E-001',
    firstName: 'Ada',
    lastName: 'Lovelace',
    positionName: 'Budtender',
    hourlyRate: 20,
    isExempt: false,
    totalHours: 40,
    overtimeHours: 0,
    shiftsWorked: 5,
    regularPay: 800,
    grossPayWithOt: 800,
    ...overrides,
  } as PayrollRow;
}

describe('TimeclockPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the page title + auto-refresh hint', () => {
    const { fixture } = configure();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Time clock & payroll');
    expect(text).toContain('Auto-refreshes every 30s');
  });

  it('renders no-one-clocked-in copy when activeClocks is empty', () => {
    const { fixture } = configure({ activeClocks: [] });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No one currently clocked in',
    );
  });

  it('renders an active clock card with initials and hours', () => {
    const { fixture } = configure({
      activeClocks: [clock({ firstName: 'Grace', lastName: 'Hopper', hoursSoFar: 4.25 })],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Grace Hopper');
    expect(text).toContain('GH');
    expect(text).toContain('4.3h');
  });

  it('renders payroll summary KPIs from rows', () => {
    const { fixture } = configure({
      payroll: [
        row({ totalHours: 40, overtimeHours: 2, grossPayWithOt: 850 }),
        row({
          employeeNumber: 'E-002',
          totalHours: 30,
          overtimeHours: 0,
          grossPayWithOt: 600,
        }),
      ],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Employees');
    expect(text).toContain('2');
    expect(text).toContain('Total hours');
    expect(text).toContain('70.0');
    expect(text).toContain('OT hours');
    expect(text).toContain('2.0');
    expect(text).toContain('Gross pay');
    expect(text).toContain('$1,450.00');
  });

  it('falls back to regularPay when grossPayWithOt is null', () => {
    const { fixture } = configure({
      payroll: [row({ grossPayWithOt: null, regularPay: 700 })],
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('$700.00');
  });

  it('renders payroll loading state', () => {
    const { fixture } = configure({ payrollLoading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading payroll…');
  });

  it('renders payroll error banner', () => {
    const { fixture } = configure({ payrollError: new Error('boom') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load payroll');
    expect(alert?.textContent).toContain('boom');
  });

  it('renders empty payroll state', () => {
    const { fixture } = configure({ payroll: [] });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No payroll data for this period',
    );
  });

  it('highlights OT amber when overtimeHours > 0', () => {
    const { fixture } = configure({
      payroll: [row({ overtimeHours: 5 })],
    });
    const otCell = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('td')).find(
      (td) => (td.textContent ?? '').trim() === '5.0',
    );
    expect(otCell?.className).toContain('text-amber-500');
  });

  it('shows (exempt) tag on exempt rows', () => {
    const { fixture } = configure({
      payroll: [row({ isExempt: true })],
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('(exempt)');
  });

  it('changing start date calls svc.setStartDate', () => {
    const setStartDate = vi.fn();
    const { fixture } = configure({ setStartDate });
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Start date"]',
    ) as HTMLInputElement;
    input.value = '2026-04-01';
    input.dispatchEvent(new Event('change'));
    expect(setStartDate).toHaveBeenCalledWith('2026-04-01');
  });

  it('changing end date calls svc.setEndDate', () => {
    const setEndDate = vi.fn();
    const { fixture } = configure({ setEndDate });
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="End date"]',
    ) as HTMLInputElement;
    input.value = '2026-05-30';
    input.dispatchEvent(new Event('change'));
    expect(setEndDate).toHaveBeenCalledWith('2026-05-30');
  });

  it('Download CSV button renders', () => {
    const { fixture } = configure();
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Download payroll as CSV"]',
    );
    expect(btn).not.toBeNull();
  });

  it('clicking Download CSV calls /payroll/export with the current date range', async () => {
    const downloadCsv = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      startDate: '2026-05-01',
      endDate: '2026-05-22',
      downloadCsv,
    });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Download payroll as CSV"]',
    ) as HTMLButtonElement;
    btn.click();
    await fixture.whenStable();
    expect(downloadCsv).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/payroll/export',
        params: {
          dispensaryId: 'disp-1',
          startDate: '2026-05-01',
          endDate: '2026-05-22',
        },
      }),
    );
  });

  it('button is disabled + "Downloading…" while in flight', () => {
    const { fixture } = configure({ downloadingPath: '/payroll/export' });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Download payroll as CSV"]',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect((btn.textContent ?? '').trim()).toBe('Downloading…');
  });

  it('no-op when dispensary scope is unresolved', async () => {
    const downloadCsv = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({ dispensaryId: null, downloadCsv });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Download payroll as CSV"]',
    ) as HTMLButtonElement;
    btn.click();
    await fixture.whenStable();
    expect(downloadCsv).not.toHaveBeenCalled();
  });
});
