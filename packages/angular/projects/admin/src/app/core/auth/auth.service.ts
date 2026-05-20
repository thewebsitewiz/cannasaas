import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { LoginGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const ACCESS_TOKEN_KEY = 'cs.admin.accessToken';
const USER_KEY = 'cs.admin.user';

/**
 * Roles that may enter the admin app. Mirrors `ADMIN_BASELINE_ROLES`
 * from the React admin (sc-604). `budtender` is intentionally excluded
 * — that role belongs in staff, not admin.
 */
export type AdminRole = 'super_admin' | 'org_admin' | 'dispensary_admin';

export interface AdminUser {
  readonly id: string;
  readonly email: string;
  readonly role: AdminRole;
  readonly dispensaryId?: string;
  readonly organizationId?: string;
}

interface JwtClaims {
  readonly sub?: string;
  readonly email?: string;
  readonly role?: string;
  readonly dispensaryId?: string;
  readonly organizationId?: string;
}

export const ADMIN_BASELINE_ROLES: readonly AdminRole[] = [
  'super_admin',
  'org_admin',
  'dispensary_admin',
];

function isAdminRole(value: string): value is AdminRole {
  return (ADMIN_BASELINE_ROLES as readonly string[]).includes(value);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Lazy — eager inject would cycle through provideApollo. */
  private readonly injector = inject(Injector);

  private readonly _accessToken = signal<string | null>(read(ACCESS_TOKEN_KEY));
  private readonly _user = signal<AdminUser | null>(readUser(USER_KEY));

  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null);
  readonly role = computed(() => this._user()?.role ?? null);

  async login(email: string, password: string): Promise<AdminUser> {
    const loginGQL = this.injector.get(LoginGQL);
    const result = await firstValueFrom(
      loginGQL.mutate({ variables: { input: { email, password } } }),
    );
    const token = result.data?.login?.accessToken;
    if (!token) throw new Error('Login failed: no accessToken in response');
    return this.applyToken(token);
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

  private applyToken(token: string): AdminUser {
    this._accessToken.set(token);
    write(ACCESS_TOKEN_KEY, token);
    const user = decodeUserFromJwt(token);
    if (!user) {
      this.clearToken();
      throw new Error('Login failed: token claims missing required fields');
    }
    this._user.set(user);
    writeUser(USER_KEY, user);
    return user;
  }
}

function decodeUserFromJwt(token: string): AdminUser | null {
  const segments = token.split('.');
  if (segments.length !== 3) return null;
  try {
    const segment = segments[1];
    if (!segment) return null;
    const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(padded)) as JwtClaims;
    if (!payload.sub || !payload.email || !payload.role) return null;
    if (!isAdminRole(payload.role)) return null;
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      dispensaryId: payload.dispensaryId,
      organizationId: payload.organizationId,
    };
  } catch {
    return null;
  }
}

/**
 * Admin uses **sessionStorage** (per React admin pre-migration) so
 * tokens don't survive a browser close. Less window for stolen-token
 * replay than localStorage at the cost of more frequent logins.
 */
function read(key: string): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(key);
}

function write(key: string, value: string | null): void {
  if (typeof sessionStorage === 'undefined') return;
  if (value === null) sessionStorage.removeItem(key);
  else sessionStorage.setItem(key, value);
}

function readUser(key: string): AdminUser | null {
  const raw = read(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

function writeUser(key: string, user: AdminUser | null): void {
  if (user === null) {
    write(key, null);
    return;
  }
  write(key, JSON.stringify(user));
}
