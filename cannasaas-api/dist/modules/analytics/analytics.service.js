"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = exports.EventType = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cache_manager_1 = require("@nestjs/cache-manager");
const analytics_event_entity_1 = require("./entities/analytics-event.entity");
var EventType;
(function (EventType) {
    EventType["PAGE_VIEW"] = "page_view";
    EventType["PRODUCT_VIEW"] = "product_view";
    EventType["ADD_TO_CART"] = "add_to_cart";
    EventType["REMOVE_FROM_CART"] = "remove_from_cart";
    EventType["BEGIN_CHECKOUT"] = "begin_checkout";
    EventType["PURCHASE"] = "purchase";
    EventType["REFUND"] = "refund";
    EventType["SIGN_UP"] = "sign_up";
    EventType["LOGIN"] = "login";
    EventType["SEARCH"] = "search";
    EventType["REVIEW_SUBMITTED"] = "review_submitted";
    EventType["WISHLIST_ADD"] = "wishlist_add";
    EventType["SHARE"] = "share";
})(EventType || (exports.EventType = EventType = {}));
let AnalyticsService = class AnalyticsService {
    constructor(eventRepo, cache) {
        this.eventRepo = eventRepo;
        this.cache = cache;
    }
    async trackEvent(event) {
        const entity = this.eventRepo.create({ ...event, timestamp: new Date() });
        await this.eventRepo.save(entity);
        const dateKey = new Date().toISOString().slice(0, 10);
        const prefix = `analytics:${event.organizationId}:${dateKey}`;
        const countKey = `${prefix}:${event.eventType}`;
        const current = (await this.cache.get(countKey)) || 0;
        await this.cache.set(countKey, current + 1, 86400);
        if (event.eventType === EventType.PURCHASE && event.data?.total) {
            const revKey = `${prefix}:revenue`;
            const rev = (await this.cache.get(revKey)) || 0;
            await this.cache.set(revKey, rev + event.data.total, 86400);
        }
    }
    async getDashboard(orgId, start, end) {
        const events = await this.eventRepo.find({
            where: { organizationId: orgId, timestamp: (0, typeorm_2.Between)(start, end) },
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
    getTopProducts(events) {
        const views = events.filter(e => e.eventType === EventType.PRODUCT_VIEW);
        const counts = {};
        views.forEach(e => {
            const id = e.data?.productId;
            if (!id)
                return;
            if (!counts[id])
                counts[id] = { name: e.data?.productName || id, views: 0 };
            counts[id].views++;
        });
        return Object.entries(counts)
            .sort(([, a], [, b]) => b.views - a.views).slice(0, 10)
            .map(([id, d]) => ({ productId: id, ...d }));
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(analytics_event_entity_1.AnalyticsEvent)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map