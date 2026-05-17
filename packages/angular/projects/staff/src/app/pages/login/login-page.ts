import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'cs-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <main class="mx-auto max-w-md px-4 py-16">
      <h1 class="mb-2 text-2xl font-bold">Staff sign in</h1>
      @if (reasonMessage(); as msg) {
        <p
          class="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          {{ msg }}
        </p>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <label class="block">
          <span class="mb-1 block text-sm font-medium">Email</span>
          <input
            type="email"
            formControlName="email"
            autocomplete="username"
            class="w-full rounded-md border border-stone-300 bg-white px-3 py-2"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium">Password</span>
          <input
            type="password"
            formControlName="password"
            autocomplete="current-password"
            class="w-full rounded-md border border-stone-300 bg-white px-3 py-2"
          />
        </label>

        @if (errorMessage(); as err) {
          <p class="text-sm text-rose-700">{{ err }}</p>
        }

        <button
          type="submit"
          class="w-full rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="form.invalid || loading()"
        >
          @if (loading()) {
            Signing in…
          } @else {
            Sign in
          }
        </button>
      </form>
    </main>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly reasonMessage = (): string | null => {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'no-dispensary') {
      return "Your account isn't scoped to a dispensary yet. Ask an admin to assign you to one.";
    }
    return null;
  };

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '/';
      void this.router.navigateByUrl(redirect);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      this.errorMessage.set(message);
    } finally {
      this.loading.set(false);
    }
  }
}
