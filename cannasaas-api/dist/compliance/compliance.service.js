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
exports.ComplianceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const compliance_log_entity_1 = require("./entities/compliance-log.entity");
const daily_sales_report_entity_1 = require("./entities/daily-sales-report.entity");
const order_entity_1 = require("../orders/entities/order.entity");
let ComplianceService = class ComplianceService {
    constructor(complianceLogRepository, dailyReportRepository, orderRepository) {
        this.complianceLogRepository = complianceLogRepository;
        this.dailyReportRepository = dailyReportRepository;
        this.orderRepository = orderRepository;
    }
    async logEvent(dispensaryId, eventType, details, performedBy, orderId) {
        const log = this.complianceLogRepository.create({
            dispensaryId,
            eventType,
            details,
            performedBy,
            orderId,
        });
        return this.complianceLogRepository.save(log);
    }
    async logSale(order, performedBy) {
        return this.logEvent(order.dispensaryId, compliance_log_entity_1.ComplianceEventType.SALE, {
            orderId: order.id,
            orderNumber: order.orderNumber,
            items: order.items.map((item) => ({
                productName: item.productName,
                variantName: item.variantName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.lineTotal,
                batchNumber: item.batchNumber,
                licenseNumber: item.licenseNumber,
            })),
            subtotal: order.subtotal,
            taxAmount: order.taxAmount,
            exciseTax: order.exciseTax,
            total: order.total,
        }, performedBy, order.id);
    }
    async getComplianceLogs(dispensaryId, startDate, endDate, eventType) {
        const where = {
            dispensaryId,
            createdAt: (0, typeorm_2.Between)(startDate, endDate),
        };
        if (eventType)
            where.eventType = eventType;
        return this.complianceLogRepository.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }
    async checkPurchaseLimit(dispensaryId, userId, requestedWeight) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todaysOrders = await this.orderRepository.find({
            where: {
                dispensaryId,
                userId,
                createdAt: (0, typeorm_2.Between)(today, tomorrow),
            },
            relations: ['items'],
        });
        const dailyTotal = todaysOrders.reduce((total, order) => {
            return (total +
                order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0));
        }, 0);
        const limit = 85;
        const withinLimit = dailyTotal + requestedWeight <= limit;
        await this.logEvent(dispensaryId, compliance_log_entity_1.ComplianceEventType.PURCHASE_LIMIT_CHECK, { userId, dailyTotal, requestedWeight, withinLimit, limit }, userId);
        return { withinLimit, dailyTotal, limit };
    }
    async generateDailyReport(dispensaryId, date) {
        const startDate = new Date(`${date}T00:00:00Z`);
        const endDate = new Date(`${date}T23:59:59Z`);
        const orders = await this.orderRepository.find({
            where: {
                dispensaryId,
                createdAt: (0, typeorm_2.Between)(startDate, endDate),
            },
            relations: ['items'],
        });
        const completedOrders = orders.filter((o) => o.status === 'completed');
        const cancelledOrders = orders.filter((o) => o.status === 'cancelled');
        const refundedOrders = orders.filter((o) => o.status === 'refunded');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const totalTax = completedOrders.reduce((sum, o) => sum + Number(o.taxAmount), 0);
        const totalExciseTax = completedOrders.reduce((sum, o) => sum + Number(o.exciseTax), 0);
        const totalItemsSold = completedOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
        const uniqueCustomers = new Set(completedOrders.map((o) => o.userId)).size;
        const refundedAmount = refundedOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const report = this.dailyReportRepository.create({
            dispensaryId,
            reportDate: date,
            totalOrders: completedOrders.length,
            totalRevenue,
            totalTax,
            totalExciseTax,
            totalItemsSold,
            averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
            uniqueCustomers,
            cancelledOrders: cancelledOrders.length,
            refundedAmount,
        });
        return this.dailyReportRepository.save(report);
    }
    async getSalesAnalytics(dispensaryId, startDate, endDate) {
        return this.dailyReportRepository.find({
            where: {
                dispensaryId,
                reportDate: (0, typeorm_2.Between)(startDate, endDate),
            },
            order: { reportDate: 'ASC' },
        });
    }
    async getTopProducts(dispensaryId, startDate, endDate, limit = 10) {
        return this.orderRepository
            .createQueryBuilder('order')
            .select('item.product_name', 'productName')
            .addSelect('SUM(item.quantity)', 'totalQuantity')
            .addSelect('SUM(item.line_total)', 'totalRevenue')
            .innerJoin('order.items', 'item')
            .where('order.dispensaryId = :dispensaryId', { dispensaryId })
            .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .andWhere("order.status = 'completed'")
            .groupBy('item.product_name')
            .orderBy('"totalRevenue"', 'DESC')
            .limit(limit)
            .getRawMany();
    }
    async getRevenueByPeriod(dispensaryId, period, startDate, endDate) {
        const dateFormat = period === 'day'
            ? "TO_CHAR(order.created_at, 'YYYY-MM-DD')"
            : period === 'week'
                ? "TO_CHAR(DATE_TRUNC('week', order.created_at), 'YYYY-MM-DD')"
                : "TO_CHAR(DATE_TRUNC('month', order.created_at), 'YYYY-MM')";
        return this.orderRepository
            .createQueryBuilder('order')
            .select(dateFormat, 'period')
            .addSelect('COUNT(*)', 'orderCount')
            .addSelect('SUM(order.total)', 'totalRevenue')
            .addSelect('SUM(order.tax_amount)', 'totalTax')
            .addSelect('SUM(order.excise_tax)', 'totalExciseTax')
            .where('order.dispensaryId = :dispensaryId', { dispensaryId })
            .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .andWhere("order.status = 'completed'")
            .groupBy('period')
            .orderBy('period', 'ASC')
            .getRawMany();
    }
};
exports.ComplianceService = ComplianceService;
exports.ComplianceService = ComplianceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(compliance_log_entity_1.ComplianceLog)),
    __param(1, (0, typeorm_1.InjectRepository)(daily_sales_report_entity_1.DailySalesReport)),
    __param(2, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ComplianceService);
//# sourceMappingURL=compliance.service.js.map