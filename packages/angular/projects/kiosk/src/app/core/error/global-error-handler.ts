import { ErrorHandler, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  private readonly _lastError = signal<Error | null>(null);
  readonly lastError = this._lastError.asReadonly();

  handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[GlobalErrorHandler]', err);
    this._lastError.set(err);
  }

  reset(): void {
    this._lastError.set(null);
  }
}
