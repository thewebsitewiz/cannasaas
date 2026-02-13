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
exports.AdvancedAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../orders/entities/order.entity");
const analytics_event_entity_1 = require("./entities/analytics-event.entity");
let AdvancedAnalyticsService = class AdvancedAnalyticsService {
    constructor(orderRepo, eventRepo) {
        this.orderRepo = orderRepo;
        this.eventRepo = eventRepo;
    }
    async getRevenueTrends(orgId, days = 30) {
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
    async getCohortAnalysis(orgId) {
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
    async getConversionFunnel(orgId, days = 7) {
        const events = await this.eventRepo.query(`
      SELECT event_type, COUNT(DISTINCT session_id) as unique_sessions
      FROM analytics_events
      WHERE organization_id = $1
        AND timestamp >= NOW() - INTERVAL '${days} days'
        AND event_type IN ('page_view','product_view','add_to_cart',
          'begin_checkout','purchase')
      GROUP BY event_type
    `, [orgId]);
        const funnel = ['page_view', 'product_view', 'add_to_cart', 'begin_checkout', 'purchase'];
        return funnel.map(step => {
            const data = events.find((e) => e.event_type === step);
            return { step, sessions: parseInt(data?.unique_sessions || '0') };
        });
    }
};
exports.AdvancedAnalyticsService = AdvancedAnalyticsService;
exports.AdvancedAnalyticsService = AdvancedAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(analytics_event_entity_1.AnalyticsEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AdvancedAnalyticsService);
//# sourceMappingURL=advanced-analytics.service.js.map