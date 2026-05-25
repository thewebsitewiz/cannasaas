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
  TestDispensaryProcessorGQL,
  type TestDispensaryProcessorMutation,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';

export type ProcessorRow = DispensaryPaymentProcessorsQuery['dispensaryPaymentProcessors'][number];
export type TestResult = TestDispensaryProcessorMutation['testDispensaryProcessor'];

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
  private readonly _testing = signal<DispensaryProcessorName | null>(null);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _testResults = signal<ReadonlyMap<DispensaryProcessorName, TestResult>>(
    new Map(),
  );

  readonly busy = this._busy.asReadonly();
  readonly testing = this._testing.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly testResults = this._testResults.asReadonly();

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

  async testProcessor(processorName: DispensaryProcessorName): Promise<void> {
    const dispensaryId = this.requireDispensaryId();
    if (!dispensaryId) return;
    this._testing.set(processorName);
    try {
      const gql = this.injector.get<TestDispensaryProcessorGQL>(TestDispensaryProcessorGQL);
      const result = await firstValueFrom(
        gql.mutate({ variables: { dispensaryId, processorName } }),
      );
      const payload = result.data?.testDispensaryProcessor;
      if (!payload) {
        this.setTestResult(processorName, {
          __typename: 'TestProcessorResult',
          ok: false,
          latencyMs: null,
          errorMessage: 'No response from API.',
        });
        return;
      }
      this.setTestResult(processorName, payload);
    } catch (err) {
      this.setTestResult(processorName, {
        __typename: 'TestProcessorResult',
        ok: false,
        latencyMs: null,
        errorMessage: err instanceof Error ? err.message : 'Unknown error.',
      });
    } finally {
      this._testing.set(null);
    }
  }

  testResultFor(processorName: DispensaryProcessorName): TestResult | undefined {
    return this._testResults().get(processorName);
  }

  private setTestResult(processorName: DispensaryProcessorName, result: TestResult): void {
    this._testResults.update((m) => {
      const next = new Map(m);
      next.set(processorName, result);
      return next;
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
