import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';

// ── DB row types ──────────────────────────────────────────────────────────

interface CustomerProfileRow {
  loyalty_points: number | null;
  lifetime_points: number | null;
}

interface CustomerProfilePointsRow {
  points: number | null;
  lifetimePoints: number | null;
  tier: string | null;
}

interface RewardRow {
  reward_id: string;
  dispensary_id: string;
  name: string;
  description: string | null;
  points_cost: number;
  reward_type: string;
  reward_value: string | number;
  is_active: boolean;
  max_redemptions: number | null;
  current_redemptions: number;
}

interface LoyaltyTransactionRow {
  transaction_id: string;
  user_id: string;
  dispensary_id: string;
  type: string;
  points: number;
  balance_after: number;
  description: string;
  order_id: string | null;
  created_at: Date;
}

interface LoyaltyTierRow {
  code: string;
  name: string;
  min_points: number;
  points_multiplier: string | number;
  perks: string | null;
  badge_color: string | null;
  sort_order: number;
}

interface LoyaltyTierMinPointsRow {
  code: string;
  min_points: number;
}

interface LoyaltyProfileTierRow {
  loyalty_tier: string | null;
}

interface LoyaltyProgramRow {
  point_value_cents: string | number;
  birthday_bonus_points: number | null;
  birthday_discount_percent: string | number | null;
  birthday_window_days: number | null;
  points_per_dollar: string | number;
  is_active: boolean;
}

interface RewardListRow {
  rewardId: string;
  name: string;
  description: string | null;
  pointsCost: number;
  rewardType: string;
  rewardValue: string | number;
  isActive: boolean;
}

interface BirthdayProfileRow {
  date_of_birth: string | Date | null;
}

interface ClaimedTxRow {
  transaction_id: string;
}

interface LoyaltyStatsRow {
  active_members: string | number;
  total_earned: string | number;
  total_redeemed: string | number;
  redemption_count: string | number;
  birthday_claims: string | number;
}

interface TierCountRow {
  tier: string;
  count: string | number;
}

interface PointHistoryRow {
  transactionId: string;
  type: string;
  points: number;
  balanceAfter: number;
  description: string;
  createdAt: string | Date;
}

interface LoyaltyRedemptionRow {
  redemption_id: string;
  user_id: string;
  reward_id: string;
  dispensary_id: string;
  points_spent: number;
  order_id: string | null;
}

// ── Public DTOs ───────────────────────────────────────────────────────────

export interface MyLoyaltyDto {
  points: number;
  lifetimePoints: number;
  tier: string;
  tierName: string;
  tierColor?: string;
  tierPerks?: string;
  multiplier: number;
  nextTier: { name: string; pointsNeeded: number } | null;
  pointValue: number;
  allTiers: Array<{
    name: string;
    code: string;
    minPoints: number;
    multiplier: number;
    perks?: string;
    color?: string;
  }>;
}

export interface RedeemResult {
  redemption: LoyaltyRedemptionRow;
  reward: RewardRow;
  newBalance: number;
}

export interface BirthdayCheckResult {
  eligible: boolean;
  reason?: string;
  bonusPoints?: number;
  discountPercent?: number;
}

export interface LoyaltyStatsDto {
  activeMembers: number;
  totalEarned: number;
  totalRedeemed: number;
  redemptionCount: number;
  birthdayClaims: number;
  tierBreakdown: Array<{ tier: string; count: number }>;
}

export interface CreateRewardInput {
  name: string;
  description?: string;
  pointsCost: number;
  rewardType: string;
  rewardValue: number;
}

export interface OrderCompletedPayload {
  customerUserId?: string;
  dispensaryId?: string;
  total?: number;
  orderId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

function toNumber(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}

function toInt(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? Math.trunc(val) : parseInt(val, 10);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  // ═══ EARN POINTS ═══

  async earnPoints(
    userId: string,
    dispensaryId: string,
    points: number,
    type: string,
    description: string,
    orderId?: string,
  ): Promise<LoyaltyTransactionRow | null> {
    const profileRows = await rawQuery<CustomerProfileRow>(
      this.ds,
      'SELECT loyalty_points, lifetime_points FROM customer_profiles WHERE user_id = $1',
      [userId],
    );
    const profile = profileRows[0];
    if (!profile) return null;

    const newBalance = (profile.loyalty_points ?? 0) + points;
    const newLifetime = (profile.lifetime_points ?? 0) + points;

    await this.ds.query(
      'UPDATE customer_profiles SET loyalty_points = $1, lifetime_points = $2, updated_at = NOW() WHERE user_id = $3',
      [newBalance, newLifetime, userId],
    );

    const txRows = await rawQuery<LoyaltyTransactionRow>(
      this.ds,
      'INSERT INTO loyalty_transactions (user_id, dispensary_id, type, points, balance_after, description, order_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [
        userId,
        dispensaryId,
        type,
        points,
        newBalance,
        description,
        orderId ?? null,
      ],
    );

    await this.updateTier(userId, dispensaryId, newLifetime);

    this.logger.log(
      'Points earned: ' +
        String(points) +
        ' for user ' +
        userId +
        ' (balance: ' +
        String(newBalance) +
        ')',
    );
    return txRows[0];
  }

