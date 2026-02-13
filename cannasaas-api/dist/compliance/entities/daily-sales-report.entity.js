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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailySalesReport = void 0;
const typeorm_1 = require("typeorm");
const dispensary_entity_1 = require("../../dispensaries/entities/dispensary.entity");
let DailySalesReport = class DailySalesReport {
};
exports.DailySalesReport = DailySalesReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DailySalesReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dispensary_id', type: 'uuid' }),
    __metadata("design:type", String)
], DailySalesReport.prototype, "dispensaryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_date', type: 'date' }),
    __metadata("design:type", String)
], DailySalesReport.prototype, "reportDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_orders', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DailySalesReport.prototype, "totalOrders", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'total_revenue',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], DailySalesReport.prototype, "totalRevenue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'total_tax',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], DailySalesReport.prototype, "totalTax", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'total_excise_tax',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], DailySalesReport.prototype, "totalExciseTax", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_items_sold', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DailySalesReport.prototype, "totalItemsSold", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'average_order_value',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], DailySalesReport.prototype, "averageOrderValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unique_customers', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DailySalesReport.prototype, "uniqueCustomers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sales_by_type', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], DailySalesReport.prototype, "salesByType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sales_by_category', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], DailySalesReport.prototype, "salesByCategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancelled_orders', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DailySalesReport.prototype, "cancelledOrders", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'refunded_amount',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], DailySalesReport.prototype, "refundedAmount", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dispensary_entity_1.Dispensary),
    (0, typeorm_1.JoinColumn)({ name: 'dispensary_id' }),
    __metadata("design:type", dispensary_entity_1.Dispensary)
], DailySalesReport.prototype, "dispensary", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DailySalesReport.prototype, "createdAt", void 0);
exports.DailySalesReport = DailySalesReport = __decorate([
    (0, typeorm_1.Entity)('daily_sales_reports'),
    (0, typeorm_1.Index)(['dispensaryId', 'reportDate'], { unique: true })
], DailySalesReport);
//# sourceMappingURL=daily-sales-report.entity.js.map