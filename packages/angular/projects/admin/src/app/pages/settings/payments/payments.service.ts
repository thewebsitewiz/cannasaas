import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  DeprovisionAeropayForDispensaryGQL,
  DeprovisionCanPayForDispensaryGQL,
  DispensaryPaymentProcessorsGQL,
  type DispensaryPaymentProcessorsQuery,
  DispensaryProcessorName,
  ProvisionAeropayForDispensaryGQL,
  ProvisionCanPayForDispensaryGQL,
  SetActiveDispensaryProcessorGQL,
  SetDispensaryProcessorEnabledGQL,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';

export type ProcessorRow = DispensaryPaymentProcessorsQuery['dispensaryPaymentProcessors'][number];

interface PaymentsSnapshot {
  readonly rows: readonly ProcessorRow[];
  readonly active: DispensaryProcessorName | null;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _reload = signal<number>(0);
  private readonly _busy = signal<DispensaryProcessorName | null>(null);
  private readonly _errorMessage = signal<string | null>(null);

  readonly busy = this._busy.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  clearError(): void {
    this._errorMessage.set(null);
  }

  readonly resource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get<DispensaryPaymentProcessorsGQL>(DispensaryPaymentProcessorsGQL);
      return gql.fetch({ variables: { dispensaryId: params.dispensaryId } }).pipe(
        map(
          (r): PaymentsSnapshot => ({
            rows: r.data?.dispensaryPaymentProcessors ?? [],
            active: r.data?.activeDispensaryProcessor?.activePaymentProcessor ?? null,
          }),
        ),
      );
    },
  });

  readonly rows = computed<readonly ProcessorRow[]>(() => this.resource.value()?.rows ?? []);
  readonly active = computed<DispensaryProcessorName | null>(
    () => this.resource.value()?.active ?? null,
  );
  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;

  rowFor(name: DispensaryProcessorName): ProcessorRow | undefined {
    return this.rows().find((r) => r.processorName === name);
  }

  async setEnabled(
    processorName: DispensaryProcessorName,
    isEnabled: boolean,
    isSandbox?: boolean,
  ): Promise<void> {
    const dispensaryId = this.requireDispensaryId();
    if (!dispensaryId) return;
    await this.runWithBusy(processorName, async () => {
      const gql = this.injector.get<SetDispensaryProcessorEnabledGQL>(
        SetDispensaryProcessorEnabledGQL,
      );
      await firstValueFrom(
        gql.mutate({
          variables: { input: { dispensaryId, processorName, isEnabled, isSandbox } },
        }),
      );
    });
  }

  async setActive(processorName: DispensaryProcessorName | null): Promise<void> {
    const dispensaryId = this.requireDispensaryId();
    if (!dispensaryId) return;
    await this.runWithBusy(processorName, async () => {
      const gql = this.injector.get<SetActiveDispensaryProcessorGQL>(
        SetActiveDispensaryProcessorGQL,
      );
      await firstValueFrom(gql.mutate({ variables: { input: { dispensaryId, processorName } } }));
    });
  }

  async provision(
    processorName: DispensaryProcessorName,
    merchantId: string,
    apiKey: string,
    isSandbox: boolean,
  ): Promise<void> {
    const dispensaryId = this.requireDispensaryId();
    if (!dispensaryId) return;
    await this.runWithBusy(processorName, async () => {
      if (processorName === DispensaryProcessorName.AEROPAY) {
        const gql = this.injector.get<ProvisionAeropayForDispensaryGQL>(
          ProvisionAeropayForDispensaryGQL,
        );
        await firstValueFrom(
          gql.mutate({ variables: { input: { dispensaryId, merchantId, apiKey, isSandbox } } }),
        );
      } else {
        const gql = this.injector.get<ProvisionCanPayForDispensaryGQL>(
          ProvisionCanPayForDispensaryGQL,
        );
        await firstValueFrom(
          gql.mutate({ variables: { input: { dispensaryId, merchantId, apiKey, isSandbox } } }),
        );
      }
    });
  }

  async deprovision(processorName: DispensaryProcessorName): Promise<void> {
    const dispensaryId = this.requireDispensaryId();
    if (!dispensaryId) return;
    await this.runWithBusy(processorName, async () => {
      if (processorName === DispensaryProcessorName.AEROPAY) {
        const gql = this.injector.get<DeprovisionAeropayForDispensaryGQL>(
          DeprovisionAeropayForDispensaryGQL,
        );
        await firstValueFrom(gql.mutate({ variables: { dispensaryId } }));
      } else {
        const gql = this.injector.get<DeprovisionCanPayForDispensaryGQL>(
          DeprovisionCanPayForDispensaryGQL,
        );
        await firstValueFrom(gql.mutate({ variables: { dispensaryId } }));
      }
    });
  }

  private requireDispensaryId(): string | null {
    const id = this.auth.user()?.dispensaryId;
    if (!id) {
      this._errorMessage.set('No dispensary in scope.');
      return null;
    }
    return id;
  }

  private async runWithBusy(
    processor: DispensaryProcessorName | null,
    op: () => Promise<void>,
  ): Promise<void> {
    this._busy.set(processor);
    this._errorMessage.set(null);
    try {
      await op();
      this.reload();
    } catch (err) {
      this._errorMessage.set(err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      this._busy.set(null);
    }
  }
}