  async redeemPoints(
    userId: string,
    dispensaryId: string,
    rewardId: string,
    orderId?: string,
  ): Promise<RedeemResult> {
    const rewardRows = await rawQuery<RewardRow>(
      this.ds,
      'SELECT * FROM loyalty_rewards WHERE reward_id = $1 AND dispensary_id = $2 AND is_active = true',
      [rewardId, dispensaryId],
    );
    const reward = rewardRows[0];
    if (!reward) throw new NotFoundException('Reward not found');

    if (
      reward.max_redemptions !== null &&
      reward.current_redemptions >= reward.max_redemptions
    ) {
      throw new BadRequestException('This reward is no longer available');
    }

    const profileRows = await rawQuery<CustomerProfileRow>(
      this.ds,
      'SELECT loyalty_points FROM customer_profiles WHERE user_id = $1',
      [userId],
    );
    const profile = profileRows[0];
    if (!profile) throw new NotFoundException('Customer profile not found');

    const currentPoints = profile.loyalty_points ?? 0;
    if (currentPoints < reward.points_cost) {
      throw new BadRequestException(
        'Not enough points. Need ' +
          String(reward.points_cost) +
          ', have ' +
          String(currentPoints),
      );
    }

    const newBalance = currentPoints - reward.points_cost;

    await this.ds.query(
      'UPDATE customer_profiles SET loyalty_points = $1, updated_at = NOW() WHERE user_id = $2',
      [newBalance, userId],
    );

    await this.ds.query(
      'INSERT INTO loyalty_transactions (user_id, dispensary_id, type, points, balance_after, description, order_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [
        userId,
        dispensaryId,
        'redeem',
        -reward.points_cost,
        newBalance,
        'Redeemed: ' + reward.name,
        orderId ?? null,
      ],
    );

    const redemptionRows = await rawQuery<LoyaltyRedemptionRow>(
      this.ds,
      'INSERT INTO loyalty_redemptions (user_id, reward_id, dispensary_id, points_spent, order_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [userId, rewardId, dispensaryId, reward.points_cost, orderId ?? null],
    );

    await this.ds.query(
      'UPDATE loyalty_rewards SET current_redemptions = current_redemptions + 1 WHERE reward_id = $1',
      [rewardId],
    );

