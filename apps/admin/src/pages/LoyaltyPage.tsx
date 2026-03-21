import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { Star, Gift, Users, TrendingUp, Plus } from 'lucide-react';

const DISP = localStorage.getItem('cannasaas-dispensary-id') || 'b406186e-4d6a-425b-b7af-851cde868c5c';
const STATS_Q = `query($id: ID!) { loyaltyStats(dispensaryId: $id) { activeMembers totalEarned totalRedeemed redemptionCount birthdayClaims tierBreakdown { tier count } } }`;
const REWARDS_Q = `query($id: ID!) { availableRewards(dispensaryId: $id) { rewardId name description pointsCost rewardType rewardValue } }`;
const CREATE_REWARD = `mutation($id:ID!,$n:String!,$pts:Int!,$t:String!,$v:Float!,$desc:String) { createReward(dispensaryId:$id,name:$n,pointsCost:$pts,rewardType:$t,rewardValue:$v,description:$desc) }`;

const TIER_COLORS: Record<string,string> = { bronze:'bg-amber-100 text-amber-800', silver:'bg-gray-200 text-gray-700', gold:'bg-yellow-100 text-yellow-800', platinum:'bg-slate-200 text-slate-700' };

export function LoyaltyPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name:'', pointsCost:'', rewardType:'discount_percent', rewardValue:'', description:'' });

  const { data: stats } = useQuery({ queryKey: ['loyaltyStats'], queryFn: () => gqlRequest<any>(STATS_Q, { id: DISP }), select: d => d.loyaltyStats });
  const { data: rewards } = useQuery({ queryKey: ['rewards'], queryFn: () => gqlRequest<any>(REWARDS_Q, { id: DISP }), select: d => d.availableRewards });

  const createMut = useMutation({
    mutationFn: () => gqlRequest(CREATE_REWARD, { id: DISP, n: form.name, pts: parseInt(form.pointsCost), t: form.rewardType, v: parseFloat(form.rewardValue), desc: form.description || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rewards'] }); setShowCreate(false); setForm({ name:'', pointsCost:'', rewardType:'discount_percent', rewardValue:'', description:'' }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-txt">Loyalty Program</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 bg-brand-600 text-txt-inverse px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
          <Plus size={16} /> New Reward
        </button>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <Users size={18} className="mx-auto text-brand-600 mb-1" />
            <p className="text-2xl font-bold">{stats.activeMembers}</p>
            <p className="text-xs text-txt-secondary">Active Members</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <TrendingUp size={18} className="mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-bold">{stats.totalEarned.toLocaleString()}</p>
            <p className="text-xs text-txt-secondary">Points Earned</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <Gift size={18} className="mx-auto text-purple-600 mb-1" />
            <p className="text-2xl font-bold">{stats.totalRedeemed.toLocaleString()}</p>
            <p className="text-xs text-txt-secondary">Points Redeemed</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold">{stats.redemptionCount}</p>
            <p className="text-xs text-txt-secondary">Redemptions</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <Star size={18} className="mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{stats.birthdayClaims}</p>
            <p className="text-xs text-txt-secondary">Birthday Claims</p>
          </div>
        </div>
      )}

      {/* Tier breakdown */}
      {stats?.tierBreakdown && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-semibold text-txt mb-3">Member Tiers</h2>
          <div className="grid grid-cols-4 gap-3">
            {stats.tierBreakdown.map((t: any) => (
              <div key={t.tier} className="text-center">
                <span className={'inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 capitalize ' + (TIER_COLORS[t.tier] || 'bg-gray-100 text-gray-700')}>{t.tier}</span>
                <p className="text-2xl font-bold text-txt">{t.count}</p>
                <p className="text-xs text-txt-secondary">members</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create reward form */}
      {showCreate && (
        <div className="bg-surface rounded-xl border border-border p-6 space-y-3">
          <h2 className="font-semibold">New Reward</h2>
          <div className="grid grid-cols-3 gap-3">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Reward name *" className="px-3 py-2 border border-border rounded-lg text-sm" />
            <input value={form.pointsCost} onChange={e => setForm({...form, pointsCost: e.target.value})} placeholder="Points cost *" type="number" className="px-3 py-2 border border-border rounded-lg text-sm" />
            <select value={form.rewardType} onChange={e => setForm({...form, rewardType: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm">
              <option value="discount_percent">% Discount</option><option value="discount_fixed">$ Off</option><option value="free_item">Free Item</option><option value="free_delivery">Free Delivery</option>
            </select>
            <input value={form.rewardValue} onChange={e => setForm({...form, rewardValue: e.target.value})} placeholder="Value (e.g. 10 for 10%)" type="number" className="px-3 py-2 border border-border rounded-lg text-sm" />
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" className="px-3 py-2 border border-border rounded-lg text-sm col-span-2" />
          </div>
          <button onClick={() => createMut.mutate()} disabled={!form.name || !form.pointsCost} className="bg-brand-600 text-txt-inverse px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">Create Reward</button>
        </div>
      )}

      {/* Rewards catalog */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-bg-alt border-b font-semibold text-gray-700">Rewards Catalog</div>
        <table className="w-full text-sm">
          <thead><tr>
            <th className="text-left px-4 py-2 text-txt-secondary">Reward</th>
            <th className="text-right px-4 py-2 text-txt-secondary">Points Cost</th>
            <th className="text-center px-4 py-2 text-txt-secondary">Type</th>
            <th className="text-right px-4 py-2 text-txt-secondary">Value</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {(rewards ?? []).map((r: any) => (
              <tr key={r.rewardId}>
                <td className="px-4 py-3"><p className="font-medium text-txt">{r.name}</p>{r.description && <p className="text-xs text-txt-muted">{r.description}</p>}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-brand-700">{r.pointsCost} pts</td>
                <td className="px-4 py-3 text-center text-xs text-txt-secondary">{r.rewardType.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.rewardType.includes('percent') ? r.rewardValue + '%' : '$' + parseFloat(r.rewardValue).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
