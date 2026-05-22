import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CashDiscountService, type CashDiscountConfig } from './cash-discount.service';
import { SettingsPage } from './settings-page';

interface FakeArgs {
  readonly config?: CashDiscountConfig | null;
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly saving?: boolean;
  readonly save?: ReturnType<typeof vi.fn>;
}

function makeSvc(args: FakeArgs): CashDiscountService {
  return {
    config: signal<CashDiscountConfig | null>(args.config ?? null).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    saving: signal<boolean>(args.saving ?? false).asReadonly(),
    save: args.save ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as CashDiscountService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeSvc(args);
  TestBed.configureTestingModule({
    imports: [SettingsPage],
    providers: [provideRouter([]), { provide: CashDiscountService, useValue: svc }],
  });
  const f = TestBed.createComponent(SettingsPage);
  f.detectChanges();
  return { fixture: f, svc };
}

function cfg(overrides: Partial<CashDiscountConfig> = {}): CashDiscountConfig {
  return {
    __typename: 'CashDiscountConfig',
    cashDiscountPercent: 0,
    isCashEnabled: false,
    cashDeliveryEnabled: true,
    ...overrides,
  } as CashDiscountConfig;
}

describe('SettingsPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the page title and two nav cards', () => {
    const { fixture } = configure({ config: cfg() });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Settings');
    expect(text).toContain('Storefront theme');
    expect(text).toContain('Payment processors');
  });

  it('nav cards link to /settings/theme and /settings/payments', () => {
    const { fixture } = configure({ config: cfg() });
    const root = fixture.nativeElement as HTMLElement;
    const themeLink = root.querySelector('a[href="/settings/theme"]');
    const paymentsLink = root.querySelector('a[href="/settings/payments"]');
    expect(themeLink).not.toBeNull();
    expect(paymentsLink).not.toBeNull();
  });

  it('shows loading state for cash discount', () => {
    const { fixture } = configure({ loading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading cash discount…');
  });

  it('shows error state for cash discount', () => {
    const { fixture } = configure({ error: new Error('boom') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain("Couldn't load cash discount: boom");
  });

  it('seeds the form from loaded config', () => {
    const { fixture } = configure({
      config: cfg({ cashDiscountPercent: 5, cashDeliveryEnabled: false }),
    });
    const root = fixture.nativeElement as HTMLElement;
    const slider = root.querySelector('input[type="range"]') as HTMLInputElement;
    const checkbox = root.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(slider.value).toBe('5');
    expect(checkbox.checked).toBe(false);
    expect(root.textContent).toContain('5%');
  });

  it('Save button is disabled while the form is clean', () => {
    const { fixture } = configure({
      config: cfg({ cashDiscountPercent: 5, cashDeliveryEnabled: true }),
    });
    const btn = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Save settings',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('moving the slider enables Save and updates the savings hint', () => {
    const { fixture } = configure({ config: cfg({ cashDiscountPercent: 0 }) });
    const root = fixture.nativeElement as HTMLElement;
    const slider = root.querySelector('input[type="range"]') as HTMLInputElement;
    slider.value = '4';
    slider.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(root.textContent).toContain('Customers save $2.00 on a $50 order');
    const btn = Array.from(root.querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Save settings',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('preview table does not render when percent is 0', () => {
    const { fixture } = configure({ config: cfg({ cashDiscountPercent: 0 }) });
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'Cash discount preview',
    );
  });

  it('preview table renders correct values when percent > 0', () => {
    const { fixture } = configure({ config: cfg({ cashDiscountPercent: 5 }) });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Cash discount preview');
    expect(text).toContain('$25.00');
    expect(text).toContain('-$1.25');
    expect(text).toContain('$23.75');
  });

  it('clicking Save invokes svc.save with current values', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      config: cfg({ cashDiscountPercent: 0, cashDeliveryEnabled: true }),
      save,
    });
    const root = fixture.nativeElement as HTMLElement;
    const slider = root.querySelector('input[type="range"]') as HTMLInputElement;
    slider.value = '3.5';
    slider.dispatchEvent(new Event('input'));
    const checkbox = root.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const saveBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Save settings',
    ) as HTMLButtonElement;
    saveBtn.click();
    await fixture.whenStable();
    expect(save).toHaveBeenCalledWith(3.5, false);
  });
});
