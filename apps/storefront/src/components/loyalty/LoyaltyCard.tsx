'use client';
import { useEffect, useState } from 'react';
import { gqlAuth, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';
import { Star, Gift } from 'lucide-react';

const LOYALTY_Q = `query($id: ID!) { myLoyalty(dispensaryId: $id) { points lifetimePoints tier tierName tierColor multiplier nextTier { name pointsNeeded } allTiers { name code minPoints color } } }`;
const REWARDS_Q = `query($id: ID!) { availableRewards(dispensaryId: $id) { rewardId name description pointsCost rewardType rewardValue } }`;

export function LoyaltyCard() {
  const [loyalty, setLoyalty] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);

  useEffect(() => {
    gqlAuth<any>(LOYALTY_Q, { id: DEFAULT_DISPENSARY_ID }).then(d => { if (d.myLoyalty) setLoyalty(d.myLoyalty); }).catch(() => {});
    gqlAuth<any>(REWARDS_Q, { id: DEFAULT_DISPENSARY_ID }).then(d => { if (d.availableRewards) setRewards(d.availableRewards); }).catch(() => {});
  }, []);

  if (!loyalty) return null;

  const currentMin = loyalty.allTiers?.find((t: any) => t.code === loyalty.tier)?.minPoints || 0;
  const progress = loyalty.nextTier ? Math.min(100, ((loyalty.lifetimePoints - currentMin) / (loyalty.nextTier.pointsNeeded + loyalty.lifetimePoints - currentMin)) * 100) : 100;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Star size={20} className="text-amber-500" /><h3 className="font-semibold text-gray-900">Loyalty Rewards</h3></div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: (loyalty.tierColor || '#CD7F32') + '22', color: loyalty.tierColor || '#CD7F32' }}>{loyalty.tierName}</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">{loyalty.points.toLocaleString()} <span className="text-sm font-normal text-gray-500">points</span></p>
        <p className="text-xs text-gray-400 mt-1">Earning {loyalty.multiplier}x points per $1</p>
        {loyalty.nextTier && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{loyalty.tierName}</span><span>{loyalty.nextTier.name} — {loyalty.nextTier.pointsNeeded} pts to go</span></div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: progress + '%', backgroundColor: loyalty.tierColor || '#CD7F32' }} /></div>
          </div>
        )}
      </div>
      {rewards.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Gift size={18} className="text-brand-600" /> Available Rewards</h3>
          <div className="space-y-2">
            {rewards.slice(0, 4).map(r => (
              <div key={r.rewardId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div><p className="text-sm font-medium text-gray-900">{r.name}</p>{r.description && <p className="text-xs text-gray-400">{r.description}</p>}</div>
                <span className={'text-xs font-bold px-2 py-1 rounded-full ' + (loyalty.points >= r.pointsCost ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500')}>{r.pointsCost} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
