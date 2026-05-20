import { runInInjectionContext, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlSegment, UrlTree, type Route } from '@angular/router';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { ADMIN_BASELINE_ROLES, AuthService, type AdminRole, type AdminUser } from './auth.service';
import { adminBaselineGuard, authGuard, roleGuard } from './auth.guard';

class FakeAuthService {
  private _token: string | null = null;
  private _user: AdminUser | null = null;

  setSignedIn(user: AdminUser, token = 'tok'): void {
    this._user = user;
    this._token = token;
  }

  setSignedOut(): void {
    this._user = null;
    this._token = null;
  }

  readonly accessToken = (): string | null => this._token;
  readonly user = (): AdminUser | null => this._user;
  readonly isAuthenticated = (): boolean => this._token !== null;
  readonly role = (): AdminRole | null => this._user?.role ?? null;
}

function makeUser(role: AdminRole): AdminUser {
  return {
    id: 'u-1',
    email: 'a@a.com',
    role,
    dispensaryId: role === 'super_admin' ? undefined : 'disp-1',
  };
}

const FAKE_ROUTE: Route = {};
const FAKE_SEGMENTS: UrlSegment[] = [new UrlSegment('orders', {}), new UrlSegment('123', {})];

describe('authGuard', () => {
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

  it('returns true when signed in', () => {
    auth.setSignedIn(makeUser('dispensary_admin'));
    const result = runInInjectionContext(injector, () => authGuard(FAKE_ROUTE, FAKE_SEGMENTS));
    expect(result).toBe(true);
  });

  it('redirects to /login with redirect param when signed out', () => {
    auth.setSignedOut();
    const result = runInInjectionContext(injector, () => authGuard(FAKE_ROUTE, FAKE_SEGMENTS));
    expect(result).toBeInstanceOf(UrlTree);
    const tree = result as UrlTree;
    expect(router.serializeUrl(tree)).toBe('/login?redirect=%2Forders%2F123');
  });

  it('redirect param is /login (root) when no segments', () => {
    auth.setSignedOut();
    const result = runInInjectionContext(injector, () => authGuard(FAKE_ROUTE, []));
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?redirect=%2F');
  });
});

describe('roleGuard', () => {
  let auth: FakeAuthService;
  let injector: Injector;

  beforeEach(() => {
    auth = new FakeAuthService();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    injector = TestBed.inject(Injector);
  });

  it('allows when current role is in the allowed list', () => {
    auth.setSignedIn(makeUser('org_admin'));
    const guard = roleGuard('super_admin', 'org_admin');
    const result = runInInjectionContext(injector, () => guard(FAKE_ROUTE, FAKE_SEGMENTS));
    expect(result).toBe(true);
  });

  it('blocks when current role is not in the allowed list', () => {
    auth.setSignedIn(makeUser('dispensary_admin'));
    const guard = roleGuard('super_admin');
    const result = runInInjectionContext(injector, () => guard(FAKE_ROUTE, FAKE_SEGMENTS));
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('blocks when signed out (role() is null)', () => {
    auth.setSignedOut();
    const guard = roleGuard('super_admin', 'org_admin', 'dispensary_admin');
    const result = runInInjectionContext(injector, () => guard(FAKE_ROUTE, FAKE_SEGMENTS));
    expect(result).toBeInstanceOf(UrlTree);
  });
});

describe('adminBaselineGuard', () => {
  let auth: FakeAuthService;
  let injector: Injector;

  beforeEach(() => {
    auth = new FakeAuthService();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    injector = TestBed.inject(Injector);
  });

  for (const role of ADMIN_BASELINE_ROLES) {
    it(`allows ${role}`, () => {
      auth.setSignedIn(makeUser(role));
      const result = runInInjectionContext(injector, () =>
        adminBaselineGuard(FAKE_ROUTE, FAKE_SEGMENTS),
      );
      expect(result).toBe(true);
    });
  }

  it('blocks signed-out users', () => {
    auth.setSignedOut();
    const result = runInInjectionContext(injector, () =>
      adminBaselineGuard(FAKE_ROUTE, FAKE_SEGMENTS),
    );
    expect(result).toBeInstanceOf(UrlTree);
  });
});
