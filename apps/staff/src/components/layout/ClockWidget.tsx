import { useState, useEffect } from 'react';
import { Clock, Play, Square } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ClockStatus {
  isClockedIn: boolean;
  isExempt: boolean;
  currentEntry?: {
    entryId: string;
    clockIn: string;
  };
  todayHours: number;
}

export function ClockWidget() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<ClockStatus>({ isClockedIn: false, isExempt: false, todayHours: 0 });
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState('0:00');

  const dispensaryId = user?.dispensaryId;

  const fetchStatus = async () => {
    if (!token || !dispensaryId) return;
    try {
      const res = await fetch(API_URL + '/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          query: `query($dispensaryId: ID!) {
            clockStatus(dispensaryId: $dispensaryId) {
              isClockedIn isExempt todayHours
              currentEntry { entryId clockIn }
            }
          }`,
          variables: { dispensaryId },
        }),
      });
      const data = await res.json();
      if (data.data?.clockStatus) setStatus(data.data.clockStatus);
    } catch { /* silent */ }
  };

  const clockIn = async () => {
    if (!token || !dispensaryId || loading) return;
    setLoading(true);
    try {
      const res = await fetch(API_URL + '/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          query: `mutation($dispensaryId: ID!) {
            clockIn(dispensaryId: $dispensaryId) { entryId clockIn }
          }`,
          variables: { dispensaryId },
        }),
      });
      const data = await res.json();
      if (data.data?.clockIn) {
        setStatus({
          isClockedIn: true,
          isExempt: false,
          currentEntry: {
            entryId: data.data.clockIn.entryId,
            clockIn: data.data.clockIn.clockIn,
          },
          todayHours: status.todayHours,
        });
      } else if (data.errors) {
        alert(data.errors[0]?.message || 'Clock in failed');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const clockOut = async () => {
    if (!token || !dispensaryId || loading) return;
    setLoading(true);
    try {
      const res = await fetch(API_URL + '/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          query: `mutation($dispensaryId: ID!) {
            clockOut(dispensaryId: $dispensaryId) { entryId totalHours }
          }`,
          variables: { dispensaryId },
        }),
      });
      const data = await res.json();
      if (data.data?.clockOut) {
        const hrs = data.data.clockOut.totalHours;
        setStatus({ isClockedIn: false, isExempt: false, currentEntry: undefined, todayHours: status.todayHours + hrs });
        alert('Clocked out! Total: ' + parseFloat(hrs).toFixed(2) + ' hours');
      } else if (data.errors) {
        alert(data.errors[0]?.message || 'Clock out failed');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount + every 60s
  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 60000);
    return () => clearInterval(iv);
  }, [token, dispensaryId]);

  // Update elapsed timer every second when clocked in
  useEffect(() => {
    if (!status.isClockedIn || !status.currentEntry?.clockIn) {
      setElapsed('0:00');
      return;
    }
    const update = () => {
      const start = new Date(status.currentEntry!.clockIn).getTime();
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setElapsed(h + ':' + m.toString().padStart(2, '0'));
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [status.isClockedIn, status.currentEntry?.clockIn]);

  if (status.isExempt) return null;

  return (
    <div className="flex items-center gap-2">
      {status.isClockedIn ? (
        <>
          <div className="flex items-center gap-1.5 bg-green-900/50 border border-green-700 rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <Clock size={14} className="text-green-400" />
            <span className="text-green-300 text-xs font-mono font-bold tabular-nums">{elapsed}</span>
          </div>
          <button
            onClick={clockOut}
            disabled={loading}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Square size={12} /> Out
          </button>
        </>
      ) : (
        <button
          onClick={clockIn}
          disabled={loading}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <Play size={12} /> Clock In
        </button>
      )}
    </div>
  );
}
