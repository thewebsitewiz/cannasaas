import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StaffingPage } from './staffing-page';
import {
  StaffingService,
  type ComplianceOverview,
  type Employee,
  type InviteStaffResult,
} from './staffing.service';

interface FakeArgs {
  readonly employees?: readonly Employee[];
  readonly compliance?: ComplianceOverview | null;
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly busyUserId?: string | null;
  readonly errorMessage?: string | null;
  readonly lastInvite?: InviteStaffResult | null;
  readonly invite?: ReturnType<typeof vi.fn>;
  readonly setRole?: ReturnType<typeof vi.fn>;
  readonly deactivate?: ReturnType<typeof vi.fn>;
  readonly clearError?: ReturnType<typeof vi.fn>;
  readonly clearLastInvite?: ReturnType<typeof vi.fn>;
}

function makeSvc(args: FakeArgs): StaffingService {
  return {
    employees: signal<readonly Employee[]>(args.employees ?? []).asReadonly(),
    compliance: signal<ComplianceOverview | null>(args.compliance ?? null).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    busyUserId: signal<string | null>(args.busyUserId ?? null).asReadonly(),
    errorMessage: signal<string | null>(args.errorMessage ?? null).asReadonly(),
    lastInvite: signal<InviteStaffResult | null>(args.lastInvite ?? null).asReadonly(),
    invite: args.invite ?? vi.fn().mockResolvedValue(undefined),
    setRole: args.setRole ?? vi.fn().mockResolvedValue(undefined),
    deactivate: args.deactivate ?? vi.fn().mockResolvedValue(undefined),
    clearError: args.clearError ?? vi.fn(),
    clearLastInvite: args.clearLastInvite ?? vi.fn(),
  } as unknown as StaffingService;
}

function configure(args: FakeArgs = {}) {
  TestBed.configureTestingModule({
    imports: [StaffingPage],
    providers: [{ provide: StaffingService, useValue: makeSvc(args) }],
  });
  const f = TestBed.createComponent(StaffingPage);
  f.detectChanges();
  return f;
}

function emp(overrides: Partial<Employee> = {}): Employee {
  return {
    __typename: 'EmployeeListItem',
    profileId: 'p-1',
    userId: 'u-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@x.com',
    role: 'budtender',
    isActive: true,
    positionName: 'Budtender',
    department: null,
    employeeNumber: 'E-001',
    hourlyRate: 18,
    employmentType: 'full_time',
    employmentStatus: 'active',
    payType: 'hourly',
    activeCerts: 2,
    expiringCerts: 0,
    ...overrides,
  } as Employee;
}

function compliance(overrides: Partial<ComplianceOverview> = {}): ComplianceOverview {
  return {
    __typename: 'ComplianceOverview',
    totalEmployees: 12,
    activeEmployees: 10,
    totalCerts: 25,
    activeCerts: 22,
    expiredCerts: 1,
    expiringSoon: 2,
    pendingCerts: 0,
    ...overrides,
  } as ComplianceOverview;
}

