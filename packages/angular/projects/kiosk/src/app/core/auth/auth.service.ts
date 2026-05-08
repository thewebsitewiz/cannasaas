import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { LoginGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const DEVICE_TOKEN_KEY = 'cs.kiosk.deviceToken';
const ACCESS_TOKEN_KEY = 'cs.kiosk.accessToken';

/**
 * Two-tier auth model for the kiosk:
 *
 * 1. **Device token** — admin-provisioned via `provisionKiosk` mutation, stored
 *    in `localStorage` under `cs.kiosk.deviceToken`. Long-lived (1 year). The
 *    primary path in production. Set via `/setup?token=…` or a paste form.
 *
 * 2. **Access token** — short-lived JWT acquired by logging in with the
 *    `kioskAuth` creds in the kiosk environment. Dev-only fallback so the
 *    kiosk Just Works on a fresh devbox without a provisioning round-trip.
 *
 * Device token always wins. The 401 retry link only re-acquires the access
 * token; if the device token is bad, that's a re-provisioning event and the
 * kiosk surfaces the error rather than spinning.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** LoginGQL is resolved lazily — eager `inject(LoginGQL)` would create a
   *  cycle through `provideApollo` → AuthService → LoginGQL → Apollo. */
  private readonly injector = inject(Injector);

  private readonly _deviceToken = signal<string | null>(read(DEVICE_TOKEN_KEY));
  private readonly _accessToken = signal<string | null>(read(ACCESS_TOKEN_KEY));

  readonly accessToken = computed(() => this._deviceToken() ?? this._accessToken());
  readonly hasDeviceToken = computed(() => this._deviceToken() !== null);
  readonly canSelfLogin = environment.kioskAuth !== undefined;
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  private inflight: Promise<string> | null = null;

  /**
   * Returns a usable token. Order: device token → cached access token →
   * fresh login (only if kioskAuth env creds are configured). Throws if no
   * path produces a token.
   */
  async ensureLoggedIn(): Promise<string> {
    const device = this._deviceToken();
    if (device) return device;
    const cached = this._accessToken();
    if (cached) return cached;
    if (!this.canSelfLogin) {
      throw new Error('KIOSK_NOT_PROVISIONED');
    }
    if (this.inflight) return this.inflight;
    this.inflight = this.runLogin().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  setDeviceToken(token: string): void {
    if (!token) return;
    this._deviceToken.set(token);
    write(DEVICE_TOKEN_KEY, token);
    // A new device token supersedes any cached login token.
    this._accessToken.set(null);
    write(ACCESS_TOKEN_KEY, null);
  }

  clearDeviceToken(): void {
    this._deviceToken.set(null);
    write(DEVICE_TOKEN_KEY, null);
  }

  /** Used by the 401 retry link. No-op if a device token is in play. */
  clearAccessToken(): void {
    if (this._deviceToken()) return;
    this._accessToken.set(null);
    write(ACCESS_TOKEN_KEY, null);
  }

  /** Backwards-compat alias for older callers. */
  clearToken(): void {
    this.clearAccessToken();
  }

  private async runLogin(): Promise<string> {
    const creds = environment.kioskAuth;
    if (!creds) throw new Error('KIOSK_NOT_PROVISIONED');
    const loginGQL = this.injector.get(LoginGQL);
    const result = await firstValueFrom(
      loginGQL.mutate({
        variables: { input: { email: creds.email, password: creds.password } },
      }),
    );
    const token = result.data?.login?.accessToken;
    if (!token) throw new Error('Kiosk login failed: no accessToken in response');
    this._accessToken.set(token);
    write(ACCESS_TOKEN_KEY, token);
    return token;
  }
}

function read(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(key);
}

function write(key: string, value: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}
