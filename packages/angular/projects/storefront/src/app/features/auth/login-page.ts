/* eslint-disable @typescript-eslint/unbound-method --
   Validators.* are stateless statics; the @types/forms declarations don't
   mark them with `this: void`, so referencing them in a FormControl's
   validators array trips this rule. Disabling at file scope is cleaner
   than wrapping every reference in a no-op arrow. */
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'cs-login-page',
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
          <h1 class="font-display text-2xl font-bold text-stone-900">Welcome back</h1>
          <p class="mt-1 text-sm text-stone-500">Sign in to your account</p>
        </div>

        @if (expired() === 'true') {
          <div
            class="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
            role="status"
          >
            <svg
              class="h-5 w-5 shrink-0 text-amber-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p class="text-sm text-stone-900">Your session has expired. Please sign in again.</p>
          </div>
        }

        <form class="space-y-4" [formGroup]="form" (ngSubmit)="onSubmit()">
          @if (errorMessage()) {
            <div
              class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {{ errorMessage() }}
            </div>
          }

          <div>
            <label class="mb-1 block text-sm font-medium text-stone-700" for="login-email"
              >Email</label
            >
            <input
              id="login-email"
              type="email"
              autocomplete="email"
              formControlName="email"
              placeholder="you@email.com"
              class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-stone-700" for="login-password"
              >Password</label
            >
            <input
              id="login-password"
              type="password"
              autocomplete="current-password"
              formControlName="password"
              placeholder="••••••••"
              class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <button
            type="submit"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
            [disabled]="loading() || form.invalid"
          >
            @if (loading()) {
              <span>Signing in…</span>
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
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              <span>Sign In</span>
            }
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-stone-500">
          Don't have an account?
          <a
            class="font-medium text-emerald-700 hover:text-emerald-600"
            [routerLink]="['/register']"
            >Create one</a
          >
        </p>

        <div class="mt-8 rounded-xl bg-stone-100 p-4 text-xs text-stone-500">
          <p class="mb-1 font-medium text-stone-700">Test account:</p>
          <p>customer&#64;greenleaf.com / password123</p>
        </div>
      </div>
    </div>
  `,
})
export class LoginPage {
  // Bound by withComponentInputBinding() from query params.
  readonly redirect = input<string>('/account');
  readonly expired = input<string | null>(null);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.loading()) return;
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await this.auth.login(email, password);
      void this.router.navigateByUrl(this.redirect() || '/account');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      this.errorMessage.set(message);
    } finally {
      this.loading.set(false);
    }
  }
}
