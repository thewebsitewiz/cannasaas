import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CacheService } from '../../common/services/cache.service';

// ── DB row types ──────────────────────────────────────────────────────────

interface OrgStatsRow {
  total_tenants: string | number;
  active_tenants: string | number;
  trial_tenants: string | number;
  suspended_tenants: string | number;
  mrr: string | number;
  total_locations: string | number;
}

interface DispStatsRow {
  total_dispensaries: string | number;
  active_dispensaries: string | number;
  states_covered: string | number;
}

interface UserStatsRow {
  total_users: string | number;
  customers: string | number;
  staff_users: string | number;
  active_24h: string | number;
  active_7d: string | number;
}

interface OrderStatsRow {
  total_orders: string | number;
  orders_30d: string | number;
  gmv_total: string | number;
  gmv_30d: string | number;
}

interface TierBreakdownRow {
  tier: string;
  count: string | number;
  revenue: string | number;
}

interface TenantRow {
  orgId: string;
  name: string;
  subscriptionTier: string | null;
  billingStatus: string | null;
  billingEmail: string | null;
  monthlyRevenue: string | number | null;
  totalLocations: number | null;
  onboardedAt: Date | string | null;
  trialEndsAt: Date | string | null;
  notes: string | null;
  createdAt: Date | string;
  dispensaryCount: string | number;
  userCount: string | number;
  orders30d: string | number;
  revenue30d: string | number;
}

interface TenantDetailRow {
  org_id: string;
  name: string;
  subscription_tier: string | null;
  billing_status: string | null;
  billing_email: string | null;
  monthly_revenue: string | number | null;
  total_locations: number | null;
  onboarded_at: Date | string | null;
  trial_ends_at: Date | string | null;
  notes: string | null;
  created_at: Date | string;
  dispensaryCount: string | number;
  userCount: string | number;
}

interface OrgIdRow {
  org_id: string;
}

interface CompanyIdRow {
  company_id: string;
}

interface TaxRuleRow {
  tax_category_id: number;
  state: string;
  code: string;
  name: string;
  rate: string | number;
  tax_basis: string;
  statutory_reference: string | null;
  effective_date: Date | string;
  is_active: boolean;
}

interface StateRow {
  state: string;
  dispensaries: string | number;
  tax_rules: string | number;
}

interface PurchaseLimitRuleRow {
  rule_id: number;
  state: string;
  product_category: string;
  [key: string]: unknown;
}

interface InvoiceRow {
  invoice_id: string;
  organization_id: string;
  amount: string | number;
  total: string | number;
  status: string;
  org_name: string;
  created_at: Date | string;
  [key: string]: unknown;
}

interface MonthlyRevenueRow {
  month: Date | string;
  invoices: string | number;
  revenue: string | number;
}

interface ActivityRow {
  activity_id: string;
  activity_type: string;
  description: string | null;
  organization_id: string | null;
  org_name: string | null;
  created_at: Date | string;
  [key: string]: unknown;
}

interface TenantHealthRow {
  name: string;
  tier: string | null;
  status: string | null;
  mrr: string | number | null;
  locations: number | null;
  orders_30d: string | number;
  gmv_30d: string | number;
}

interface ChurnRow {
  churned: string | number;
  total: string | number;
  churn_rate: string | number;
}

interface SubscriptionTierRow {
  tier_id: number;
  name: string;
  monthly_price: string | number;
  is_active: boolean;
  [key: string]: unknown;
}

// ── Public DTOs ───────────────────────────────────────────────────────────

export interface PlatformDashboardDto {
  tenants: { total: number; active: number; trial: number; suspended: number };
  revenue: { mrr: number; arr: number };
  dispensaries: { total: number; active: number; states: number };
  users: {
    total: number;
    customers: number;
    staff: number;
    active24h: number;
    active7d: number;
  };
  orders: {
    total: number;
    last30d: number;
    gmvTotal: number;
    gmv30d: number;
  };
  tierBreakdown: Array<{ tier: string; count: number; revenue: number }>;
  totalLocations: number;
}

