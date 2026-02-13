"use strict";
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("typeorm");
var compliance_log_entity_1 = require("./entities/compliance-log.entity");
var ComplianceService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ComplianceService = _classThis = /** @class */ (function () {
        function ComplianceService_1(complianceLogRepository, dailyReportRepository, orderRepository) {
            this.complianceLogRepository = complianceLogRepository;
            this.dailyReportRepository = dailyReportRepository;
            this.orderRepository = orderRepository;
        }
        // --- Compliance Logging ---
        ComplianceService_1.prototype.logEvent = function (dispensaryId, eventType, details, performedBy, orderId) {
            return __awaiter(this, void 0, void 0, function () {
                var log;
                return __generator(this, function (_a) {
                    log = this.complianceLogRepository.create({
                        dispensaryId: dispensaryId,
                        eventType: eventType,
                        details: details,
                        performedBy: performedBy,
                        orderId: orderId,
                    });
                    return [2 /*return*/, this.complianceLogRepository.save(log)];
                });
            });
        };
        ComplianceService_1.prototype.logSale = function (order, performedBy) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.logEvent(order.dispensaryId, compliance_log_entity_1.ComplianceEventType.SALE, {
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            items: order.items.map(function (item) { return ({
                                productName: item.productName,
                                variantName: item.variantName,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                lineTotal: item.lineTotal,
                                batchNumber: item.batchNumber,
                                licenseNumber: item.licenseNumber,
                            }); }),
                            subtotal: order.subtotal,
                            taxAmount: order.taxAmount,
                            exciseTax: order.exciseTax,
                            total: order.total,
                        }, performedBy, order.id)];
                });
            });
        };
        ComplianceService_1.prototype.getComplianceLogs = function (dispensaryId, startDate, endDate, eventType) {
            return __awaiter(this, void 0, void 0, function () {
                var where;
                return __generator(this, function (_a) {
                    where = {
                        dispensaryId: dispensaryId,
                        createdAt: (0, typeorm_1.Between)(startDate, endDate),
                    };
                    if (eventType)
                        where.eventType = eventType;
                    return [2 /*return*/, this.complianceLogRepository.find({
                            where: where,
                            order: { createdAt: 'DESC' },
                        })];
                });
            });
        };
        // --- Purchase Limit Checking ---
        // NY/NJ/CT have daily purchase limits for cannabis
        ComplianceService_1.prototype.checkPurchaseLimit = function (dispensaryId, userId, requestedWeight) {
            return __awaiter(this, void 0, void 0, function () {
                var today, tomorrow, todaysOrders, dailyTotal, limit, withinLimit;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            today = new Date();
                            today.setHours(0, 0, 0, 0);
                            tomorrow = new Date(today);
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            return [4 /*yield*/, this.orderRepository.find({
                                    where: {
                                        dispensaryId: dispensaryId,
                                        userId: userId,
                                        createdAt: (0, typeorm_1.Between)(today, tomorrow),
                                    },
                                    relations: ['items'],
                                })];
                        case 1:
                            todaysOrders = _a.sent();
                            dailyTotal = todaysOrders.reduce(function (total, order) {
                                return (total +
                                    order.items.reduce(function (itemTotal, item) { return itemTotal + item.quantity; }, 0));
                            }, 0);
                            limit = 85;
                            withinLimit = dailyTotal + requestedWeight <= limit;
                            // Log the check
                            return [4 /*yield*/, this.logEvent(dispensaryId, compliance_log_entity_1.ComplianceEventType.PURCHASE_LIMIT_CHECK, { userId: userId, dailyTotal: dailyTotal, requestedWeight: requestedWeight, withinLimit: withinLimit, limit: limit }, userId)];
                        case 2:
                            // Log the check
                            _a.sent();
                            return [2 /*return*/, { withinLimit: withinLimit, dailyTotal: dailyTotal, limit: limit }];
                    }
                });
            });
        };
        // --- Daily Sales Report Generation ---
        ComplianceService_1.prototype.generateDailyReport = function (dispensaryId, date) {
            return __awaiter(this, void 0, void 0, function () {
                var startDate, endDate, orders, completedOrders, cancelledOrders, refundedOrders, totalRevenue, totalTax, totalExciseTax, totalItemsSold, uniqueCustomers, refundedAmount, report;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            startDate = new Date("".concat(date, "T00:00:00Z"));
                            endDate = new Date("".concat(date, "T23:59:59Z"));
                            return [4 /*yield*/, this.orderRepository.find({
                                    where: {
                                        dispensaryId: dispensaryId,
                                        createdAt: (0, typeorm_1.Between)(startDate, endDate),
                                    },
                                    relations: ['items'],
                                })];
                        case 1:
                            orders = _a.sent();
                            completedOrders = orders.filter(function (o) { return o.status === 'completed'; });
                            cancelledOrders = orders.filter(function (o) { return o.status === 'cancelled'; });
                            refundedOrders = orders.filter(function (o) { return o.status === 'refunded'; });
                            totalRevenue = completedOrders.reduce(function (sum, o) { return sum + Number(o.total); }, 0);
                            totalTax = completedOrders.reduce(function (sum, o) { return sum + Number(o.taxAmount); }, 0);
                            totalExciseTax = completedOrders.reduce(function (sum, o) { return sum + Number(o.exciseTax); }, 0);
                            totalItemsSold = completedOrders.reduce(function (sum, o) { return sum + o.items.reduce(function (s, i) { return s + i.quantity; }, 0); }, 0);
                            uniqueCustomers = new Set(completedOrders.map(function (o) { return o.userId; })).size;
                            refundedAmount = refundedOrders.reduce(function (sum, o) { return sum + Number(o.total); }, 0);
                            report = this.dailyReportRepository.create({
                                dispensaryId: dispensaryId,
                                reportDate: date,
                                totalOrders: completedOrders.length,
                                totalRevenue: totalRevenue,
                                totalTax: totalTax,
                                totalExciseTax: totalExciseTax,
                                totalItemsSold: totalItemsSold,
                                averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
                                uniqueCustomers: uniqueCustomers,
                                cancelledOrders: cancelledOrders.length,
                                refundedAmount: refundedAmount,
                            });
                            return [2 /*return*/, this.dailyReportRepository.save(report)];
                    }
                });
            });
        };
        // --- Analytics Queries ---
        ComplianceService_1.prototype.getSalesAnalytics = function (dispensaryId, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.dailyReportRepository.find({
                            where: {
                                dispensaryId: dispensaryId,
                                reportDate: (0, typeorm_1.Between)(startDate, endDate),
                            },
                            order: { reportDate: 'ASC' },
                        })];
                });
            });
        };
        ComplianceService_1.prototype.getTopProducts = function (dispensaryId_1, startDate_1, endDate_1) {
            return __awaiter(this, arguments, void 0, function (dispensaryId, startDate, endDate, limit) {
                if (limit === void 0) { limit = 10; }
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.orderRepository
                            .createQueryBuilder('order')
                            .select('item.product_name', 'productName')
                            .addSelect('SUM(item.quantity)', 'totalQuantity')
                            .addSelect('SUM(item.line_total)', 'totalRevenue')
                            .innerJoin('order.items', 'item')
                            .where('order.dispensaryId = :dispensaryId', { dispensaryId: dispensaryId })
                            .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
                            startDate: startDate,
                            endDate: endDate,
                        })
                            .andWhere("order.status = 'completed'")
                            .groupBy('item.product_name')
                            .orderBy('"totalRevenue"', 'DESC')
                            .limit(limit)
                            .getRawMany()];
                });
            });
        };
        ComplianceService_1.prototype.getRevenueByPeriod = function (dispensaryId, period, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function () {
                var dateFormat;
                return __generator(this, function (_a) {
                    dateFormat = period === 'day'
                        ? "TO_CHAR(order.created_at, 'YYYY-MM-DD')"
                        : period === 'week'
                            ? "TO_CHAR(DATE_TRUNC('week', order.created_at), 'YYYY-MM-DD')"
                            : "TO_CHAR(DATE_TRUNC('month', order.created_at), 'YYYY-MM')";
                    return [2 /*return*/, this.orderRepository
                            .createQueryBuilder('order')
                            .select(dateFormat, 'period')
                            .addSelect('COUNT(*)', 'orderCount')
                            .addSelect('SUM(order.total)', 'totalRevenue')
                            .addSelect('SUM(order.tax_amount)', 'totalTax')
                            .addSelect('SUM(order.excise_tax)', 'totalExciseTax')
                            .where('order.dispensaryId = :dispensaryId', { dispensaryId: dispensaryId })
                            .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
                            startDate: startDate,
                            endDate: endDate,
                        })
                            .andWhere("order.status = 'completed'")
                            .groupBy('period')
                            .orderBy('period', 'ASC')
                            .getRawMany()];
                });
            });
        };
        return ComplianceService_1;
    }());
    __setFunctionName(_classThis, "ComplianceService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ComplianceService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ComplianceService = _classThis;
}();
exports.ComplianceService = ComplianceService;
