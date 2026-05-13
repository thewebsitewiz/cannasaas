import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { LoginGQL, RegisterGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const ACCESS_TOKEN_KEY = 'cs.storefront.accessToken';
const USER_KEY = 'cs.storefront.user';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly role: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly ageVerified: boolean;
}

interface JwtPayload {
  readonly sub?: string;
  readonly email?: string;
  readonly role?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly ageVerified?: boolean;
}

interface RefreshResponse {
  readonly accessToken: string;
  readonly expiresIn: number;
}

/**
 * Customer auth for the storefront. Mirrors the kiosk's signal pattern but
 * differs in semantics:
 *
 * - Login/register go through GraphQL (LoginGQL / RegisterGQL).
 * - Refresh goes through REST POST /v1/auth/refresh with credentials:'include'
 *   because the refresh token is an HTTP-only cookie set by the API — not in
 *   the AuthToken response body.
 * - Logout posts to /v1/auth/logout with the bearer token, then clears state
 *   regardless of network outcome.
 *
 * User info is decoded synchronously from JWT claims so post-login UI does
 * not have to await a separate `me` query.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Resolved lazily — eager inject would cycle through provideApollo. */
  private readonly injector = inject(Injector);

  private readonly _accessToken = signal<string | null>(read(ACCESS_TOKEN_KEY));
  private readonly _user = signal<User | null>(readUser(USER_KEY));

  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null);

  private refreshInflight: Promise<string | null> | null = null;

  async login(email: string, password: string): Promise<void> {
    const loginGQL = this.injector.get(LoginGQL);
    const result = await firstValueFrom(
      loginGQL.mutate({ variables: { input: { email, password } } }),
    );
    const token = result.data?.login?.accessToken;
    if (!token) throw new Error('Login failed: no accessToken in response');
    this.applyToken(token);
  }

  async register(email: string, password: string): Promise<void> {
    const registerGQL = this.injector.get(RegisterGQL);
    const result = await firstValueFrom(
      registerGQL.mutate({ variables: { input: { email, password } } }),
    );
    const token = result.data?.register?.accessToken;
    if (!token) throw new Error('Register failed: no accessToken in response');
    this.applyToken(token);
  }

  /**
   * Returns the new access token, or null if refresh failed for any reason
   * (network, non-2xx, malformed response). Concurrent callers share the
   * same in-flight promise so a burst of 401s only triggers one refresh.
   */
  async refresh(): Promise<string | null> {
    if (this.refreshInflight) return this.refreshInflight;
    this.refreshInflight = this.runRefresh().finally(() => {
      this.refreshInflight = null;
    });
    return this.refreshInflight;
  }

  async logout(): Promise<void> {
    const token = this._accessToken();
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${environment.apiUrl}/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });
    } catch {
      // Network failure shouldn't block local cleanup.
    } finally {
      this.clearToken();
    }
  }

  clearToken(): void {
    this._accessToken.set(null);
    this._user.set(null);
    write(ACCESS_TOKEN_KEY, null);
    writeUser(USER_KEY, null);
  }

  private applyToken(token: string): void {
    this._accessToken.set(token);
    write(ACCESS_TOKEN_KEY, token);
    const user = decodeUserFromJwt(token);
    this._user.set(user);
    writeUser(USER_KEY, user);
  }

  private async runRefresh(): Promise<string | null> {
    try {
      const res = await fetch(`${environment.apiUrl}/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as Partial<RefreshResponse>;
      if (typeof data.accessToken !== 'string') return null;
      this.applyToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    }
  }
}

function decodeUserFromJwt(token: string): User | null {
  const segments = token.split('.');
  if (segments.length !== 3) return null;
  try {
    const padded = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(padded)) as JwtPayload;
    if (!payload.sub || !payload.email) return null;
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role ?? 'customer',
      firstName: payload.firstName ?? undefined,
      lastName: payload.lastName ?? undefined,
      ageVerified: payload.ageVerified ?? false,
    };
  } catch {
    return null;
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

function readUser(key: string): User | null {
  const raw = read(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function writeUser(key: string, user: User | null): void {
  if (user === null) {
    write(key, null);
    return;
  }
  write(key, JSON.stringify(user));
}
