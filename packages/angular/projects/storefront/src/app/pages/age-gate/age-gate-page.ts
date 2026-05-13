import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DispensaryContextService } from '../../core/tenant/dispensary-context.service';
import { markVerified } from '../../core/age-gate/age-storage';

@Component({
  selector: 'cs-age-gate-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-screen items-center justify-center p-6">
      <section class="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-black/5">
        <h1 class="text-2xl font-semibold">Are you 21 or older?</h1>
        <p class="mt-2 text-sm text-stone-600">You must be 21 years of age to enter this site.</p>
        <div class="mt-6 flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700"
            (click)="confirm()"
          >
            Yes, I am 21+
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg bg-stone-200 px-4 py-3 font-medium text-stone-800 hover:bg-stone-300"
            (click)="deny()"
          >
            No
          </button>
        </div>
      </section>
    </main>
  `,
})
export class AgeGatePage {
  private readonly router = inject(Router);
  private readonly ctx = inject(DispensaryContextService);

  confirm(): void {
    const slug = this.ctx.slug() ?? this.ctx.bootstrap();
    markVerified(slug ?? 'anonymous');
    void this.router.navigateByUrl('/');
  }

  deny(): void {
    if (typeof window !== 'undefined') {
      window.location.href = 'https://www.google.com';
    }
  }
}
