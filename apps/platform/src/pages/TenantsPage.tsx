import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from '../lib/api';
import { Building2, Plus, Ban, PenLine } from 'lucide-react';

const Q = `query { platformTenants { orgId name subscriptionTier billingStatus billingEmail monthlyRevenue totalLocations dispensaryCount userCount orders30d revenue30d onboardedAt trialEndsAt } }`;
const CREATE = `mutation($n:String!,$e:String!,$t:String!,$s:String!){createTenant(name:$n,billingEmail:$e,subscriptionTier:$t,state:$s){orgId name}}`;
const UPDATE = `mutation($id:ID!,$t:String,$s:String,$e:String,$n:String){updateTenant(orgId:$id,subscriptionTier:$t,billingStatus:$s,billingEmail:$e,notes:$n){orgId}}`;
const SUSPEND = `mutation($id:ID!,$r:String!){suspendTenant(orgId:$id,reason:$r){orgId billingStatus}}`;

const TIER_COLORS: Record<string,string> = { starter:'bg-gray-100 text-gray-700', professional:'bg-blue-100 text-blue-700', enterprise:'bg-purple-100 text-purple-700' };
const STATUS_COLORS: Record<string,string> = { active:'bg-green-100 text-green-700', trial:'bg-amber-100 text-amber-700', suspended:'bg-red-100 text-red-700', cancelled:'bg-gray-200 text-gray-600' };

export function TenantsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [tier, setTier] = useState('starter'); const [state, setState] = useState('NY');

  const { data: tenants } = useQuery({ queryKey: ['tenants'], queryFn: () => gql<any>(Q), select: r => r.platformTenants });

  const createMut = useMutation({ mutationFn: () => gql(CREATE, { n: name, e: email, t: tier, s: state }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); setShowCreate(false); setName(''); setEmail(''); } });

  const suspendMut = useMutation({ mutationFn: (id: string) => gql(SUSPEND, { id, r: 'Admin action' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }) });

  const fmt = (v: number) => '$' + (v || 0).toLocaleString(undefined, { minimumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
          <Plus size={16} /> New Tenant
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h2 className="font-semibold">Create New Tenant</h2>
          <div className="grid grid-cols-4 gap-3">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Organization name" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Billing email" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <select value={tier} onChange={e=>setTier(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="starter">Starter ($299)</option><option value="professional">Professional ($499)</option><option value="enterprise">Enterprise ($799)</option>
            </select>
            <select value={state} onChange={e=>setState(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="NY">New York</option><option value="NJ">New Jersey</option><option value="CT">Connecticut</option>
            </select>
          </div>
          <button onClick={() => createMut.mutate()} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">Create</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Tenant</th>
              <th className="text-center px-4 py-3 font-medium text-slate-500">Tier</th>
              <th className="text-center px-4 py-3 font-medium text-slate-500">Status</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">MRR</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Locations</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Users</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Orders (30d)</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">GMV (30d)</th>
              <th className="text-center px-4 py-3 font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(tenants ?? []).map((t: any) => (
              <tr key={t.orgId} className="hover:bg-slate-50">
                <td className="px-4 py-3"><p className="font-medium text-slate-900">{t.name}</p><p className="text-xs text-slate-400">{t.billingEmail}</p></td>
                <td className="px-4 py-3 text-center"><span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (TIER_COLORS[t.subscriptionTier] || '')}>{t.subscriptionTier}</span></td>
                <td className="px-4 py-3 text-center"><span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (STATUS_COLORS[t.billingStatus] || '')}>{t.billingStatus}</span></td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{fmt(t.monthlyRevenue)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t.dispensaryCount}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t.userCount}</td>
                <td className="px-4 py-3 text-right tabular-nums">{t.orders30d}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{fmt(t.revenue30d)}</td>
                <td className="px-4 py-3 text-center">
                  {t.billingStatus !== 'suspended' && (
                    <button onClick={() => suspendMut.mutate(t.orgId)} className="text-red-400 hover:text-red-600" title="Suspend"><Ban size={15} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
