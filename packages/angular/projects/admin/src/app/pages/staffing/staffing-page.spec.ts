import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { StaffingPage } from './staffing-page';
import { StaffingService, type ComplianceOverview, type Employee } from './staffing.service';

interface FakeArgs {
  readonly employees?: readonly Employee[];
  readonly compliance?: ComplianceOverview | null;
  readonly loading?: boolean;
  readonly error?: unknown;
}

function makeSvc(args: FakeArgs): StaffingService {
  return {
    employees: signal<readonly Employee[]>(args.employees ?? []).asReadonly(),
    compliance: signal<ComplianceOverview | null>(args.compliance ?? null).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
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
});
