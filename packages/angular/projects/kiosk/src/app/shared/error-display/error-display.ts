import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GlobalErrorHandler } from '../../core/error/global-error-handler';

@Component({
  selector: 'cs-error-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (handler.lastError(); as err) {
      <div
        class="fixed inset-x-4 top-4 z-50 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-lg"
        role="alert"
      >
        <div class="space-y-2 text-center">
          <h2 class="text-lg font-semibold text-red-700">Something went wrong</h2>
          <p class="text-sm text-red-600/80">{{ err.message }}</p>
          <button
            type="button"
            (click)="handler.reset()"
            class="mt-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white active:scale-95"
          >
            Dismiss
          </button>
        </div>
      </div>
    }
  `,
})
export class ErrorDisplay {
  protected readonly handler = inject(GlobalErrorHandler);
}
