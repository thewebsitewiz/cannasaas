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
exports.ComplianceController = void 0;
const common_1 = require("@nestjs/common");
const compliance_service_1 = require("./compliance.service");
const compliance_log_entity_1 = require("./entities/compliance-log.entity");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ComplianceController = class ComplianceController {
    constructor(complianceService) {
        this.complianceService = complianceService;
    }
    getComplianceLogs(dispensaryId, startDate, endDate, eventType) {
        return this.complianceService.getComplianceLogs(dispensaryId, new Date(startDate), new Date(endDate), eventType);
    }
    checkPurchaseLimit(req, dispensaryId, weight) {
        return this.complianceService.checkPurchaseLimit(dispensaryId, req.user.userId, parseFloat(weight));
    }
    generateDailyReport(body) {
        return this.complianceService.generateDailyReport(body.dispensaryId, body.date);
    }
    getSalesAnalytics(dispensaryId, startDate, endDate) {
        return this.complianceService.getSalesAnalytics(dispensaryId, startDate, endDate);
    }
    getTopProducts(dispensaryId, startDate, endDate, limit) {
        return this.complianceService.getTopProducts(dispensaryId, new Date(startDate), new Date(endDate), limit ? parseInt(limit) : 10);
    }
    getRevenueByPeriod(dispensaryId, period, startDate, endDate) {
        return this.complianceService.getRevenueByPeriod(dispensaryId, period, new Date(startDate), new Date(endDate));
    }
};
exports.ComplianceController = ComplianceController;
__decorate([
    (0, common_1.Get)('logs'),
    __param(0, (0, common_1.Query)('dispensaryId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('eventType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "getComplianceLogs", null);
__decorate([
    (0, common_1.Get)('purchase-limit'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('dispensaryId')),
    __param(2, (0, common_1.Query)('weight')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "checkPurchaseLimit", null);
__decorate([
    (0, common_1.Post)('reports/daily'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "generateDailyReport", null);
__decorate([
    (0, common_1.Get)('analytics/sales'),
    __param(0, (0, common_1.Query)('dispensaryId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "getSalesAnalytics", null);
__decorate([
    (0, common_1.Get)('analytics/top-products'),
    __param(0, (0, common_1.Query)('dispensaryId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "getTopProducts", null);
__decorate([
    (0, common_1.Get)('analytics/revenue'),
    __param(0, (0, common_1.Query)('dispensaryId')),
    __param(1, (0, common_1.Query)('period')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "getRevenueByPeriod", null);
exports.ComplianceController = ComplianceController = __decorate([
    (0, common_1.Controller)('compliance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [compliance_service_1.ComplianceService])
], ComplianceController);
//# sourceMappingURL=compliance.controller.js.map