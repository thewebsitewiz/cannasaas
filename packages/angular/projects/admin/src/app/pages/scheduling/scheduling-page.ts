import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';

import {
  SchedulingService,
  type Driver,
  type ScheduledShift,
  type TimeOff,
} from './scheduling.service';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

interface DayCell {
  readonly label: string;
  readonly date: string; // YYYY-MM-DD
  readonly isToday: boolean;
  readonly shifts: readonly ScheduledShift[];
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function cellDomId(date: string): string {
  return 'sched-day-' + date;
}

/**
 * Weekly scheduling overview with CDK drag-drop reassignment (sc-686).
 * Drag a shift card from one day onto another to call reassignShift;
 * the backend re-checks conflict + approved-time-off guards and the
 * resource reloads on success.
 */
@Component({
  selector: 'cs-scheduling-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, CdkDrag],
  template: `
    <section class="space-y-6">
      <h1 class="text-2xl font-bold text-(--color-text)">Scheduling</h1>

      <!-- Week nav -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="prevWeek()"
            aria-label="Previous week"
            class="rounded-lg border border-(--color-border) bg-(--color-surface) p-2 text-(--color-text-secondary) hover:text-(--color-text)"
          >
            ‹
          </button>
          <h2 class="text-lg font-semibold text-(--color-text)">Week of {{ weekStart() }}</h2>
          <button
            type="button"
            (click)="nextWeek()"
            aria-label="Next week"
            class="rounded-lg border border-(--color-border) bg-(--color-surface) p-2 text-(--color-text-secondary) hover:text-(--color-text)"
          >
            ›
          </button>
          @if (weekOffset() !== 0) {
            <button
              type="button"
              (click)="resetWeek()"
              class="text-xs text-(--color-primary) hover:text-(--color-primary-hover)"
            >
              Today
            </button>
          }
        </div>

        @if (unpublishedCount() > 0) {
          <button
            type="button"
            (click)="onPublish()"
            [disabled]="publishing()"
            class="rounded-lg bg-(--color-primary) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-primary-hover) disabled:opacity-50"
            aria-label="Publish unpublished shifts for this week"
          >
            @if (publishing()) {
              Publishing…
            } @else {
              Publish {{ unpublishedCount() }} shifts
            }
          </button>
        }
      </div>

      @if (loading()) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          Loading schedule…
        </p>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load schedule</h2>
          <p class="mt-1 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else {
        @if (reassignError(); as msg) {
          <div
            class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300"
            role="alert"
          >
            {{ msg }}
          </div>
        }

        <!-- Week grid -->
        <div class="grid grid-cols-7 gap-2">
          @for (cell of cells(); track cell.date) {
            <div
              class="min-h-[120px] rounded-xl border p-3"
              [class]="
                cell.isToday
                  ? 'border-(--color-primary) bg-(--color-primary)/5'
                  : 'border-(--color-border) bg-(--color-surface)'
              "
              [attr.aria-label]="cell.label + ' ' + cell.date"
              cdkDropList
              [id]="cellDomId(cell.date)"
              [cdkDropListData]="cell.date"
              [cdkDropListConnectedTo]="dropListIds()"
              (cdkDropListDropped)="onShiftDropped($event)"
            >
              <p
                class="mb-2 text-xs font-semibold"
                [class]="cell.isToday ? 'text-(--color-primary)' : 'text-(--color-text-secondary)'"
              >
                {{ cell.label }} {{ cell.date.slice(5) }}
              </p>
              @if (cell.shifts.length === 0) {
                <p class="text-[10px] text-(--color-text-muted)">No shifts</p>
              } @else {
                <ul class="space-y-1">
                  @for (s of cell.shifts; track s.shiftId) {
                    <li
                      class="cursor-grab rounded px-2 py-1 text-[10px] active:cursor-grabbing"
                      [class]="
                        s.published
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      "
                      cdkDrag
                      [cdkDragData]="s"
                      [attr.data-shift-id]="s.shiftId"
                    >
                      {{ shiftRangeLabel(s) }}
                    </li>
                  }
                </ul>
              }
            </div>
          }
        </div>

        <!-- Drivers + Time-off -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
            <h2 class="mb-3 flex items-center gap-2 text-lg font-semibold text-(--color-text)">
              <span aria-hidden="true">🚚</span> Delivery drivers
            </h2>
            @if (drivers().length === 0) {
              <p class="text-sm text-(--color-text-muted)">No drivers configured</p>
            } @else {
              <ul class="space-y-2">
                @for (d of drivers(); track d.driverId) {
                  <li class="flex items-center justify-between rounded-lg bg-(--color-bg) p-3">
                    <div>
                      <p class="text-sm font-medium text-(--color-text)">
                        {{ driverNameLabel(d) }}
                      </p>
                      <p class="text-xs text-(--color-text-muted)">
                        {{ driverDetailLabel(d) }}
                      </p>
                    </div>
                    <span
                      class="rounded-full px-2 py-0.5 text-xs"
                      [class]="driverStatusClass(d.status)"
                    >
                      {{ d.status }}
                    </span>
                  </li>
                }
              </ul>
            }

            @if (driverStats(); as ds) {
              @if (ds.totalTrips > 0) {
                <div
                  class="mt-4 grid grid-cols-3 gap-2 border-t border-(--color-border) pt-3 text-center text-xs"
                >
                  <div>
                    <p class="text-lg font-bold text-(--color-text) tabular-nums">
                      {{ ds.completed }}
                    </p>
                    <p class="text-(--color-text-muted)">Trips (30d)</p>
                  </div>
                  <div>
                    <p class="text-lg font-bold text-(--color-text) tabular-nums">
                      {{ ds.avgRating.toFixed(1) }}
                    </p>
                    <p class="text-(--color-text-muted)">Avg rating</p>
                  </div>
                  <div>
                    <p class="text-lg font-bold text-(--color-text) tabular-nums">
                      {{ ds.totalMiles.toFixed(0) }}
                    </p>
                    <p class="text-(--color-text-muted)">Total miles</p>
                  </div>
                </div>
              }
            }
          </div>

          <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
            <h2 class="mb-3 flex items-center gap-2 text-lg font-semibold text-(--color-text)">
              <span class="text-amber-500" aria-hidden="true">⏱</span>
              Time-off requests
              @if (pendingTimeOff().length > 0) {
                <span
                  class="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-500"
                >
                  {{ pendingTimeOff().length }} pending
                </span>
              }
            </h2>
            @if (timeOff().length === 0) {
              <p class="text-sm text-(--color-text-muted)">No time-off requests</p>
            } @else {
              <ul class="space-y-2">
                @for (t of timeOff(); track t.requestId) {
                  <li class="flex items-center justify-between rounded-lg bg-(--color-bg) p-3">
                    <div>
                      <p class="text-sm font-medium text-(--color-text)">
                        {{ t.startDate }} to {{ t.endDate }}
                      </p>
                      <p class="text-xs text-(--color-text-muted)">
                        {{ requestLabel(t) }}
                      </p>
                    </div>
                    <span
                      class="rounded-full px-2 py-0.5 text-xs"
                      [class]="timeOffStatusClass(t.status)"
                    >
                      {{ t.status }}
                    </span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class SchedulingPage {
  private readonly svc = inject(SchedulingService);

  protected readonly shifts = this.svc.shifts;
  protected readonly drivers = this.svc.drivers;
  protected readonly driverStats = this.svc.driverStats;
  protected readonly timeOff = this.svc.timeOff;
  protected readonly loading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly publishing = this.svc.publishing;
  protected readonly weekOffset = this.svc.weekOffset;
  protected readonly weekStart = this.svc.weekStart;
  protected readonly reassignError = this.svc.reassignError;

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load schedule.';
  });

  protected readonly unpublishedCount = computed(
    () => this.shifts().filter((s) => !s.published).length,
  );

  protected readonly pendingTimeOff = computed(() =>
    this.timeOff().filter((t) => t.status === 'pending'),
  );

  protected readonly cells = computed<readonly DayCell[]>(() => {
    const weekStart = this.weekStart();
    const today = todayIso();
    const shiftsByDate = new Map<string, ScheduledShift[]>();
    for (const s of this.shifts()) {
      const date = (s.shiftDate ?? '').split('T')[0];
      const list = shiftsByDate.get(date) ?? [];
      list.push(s);
      shiftsByDate.set(date, list);
    }
    return DAY_LABELS.map((label, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const date = d.toISOString().split('T')[0];
      return {
        label,
        date,
        isToday: date === today,
        shifts: shiftsByDate.get(date) ?? [],
      };
    });
  });

  protected readonly dropListIds = computed<string[]>(() =>
    this.cells().map((c) => cellDomId(c.date)),
  );

  protected prevWeek(): void {
    this.svc.shiftWeek(-1);
  }

  protected nextWeek(): void {
    this.svc.shiftWeek(1);
  }

  protected resetWeek(): void {
    this.svc.resetWeek();
  }

  protected onPublish(): void {
    void this.svc.publishWeek();
  }

  protected cellDomId(date: string): string {
    return cellDomId(date);
  }

  protected onShiftDropped(event: CdkDragDrop<string, string, ScheduledShift>): void {
    const fromDate = event.previousContainer.data;
    const toDate = event.container.data;
    if (fromDate === toDate) return;
    const shift = event.item.data;
    if (!shift.shiftId || !shift.profileId) return;
    void this.svc.reassignShift(shift.shiftId, shift.profileId, toDate);
  }

  protected shiftRangeLabel(s: ScheduledShift): string {
    return (s.startTime ?? '').slice(0, 5) + '–' + (s.endTime ?? '').slice(0, 5);
  }

  protected driverNameLabel(d: Driver): string {
    const parts = [d.vehicleYear, d.vehicleMake, d.vehicleModel].filter(Boolean);
    return parts.join(' ') || 'Driver';
  }

  protected driverDetailLabel(d: Driver): string {
    const parts: string[] = [];
    if (d.vehicleColor) parts.push(d.vehicleColor);
    if (d.licensePlate) parts.push(d.licensePlate);
    return parts.join(' · ');
  }

  protected driverStatusClass(status: string): string {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'on_delivery':
      case 'on_trip':
        return 'bg-sky-500/10 text-sky-500';
      default:
        return 'bg-(--color-surface-hover) text-(--color-text-secondary)';
    }
  }

  protected requestLabel(t: TimeOff): string {
    const base = t.requestType.toUpperCase();
    return t.reason ? base + ' — ' + t.reason : base;
  }

  protected timeOffStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500';
      case 'denied':
      case 'rejected':
        return 'bg-rose-500/10 text-rose-500';
      default:
        return 'bg-(--color-surface-hover) text-(--color-text-secondary)';
    }
  }
}
