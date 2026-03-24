import { Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class MarketingService implements OnModuleInit {
  private readonly logger = new Logger(MarketingService.name);

  constructor(@Inject(DRIZZLE) private db: any) {}

  async onModuleInit(): Promise<void> {
    await this._q(`
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        campaign_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        dispensary_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        campaign_type VARCHAR(50) NOT NULL DEFAULT 'blast',
        channel VARCHAR(20) NOT NULL DEFAULT 'email',
        audience_filter JSONB,
        subject VARCHAR(500),
        body TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        scheduled_at TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        sent_count INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS marketing_automations (
        automation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        dispensary_id UUID NOT NULL,
        trigger_event VARCHAR(100) NOT NULL,
        delay_minutes INT DEFAULT 0,
        template_id UUID,
        channel VARCHAR(20) DEFAULT 'email',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    this.logger.log('Marketing tables initialized');
  }

  // ── Campaigns ───────────────────────────────────────────────────────────

  async createCampaign(input: {
    dispensaryId: string;
    name: string;
    campaignType: string;
    channel?: string;
    audienceFilter?: { type: string };
    subject?: string;
    body?: string;
    scheduledAt?: string;
  }): Promise<any> {
    const [campaign] = await this._q(
      `INSERT INTO marketing_campaigns
        (dispensary_id, name, campaign_type, channel, audience_filter, subject, body, status, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.dispensaryId,
        input.name,
        input.campaignType,
        input.channel ?? 'email',
        input.audienceFilter ? JSON.stringify(input.audienceFilter) : null,
        input.subject ?? null,
        input.body ?? null,
        input.scheduledAt ? 'scheduled' : 'draft',
        input.scheduledAt ?? null,
      ],
    );
    return this.mapCampaign(campaign);
  }

  async getCampaigns(dispensaryId: string): Promise<any[]> {
    const rows = await this._q(
      `SELECT * FROM marketing_campaigns WHERE dispensary_id = $1 ORDER BY created_at DESC`,
      [dispensaryId],
    );
    return rows.map(this.mapCampaign);
  }

  async sendCampaign(campaignId: string): Promise<any> {
    const [campaign] = await this._q(
      `SELECT * FROM marketing_campaigns WHERE campaign_id = $1`,
      [campaignId],
    );
    if (!campaign) throw new NotFoundException('Campaign not found');

    // Get audience count
    const audienceCount = await this.getAudienceCount(
      campaign.dispensary_id,
      campaign.audience_filter?.type ?? 'all',
    );

    await this._q(
      `UPDATE marketing_campaigns
       SET status = 'sent', sent_at = NOW(), sent_count = $1, updated_at = NOW()
       WHERE campaign_id = $2`,
      [audienceCount, campaignId],
    );

    this.logger.log(`Campaign ${campaignId} queued for delivery to ${audienceCount} recipients`);

    const [updated] = await this._q(
      `SELECT * FROM marketing_campaigns WHERE campaign_id = $1`,
      [campaignId],
    );
    return this.mapCampaign(updated);
  }

  // ── Automations ─────────────────────────────────────────────────────────

  async getAutomatedTriggers(dispensaryId: string): Promise<any[]> {
    const rows = await this._q(
      `SELECT * FROM marketing_automations WHERE dispensary_id = $1 ORDER BY created_at DESC`,
      [dispensaryId],
    );
    return rows.map(this.mapAutomation);
  }

  async createAutomatedTrigger(input: {
    dispensaryId: string;
    triggerEvent: string;
    delayMinutes?: number;
    templateId?: string;
    channel?: string;
  }): Promise<any> {
    const [row] = await this._q(
      `INSERT INTO marketing_automations (dispensary_id, trigger_event, delay_minutes, template_id, channel)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        input.dispensaryId,
        input.triggerEvent,
        input.delayMinutes ?? 0,
        input.templateId ?? null,
        input.channel ?? 'email',
      ],
    );
    return this.mapAutomation(row);
  }

  // ── Stats ───────────────────────────────────────────────────────────────

  async getCampaignStats(campaignId: string): Promise<any> {
    const [campaign] = await this._q(
      `SELECT * FROM marketing_campaigns WHERE campaign_id = $1`,
      [campaignId],
    );
    if (!campaign) throw new NotFoundException('Campaign not found');

    // In production, these would come from notification_log tracking
    const sentCount = campaign.sent_count ?? 0;
    return {
      campaignId,
      sentCount,
      openRate: sentCount > 0 ? 0.0 : 0,
      clickRate: sentCount > 0 ? 0.0 : 0,
    };
  }

  // ── Audience Preview ────────────────────────────────────────────────────

  async getAudienceCount(dispensaryId: string, filter: string): Promise<number> {
    let sql: string;
    const params: any[] = [dispensaryId];

    switch (filter) {
      case 'loyalty_tier':
        sql = `SELECT COUNT(*)::int as cnt FROM customers WHERE dispensary_id = $1 AND loyalty_tier IS NOT NULL`;
        break;
      case 'recent_purchasers':
        sql = `SELECT COUNT(DISTINCT c.customer_id)::int as cnt FROM customers c
               JOIN orders o ON o."customerId" = c.customer_id::text
               WHERE c.dispensary_id = $1 AND o."createdAt" >= NOW() - INTERVAL '30 days'`;
        break;
      case 'inactive':
        sql = `SELECT COUNT(DISTINCT c.customer_id)::int as cnt FROM customers c
               LEFT JOIN orders o ON o."customerId" = c.customer_id::text AND o."createdAt" >= NOW() - INTERVAL '90 days'
               WHERE c.dispensary_id = $1 AND o."orderId" IS NULL`;
        break;
      default: // 'all'
        sql = `SELECT COUNT(*)::int as cnt FROM customers WHERE dispensary_id = $1`;
        break;
    }

    const [result] = await this._q(sql, params);
    return result?.cnt ?? 0;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private mapCampaign(row: any): any {
    return {
      campaignId: row.campaign_id,
      dispensaryId: row.dispensary_id,
      name: row.name,
      campaignType: row.campaign_type,
      channel: row.channel,
      audienceFilter: row.audience_filter,
      subject: row.subject,
      body: row.body,
      status: row.status,
      scheduledAt: row.scheduled_at,
      sentAt: row.sent_at,
      sentCount: row.sent_count ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapAutomation(row: any): any {
    return {
      automationId: row.automation_id,
      dispensaryId: row.dispensary_id,
      triggerEvent: row.trigger_event,
      delayMinutes: row.delay_minutes,
      templateId: row.template_id,
      channel: row.channel,
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }
}
