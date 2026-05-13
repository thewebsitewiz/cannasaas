import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'cannasaas-age-confirmed';

/**
 * Per-session age-confirmation state. Replaces the earlier 24h-localStorage,
 * per-tenant-slug mechanism with React's stricter sessionStorage policy —
 * every browser session reconfirms. Matches apps/storefront/src/components
 * /AgeGate.tsx exactly.
 *
 * Storage is single-key (not per-tenant) because the storefront serves one
 * dispensary per request; a visitor who switches tenants reopens the tab
 * anyway, so the session boundary already gives per-tenant reconfirmation.
 */
@Injectable({ providedIn: 'root' })
export class AgeGateService {
  private readonly _confirmed = signal(readConfirmed());

  readonly confirmed = this._confirmed.asReadonly();

  confirm(): void {
    this._confirmed.set(true);
    write(true);
  }

  reset(): void {
    this._confirmed.set(false);
    write(false);
  }
}

function readConfirmed(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(STORAGE_KEY) === 'true';
}

function write(confirmed: boolean): void {
  if (typeof sessionStorage === 'undefined') return;
  if (confirmed) sessionStorage.setItem(STORAGE_KEY, 'true');
  else sessionStorage.removeItem(STORAGE_KEY);
}