export interface PlatformReportDto {
  tenantHealth: TenantHealthRow[];
  churnRate: number;
  totalTenants: number;
  churned: number;
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
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);

  constructor(
    @InjectDataSource() private ds: DataSource,
    private readonly cache: CacheService,
  ) {}

  // ═══ DASHBOARD ═══

  async getDashboard(): Promise<PlatformDashboardDto> {
    const orgStatsRows = await rawQuery<OrgStatsRow>(
      this.ds,
      `SELECT
      COUNT(*) as total_tenants,
      COUNT(*) FILTER (WHERE billing_status = 'active') as active_tenants,
      COUNT(*) FILTER (WHERE billing_status = 'trial') as trial_tenants,
      COUNT(*) FILTER (WHERE billing_status = 'suspended') as suspended_tenants,
      COALESCE(SUM(monthly_revenue), 0)::DECIMAL(10,2) as mrr,
      COALESCE(SUM(total_locations), 0) as total_locations
    FROM organizations`,
    );
    const orgStats = orgStatsRows[0];

    const dispStatsRows = await rawQuery<DispStatsRow>(
      this.ds,
      `SELECT
      COUNT(*) as total_dispensaries,
      COUNT(*) FILTER (WHERE is_active = true) as active_dispensaries,
      COUNT(DISTINCT state) as states_covered
    FROM dispensaries`,
    );
    const dispStats = dispStatsRows[0];

    const userStatsRows = await rawQuery<UserStatsRow>(
      this.ds,
      `SELECT
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE role = 'customer') as customers,
      COUNT(*) FILTER (WHERE role != 'customer') as staff_users,
      COUNT(*) FILTER (WHERE "lastLoginAt" >= NOW() - INTERVAL '24 hours') as active_24h,
      COUNT(*) FILTER (WHERE "lastLoginAt" >= NOW() - INTERVAL '7 days') as active_7d
    FROM users WHERE "isActive" = true`,
    );
    const userStats = userStatsRows[0];

    const orderStatsRows = await rawQuery<OrderStatsRow>(
      this.ds,
      `SELECT
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days') as orders_30d,
      COALESCE(SUM(total) FILTER (WHERE "orderStatus" = 'completed'), 0)::DECIMAL(12,2) as gmv_total,
      COALESCE(SUM(total) FILTER (WHERE "orderStatus" = 'completed' AND "createdAt" >= NOW() - INTERVAL '30 days'), 0)::DECIMAL(12,2) as gmv_30d
    FROM orders`,
    );
    const orderStats = orderStatsRows[0];

    const tierBreakdown = await rawQuery<TierBreakdownRow>(
      this.ds,
      `SELECT
      COALESCE(subscription_tier, 'starter') as tier,
      COUNT(*) as count,
      COALESCE(SUM(monthly_revenue), 0)::DECIMAL(10,2) as revenue
    FROM organizations GROUP BY subscription_tier ORDER BY revenue DESC`,
    );

    const mrr = toNumber(orgStats.mrr);
    return {
      tenants: {
        total: toInt(orgStats.total_tenants),
        active: toInt(orgStats.active_tenants),
        trial: toInt(orgStats.trial_tenants),
        suspended: toInt(orgStats.suspended_tenants),
      },
      revenue: { mrr, arr: mrr * 12 },
      dispensaries: {
        total: toInt(dispStats.total_dispensaries),
        active: toInt(dispStats.active_dispensaries),
        states: toInt(dispStats.states_covered),
      },
      users: {
        total: toInt(userStats.total_users),
        customers: toInt(userStats.customers),
        staff: toInt(userStats.staff_users),
        active24h: toInt(userStats.active_24h),
        active7d: toInt(userStats.active_7d),
      },
      orders: {
        total: toInt(orderStats.total_orders),
        last30d: toInt(orderStats.orders_30d),
        gmvTotal: toNumber(orderStats.gmv_total),
        gmv30d: toNumber(orderStats.gmv_30d),
      },
      tierBreakdown: tierBreakdown.map((t) => ({
        tier: t.tier,
        count: toInt(t.count),
        revenue: toNumber(t.revenue),
      })),
      totalLocations: toInt(orgStats.total_locations),
    };
  }

  // ═══ TENANT MANAGEMENT ═══

  async getTenants(): Promise<TenantRow[]> {
    return rawQuery<TenantRow>(
      this.ds,
      `SELECT o.org_id as "orgId", o.name, o.subscription_tier as "subscriptionTier",
      o.billing_status as "billingStatus", o.billing_email as "billingEmail",
      o.monthly_revenue as "monthlyRevenue", o.total_locations as "totalLocations",
      o.onboarded_at as "onboardedAt", o.trial_ends_at as "trialEndsAt", o.notes,
      o.created_at as "createdAt",
      (SELECT COUNT(*) FROM dispensaries d WHERE d.company_id IN (SELECT c.company_id FROM companies c WHERE c.org_id = o.org_id)) as "dispensaryCount",
      (SELECT COUNT(*) FROM users u WHERE u."organizationId" = o.org_id AND u."isActive" = true) as "userCount",
      (SELECT COUNT(*) FROM orders ord WHERE ord."dispensaryId" IN (SELECT d2.entity_id FROM dispensaries d2 JOIN companies c2 ON c2.company_id = d2.company_id WHERE c2.org_id = o.org_id) AND ord."createdAt" >= NOW() - INTERVAL '30 days') as "orders30d",
      (SELECT COALESCE(SUM(ord2.total), 0)::DECIMAL(10,2) FROM orders ord2 WHERE ord2."dispensaryId" IN (SELECT d3.entity_id FROM dispensaries d3 JOIN companies c3 ON c3.company_id = d3.company_id WHERE c3.org_id = o.org_id) AND ord2."orderStatus" = 'completed' AND ord2."createdAt" >= NOW() - INTERVAL '30 days') as "revenue30d"
    FROM organizations o ORDER BY o.monthly_revenue DESC`,
    );
  }

  async getTenant(orgId: string): Promise<TenantDetailRow> {
    const rows = await rawQuery<TenantDetailRow>(
      this.ds,
      `SELECT o.*,
      (SELECT COUNT(*) FROM dispensaries d WHERE d.company_id IN (SELECT c.company_id FROM companies c WHERE c.org_id = o.org_id)) as "dispensaryCount",
      (SELECT COUNT(*) FROM users u WHERE u."organizationId" = o.org_id) as "userCount"
    FROM organizations o WHERE o.org_id = $1`,
      [orgId],
    );
    const tenant = rows[0];
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updateTenant(
    orgId: string,
    input: {
      subscriptionTier?: string;
      billingStatus?: string;
      billingEmail?: string;
      notes?: string;
    },
  ): Promise<TenantDetailRow> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (input.subscriptionTier) {
      const tiers = ['starter', 'professional', 'enterprise'];
      if (!tiers.includes(input.subscriptionTier))
        throw new BadRequestException('Invalid tier');
      sets.push('subscription_tier = $' + String(i++));
      params.push(input.subscriptionTier);
      const prices: Record<string, number> = {
        starter: 299,
        professional: 499,
        enterprise: 799,
      };
      sets.push('monthly_revenue = $' + String(i++));
      params.push(prices[input.subscriptionTier]);
    }
    if (input.billingStatus) {
      sets.push('billing_status = $' + String(i++));
      params.push(input.billingStatus);
    }
    if (input.billingEmail) {
      sets.push('billing_email = $' + String(i++));
      params.push(input.billingEmail);
    }
    if (input.notes !== undefined) {
      sets.push('notes = $' + String(i++));
      params.push(input.notes);
    }

    if (sets.length === 0) throw new BadRequestException('Nothing to update');
    sets.push('updated_at = NOW()');
    params.push(orgId);

    await this.ds.query(
      'UPDATE organizations SET ' +
        sets.join(', ') +
        ' WHERE org_id = $' +
        String(i),
      params,
    );

    await this.ds.query(
      'INSERT INTO platform_activity (organization_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        orgId,
        'tenant_updated',
        'Tenant updated: ' +
          sets.filter((s) => !s.startsWith('updated')).join(', '),
        JSON.stringify(input),
      ],
    );

    return this.getTenant(orgId);
  }

  async createTenant(input: {
    name: string;
    billingEmail: string;
    subscriptionTier: string;
    state: string;
  }): Promise<TenantDetailRow> {
    const prices: Record<string, number> = {
      starter: 299,
      professional: 499,
      enterprise: 799,
    };
    const price = prices[input.subscriptionTier] || 299;

    const orgRows = await rawQuery<OrgIdRow>(
      this.ds,
      'INSERT INTO organizations (name, subscription_tier, billing_status, billing_email, monthly_revenue, onboarded_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING org_id',
      [input.name, input.subscriptionTier, 'active', input.billingEmail, price],
    );
    const org = orgRows[0];

    const companyRows = await rawQuery<CompanyIdRow>(
      this.ds,
      'INSERT INTO companies (org_id, name) VALUES ($1, $2) RETURNING company_id',
      [org.org_id, input.name],
    );
    const company = companyRows[0];

    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+$/, '');
    await this.ds.query(
      'INSERT INTO dispensaries (company_id, name, slug, state, is_active) VALUES ($1, $2, $3, $4, true)',
      [company.company_id, input.name + ' - Main', slug, input.state],
    );

    await this.ds.query(
      'UPDATE organizations SET total_locations = 1 WHERE org_id = $1',
      [org.org_id],
    );
    await this.ds.query(
      'INSERT INTO platform_activity (organization_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        org.org_id,
        'tenant_onboarded',
        input.name + ' onboarded — ' + input.subscriptionTier,
        JSON.stringify(input),
      ],
    );

    this.logger.log(
      'New tenant created: ' + input.name + ' (' + input.subscriptionTier + ')',
    );
    return this.getTenant(org.org_id);
  }

  async suspendTenant(orgId: string, reason: string): Promise<TenantDetailRow> {
    await this.ds.query(
      'UPDATE organizations SET billing_status = $1, notes = COALESCE(notes, $3) || $2, updated_at = NOW() WHERE org_id = $3',
      ['suspended', '\n[SUSPENDED] ' + reason, orgId],
    );
    await this.ds.query(
      'UPDATE dispensaries SET is_active = false WHERE company_id IN (SELECT company_id FROM companies WHERE org_id = $1)',
      [orgId],
    );
    await this.ds.query(
      'INSERT INTO platform_activity (organization_id, activity_type, description) VALUES ($1, $2, $3)',
      [orgId, 'tenant_suspended', 'Suspended: ' + reason],
    );
    return this.getTenant(orgId);
  }

  // ═══ TAX ADMINISTRATION ═══

  async getTaxRules(): Promise<TaxRuleRow[]> {
    const cacheKey = 'taxRules:all';
    const cached = await this.cache.get<TaxRuleRow[]>(cacheKey);
    if (cached) return cached;

    const rules = await rawQuery<TaxRuleRow>(
      this.ds,
      'SELECT * FROM lkp_tax_categories ORDER BY state, tax_category_id',
    );
    await this.cache.set(cacheKey, rules, 600);
    return rules;
  }

  async addTaxRule(input: {
    state: string;
    code: string;
    name: string;
    rate: number;
    taxBasis: string;
    statutoryReference?: string;
  }): Promise<TaxRuleRow> {
    const rows = await rawQuery<TaxRuleRow>(
      this.ds,
      'INSERT INTO lkp_tax_categories (state, code, name, rate, tax_basis, statutory_reference, effective_date, is_active) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, true) RETURNING *',
      [
        input.state,
        input.code,
        input.name,
        input.rate,
        input.taxBasis,
        input.statutoryReference,
      ],
    );
    await this.ds.query(
      'INSERT INTO platform_activity (activity_type, description, metadata) VALUES ($1, $2, $3)',
      [
        'tax_rule_added',
        'New tax rule: ' + input.code + ' (' + input.state + ')',
        JSON.stringify(input),
      ],
    );
    await this.cache.del('taxRules:all');
    return rows[0];
  }

  async updateTaxRule(
    taxCategoryId: number,
    input: { rate?: number; isActive?: boolean; name?: string },
  ): Promise<TaxRuleRow> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (input.rate !== undefined) {
      sets.push('rate = $' + String(i++));
      params.push(input.rate);
    }
    if (input.isActive !== undefined) {
      sets.push('is_active = $' + String(i++));
      params.push(input.isActive);
    }
    if (input.name) {
      sets.push('name = $' + String(i++));
      params.push(input.name);
    }
    if (sets.length === 0) throw new BadRequestException('Nothing to update');
    params.push(taxCategoryId);
    await this.ds.query(
      'UPDATE lkp_tax_categories SET ' +
        sets.join(', ') +
        ' WHERE tax_category_id = $' +
        String(i),
      params,
    );
    await this.cache.del('taxRules:all');
    const rows = await rawQuery<TaxRuleRow>(
      this.ds,
      'SELECT * FROM lkp_tax_categories WHERE tax_category_id = $1',
      [taxCategoryId],
    );
    return rows[0];
  }

  async getStates(): Promise<StateRow[]> {
    return rawQuery<StateRow>(
      this.ds,
      `SELECT state, COUNT(DISTINCT d.entity_id) as dispensaries, COUNT(DISTINCT tc.tax_category_id) as tax_rules
      FROM dispensaries d LEFT JOIN lkp_tax_categories tc ON tc.state = d.state
      GROUP BY d.state ORDER BY state`,
    );
  }

  async getPurchaseLimitRules(): Promise<PurchaseLimitRuleRow[]> {
    return rawQuery<PurchaseLimitRuleRow>(
      this.ds,
      'SELECT * FROM purchase_limit_rules ORDER BY state, product_category',
    );
  }

  // ═══ BILLING ═══

  async getInvoices(orgId?: string, limit = 50): Promise<InvoiceRow[]> {
    let sql =
      'SELECT bi.*, o.name as org_name FROM billing_invoices bi JOIN organizations o ON o.org_id = bi.organization_id';
    const params: unknown[] = [];
    if (orgId) {
      sql += ' WHERE bi.organization_id = $1';
      params.push(orgId);
    }
    sql += ' ORDER BY bi.created_at DESC LIMIT $' + String(params.length + 1);
    params.push(limit);
    return rawQuery<InvoiceRow>(this.ds, sql, params);
  }

  async getRevenueByMonth(months = 12): Promise<MonthlyRevenueRow[]> {
    return rawQuery<MonthlyRevenueRow>(
      this.ds,
      `SELECT DATE_TRUNC('month', bi.created_at)::DATE as month,
      COUNT(*) as invoices, SUM(bi.total)::DECIMAL(10,2) as revenue
      FROM billing_invoices bi WHERE bi.created_at >= NOW() - ($1 || ' months')::INTERVAL
      GROUP BY month ORDER BY month`,
      [months],
    );
  }

  // ═══ ACTIVITY ═══

  async getActivity(
    limit = 100,
    activityType?: string,
  ): Promise<ActivityRow[]> {
    let sql =
      'SELECT pa.*, o.name as org_name FROM platform_activity pa LEFT JOIN organizations o ON o.org_id = pa.organization_id';
    const params: unknown[] = [];
    if (activityType) {
      sql += ' WHERE pa.activity_type = $1';
      params.push(activityType);
    }
    params.push(limit);
    sql += ' ORDER BY pa.created_at DESC LIMIT $' + String(params.length);
    return rawQuery<ActivityRow>(this.ds, sql, params);
  }

  // ═══ PLATFORM REPORTS ═══

  async getPlatformReport(): Promise<PlatformReportDto> {
    const tenantHealth = await rawQuery<TenantHealthRow>(
      this.ds,
      `SELECT o.name, o.subscription_tier as tier, o.billing_status as status,
      o.monthly_revenue as mrr, o.total_locations as locations,
      (SELECT COUNT(*) FROM orders ord WHERE ord."dispensaryId" IN (SELECT d.entity_id FROM dispensaries d JOIN companies c ON c.company_id = d.company_id WHERE c.org_id = o.org_id) AND ord."createdAt" >= NOW() - INTERVAL '30 days') as orders_30d,
      (SELECT COALESCE(SUM(ord2.total), 0)::DECIMAL(10,2) FROM orders ord2 WHERE ord2."dispensaryId" IN (SELECT d2.entity_id FROM dispensaries d2 JOIN companies c2 ON c2.company_id = d2.company_id WHERE c2.org_id = o.org_id) AND ord2."orderStatus" = 'completed' AND ord2."createdAt" >= NOW() - INTERVAL '30 days') as gmv_30d
    FROM organizations o ORDER BY gmv_30d DESC`,
    );

    const churnRows = await rawQuery<ChurnRow>(
      this.ds,
      `SELECT
      COUNT(*) FILTER (WHERE billing_status = 'suspended') as churned,
      COUNT(*) as total,
      CASE WHEN COUNT(*) > 0 THEN ROUND(COUNT(*) FILTER (WHERE billing_status = 'suspended')::DECIMAL / COUNT(*) * 100, 1) ELSE 0 END as churn_rate
    FROM organizations`,
    );
    const churn = churnRows[0];

    return {
      tenantHealth,
      churnRate: toNumber(churn.churn_rate),
      totalTenants: toInt(churn.total),
      churned: toInt(churn.churned),
    };
  }

  async getSubscriptionTiers(): Promise<SubscriptionTierRow[]> {
    return rawQuery<SubscriptionTierRow>(
      this.ds,
      'SELECT * FROM subscription_tiers WHERE is_active = true ORDER BY monthly_price',
    );
  }
}
