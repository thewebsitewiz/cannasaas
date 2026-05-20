import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

/**
 * Email + password login. Mirrors the React admin LoginPage; honors a
 * `?redirect=` query param so deep-linked routes (e.g. `/orders`) loop
 * back after sign-in.
 */
@Component({
  selector: 'cs-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <section class="flex min-h-screen items-center justify-center bg-(--color-bg) px-6 py-12">
      <div
        class="w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-surface) p-8 shadow-xl"
      >
        <h1 class="font-display text-2xl font-bold text-(--color-text)">CannaSaas Admin</h1>
        <p class="mt-1 text-sm text-(--color-text-muted)">Sign in to continue.</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-6 flex flex-col gap-4">
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-semibold text-(--color-text-secondary)"> Email </span>
            <input
              type="email"
              autocomplete="username"
              formControlName="email"
              class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
            />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-semibold text-(--color-text-secondary)"> Password </span>
            <input
              type="password"
              autocomplete="current-password"
              formControlName="password"
              class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
            />
          </label>

          @if (error(); as err) {
            <div
              class="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
              role="alert"
            >
              {{ err }}
            </div>
          }

          <button
            type="submit"
            [disabled]="loading() || form.invalid"
            class="mt-2 flex h-10 items-center justify-center rounded-lg bg-(--color-primary) px-4 text-sm font-semibold text-white hover:bg-(--color-primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
          >
            @if (loading()) {
              Signing in…
            } @else {
              Sign in
            }
          </button>
        </form>
      </div>
    </section>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  /* eslint-disable @typescript-eslint/unbound-method --
   * Angular's reactive-forms API expects raw `Validators.*` references; the
   * `unbound-method` rule's `this:void` warning is a false positive for these
   * pure-function validator references.
   */
  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(1)],
    }),
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.form.controls.email.value, this.form.controls.password.value);
      const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '/';
      await this.router.navigateByUrl(redirect);
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      this.loading.set(false);
    }
  }
}
