import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { ThemeService } from '@cannasaas/ui-ng';
import { StaffShell } from './staff-shell';
import { AuthService } from '../core/auth/auth.service';
import {
  CurrentSessionService,
  type RegisterSession,
} from '../core/register-session/current-session.service';
import { StockAlertsService } from '../core/stock-alerts/stock-alerts.service';

interface ConfigureArgs {
  readonly activeSession?: RegisterSession | null;
}

function configure(args: ConfigureArgs = {}) {
  TestBed.configureTestingModule({
    imports: [StaffShell],
    providers: [
      provideRouter([
        { path: 'register/open', children: [] },
        { path: 'register/close', children: [] },
      ]),
      {
        provide: AuthService,
        useValue: {
          user: () => ({
            id: 'u-1',
            email: 'budtender@dispensary.com',
            role: 'budtender',
            dispensaryId: 'd-1',
          }),
          logout: () => Promise.resolve(),
        },
      },
      {
        provide: ThemeService,
        useValue: { current: () => 'modern', setTheme: () => undefined },
      },
      {
        provide: CurrentSessionService,
        useValue: {
          activeSession: signal<RegisterSession | null>(args.activeSession ?? null).asReadonly(),
        } as unknown as CurrentSessionService,
      },
      {
        provide: StockAlertsService,
        useValue: {
          alerts: signal([]).asReadonly(),
          muted: signal(false).asReadonly(),
          connected: signal(false).asReadonly(),
          latest: signal(null).asReadonly(),
          unreadCount: signal(0).asReadonly(),
          toggleMute: () => undefined,
          setMuted: () => undefined,
          markRead: () => undefined,
          dismiss: () => undefined,
          ingestForTest: () => undefined,
        } as unknown as StockAlertsService,
      },
    ],
  });
  const fixture = TestBed.createComponent(StaffShell);
  fixture.detectChanges();
  return fixture;
}

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

describe('StaffShell', () => {
  it('creates with a logged-in user shown in the top bar', () => {
    const fixture = configure();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('CannaSaaS Staff');
    expect(text).toContain('budtender@dispensary.com');
  });

  // ── TC-REG-001 (sc-543) — Open session sets the pill ──────────────────

  it('TC-REG-001 — open session renders an amount + time pill linking to /register/close', () => {
    const fixture = configure({ activeSession: openSession() });
    const root = fixture.nativeElement as HTMLElement;
    const pill = root.querySelector('a[href="/register/close"]') as HTMLAnchorElement;
    expect(pill).not.toBeNull();
    const text = (pill.textContent ?? '').trim();
    expect(text).toContain('Open since');
    expect(text).toContain('$200.00 drawer');
  });

  it('TC-REG-001 — open session pill carries the emerald styling', () => {
    const fixture = configure({ activeSession: openSession() });
    const pill = (fixture.nativeElement as HTMLElement).querySelector(
      'a[href="/register/close"]',
    ) as HTMLAnchorElement;
    expect(pill.className).toMatch(/emerald-/);
  });

  // ── TC-REG-004 (sc-546) — Close clears pill ───────────────────────────
  // (Shown via the no-active-session branch: shell renders the "Register
  // closed · open" link instead of the open pill.)

  it('TC-REG-004 — no active session shows the "Register closed · open" link to /register/open', () => {
    const fixture = configure({ activeSession: null });
    const root = fixture.nativeElement as HTMLElement;
    const openLink = root.querySelector('a[href="/register/open"]') as HTMLAnchorElement;
    expect(openLink).not.toBeNull();
    expect((openLink.textContent ?? '').trim()).toBe('Register closed · open');
    // And the close-register link must NOT be rendered.
    expect(root.querySelector('a[href="/register/close"]')).toBeNull();
  });

  it('TC-REG-004 — closed-status session also hides the open pill', () => {
    const closed: RegisterSession = {
      ...openSession(),
      status: 'closed',
      closedAt: '2026-05-19T17:00:00Z',
    };
    const fixture = configure({ activeSession: closed });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('a[href="/register/close"]')).toBeNull();
    expect(root.querySelector('a[href="/register/open"]')).not.toBeNull();
  });
});
