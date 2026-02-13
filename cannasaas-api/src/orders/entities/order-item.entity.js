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
exports.OrderItem = void 0;
var typeorm_1 = require("typeorm");
var order_entity_1 = require("./order.entity");
var OrderItem = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('order_items')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _orderId_decorators;
    var _orderId_initializers = [];
    var _orderId_extraInitializers = [];
    var _productId_decorators;
    var _productId_initializers = [];
    var _productId_extraInitializers = [];
    var _variantId_decorators;
    var _variantId_initializers = [];
    var _variantId_extraInitializers = [];
    var _productName_decorators;
    var _productName_initializers = [];
    var _productName_extraInitializers = [];
    var _variantName_decorators;
    var _variantName_initializers = [];
    var _variantName_extraInitializers = [];
    var _unitPrice_decorators;
    var _unitPrice_initializers = [];
    var _unitPrice_extraInitializers = [];
    var _quantity_decorators;
    var _quantity_initializers = [];
    var _quantity_extraInitializers = [];
    var _lineTotal_decorators;
    var _lineTotal_initializers = [];
    var _lineTotal_extraInitializers = [];
    var _batchNumber_decorators;
    var _batchNumber_initializers = [];
    var _batchNumber_extraInitializers = [];
    var _licenseNumber_decorators;
    var _licenseNumber_initializers = [];
    var _licenseNumber_extraInitializers = [];
    var _order_decorators;
    var _order_initializers = [];
    var _order_extraInitializers = [];
    var OrderItem = _classThis = /** @class */ (function () {
        function OrderItem_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.orderId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _orderId_initializers, void 0));
            this.productId = (__runInitializers(this, _orderId_extraInitializers), __runInitializers(this, _productId_initializers, void 0));
            this.variantId = (__runInitializers(this, _productId_extraInitializers), __runInitializers(this, _variantId_initializers, void 0));
            // Snapshot fields — these capture the state at time of order
            this.productName = (__runInitializers(this, _variantId_extraInitializers), __runInitializers(this, _productName_initializers, void 0));
            this.variantName = (__runInitializers(this, _productName_extraInitializers), __runInitializers(this, _variantName_initializers, void 0));
            this.unitPrice = (__runInitializers(this, _variantName_extraInitializers), __runInitializers(this, _unitPrice_initializers, void 0));
            this.quantity = (__runInitializers(this, _unitPrice_extraInitializers), __runInitializers(this, _quantity_initializers, void 0));
            this.lineTotal = (__runInitializers(this, _quantity_extraInitializers), __runInitializers(this, _lineTotal_initializers, void 0));
            // Cannabis compliance
            this.batchNumber = (__runInitializers(this, _lineTotal_extraInitializers), __runInitializers(this, _batchNumber_initializers, void 0));
            this.licenseNumber = (__runInitializers(this, _batchNumber_extraInitializers), __runInitializers(this, _licenseNumber_initializers, void 0));
            this.order = (__runInitializers(this, _licenseNumber_extraInitializers), __runInitializers(this, _order_initializers, void 0));
            __runInitializers(this, _order_extraInitializers);
        }
        return OrderItem_1;
    }());
    __setFunctionName(_classThis, "OrderItem");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _orderId_decorators = [(0, typeorm_1.Column)({ name: 'order_id', type: 'uuid' })];
        _productId_decorators = [(0, typeorm_1.Column)({ name: 'product_id', type: 'uuid' })];
        _variantId_decorators = [(0, typeorm_1.Column)({ name: 'variant_id', type: 'uuid' })];
        _productName_decorators = [(0, typeorm_1.Column)({ name: 'product_name', length: 255 })];
        _variantName_decorators = [(0, typeorm_1.Column)({ name: 'variant_name', length: 100 })];
        _unitPrice_decorators = [(0, typeorm_1.Column)({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })];
        _quantity_decorators = [(0, typeorm_1.Column)({ type: 'int' })];
        _lineTotal_decorators = [(0, typeorm_1.Column)({ name: 'line_total', type: 'decimal', precision: 10, scale: 2 })];
        _batchNumber_decorators = [(0, typeorm_1.Column)({ name: 'batch_number', length: 100, nullable: true })];
        _licenseNumber_decorators = [(0, typeorm_1.Column)({ name: 'license_number', length: 100, nullable: true })];
        _order_decorators = [(0, typeorm_1.ManyToOne)(function () { return order_entity_1.Order; }, function (order) { return order.items; }, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'order_id' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _orderId_decorators, { kind: "field", name: "orderId", static: false, private: false, access: { has: function (obj) { return "orderId" in obj; }, get: function (obj) { return obj.orderId; }, set: function (obj, value) { obj.orderId = value; } }, metadata: _metadata }, _orderId_initializers, _orderId_extraInitializers);
        __esDecorate(null, null, _productId_decorators, { kind: "field", name: "productId", static: false, private: false, access: { has: function (obj) { return "productId" in obj; }, get: function (obj) { return obj.productId; }, set: function (obj, value) { obj.productId = value; } }, metadata: _metadata }, _productId_initializers, _productId_extraInitializers);
        __esDecorate(null, null, _variantId_decorators, { kind: "field", name: "variantId", static: false, private: false, access: { has: function (obj) { return "variantId" in obj; }, get: function (obj) { return obj.variantId; }, set: function (obj, value) { obj.variantId = value; } }, metadata: _metadata }, _variantId_initializers, _variantId_extraInitializers);
        __esDecorate(null, null, _productName_decorators, { kind: "field", name: "productName", static: false, private: false, access: { has: function (obj) { return "productName" in obj; }, get: function (obj) { return obj.productName; }, set: function (obj, value) { obj.productName = value; } }, metadata: _metadata }, _productName_initializers, _productName_extraInitializers);
        __esDecorate(null, null, _variantName_decorators, { kind: "field", name: "variantName", static: false, private: false, access: { has: function (obj) { return "variantName" in obj; }, get: function (obj) { return obj.variantName; }, set: function (obj, value) { obj.variantName = value; } }, metadata: _metadata }, _variantName_initializers, _variantName_extraInitializers);
        __esDecorate(null, null, _unitPrice_decorators, { kind: "field", name: "unitPrice", static: false, private: false, access: { has: function (obj) { return "unitPrice" in obj; }, get: function (obj) { return obj.unitPrice; }, set: function (obj, value) { obj.unitPrice = value; } }, metadata: _metadata }, _unitPrice_initializers, _unitPrice_extraInitializers);
        __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: function (obj) { return "quantity" in obj; }, get: function (obj) { return obj.quantity; }, set: function (obj, value) { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
        __esDecorate(null, null, _lineTotal_decorators, { kind: "field", name: "lineTotal", static: false, private: false, access: { has: function (obj) { return "lineTotal" in obj; }, get: function (obj) { return obj.lineTotal; }, set: function (obj, value) { obj.lineTotal = value; } }, metadata: _metadata }, _lineTotal_initializers, _lineTotal_extraInitializers);
        __esDecorate(null, null, _batchNumber_decorators, { kind: "field", name: "batchNumber", static: false, private: false, access: { has: function (obj) { return "batchNumber" in obj; }, get: function (obj) { return obj.batchNumber; }, set: function (obj, value) { obj.batchNumber = value; } }, metadata: _metadata }, _batchNumber_initializers, _batchNumber_extraInitializers);
        __esDecorate(null, null, _licenseNumber_decorators, { kind: "field", name: "licenseNumber", static: false, private: false, access: { has: function (obj) { return "licenseNumber" in obj; }, get: function (obj) { return obj.licenseNumber; }, set: function (obj, value) { obj.licenseNumber = value; } }, metadata: _metadata }, _licenseNumber_initializers, _licenseNumber_extraInitializers);
        __esDecorate(null, null, _order_decorators, { kind: "field", name: "order", static: false, private: false, access: { has: function (obj) { return "order" in obj; }, get: function (obj) { return obj.order; }, set: function (obj, value) { obj.order = value; } }, metadata: _metadata }, _order_initializers, _order_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OrderItem = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OrderItem = _classThis;
}();
exports.OrderItem = OrderItem;
sa;
