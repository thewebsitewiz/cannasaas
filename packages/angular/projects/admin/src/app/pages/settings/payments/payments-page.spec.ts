import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DispensaryProcessorName } from '@cannasaas/ui-ng';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { PaymentsPage } from './payments-page';
import { type ProcessorRow, PaymentsService, type TestResult } from './payments.service';

interface FakeArgs {
  readonly rows?: readonly ProcessorRow[];
  readonly active?: DispensaryProcessorName | null;
  readonly loading?: boolean;
  readonly loadError?: unknown;
  readonly busy?: DispensaryProcessorName | null;
  readonly testing?: DispensaryProcessorName | null;
  readonly testResults?: ReadonlyMap<DispensaryProcessorName, TestResult>;
  readonly errorMessage?: string | null;
  readonly setEnabled?: ReturnType<typeof vi.fn>;
  readonly setActive?: ReturnType<typeof vi.fn>;
  readonly provision?: ReturnType<typeof vi.fn>;
  readonly deprovision?: ReturnType<typeof vi.fn>;
  readonly testProcessor?: ReturnType<typeof vi.fn>;
  readonly clearError?: ReturnType<typeof vi.fn>;
}

function row(overrides: Partial<ProcessorRow> = {}): ProcessorRow {
  return {
    __typename: 'DispensaryPaymentProcessor',
    id: 'p-1',
    dispensaryId: 'disp-1',
    processorName: DispensaryProcessorName.AEROPAY,
    isEnabled: true,
    isSandbox: true,
    merchantExternalId: null,
    provisionedAt: null,
    createdAt: '2026-05-22T00:00:00Z',
    updatedAt: '2026-05-22T00:00:00Z',
    ...overrides,
  } as ProcessorRow;
}

function makeSvc(args: FakeArgs): PaymentsService {
  const rows = args.rows ?? [];
  const rowsSig = signal<readonly ProcessorRow[]>(rows).asReadonly();
  const testResults = args.testResults ?? new Map<DispensaryProcessorName, TestResult>();
  return {
    rows: rowsSig,
    active: signal<DispensaryProcessorName | null>(args.active ?? null).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.loadError ?? null).asReadonly(),
    busy: signal<DispensaryProcessorName | null>(args.busy ?? null).asReadonly(),
    testing: signal<DispensaryProcessorName | null>(args.testing ?? null).asReadonly(),
    testResults: signal<ReadonlyMap<DispensaryProcessorName, TestResult>>(testResults).asReadonly(),
    errorMessage: signal<string | null>(args.errorMessage ?? null).asReadonly(),
    rowFor: (name: DispensaryProcessorName) => rows.find((r) => r.processorName === name),
    testResultFor: (name: DispensaryProcessorName) => testResults.get(name),
    setEnabled: args.setEnabled ?? vi.fn().mockResolvedValue(undefined),
    setActive: args.setActive ?? vi.fn().mockResolvedValue(undefined),
    provision: args.provision ?? vi.fn().mockResolvedValue(undefined),
    deprovision: args.deprovision ?? vi.fn().mockResolvedValue(undefined),
    testProcessor: args.testProcessor ?? vi.fn().mockResolvedValue(undefined),
    clearError: args.clearError ?? vi.fn(),
  } as unknown as PaymentsService;
}

function makeAuth(): AuthService {
  return {
    user: () => ({ id: 'u-1', email: 'a@a.com', role: 'dispensary_admin', dispensaryId: 'disp-1' }),
  } as unknown as AuthService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeSvc(args);
  TestBed.configureTestingModule({
    imports: [PaymentsPage],
    providers: [
      provideRouter([]),
      { provide: PaymentsService, useValue: svc },
      { provide: AuthService, useValue: makeAuth() },
    ],
  });
  const f = TestBed.createComponent(PaymentsPage);
  f.detectChanges();
  return { fixture: f, svc };
}

