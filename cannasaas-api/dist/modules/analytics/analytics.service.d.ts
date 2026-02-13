import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { AnalyticsEvent } from './entities/analytics-event.entity';
export declare enum EventType {
    PAGE_VIEW = "page_view",
    PRODUCT_VIEW = "product_view",
    ADD_TO_CART = "add_to_cart",
    REMOVE_FROM_CART = "remove_from_cart",
    BEGIN_CHECKOUT = "begin_checkout",
    PURCHASE = "purchase",
    REFUND = "refund",
    SIGN_UP = "sign_up",
    LOGIN = "login",
    SEARCH = "search",
    REVIEW_SUBMITTED = "review_submitted",
    WISHLIST_ADD = "wishlist_add",
    SHARE = "share"
}
export declare class AnalyticsService {
    private eventRepo;
    private cache;
    constructor(eventRepo: Repository<AnalyticsEvent>, cache: Cache);
    trackEvent(event: {
        organizationId: string;
        eventType: EventType;
        userId?: string;
        sessionId: string;
        data?: Record<string, any>;
    }): Promise<void>;
    getDashboard(orgId: string, start: Date, end: Date): Promise<{
        revenue: any;
        orderCount: number;
        avgOrderValue: number;
        uniqueVisitors: number;
        conversionRate: string;
        topProducts: {
            name: string;
            views: number;
            productId: string;
        }[];
    }>;
    private getTopProducts;
}
