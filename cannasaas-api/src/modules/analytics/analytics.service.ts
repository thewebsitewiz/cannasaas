// cannasaas-api/src/modules/analytics/analytics.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AnalyticsEvent } from './entities/analytics-event.entity';

export enum EventType {
  PAGE_VIEW = 'page_view', PRODUCT_VIEW = 'product_view',
  ADD_TO_CART = 'add_to_cart', REMOVE_FROM_CART = 'remove_from_cart',
  BEGIN_CHECKOUT = 'begin_checkout', PURCHASE = 'purchase',
  REFUND = 'refund', SIGN_UP = 'sign_up', LOGIN = 'login',
  SEARCH = 'search', REVIEW_SUBMITTED = 'review_submitted',
  WISHLIST_ADD = 'wishlist_add', SHARE = 'share',
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private eventRepo: Repository<AnalyticsEvent>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async trackEvent(event: {
    organizationId: string; eventType: EventType;
    userId?: string; sessionId: string;
    data?: Record<string, any>;
  }) {
    const entity = this.eventRepo.create({ ...event, timestamp: new Date() });
    await this.eventRepo.save(entity);

    // Real-time Redis counters
    const dateKey = new Date().toISOString().slice(0, 10);
    const prefix = `analytics:${event.organizationId}:${dateKey}`;
    const countKey = `${prefix}:${event.eventType}`;
    const current = (await this.cache.get<number>(countKey)) || 0;
    await this.cache.set(countKey, current + 1, 86400);

    if (event.eventType === EventType.PURCHASE && event.data?.total) {
      const revKey = `${prefix}:revenue`;
      const rev = (await this.cache.get<number>(revKey)) || 0;
      await this.cache.set(revKey, rev + event.data.total, 86400);
    }
  }

  async getDashboard(orgId: string, start: Date, end: Date) {
    const events = await this.eventRepo.find({
      where: { organizationId: orgId, timestamp: Between(start, end) },
    });
    const purchases = events.filter(e => e.eventType === EventType.PURCHASE);
    const revenue = purchases.reduce((s, e) => s + (e.data?.total || 0), 0);
    const visitors = new Set(events.map(e => e.sessionId)).size;

    return {
      revenue, orderCount: purchases.length,
      avgOrderValue: purchases.length > 0 ? revenue / purchases.length : 0,
      uniqueVisitors: visitors,
      conversionRate: visitors > 0
        ? (purchases.length / visitors * 100).toFixed(2) : '0',
      topProducts: this.getTopProducts(events),
    };
  }

  private getTopProducts(events: AnalyticsEvent[]) {
    const views = events.filter(e => e.eventType === EventType.PRODUCT_VIEW);
    const counts: Record<string, { name: string; views: number }> = {};
    views.forEach(e => {
      const id = e.data?.productId;
      if (!id) return;
      if (!counts[id]) counts[id] = { name: e.data?.productName || id, views: 0 };
      counts[id].views++;
    });
    return Object.entries(counts)
      .sort(([,a], [,b]) => b.views - a.views).slice(0, 10)
      .map(([id, d]) => ({ productId: id, ...d }));
  }
}
