import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, vi, type Mock } from 'vitest';
import { InitiateCashlessPaymentGQL } from '@cannasaas/ui-ng';
import { PaymentFlowService } from './payment-flow.service';

describe('PaymentFlowService', () => {
  let mutate: Mock;

  function configure(payload: unknown): PaymentFlowService {
    mutate = vi.fn(() => of({ data: { initiateCashlessPayment: payload } }));
    TestBed.configureTestingModule({
      providers: [
        PaymentFlowService,
        {
          provide: InitiateCashlessPaymentGQL,
          useValue: { mutate } as unknown as InitiateCashlessPaymentGQL,
        },
      ],
    });
    return TestBed.inject(PaymentFlowService);
  }

  it('returns externalUrl from redirectUrl (CanPay shape)', async () => {
    const service = configure({
      referenceId: 'CANPAY-123',
      redirectUrl: 'https://canpay.example/pay/CANPAY-123',
      paymentUrl: null,
    });
    const result = await service.initiateCashless({
      orderId: 'o-1',
      dispensaryId: 'd-1',
      amount: 25,
      provider: 'canpay',
    });
    expect(result.referenceId).toBe('CANPAY-123');
    expect(result.externalUrl).toBe('https://canpay.example/pay/CANPAY-123');
  });

  it('returns externalUrl from paymentUrl (Aeropay shape)', async () => {
    const service = configure({
      referenceId: 'AERO-456',
      redirectUrl: null,
      paymentUrl: 'https://aeropay.example/checkout/AERO-456',
    });
    const result = await service.initiateCashless({
      orderId: 'o-1',
      dispensaryId: 'd-1',
      amount: 25,
      provider: 'aeropay',
    });
    expect(result.externalUrl).toBe('https://aeropay.example/checkout/AERO-456');
  });

  it('returns externalUrl=null when neither URL is supplied', async () => {
    const service = configure({
      referenceId: 'TX-789',
      redirectUrl: null,
      paymentUrl: null,
    });
    const result = await service.initiateCashless({
      orderId: 'o-1',
      dispensaryId: 'd-1',
      amount: 25,
      provider: 'canpay',
    });
    expect(result.externalUrl).toBeNull();
  });

  it('throws when the mutation returns no payload', async () => {
    mutate = vi.fn(() => of({ data: undefined }));
    TestBed.configureTestingModule({
      providers: [
        PaymentFlowService,
        {
          provide: InitiateCashlessPaymentGQL,
          useValue: { mutate } as unknown as InitiateCashlessPaymentGQL,
        },
      ],
    });
    const service = TestBed.inject(PaymentFlowService);
    await expect(
      service.initiateCashless({
        orderId: 'o-1',
        dispensaryId: 'd-1',
        amount: 25,
        provider: 'canpay',
      }),
    ).rejects.toThrow(/no result/);
  });
});
