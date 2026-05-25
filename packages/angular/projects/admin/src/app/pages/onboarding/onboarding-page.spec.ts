import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OnboardingPage } from './onboarding-page';
import {
  type FinalizeProgress,
  OnboardingService,
  type OnboardingData,
  TOTAL_STEPS,
} from './onboarding.service';

const EMPTY_DATA: OnboardingData = {
  name: '',
  address: '',
  phone: '',
  hours: '',
  products: [],
  state: '',
  licenseNumber: '',
  metrcKey: '',
  biotrackKey: '',
  cashEnabled: true,
  canPayEnabled: false,
  themePreset: 'casual',
};

const IDLE_PROGRESS: FinalizeProgress = {
  dispensary: 'idle',
  products: 'idle',
  productsCreatedCount: 0,
  compliance: 'idle',
  payments: 'idle',
  theme: 'idle',
  errors: {},
};

interface FakeArgs {
  readonly step?: number;
  readonly data?: Partial<OnboardingData>;
  readonly progress?: Partial<FinalizeProgress>;
  readonly update?: ReturnType<typeof vi.fn>;
  readonly addProduct?: ReturnType<typeof vi.fn>;
  readonly next?: ReturnType<typeof vi.fn>;
  readonly back?: ReturnType<typeof vi.fn>;
  readonly finalize?: ReturnType<typeof vi.fn>;
}

