import { useQuery } from '@tanstack/react-query';
import { gql } from '../lib/api';
import { Building2, TrendingDown, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const Q = `query { platformReport { tenantHealth churnRate totalTenants churned } }`;

const statusBadge = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-50 text-green-700';
    case 'trial': return 'bg-blue-50 text-blue-700';
    case 'suspended': return 'bg-red-50 text-red-700';
    case 'churned': return 'bg-gray-100 text-gray-600';
    default: return 'bg-amber-50 text-amber-700';
  }
};

const tierBadge = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case 'enterprise': return 'bg-purple-50 text-purple-700';
    case 'professional': case 'pro': return 'bg-blue-50 text-blue-700';
    case 'starter': return 'bg-gray-100 text-gray-600';
    default: return 'bg-amber-50 text-amber-700';
  }
};

export function ReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['platformReport'], queryFn: () => gql<any>(Q), select: r => r.platformReport });

  if (isLoading) return <div className="text-slate-400 p-8">Loading reports...</div>;
  if (!data) return <div className="text-slate-400 p-8">No report data available.</div>;

  const tenants = data.tenantHealth ?? [];
  const activeTenants = tenants.filter((t: any) => t.status === 'active').length;
  const atRisk = tenants.filter((t: any) => (t.orders_30d ?? 0) === 0 && t.status === 'active').length;
  const totalMrr = tenants.reduce((s: number, t: any) => s + parseFloat(t.mrr || 0), 0);
  const totalGmv = tenants.reduce((s: number, t: any) => s + parseFloat(t.gmv_30d || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Platform Reports</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2"><Users size={16} /> Total Tenants</div>
          <p className="text-3xl font-bold text-slate-900">{data.totalTenants}</p>
          <p className="text-xs text-slate-400 mt-1">{activeTenants} active</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-sm text-red-500 mb-2"><XCircle size={16} /> Churned</div>
          <p className="text-3xl font-bold text-red-600">{data.churned}</p>
          <p className="text-xs text-slate-400 mt-1">lifetime</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2"><TrendingDown size={16} /> Churn Rate</div>
          <p className={'text-3xl font-bold ' + (data.churnRate > 10 ? 'text-red-600' : data.churnRate > 5 ? 'text-amber-600' : 'text-green-600')}>
            {data.churnRate}%
          </p>
          <p className="text-xs text-slate-400 mt-1">{data.churnRate <= 5 ? 'Healthy' : data.churnRate <= 10 ? 'Moderate' : 'High'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2"><Building2 size={16} /> Total MRR</div>
          <p className="text-3xl font-bold text-slate-900">${totalMrr.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
          <p className="text-xs text-slate-400 mt-1">across all tenants</p>
        </div>
      </div>

      {/* At-risk alert */}
      {atRisk > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{atRisk} tenant{atRisk > 1 ? 's' : ''} at risk</p>
            <p className="text-xs text-amber-600">Active tenants with zero orders in the last 30 days</p>
          </div>
        </div>
      )}

      {/* GMV Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Total GMV (30d)</p>
          <p className="text-2xl font-bold text-slate-900">${totalGmv.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Avg MRR per Tenant</p>
          <p className="text-2xl font-bold text-slate-900">
            ${activeTenants > 0 ? (totalMrr / activeTenants).toFixed(0) : '0'}
          </p>
        </div>
      </div>

      {/* Tenant Health Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-semibold text-slate-700">Tenant Health</span>
          <span className="text-xs text-slate-400">{tenants.length} tenants</span>
        </div>
        {tenants.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-2 text-slate-500 font-medium">Tenant</th>
                <th className="text-center px-4 py-2 text-slate-500 font-medium">Tier</th>
                <th className="text-center px-4 py-2 text-slate-500 font-medium">Status</th>
                <th className="text-right px-4 py-2 text-slate-500 font-medium">MRR</th>
                <th className="text-right px-4 py-2 text-slate-500 font-medium">Orders (30d)</th>
                <th className="text-right px-4 py-2 text-slate-500 font-medium">GMV (30d)</th>
                <th className="text-center px-4 py-2 text-slate-500 font-medium">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tenants.map((t: any, i: number) => {
                const isAtRisk = (t.orders_30d ?? 0) === 0 && t.status === 'active';
                return (
                  <tr key={i} className={isAtRisk ? 'bg-amber-50/30' : ''}>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{t.name}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierBadge(t.tier)}`}>{t.tier}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge(t.status)}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">${parseFloat(t.mrr || 0).toFixed(0)}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums ${isAtRisk ? 'text-amber-600 font-semibold' : ''}`}>
                      {t.orders_30d ?? 0}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">${parseFloat(t.gmv_30d || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-2.5 text-center">
                      {t.status === 'active' && (t.orders_30d ?? 0) > 0 ? (
                        <CheckCircle size={16} className="mx-auto text-green-500" />
                      ) : t.status === 'active' ? (
                        <AlertTriangle size={16} className="mx-auto text-amber-500" />
                      ) : t.status === 'churned' || t.status === 'suspended' ? (
                        <XCircle size={16} className="mx-auto text-red-400" />
                      ) : (
                        <span className="text-xs text-slate-400">--</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-slate-400">No tenant data available</div>
        )}
      </div>
    </div>
  );
}
