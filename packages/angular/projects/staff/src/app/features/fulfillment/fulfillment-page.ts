import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { AvailableTimeSlotsGQL, DeliveryZonesForFulfillmentGQL } from '@cannasaas/ui-ng';
import { AuthService } from '../../core/auth/auth.service';

interface DeliveryZone {
  readonly zoneId: string;
  readonly name: string;
  readonly radiusMiles: number;
  readonly deliveryFee: number;
  readonly minOrderAmount: number;
  readonly freeDeliveryThreshold: number | null;
}

interface TimeSlot {
  readonly slotId: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly spotsRemaining: number;
}

function tomorrowYmd(): string {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t.toISOString().split('T')[0] ?? '';
}

@Component({
  selector: 'cs-fulfillment-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-6">
      <h1 class="text-2xl font-bold">Fulfillment</h1>
    </header>

    <section class="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <p class="text-lg font-bold">{{ zones().length }}</p>
        <p class="text-xs text-(--color-text-muted)">Delivery Zones</p>
      </div>
      <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <p class="text-lg font-bold">{{ maxRadius() }} mi</p>
        <p class="text-xs text-(--color-text-muted)">Max Radius</p>
      </div>
      <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <p class="text-lg font-bold">{{ pickupSlots().length }}</p>
        <p class="text-xs text-(--color-text-muted)">Pickup Slots ({{ dateLabel }})</p>
      </div>
      <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <p class="text-lg font-bold">{{ deliverySlots().length }}</p>
        <p class="text-xs text-(--color-text-muted)">Delivery Slots ({{ dateLabel }})</p>
      </div>
    </section>

    <section class="mb-6 rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
      <h2 class="mb-4 text-lg font-semibold">Delivery Zones</h2>
      @if (zones().length === 0) {
        <p class="text-sm text-(--color-text-muted)">No delivery zones configured</p>
      } @else {
        <ul class="grid grid-cols-1 gap-3 md:grid-cols-3">
          @for (z of zones(); track z.zoneId) {
            <li class="rounded-lg border border-(--color-border) p-4">
              <h3 class="font-medium">{{ z.name }}</h3>
              <p class="mt-1 space-y-0.5 text-sm text-(--color-text-muted)">
                <span class="block">Radius: {{ z.radiusMiles }} mi</span>
                <span class="block">
                  Fee: {{ z.deliveryFee > 0 ? '$' + z.deliveryFee : 'Free' }}
                </span>
                <span class="block">Min order: \${{ z.minOrderAmount }}</span>
                @if (z.freeDeliveryThreshold) {
                  <span class="block">Free above: \${{ z.freeDeliveryThreshold }}</span>
                }
              </p>
            </li>
          }
        </ul>
      }
    </section>

    <section class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <h2 class="mb-3 text-lg font-semibold">Pickup Slots — {{ dateLabel }}</h2>
        @if (pickupSlots().length === 0) {
          <p class="text-sm text-(--color-text-muted)">No pickup slots</p>
        } @else {
          <ul class="space-y-2">
            @for (s of pickupSlots(); track s.slotId) {
              <li
                class="flex items-center justify-between rounded-lg bg-(--color-surface-alt) p-3 text-sm"
              >
                <span class="font-medium">
                  {{ s.startTime.slice(0, 5) }} - {{ s.endTime.slice(0, 5) }}
                </span>
                <span
                  class="text-xs font-semibold"
                  [class.text-rose-600]="s.spotsRemaining <= 2"
                  [class.text-emerald-600]="s.spotsRemaining > 2"
                >
                  {{ s.spotsRemaining }} spots
                </span>
              </li>
            }
          </ul>
        }
      </div>
      <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <h2 class="mb-3 text-lg font-semibold">Delivery Slots — {{ dateLabel }}</h2>
        @if (deliverySlots().length === 0) {
          <p class="text-sm text-(--color-text-muted)">No delivery slots</p>
        } @else {
          <ul class="space-y-2">
            @for (s of deliverySlots(); track s.slotId) {
              <li
                class="flex items-center justify-between rounded-lg bg-(--color-surface-alt) p-3 text-sm"
              >
                <span class="font-medium">
                  {{ s.startTime.slice(0, 5) }} - {{ s.endTime.slice(0, 5) }}
                </span>
                <span
                  class="text-xs font-semibold"
                  [class.text-rose-600]="s.spotsRemaining <= 1"
                  [class.text-emerald-600]="s.spotsRemaining > 1"
                >
                  {{ s.spotsRemaining }} spots
                </span>
              </li>
            }
          </ul>
        }
      </div>
    </section>
  `,
})
export class FulfillmentPage {
  private readonly auth = inject(AuthService);
  private readonly zonesGQL = inject(DeliveryZonesForFulfillmentGQL);
  private readonly slotsGQL = inject(AvailableTimeSlotsGQL);

  protected readonly dateLabel = tomorrowYmd();
  protected readonly zones = signal<readonly DeliveryZone[]>([]);
  protected readonly pickupSlots = signal<readonly TimeSlot[]>([]);
  protected readonly deliverySlots = signal<readonly TimeSlot[]>([]);

  protected readonly maxRadius = computed(() =>
    this.zones().length > 0 ? Math.max(...this.zones().map((z) => z.radiusMiles)) : 0,
  );

  constructor() {
    effect(() => {
      const id = this.auth.user()?.dispensaryId;
      if (!id) return;
      void this.loadZones(id);
      void this.loadSlots(id, 'pickup', this.dateLabel).then((s) => this.pickupSlots.set(s));
      void this.loadSlots(id, 'delivery', this.dateLabel).then((s) => this.deliverySlots.set(s));
    });
  }

  private async loadZones(dispensaryId: string): Promise<void> {
    try {
      const result = await this.zonesGQL
        .fetch({
          variables: { dispensaryId },
          fetchPolicy: 'network-only',
        })
        .toPromise();
      this.zones.set((result?.data?.deliveryZones ?? []) as unknown as DeliveryZone[]);
    } catch {
      this.zones.set([]);
    }
  }

  private async loadSlots(
    dispensaryId: string,
    slotType: 'pickup' | 'delivery',
    date: string,
  ): Promise<readonly TimeSlot[]> {
    try {
      const result = await this.slotsGQL
        .fetch({
          variables: { dispensaryId, slotType, date },
          fetchPolicy: 'network-only',
        })
        .toPromise();
      return (result?.data?.availableTimeSlots ?? []) as unknown as TimeSlot[];
    } catch {
      return [];
    }
  }
}
