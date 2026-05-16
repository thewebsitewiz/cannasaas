import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { StaffInventoryProductsGQL } from '@cannasaas/ui-ng';
import { InventoryPage } from './inventory-page';
import { AuthService } from '../../core/auth/auth.service';

describe('InventoryPage', () => {
  it('renders header + summary cards with zero counts on empty data', async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryPage],
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
          provide: StaffInventoryProductsGQL,
          useValue: {
            fetch: vi.fn(() => of({ data: { products: [] } })),
          } as unknown as StaffInventoryProductsGQL,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Inventory');
    expect(text).toContain('In Stock');
    expect(text).toContain('Low Stock');
    expect(text).toContain('Out of Stock');
  });
});
