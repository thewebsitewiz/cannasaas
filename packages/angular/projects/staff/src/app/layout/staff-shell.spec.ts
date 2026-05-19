import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { ThemeService } from '@cannasaas/ui-ng';
import { StaffShell } from './staff-shell';
import { AuthService } from '../core/auth/auth.service';
import { CurrentSessionService } from '../core/register-session/current-session.service';
import { StockAlertsService } from '../core/stock-alerts/stock-alerts.service';

describe('StaffShell', () => {
  it('creates with a logged-in user shown in the top bar', async () => {
    await TestBed.configureTestingModule({
      imports: [StaffShell],
      providers: [
        provideRouter([]),
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
          useValue: {
            current: () => 'modern',
            setTheme: () => undefined,
          },
        },
        {
          provide: CurrentSessionService,
          useValue: {
            activeSession: () => null,
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
    }).compileComponents();

    const fixture = TestBed.createComponent(StaffShell);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('CannaSaaS Staff');
    expect(text).toContain('budtender@dispensary.com');
  });
});