describe('StaffingPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders loading state', () => {
    const f = configure({ loading: true });
    expect((f.nativeElement as HTMLElement).textContent).toContain('Loading staff…');
  });

  it('renders error banner', () => {
    const f = configure({ error: new Error('disconnect') });
    const alert = (f.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load staffing');
    expect(alert?.textContent).toContain('disconnect');
  });

  it('renders KPI cards from compliance overview', () => {
    const f = configure({ compliance: compliance() });
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Active staff');
    expect(text).toContain('10');
    expect(text).toContain('Active certs');
    expect(text).toContain('22');
    expect(text).toContain('Expiring soon');
    expect(text).toContain('2');
    expect(text).toContain('Expired');
    expect(text).toContain('1');
  });

  it('computes estimated weekly payroll from active employees only', () => {
    const f = configure({
      compliance: compliance(),
      employees: [
        emp({ profileId: 'a', hourlyRate: 20, employmentStatus: 'active' }),
        emp({ profileId: 'b', hourlyRate: 30, employmentStatus: 'active' }),
        emp({ profileId: 'c', hourlyRate: 100, employmentStatus: 'inactive' }),
      ],
    });
    // (20 + 30) * 40 = 2000 — should not include the inactive 100/hr
    expect((f.nativeElement as HTMLElement).textContent).toContain('$2,000');
  });

  it('renders empty roster state when no employees', () => {
    const f = configure({ compliance: compliance(), employees: [] });
    expect((f.nativeElement as HTMLElement).textContent).toContain('No employees found.');
  });

  it('renders an employee row with name + position + rate + certs', () => {
    const f = configure({
      compliance: compliance(),
      employees: [
        emp({
          firstName: 'Grace',
          lastName: 'Hopper',
          email: 'grace@x.com',
          positionName: 'Lead Budtender',
          employeeNumber: 'E-007',
          hourlyRate: 28.5,
          activeCerts: 3,
          expiringCerts: 1,
        }),
      ],
    });
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Grace Hopper');
    expect(text).toContain('Lead Budtender');
    expect(text).toContain('$28.50/hr');
    expect(text).toContain('Full-time');
    expect(text).toContain('3');
    expect(text).toContain('(1⚠)');
    expect(text).toContain('active');
  });

  it('falls back to email when first/last names are missing', () => {
    const f = configure({
      compliance: compliance(),
      employees: [emp({ firstName: null, lastName: null, email: 'anon@x.com' })],
    });
    expect((f.nativeElement as HTMLElement).textContent).toContain('anon@x.com');
  });

  it('shows Part-time badge for non full_time employees', () => {
    const f = configure({
      compliance: compliance(),
      employees: [emp({ employmentType: 'part_time' })],
    });
    expect((f.nativeElement as HTMLElement).textContent).toContain('Part-time');
  });

  // ── Write-ops (sc-683) ────────────────────────────────────────────────

  it('Invite staff button opens the modal', () => {
    const f = configure({ compliance: compliance(), employees: [emp()] });
    const btn = (f.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Invite staff"]',
    ) as HTMLButtonElement;
    btn.click();
    f.detectChanges();
    expect(
      (f.nativeElement as HTMLElement).querySelector('[aria-label="Invite staff"][role="dialog"]'),
    ).not.toBeNull();
  });

  it('submitting the invite modal calls svc.invite with the form values', async () => {
    const invite = vi.fn().mockResolvedValue(undefined);
    const f = configure({ compliance: compliance(), employees: [emp()], invite });
    const openBtn = (f.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Invite staff"]',
    ) as HTMLButtonElement;
    openBtn.click();
    f.detectChanges();

    const root = f.nativeElement as HTMLElement;
    const email = root.querySelector('input[aria-label="Staff email"]') as HTMLInputElement;
    email.value = 'newbie@x.com';
    email.dispatchEvent(new Event('input'));
    const first = root.querySelector('input[aria-label="Staff first name"]') as HTMLInputElement;
    first.value = 'New';
    first.dispatchEvent(new Event('input'));
    const last = root.querySelector('input[aria-label="Staff last name"]') as HTMLInputElement;
    last.value = 'Hire';
    last.dispatchEvent(new Event('input'));
    const role = root.querySelector('select[aria-label="Staff role"]') as HTMLSelectElement;
    role.value = 'dispensary_admin';
    role.dispatchEvent(new Event('change'));
    f.detectChanges();

    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await f.whenStable();
    expect(invite).toHaveBeenCalledWith({
      email: 'newbie@x.com',
      firstName: 'New',
      lastName: 'Hire',
      role: 'dispensary_admin',
    });
  });

  it('changing role dropdown calls svc.setRole', () => {
    const setRole = vi.fn().mockResolvedValue(undefined);
    const f = configure({
      compliance: compliance(),
      employees: [emp({ userId: 'u-9', role: 'budtender' })],
      setRole,
    });
    const select = (f.nativeElement as HTMLElement).querySelector(
      'select[aria-label^="Role for"]',
    ) as HTMLSelectElement;
    select.value = 'dispensary_admin';
    select.dispatchEvent(new Event('change'));
    expect(setRole).toHaveBeenCalledWith('u-9', 'dispensary_admin');
  });

  it('Deactivate asks for confirm; clicking the inner Deactivate calls svc.deactivate', async () => {
    const deactivate = vi.fn().mockResolvedValue(undefined);
    const f = configure({
      compliance: compliance(),
      employees: [emp({ userId: 'u-7' })],
      deactivate,
    });
    const initial = Array.from((f.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Deactivate',
    ) as HTMLButtonElement;
    initial.click();
    f.detectChanges();
    const confirm = (f.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Confirm deactivate"]',
    ) as HTMLButtonElement;
    confirm.click();
    await f.whenStable();
    expect(deactivate).toHaveBeenCalledWith('u-7');
  });

  it('No cancels the deactivate confirm', () => {
    const deactivate = vi.fn().mockResolvedValue(undefined);
    const f = configure({
      compliance: compliance(),
      employees: [emp()],
      deactivate,
    });
    const initial = Array.from((f.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Deactivate',
    ) as HTMLButtonElement;
    initial.click();
    f.detectChanges();
    const noBtn = Array.from((f.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'No',
    ) as HTMLButtonElement;
    noBtn.click();
    f.detectChanges();
    expect(deactivate).not.toHaveBeenCalled();
    expect(
      (f.nativeElement as HTMLElement).querySelector('button[aria-label^="Confirm deactivate"]'),
    ).toBeNull();
  });

  it('deactivated row greys out and shows the (deactivated) label', () => {
    const f = configure({
      compliance: compliance(),
      employees: [emp({ isActive: false })],
    });
    const row = (f.nativeElement as HTMLElement).querySelector('tbody tr') as HTMLTableRowElement;
    expect(row.className).toContain('opacity-50');
    expect(row.textContent).toContain('(deactivated)');
  });

  it('renders the temp-password banner after a successful invite', () => {
    const f = configure({
      compliance: compliance(),
      employees: [emp()],
      lastInvite: {
        __typename: 'InviteStaffResult',
        temporaryPassword: 'abc123xyz_TEMP',
        user: {
          __typename: 'User',
          id: 'u-new',
          email: 'newbie@x.com',
          role: 'budtender',
          firstName: 'New',
          lastName: 'Hire',
          isActive: true,
        },
      } as unknown as InviteStaffResult,
    });
    const banner = (f.nativeElement as HTMLElement).querySelector('[aria-label="Invite result"]');
    expect(banner?.textContent).toContain('newbie@x.com');
    expect(banner?.textContent).toContain('abc123xyz_TEMP');
  });

  it('dismiss buttons call clearLastInvite + clearError', () => {
    const clearLastInvite = vi.fn();
    const clearError = vi.fn();
    const f = configure({
      compliance: compliance(),
      employees: [emp()],
      errorMessage: 'Bad email',
      lastInvite: {
        __typename: 'InviteStaffResult',
        temporaryPassword: 'X',
        user: { __typename: 'User', id: 'u', email: 'a@a.com', role: 'budtender' },
      } as unknown as InviteStaffResult,
      clearLastInvite,
      clearError,
    });
    const dismissInvite = (f.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Dismiss invite result"]',
    ) as HTMLButtonElement;
    dismissInvite.click();
    const dismissErr = (f.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Dismiss error"]',
    ) as HTMLButtonElement;
    dismissErr.click();
    expect(clearLastInvite).toHaveBeenCalled();
    expect(clearError).toHaveBeenCalled();
  });
});
