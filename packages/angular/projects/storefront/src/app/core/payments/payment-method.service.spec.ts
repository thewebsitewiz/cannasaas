import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, vi, type Mock } from 'vitest';
import { AvailablePaymentMethodsGQL } from '@cannasaas/ui-ng';
import { PaymentMethodService } from './payment-method.service';

describe('PaymentMethodService', () => {
  let fetch: Mock;

  function configure(rows: Array<{ method: string; enabled: boolean }>): void {
    fetch = vi.fn(() =>
      of({
        data: { availablePaymentMethods: rows },
        loading: false,
        networkStatus: 7,
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        PaymentMethodService,
        {
          provide: AvailablePaymentMethodsGQL,
          useValue: { fetch } as unknown as AvailablePaymentMethodsGQL,
        },
      ],
    });
  }

  it('loads + exposes the enabled methods', async () => {
    configure([
      { method: 'cash', enabled: true },
      { method: 'canpay', enabled: true },
      { method: 'aeropay', enabled: false },
    ]);
    const service = TestBed.inject(PaymentMethodService);
    await service.load('disp-1');

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { dispensaryId: 'disp-1' },
        fetchPolicy: 'network-only',
      }),
    );
    expect(service.isEnabled('cash')).toBe(true);
    expect(service.isEnabled('canpay')).toBe(true);
    expect(service.isEnabled('aeropay')).toBe(false);
    expect(service.enabledMethods().map((m) => m.method)).toEqual(['cash', 'canpay']);
  });

  it('ignores unrecognized method names defensively', async () => {
    configure([
      { method: 'cash', enabled: true },
      { method: 'mystery', enabled: true },
    ]);
    const service = TestBed.inject(PaymentMethodService);
    await service.load('disp-1');
    expect(service.methods().map((m) => m.method)).toEqual(['cash']);
  });

  it('captures the error message when the query throws', async () => {
    fetch = vi.fn(() => {
      throw new Error('network down');
    });
    TestBed.configureTestingModule({
      providers: [
        PaymentMethodService,
        {
          provide: AvailablePaymentMethodsGQL,
          useValue: { fetch } as unknown as AvailablePaymentMethodsGQL,
        },
      ],
    });
    const service = TestBed.inject(PaymentMethodService);
    await service.load('disp-1');
    expect(service.error()).toBe('network down');
    expect(service.methods()).toEqual([]);
  });
});
