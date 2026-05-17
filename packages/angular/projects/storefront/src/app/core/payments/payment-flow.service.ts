import { Injectable, inject } from '@angular/core';
import { InitiateCashlessPaymentGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { PaymentMethodName } from './payment-method.service';

export interface InitiateCashlessInput {
  readonly orderId: string;
  readonly dispensaryId: string;
  readonly amount: number;
  readonly provider: Extract<PaymentMethodName, 'canpay' | 'aeropay'>;
}

export interface InitiateCashlessResult {
  readonly referenceId: string;
  /** External URL the customer should be redirected to (Aeropay / pay-by-bank). */
  readonly externalUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class PaymentFlowService {
  private readonly gql = inject(InitiateCashlessPaymentGQL);

  async initiateCashless(input: InitiateCashlessInput): Promise<InitiateCashlessResult> {
    const result = await firstValueFrom(
      this.gql.mutate({
        variables: {
          orderId: input.orderId,
          dispensaryId: input.dispensaryId,
          amount: input.amount,
          provider: input.provider,
        },
      }),
    );
    const payload = result.data?.initiateCashlessPayment;
    if (!payload) {
      throw new Error('Cashless payment initiation returned no result');
    }
    const externalUrl = payload.redirectUrl ?? payload.paymentUrl ?? null;
    return {
      referenceId: payload.referenceId,
      externalUrl,
    };
  }

  /**
   * Navigate the browser to the processor's payment page. Extracted as a
   * single overridable method so component tests can stub redirect without
   * actually changing window.location.
   */
  redirectTo(url: string): void {
    window.location.href = url;
  }
}
