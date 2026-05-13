/* eslint-disable @typescript-eslint/unbound-method --
   Validators.* are stateless statics; the @types/forms declarations don't
   mark them with `this: void`, so referencing them in a FormControl's
   validators array trips this rule. Disabling at file scope is cleaner
   than wrapping every reference in a no-op arrow. */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { VerifyAgeGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { DispensaryContextService } from '../../core/tenant/dispensary-context.service';

interface VerifyResult {
  readonly verified: boolean;
  readonly age: number;
  readonly reason?: string | null;
}

const ID_TYPES: readonly { value: string; label: string }[] = [
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'state_id', label: 'State ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'military_id', label: 'Military ID' },
];

const ID_STATES: readonly { value: string; label: string }[] = [
  { value: 'NY', label: 'New York' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'CT', label: 'Connecticut' },
];

@Component({
  selector: 'cs-verify-age-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex min-h-[70vh] items-center justify-center px-4">
      <div class="w-full max-w-sm">
        <div class="mb-8 text-center">
          <svg
            class="mx-auto mb-3 h-10 w-10 text-emerald-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <h1 class="text-2xl font-bold text-stone-900">Age Verification</h1>
          <p class="mt-1 text-sm text-stone-500">You must be 21 or older to place an order</p>
        </div>

        @if (verifiedResult(); as r) {
          <div
            class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center"
            role="status"
          >
            <svg
              class="mx-auto mb-3 h-12 w-12 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
            <p class="text-lg font-semibold text-emerald-800">Verified! Age {{ r.age }}</p>
            <p class="mt-1 text-sm text-emerald-600">Redirecting to your account…</p>
          </div>
        } @else {
          <form class="space-y-4" [formGroup]="form" (ngSubmit)="onSubmit()">
            @if (failureMessage()) {
              <div
                class="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                role="alert"
              >
                <svg
                  class="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <path d="M12 9v4M12 17h.01" />
                  <path
                    d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                {{ failureMessage() }}
              </div>
            }

            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700" for="dob"
                >Date of Birth</label
              >
              <input
                id="dob"
                type="date"
                formControlName="dateOfBirth"
                [max]="todayIso"
                class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700" for="id-type"
                >ID Type</label
              >
              <select
                id="id-type"
                formControlName="idType"
                class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                @for (opt of idTypes; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700" for="id-state"
                >ID State</label
              >
              <select
                id="id-state"
                formControlName="idState"
                class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                @for (s of idStates; track s.value) {
                  <option [value]="s.value">{{ s.label }}</option>
                }
              </select>
            </div>

            <button
              type="submit"
              class="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
              [disabled]="loading() || form.invalid"
            >
              {{ loading() ? 'Verifying…' : 'Verify My Age' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
})
export class VerifyAgePage {
  private readonly auth = inject(AuthService);
  private readonly dispensary = inject(DispensaryContextService);
  private readonly verifyAgeGQL = inject(VerifyAgeGQL);
  private readonly router = inject(Router);

  protected readonly idTypes = ID_TYPES;
  protected readonly idStates = ID_STATES;
  protected readonly todayIso = new Date().toISOString().split('T')[0];

  protected readonly form = new FormGroup({
    dateOfBirth: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idType: new FormControl<string>('drivers_license', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idState: new FormControl<string>('NY', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected readonly loading = signal(false);
  protected readonly result = signal<VerifyResult | null>(null);

  protected readonly verifiedResult = computed(() => {
    const r = this.result();
    return r?.verified ? r : null;
  });
  protected readonly failureMessage = computed(() => {
    const r = this.result();
    if (!r || r.verified) return null;
    return r.reason ?? 'Verification failed';
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.loading()) return;
    const { dateOfBirth, idType, idState } = this.form.getRawValue();
    this.loading.set(true);
    this.result.set(null);
    try {
      const response = await firstValueFrom(
        this.verifyAgeGQL.mutate({
          variables: {
            dateOfBirth,
            idType,
            idState,
            dispensaryId: this.dispensary.entityId(),
            method: 'self_declared',
          },
        }),
      );
      const payload = response.data?.verifyAge;
      if (!payload) throw new Error('No response from verifyAge');
      this.result.set(payload);
      if (payload.verified) {
        this.auth.setAgeVerified(true);
        setTimeout(() => {
          void this.router.navigateByUrl('/account');
        }, 2000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      this.result.set({ verified: false, age: 0, reason: message });
    } finally {
      this.loading.set(false);
    }
  }
}
