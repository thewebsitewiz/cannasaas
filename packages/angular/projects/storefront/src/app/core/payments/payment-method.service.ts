import { Injectable, computed, inject, signal } from '@angular/core';
import { AvailablePaymentMethodsGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';

export type PaymentMethodName = 'cash' | 'canpay' | 'aeropay';

export interface PaymentMethodInfo {
  readonly method: PaymentMethodName;
  readonly enabled: boolean;
}

const SUPPORTED_METHODS: readonly PaymentMethodName[] = ['cash', 'canpay', 'aeropay'];

function isPaymentMethodName(value: string): value is PaymentMethodName {
  return (SUPPORTED_METHODS as readonly string[]).includes(value);
}

@Injectable({ providedIn: 'root' })
export class PaymentMethodService {
  private readonly gql = inject(AvailablePaymentMethodsGQL);

  private readonly _methods = signal<readonly PaymentMethodInfo[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly methods = this._methods.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly enabledMethods = computed(() => this._methods().filter((m) => m.enabled));

  async load(dispensaryId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const result = await firstValueFrom(
        this.gql.fetch({
          variables: { dispensaryId },
          fetchPolicy: 'network-only',
        }),
      );
      const raw = result.data?.availablePaymentMethods ?? [];
      const filtered = raw.filter((m): m is { method: PaymentMethodName; enabled: boolean } =>
        isPaymentMethodName(m.method),
      );
      this._methods.set(filtered);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load payment methods';
      this._error.set(message);
      this._methods.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  isEnabled(method: PaymentMethodName): boolean {
    return this._methods().some((m) => m.method === method && m.enabled);
  }
}
