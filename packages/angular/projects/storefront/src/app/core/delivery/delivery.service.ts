import { Injectable, inject } from '@angular/core';
import {
  AvailableTimeSlotsGQL,
  AvailableTimeSlotsQuery,
  CheckDeliveryEligibilityGQL,
  CheckDeliveryEligibilityQuery,
  DeliveryZonesGQL,
  DeliveryZonesQuery,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { DispensaryContextService } from '../tenant/dispensary-context.service';

export type DeliveryEligibility = CheckDeliveryEligibilityQuery['checkDeliveryEligibility'];
export type DeliveryZone = DeliveryZonesQuery['deliveryZones'][number];
export type TimeSlot = AvailableTimeSlotsQuery['availableTimeSlots'][number];
export type SlotType = 'delivery' | 'pickup';

/**
 * Read-only delivery lookups for the current dispensary.
 *
 * Stateless: every call resolves the dispensary fresh from the
 * `DispensaryContextService` so route changes are picked up
 * automatically. Components are expected to drive caching/invalidation
 * via signal `resource()` loaders rather than reading from this service
 * statefully.
 */
@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private readonly dispensary = inject(DispensaryContextService);
  private readonly checkEligibilityGQL = inject(CheckDeliveryEligibilityGQL);
  private readonly zonesGQL = inject(DeliveryZonesGQL);
  private readonly slotsGQL = inject(AvailableTimeSlotsGQL);

  async checkEligibility(
    latitude: number,
    longitude: number,
    orderSubtotal?: number,
  ): Promise<DeliveryEligibility | null> {
    const dispensaryId = this.dispensary.entityId();
    if (!dispensaryId) return null;
    const result = await firstValueFrom(
      this.checkEligibilityGQL.fetch({
        variables: { dispensaryId, latitude, longitude, orderSubtotal },
      }),
    );
    return result.data?.checkDeliveryEligibility ?? null;
  }

  async listZones(): Promise<readonly DeliveryZone[]> {
    const dispensaryId = this.dispensary.entityId();
    if (!dispensaryId) return [];
    const result = await firstValueFrom(
      this.zonesGQL.fetch({ variables: { dispensaryId } }),
    );
    return result.data?.deliveryZones ?? [];
  }

  async listTimeSlots(slotType: SlotType, date: string): Promise<readonly TimeSlot[]> {
    const dispensaryId = this.dispensary.entityId();
    if (!dispensaryId) return [];
    const result = await firstValueFrom(
      this.slotsGQL.fetch({ variables: { dispensaryId, slotType, date } }),
    );
    return result.data?.availableTimeSlots ?? [];
  }
}
