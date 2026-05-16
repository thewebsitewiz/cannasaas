import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MyTimeEntriesGQL } from '@cannasaas/ui-ng';
import { AuthService } from '../../core/auth/auth.service';

interface TimeEntry {
  readonly entryId: string;
  readonly clockIn: string;
  readonly clockOut: string | null;
  readonly breakMinutes: number;
  readonly totalHours: number | null;
  readonly overtimeHours: number | null;
  readonly status: string;
  readonly notes: string | null;
  readonly approvedAt: string | null;
}

interface WeekSummary {
  readonly startDate: Date;
  readonly endDate: Date;
  readonly label: string;
  readonly key: string;
  readonly totalHours: number;
  readonly totalShifts: number;
  readonly entries: readonly TimeEntry[];
  readonly hasUnapproved: boolean;
}

const WEEKS_PER_PAGE = 8;

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getSunday(monday: Date): Date {
  const sun = new Date(monday);
  sun.setDate(sun.getDate() + 6);
  return sun;
}

function formatYmd(d: Date): string {
  return d.toISOString().split('T')[0] ?? '';
}

function formatWeekLabel(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr} – ${endStr}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

@Component({
  selector: 'cs-timesheets-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (selectedWeek(); as week) {
      <header class="mb-6 flex items-center gap-3">
        <button
          type="button"
          class="min-h-11 rounded-md border border-(--color-border) px-3 py-1.5 text-sm hover:bg-(--color-surface-hover)"
          (click)="selectedWeek.set(null)"
        >
          ← Back
        </button>
        <div>
          <h1 class="text-2xl font-bold">Weekly Timesheet</h1>
          <p class="mt-0.5 text-sm text-(--color-text-muted)">{{ week.label }}</p>
        </div>
      </header>

      <section class="mb-6 grid grid-cols-3 gap-4">
        <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <p class="text-2xl font-bold tabular-nums">
            {{ formatDuration(week.totalHours) }}
          </p>
          <p class="mt-1 text-xs text-(--color-text-muted)">Total Hours</p>
        </div>
        <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <p class="text-2xl font-bold">{{ week.totalShifts }}</p>
          <p class="mt-1 text-xs text-(--color-text-muted)">Shifts</p>
        </div>
        <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
          <p class="text-2xl font-bold tabular-nums" [class.text-amber-600]="week.totalHours > 40">
            {{ overtimeLabel(week.totalHours) }}
          </p>
          <p class="mt-1 text-xs text-(--color-text-muted)">Overtime</p>
        </div>
      </section>

      <ul class="space-y-3">
        @for (day of dayBuckets(); track day.dateKey) {
          <li
            class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)"
          >
            <header
              class="flex items-center justify-between border-b border-(--color-border) bg-(--color-surface-alt) px-5 py-3"
            >
              <span class="flex items-center gap-2">
                <span class="text-sm font-semibold">{{ day.dayName }}</span>
                <span class="text-xs text-(--color-text-muted)">{{ day.dayLabel }}</span>
                @if (day.isToday) {
                  <span
                    class="rounded-full bg-(--color-primary-xlight) px-2 py-0.5 text-[10px] font-medium text-(--color-primary)"
                  >
                    Today
                  </span>
                }
              </span>
              <span class="text-sm font-bold tabular-nums">
                {{ day.totalHours > 0 ? formatDuration(day.totalHours) : '—' }}
              </span>
            </header>
            @if (day.entries.length === 0) {
              <p class="px-5 py-4 text-xs text-(--color-text-muted)">No shifts</p>
            } @else {
              <ul class="divide-y divide-(--color-border)">
                @for (entry of day.entries; track entry.entryId) {
                  <li class="flex items-center justify-between px-5 py-3">
                    <span class="flex items-center gap-4">
                      <span class="text-sm">
                        {{ formatTime(entry.clockIn) }}
                        →
                        {{ entry.clockOut ? formatTime(entry.clockOut) : 'In progress' }}
                      </span>
                      @if (entry.breakMinutes > 0) {
                        <span class="text-xs text-(--color-text-muted)">
                          {{ entry.breakMinutes }}m break
                        </span>
                      }
                      @if (entry.notes) {
                        <span
                          class="max-w-[200px] truncate text-xs italic text-(--color-text-muted)"
                        >
                          {{ entry.notes }}
                        </span>
                      }
                    </span>
                    <span class="flex items-center gap-3">
                      <span class="text-sm font-bold tabular-nums">
                        {{ entry.totalHours ? formatDuration(entry.totalHours) : '—' }}
                      </span>
                      <span
                        class="rounded-full border border-(--color-border) px-2 py-0.5 text-[10px] font-medium text-(--color-text-muted)"
                      >
                        {{ statusLabel(entry.status) }}
                      </span>
                    </span>
                  </li>
                }
              </ul>
            }
          </li>
        }
      </ul>
    } @else {
      <header class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold">Timesheets</h1>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="min-h-11 rounded-md border border-(--color-border) px-3 py-1.5 text-sm hover:bg-(--color-surface-hover)"
            (click)="olderPage()"
            aria-label="Older weeks"
          >
            ← Older
          </button>
          @if (weeksBack() > 0) {
            <button
              type="button"
              class="min-h-11 rounded-md border border-(--color-border) px-3 py-1.5 text-sm hover:bg-(--color-surface-hover)"
              (click)="newerPage()"
              aria-label="Newer weeks"
            >
              Newer →
            </button>
          }
        </div>
      </header>

      @if (loading()) {
        <ul class="space-y-3">
          @for (i of [1, 2, 3, 4]; track i) {
            <li
              class="animate-pulse rounded-xl border border-(--color-border) bg-(--color-surface) p-5"
            >
              <div class="mb-2 h-4 w-48 rounded bg-(--color-surface-alt)"></div>
              <div class="h-3 w-32 rounded bg-(--color-surface-alt)"></div>
            </li>
          }
        </ul>
      } @else {
        <ul class="space-y-3">
          @for (week of weekSummaries(); track week.key) {
            <li>
              <button
                type="button"
                class="w-full rounded-xl border border-(--color-border) bg-(--color-surface) p-5 text-left transition-all hover:border-(--color-border-strong) hover:shadow-sm"
                [class.border-(--color-primary)]="week.key === currentWeekKey()"
                (click)="selectedWeek.set(week)"
              >
                <div class="flex items-center justify-between">
                  <span>
                    <span class="flex items-center gap-2">
                      <span class="text-sm font-semibold">{{ week.label }}</span>
                      @if (week.key === currentWeekKey()) {
                        <span
                          class="rounded-full bg-(--color-primary-xlight) px-2 py-0.5 text-[10px] font-medium text-(--color-primary)"
                        >
                          Current
                        </span>
                      }
                      @if (week.hasUnapproved) {
                        <span
                          class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                        >
                          Pending
                        </span>
                      }
                    </span>
                    <span class="mt-0.5 block text-xs text-(--color-text-muted)">
                      {{ week.totalShifts }} shift{{ week.totalShifts === 1 ? '' : 's' }}
                    </span>
                  </span>
                  <span
                    class="text-lg font-bold tabular-nums"
                    [class.text-amber-600]="week.totalHours > 40"
                  >
                    {{ week.totalHours > 0 ? formatDuration(week.totalHours) : '—' }}
                  </span>
                </div>
              </button>
            </li>
          }
        </ul>
      }
    }
  `,
})
export class TimesheetsPage {
  private readonly auth = inject(AuthService);
  private readonly timeEntriesGQL = inject(MyTimeEntriesGQL);

  protected readonly weeksBack = signal(0);
  protected readonly selectedWeek = signal<WeekSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly entries = signal<readonly TimeEntry[]>([]);

  private readonly dispensaryId = computed(() => this.auth.user()?.dispensaryId ?? null);

  private readonly thisMonday = getMonday(new Date());

  protected readonly currentWeekKey = computed(() => formatYmd(this.thisMonday));

  protected readonly weekRanges = computed(() => {
    const out: { start: Date; end: Date }[] = [];
    for (let i = this.weeksBack(); i < this.weeksBack() + WEEKS_PER_PAGE; i++) {
      const start = new Date(this.thisMonday);
      start.setDate(start.getDate() - i * 7);
      out.push({ start, end: getSunday(start) });
    }
    return out;
  });

  protected readonly weekSummaries = computed<readonly WeekSummary[]>(() => {
    const all = this.entries();
    return this.weekRanges().map(({ start, end }) => {
      const endPlus = new Date(end.getTime() + 86_400_000);
      const weekEntries = all.filter((e) => {
        const d = new Date(e.clockIn);
        return d >= start && d <= endPlus;
      });
      const totalHours = weekEntries.reduce((sum, e) => sum + (e.totalHours ?? 0), 0);
      const hasUnapproved = weekEntries.some((e) => e.status === 'completed');
      return {
        startDate: start,
        endDate: end,
        label: formatWeekLabel(start, end),
        key: formatYmd(start),
        totalHours,
        totalShifts: weekEntries.filter((e) => e.status !== 'clocked_in').length,
        entries: weekEntries,
        hasUnapproved,
      };
    });
  });

  protected readonly dayBuckets = computed(() => {
    const week = this.selectedWeek();
    if (!week) return [];
    const todayKey = formatYmd(new Date());
    const out: Array<{
      dateKey: string;
      dayName: string;
      dayLabel: string;
      isToday: boolean;
      entries: TimeEntry[];
      totalHours: number;
    }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(week.startDate);
      d.setDate(d.getDate() + i);
      const dateKey = formatYmd(d);
      const dayEntries = week.entries.filter((e) => formatYmd(new Date(e.clockIn)) === dateKey);
      out.push({
        dateKey,
        dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
        dayLabel: d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        isToday: dateKey === todayKey,
        entries: dayEntries,
        totalHours: dayEntries.reduce((s, e) => s + (e.totalHours ?? 0), 0),
      });
    }
    return out;
  });

  constructor() {
    effect(() => {
      const id = this.dispensaryId();
      if (!id) return;
      const ranges = this.weekRanges();
      const start = ranges[ranges.length - 1]?.start;
      const end = ranges[0]?.end;
      if (!start || !end) return;
      void this.loadEntries(id, formatYmd(start), formatYmd(end));
    });
  }

  private async loadEntries(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.timeEntriesGQL
        .fetch({
          variables: { dispensaryId, startDate, endDate },
          fetchPolicy: 'network-only',
        })
        .toPromise();
      const rows = (result?.data?.myTimeEntries ?? []) as unknown as TimeEntry[];
      this.entries.set(rows);
    } catch {
      this.entries.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  protected olderPage(): void {
    this.weeksBack.update((w) => w + WEEKS_PER_PAGE);
  }

  protected newerPage(): void {
    this.weeksBack.update((w) => Math.max(0, w - WEEKS_PER_PAGE));
  }

  protected formatDuration = formatDuration;
  protected formatTime = formatTime;

  protected overtimeLabel(totalHours: number): string {
    if (totalHours <= 40) return '0h 00m';
    return formatDuration(totalHours - 40);
  }

  protected statusLabel(status: string): string {
    return status === 'clocked_in' ? 'Active' : status;
  }
}
