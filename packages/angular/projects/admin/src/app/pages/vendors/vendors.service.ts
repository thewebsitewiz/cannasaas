import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  CreateVendorGQL,
  PurchaseOrdersGQL,
  type PurchaseOrdersQuery,
  ValidateMetrcLicenseGQL,
  type ValidateMetrcLicenseMutation,
  type VendorsQuery,
  VendorStatsGQL,
  type VendorStatsQuery,
  VendorsGQL,
} from '@cannasaas/ui-ng';
import { firstValueFrom, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type Vendor = VendorsQuery['vendors'][number];
export type VendorStats = NonNullable<VendorStatsQuery['vendorStats']>;
export type PurchaseOrder = PurchaseOrdersQuery['purchaseOrders'][number];

export interface CreateVendorInput {
  readonly name: string;
  readonly vendorType: string;
  readonly state?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly paymentTerms?: string | null;
  readonly contactName?: string | null;
  readonly contactTitle?: string | null;
  readonly licenseNumber?: string | null;
  readonly licenseState?: string | null;
}

export type LicenseValidation = ValidateMetrcLicenseMutation['validateMetrcLicense'];

/**
 * Wraps the vendor queries + `CreateVendor` mutation. The purchase-
 * orders list is dispensary-scoped and only loaded when the user
 * toggles `showPurchaseOrders(true)`, matching React's lazy load.
 */
@Injectable({ providedIn: 'root' })
export class VendorsService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _reload = signal<number>(0);
  private readonly _saving = signal<boolean>(false);
  private readonly _showPurchaseOrders = signal<boolean>(false);

  readonly saving = this._saving.asReadonly();
  readonly showPurchaseOrders = this._showPurchaseOrders.asReadonly();

  togglePurchaseOrders(): void {
    this._showPurchaseOrders.update((v) => !v);
  }

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  async create(input: CreateVendorInput): Promise<void> {
    this._saving.set(true);
    try {
      const gql = this.injector.get(CreateVendorGQL);
      await firstValueFrom(
        gql.mutate({
          variables: {
            name: input.name,
            vendorType: input.vendorType,
            state: input.state ?? null,
            email: input.email ?? null,
            phone: input.phone ?? null,
            paymentTerms: input.paymentTerms ?? null,
            contactName: input.contactName ?? null,
            contactTitle: input.contactTitle ?? null,
            licenseNumber: input.licenseNumber ?? null,
            licenseState: input.licenseState ?? null,
          },
        }),
      );
      this.reload();
    } finally {
      this._saving.set(false);
    }
  }

  async validateLicense(licenseNumber: string, state: string): Promise<LicenseValidation> {
    const gql = this.injector.get(ValidateMetrcLicenseGQL);
    const result = await firstValueFrom(gql.mutate({ variables: { licenseNumber, state } }));
    return (
      result.data?.validateMetrcLicense ?? {
        __typename: 'MetrcLicenseValidationResult',
        valid: false,
        reason: 'No response from API.',
        licenseType: null,
      }
    );
  }

  readonly vendorsResource = rxResource({
    params: () => ({ reload: this._reload() }),
    stream: () => {
      const gql = this.injector.get(VendorsGQL);
      return gql.fetch().pipe(map((r): readonly Vendor[] => r.data?.vendors ?? []));
    },
  });

  readonly statsResource = rxResource({
    params: () => ({ reload: this._reload() }),
    stream: () => {
      const gql = this.injector.get(VendorStatsGQL);
      return gql.fetch().pipe(map((r): VendorStats | null => r.data?.vendorStats ?? null));
    },
  });

  readonly purchaseOrdersResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      enabled: this._showPurchaseOrders(),
    }),
    stream: ({ params }) => {
      if (!params.enabled || !params.dispensaryId) {
        return of<readonly PurchaseOrder[]>([]);
      }
      const gql = this.injector.get(PurchaseOrdersGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): readonly PurchaseOrder[] => r.data?.purchaseOrders ?? []));
    },
  });

  readonly vendors = computed<readonly Vendor[]>(() => this.vendorsResource.value() ?? []);
  readonly stats = computed<VendorStats | null>(() => this.statsResource.value() ?? null);
  readonly purchaseOrders = computed<readonly PurchaseOrder[]>(
    () => this.purchaseOrdersResource.value() ?? [],
  );

  readonly isLoading = this.vendorsResource.isLoading;
  readonly error = this.vendorsResource.error;
  readonly purchaseOrdersLoading = this.purchaseOrdersResource.isLoading;
}
