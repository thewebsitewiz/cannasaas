/**
 * dispensaryScopedGuard specs (sc-540, sc-541).
 * Runs the actual guard in an injection context with a fake auth.
 */
import { runInInjectionContext, Injector, computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlSegment, UrlTree, provideRouter, type Route } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthService, type StaffRole, type StaffUser } from './auth.service';
import { dispensaryScopedGuard } from './dispensary-scoped.guard';

class FakeAuthService {
  private _token: string | null = null;
  private _user: StaffUser | null = null;

  setSignedIn(user: StaffUser, token = 'tok'): void {
    this._user = user;
    this._token = token;
  }

  setSignedOut(): void {
    this._user = null;
    this._token = null;
  }

  readonly accessToken = computed(() => this._token);
  readonly user = computed(() => this._user);
  readonly isAuthenticated = computed(() => this._token !== null);
  readonly hasDispensaryScope = computed(() => {
    const u = this._user;
    if (!u) return false;
    return u.role === 'super_admin' || !!u.dispensaryId;
  });
}

function makeUser(role: StaffRole, dispensaryId?: string): StaffUser {
  return {
    id: 'u-1',
    email: role + '@disp.test',
    role,
    dispensaryId,
  };
}

const ROUTE: Route = {};
const SEGMENTS: UrlSegment[] = [new UrlSegment('orders', {}), new UrlSegment('new', {})];

describe('dispensaryScopedGuard', () => {
  let auth: FakeAuthService;
  let injector: Injector;
  let router: Router;

  beforeEach(() => {
    auth = new FakeAuthService();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    injector = TestBed.inject(Injector);
    router = TestBed.inject(Router);
  });

  // ── TC-AUTH-002 (sc-540) — guard blocks no-tenant users ─────────────────

  it('TC-AUTH-002 — signed-out users are redirected to /login with the requested redirect param', () => {
    auth.setSignedOut();
    const result = runInInjectionContext(injector, () => dispensaryScopedGuard(ROUTE, SEGMENTS));
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?redirect=%2Forders%2Fnew');
  });

  it('TC-AUTH-002 — authed but no-tenant users are bounced to /login?reason=no-dispensary', () => {
    auth.setSignedIn(makeUser('dispensary_admin'));
    const result = runInInjectionContext(injector, () => dispensaryScopedGuard(ROUTE, SEGMENTS));
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?reason=no-dispensary');
  });

  it('TC-AUTH-002 — org_admin without dispensaryId is bounced (not silently 403)', () => {
    auth.setSignedIn(makeUser('org_admin'));
    const result = runInInjectionContext(injector, () => dispensaryScopedGuard(ROUTE, SEGMENTS));
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toContain('reason=no-dispensary');
  });

  it('TC-AUTH-002 — budtender without dispensaryId is bounced', () => {
    auth.setSignedIn(makeUser('budtender'));
    const result = runInInjectionContext(injector, () => dispensaryScopedGuard(ROUTE, SEGMENTS));
    expect(result).toBeInstanceOf(UrlTree);
  });

  // ── TC-AUTH-003 (sc-541) — super_admin bypasses dispensary scope ────────

  it('TC-AUTH-003 — super_admin without a dispensaryId still passes the guard', () => {
    auth.setSignedIn(makeUser('super_admin'));
    const result = runInInjectionContext(injector, () => dispensaryScopedGuard(ROUTE, SEGMENTS));
    expect(result).toBe(true);
  });

  it('budtender WITH a dispensaryId passes the guard', () => {
    auth.setSignedIn(makeUser('budtender', 'd-1'));
    const result = runInInjectionContext(injector, () => dispensaryScopedGuard(ROUTE, SEGMENTS));
    expect(result).toBe(true);
  });

  it('dispensary_admin WITH a dispensaryId passes the guard', () => {
    auth.setSignedIn(makeUser('dispensary_admin', 'd-1'));
    const result = runInInjectionContext(injector, () => dispensaryScopedGuard(ROUTE, SEGMENTS));
    expect(result).toBe(true);
  });

  it('signed-out at root (no segments) redirects with redirect=%2F', () => {
    auth.setSignedOut();
    const result = runInInjectionContext(injector, () => dispensaryScopedGuard(ROUTE, []));
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?redirect=%2F');
  });
});
