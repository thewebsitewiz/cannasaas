import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { validateUUID } from '../../common/helpers/validation.helpers';

export interface WeeklyDigest {
  dispensaryId: string;
  dispensaryName: string;
  period: { start: string; end: string };
  revenue: { current: number; previous: number; changePercent: number; trend: 'up' | 'down' | 'flat' };
  orders: { current: number; previous: number; changePercent: number };
  topGainingProduct: { name: string; currentUnits: number; previousUnits: number; change: number } | null;
  topDecliningProduct: { name: string; currentUnits: number; previousUnits: number; change: number } | null;
  busiestHour: { hour: number; orders: number } | null;
  customerRatio: { newCustomers: number; returningCustomers: number; newPercent: number };
  inventoryAlerts: { productName: string; variantName: string; available: number; daysUntilOut: number }[];
}

@Injectable()
export class AnalyticsDigestService {
  private readonly logger = new Logger(AnalyticsDigestService.name);

  constructor(
    @InjectDataSource() private ds: DataSource,
    private eventEmitter: EventEmitter2,
  ) {}

  async generateWeeklyDigest(dispensaryId: string): Promise<WeeklyDigest> {
    validateUUID(dispensaryId, 'dispensaryId');

    const [disp] = await this.ds.query(
      `SELECT name FROM dispensaries WHERE entity_id = $1`, [dispensaryId],
    );

    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    const startCurrent = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const startPrevious = new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0];

    // Revenue & orders comparison
    const [current] = await this.ds.query(
      `SELECT COALESCE(SUM(total), 0)::DECIMAL(12,2) as revenue, COUNT(*) as orders
       FROM orders WHERE "dispensaryId" = $1 AND "orderStatus" = 'completed'
         AND "createdAt" >= $2::DATE AND "createdAt" < $3::DATE`,
      [dispensaryId, startCurrent, endDate],
    );
    const [previous] = await this.ds.query(
      `SELECT COALESCE(SUM(total), 0)::DECIMAL(12,2) as revenue, COUNT(*) as orders
       FROM orders WHERE "dispensaryId" = $1 AND "orderStatus" = 'completed'
         AND "createdAt" >= $2::DATE AND "createdAt" < $3::DATE`,
      [dispensaryId, startPrevious, startCurrent],
    );