function makeSvc(args: FakeArgs): OnboardingService {
  const data: OnboardingData = { ...EMPTY_DATA, ...args.data };
  const step = args.step ?? 0;
  const progress: FinalizeProgress = {
    ...IDLE_PROGRESS,
    ...args.progress,
    errors: { ...(args.progress?.errors ?? {}) },
  };
  return {
    data: signal<OnboardingData>(data).asReadonly(),
    step: signal<number>(step).asReadonly(),
    progressPercent: signal<number>(((step + 1) / TOTAL_STEPS) * 100).asReadonly(),
    finalizeProgress: signal<FinalizeProgress>(progress).asReadonly(),
    finalizing: signal<boolean>(false).asReadonly(),
    update: args.update ?? vi.fn(),
    addProduct: args.addProduct ?? vi.fn(),
    next: args.next ?? vi.fn(),
    back: args.back ?? vi.fn(),
    setStep: vi.fn(),
    finalize: args.finalize ?? vi.fn().mockResolvedValue({ ok: true }),
    reset: vi.fn(),
  } as unknown as OnboardingService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeSvc(args);
  TestBed.configureTestingModule({
    imports: [OnboardingPage],
    providers: [provideRouter([]), { provide: OnboardingService, useValue: svc }],
  });
  const f = TestBed.createComponent(OnboardingPage);
  f.detectChanges();
  return { fixture: f, svc, router: TestBed.inject(Router) };
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the step indicator with current step + total', () => {
    const { fixture } = configure({ step: 2 });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Step 3 of 6');
  });

  it('renders all 6 step labels', () => {
    const { fixture } = configure();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    for (const label of [
      'Dispensary Info',
      'Products',
      'Compliance',
      'Payments',
      'Theme',
      'Done',
    ]) {
      expect(text).toContain(label);
    }
  });

  it('Back is disabled on step 0', () => {
    const { fixture } = configure({ step: 0 });
    const back = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Back"]',
    ) as HTMLButtonElement;
    expect(back.disabled).toBe(true);
  });

  it('Next button calls svc.next()', () => {
    const next = vi.fn();
    const { fixture } = configure({ step: 0, next });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Next"]',
    ) as HTMLButtonElement;
    btn.click();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('Back button calls svc.back()', () => {
    const back = vi.fn();
    const { fixture } = configure({ step: 3, back });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Back"]',
    ) as HTMLButtonElement;
    btn.click();
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('Dispensary Info: typing the name field calls svc.update("name", ...)', () => {
    const update = vi.fn();
    const { fixture } = configure({ step: 0, update });
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Dispensary name"]',
    ) as HTMLInputElement;
    input.value = 'Green Leaf';
    input.dispatchEvent(new Event('input'));
    expect(update).toHaveBeenCalledWith('name', 'Green Leaf');
  });

  it('Products step: adding a product calls svc.addProduct', () => {
    const addProduct = vi.fn();
    const { fixture } = configure({ step: 1, addProduct });
    const root = fixture.nativeElement as HTMLElement;
    const name = root.querySelector('input[aria-label="New product name"]') as HTMLInputElement;
    name.value = 'Blue Dream';
    name.dispatchEvent(new Event('input'));
    const price = root.querySelector('input[aria-label="New product price"]') as HTMLInputElement;
    price.value = '45';
    price.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const addBtn = Array.from(root.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').trim().startsWith('+ Add'),
    ) as HTMLButtonElement;
    expect(addBtn.disabled).toBe(false);
    addBtn.click();
    expect(addProduct).toHaveBeenCalledWith({
      name: 'Blue Dream',
      category: 'Flower',
      price: '45',
    });
  });

  it('Compliance step: changing state calls svc.update("state", ...)', () => {
    const update = vi.fn();
    const { fixture } = configure({ step: 2, update });
    const select = (fixture.nativeElement as HTMLElement).querySelector(
      'select[aria-label="State"]',
    ) as HTMLSelectElement;
    select.value = 'NY';
    select.dispatchEvent(new Event('change'));
    expect(update).toHaveBeenCalledWith('state', 'NY');
  });

  it('Payments step: toggling Cash calls svc.update("cashEnabled", false)', () => {
    const update = vi.fn();
    const { fixture } = configure({ step: 3, data: { cashEnabled: true }, update });
    const checkbox = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Enable cash payments"]',
    ) as HTMLInputElement;
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    expect(update).toHaveBeenCalledWith('cashEnabled', false);
  });

  it('Theme step: selecting a preset calls svc.update("themePreset", id)', () => {
    const update = vi.fn();
    const { fixture } = configure({ step: 4, data: { themePreset: 'casual' }, update });
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Use preset Modern Teal"]',
    ) as HTMLButtonElement;
    btn.click();
    expect(update).toHaveBeenCalledWith('themePreset', 'modern');
  });

  it('Done step: renders summary + Launch button', () => {
    const { fixture } = configure({
      step: 5,
      data: { name: 'Green Leaf', state: 'NY', cashEnabled: true, canPayEnabled: true },
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain("You're all set!");
    expect(text).toContain('Green Leaf');
    expect(text).toContain('Cash, CanPay');
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Launch your store"]',
    );
    expect(btn).not.toBeNull();
  });

  it('Launch on success: svc.finalize then navigate to /', async () => {
    const finalize = vi.fn().mockResolvedValue({ ok: true });
    const { fixture, router } = configure({ step: 5, finalize });
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Launch your store"]',
    ) as HTMLButtonElement;
    btn.click();
    await fixture.whenStable();
    expect(finalize).toHaveBeenCalledTimes(1);
    expect(navSpy).toHaveBeenCalledWith('/');
  });

  it('Launch on failure: does NOT navigate', async () => {
    const finalize = vi.fn().mockResolvedValue({ ok: false });
    const { fixture, router } = configure({
      step: 5,
      finalize,
      progress: {
        dispensary: 'failed',
        errors: { dispensary: '500 timeout' },
      },
    });
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    // Because the fixture configures dispensary='failed', the button
    // label is already "Retry launch" on first render.
    const retryBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Retry launch"]',
    ) as HTMLButtonElement;
    retryBtn.click();
    await fixture.whenStable();
    expect(finalize).toHaveBeenCalled();
    expect(navSpy).not.toHaveBeenCalled();
  });

  it('Done step: shows per-step progress rows once finalize has started', () => {
    const { fixture } = configure({
      step: 5,
      progress: {
        dispensary: 'ok',
        products: 'in_flight',
      },
    });
    const root = fixture.nativeElement as HTMLElement;
    const region = root.querySelector('[aria-label="Launch progress"]');
    expect(region).not.toBeNull();
    expect(region?.textContent).toContain('Dispensary info');
    expect(region?.textContent).toContain('Products');
  });

  it('Done step: renders the per-step error message under a failed step', () => {
    const { fixture } = configure({
      step: 5,
      progress: {
        compliance: 'failed',
        errors: { compliance: 'Metrc 401 unauthorized' },
      },
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Metrc 401 unauthorized');
  });

  it('Done step: button label flips to "Retry launch" after a failure', () => {
    const { fixture } = configure({
      step: 5,
      progress: { theme: 'failed', errors: { theme: 'theme save failed' } },
    });
    const retry = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Retry launch"]',
    );
    expect(retry).not.toBeNull();
  });
});
