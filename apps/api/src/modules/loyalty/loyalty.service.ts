import { Inject, Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Inject, OnEvent } from '@nestjs/event-emitter';
import { Inject, Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(@Inject(DRIZZLE) private db: any) {}

  // ═══ EARN POINTS ═══

  async earnPoints(userId: string, dispensaryId: string, points: number, type: string, description: string, orderId?: string): Promise<any> {
    const [profile] = await this._q('SELECT loyalty_points, lifetime_points FROM customer_profiles WHERE user_id = $1', [userId]);
    if (!profile) return null;

    const newBalance = (profile.loyalty_points || 0) + points;
    const newLifetime = (profile.lifetime_points || 0) + points;

    await this._q('UPDATE customer_profiles SET loyalty_points = $1, lifetime_points = $2, updated_at = NOW() WHERE user_id = $3', [newBalance, newLifetime, userId]);

    const [tx] = await this._q(
      'INSERT INTO loyalty_transactions (user_id, dispensary_id, type, points, balance_after, description, order_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [userId, dispensaryId, type, points, newBalance, description, orderId || null],
    );

    // Check tier upgrade
    await this.updateTier(userId, dispensaryId, newLifetime);

    this.logger.log('Points earned: ' + points + ' for user ' + userId + ' (balance: ' + newBalance + ')');
    return tx;
  }

  async redeemPoints(userId: string, dispensaryId: string, rewardId: string, orderId?: string): Promise<any> {
    const [reward] = await this._q('SELECT * FROM loyalty_rewards WHERE reward_id = $1 AND dispensary_id = $2 AND is_active = true', [rewardId, dispensaryId]);
    if (!reward) throw new NotFoundException('Reward not found');

    if (reward.max_redemptions && reward.current_redemptions >= reward.max_redemptions) {
      throw new BadRequestException('This reward is no longer available');
    }

    const [profile] = await this._q('SELECT loyalty_points FROM customer_profiles WHERE user_id = $1', [userId]);
    if (!profile) throw new NotFoundException('Customer profile not found');

    if (profile.loyalty_points < reward.points_cost) {
      throw new BadRequestException('Not enough points. Need ' + reward.points_cost + ', have ' + profile.loyalty_points);
    }

    const newBalance = profile.loyalty_points - reward.points_cost;

    await this._q('UPDATE customer_profiles SET loyalty_points = $1, updated_at = NOW() WHERE user_id = $2', [newBalance, userId]);

    await this._q(
      'INSERT INTO loyalty_transactions (user_id, dispensary_id, type, points, balance_after, description, order_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [userId, dispensaryId, 'redeem', -reward.points_cost, newBalance, 'Redeemed: ' + reward.name, orderId || null],
    );

    const [redemption] = await this._q(
      'INSERT INTO loyalty_redemptions (user_id, reward_id, dispensary_id, points_spent, order_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [userId, rewardId, dispensaryId, reward.points_cost, orderId || null],
    );

    await this._q('UPDATE loyalty_rewards SET current_redemptions = current_redemptions + 1 WHERE reward_id = $1', [rewardId]);

    this.logger.log('Reward redeemed: ' + reward.name + ' by user ' + userId + ' (-' + reward.points_cost + ' pts)');
    return { redemption, reward, newBalance };
  }

  // ═══ TIERS ═══

  private async updateTier(userId: string, dispensaryId: string, lifetimePoints: number): Promise<void> {
    const tiers = await this._q(
      'SELECT code, min_points FROM loyalty_tiers WHERE dispensary_id = $1 ORDER BY min_points DESC', [dispensaryId],
    );

    let newTier = 'bronze';
    for (const tier of tiers) {
      if (lifetimePoints >= tier.min_points) { newTier = tier.code; break; }
    }

    const [current] = await this._q('SELECT loyalty_tier FROM customer_profiles WHERE user_id = $1', [userId]);
    if (current && current.loyalty_tier !== newTier) {
      await this._q('UPDATE customer_profiles SET loyalty_tier = $1 WHERE user_id = $2', [newTier, userId]);
      this.logger.log('Tier upgrade: user ' + userId + ' → ' + newTier);
    }
  }

  async getMyLoyalty(userId: string, dispensaryId: string): Promise<any> {
    const [profile] = await this._q(
      'SELECT loyalty_points as points, lifetime_points as "lifetimePoints", loyalty_tier as tier FROM customer_profiles WHERE user_id = $1', [userId],
    );
    if (!profile) return null;

    const tiers = await this._q('SELECT * FROM loyalty_tiers WHERE dispensary_id = $1 ORDER BY sort_order', [dispensaryId]);
    const currentTier = tiers.find((t: any) => t.code === profile.tier) || tiers[0];
    const nextTier = tiers.find((t: any) => t.min_points > (profile.lifetimePoints || 0));

    const [program] = await this._q('SELECT * FROM loyalty_programs WHERE dispensary_id = $1', [dispensaryId]);

    return {
      points: profile.points || 0,
      lifetimePoints: profile.lifetimePoints || 0,
      tier: profile.tier || 'bronze',
      tierName: currentTier?.name || 'Bronze',
      tierColor: currentTier?.badge_color || '#CD7F32',
      tierPerks: currentTier?.perks,
      multiplier: parseFloat(currentTier?.points_multiplier || '1'),
      nextTier: nextTier ? { name: nextTier.name, pointsNeeded: nextTier.min_points - (profile.lifetimePoints || 0) } : null,
      pointValue: program ? parseFloat(program.point_value_cents) : 1,
      allTiers: tiers.map((t: any) => ({ name: t.name, code: t.code, minPoints: t.min_points, multiplier: parseFloat(t.points_multiplier), perks: t.perks, color: t.badge_color })),
    };
  }

  async getPointHistory(userId: string, limit = 20): Promise<any[]> {
    return this._q(
      'SELECT transaction_id as "transactionId", type, points, balance_after as "balanceAfter", description, created_at as "createdAt" FROM loyalty_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
    );
  }

  // ═══ REWARDS CATALOG ═══

  async getRewards(dispensaryId: string): Promise<any[]> {
    return this._q(
      'SELECT reward_id as "rewardId", name, description, points_cost as "pointsCost", reward_type as "rewardType", reward_value as "rewardValue", is_active as "isActive" FROM loyalty_rewards WHERE dispensary_id = $1 AND is_active = true ORDER BY points_cost',
      [dispensaryId],
    );
  }

  async createReward(dispensaryId: string, input: { name: string; description?: string; pointsCost: number; rewardType: string; rewardValue: number }): Promise<any> {
    const [reward] = await this._q(
      'INSERT INTO loyalty_rewards (dispensary_id, name, description, points_cost, reward_type, reward_value) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [dispensaryId, input.name, input.description, input.pointsCost, input.rewardType, input.rewardValue],
    );
    return reward;
  }

  // ═══ BIRTHDAY ═══

  async checkBirthdayBonus(userId: string, dispensaryId: string): Promise<any> {
    const [profile] = await this._q('SELECT date_of_birth FROM customer_profiles WHERE user_id = $1', [userId]);
    if (!profile?.date_of_birth) return { eligible: false, reason: 'No date of birth on file' };

    const [program] = await this._q('SELECT birthday_bonus_points, birthday_discount_percent, birthday_window_days FROM loyalty_programs WHERE dispensary_id = $1', [dispensaryId]);
    if (!program) return { eligible: false, reason: 'No loyalty program' };

    const dob = new Date(profile.date_of_birth);
    const today = new Date();
    const bday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    const diff = Math.abs(today.getTime() - bday.getTime());
    const daysDiff = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (daysDiff > (program.birthday_window_days || 7)) {
      return { eligible: false, reason: 'Birthday is not within ' + program.birthday_window_days + ' days' };
    }

    // Check if already claimed this year
    const [claimed] = await this._q(
      "SELECT transaction_id FROM loyalty_transactions WHERE user_id = $1 AND type = 'birthday_bonus' AND created_at >= DATE_TRUNC('year', NOW())",
      [userId],
    );
    if (claimed) return { eligible: false, reason: 'Birthday bonus already claimed this year' };

    return {
      eligible: true,
      bonusPoints: program.birthday_bonus_points,
      discountPercent: parseFloat(program.birthday_discount_percent),
    };
  }

  async claimBirthdayBonus(userId: string, dispensaryId: string): Promise<any> {
    const check = await this.checkBirthdayBonus(userId, dispensaryId);
    if (!check.eligible) throw new BadRequestException(check.reason);

    return this.earnPoints(userId, dispensaryId, check.bonusPoints, 'birthday_bonus', 'Happy Birthday! ' + check.bonusPoints + ' bonus points');
  }

  // ═══ ADMIN ═══

  async getLoyaltyStats(dispensaryId: string): Promise<any> {
    const [stats] = await this._q(`SELECT
      COUNT(DISTINCT lt.user_id) as active_members,
      COALESCE(SUM(CASE WHEN lt.type LIKE 'earn%' OR lt.type = 'birthday_bonus' THEN lt.points ELSE 0 END), 0) as total_earned,
      COALESCE(SUM(CASE WHEN lt.type = 'redeem' THEN ABS(lt.points) ELSE 0 END), 0) as total_redeemed,
      COUNT(*) FILTER (WHERE lt.type = 'redeem') as redemption_count,
      COUNT(*) FILTER (WHERE lt.type = 'birthday_bonus') as birthday_claims
     FROM loyalty_transactions lt WHERE lt.dispensary_id = $1`, [dispensaryId]);

    const tierCounts = await this._q(`SELECT cp.loyalty_tier as tier, COUNT(*) as count
      FROM customer_profiles cp WHERE cp.preferred_dispensary_id = $1 AND cp.loyalty_tier IS NOT NULL
      GROUP BY cp.loyalty_tier ORDER BY count DESC`, [dispensaryId]);

    return {
      activeMembers: parseInt(stats.active_members),
      totalEarned: parseInt(stats.total_earned),
      totalRedeemed: parseInt(stats.total_redeemed),
      redemptionCount: parseInt(stats.redemption_count),
      birthdayClaims: parseInt(stats.birthday_claims),
      tierBreakdown: tierCounts.map((t: any) => ({ tier: t.tier, count: parseInt(t.count) })),
    };
  }

  // ═══ EVENT LISTENERS ═══

  @OnEvent('order.completed')
  async onOrderCompleted(payload: any): Promise<void> {
    if (!payload.customerUserId || !payload.dispensaryId || !payload.total) return;

    const [program] = await this._q('SELECT points_per_dollar FROM loyalty_programs WHERE dispensary_id = $1 AND is_active = true', [payload.dispensaryId]);
    if (!program) return;

    const [profile] = await this._q('SELECT loyalty_tier FROM customer_profiles WHERE user_id = $1', [payload.customerUserId]);
    const tier = profile?.loyalty_tier || 'bronze';

    const [tierData] = await this._q('SELECT points_multiplier FROM loyalty_tiers WHERE dispensary_id = $1 AND code = $2', [payload.dispensaryId, tier]);
    const multiplier = parseFloat(tierData?.points_multiplier || '1');

    const basePoints = Math.floor(payload.total * parseFloat(program.points_per_dollar));
    const points = Math.floor(basePoints * multiplier);

    if (points > 0) {
      await this.earnPoints(payload.customerUserId, payload.dispensaryId, points, 'earn_purchase',
        'Order #' + (payload.orderId || '').slice(0, 8).toUpperCase() + ' — ' + points + ' pts (' + multiplier + 'x)', payload.orderId);
    }
  }

  @Cron('0 8 * * *')
  async dailyBirthdayCheck(): Promise<void> {
    this.logger.log('Checking birthdays...');
    const birthdays = await this._q(
      "SELECT cp.user_id, cp.preferred_dispensary_id FROM customer_profiles cp WHERE cp.date_of_birth IS NOT NULL AND EXTRACT(MONTH FROM cp.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(DAY FROM cp.date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE) AND cp.preferred_dispensary_id IS NOT NULL",
    );
    this.logger.log('Found ' + birthdays.length + ' birthdays today');
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }
}
