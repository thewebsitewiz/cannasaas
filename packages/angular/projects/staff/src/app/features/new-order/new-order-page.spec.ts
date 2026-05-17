import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import {
  CreateOrderGQL,
  CreateWalkInCustomerGQL,
  ProductsGQL,
  SearchCustomersGQL,
} from '@cannasaas/ui-ng';
import { NewOrderPage } from './new-order-page';
import { AuthService } from '../../core/auth/auth.service';

describe('NewOrderPage', () => {
  it('creates and renders the New Order header', async () => {
    await TestBed.configureTestingModule({
      imports: [NewOrderPage],
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
          provide: ProductsGQL,
          useValue: {
            fetch: vi.fn(() => of({ data: { products: [] } })),
          } as unknown as ProductsGQL,
        },
        {
          provide: SearchCustomersGQL,
          useValue: {
            fetch: vi.fn(() => of({ data: { searchCustomers: [] } })),
          } as unknown as SearchCustomersGQL,
        },
        {
          provide: CreateWalkInCustomerGQL,
          useValue: { mutate: vi.fn() } as unknown as CreateWalkInCustomerGQL,
        },
        {
          provide: CreateOrderGQL,
          useValue: { mutate: vi.fn() } as unknown as CreateOrderGQL,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NewOrderPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('New Order');
  });
});
