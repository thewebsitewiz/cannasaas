/**
 * registerSessionGuard specs (sc-544 TC-REG-002 + sc-545 TC-REG-003).
 * Order-mutating routes require an open RegisterSession.
 */
import { runInInjectionContext, Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlSegment, UrlTree, provideRouter, type Route } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { CurrentSessionService, type RegisterSession } from './current-session.service';
import { registerSessionGuard } from './register-session.guard';

interface FakeArgs {
  readonly session?: RegisterSession | null;
  readonly loading?: boolean;
}

function makeSessionSvc(args: FakeArgs = {}): CurrentSessionService {
  const sessionSig = signal<RegisterSession | null>(args.session ?? null);
  const loadingSig = signal<boolean>(args.loading ?? false);
  return {
    activeSession: sessionSig.asReadonly(),
    loading: loadingSig.asReadonly(),
    hasOpenSession: () => sessionSig()?.status === 'open',
  } as unknown as CurrentSessionService;
}

const ROUTE: Route = {};
const SEGMENTS: UrlSegment[] = [new UrlSegment('orders', {}), new UrlSegment('new', {})];

function openSession(): RegisterSession {
  return {
    id: 's-1',
    dispensaryId: 'd-1',
    openedByUserId: 'u-1',
    openingCashCents: 20000,
    closingCashCents: null,
    status: 'open',
    openedAt: '2026-05-19T08:00:00Z',
    closedAt: null,
  };
}

function closedSession(): RegisterSession {
  return { ...openSession(), status: 'closed', closedAt: '2026-05-19T17:00:00Z' };
}

describe('registerSessionGuard', () => {
  let injector: Injector;
  let router: Router;

  const setup = (args: FakeArgs = {}): void => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CurrentSessionService, useValue: makeSessionSvc(args) },
      ],
    });
    injector = TestBed.inject(Injector);
    router = TestBed.inject(Router);
  };

  beforeEach(() => {
    /* per-test setup happens via `setup()` */
  });

  // ── TC-REG-002 (sc-544) — Closed session blocks routes ────────────────

  it('TC-REG-002 — closed session redirects to /register/open with the requested redirect', async () => {
    setup({ session: closedSession() });
    const result = await runInInjectionContext(injector, () =>
      registerSessionGuard(ROUTE, SEGMENTS),
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/register/open?redirect=%2Forders%2Fnew');
  });

  it('TC-REG-002 — no session at all redirects to /register/open', async () => {
    setup({ session: null });
    const result = await runInInjectionContext(injector, () =>
      registerSessionGuard(ROUTE, SEGMENTS),
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toContain('/register/open');
  });

  // ── TC-REG-003 (sc-545) — Post-open redirect ──────────────────────────
  // The guard preserves the originally-requested URL in the redirect
  // query param so that after opening, RegisterOpenPage can route back.

  it('TC-REG-003 — the redirect param preserves the originally-requested URL', async () => {
    setup({ session: null });
    const segments = [new UrlSegment('inventory', {}), new UrlSegment('adjust', {})];
    const result = await runInInjectionContext(injector, () =>
      registerSessionGuard(ROUTE, segments),
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/register/open?redirect=%2Finventory%2Fadjust',
    );
  });

  // ── Happy path ────────────────────────────────────────────────────────

  it('open session allows the route to match', async () => {
    setup({ session: openSession() });
    const result = await runInInjectionContext(injector, () =>
      registerSessionGuard(ROUTE, SEGMENTS),
    );
    expect(result).toBe(true);
  });

  it('root segment (no path) redirects with redirect=%2F', async () => {
    setup({ session: null });
    const result = await runInInjectionContext(injector, () => registerSessionGuard(ROUTE, []));
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/register/open?redirect=%2F');
  });
});
