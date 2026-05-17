import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CurrentSessionService } from '../../core/register-session/current-session.service';

@Component({
  selector: 'cs-register-close-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <main class="mx-auto max-w-md px-4 py-12">
      <h1 class="mb-2 text-2xl font-bold">Close register</h1>

      @if (session.activeSession(); as s) {
        <p class="mb-6 text-sm text-(--color-text-muted)">
          Opened with \${{ (s.openingCashCents / 100).toFixed(2) }}. Count the drawer now and enter
          the closing cash.
        </p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <label class="block">
            <span class="mb-1 block text-sm font-medium">Closing cash (USD)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              formControlName="closingCash"
              class="min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-right text-lg tabular-nums"
              autofocus
            />
          </label>

          @if (variance() !== null) {
            <p
              class="rounded-md border px-3 py-2 text-sm tabular-nums"
              [class.border-(--color-border)]="variance() === 0"
              [class.border-emerald-300]="(variance() ?? 0) > 0"
              [class.bg-emerald-50]="(variance() ?? 0) > 0"
              [class.text-emerald-700]="(variance() ?? 0) > 0"
              [class.border-rose-300]="(variance() ?? 0) < 0"
              [class.bg-rose-50]="(variance() ?? 0) < 0"
              [class.text-rose-700]="(variance() ?? 0) < 0"
            >
              Variance:
              <strong>
                {{ (variance() ?? 0) >= 0 ? '+' : '' }}\${{ ((variance() ?? 0) / 100).toFixed(2) }}
              </strong>
              @if ((variance() ?? 0) > 0) {
                (over)
              } @else if ((variance() ?? 0) < 0) {
                (short)
              }
            </p>
          }

          @if (errorMessage(); as err) {
            <p class="text-sm text-rose-700">{{ err }}</p>
          }

          <button
            type="submit"
            class="min-h-11 w-full rounded-md bg-(--color-primary) px-4 py-2 font-semibold text-white hover:bg-(--color-primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
            [disabled]="form.invalid || submitting()"
          >
            @if (submitting()) {
              Closing…
            } @else {
              Close register
            }
          </button>
        </form>
      } @else {
        <p class="text-sm text-(--color-text-muted)">No open register session.</p>
      }
    </main>
  `,
})
export class RegisterClosePage {
  protected readonly session = inject(CurrentSessionService);
  private readonly router = inject(Router);

  /* eslint-disable @typescript-eslint/unbound-method */
  protected readonly form = new FormGroup({
    closingCash: new FormControl<number | null>(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly closingCashCents = signal(0);

  protected readonly variance = computed<number | null>(() => {
    const opening = this.session.activeSession()?.openingCashCents;
    if (opening == null) return null;
    return this.closingCashCents() - opening;
  });

  constructor() {
    this.form.controls.closingCash.valueChanges.subscribe((value) => {
      const dollars = Number(value ?? 0);
      this.closingCashCents.set(Math.round(dollars * 100));
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      await this.session.close(this.closingCashCents());
      void this.router.navigateByUrl('/register/open');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to close register';
      this.errorMessage.set(message);
    } finally {
      this.submitting.set(false);
    }
  }
}
