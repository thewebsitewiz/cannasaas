import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AgeGateService } from '../core/age-gate/age-gate.service';

const TODAY_ISO = new Date().toISOString().split('T')[0];

function computeAge(dobIso: string): number {
  const birth = new Date(dobIso);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

@Component({
  selector: 'cs-age-gate-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a1a0f] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div class="w-full max-w-md text-center">
        <div class="mb-6 flex justify-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-950">
            <svg
              class="h-10 w-10 text-emerald-300"
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
          </div>
        </div>

        <h1 id="age-gate-title" class="font-display mb-2 text-3xl font-bold text-emerald-50">
          Are you 21 or older?
        </h1>
        <p class="mb-8 text-sm text-emerald-200/70">
          You must be of legal age to view this website. By entering, you agree to our terms of
          service.
        </p>

        <div class="mb-6">
          <label
            class="mb-2 block text-xs font-medium uppercase tracking-wider text-emerald-200/70"
            for="age-gate-dob"
            >Date of Birth</label
          >
          <input
            id="age-gate-dob"
            type="date"
            class="w-full rounded-xl border border-emerald-900 bg-emerald-950 px-4 py-3 text-center text-lg text-emerald-50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400"
            [max]="todayIso"
            [value]="dob()"
            (input)="onDobInput($event)"
          />
        </div>

        @if (error()) {
          <div
            class="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-300"
            role="alert"
          >
            {{ error() }}
          </div>
        }

        <div class="flex flex-col gap-3">
          <button
            type="button"
            class="w-full rounded-xl bg-emerald-600 py-3.5 text-lg font-semibold text-emerald-50 transition-colors hover:bg-emerald-500"
            (click)="onConfirm()"
          >
            Enter Site
          </button>
          <button
            type="button"
            class="w-full py-3 text-sm text-emerald-200/70 transition-colors hover:text-emerald-50"
            (click)="onDeny()"
          >
            No, I am under 21
          </button>
        </div>

        <p class="mt-8 text-xs leading-relaxed text-emerald-200/40">
          This website contains information about cannabis products. Cannabis is only available for
          purchase in licensed dispensaries by adults aged 21 and older. Must present valid
          government-issued ID.
        </p>
      </div>
    </div>
  `,
})
export class AgeGateOverlay {
  private readonly gate = inject(AgeGateService);

  protected readonly todayIso = TODAY_ISO;
  protected readonly dob = signal('');
  protected readonly error = signal<string | null>(null);

  protected onDobInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dob.set(input.value);
    this.error.set(null);
  }

  protected onConfirm(): void {
    const value = this.dob();
    if (!value) {
      this.error.set('Please enter your date of birth');
      return;
    }
    const age = computeAge(value);
    if (age < 21) {
      this.error.set('You must be 21 or older to enter this site.');
      return;
    }
    this.gate.confirm();
  }

  protected onDeny(): void {
    if (typeof window !== 'undefined') {
      window.location.href = 'https://www.google.com';
    }
  }
}
