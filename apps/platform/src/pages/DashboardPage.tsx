import { useQuery } from '@tanstack/react-query';
import { gql } from '../lib/api';
import { Building2, DollarSign, Users, ShoppingCart, MapPin, TrendingUp } from 'lucide-react';

const Q = `query { platformDashboard { tenants { total active trial suspended } revenue { mrr arr }
  dispensaries { total active states } users { total customers staff active24h active7d }
  orders { total last30d gmvTotal gmv30d } tierBreakdown { tier count revenue } totalLocations }}`;

const fmt = (v: number) => '$' + v.toLocaleString(undefined, { minimumFractionDigits: 0 });

export function DashboardPage() {
  const { data: d } = useQuery({ queryKey: ['dashboard'], queryFn: () => gql<any>(Q), select: r => r.platformDashboard });
  if (!d) return <div className="text-slate-400">Loading...</div>;

  const kpis = [
    { label: 'Active Tenants', value: d.tenants.active, sub: d.tenants.trial + ' trial', icon: Building2, color: 'text-brand-600' },
    { label: 'MRR', value: fmt(d.revenue.mrr), sub: 'ARR: ' + fmt(d.revenue.arr), icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Total Locations', value: d.totalLocations, sub: d.dispensaries.states + ' states', icon: MapPin, color: 'text-blue-600' },
    { label: 'Users', value: d.users.total, sub: d.users.active7d + ' active (7d)', icon: Users, color: 'text-violet-600' },
    { label: 'Orders (30d)', value: d.orders.last30d.toLocaleString(), sub: '', icon: ShoppingCart, color: 'text-amber-600' },
    { label: 'GMV (30d)', value: fmt(d.orders.gmv30d), sub: 'Total: ' + fmt(d.orders.gmvTotal), icon: TrendingUp, color: 'text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Platform Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <k.icon size={18} className={k.color + ' mb-2'} />
            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
            <p className="text-xs text-slate-500">{k.label}</p>
            {k.sub && <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-3">Subscription Breakdown</h2>
        <div className="grid grid-cols-3 gap-4">
          {d.tierBreakdown.map((t: any) => (
            <div key={t.tier} className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-500 uppercase font-medium">{t.tier}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{t.count}</p>
              <p className="text-sm text-brand-600 font-medium">{fmt(t.revenue)}/mo</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">Tenant Health</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Active</span><span className="font-medium text-green-600">{d.tenants.active}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Trial</span><span className="font-medium text-amber-600">{d.tenants.trial}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Suspended</span><span className="font-medium text-red-600">{d.tenants.suspended}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">User Breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Customers</span><span className="font-medium">{d.users.customers}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Staff</span><span className="font-medium">{d.users.staff}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Active (24h)</span><span className="font-medium text-brand-600">{d.users.active24h}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
