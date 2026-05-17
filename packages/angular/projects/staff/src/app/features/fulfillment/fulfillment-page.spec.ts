import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { AvailableTimeSlotsGQL, DeliveryZonesForFulfillmentGQL } from '@cannasaas/ui-ng';
import { FulfillmentPage } from './fulfillment-page';
import { AuthService } from '../../core/auth/auth.service';

describe('FulfillmentPage', () => {
  it('renders the Fulfillment header with empty zones / slots', async () => {
    await TestBed.configureTestingModule({
      imports: [FulfillmentPage],
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
          provide: DeliveryZonesForFulfillmentGQL,
          useValue: {
            fetch: vi.fn(() => of({ data: { deliveryZones: [] } })),
          } as unknown as DeliveryZonesForFulfillmentGQL,
        },
        {
          provide: AvailableTimeSlotsGQL,
          useValue: {
            fetch: vi.fn(() => of({ data: { availableTimeSlots: [] } })),
          } as unknown as AvailableTimeSlotsGQL,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(FulfillmentPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Fulfillment');
    expect(text).toContain('No delivery zones configured');
  });
});
