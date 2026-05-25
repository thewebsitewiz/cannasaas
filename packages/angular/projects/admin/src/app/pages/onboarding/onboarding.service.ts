import { DestroyRef, Injectable, Injector, computed, effect, inject, signal } from '@angular/core';
import {
  CreateProductGQL,
  DispensaryProcessorName,
  SaveThemeConfigGQL,
  SetDispensaryProcessorEnabledGQL,
  UpdateDispensaryForOnboardingGQL,
  UpsertBiotrackCredentialForOnboardingGQL,
  UpsertMetrcCredentialForOnboardingGQL,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
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

export type StepStatus = 'idle' | 'in_flight' | 'ok' | 'failed';
export type StepKey = 'dispensary' | 'products' | 'compliance' | 'payments' | 'theme';

export interface FinalizeProgress {
  readonly dispensary: StepStatus;
  readonly products: StepStatus;
  /** Index of the next product to attempt — survives retries so we don't double-create. */
  readonly productsCreatedCount: number;
  readonly compliance: StepStatus;
  readonly payments: StepStatus;
  readonly theme: StepStatus;
  readonly errors: Readonly<Partial<Record<StepKey, string>>>;
}

export interface FinalizeResult {
  readonly ok: boolean;
}

const INITIAL_PROGRESS: FinalizeProgress = {
  dispensary: 'idle',
  products: 'idle',
  productsCreatedCount: 0,
  compliance: 'idle',
  payments: 'idle',
  theme: 'idle',
  errors: {},
};

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
 * State + persistence + finalize for the onboarding wizard.
 *
 * **Persistence:** sessionStorage on every change (admin-wide
 * convention; React reference used localStorage).
 *
 * **finalize():** runs the per-step backend writes in order against
 * the existing schema. The combos chosen (sc-679):
 *
 *  - Dispensary Info → `updateDispensary` (name / addressLine1 / phone)
 *  - Products        → `createProduct` per row (skips on parse failure)
 *  - Compliance      → `updateDispensary` (state + licenseNumber) +
 *                      `upsertMetrcCredential` (if metrcKey set) +
 *                      `upsertBiotrackCredential` (if biotrackKey set)
 *  - Payments        → `setDispensaryProcessorEnabled` for CanPay
 *                      (cash is a separate `setCashDiscount` axis that
 *                      this wizard doesn't drive; the cash toggle here
 *                      is cosmetic — every dispensary accepts cash by
 *                      default in the API)
 *  - Theme           → `saveThemeConfig` (preset only)
 *
 * Per-step status lives in `finalizeProgress` so the component can
 * render a per-row pill + per-row error message + retry button.
 * Products tracks `productsCreatedCount` so a retry that crashed at
 * row 3 only attempts rows 3+.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _data = signal<OnboardingData>(DEFAULT_DATA);
  private readonly _step = signal<number>(0);
  private readonly _progress = signal<FinalizeProgress>(INITIAL_PROGRESS);
  private readonly _finalizing = signal<boolean>(false);

  readonly data = this._data.asReadonly();
  readonly step = this._step.asReadonly();
  readonly progressPercent = computed(() => ((this._step() + 1) / TOTAL_STEPS) * 100);
  readonly finalizeProgress = this._progress.asReadonly();
  readonly finalizing = this._finalizing.asReadonly();

  constructor() {
    const saved = loadSaved();
    this._data.set(saved.data);
    this._step.set(Math.max(0, Math.min(saved.step, TOTAL_STEPS - 1)));

    effect(() => persist({ step: this._step(), data: this._data() }));
    this.destroyRef.onDestroy(() => {
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

  /**
   * Runs the per-step writes and returns whether everything succeeded.
   * Clears persisted state + resets the wizard only on full success.
   * On partial failure, leaves state intact and surfaces per-step
   * errors via `finalizeProgress()` so the user can retry.
   */
  async finalize(): Promise<FinalizeResult> {
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) {
      this._progress.update((p) => ({
        ...p,
        dispensary: 'failed',
        errors: { ...p.errors, dispensary: 'No dispensary in scope.' },
      }));
      return { ok: false };
    }

    this._finalizing.set(true);
    try {
      await this.runDispensary(dispensaryId);
      if (this._progress().dispensary === 'failed') return { ok: false };

      await this.runProducts(dispensaryId);
      if (this._progress().products === 'failed') return { ok: false };

      await this.runCompliance(dispensaryId);
      if (this._progress().compliance === 'failed') return { ok: false };

      await this.runPayments(dispensaryId);
      if (this._progress().payments === 'failed') return { ok: false };

      await this.runTheme(dispensaryId);
      if (this._progress().theme === 'failed') return { ok: false };

      this.reset();
      return { ok: true };
    } finally {
      this._finalizing.set(false);
    }
  }

  /** Discard persisted state + reset wizard. Used post-success and by tests. */
  reset(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    this._data.set(DEFAULT_DATA);
    this._step.set(0);
    this._progress.set(INITIAL_PROGRESS);
  }

  private async runDispensary(dispensaryId: string): Promise<void> {
    const d = this._data();
    const input: Record<string, string> = {};
    if (d.name.trim()) input['name'] = d.name.trim();
    if (d.address.trim()) input['addressLine1'] = d.address.trim();
    if (d.phone.trim()) input['phone'] = d.phone.trim();
    if (Object.keys(input).length === 0) {
      this.markStep('dispensary', 'ok');
      return;
    }
    await this.runStep('dispensary', async () => {
      const gql = this.injector.get<UpdateDispensaryForOnboardingGQL>(
        UpdateDispensaryForOnboardingGQL,
      );
      await firstValueFrom(gql.mutate({ variables: { entityId: dispensaryId, input } }));
    });
  }

  private async runProducts(dispensaryId: string): Promise<void> {
    const { products } = this._data();
    if (products.length === 0) {
      this.markStep('products', 'ok');
      return;
    }
    await this.runStep('products', async () => {
      const gql = this.injector.get<CreateProductGQL>(CreateProductGQL);
      const start = this._progress().productsCreatedCount;
      for (let i = start; i < products.length; i += 1) {
        const p = products[i];
        const priceParsed = parseFloat(p.price);
        if (!p.name.trim()) {
          this.bumpProductsCount(i + 1);
          continue;
        }
        await firstValueFrom(
          gql.mutate({
            variables: {
              input: {
                dispensaryId,
                name: p.name.trim(),
                retailPrice: Number.isFinite(priceParsed) ? priceParsed : 0,
              },
            },
          }),
        );
        this.bumpProductsCount(i + 1);
      }
    });
  }

  private async runCompliance(dispensaryId: string): Promise<void> {
    const d = this._data();
    const hasStateOrLicense = !!d.state || !!d.licenseNumber.trim();
    const hasMetrc = !!d.metrcKey.trim() && !!d.state;
    const hasBiotrack = !!d.biotrackKey.trim() && !!d.state;
    if (!hasStateOrLicense && !hasMetrc && !hasBiotrack) {
      this.markStep('compliance', 'ok');
      return;
    }
    await this.runStep('compliance', async () => {
      if (hasStateOrLicense) {
        const input: Record<string, string> = {};
        if (d.state) input['state'] = d.state;
        if (d.licenseNumber.trim()) input['licenseNumber'] = d.licenseNumber.trim();
        const gql = this.injector.get<UpdateDispensaryForOnboardingGQL>(
          UpdateDispensaryForOnboardingGQL,
        );
        await firstValueFrom(gql.mutate({ variables: { entityId: dispensaryId, input } }));
      }
      if (hasMetrc) {
        const gql = this.injector.get<UpsertMetrcCredentialForOnboardingGQL>(
          UpsertMetrcCredentialForOnboardingGQL,
        );
        await firstValueFrom(
          gql.mutate({
            variables: {
              input: {
                dispensaryId,
                state: d.state,
                userApiKey: d.metrcKey.trim(),
              },
            },
          }),
        );
      }
      if (hasBiotrack) {
        const gql = this.injector.get<UpsertBiotrackCredentialForOnboardingGQL>(
          UpsertBiotrackCredentialForOnboardingGQL,
        );
        await firstValueFrom(
          gql.mutate({
            variables: {
              dispensaryId,
              state: d.state,
              apiKey: d.biotrackKey.trim(),
              apiSecret: null,
              licenseNumber: d.licenseNumber.trim() || null,
            },
          }),
        );
      }
    });
  }

  private async runPayments(dispensaryId: string): Promise<void> {
    const d = this._data();
    // Cash is a no-op here (always on by API default; the wizard's cashEnabled
    // is informational only). CanPay flips through setDispensaryProcessorEnabled.
    await this.runStep('payments', async () => {
      const gql = this.injector.get<SetDispensaryProcessorEnabledGQL>(
        SetDispensaryProcessorEnabledGQL,
      );
      await firstValueFrom(
        gql.mutate({
          variables: {
            input: {
              dispensaryId,
              processorName: DispensaryProcessorName.CANPAY,
              isEnabled: d.canPayEnabled,
            },
          },
        }),
      );
    });
  }

  private async runTheme(dispensaryId: string): Promise<void> {
    const preset = this._data().themePreset;
    await this.runStep('theme', async () => {
      const gql = this.injector.get<SaveThemeConfigGQL>(SaveThemeConfigGQL);
      await firstValueFrom(gql.mutate({ variables: { input: { dispensaryId, preset } } }));
    });
  }

  private async runStep(step: StepKey, op: () => Promise<void>): Promise<void> {
    this._progress.update((p) => ({
      ...p,
      [step]: 'in_flight',
      errors: omit(p.errors, step),
    }));
    try {
      await op();
      this.markStep(step, 'ok');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error.';
      this._progress.update((p) => ({
        ...p,
        [step]: 'failed',
        errors: { ...p.errors, [step]: message },
      }));
    }
  }

  private markStep(step: StepKey, status: StepStatus): void {
    this._progress.update((p) => ({
      ...p,
      [step]: status,
      errors: status === 'ok' ? omit(p.errors, step) : p.errors,
    }));
  }

  private bumpProductsCount(value: number): void {
    this._progress.update((p) => ({ ...p, productsCreatedCount: value }));
  }
}

function omit<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const rest = { ...obj };
  delete rest[key];
  return rest;
}
