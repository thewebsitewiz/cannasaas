import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);

  constructor(
    @InjectDataSource() private ds: DataSource,
    private readonly cache: CacheService,
  ) {}

  // ═══ DASHBOARD ═══

  async getDashboard(): Promise<any> {
    const [orgStats] = await this.ds.query(`SELECT
      COUNT(*) as total_tenants,
      COUNT(*) FILTER (WHERE billing_status = 'active') as active_tenants,
      COUNT(*) FILTER (WHERE billing_status = 'trial') as trial_tenants,
      COUNT(*) FILTER (WHERE billing_status = 'suspended') as suspended_tenants,
      COALESCE(SUM(monthly_revenue), 0)::DECIMAL(10,2) as mrr,
      COALESCE(SUM(total_locations), 0) as total_locations
    FROM organizations`);

    const [dispStats] = await this.ds.query(`SELECT
      COUNT(*) as total_dispensaries,
      COUNT(*) FILTER (WHERE is_active = true) as active_dispensaries,
      COUNT(DISTINCT state) as states_covered
    FROM dispensaries`);

    const [userStats] = await this.ds.query(`SELECT
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE role = 'customer') as customers,
      COUNT(*) FILTER (WHERE role != 'customer') as staff_users,
      COUNT(*) FILTER (WHERE "lastLoginAt" >= NOW() - INTERVAL '24 hours') as active_24h,
      COUNT(*) FILTER (WHERE "lastLoginAt" >= NOW() - INTERVAL '7 days') as active_7d
    FROM users WHERE "isActive" = true`);

    const [orderStats] = await this.ds.query(`SELECT
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days') as orders_30d,
      COALESCE(SUM(total) FILTER (WHERE "orderStatus" = 'completed'), 0)::DECIMAL(12,2) as gmv_total,
      COALESCE(SUM(total) FILTER (WHERE "orderStatus" = 'completed' AND "createdAt" >= NOW() - INTERVAL '30 days'), 0)::DECIMAL(12,2) as gmv_30d
    FROM orders`);

    const tierBreakdown = await this.ds.query(`SELECT
      COALESCE(subscription_tier, 'starter') as tier,
      COUNT(*) as count,
      COALESCE(SUM(monthly_revenue), 0)::DECIMAL(10,2) as revenue
    FROM organizations GROUP BY subscription_tier ORDER BY revenue DESC`);

    return {
      tenants: { total: parseInt(orgStats.total_tenants), active: parseInt(orgStats.active_tenants), trial: parseInt(orgStats.trial_tenants), suspended: parseInt(orgStats.suspended_tenants) },
      revenue: { mrr: parseFloat(orgStats.mrr), arr: parseFloat(orgStats.mrr) * 12 },
      dispensaries: { total: parseInt(dispStats.total_dispensaries), active: parseInt(dispStats.active_dispensaries), states: parseInt(dispStats.states_covered) },
      users: { total: parseInt(userStats.total_users), customers: parseInt(userStats.customers), staff: parseInt(userStats.staff_users), active24h: parseInt(userStats.active_24h), active7d: parseInt(userStats.active_7d) },
      orders: { total: parseInt(orderStats.total_orders), last30d: parseInt(orderStats.orders_30d), gmvTotal: parseFloat(orderStats.gmv_total), gmv30d: parseFloat(orderStats.gmv_30d) },
      tierBreakdown: tierBreakdown.map((t: any) => ({ tier: t.tier, count: parseInt(t.count), revenue: parseFloat(t.revenue) })),
      totalLocations: parseInt(orgStats.total_locations),
    };
  }

  // ═══ TENANT MANAGEMENT ═══

  async getTenants(): Promise<any[]> {
    return this.ds.query(`SELECT o.org_id as "orgId", o.name, o.subscription_tier as "subscriptionTier",
      o.billing_status as "billingStatus", o.billing_email as "billingEmail",
      o.monthly_revenue as "monthlyRevenue", o.total_locations as "totalLocations",
      o.onboarded_at as "onboardedAt", o.trial_ends_at as "trialEndsAt", o.notes,
      o.created_at as "createdAt",
      (SELECT COUNT(*) FROM dispensaries d WHERE d.company_id IN (SELECT c.company_id FROM companies c WHERE c.org_id = o.org_id)) as "dispensaryCount",
      (SELECT COUNT(*) FROM users u WHERE u."organizationId" = o.org_id AND u."isActive" = true) as "userCount",
      (SELECT COUNT(*) FROM orders ord WHERE ord."dispensaryId" IN (SELECT d2.entity_id FROM dispensaries d2 JOIN companies c2 ON c2.company_id = d2.company_id WHERE c2.org_id = o.org_id) AND ord."createdAt" >= NOW() - INTERVAL '30 days') as "orders30d",
      (SELECT COALESCE(SUM(ord2.total), 0)::DECIMAL(10,2) FROM orders ord2 WHERE ord2."dispensaryId" IN (SELECT d3.entity_id FROM dispensaries d3 JOIN companies c3 ON c3.company_id = d3.company_id WHERE c3.org_id = o.org_id) AND ord2."orderStatus" = 'completed' AND ord2."createdAt" >= NOW() - INTERVAL '30 days') as "revenue30d"
    FROM organizations o ORDER BY o.monthly_revenue DESC`);
  }

  async getTenant(orgId: string): Promise<any> {
    const [tenant] = await this.ds.query(`SELECT o.*, 
      (SELECT COUNT(*) FROM dispensaries d WHERE d.company_id IN (SELECT c.company_id FROM companies c WHERE c.org_id = o.org_id)) as "dispensaryCount",
      (SELECT COUNT(*) FROM users u WHERE u."organizationId" = o.org_id) as "userCount"
    FROM organizations o WHERE o.org_id = $1`, [orgId]);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updateTenant(orgId: string, input: { subscriptionTier?: string; billingStatus?: string; billingEmail?: string; notes?: string }): Promise<any> {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (input.subscriptionTier) { 
      const tiers = ['starter', 'professional', 'enterprise'];
      if (!tiers.includes(input.subscriptionTier)) throw new BadRequestException('Invalid tier');
      sets.push('subscription_tier = $' + i++); params.push(input.subscriptionTier);
      const prices: Record<string, number> = { starter: 299, professional: 499, enterprise: 799 };
      sets.push('monthly_revenue = $' + i++); params.push(prices[input.subscriptionTier]);
    }
    if (input.billingStatus) { sets.push('billing_status = $' + i++); params.push(input.billingStatus); }
    if (input.billingEmail) { sets.push('billing_email = $' + i++); params.push(input.billingEmail); }
    if (input.notes !== undefined) { sets.push('notes = $' + i++); params.push(input.notes); }

    if (sets.length === 0) throw new BadRequestException('Nothing to update');
    sets.push('updated_at = NOW()');
    params.push(orgId);

    await this.ds.query('UPDATE organizations SET ' + sets.join(', ') + ' WHERE org_id = $' + i, params);

    await this.ds.query('INSERT INTO platform_activity (organization_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [orgId, 'tenant_updated', 'Tenant updated: ' + sets.filter(s => !s.startsWith('updated')).join(', '), JSON.stringify(input)]);

    return this.getTenant(orgId);
  }

  async createTenant(input: { name: string; billingEmail: string; subscriptionTier: string; state: string }): Promise<any> {
    const prices: Record<string, number> = { starter: 299, professional: 499, enterprise: 799 };
    const price = prices[input.subscriptionTier] || 299;

    const [org] = await this.ds.query(
      'INSERT INTO organizations (name, subscription_tier, billing_status, billing_email, monthly_revenue, onboarded_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [input.name, input.subscriptionTier, 'active', input.billingEmail, price],
    );

    const [company] = await this.ds.query(
      'INSERT INTO companies (org_id, name) VALUES ($1, $2) RETURNING *',
      [org.org_id, input.name],
    );

    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    await this.ds.query(
      'INSERT INTO dispensaries (company_id, name, slug, state, is_active) VALUES ($1, $2, $3, $4, true)',
      [company.company_id, input.name + ' - Main', slug, input.state],
    );

    await this.ds.query('UPDATE organizations SET total_locations = 1 WHERE org_id = $1', [org.org_id]);
    await this.ds.query('INSERT INTO platform_activity (organization_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [org.org_id, 'tenant_onboarded', input.name + ' onboarded — ' + input.subscriptionTier, JSON.stringify(input)]);

    this.logger.log('New tenant created: ' + input.name + ' (' + input.subscriptionTier + ')');
    return this.getTenant(org.org_id);
  }

  async suspendTenant(orgId: string, reason: string): Promise<any> {
    await this.ds.query('UPDATE organizations SET billing_status = $1, notes = COALESCE(notes, $3) || $2, updated_at = NOW() WHERE org_id = $3',
      ['suspended', '\n[SUSPENDED] ' + reason, orgId]);
    await this.ds.query('UPDATE dispensaries SET is_active = false WHERE company_id IN (SELECT company_id FROM companies WHERE org_id = $1)', [orgId]);
    await this.ds.query('INSERT INTO platform_activity (organization_id, activity_type, description) VALUES ($1, $2, $3)',
      [orgId, 'tenant_suspended', 'Suspended: ' + reason]);
    return this.getTenant(orgId);
  }

  // ═══ TAX ADMINISTRATION ═══

  async getTaxRules(): Promise<any[]> {
    const cacheKey = 'taxRules:all';
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const rules = await this.ds.query('SELECT * FROM lkp_tax_categories ORDER BY state, tax_category_id');
    await this.cache.set(cacheKey, rules, 600);
    return rules;
  }

  async addTaxRule(input: { state: string; code: string; name: string; rate: number; taxBasis: string; statutoryReference?: string }): Promise<any> {
    const [rule] = await this.ds.query(
      'INSERT INTO lkp_tax_categories (state, code, name, rate, tax_basis, statutory_reference, effective_date, is_active) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, true) RETURNING *',
      [input.state, input.code, input.name, input.rate, input.taxBasis, input.statutoryReference],
    );
    await this.ds.query('INSERT INTO platform_activity (activity_type, description, metadata) VALUES ($1, $2, $3)',
      ['tax_rule_added', 'New tax rule: ' + input.code + ' (' + input.state + ')', JSON.stringify(input)]);
    // Invalidate tax rules cache
    await this.cache.del('taxRules:all');
    return rule;
  }

  async updateTaxRule(taxCategoryId: number, input: { rate?: number; isActive?: boolean; name?: string }): Promise<any> {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (input.rate !== undefined) { sets.push('rate = $' + i++); params.push(input.rate); }
    if (input.isActive !== undefined) { sets.push('is_active = $' + i++); params.push(input.isActive); }
    if (input.name) { sets.push('name = $' + i++); params.push(input.name); }
    if (sets.length === 0) throw new BadRequestException('Nothing to update');
    params.push(taxCategoryId);
    await this.ds.query('UPDATE lkp_tax_categories SET ' + sets.join(', ') + ' WHERE tax_category_id = $' + i, params);
    // Invalidate tax rules cache
    await this.cache.del('taxRules:all');
    const [rule] = await this.ds.query('SELECT * FROM lkp_tax_categories WHERE tax_category_id = $1', [taxCategoryId]);
    return rule;
  }

  async getStates(): Promise<any[]> {
    return this.ds.query(`SELECT state, COUNT(DISTINCT d.entity_id) as dispensaries, COUNT(DISTINCT tc.tax_category_id) as tax_rules
      FROM dispensaries d LEFT JOIN lkp_tax_categories tc ON tc.state = d.state
      GROUP BY d.state ORDER BY state`);
  }

  async getPurchaseLimitRules(): Promise<any[]> {
    return this.ds.query('SELECT * FROM purchase_limit_rules ORDER BY state, product_category');
  }

  // ═══ BILLING ═══

  async getInvoices(orgId?: string, limit = 50): Promise<any[]> {
    let sql = 'SELECT bi.*, o.name as org_name FROM billing_invoices bi JOIN organizations o ON o.org_id = bi.organization_id';
    const params: any[] = [];
    if (orgId) { sql += ' WHERE bi.organization_id = $1'; params.push(orgId); }
    sql += ' ORDER BY bi.created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    return this.ds.query(sql, params);
  }

  async getRevenueByMonth(months = 12): Promise<any[]> {
    return this.ds.query(`SELECT DATE_TRUNC('month', bi.created_at)::DATE as month,
      COUNT(*) as invoices, SUM(bi.total)::DECIMAL(10,2) as revenue
      FROM billing_invoices bi WHERE bi.created_at >= NOW() - ($1 || ' months')::INTERVAL
      GROUP BY month ORDER BY month`, [months]);
  }

  // ═══ ACTIVITY ═══

  async getActivity(limit = 100, activityType?: string): Promise<any[]> {
    let sql = 'SELECT pa.*, o.name as org_name FROM platform_activity pa LEFT JOIN organizations o ON o.org_id = pa.organization_id';
    const params: any[] = [];
    if (activityType) { sql += ' WHERE pa.activity_type = $1'; params.push(activityType); }
    params.push(limit);
    sql += ' ORDER BY pa.created_at DESC LIMIT $' + params.length;
    return this.ds.query(sql, params);
  }

  // ═══ PLATFORM REPORTS ═══

  async getPlatformReport(): Promise<any> {
    const tenantHealth = await this.ds.query(`SELECT o.name, o.subscription_tier as tier, o.billing_status as status,
      o.monthly_revenue as mrr, o.total_locations as locations,
      (SELECT COUNT(*) FROM orders ord WHERE ord."dispensaryId" IN (SELECT d.entity_id FROM dispensaries d JOIN companies c ON c.company_id = d.company_id WHERE c.org_id = o.org_id) AND ord."createdAt" >= NOW() - INTERVAL '30 days') as orders_30d,
      (SELECT COALESCE(SUM(ord2.total), 0)::DECIMAL(10,2) FROM orders ord2 WHERE ord2."dispensaryId" IN (SELECT d2.entity_id FROM dispensaries d2 JOIN companies c2 ON c2.company_id = d2.company_id WHERE c2.org_id = o.org_id) AND ord2."orderStatus" = 'completed' AND ord2."createdAt" >= NOW() - INTERVAL '30 days') as gmv_30d
    FROM organizations o ORDER BY gmv_30d DESC`);

    const [churn] = await this.ds.query(`SELECT
      COUNT(*) FILTER (WHERE billing_status = 'suspended') as churned,
      COUNT(*) as total,
      CASE WHEN COUNT(*) > 0 THEN ROUND(COUNT(*) FILTER (WHERE billing_status = 'suspended')::DECIMAL / COUNT(*) * 100, 1) ELSE 0 END as churn_rate
    FROM organizations`);

    return {
      tenantHealth,
      churnRate: parseFloat(churn.churn_rate),
      totalTenants: parseInt(churn.total),
      churned: parseInt(churn.churned),
    };
  }

  async getSubscriptionTiers(): Promise<any[]> {
    return this.ds.query('SELECT * FROM subscription_tiers WHERE is_active = true ORDER BY monthly_price');
  }
}
