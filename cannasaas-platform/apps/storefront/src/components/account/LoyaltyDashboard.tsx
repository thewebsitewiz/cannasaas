/**
 * @file LoyaltyDashboard.tsx
 * @app apps/storefront
 *
 * Loyalty points balance and recent earnings history.
 * Reads from GET /users/:id (loyalty fields) — displayed read-only.
 *
 * Shows:
 *   - Current points balance (large display)
 *   - Tier badge (Bronze / Silver / Gold)
 *   - Points needed for next tier
 *   - Recent point transactions
 *
 * Note: This is a display-only component for MVP.
 * Points redemption is handled in CartSummary at checkout.
 */

import { useAuthStore } from '@cannasaas/stores';

const TIERS = [
  { name: 'Bronze', minPoints: 0,    color: 'bg-amber-700 text-white' },
  { name: 'Silver', minPoints: 500,  color: 'bg-stone-400 text-white' },
  { name: 'Gold',   minPoints: 1500, color: 'bg-amber-400 text-stone-900' },
] as const;

function getTier(points: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) return TIERS[i];
  }
  return TIERS[0];
}

export function LoyaltyDashboard() {
  const { user } = useAuthStore();
  const points = (user as any)?.loyaltyPoints ?? 0;
  const tier = getTier(points);
  const nextTier = TIERS.find((t) => t.minPoints > points);
  const pointsToNext = nextTier ? nextTier.minPoints - points : 0;

  return (
    <div className="space-y-6 max-w-lg">
      {/* Points balance card */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-stone-400">Total Points</p>
          <span className={['px-2.5 py-1 rounded-full text-xs font-bold', tier.color].join(' ')}>
            {tier.name}
          </span>
        </div>
        <p className="text-5xl font-extrabold">{points.toLocaleString()}</p>
        <p className="text-sm text-stone-400 mt-1">
          {points === 1 ? '1 point' : `${points.toLocaleString()} points`}
        </p>
        {nextTier && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>{tier.name}</span>
              <span>{pointsToNext} pts to {nextTier.name}</span>
            </div>
            <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
              <div
                aria-hidden="true"
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* How to earn */}
      <div>
        <h3 className="text-sm font-bold text-stone-900 mb-3">How to Earn Points</h3>
        <ul className="space-y-2 text-sm text-stone-600">
          {[
            { action: 'Every $1 spent',        points: '1 point' },
            { action: 'Leave a product review', points: '25 points' },
            { action: 'Refer a friend',         points: '100 points' },
            { action: 'Birthday bonus',         points: '50 points' },
          ].map((item) => (
            <li key={item.action} className="flex justify-between py-2 border-b border-stone-50 last:border-0">
              <span>{item.action}</span>
              <span className="font-semibold text-[hsl(var(--primary))]">{item.points}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
