import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrentSessionService } from '../../core/register-session/current-session.service';

@Component({
  selector: 'cs-register-open-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <main class="mx-auto max-w-md px-4 py-12">
      <h1 class="mb-2 text-2xl font-bold">Open register</h1>
      <p class="mb-6 text-sm text-(--color-text-muted)">
        Count the drawer and enter the opening cash. Every order you take during this shift is bound
        to this session.
      </p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <label class="block">
          <span class="mb-1 block text-sm font-medium">Opening cash (USD)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            formControlName="openingCash"
            class="min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-right text-lg tabular-nums"
            autofocus
          />
        </label>

        @if (errorMessage(); as err) {
          <p class="text-sm text-rose-700">{{ err }}</p>
        }

        <button
          type="submit"
          class="min-h-11 w-full rounded-md bg-(--color-primary) px-4 py-2 font-semibold text-white hover:bg-(--color-primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="form.invalid || submitting()"
        >
          @if (submitting()) {
            Opening…
          } @else {
            Open register
          }
        </button>
      </form>
    </main>
  `,
})
export class RegisterOpenPage {
  private readonly session = inject(CurrentSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /* eslint-disable @typescript-eslint/unbound-method */
  protected readonly form = new FormGroup({
    openingCash: new FormControl<number | null>(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      const dollars = Number(this.form.controls.openingCash.value ?? 0);
      const cents = Math.round(dollars * 100);
      await this.session.open(cents);
      const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '/';
      void this.router.navigateByUrl(redirect);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to open register';
      this.errorMessage.set(message);
    } finally {
      this.submitting.set(false);
    }
  }
}
