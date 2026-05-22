import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';

import { THEME_PRESETS, type ThemePreset } from '../settings/theme/theme-presets';

export interface OnboardingProduct {
  readonly name: string;
  readonly category: string;
  readonly price: string;
}

export interface OnboardingData {
  readonly name: string;
  readonly address: string;
  readonly phone: string;
  readonly hours: string;
  readonly products: readonly OnboardingProduct[];
  readonly state: string;
  readonly licenseNumber: string;
  readonly metrcKey: string;
  readonly biotrackKey: string;
  readonly cashEnabled: boolean;
  readonly canPayEnabled: boolean;
  readonly themePreset: string;
}

export const ONBOARDING_PRESETS: readonly ThemePreset[] = THEME_PRESETS;

const DEFAULT_DATA: OnboardingData = {
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

const STORAGE_KEY = 'cs.admin.onboarding';
export const TOTAL_STEPS = 6;

interface SavedState {
  readonly step: number;
  readonly data: OnboardingData;
}

function loadSaved(): SavedState {
  if (typeof sessionStorage === 'undefined') return { step: 0, data: DEFAULT_DATA };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { step: 0, data: DEFAULT_DATA };
    const parsed = JSON.parse(raw) as SavedState;
    return { step: parsed.step ?? 0, data: { ...DEFAULT_DATA, ...parsed.data } };
  } catch {
    return { step: 0, data: DEFAULT_DATA };
  }
}

function persist(state: SavedState): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * State + persistence for the multi-step onboarding wizard.
 *
 * **Persistence:** progress is mirrored to sessionStorage on every
 * change so a page refresh keeps the user where they left off. Per
 * admin/CLAUDE.md we use sessionStorage (not localStorage like the
 * React reference) to match the admin's overall storage profile.
 *
 * **Mutations intentionally not wired here.** The React reference
 * calls `createDispensary`, `saveCompliance`, `savePaymentConfig`,
 * and `saveThemeConfig` on finalize, but:
 * - `createDispensary` schema signature has diverged from React's
 *   input shape (requires companyId / slug / addressLine1)
 * - `saveCompliance` and `savePaymentConfig` aren't in the schema
 * - Only `saveThemeConfig` is safely callable today
 *
 * Until the backend ops align, the service exposes `finalize()`
 * that clears persisted state. The PR describes the follow-up
 * story needed to wire the four mutations.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly destroyRef = inject(DestroyRef);

  private readonly _data = signal<OnboardingData>(DEFAULT_DATA);
  private readonly _step = signal<number>(0);

  readonly data = this._data.asReadonly();
  readonly step = this._step.asReadonly();
  readonly progressPercent = computed(() => ((this._step() + 1) / TOTAL_STEPS) * 100);

  constructor() {
    const saved = loadSaved();
    this._data.set(saved.data);
    this._step.set(Math.max(0, Math.min(saved.step, TOTAL_STEPS - 1)));

    effect(() => persist({ step: this._step(), data: this._data() }));
    this.destroyRef.onDestroy(() => {
      // Snapshot one more time on teardown so a navigation away mid-edit
      // doesn't lose pending input.
      persist({ step: this._step(), data: this._data() });
    });
  }

  setStep(step: number): void {
    this._step.set(Math.max(0, Math.min(step, TOTAL_STEPS - 1)));
  }

  next(): void {
    this.setStep(this._step() + 1);
  }

  back(): void {
    this.setStep(this._step() - 1);
  }

  update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]): void {
    this._data.update((prev) => ({ ...prev, [key]: value }) as OnboardingData);
  }

  addProduct(product: OnboardingProduct): void {
    if (!product.name || !product.price) return;
    this._data.update((prev) => ({
      ...prev,
      products: [...prev.products, product],
    }));
  }

  finalize(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    this._data.set(DEFAULT_DATA);
    this._step.set(0);
  }
}
