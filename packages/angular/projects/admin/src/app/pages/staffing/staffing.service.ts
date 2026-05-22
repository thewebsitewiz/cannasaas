import { Injectable, Injector, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  EmployeesGQL,
  type EmployeesQuery,
  StaffComplianceOverviewGQL,
  type StaffComplianceOverviewQuery,
} from '@cannasaas/ui-ng';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type Employee = EmployeesQuery['employees'][number];
export type ComplianceOverview = NonNullable<
  StaffComplianceOverviewQuery['staffComplianceOverview']
>;

/**
 * Read-only staffing data — employee roster + compliance overview.
 * No mutations (the React admin doesn't surface invite/role-change/
 * deactivate either; file a follow-up if those workflows land).
 */
@Injectable({ providedIn: 'root' })
export class StaffingService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  readonly employeesResource = rxResource({
    params: () => ({ dispensaryId: this.auth.user()?.dispensaryId ?? null }),
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
    params: () => ({ dispensaryId: this.auth.user()?.dispensaryId ?? null }),
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
}
