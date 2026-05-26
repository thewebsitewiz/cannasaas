import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  DeactivateUserGQL,
  EmployeesGQL,
  type EmployeesQuery,
  InviteStaffGQL,
  type InviteStaffMutation,
  SetUserRoleGQL,
  StaffComplianceOverviewGQL,
  type StaffComplianceOverviewQuery,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type Employee = EmployeesQuery['employees'][number];
export type ComplianceOverview = NonNullable<
  StaffComplianceOverviewQuery['staffComplianceOverview']
>;
export type InviteStaffResult = InviteStaffMutation['inviteStaff'];

export interface InviteStaffInput {
  readonly email: string;
  readonly role: string;
  readonly firstName?: string;
  readonly lastName?: string;
}

/**
 * Staffing data + write-ops (sc-683).
 *
 * Reads: `employeesResource` (roster) + `complianceResource` (KPIs).
 *
 * Writes:
 *   - `invite()` — calls `inviteStaff`; surfaces the dev-mode temporary
 *     password so the admin can hand it off.
 *   - `setRole()` — calls `setUserRole`.
 *   - `deactivate()` — calls `deactivateUser`.
 *
 * Every write triggers a reload of both resources so the roster + KPIs
 * reflect the new state.
 */
@Injectable({ providedIn: 'root' })
export class StaffingService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _reload = signal<number>(0);
  private readonly _busyUserId = signal<string | null>(null);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _lastInvite = signal<InviteStaffResult | null>(null);

  readonly busyUserId = this._busyUserId.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly lastInvite = this._lastInvite.asReadonly();

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  clearError(): void {
    this._errorMessage.set(null);
  }

  clearLastInvite(): void {
    this._lastInvite.set(null);
  }

  readonly employeesResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(EmployeesGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId, status: null } })
        .pipe(map((r): readonly Employee[] => r.data?.employees ?? []));
    },
  });

  readonly complianceResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(StaffComplianceOverviewGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): ComplianceOverview | null => r.data?.staffComplianceOverview ?? null));
    },
  });

  readonly employees = computed<readonly Employee[]>(() => this.employeesResource.value() ?? []);
  readonly compliance = computed<ComplianceOverview | null>(
    () => this.complianceResource.value() ?? null,
  );

  readonly isLoading = computed(
    () => this.employeesResource.isLoading() || this.complianceResource.isLoading(),
  );
  readonly error = computed(
    () => this.employeesResource.error() ?? this.complianceResource.error(),
  );

  async invite(input: InviteStaffInput): Promise<void> {
    const dispensaryId = this.requireDispensaryId();
    if (!dispensaryId) return;
    await this.runWithBusy('invite', async () => {
      const gql = this.injector.get(InviteStaffGQL);
      const result = await firstValueFrom(
        gql.mutate({
          variables: {
            input: {
              email: input.email,
              dispensaryId,
              role: input.role,
              firstName: input.firstName,
              lastName: input.lastName,
            },
          },
        }),
      );
      const payload = result.data?.inviteStaff;
      if (payload) this._lastInvite.set(payload);
    });
  }

  async setRole(userId: string, role: string): Promise<void> {
    await this.runWithBusy(userId, async () => {
      const gql = this.injector.get(SetUserRoleGQL);
      await firstValueFrom(gql.mutate({ variables: { userId, role } }));
    });
  }

  async deactivate(userId: string): Promise<void> {
    await this.runWithBusy(userId, async () => {
      const gql = this.injector.get(DeactivateUserGQL);
      await firstValueFrom(gql.mutate({ variables: { userId } }));
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

  private async runWithBusy(busyKey: string, op: () => Promise<void>): Promise<void> {
    this._busyUserId.set(busyKey);
    this._errorMessage.set(null);
    try {
      await op();
      this.reload();
    } catch (err) {
      this._errorMessage.set(err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      this._busyUserId.set(null);
    }
  }
}
