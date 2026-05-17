import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { ThemeService } from '@cannasaas/ui-ng';
import { StaffShell } from './staff-shell';
import { AuthService } from '../core/auth/auth.service';

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
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(StaffShell);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('CannaSaaS Staff');
    expect(text).toContain('budtender@dispensary.com');
  });
});