    this.logger.log(
      'Reward redeemed: ' +
        reward.name +
        ' by user ' +
        userId +
        ' (-' +
        String(reward.points_cost) +
        ' pts)',
    );
    return { redemption: redemptionRows[0], reward, newBalance };
  }

  // ═══ TIERS ═══

  private async updateTier(
    userId: string,
    dispensaryId: string,
    lifetimePoints: number,
  ): Promise<void> {
    const tiers = await rawQuery<LoyaltyTierMinPointsRow>(
      this.ds,
      'SELECT code, min_points FROM loyalty_tiers WHERE dispensary_id = $1 ORDER BY min_points DESC',
      [dispensaryId],
    );

    let newTier = 'bronze';
    for (const tier of tiers) {
      if (lifetimePoints >= tier.min_points) {
        newTier = tier.code;
        break;
      }
    }

    const currentRows = await rawQuery<LoyaltyProfileTierRow>(
      this.ds,
      'SELECT loyalty_tier FROM customer_profiles WHERE user_id = $1',
      [userId],
    );
    const current = currentRows[0];
    if (current && current.loyalty_tier !== newTier) {
      await this.ds.query(
        'UPDATE customer_profiles SET loyalty_tier = $1 WHERE user_id = $2',
        [newTier, userId],
      );
      this.logger.log('Tier upgrade: user ' + userId + ' → ' + newTier);
    }
  }

  async getMyLoyalty(
    userId: string,
    dispensaryId: string,
  ): Promise<MyLoyaltyDto | null> {
    const profileRows = await rawQuery<CustomerProfilePointsRow>(
      this.ds,
      'SELECT loyalty_points as points, lifetime_points as "lifetimePoints", loyalty_tier as tier FROM customer_profiles WHERE user_id = $1',
      [userId],
    );
    const profile = profileRows[0];
    if (!profile) return null;

    const tiers = await rawQuery<LoyaltyTierRow>(
      this.ds,
      'SELECT * FROM loyalty_tiers WHERE dispensary_id = $1 ORDER BY sort_order',
      [dispensaryId],
    );
    const currentTier = tiers.find((t) => t.code === profile.tier) ?? tiers[0];
    const lifetime = profile.lifetimePoints ?? 0;
    const nextTier = tiers.find((t) => t.min_points > lifetime);

    const programRows = await rawQuery<LoyaltyProgramRow>(
      this.ds,
      'SELECT * FROM loyalty_programs WHERE dispensary_id = $1',
      [dispensaryId],
    );
    const program = programRows[0];

    return {
      points: profile.points ?? 0,
      lifetimePoints: lifetime,
      tier: profile.tier ?? 'bronze',
      tierName: currentTier?.name ?? 'Bronze',
      tierColor: currentTier?.badge_color ?? '#CD7F32',
      tierPerks: currentTier?.perks ?? undefined,
      multiplier: toNumber(currentTier?.points_multiplier) || 1,
      nextTier: nextTier
        ? {
            name: nextTier.name,
            pointsNeeded: nextTier.min_points - lifetime,
          }
        : null,
      pointValue: program ? toNumber(program.point_value_cents) : 1,
      allTiers: tiers.map((t) => ({
        name: t.name,
        code: t.code,
        minPoints: t.min_points,
        multiplier: toNumber(t.points_multiplier),
        perks: t.perks ?? undefined,
        color: t.badge_color ?? undefined,
      })),
    };
  }

  async getPointHistory(
    userId: string,
    limit = 20,
  ): Promise<PointHistoryRow[]> {
    return rawQuery<PointHistoryRow>(
      this.ds,
      'SELECT transaction_id as "transactionId", type, points, balance_after as "balanceAfter", description, created_at as "createdAt" FROM loyalty_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
    );
  }

  // ═══ REWARDS CATALOG ═══

  async getRewards(dispensaryId: string): Promise<RewardListRow[]> {
    return rawQuery<RewardListRow>(
      this.ds,
      'SELECT reward_id as "rewardId", name, description, points_cost as "pointsCost", reward_type as "rewardType", reward_value as "rewardValue", is_active as "isActive" FROM loyalty_rewards WHERE dispensary_id = $1 AND is_active = true ORDER BY points_cost',
      [dispensaryId],
    );
  }

  async createReward(
    dispensaryId: string,
    input: CreateRewardInput,
  ): Promise<RewardRow> {
    const rows = await rawQuery<RewardRow>(
      this.ds,
      'INSERT INTO loyalty_rewards (dispensary_id, name, description, points_cost, reward_type, reward_value) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [
        dispensaryId,
        input.name,
        input.description,
        input.pointsCost,
        input.rewardType,
        input.rewardValue,
      ],
    );
    return rows[0];
  }

  // ═══ BIRTHDAY ═══

  async checkBirthdayBonus(
    userId: string,
    dispensaryId: string,
  ): Promise<BirthdayCheckResult> {
    const profileRows = await rawQuery<BirthdayProfileRow>(
      this.ds,
      'SELECT date_of_birth FROM customer_profiles WHERE user_id = $1',
      [userId],
    );
    const profile = profileRows[0];
    if (!profile?.date_of_birth)
      return { eligible: false, reason: 'No date of birth on file' };

    const programRows = await rawQuery<LoyaltyProgramRow>(
      this.ds,
      'SELECT birthday_bonus_points, birthday_discount_percent, birthday_window_days FROM loyalty_programs WHERE dispensary_id = $1',
      [dispensaryId],
    );
    const program = programRows[0];
    if (!program) return { eligible: false, reason: 'No loyalty program' };

    const dob = new Date(profile.date_of_birth);
    const today = new Date();
    const bday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    const diff = Math.abs(today.getTime() - bday.getTime());
    const daysDiff = Math.ceil(diff / (1000 * 60 * 60 * 24));

    const windowDays = program.birthday_window_days ?? 7;
    if (daysDiff > windowDays) {
      return {
        eligible: false,
        reason: 'Birthday is not within ' + String(windowDays) + ' days',
      };
    }

    const claimedRows = await rawQuery<ClaimedTxRow>(
      this.ds,
      "SELECT transaction_id FROM loyalty_transactions WHERE user_id = $1 AND type = 'birthday_bonus' AND created_at >= DATE_TRUNC('year', NOW())",
      [userId],
    );
    if (claimedRows[0])
      return {
        eligible: false,
        reason: 'Birthday bonus already claimed this year',
      };

    return {
      eligible: true,
      bonusPoints: program.birthday_bonus_points ?? 0,
      discountPercent: toNumber(program.birthday_discount_percent),
    };
  }

  async claimBirthdayBonus(
    userId: string,
    dispensaryId: string,
  ): Promise<LoyaltyTransactionRow | null> {
    const check = await this.checkBirthdayBonus(userId, dispensaryId);
    if (!check.eligible)
      throw new BadRequestException(check.reason ?? 'Not eligible');

    const bonus = check.bonusPoints ?? 0;
    return this.earnPoints(
      userId,
      dispensaryId,
      bonus,
      'birthday_bonus',
      'Happy Birthday! ' + String(bonus) + ' bonus points',
    );
  }

  // ═══ ADMIN ═══

  async getLoyaltyStats(dispensaryId: string): Promise<LoyaltyStatsDto> {
    const statsRows = await rawQuery<LoyaltyStatsRow>(
      this.ds,
      `SELECT
      COUNT(DISTINCT lt.user_id) as active_members,
      COALESCE(SUM(CASE WHEN lt.type LIKE 'earn%' OR lt.type = 'birthday_bonus' THEN lt.points ELSE 0 END), 0) as total_earned,
      COALESCE(SUM(CASE WHEN lt.type = 'redeem' THEN ABS(lt.points) ELSE 0 END), 0) as total_redeemed,
      COUNT(*) FILTER (WHERE lt.type = 'redeem') as redemption_count,
      COUNT(*) FILTER (WHERE lt.type = 'birthday_bonus') as birthday_claims
     FROM loyalty_transactions lt WHERE lt.dispensary_id = $1`,
      [dispensaryId],
    );
    const stats = statsRows[0];

    const tierCounts = await rawQuery<TierCountRow>(
      this.ds,
      `SELECT cp.loyalty_tier as tier, COUNT(*) as count
      FROM customer_profiles cp WHERE cp.preferred_dispensary_id = $1 AND cp.loyalty_tier IS NOT NULL
      GROUP BY cp.loyalty_tier ORDER BY count DESC`,
      [dispensaryId],
    );

    return {
      activeMembers: toInt(stats.active_members),
      totalEarned: toInt(stats.total_earned),
      totalRedeemed: toInt(stats.total_redeemed),
      redemptionCount: toInt(stats.redemption_count),
      birthdayClaims: toInt(stats.birthday_claims),
      tierBreakdown: tierCounts.map((t) => ({
        tier: t.tier,
        count: toInt(t.count),
      })),
    };
  }

  // ═══ EVENT LISTENERS ═══

  @OnEvent('order.completed')
  async onOrderCompleted(payload: OrderCompletedPayload): Promise<void> {
    if (!payload.customerUserId || !payload.dispensaryId || !payload.total)
      return;

    const programRows = await rawQuery<LoyaltyProgramRow>(
      this.ds,
      'SELECT points_per_dollar FROM loyalty_programs WHERE dispensary_id = $1 AND is_active = true',
      [payload.dispensaryId],
    );
    const program = programRows[0];
    if (!program) return;

    const profileRows = await rawQuery<LoyaltyProfileTierRow>(
      this.ds,
      'SELECT loyalty_tier FROM customer_profiles WHERE user_id = $1',
      [payload.customerUserId],
    );
    const tier = profileRows[0]?.loyalty_tier ?? 'bronze';

    const tierDataRows = await rawQuery<{
      points_multiplier: string | number | null;
    }>(
      this.ds,
      'SELECT points_multiplier FROM loyalty_tiers WHERE dispensary_id = $1 AND code = $2',
      [payload.dispensaryId, tier],
    );
    const multiplier = toNumber(tierDataRows[0]?.points_multiplier) || 1;

    const basePoints = Math.floor(
      payload.total * toNumber(program.points_per_dollar),
    );
    const points = Math.floor(basePoints * multiplier);

    if (points > 0) {
      await this.earnPoints(
        payload.customerUserId,
        payload.dispensaryId,
        points,
        'earn_purchase',
        'Order #' +
          (payload.orderId ?? '').slice(0, 8).toUpperCase() +
          ' — ' +
          String(points) +
          ' pts (' +
          String(multiplier) +
          'x)',
        payload.orderId,
      );
    }
  }

  @Cron('0 8 * * *')
  async dailyBirthdayCheck(): Promise<void> {
    this.logger.log('Checking birthdays...');
    const birthdays = await rawQuery<{
      user_id: string;
      preferred_dispensary_id: string;
    }>(
      this.ds,
      'SELECT cp.user_id, cp.preferred_dispensary_id FROM customer_profiles cp WHERE cp.date_of_birth IS NOT NULL AND EXTRACT(MONTH FROM cp.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(DAY FROM cp.date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE) AND cp.preferred_dispensary_id IS NOT NULL',
    );
    this.logger.log('Found ' + String(birthdays.length) + ' birthdays today');
  }
}
