import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { LoginGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const ACCESS_TOKEN_KEY = 'cs.staff.accessToken';
const USER_KEY = 'cs.staff.user';

export type StaffRole = 'budtender' | 'dispensary_admin' | 'org_admin' | 'super_admin';

export interface StaffUser {
  readonly id: string;
  readonly email: string;
  readonly role: StaffRole;
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

const STAFF_ROLES: readonly StaffRole[] = [
  'budtender',
  'dispensary_admin',
  'org_admin',
  'super_admin',
];

function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Lazy — eager inject would cycle through provideApollo. */
  private readonly injector = inject(Injector);

  private readonly _accessToken = signal<string | null>(read(ACCESS_TOKEN_KEY));
  private readonly _user = signal<StaffUser | null>(readUser(USER_KEY));

  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null);
  readonly hasDispensaryScope = computed(() => {
    const u = this._user();
    if (!u) return false;
    return u.role === 'super_admin' || !!u.dispensaryId;
  });

  async login(email: string, password: string): Promise<StaffUser> {
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

  private applyToken(token: string): StaffUser {
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

function decodeUserFromJwt(token: string): StaffUser | null {
  const segments = token.split('.');
  if (segments.length !== 3) return null;
  try {
    const segment = segments[1];
    if (!segment) return null;
    const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(padded)) as JwtClaims;
    if (!payload.sub || !payload.email || !payload.role) return null;
    if (!isStaffRole(payload.role)) return null;
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

function read(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(key);
}

function write(key: string, value: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}

function readUser(key: string): StaffUser | null {
  const raw = read(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StaffUser;
  } catch {
    return null;
  }
}

function writeUser(key: string, user: StaffUser | null): void {
  if (user === null) {
    write(key, null);
    return;
  }
  write(key, JSON.stringify(user));
}
