import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { MyTimeEntriesGQL } from '@cannasaas/ui-ng';
import { TimesheetsPage } from './timesheets-page';
import { AuthService } from '../../core/auth/auth.service';

describe('TimesheetsPage', () => {
  it('renders the Timesheets header with no entries loaded', async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetsPage],
      providers: [
        {
          provide: AuthService,
          useValue: {
            user: () => ({
              id: 'u',
              email: 'b@d.com',
              role: 'budtender',
              dispensaryId: 'd-1',
            }),
          },
        },
        {
          provide: MyTimeEntriesGQL,
          useValue: {
            fetch: vi.fn(() => of({ data: { myTimeEntries: [] } })),
          } as unknown as MyTimeEntriesGQL,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TimesheetsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Timesheets');
  });
});
