"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceController = void 0;
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var ComplianceController = function () {
    var _classDecorators = [(0, common_1.Controller)('compliance'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getComplianceLogs_decorators;
    var _checkPurchaseLimit_decorators;
    var _generateDailyReport_decorators;
    var _getSalesAnalytics_decorators;
    var _getTopProducts_decorators;
    var _getRevenueByPeriod_decorators;
    var ComplianceController = _classThis = /** @class */ (function () {
        function ComplianceController_1(complianceService) {
            this.complianceService = (__runInitializers(this, _instanceExtraInitializers), complianceService);
        }
        ComplianceController_1.prototype.getComplianceLogs = function (dispensaryId, startDate, endDate, eventType) {
            return this.complianceService.getComplianceLogs(dispensaryId, new Date(startDate), new Date(endDate), eventType);
        };
        ComplianceController_1.prototype.checkPurchaseLimit = function (req, dispensaryId, weight) {
            return this.complianceService.checkPurchaseLimit(dispensaryId, req.user.userId, parseFloat(weight));
        };
        ComplianceController_1.prototype.generateDailyReport = function (body) {
            return this.complianceService.generateDailyReport(body.dispensaryId, body.date);
        };
        ComplianceController_1.prototype.getSalesAnalytics = function (dispensaryId, startDate, endDate) {
            return this.complianceService.getSalesAnalytics(dispensaryId, startDate, endDate);
        };
        ComplianceController_1.prototype.getTopProducts = function (dispensaryId, startDate, endDate, limit) {
            return this.complianceService.getTopProducts(dispensaryId, new Date(startDate), new Date(endDate), limit ? parseInt(limit) : 10);
        };
        ComplianceController_1.prototype.getRevenueByPeriod = function (dispensaryId, period, startDate, endDate) {
            return this.complianceService.getRevenueByPeriod(dispensaryId, period, new Date(startDate), new Date(endDate));
        };
        return ComplianceController_1;
    }());
    __setFunctionName(_classThis, "ComplianceController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getComplianceLogs_decorators = [(0, common_1.Get)('logs')];
        _checkPurchaseLimit_decorators = [(0, common_1.Get)('purchase-limit')];
        _generateDailyReport_decorators = [(0, common_1.Post)('reports/daily')];
        _getSalesAnalytics_decorators = [(0, common_1.Get)('analytics/sales')];
        _getTopProducts_decorators = [(0, common_1.Get)('analytics/top-products')];
        _getRevenueByPeriod_decorators = [(0, common_1.Get)('analytics/revenue')];
        __esDecorate(_classThis, null, _getComplianceLogs_decorators, { kind: "method", name: "getComplianceLogs", static: false, private: false, access: { has: function (obj) { return "getComplianceLogs" in obj; }, get: function (obj) { return obj.getComplianceLogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _checkPurchaseLimit_decorators, { kind: "method", name: "checkPurchaseLimit", static: false, private: false, access: { has: function (obj) { return "checkPurchaseLimit" in obj; }, get: function (obj) { return obj.checkPurchaseLimit; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateDailyReport_decorators, { kind: "method", name: "generateDailyReport", static: false, private: false, access: { has: function (obj) { return "generateDailyReport" in obj; }, get: function (obj) { return obj.generateDailyReport; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSalesAnalytics_decorators, { kind: "method", name: "getSalesAnalytics", static: false, private: false, access: { has: function (obj) { return "getSalesAnalytics" in obj; }, get: function (obj) { return obj.getSalesAnalytics; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTopProducts_decorators, { kind: "method", name: "getTopProducts", static: false, private: false, access: { has: function (obj) { return "getTopProducts" in obj; }, get: function (obj) { return obj.getTopProducts; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRevenueByPeriod_decorators, { kind: "method", name: "getRevenueByPeriod", static: false, private: false, access: { has: function (obj) { return "getRevenueByPeriod" in obj; }, get: function (obj) { return obj.getRevenueByPeriod; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ComplianceController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ComplianceController = _classThis;
}();
exports.ComplianceController = ComplianceController;
