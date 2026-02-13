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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailySalesReport = void 0;
var typeorm_1 = require("typeorm");
var dispensary_entity_1 = require("../../dispensaries/entities/dispensary.entity");
var DailySalesReport = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('daily_sales_reports'), (0, typeorm_1.Index)(['dispensaryId', 'reportDate'], { unique: true })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _dispensaryId_decorators;
    var _dispensaryId_initializers = [];
    var _dispensaryId_extraInitializers = [];
    var _reportDate_decorators;
    var _reportDate_initializers = [];
    var _reportDate_extraInitializers = [];
    var _totalOrders_decorators;
    var _totalOrders_initializers = [];
    var _totalOrders_extraInitializers = [];
    var _totalRevenue_decorators;
    var _totalRevenue_initializers = [];
    var _totalRevenue_extraInitializers = [];
    var _totalTax_decorators;
    var _totalTax_initializers = [];
    var _totalTax_extraInitializers = [];
    var _totalExciseTax_decorators;
    var _totalExciseTax_initializers = [];
    var _totalExciseTax_extraInitializers = [];
    var _totalItemsSold_decorators;
    var _totalItemsSold_initializers = [];
    var _totalItemsSold_extraInitializers = [];
    var _averageOrderValue_decorators;
    var _averageOrderValue_initializers = [];
    var _averageOrderValue_extraInitializers = [];
    var _uniqueCustomers_decorators;
    var _uniqueCustomers_initializers = [];
    var _uniqueCustomers_extraInitializers = [];
    var _salesByType_decorators;
    var _salesByType_initializers = [];
    var _salesByType_extraInitializers = [];
    var _salesByCategory_decorators;
    var _salesByCategory_initializers = [];
    var _salesByCategory_extraInitializers = [];
    var _cancelledOrders_decorators;
    var _cancelledOrders_initializers = [];
    var _cancelledOrders_extraInitializers = [];
    var _refundedAmount_decorators;
    var _refundedAmount_initializers = [];
    var _refundedAmount_extraInitializers = [];
    var _dispensary_decorators;
    var _dispensary_initializers = [];
    var _dispensary_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var DailySalesReport = _classThis = /** @class */ (function () {
        function DailySalesReport_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.dispensaryId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _dispensaryId_initializers, void 0));
            this.reportDate = (__runInitializers(this, _dispensaryId_extraInitializers), __runInitializers(this, _reportDate_initializers, void 0)); // YYYY-MM-DD
            this.totalOrders = (__runInitializers(this, _reportDate_extraInitializers), __runInitializers(this, _totalOrders_initializers, void 0));
            this.totalRevenue = (__runInitializers(this, _totalOrders_extraInitializers), __runInitializers(this, _totalRevenue_initializers, void 0));
            this.totalTax = (__runInitializers(this, _totalRevenue_extraInitializers), __runInitializers(this, _totalTax_initializers, void 0));
            this.totalExciseTax = (__runInitializers(this, _totalTax_extraInitializers), __runInitializers(this, _totalExciseTax_initializers, void 0));
            this.totalItemsSold = (__runInitializers(this, _totalExciseTax_extraInitializers), __runInitializers(this, _totalItemsSold_initializers, void 0));
            this.averageOrderValue = (__runInitializers(this, _totalItemsSold_extraInitializers), __runInitializers(this, _averageOrderValue_initializers, void 0));
            this.uniqueCustomers = (__runInitializers(this, _averageOrderValue_extraInitializers), __runInitializers(this, _uniqueCustomers_initializers, void 0));
            // Breakdown by product type (JSONB)
            this.salesByType = (__runInitializers(this, _uniqueCustomers_extraInitializers), __runInitializers(this, _salesByType_initializers, void 0));
            // Breakdown by category
            this.salesByCategory = (__runInitializers(this, _salesByType_extraInitializers), __runInitializers(this, _salesByCategory_initializers, void 0));
            this.cancelledOrders = (__runInitializers(this, _salesByCategory_extraInitializers), __runInitializers(this, _cancelledOrders_initializers, void 0));
            this.refundedAmount = (__runInitializers(this, _cancelledOrders_extraInitializers), __runInitializers(this, _refundedAmount_initializers, void 0));
            this.dispensary = (__runInitializers(this, _refundedAmount_extraInitializers), __runInitializers(this, _dispensary_initializers, void 0));
            this.createdAt = (__runInitializers(this, _dispensary_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            __runInitializers(this, _createdAt_extraInitializers);
        }
        return DailySalesReport_1;
    }());
    __setFunctionName(_classThis, "DailySalesReport");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _dispensaryId_decorators = [(0, typeorm_1.Column)({ name: 'dispensary_id', type: 'uuid' })];
        _reportDate_decorators = [(0, typeorm_1.Column)({ name: 'report_date', type: 'date' })];
        _totalOrders_decorators = [(0, typeorm_1.Column)({ name: 'total_orders', type: 'int', default: 0 })];
        _totalRevenue_decorators = [(0, typeorm_1.Column)({
                name: 'total_revenue',
                type: 'decimal',
                precision: 12,
                scale: 2,
                default: 0,
            })];
        _totalTax_decorators = [(0, typeorm_1.Column)({
                name: 'total_tax',
                type: 'decimal',
                precision: 12,
                scale: 2,
                default: 0,
            })];
        _totalExciseTax_decorators = [(0, typeorm_1.Column)({
                name: 'total_excise_tax',
                type: 'decimal',
                precision: 12,
                scale: 2,
                default: 0,
            })];
        _totalItemsSold_decorators = [(0, typeorm_1.Column)({ name: 'total_items_sold', type: 'int', default: 0 })];
        _averageOrderValue_decorators = [(0, typeorm_1.Column)({
                name: 'average_order_value',
                type: 'decimal',
                precision: 10,
                scale: 2,
                default: 0,
            })];
        _uniqueCustomers_decorators = [(0, typeorm_1.Column)({ name: 'unique_customers', type: 'int', default: 0 })];
        _salesByType_decorators = [(0, typeorm_1.Column)({ name: 'sales_by_type', type: 'jsonb', nullable: true })];
        _salesByCategory_decorators = [(0, typeorm_1.Column)({ name: 'sales_by_category', type: 'jsonb', nullable: true })];
        _cancelledOrders_decorators = [(0, typeorm_1.Column)({ name: 'cancelled_orders', type: 'int', default: 0 })];
        _refundedAmount_decorators = [(0, typeorm_1.Column)({
                name: 'refunded_amount',
                type: 'decimal',
                precision: 12,
                scale: 2,
                default: 0,
            })];
        _dispensary_decorators = [(0, typeorm_1.ManyToOne)(function () { return dispensary_entity_1.Dispensary; }), (0, typeorm_1.JoinColumn)({ name: 'dispensary_id' })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _dispensaryId_decorators, { kind: "field", name: "dispensaryId", static: false, private: false, access: { has: function (obj) { return "dispensaryId" in obj; }, get: function (obj) { return obj.dispensaryId; }, set: function (obj, value) { obj.dispensaryId = value; } }, metadata: _metadata }, _dispensaryId_initializers, _dispensaryId_extraInitializers);
        __esDecorate(null, null, _reportDate_decorators, { kind: "field", name: "reportDate", static: false, private: false, access: { has: function (obj) { return "reportDate" in obj; }, get: function (obj) { return obj.reportDate; }, set: function (obj, value) { obj.reportDate = value; } }, metadata: _metadata }, _reportDate_initializers, _reportDate_extraInitializers);
        __esDecorate(null, null, _totalOrders_decorators, { kind: "field", name: "totalOrders", static: false, private: false, access: { has: function (obj) { return "totalOrders" in obj; }, get: function (obj) { return obj.totalOrders; }, set: function (obj, value) { obj.totalOrders = value; } }, metadata: _metadata }, _totalOrders_initializers, _totalOrders_extraInitializers);
        __esDecorate(null, null, _totalRevenue_decorators, { kind: "field", name: "totalRevenue", static: false, private: false, access: { has: function (obj) { return "totalRevenue" in obj; }, get: function (obj) { return obj.totalRevenue; }, set: function (obj, value) { obj.totalRevenue = value; } }, metadata: _metadata }, _totalRevenue_initializers, _totalRevenue_extraInitializers);
        __esDecorate(null, null, _totalTax_decorators, { kind: "field", name: "totalTax", static: false, private: false, access: { has: function (obj) { return "totalTax" in obj; }, get: function (obj) { return obj.totalTax; }, set: function (obj, value) { obj.totalTax = value; } }, metadata: _metadata }, _totalTax_initializers, _totalTax_extraInitializers);
        __esDecorate(null, null, _totalExciseTax_decorators, { kind: "field", name: "totalExciseTax", static: false, private: false, access: { has: function (obj) { return "totalExciseTax" in obj; }, get: function (obj) { return obj.totalExciseTax; }, set: function (obj, value) { obj.totalExciseTax = value; } }, metadata: _metadata }, _totalExciseTax_initializers, _totalExciseTax_extraInitializers);
        __esDecorate(null, null, _totalItemsSold_decorators, { kind: "field", name: "totalItemsSold", static: false, private: false, access: { has: function (obj) { return "totalItemsSold" in obj; }, get: function (obj) { return obj.totalItemsSold; }, set: function (obj, value) { obj.totalItemsSold = value; } }, metadata: _metadata }, _totalItemsSold_initializers, _totalItemsSold_extraInitializers);
        __esDecorate(null, null, _averageOrderValue_decorators, { kind: "field", name: "averageOrderValue", static: false, private: false, access: { has: function (obj) { return "averageOrderValue" in obj; }, get: function (obj) { return obj.averageOrderValue; }, set: function (obj, value) { obj.averageOrderValue = value; } }, metadata: _metadata }, _averageOrderValue_initializers, _averageOrderValue_extraInitializers);
        __esDecorate(null, null, _uniqueCustomers_decorators, { kind: "field", name: "uniqueCustomers", static: false, private: false, access: { has: function (obj) { return "uniqueCustomers" in obj; }, get: function (obj) { return obj.uniqueCustomers; }, set: function (obj, value) { obj.uniqueCustomers = value; } }, metadata: _metadata }, _uniqueCustomers_initializers, _uniqueCustomers_extraInitializers);
        __esDecorate(null, null, _salesByType_decorators, { kind: "field", name: "salesByType", static: false, private: false, access: { has: function (obj) { return "salesByType" in obj; }, get: function (obj) { return obj.salesByType; }, set: function (obj, value) { obj.salesByType = value; } }, metadata: _metadata }, _salesByType_initializers, _salesByType_extraInitializers);
        __esDecorate(null, null, _salesByCategory_decorators, { kind: "field", name: "salesByCategory", static: false, private: false, access: { has: function (obj) { return "salesByCategory" in obj; }, get: function (obj) { return obj.salesByCategory; }, set: function (obj, value) { obj.salesByCategory = value; } }, metadata: _metadata }, _salesByCategory_initializers, _salesByCategory_extraInitializers);
        __esDecorate(null, null, _cancelledOrders_decorators, { kind: "field", name: "cancelledOrders", static: false, private: false, access: { has: function (obj) { return "cancelledOrders" in obj; }, get: function (obj) { return obj.cancelledOrders; }, set: function (obj, value) { obj.cancelledOrders = value; } }, metadata: _metadata }, _cancelledOrders_initializers, _cancelledOrders_extraInitializers);
        __esDecorate(null, null, _refundedAmount_decorators, { kind: "field", name: "refundedAmount", static: false, private: false, access: { has: function (obj) { return "refundedAmount" in obj; }, get: function (obj) { return obj.refundedAmount; }, set: function (obj, value) { obj.refundedAmount = value; } }, metadata: _metadata }, _refundedAmount_initializers, _refundedAmount_extraInitializers);
        __esDecorate(null, null, _dispensary_decorators, { kind: "field", name: "dispensary", static: false, private: false, access: { has: function (obj) { return "dispensary" in obj; }, get: function (obj) { return obj.dispensary; }, set: function (obj, value) { obj.dispensary = value; } }, metadata: _metadata }, _dispensary_initializers, _dispensary_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DailySalesReport = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DailySalesReport = _classThis;
}();
exports.DailySalesReport = DailySalesReport;
