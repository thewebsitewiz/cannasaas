import { useQuery } from '@tanstack/react-query';
import { gql } from '../lib/api';

const Q = `query { platformReport { tenantHealth churnRate totalTenants churned } }`;

export function ReportsPage() {
  const { data } = useQuery({ queryKey: ['platformReport'], queryFn: () => gql<any>(Q), select: r => r.platformReport });
  if (!data) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Platform Reports</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <p className="text-3xl font-bold text-slate-900">{data.totalTenants}</p><p className="text-sm text-slate-500">Total Tenants</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <p className="text-3xl font-bold text-red-600">{data.churned}</p><p className="text-sm text-slate-500">Churned</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <p className={'text-3xl font-bold ' + (data.churnRate > 10 ? 'text-red-600' : 'text-green-600')}>{data.churnRate}%</p><p className="text-sm text-slate-500">Churn Rate</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold">Tenant Health</div>
        <table className="w-full text-sm">
          <thead><tr><th className="text-left px-4 py-2 text-slate-500">Tenant</th><th className="text-center px-4 py-2 text-slate-500">Tier</th><th className="text-center px-4 py-2 text-slate-500">Status</th><th className="text-right px-4 py-2 text-slate-500">MRR</th><th className="text-right px-4 py-2 text-slate-500">Orders (30d)</th><th className="text-right px-4 py-2 text-slate-500">GMV (30d)</th></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {(data.tenantHealth ?? []).map((t: any, i: number) => (
              <tr key={i}><td className="px-4 py-2 font-medium">{t.name}</td><td className="px-4 py-2 text-center">{t.tier}</td><td className="px-4 py-2 text-center">{t.status}</td>
                <td className="px-4 py-2 text-right tabular-nums">${parseFloat(t.mrr || 0).toFixed(0)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{t.orders_30d}</td>
                <td className="px-4 py-2 text-right tabular-nums">${parseFloat(t.gmv_30d || 0).toFixed(0)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
