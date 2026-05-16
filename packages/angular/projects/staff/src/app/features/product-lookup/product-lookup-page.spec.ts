import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { SearchProductsLookupGQL } from '@cannasaas/ui-ng';
import { ProductLookupPage } from './product-lookup-page';
import { AuthService } from '../../core/auth/auth.service';

describe('ProductLookupPage', () => {
  it('renders the empty-state hint when no search has been entered', async () => {
    await TestBed.configureTestingModule({
      imports: [ProductLookupPage],
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
          provide: SearchProductsLookupGQL,
          useValue: {
            fetch: vi.fn(() => of({ data: { searchProducts: [] } })),
          } as unknown as SearchProductsLookupGQL,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductLookupPage);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Start typing to search products');
  });
});
