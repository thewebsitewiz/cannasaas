import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

const ACTIVITY_EVENTS = ['pointerdown', 'touchstart', 'keydown'] as const;

/**
 * Tracks whether the kiosk has been idle for `environment.idleTimeoutMs`.
 * Once idle, activity events are intentionally ignored — only an explicit
 * `reset()` (called by AttractMode's tap-to-exit) clears the state. That
 * avoids the listener tearing down the overlay before the click handler
 * on the overlay itself can run.
 */
@Injectable({ providedIn: 'root' })
export class IdleService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _isIdle = signal(false);
  readonly isIdle = this._isIdle.asReadonly();

  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  private readonly handleActivity = (): void => {
    if (this._isIdle()) return;
    this.schedule();
  };

  start(): void {
    if (this.started) return;
    this.started = true;
    for (const e of ACTIVITY_EVENTS) {
      this.document.addEventListener(e, this.handleActivity, { passive: true });
    }
    this.schedule();
    this.destroyRef.onDestroy(() => this.stop());
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    for (const e of ACTIVITY_EVENTS) {
      this.document.removeEventListener(e, this.handleActivity);
    }
    this.clearTimer();
  }

  /** Force the kiosk back to active and restart the idle timer. */
  reset(): void {
    this._isIdle.set(false);
    if (this.started) this.schedule();
  }

  private schedule(): void {
    this.clearTimer();
    this.timeoutId = setTimeout(() => {
      this._isIdle.set(true);
      this.timeoutId = null;
    }, environment.idleTimeoutMs);
  }

  private clearTimer(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
