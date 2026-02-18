/**
 * ═══════════════════════════════════════════════════════════════════
 * LoyaltyDashboard — Points, Tier & Rewards
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/account/LoyaltyDashboard.tsx
 *
 * Route: /account/loyalty
 *
 * Displays the user's loyalty program status: current points, tier
 * with progress bar to next tier, quick-redeem CTA, rewards history,
 * and referral code.
 *
 * ─── API ───────────────────────────────────────────────────────
 *
 *   GET  /users/me/loyalty → { points, pointsLifetime, tier,
 *     tierSince, nextTier, pointsToNextTier, lifetimeSpent,
 *     rewardsHistory[], referralCode }
 *
 *   POST /users/me/loyalty/redeem { points: 1000 }
 *     → { couponCode, discountAmount, remainingPoints }
 *
 * ─── TIER PROGRESSION ──────────────────────────────────────────
 *
 *   Bronze → Silver → Gold → Platinum
 *   Each tier threshold is driven by lifetime points. The progress
 *   bar shows how close the user is to the next tier.
 *
 * Accessibility (WCAG):
 *   - Progress bar: role="progressbar" with aria-valuenow (4.1.2)
 *   - Points counter: tabular-nums (visual alignment)
 *   - Tier badge: color + text + icon (1.4.1)
 *   - Referral code: <output> with copy button (4.1.2)
 *   - Redeem dialog: inline confirmation (not a modal)
 *   - Rewards history: <table> with proper <th> (1.3.1)
 *   - focus-visible rings (2.4.7)
 *
 * Responsive:
 *   - Stat cards: 2-col mobile, 4-col sm+
 *   - Progress section: full-width
 *   - History table: horizontal scroll on mobile
 */

import { useState, useCallback } from 'react';
import { useLoyalty, useRedeemPoints } from '@cannasaas/api-client';
import { formatCurrency } from '@cannasaas/utils';

const TIER_COLORS: Record<string, string> = {
  bronze:   'text-amber-700 bg-amber-50 border-amber-200',
  silver:   'text-gray-600 bg-gray-50 border-gray-200',
  gold:     'text-yellow-700 bg-yellow-50 border-yellow-200',
  platinum: 'text-violet-700 bg-violet-50 border-violet-200',
};

const TIER_ICONS: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎',
};

export function LoyaltyDashboard() {
  const { data: loyalty, isLoading } = useLoyalty();
  const { mutateAsync: redeem, isPending: isRedeeming } = useRedeemPoints();
  const [redeemResult, setRedeemResult] = useState<{ code: string; amount: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRedeem = useCallback(async (points: number) => {
    try {
      const result = await redeem({ points });
      setRedeemResult({ code: result.couponCode, amount: result.discountAmount });
    } catch {
      // Error handled by React Query
    }
  }, [redeem]);

  const handleCopyReferral = useCallback(async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" role="status" aria-busy="true">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted rounded-xl" />)}
        </div>
        <div className="h-20 bg-muted rounded-xl" />
        <span className="sr-only">Loading loyalty data…</span>
      </div>
    );
  }

  if (!loyalty) {
    return (
      <div className="py-12 text-center">
        <span aria-hidden="true" className="text-5xl block mb-3">⭐</span>
        <p className="text-base font-semibold mb-1">Loyalty program not available</p>
        <p className="text-sm text-muted-foreground">Ask at your dispensary to enroll.</p>
      </div>
    );
  }

  const tierProgress = loyalty.pointsToNextTier > 0
    ? ((loyalty.pointsLifetime - (loyalty.pointsToNextTier)) / loyalty.pointsLifetime) * 100
    : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Loyalty Rewards</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Earn points on every purchase.</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Available Points</p>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums">{loyalty.points.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Current Tier</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span aria-hidden="true" className="text-xl">{TIER_ICONS[loyalty.tier] ?? '⭐'}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${TIER_COLORS[loyalty.tier] ?? ''}`}>
              {loyalty.tier}
            </span>
          </div>
        </div>
        <div className="p-4 border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Lifetime Points</p>
          <p className="text-lg sm:text-xl font-bold tabular-nums">{loyalty.pointsLifetime.toLocaleString()}</p>
        </div>
        <div className="p-4 border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Lifetime Spent</p>
          <p className="text-lg sm:text-xl font-bold tabular-nums">{formatCurrency(loyalty.lifetimeSpent)}</p>
        </div>
      </div>

      {/* ── Tier Progress ── */}
      {loyalty.nextTier && (
        <div className="p-4 sm:p-5 border border-border rounded-xl space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium capitalize">{loyalty.tier} Tier</span>
            <span className="text-muted-foreground capitalize">
              {loyalty.pointsToNextTier.toLocaleString()} pts to {loyalty.nextTier}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.round(tierProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(tierProgress)}% progress to ${loyalty.nextTier} tier`}
            className="h-3 bg-muted rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(tierProgress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Quick Redeem ── */}
      <div className="p-4 sm:p-5 border border-border rounded-xl space-y-3">
        <h3 className="text-sm font-semibold">Redeem Points</h3>
        <p className="text-xs text-muted-foreground">100 points = $1.00 discount. Minimum 500 points.</p>

        {redeemResult ? (
          <div role="status" className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
            <p className="font-semibold text-emerald-800">✓ Coupon Generated!</p>
            <p className="text-emerald-700 mt-1">
              Code: <code className="font-mono font-bold">{redeemResult.code}</code> — {formatCurrency(redeemResult.amount)} off
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[500, 1000, 2500].map((pts) => (
              <button
                key={pts}
                onClick={() => handleRedeem(pts)}
                disabled={loyalty.points < pts || isRedeeming}
                className="
                  px-4 py-2 min-h-[44px]
                  text-xs sm:text-sm font-medium
                  border border-border rounded-lg
                  disabled:opacity-40 disabled:cursor-not-allowed
                  hover:bg-primary/5 hover:border-primary/40
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-primary focus-visible:ring-offset-1
                  transition-colors
                "
              >
                {pts.toLocaleString()} pts → {formatCurrency(pts / 100)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Referral Code ── */}
      {loyalty.referralCode && (
        <div className="p-4 sm:p-5 border border-border rounded-xl space-y-2">
          <h3 className="text-sm font-semibold">Referral Code</h3>
          <p className="text-xs text-muted-foreground">Share your code and both you and your friend earn 250 bonus points.</p>
          <div className="flex items-center gap-2 mt-2">
            <output className="flex-1 px-3 py-2.5 bg-muted rounded-lg font-mono text-sm font-bold tracking-wider">
              {loyalty.referralCode}
            </output>
            <button
              onClick={() => handleCopyReferral(loyalty.referralCode!)}
              className="
                px-4 py-2.5 min-h-[44px]
                text-xs sm:text-sm font-medium
                border border-border rounded-lg
                hover:bg-muted
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-primary focus-visible:ring-offset-1
                transition-colors
              "
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* ── Rewards History ── */}
      {loyalty.rewardsHistory && loyalty.rewardsHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Recent Activity</h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th scope="col" className="text-left px-4 py-2.5 font-medium text-muted-foreground">Date</th>
                  <th scope="col" className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-medium text-muted-foreground">Points</th>
                </tr>
              </thead>
              <tbody>
                {loyalty.rewardsHistory.map((entry, idx) => (
                  <tr key={idx} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-2.5">{entry.description}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${entry.points > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {entry.points > 0 ? '+' : ''}{entry.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
