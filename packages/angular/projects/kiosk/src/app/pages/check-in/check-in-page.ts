import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cs-check-in-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex min-h-screen items-center justify-center p-8 text-center">
      <div>
        <h1 class="text-3xl font-light text-gray-900">Check in</h1>
        <p class="mt-2 text-sm text-gray-400">
          Phone-number identification port pending.
        </p>
      </div>
    </section>
  `,
})
export class CheckInPage {}