describe('PaymentsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a loading state while the resource is fetching', () => {
    const { fixture } = configure({ loading: true });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Loading processor config');
  });

  it('renders both Aeropay and CanPay sections by default', () => {
    const { fixture } = configure();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Aeropay');
    expect(text).toContain('CanPay');
  });

  it('shows the "Active default" badge on the active processor', () => {
    const { fixture } = configure({
      rows: [row({ isEnabled: true })],
      active: DispensaryProcessorName.AEROPAY,
    });
    const root = fixture.nativeElement as HTMLElement;
    const aeropaySection = root.querySelector('section[aria-label="Aeropay processor"]');
    expect(aeropaySection?.textContent).toContain('Active default');
  });

  it('toggling the Enabled checkbox calls setEnabled', () => {
    const setEnabled = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      rows: [row({ isEnabled: false })],
      setEnabled,
    });
    const root = fixture.nativeElement as HTMLElement;
    const checkbox = root.querySelector('input[aria-label="Enable Aeropay"]') as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    expect(setEnabled).toHaveBeenCalledWith(DispensaryProcessorName.AEROPAY, true);
  });

  it('selecting "Use as default" calls setActive', () => {
    const setActive = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      rows: [row({ isEnabled: true })],
      setActive,
    });
    const radio = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Use Aeropay as default"]',
    ) as HTMLInputElement;
    radio.checked = true;
    radio.dispatchEvent(new Event('change'));
    expect(setActive).toHaveBeenCalledWith(DispensaryProcessorName.AEROPAY);
  });

  it('clicking "Provision credentials" opens the form', () => {
    const { fixture } = configure({ rows: [row({ isEnabled: true })] });
    const root = fixture.nativeElement as HTMLElement;
    const btn = Array.from(root.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').trim().startsWith('Provision credentials'),
    ) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(root.querySelector('input[aria-label="Merchant ID"]')).not.toBeNull();
    expect(root.querySelector('input[aria-label="API key"]')).not.toBeNull();
  });

  it('submitting the provision form calls provision with form values', async () => {
    const provision = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({ rows: [row({ isEnabled: true })], provision });
    const root = fixture.nativeElement as HTMLElement;
    const openBtn = Array.from(root.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').trim().startsWith('Provision credentials'),
    ) as HTMLButtonElement;
    openBtn.click();
    fixture.detectChanges();
    const merchant = root.querySelector('input[aria-label="Merchant ID"]') as HTMLInputElement;
    merchant.value = 'mer-123';
    merchant.dispatchEvent(new Event('input'));
    const apiKey = root.querySelector('input[aria-label="API key"]') as HTMLInputElement;
    apiKey.value = 'key-abc';
    apiKey.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(provision).toHaveBeenCalledWith(
      DispensaryProcessorName.AEROPAY,
      'mer-123',
      'key-abc',
      true,
    );
  });

  it('Deprovision asks for confirmation and calls deprovision on confirm', () => {
    const deprovision = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fixture } = configure({
      rows: [row({ isEnabled: true, merchantExternalId: 'mer-xyz' })],
      deprovision,
    });
    const root = fixture.nativeElement as HTMLElement;
    const btn = Array.from(root.querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Deprovision',
    ) as HTMLButtonElement;
    btn.click();
    expect(confirmSpy).toHaveBeenCalled();
    expect(deprovision).toHaveBeenCalledWith(DispensaryProcessorName.AEROPAY);
  });

  it('Deprovision skips the call if confirm is cancelled', () => {
    const deprovision = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { fixture } = configure({
      rows: [row({ isEnabled: true, merchantExternalId: 'mer-xyz' })],
      deprovision,
    });
    const root = fixture.nativeElement as HTMLElement;
    const btn = Array.from(root.querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Deprovision',
    ) as HTMLButtonElement;
    btn.click();
    expect(deprovision).not.toHaveBeenCalled();
  });

  it('renders the inline error banner when errorMessage is set', () => {
    const { fixture } = configure({ errorMessage: 'Bad API key' });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Bad API key');
  });

  it('dismiss button on the error banner calls clearError', () => {
    const clearError = vi.fn();
    const { fixture } = configure({ errorMessage: 'Bad API key', clearError });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Dismiss error"]',
    ) as HTMLButtonElement;
    btn.click();
    expect(clearError).toHaveBeenCalled();
  });

  it('renders Test connection button on provisioned rows', () => {
    const { fixture } = configure({
      rows: [row({ isEnabled: true, merchantExternalId: 'mer-xyz' })],
    });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Test connection for Aeropay"]',
    );
    expect(btn).not.toBeNull();
  });

  it('clicking Test connection calls svc.testProcessor', () => {
    const testProcessor = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      rows: [row({ isEnabled: true, merchantExternalId: 'mer-xyz' })],
      testProcessor,
    });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Test connection for Aeropay"]',
    ) as HTMLButtonElement;
    btn.click();
    expect(testProcessor).toHaveBeenCalledWith(DispensaryProcessorName.AEROPAY);
  });

  it('button reads "Testing…" and is disabled while a test is in flight', () => {
    const { fixture } = configure({
      rows: [row({ isEnabled: true, merchantExternalId: 'mer-xyz' })],
      testing: DispensaryProcessorName.AEROPAY,
    });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Test connection for Aeropay"]',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect((btn.textContent ?? '').trim()).toBe('Testing…');
  });

  it('renders a success pill with latency when the last test returned ok:true', () => {
    const results = new Map<DispensaryProcessorName, TestResult>([
      [
        DispensaryProcessorName.AEROPAY,
        {
          __typename: 'TestProcessorResult',
          ok: true,
          latencyMs: 123,
          errorMessage: null,
        } as TestResult,
      ],
    ]);
    const { fixture } = configure({
      rows: [row({ isEnabled: true, merchantExternalId: 'mer-xyz' })],
      testResults: results,
    });
    const pill = (fixture.nativeElement as HTMLElement).querySelector(
      '[aria-label="Test connection succeeded for Aeropay"]',
    );
    expect(pill?.textContent).toContain('Connected');
    expect(pill?.textContent).toContain('123ms');
  });

  it('renders a failure pill with the error message when ok:false', () => {
    const results = new Map<DispensaryProcessorName, TestResult>([
      [
        DispensaryProcessorName.AEROPAY,
        {
          __typename: 'TestProcessorResult',
          ok: false,
          latencyMs: 42,
          errorMessage: '401 bad key',
        } as TestResult,
      ],
    ]);
    const { fixture } = configure({
      rows: [row({ isEnabled: true, merchantExternalId: 'mer-xyz' })],
      testResults: results,
    });
    const pill = (fixture.nativeElement as HTMLElement).querySelector(
      '[aria-label="Test connection failed for Aeropay"]',
    );
    expect(pill?.textContent).toContain('401 bad key');
  });
});
