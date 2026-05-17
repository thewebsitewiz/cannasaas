import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import {
  CompleteOrderGQL,
  ConfirmOrderGQL,
  MarkOrderReadyGQL,
  OrdersGQL,
  StartPreparingOrderGQL,
} from '@cannasaas/ui-ng';
import { OrderQueuePage } from './order-queue-page';
import { AuthService } from '../../core/auth/auth.service';

describe('OrderQueuePage', () => {
  it('creates and renders all four lane labels', async () => {
    await TestBed.configureTestingModule({
      imports: [OrderQueuePage],
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
          provide: OrdersGQL,
          useValue: {
            fetch: vi.fn(() => of({ data: { orders: [] } })),
          } as unknown as OrdersGQL,
        },
        {
          provide: ConfirmOrderGQL,
          useValue: { mutate: vi.fn() } as unknown as ConfirmOrderGQL,
        },
        {
          provide: StartPreparingOrderGQL,
          useValue: { mutate: vi.fn() } as unknown as StartPreparingOrderGQL,
        },
        {
          provide: MarkOrderReadyGQL,
          useValue: { mutate: vi.fn() } as unknown as MarkOrderReadyGQL,
        },
        {
          provide: CompleteOrderGQL,
          useValue: { mutate: vi.fn() } as unknown as CompleteOrderGQL,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OrderQueuePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Pending');
    expect(text).toContain('Confirmed');
    expect(text).toContain('Preparing');
    expect(text).toContain('Ready');
  });
});
