// cannasaas-api/src/modules/analytics/advanced-analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { AnalyticsEvent } from './entities/analytics-event.entity';

@Injectable()
export class AdvancedAnalyticsService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(AnalyticsEvent) private eventRepo: Repository<AnalyticsEvent>,
  ) {}

  async getRevenueTrends(orgId: string, days: number = 30) {
    return this.orderRepo.query(`
      SELECT DATE(created_at) as date, COUNT(*) as order_count,
        SUM(total) as revenue, AVG(total) as avg_order_value,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM orders
      WHERE organization_id = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
        AND status NOT IN ('cancelled', 'refunded')
      GROUP BY DATE(created_at) ORDER BY date ASC
    `, [orgId]);
  }

  async getCohortAnalysis(orgId: string) {
    return this.orderRepo.query(`
      WITH first_orders AS (
        SELECT customer_id, DATE_TRUNC('month', MIN(created_at)) as cohort
        FROM orders WHERE organization_id = $1 GROUP BY customer_id
      ),
      monthly_activity AS (
        SELECT fo.cohort, DATE_TRUNC('month', o.created_at) as activity_month,
          COUNT(DISTINCT o.customer_id) as active_customers
        FROM orders o JOIN first_orders fo ON o.customer_id = fo.customer_id
        WHERE o.organization_id = $1
        GROUP BY fo.cohort, DATE_TRUNC('month', o.created_at)
      )
      SELECT cohort, activity_month, active_customers,
        EXTRACT(MONTH FROM activity_month - cohort) as months_since
      FROM monthly_activity ORDER BY cohort, activity_month
    `, [orgId]);
  }

  async getConversionFunnel(orgId: string, days: number = 7) {
    const events = await this.eventRepo.query(`
      SELECT event_type, COUNT(DISTINCT session_id) as unique_sessions
      FROM analytics_events
      WHERE organization_id = $1
        AND timestamp >= NOW() - INTERVAL '${days} days'
        AND event_type IN ('page_view','product_view','add_to_cart',
          'begin_checkout','purchase')
      GROUP BY event_type
    `, [orgId]);

    const funnel = ['page_view','product_view','add_to_cart','begin_checkout','purchase'];
    return funnel.map(step => {
      const data = events.find((e: any) => e.event_type === step);
      return { step, sessions: parseInt(data?.unique_sessions || '0') };
    });
  }
}
