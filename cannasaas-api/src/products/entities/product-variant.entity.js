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
exports.ProductVariant = void 0;
var typeorm_1 = require("typeorm");
var product_entity_1 = require("./product.entity");
var ProductVariant = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('product_variants')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _productId_decorators;
    var _productId_initializers = [];
    var _productId_extraInitializers = [];
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _sku_decorators;
    var _sku_initializers = [];
    var _sku_extraInitializers = [];
    var _price_decorators;
    var _price_initializers = [];
    var _price_extraInitializers = [];
    var _compareAtPrice_decorators;
    var _compareAtPrice_initializers = [];
    var _compareAtPrice_extraInitializers = [];
    var _quantity_decorators;
    var _quantity_initializers = [];
    var _quantity_extraInitializers = [];
    var _lowStockThreshold_decorators;
    var _lowStockThreshold_initializers = [];
    var _lowStockThreshold_extraInitializers = [];
    var _weight_decorators;
    var _weight_initializers = [];
    var _weight_extraInitializers = [];
    var _weightUnit_decorators;
    var _weightUnit_initializers = [];
    var _weightUnit_extraInitializers = [];
    var _sortOrder_decorators;
    var _sortOrder_initializers = [];
    var _sortOrder_extraInitializers = [];
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    var _product_decorators;
    var _product_initializers = [];
    var _product_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var ProductVariant = _classThis = /** @class */ (function () {
        function ProductVariant_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.productId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _productId_initializers, void 0));
            this.name = (__runInitializers(this, _productId_extraInitializers), __runInitializers(this, _name_initializers, void 0)); // e.g., "3.5g", "1/8 oz", "100mg pack"
            this.sku = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _sku_initializers, void 0));
            this.price = (__runInitializers(this, _sku_extraInitializers), __runInitializers(this, _price_initializers, void 0));
            this.compareAtPrice = (__runInitializers(this, _price_extraInitializers), __runInitializers(this, _compareAtPrice_initializers, void 0)); // Original price for showing discounts
            this.quantity = (__runInitializers(this, _compareAtPrice_extraInitializers), __runInitializers(this, _quantity_initializers, void 0)); // Current stock
            this.lowStockThreshold = (__runInitializers(this, _quantity_extraInitializers), __runInitializers(this, _lowStockThreshold_initializers, void 0));
            this.weight = (__runInitializers(this, _lowStockThreshold_extraInitializers), __runInitializers(this, _weight_initializers, void 0)); // in grams
            this.weightUnit = (__runInitializers(this, _weight_extraInitializers), __runInitializers(this, _weightUnit_initializers, void 0));
            this.sortOrder = (__runInitializers(this, _weightUnit_extraInitializers), __runInitializers(this, _sortOrder_initializers, void 0));
            this.isActive = (__runInitializers(this, _sortOrder_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
            this.product = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _product_initializers, void 0));
            this.createdAt = (__runInitializers(this, _product_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
        return ProductVariant_1;
    }());
    __setFunctionName(_classThis, "ProductVariant");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _productId_decorators = [(0, typeorm_1.Column)({ name: 'product_id', type: 'uuid' })];
        _name_decorators = [(0, typeorm_1.Column)({ length: 100 })];
        _sku_decorators = [(0, typeorm_1.Column)({ length: 50, nullable: true })];
        _price_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 })];
        _compareAtPrice_decorators = [(0, typeorm_1.Column)({
                name: 'compare_at_price',
                type: 'decimal',
                precision: 10,
                scale: 2,
                nullable: true,
            })];
        _quantity_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _lowStockThreshold_decorators = [(0, typeorm_1.Column)({ name: 'low_stock_threshold', type: 'int', default: 5 })];
        _weight_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2, nullable: true })];
        _weightUnit_decorators = [(0, typeorm_1.Column)({ name: 'weight_unit', length: 10, default: 'g' })];
        _sortOrder_decorators = [(0, typeorm_1.Column)({ name: 'sort_order', type: 'int', default: 0 })];
        _isActive_decorators = [(0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true })];
        _product_decorators = [(0, typeorm_1.ManyToOne)(function () { return product_entity_1.Product; }, function (product) { return product.variants; }), (0, typeorm_1.JoinColumn)({ name: 'product_id' })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' })];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _productId_decorators, { kind: "field", name: "productId", static: false, private: false, access: { has: function (obj) { return "productId" in obj; }, get: function (obj) { return obj.productId; }, set: function (obj, value) { obj.productId = value; } }, metadata: _metadata }, _productId_initializers, _productId_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _sku_decorators, { kind: "field", name: "sku", static: false, private: false, access: { has: function (obj) { return "sku" in obj; }, get: function (obj) { return obj.sku; }, set: function (obj, value) { obj.sku = value; } }, metadata: _metadata }, _sku_initializers, _sku_extraInitializers);
        __esDecorate(null, null, _price_decorators, { kind: "field", name: "price", static: false, private: false, access: { has: function (obj) { return "price" in obj; }, get: function (obj) { return obj.price; }, set: function (obj, value) { obj.price = value; } }, metadata: _metadata }, _price_initializers, _price_extraInitializers);
        __esDecorate(null, null, _compareAtPrice_decorators, { kind: "field", name: "compareAtPrice", static: false, private: false, access: { has: function (obj) { return "compareAtPrice" in obj; }, get: function (obj) { return obj.compareAtPrice; }, set: function (obj, value) { obj.compareAtPrice = value; } }, metadata: _metadata }, _compareAtPrice_initializers, _compareAtPrice_extraInitializers);
        __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: function (obj) { return "quantity" in obj; }, get: function (obj) { return obj.quantity; }, set: function (obj, value) { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
        __esDecorate(null, null, _lowStockThreshold_decorators, { kind: "field", name: "lowStockThreshold", static: false, private: false, access: { has: function (obj) { return "lowStockThreshold" in obj; }, get: function (obj) { return obj.lowStockThreshold; }, set: function (obj, value) { obj.lowStockThreshold = value; } }, metadata: _metadata }, _lowStockThreshold_initializers, _lowStockThreshold_extraInitializers);
        __esDecorate(null, null, _weight_decorators, { kind: "field", name: "weight", static: false, private: false, access: { has: function (obj) { return "weight" in obj; }, get: function (obj) { return obj.weight; }, set: function (obj, value) { obj.weight = value; } }, metadata: _metadata }, _weight_initializers, _weight_extraInitializers);
        __esDecorate(null, null, _weightUnit_decorators, { kind: "field", name: "weightUnit", static: false, private: false, access: { has: function (obj) { return "weightUnit" in obj; }, get: function (obj) { return obj.weightUnit; }, set: function (obj, value) { obj.weightUnit = value; } }, metadata: _metadata }, _weightUnit_initializers, _weightUnit_extraInitializers);
        __esDecorate(null, null, _sortOrder_decorators, { kind: "field", name: "sortOrder", static: false, private: false, access: { has: function (obj) { return "sortOrder" in obj; }, get: function (obj) { return obj.sortOrder; }, set: function (obj, value) { obj.sortOrder = value; } }, metadata: _metadata }, _sortOrder_initializers, _sortOrder_extraInitializers);
        __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
        __esDecorate(null, null, _product_decorators, { kind: "field", name: "product", static: false, private: false, access: { has: function (obj) { return "product" in obj; }, get: function (obj) { return obj.product; }, set: function (obj, value) { obj.product = value; } }, metadata: _metadata }, _product_initializers, _product_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProductVariant = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProductVariant = _classThis;
}();
exports.ProductVariant = ProductVariant;
