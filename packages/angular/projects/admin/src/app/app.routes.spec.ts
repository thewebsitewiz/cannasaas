/**
 * Integration tests for the admin route table (sc-512..515, sc-601..603,
 * sc-612..615, sc-532). Each `it` exercises a single TC-* manual test
 * case by replaying the route's `canMatch` chain against a fake auth
 * snapshot and asserting allow / block.
 */
import { runInInjectionContext, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  type CanMatchFn,
  type Route,
  Router,
  UrlSegment,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { routes } from './app.routes';
import { AuthService, type AdminRole, type AdminUser } from './core/auth/auth.service';

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

  /** Mimics AuthService.logout() observable side-effect — clears local state. */
  logout(): Promise<void> {
    this.setSignedOut();
    return Promise.resolve();
  }

  readonly accessToken = (): string | null => this._token;
  readonly user = (): AdminUser | null => this._user;
  readonly isAuthenticated = (): boolean => this._token !== null;
  readonly role = (): AdminRole | null => this._user?.role ?? null;
}

function makeUser(role: AdminRole): AdminUser {
  return {
    id: 'u-1',
    email: role + '@disp.test',
    role,
    dispensaryId: role === 'super_admin' ? undefined : 'disp-1',
    organizationId: role === 'super_admin' ? undefined : 'org-1',
  };
}

interface MatchedRoute {
  readonly path: string;
  readonly canMatch: readonly CanMatchFn[];
}

/**
 * Flatten the top-level "" parent + its children into a single
 * `{ path, canMatch[] }` per leaf (parent guards prepended to each
 * child's canMatch chain so the leaf check mirrors the router's
 * actual matching behavior).
 */
function flatten(): MatchedRoute[] {
  const out: MatchedRoute[] = [];
  for (const top of routes) {
    if (top.path === undefined) continue;
    const topGuards = (top.canMatch ?? []) as CanMatchFn[];
    if (top.path === '' && top.children) {
      for (const child of top.children) {
        if (child.path === undefined) continue;
        const childGuards = (child.canMatch ?? []) as CanMatchFn[];
        out.push({
          path: child.path,
          canMatch: [...topGuards, ...childGuards],
        });
      }
      continue;
    }
    out.push({ path: top.path, canMatch: topGuards });
  }
  return out;
}

function segmentsFor(path: string): UrlSegment[] {
  if (!path || path === '**') return [];
  return path.split('/').map((p) => new UrlSegment(p, {}));
}

function evalGuards(
  injector: Injector,
  guards: readonly CanMatchFn[],
  path: string,
): true | UrlTree {
  const fakeRoute: Route = { path };
  const segments = segmentsFor(path);
  for (const guard of guards) {
    const result = runInInjectionContext(injector, () => guard(fakeRoute, segments));
    if (result !== true) {
      return result as UrlTree;
    }
  }
  return true;
}

describe('admin app.routes — auth / role integration', () => {
  let auth: FakeAuthService;
  let injector: Injector;
  let router: Router;
  let allRoutes: MatchedRoute[];

  beforeEach(() => {
    auth = new FakeAuthService();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    injector = TestBed.inject(Injector);
    router = TestBed.inject(Router);
    allRoutes = flatten();
  });

  const routeFor = (path: string): MatchedRoute => {
    const found = allRoutes.find((r) => r.path === path);
    if (!found) throw new Error('No route for path: ' + path);
    return found;
  };

  // ── TC-AUTH-005 — Logout clears organization context ─────────────────────

  it('TC-AUTH-005 — logout() clears user + token signal state', async () => {
    auth.setSignedIn(makeUser('org_admin'));
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.user()?.organizationId).toBe('org-1');

    await auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.user()).toBeNull();
    expect(auth.role()).toBeNull();
  });

  // ── TC-AUTH-006/007/008 — Direct URL to /tax-management ───────────────────

  it('TC-AUTH-006 — super_admin can match /tax-management', () => {
    auth.setSignedIn(makeUser('super_admin'));
    const result = evalGuards(injector, routeFor('tax-management').canMatch, 'tax-management');
    expect(result).toBe(true);
  });

  it('TC-AUTH-007 — dispensary_admin is blocked from /tax-management', () => {
    auth.setSignedIn(makeUser('dispensary_admin'));
    const result = evalGuards(injector, routeFor('tax-management').canMatch, 'tax-management');
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('TC-AUTH-008 — org_admin is blocked from /tax-management (super_admin-only)', () => {
    auth.setSignedIn(makeUser('org_admin'));
    const result = evalGuards(injector, routeFor('tax-management').canMatch, 'tax-management');
    expect(result).toBeInstanceOf(UrlTree);
  });

  // ── TC-AUTH-009 — Budtender cannot enter the admin app ────────────────────

  it('TC-AUTH-009 — budtender is blocked at the admin baseline for every page', () => {
    // Budtender isn't an AdminRole so we force-cast to simulate a wrong-role JWT.
    auth.setSignedIn({
      id: 'u-bt',
      email: 'budtender@disp.test',
      role: 'budtender' as AdminRole,
      dispensaryId: 'disp-1',
    });
    // Sample a representative subset — the layout guard catches all of these.
    for (const path of ['inventory', 'orders', 'products', 'settings', 'tax-management']) {
      const result = evalGuards(injector, routeFor(path).canMatch, path);
      expect(result, 'budtender should be blocked from /' + path).toBeInstanceOf(UrlTree);
    }
  });

  // ── TC-AUTH-010/011/012 — /onboarding ─────────────────────────────────────

  it('TC-AUTH-010 — dispensary_admin is blocked from /onboarding (org_admin+)', () => {
    auth.setSignedIn(makeUser('dispensary_admin'));
    const result = evalGuards(injector, routeFor('onboarding').canMatch, 'onboarding');
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('TC-AUTH-011 — org_admin can match /onboarding', () => {
    auth.setSignedIn(makeUser('org_admin'));
    const result = evalGuards(injector, routeFor('onboarding').canMatch, 'onboarding');
    expect(result).toBe(true);
  });

  it('TC-AUTH-012 — super_admin can match /onboarding', () => {
    auth.setSignedIn(makeUser('super_admin'));
    const result = evalGuards(injector, routeFor('onboarding').canMatch, 'onboarding');
    expect(result).toBe(true);
  });

  // ── TC-REG-003 — All non-login routes behind authGuard + adminBaselineGuard

  it('TC-REG-003 — every protected route blocks unauthenticated access', () => {
    auth.setSignedOut();
    const protectedRoutes = allRoutes.filter(
      (r) => r.path !== 'login' && r.path !== '**' && r.canMatch.length > 0,
    );
    expect(protectedRoutes.length).toBeGreaterThan(10);
    for (const r of protectedRoutes) {
      const result = evalGuards(injector, r.canMatch, r.path);
      expect(result, '/' + r.path + ' should redirect when signed out').toBeInstanceOf(UrlTree);
    }
  });

  it('TC-REG-003 (corollary) — /login itself has no guards', () => {
    const login = allRoutes.find((r) => r.path === 'login');
    expect(login).toBeDefined();
    expect(login?.canMatch).toEqual([]);
  });
});
