import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { Clock, Users, DollarSign, Download, Calendar } from 'lucide-react';

const ACTIVE_CLOCKS = `query($id: ID!) { activeClocks(dispensaryId: $id) {
  entryId profileId firstName lastName positionName clockIn hoursSoFar
}}`;

const PAYROLL_QUERY = `query($id: ID!, $start: String!, $end: String!) { payrollReport(dispensaryId: $id, startDate: $start, endDate: $end) {
  employeeNumber firstName lastName positionName hourlyRate isExempt totalHours overtimeHours shiftsWorked regularPay grossPayWithOt
}}`;

export function TimeClockPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const token = useAuthStore((s) => s.token);

  const today = new Date();
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const [startDate, setStartDate] = useState(twoWeeksAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const { data: activeClocks } = useQuery({
    queryKey: ['activeClocks', dispensaryId],
    queryFn: () => gqlRequest<any>(ACTIVE_CLOCKS, { id: dispensaryId }),
    select: (d) => d.activeClocks,
    enabled: !!dispensaryId,
    refetchInterval: 30_000,
  });

  const { data: payroll, isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll', dispensaryId, startDate, endDate],
    queryFn: () => gqlRequest<any>(PAYROLL_QUERY, { id: dispensaryId, start: startDate, end: endDate }),
    select: (d) => d.payrollReport,
    enabled: !!dispensaryId,
  });

  const totalHours = payroll?.reduce((s: number, r: any) => s + (r.totalHours || 0), 0) ?? 0;
  const totalGross = payroll?.reduce((s: number, r: any) => s + (r.grossPayWithOt || r.regularPay || 0), 0) ?? 0;
  const totalOT = payroll?.reduce((s: number, r: any) => s + (r.overtimeHours || 0), 0) ?? 0;

  const handleExportCsv = () => {
    const url = `/v1/payroll/export?dispensaryId=${dispensaryId}&startDate=${startDate}&endDate=${endDate}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${startDate}-to-${endDate}.csv`;
    // Need auth header — use fetch
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-dispensary-id': dispensaryId ?? '',
        'x-organization-id': useAuthStore.getState().user?.organizationId ?? '',
      }
    }).then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-txt">Time Clock & Payroll</h1>

      {/* Who's Clocked In */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-txt mb-4 flex items-center gap-2">
          <Clock size={18} className="text-green-600" /> Currently On the Clock
          <span className="text-xs text-txt-muted font-normal ml-2">Auto-refreshes every 30s</span>
        </h2>
        {activeClocks && activeClocks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeClocks.map((c: any) => (
              <div key={c.entryId} className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-bold text-sm">
                  {c.firstName?.[0]}{c.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-txt text-sm truncate">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-txt-secondary">{c.positionName}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-700 tabular-nums">{c.hoursSoFar.toFixed(1)}h</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-txt-muted text-sm">No one currently clocked in</p>
        )}
      </div>

      {/* Payroll Report */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-txt flex items-center gap-2">
            <DollarSign size={18} /> Payroll Report
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-txt-muted" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="border border-border rounded-lg px-2 py-1 text-sm" />
              <span className="text-txt-muted">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="border border-border rounded-lg px-2 py-1 text-sm" />
            </div>
            <button onClick={handleExportCsv}
              className="flex items-center gap-1.5 bg-brand-600 text-txt-inverse text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-4 gap-0 border-b border-border">
          <div className="p-4 text-center border-r border-border">
            <p className="text-xl font-bold">{payroll?.length ?? 0}</p>
            <p className="text-xs text-txt-secondary">Employees</p>
          </div>
          <div className="p-4 text-center border-r border-border">
            <p className="text-xl font-bold tabular-nums">{totalHours.toFixed(1)}</p>
            <p className="text-xs text-txt-secondary">Total Hours</p>
          </div>
          <div className="p-4 text-center border-r border-border">
            <p className="text-xl font-bold tabular-nums text-amber-600">{totalOT.toFixed(1)}</p>
            <p className="text-xs text-txt-secondary">OT Hours</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xl font-bold tabular-nums text-brand-700">${totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-txt-secondary">Gross Pay</p>
          </div>
        </div>

        {payrollLoading ? (
          <div className="p-8 text-center text-txt-muted">Loading payroll...</div>
        ) : payroll && payroll.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-bg-alt border-b border-border">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-txt-secondary">Employee</th>
                <th className="text-left px-4 py-2 font-medium text-txt-secondary">Position</th>
                <th className="text-right px-4 py-2 font-medium text-txt-secondary">Rate</th>
                <th className="text-right px-4 py-2 font-medium text-txt-secondary">Hours</th>
                <th className="text-right px-4 py-2 font-medium text-txt-secondary">OT</th>
                <th className="text-right px-4 py-2 font-medium text-txt-secondary">Shifts</th>
                <th className="text-right px-4 py-2 font-medium text-txt-secondary">Gross Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payroll.map((r: any, i: number) => (
                <tr key={i} className={r.isExempt ? 'bg-bg-alt' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-txt">{r.firstName} {r.lastName}</p>
                    <p className="text-xs text-txt-muted">{r.employeeNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.positionName}
                    {r.isExempt && <span className="text-xs ml-1 text-txt-muted">(exempt)</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">${r.hourlyRate?.toFixed(2) ?? '-'}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{r.totalHours.toFixed(1)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${r.overtimeHours > 0 ? 'text-amber-600 font-semibold' : 'text-txt-muted'}`}>
                    {r.overtimeHours > 0 ? r.overtimeHours.toFixed(1) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.shiftsWorked}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-txt">
                    ${(r.grossPayWithOt ?? r.regularPay ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-txt-muted">No payroll data for this period</div>
        )}
      </div>
    </div>
  );
}
