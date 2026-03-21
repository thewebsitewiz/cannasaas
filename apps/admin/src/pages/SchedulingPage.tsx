import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { CalendarDays, Truck, Clock, ChevronLeft, ChevronRight, Send } from 'lucide-react';

const WEEK_SCHEDULE = `query($id: ID!, $week: String!) { weekSchedule(dispensaryId: $id, weekStart: $week) {
  shiftId shiftDate startTime endTime status published
}}`;

const DRIVERS_QUERY = `query($id: ID!) { drivers(dispensaryId: $id) {
  driverId vehicleMake vehicleModel vehicleColor licensePlate status
}}`;

const DRIVER_STATS = `query($id: ID!) { driverStats(dispensaryId: $id) {
  totalTrips completed avgDeliveryMinutes avgRating totalMiles
}}`;

const TIME_OFF = `query($id: ID!) { timeOffRequests(dispensaryId: $id) {
  requestId startDate endDate requestType reason status
}}`;

const PUBLISH_WEEK = `mutation($id: ID!, $week: String!) { publishWeekSchedule(dispensaryId: $id, weekStart: $week) }`;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekStart(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - (d.getDay() || 7) + 1 + offset * 7);
  return d.toISOString().split('T')[0];
}

export function SchedulingPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = getWeekStart(weekOffset);

  const { data: shifts } = useQuery({
    queryKey: ['weekSchedule', dispensaryId, weekStart],
    queryFn: () => gqlRequest<any>(WEEK_SCHEDULE, { id: dispensaryId, week: weekStart }),
    select: (d) => d.weekSchedule,
    enabled: !!dispensaryId,
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers', dispensaryId],
    queryFn: () => gqlRequest<any>(DRIVERS_QUERY, { id: dispensaryId }),
    select: (d) => d.drivers,
    enabled: !!dispensaryId,
  });

  const { data: driverStats } = useQuery({
    queryKey: ['driverStats', dispensaryId],
    queryFn: () => gqlRequest<any>(DRIVER_STATS, { id: dispensaryId }),
    select: (d) => d.driverStats,
    enabled: !!dispensaryId,
  });

  const { data: timeOff } = useQuery({
    queryKey: ['timeOff', dispensaryId],
    queryFn: () => gqlRequest<any>(TIME_OFF, { id: dispensaryId }),
    select: (d) => d.timeOffRequests,
    enabled: !!dispensaryId,
  });

  const publishMutation = useMutation({
    mutationFn: () => gqlRequest(PUBLISH_WEEK, { id: dispensaryId, week: weekStart }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weekSchedule'] }),
  });

  // Group shifts by day
  const shiftsByDay: Record<string, any[]> = {};
  (shifts ?? []).forEach((s: any) => {
    const day = s.shiftDate?.split('T')?.[0] ?? s.shiftDate;
    if (!shiftsByDay[day]) shiftsByDay[day] = [];
    shiftsByDay[day].push(s);
  });

  const weekDates = DAYS.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const unpublishedCount = (shifts ?? []).filter((s: any) => !s.published).length;
  const ds = driverStats ?? {};
  const pendingTimeOff = (timeOff ?? []).filter((t: any) => t.status === 'pending');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-txt">Scheduling</h1>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 rounded-lg border border-border hover:bg-bg-alt"><ChevronLeft size={16} /></button>
          <h2 className="text-lg font-semibold">
            <CalendarDays size={18} className="inline mr-2 text-brand-600" />
            Week of {weekStart}
          </h2>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 rounded-lg border border-border hover:bg-bg-alt"><ChevronRight size={16} /></button>
          <button onClick={() => setWeekOffset(0)} className="text-xs text-brand-600 hover:text-brand-700">Today</button>
        </div>
        {unpublishedCount > 0 && (
          <button onClick={() => publishMutation.mutate()}
            className="flex items-center gap-1.5 bg-brand-600 text-txt-inverse text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700">
            <Send size={14} /> Publish {unpublishedCount} shifts
          </button>
        )}
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const dayShifts = shiftsByDay[date] ?? [];
          const isToday = date === new Date().toISOString().split('T')[0];
          return (
            <div key={date} className={`bg-surface rounded-xl border p-3 min-h-[120px] ${isToday ? 'border-brand-300 bg-brand-50/30' : 'border-border'}`}>
              <p className={`text-xs font-semibold mb-2 ${isToday ? 'text-brand-700' : 'text-txt-secondary'}`}>
                {DAYS[i]} {date.slice(5)}
              </p>
              {dayShifts.length > 0 ? (
                <div className="space-y-1">
                  {dayShifts.map((s: any) => (
                    <div key={s.shiftId} className={`text-[10px] px-2 py-1 rounded ${s.published ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {s.startTime?.slice(0, 5)}-{s.endTime?.slice(0, 5)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-txt-muted">No shifts</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Drivers */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-txt mb-3 flex items-center gap-2">
            <Truck size={18} className="text-indigo-600" /> Delivery Drivers
          </h2>
          {drivers && drivers.length > 0 ? (
            <div className="space-y-2">
              {drivers.map((d: any) => (
                <div key={d.driverId} className="flex items-center justify-between p-3 bg-bg-alt rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{d.vehicleYear ?? ''} {d.vehicleMake} {d.vehicleModel}</p>
                    <p className="text-xs text-txt-muted">{d.vehicleColor} · {d.licensePlate}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    d.status === 'available' ? 'bg-green-50 text-green-700' :
                    d.status === 'on_delivery' ? 'bg-blue-50 text-blue-700' : 'bg-gray-200 text-gray-600'
                  }`}>{d.status}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-txt-muted">No drivers configured</p>}

          {ds.totalTrips > 0 && (
            <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center text-xs">
              <div><p className="font-bold text-lg">{ds.completed}</p><p className="text-txt-muted">Trips (30d)</p></div>
              <div><p className="font-bold text-lg">{ds.avgRating}</p><p className="text-txt-muted">Avg Rating</p></div>
              <div><p className="font-bold text-lg">{ds.totalMiles}</p><p className="text-txt-muted">Total Miles</p></div>
            </div>
          )}
        </div>

        {/* Time-Off Requests */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-txt mb-3 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" /> Time-Off Requests
            {pendingTimeOff.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingTimeOff.length} pending</span>
            )}
          </h2>
          {timeOff && timeOff.length > 0 ? (
            <div className="space-y-2">
              {timeOff.map((t: any) => (
                <div key={t.requestId} className="flex items-center justify-between p-3 bg-bg-alt rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{t.startDate} to {t.endDate}</p>
                    <p className="text-xs text-txt-muted">{t.requestType.toUpperCase()} {t.reason ? `— ${t.reason}` : ''}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.status === 'approved' ? 'bg-green-50 text-green-700' :
                    t.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-danger-bg text-danger'
                  }`}>{t.status}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-txt-muted">No time-off requests</p>}
        </div>
      </div>
    </div>
  );
}
