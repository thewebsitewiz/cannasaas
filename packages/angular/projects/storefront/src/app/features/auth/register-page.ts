/* eslint-disable @typescript-eslint/unbound-method --
   Validators.* are stateless statics; the @types/forms declarations don't
   mark them with `this: void`, so referencing them in a FormControl's
   validators array trips this rule. Disabling at file scope is cleaner
   than wrapping every reference in a no-op arrow. */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

const passwordMatchValidator = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value as string | undefined;
  const confirm = group.get('confirm')?.value as string | undefined;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
};

@Component({
  selector: 'cs-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-[70vh] items-center justify-center px-4">
      <div class="w-full max-w-sm">
        <div class="mb-8 text-center">
          <svg
            class="mx-auto mb-3 h-10 w-10 text-emerald-700"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
            />
          </svg>
          <h1 class="text-2xl font-bold text-stone-900">Create an account</h1>
          <p class="mt-1 text-sm text-stone-500">You must be 21+ to shop</p>
        </div>

        <form class="space-y-4" [formGroup]="form" (ngSubmit)="onSubmit()">
          @if (displayedError()) {
            <div
              class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {{ displayedError() }}
            </div>
          }

          <div>
            <label class="mb-1 block text-sm font-medium text-stone-700" for="register-email"
              >Email</label
            >
            <input
              id="register-email"
              type="email"
              autocomplete="email"
              formControlName="email"
              placeholder="you@email.com"
              class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-stone-700" for="register-password"
              >Password</label
            >
            <input
              id="register-password"
              type="password"
              autocomplete="new-password"
              formControlName="password"
              placeholder="Min 8 characters"
              class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-stone-700" for="register-confirm"
              >Confirm Password</label
            >
            <input
              id="register-confirm"
              type="password"
              autocomplete="new-password"
              formControlName="confirm"
              placeholder="Repeat password"
              class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <button
            type="submit"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
            [disabled]="loading() || form.invalid"
          >
            @if (loading()) {
              <span>Creating account…</span>
            } @else {
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path
                  d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6"
                />
              </svg>
              <span>Create Account</span>
            }
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-stone-500">
          Already have an account?
          <a class="font-medium text-emerald-700 hover:text-emerald-600" [routerLink]="['/login']"
            >Sign in</a
          >
        </p>
      </div>
    </div>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup(
    {
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirm: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordMatchValidator },
  );

  protected readonly loading = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly displayedError = computed(() => {
    if (this.serverError()) return this.serverError();
    if (!this.form.touched && !this.form.dirty) return null;
    const password = this.form.controls.password;
    if (password.touched && password.errors?.['minlength']) {
      return 'Password must be at least 8 characters';
    }
    if (this.form.errors?.['mismatch'] && this.form.controls.confirm.touched) {
      return 'Passwords do not match';
    }
    return null;
  });

  async onSubmit(): Promise<void> {
    this.serverError.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    try {
      await this.auth.register(email, password);
      void this.router.navigateByUrl('/account/verify');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      this.serverError.set(message);
    } finally {
      this.loading.set(false);
    }
  }
}