    const curRevenue = parseFloat(current.revenue);
    const prevRevenue = parseFloat(previous.revenue);
    const revChange = prevRevenue > 0 ? ((curRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const curOrders = parseInt(current.orders, 10);
    const prevOrders = parseInt(previous.orders, 10);
    const ordChange = prevOrders > 0 ? ((curOrders - prevOrders) / prevOrders) * 100 : 0;

    // Top gaining & declining product
    const productChanges = await this.ds.query(`
      WITH cur AS (
        SELECT li."productId", SUM(li.quantity) as units
        FROM order_line_items li JOIN orders o ON o."orderId" = li."orderId"
        WHERE o."dispensaryId" = $1 AND o."orderStatus" = 'completed'
          AND o."createdAt" >= $2::DATE AND o."createdAt" < $3::DATE
        GROUP BY li."productId"
      ), prev AS (
        SELECT li."productId", SUM(li.quantity) as units
        FROM order_line_items li JOIN orders o ON o."orderId" = li."orderId"
        WHERE o."dispensaryId" = $1 AND o."orderStatus" = 'completed'
          AND o."createdAt" >= $4::DATE AND o."createdAt" < $2::DATE
        GROUP BY li."productId"
      )
      SELECT p.name, COALESCE(cur.units, 0)::INT as current_units,
             COALESCE(prev.units, 0)::INT as previous_units,
             (COALESCE(cur.units, 0) - COALESCE(prev.units, 0))::INT as change
      FROM products p
      LEFT JOIN cur ON cur."productId" = p.id
      LEFT JOIN prev ON prev."productId" = p.id
      WHERE p.dispensary_id = $1 AND (cur.units IS NOT NULL OR prev.units IS NOT NULL)
      ORDER BY change DESC
    `, [dispensaryId, startCurrent, endDate, startPrevious]);

    const topGaining = productChanges.length > 0 && productChanges[0].change > 0
      ? { name: productChanges[0].name, currentUnits: productChanges[0].current_units, previousUnits: productChanges[0].previous_units, change: productChanges[0].change }
      : null;

    const topDeclining = productChanges.length > 0 && productChanges[productChanges.length - 1].change < 0
      ? { name: productChanges[productChanges.length - 1].name, currentUnits: productChanges[productChanges.length - 1].current_units, previousUnits: productChanges[productChanges.length - 1].previous_units, change: productChanges[productChanges.length - 1].change }
      : null;

    // Busiest hour
    const [busiestHour] = await this.ds.query(`
      SELECT EXTRACT(HOUR FROM "createdAt")::INT as hour, COUNT(*) as orders
      FROM orders WHERE "dispensaryId" = $1 AND "orderStatus" = 'completed'
        AND "createdAt" >= $2::DATE AND "createdAt" < $3::DATE
      GROUP BY hour ORDER BY orders DESC LIMIT 1
    `, [dispensaryId, startCurrent, endDate]);

    // New vs returning customers
    const [customerRatio] = await this.ds.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_new) as new_customers,
        COUNT(*) FILTER (WHERE NOT is_new) as returning_customers
      FROM (
        SELECT o."customerUserId",
          (SELECT COUNT(*) FROM orders o2
           WHERE o2."customerUserId" = o."customerUserId" AND o2."orderStatus" = 'completed'
             AND o2."createdAt" < $2::DATE) = 0 as is_new
        FROM orders o
        WHERE o."dispensaryId" = $1 AND o."orderStatus" = 'completed'
          AND o."createdAt" >= $2::DATE AND o."createdAt" < $3::DATE
        GROUP BY o."customerUserId"
      ) sub
    `, [dispensaryId, startCurrent, endDate]);

    const newCust = parseInt(customerRatio?.new_customers ?? 0, 10);
    const retCust = parseInt(customerRatio?.returning_customers ?? 0, 10);
    const totalCust = newCust + retCust;

    // Inventory alerts: items running out in < 7 days
    const inventoryAlerts = await this.ds.query(`
      WITH daily_sales AS (
        SELECT oi.variant_id, COALESCE(SUM(oi.quantity) / NULLIF(7, 0), 0) as daily_avg
        FROM order_items oi JOIN orders o ON o."orderId" = oi.order_id
        WHERE o."dispensaryId" = $1 AND o."orderStatus" = 'completed'
          AND o."createdAt" >= NOW() - INTERVAL '7 days'
        GROUP BY oi.variant_id
      )
      SELECT p.name as product_name, pv.name as variant_name,
             i.quantity_available as available,
             CASE WHEN ds.daily_avg > 0
               THEN ROUND(i.quantity_available / ds.daily_avg)
               ELSE 999 END as days_until_out
      FROM inventory i
      JOIN product_variants pv ON pv.variant_id = i.variant_id
      JOIN products p ON p.id = pv.product_id
      LEFT JOIN daily_sales ds ON ds.variant_id = i.variant_id
      WHERE i.dispensary_id = $1 AND i.quantity_available > 0
        AND ds.daily_avg > 0
        AND (i.quantity_available / ds.daily_avg) < 7
      ORDER BY days_until_out ASC
      LIMIT 10
    `, [dispensaryId]);

    return {
      dispensaryId,
      dispensaryName: disp?.name ?? 'Unknown',
      period: { start: startCurrent, end: endDate },
      revenue: {
        current: curRevenue,
        previous: prevRevenue,
        changePercent: parseFloat(revChange.toFixed(1)),
        trend: revChange > 1 ? 'up' : revChange < -1 ? 'down' : 'flat',
      },
      orders: {
        current: curOrders,
        previous: prevOrders,
        changePercent: parseFloat(ordChange.toFixed(1)),
      },
      topGainingProduct: topGaining,
      topDecliningProduct: topDeclining,
      busiestHour: busiestHour ? { hour: busiestHour.hour, orders: parseInt(busiestHour.orders, 10) } : null,
      customerRatio: {
        newCustomers: newCust,
        returningCustomers: retCust,
        newPercent: totalCust > 0 ? parseFloat(((newCust / totalCust) * 100).toFixed(1)) : 0,
      },
      inventoryAlerts: inventoryAlerts.map((a: any) => ({
        productName: a.product_name,
        variantName: a.variant_name,
        available: parseFloat(a.available),
        daysUntilOut: parseInt(a.days_until_out, 10),
      })),
    };
  }

  async sendDigestEmail(dispensaryId: string): Promise<void> {
    const digest = await this.generateWeeklyDigest(dispensaryId);

    // Get admin emails for this dispensary
    const admins = await this.ds.query(
      `SELECT u.email, u."firstName" FROM users u
       JOIN employee_profiles ep ON ep.user_id = u.id
       WHERE ep.dispensary_id = $1 AND ep.employment_status = 'active'
         AND u.role IN ('dispensary_admin', 'org_admin')`,
      [dispensaryId],
    );

    if (admins.length === 0) return;

    const trendEmoji = digest.revenue.trend === 'up' ? '↑' : digest.revenue.trend === 'down' ? '↓' : '→';
    const alertRows = digest.inventoryAlerts.map(a =>
      `<tr><td>${a.productName} - ${a.variantName}</td><td>${a.available}</td><td style="color:#dc2626">${a.daysUntilOut}d</td></tr>`
    ).join('');

    const html = `
      <div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#2563eb">Weekly Digest: ${digest.dispensaryName}</h2>
        <p style="color:#666">${digest.period.start} to ${digest.period.end}</p>
        <div style="background:#f0f4ff;border-radius:8px;padding:16px;margin:16px 0">
          <h3 style="margin:0">Revenue: $${digest.revenue.current.toLocaleString()} ${trendEmoji} ${digest.revenue.changePercent}%</h3>
          <p style="margin:4px 0;color:#666">Orders: ${digest.orders.current} (${digest.orders.changePercent > 0 ? '+' : ''}${digest.orders.changePercent}%)</p>
        </div>
        ${digest.topGainingProduct ? `<p><strong>Top Gainer:</strong> ${digest.topGainingProduct.name} (+${digest.topGainingProduct.change} units)</p>` : ''}
        ${digest.topDecliningProduct ? `<p><strong>Top Decliner:</strong> ${digest.topDecliningProduct.name} (${digest.topDecliningProduct.change} units)</p>` : ''}
        ${digest.busiestHour ? `<p><strong>Busiest Hour:</strong> ${digest.busiestHour.hour}:00 (${digest.busiestHour.orders} orders)</p>` : ''}
        <p><strong>Customers:</strong> ${digest.customerRatio.newCustomers} new, ${digest.customerRatio.returningCustomers} returning (${digest.customerRatio.newPercent}% new)</p>
        ${digest.inventoryAlerts.length > 0 ? `
          <h3 style="color:#dc2626;margin-top:16px">Inventory Alerts</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr style="background:#fef2f2"><th style="text-align:left;padding:6px">Product</th><th>Available</th><th>Days Left</th></tr>
            ${alertRows}
          </table>
        ` : '<p style="color:#16a34a">No inventory alerts this week.</p>'}
        <p style="color:#94a3b8;font-size:11px;margin-top:24px">Generated by CannaSaaS Analytics</p>
      </div>
    `;

    for (const admin of admins) {
      this.eventEmitter.emit('notification.email', {
        to: admin.email,
        subject: `Weekly Digest: ${digest.dispensaryName} — ${digest.revenue.trend === 'up' ? 'Revenue Up' : digest.revenue.trend === 'down' ? 'Revenue Down' : 'Steady'} ${Math.abs(digest.revenue.changePercent)}%`,
        html,
      });
    }

    this.logger.log(`Digest sent for dispensary ${dispensaryId} to ${admins.length} admin(s)`);
  }

  // Monday 9 AM — send digest to all active dispensaries
  @Cron('0 9 * * 1')
  async weeklyDigestCron(): Promise<void> {
    this.logger.log('Running weekly digest CRON');
    const dispensaries = await this.ds.query(
      `SELECT entity_id FROM dispensaries WHERE is_active = true`,
    );

    for (const disp of dispensaries) {
      try {
        await this.sendDigestEmail(disp.entity_id);
      } catch (err: any) {
        this.logger.error(`Digest failed for ${disp.entity_id}: ${err.message}`);
      }
    }

    this.logger.log(`Weekly digest CRON completed for ${dispensaries.length} dispensaries`);
  }
}
