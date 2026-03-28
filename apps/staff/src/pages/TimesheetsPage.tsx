import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { ChevronLeft, ChevronRight, Calendar, Clock, ArrowLeft } from 'lucide-react';

// ── GraphQL ────────────────────────────────────────────────────────────

const MY_TIME_ENTRIES = `
  query($dispensaryId: ID!, $startDate: String!, $endDate: String!) {
    myTimeEntries(dispensaryId: $dispensaryId, startDate: $startDate, endDate: $endDate) {
      entryId clockIn clockOut breakMinutes totalHours overtimeHours status notes approvedAt
    }
  }
`;

// ── Types ──────────────────────────────────────────────────────────────

interface TimeEntry {
  entryId: string;
  clockIn: string;
  clockOut: string | null;
  breakMinutes: number;
  totalHours: number | null;
  overtimeHours: number | null;
  status: string;
  notes: string | null;
  approvedAt: string | null;
}

interface WeekSummary {
  startDate: Date;
  endDate: Date;
  label: string;
  totalHours: number;
  totalShifts: number;
  entries: TimeEntry[];
  hasUnapproved: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────

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

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatWeekLabel(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function getDayName(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long' });
}

function getDayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  clocked_in: 'bg-blue-50 text-blue-700 border-blue-200',
};

// ── Component ──────────────────────────────────────────────────────────

export function TimesheetsPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const [weeksBack, setWeeksBack] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState<WeekSummary | null>(null);

  // Generate 8 weeks of date ranges starting from current week
  const weeks: Array<{ start: Date; end: Date }> = [];
  const thisMonday = getMonday(new Date());
  for (let i = weeksBack; i < weeksBack + 8; i++) {
    const start = new Date(thisMonday);
    start.setDate(start.getDate() - i * 7);
    weeks.push({ start, end: getSunday(start) });
  }

  // Fetch all entries for the visible range
  const rangeStart = formatDate(weeks[weeks.length - 1].start);
  const rangeEnd = formatDate(weeks[0].end);

  const { data, isLoading } = useQuery({
    queryKey: ['myTimesheets', dispensaryId, rangeStart, rangeEnd],
    queryFn: () =>
      gqlRequest<{ myTimeEntries: TimeEntry[] }>(MY_TIME_ENTRIES, {
        dispensaryId,
        startDate: rangeStart,
        endDate: rangeEnd,
      }),
    select: (d) => d.myTimeEntries,
    enabled: !!dispensaryId,
  });

  const entries = data ?? [];

  // Build week summaries
  const weekSummaries: WeekSummary[] = weeks.map(({ start, end }) => {
    const weekEntries = entries.filter((e) => {
      const d = new Date(e.clockIn);
      return d >= start && d <= new Date(end.getTime() + 86400000);
    });
    const totalHours = weekEntries.reduce((sum, e) => sum + (e.totalHours ?? 0), 0);
    const hasUnapproved = weekEntries.some((e) => e.status === 'completed');

    return {
      startDate: start,
      endDate: end,
      label: formatWeekLabel(start, end),
      totalHours,
      totalShifts: weekEntries.filter((e) => e.status !== 'clocked_in').length,
      entries: weekEntries,
      hasUnapproved,
    };
  });

  // ── Detail View ──────────────────────────────────────────────────────

  if (selectedWeek) {
    const dayMap = new Map<string, TimeEntry[]>();
    const monday = new Date(selectedWeek.startDate);

    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      dayMap.set(formatDate(d), []);
    }

    // Slot entries into days
    for (const entry of selectedWeek.entries) {
      const key = new Date(entry.clockIn).toISOString().split('T')[0];
      if (dayMap.has(key)) {
        dayMap.get(key)!.push(entry);
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedWeek(null)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Weekly Timesheet</h1>
            <p className="text-sm text-gray-500 mt-0.5">{selectedWeek.label}</p>
          </div>
        </div>

        {/* Week Summary Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{formatDuration(selectedWeek.totalHours)}</p>
            <p className="text-xs text-gray-500 mt-1">Total Hours</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{selectedWeek.totalShifts}</p>
            <p className="text-xs text-gray-500 mt-1">Shifts</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className={`text-2xl font-bold ${selectedWeek.totalHours > 40 ? 'text-amber-600' : 'text-gray-900'}`}>
              {selectedWeek.totalHours > 40 ? formatDuration(selectedWeek.totalHours - 40) : '0h 00m'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Overtime</p>
          </div>
        </div>

        {/* Day-by-Day */}
        <div className="space-y-3">
          {Array.from(dayMap.entries()).map(([dateStr, dayEntries]) => {
            const d = new Date(dateStr + 'T12:00:00');
            const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
            const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const dayTotal = dayEntries.reduce((sum, e) => sum + (e.totalHours ?? 0), 0);
            const isToday = formatDate(new Date()) === dateStr;

            return (
              <div
                key={dateStr}
                className={`bg-white rounded-xl border ${isToday ? 'border-brand-300 ring-1 ring-brand-100' : 'border-gray-100'} overflow-hidden`}
              >
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{dayName}</span>
                    <span className="text-xs text-gray-400">{dayLabel}</span>
                    {isToday && (
                      <span className="text-[10px] font-medium bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-700 tabular-nums">
                    {dayTotal > 0 ? formatDuration(dayTotal) : '—'}
                  </span>
                </div>

                {dayEntries.length === 0 ? (
                  <div className="px-5 py-4 text-xs text-gray-300">No shifts</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {dayEntries.map((entry) => (
                      <div key={entry.entryId} className="px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Clock size={14} className="text-gray-400" />
                            <span className="font-medium">{formatTime(entry.clockIn)}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium">
                              {entry.clockOut ? formatTime(entry.clockOut) : 'In progress'}
                            </span>
                          </div>
                          {entry.breakMinutes > 0 && (
                            <span className="text-xs text-gray-400">{entry.breakMinutes}m break</span>
                          )}
                          {entry.notes && (
                            <span className="text-xs text-gray-400 italic truncate max-w-[200px]">{entry.notes}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold tabular-nums text-gray-900">
                            {entry.totalHours ? formatDuration(entry.totalHours) : '—'}
                          </span>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                              STATUS_STYLES[entry.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'
                            }`}
                          >
                            {entry.status === 'clocked_in' ? 'Active' : entry.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── List View ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeeksBack((w) => w + 8)}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Older"
          >
            <ChevronLeft size={18} />
          </button>
          {weeksBack > 0 && (
            <button
              onClick={() => setWeeksBack((w) => Math.max(0, w - 8))}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Newer"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-48 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {weekSummaries.map((week) => {
            const isCurrentWeek = formatDate(week.startDate) === formatDate(thisMonday);

            return (
              <button
                key={formatDate(week.startDate)}
                onClick={() => setSelectedWeek(week)}
                className={`w-full text-left bg-white rounded-xl border ${
                  isCurrentWeek ? 'border-brand-300 ring-1 ring-brand-100' : 'border-gray-100'
                } p-5 hover:border-gray-300 hover:shadow-sm transition-all group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400 group-hover:text-brand-500 transition-colors" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{week.label}</span>
                        {isCurrentWeek && (
                          <span className="text-[10px] font-medium bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                        {week.hasUnapproved && (
                          <span className="text-[10px] font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {week.totalShifts} shift{week.totalShifts !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`text-lg font-bold tabular-nums ${
                        week.totalHours > 40 ? 'text-amber-600' : 'text-gray-900'
                      }`}>
                        {week.totalHours > 0 ? formatDuration(week.totalHours) : '—'}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
