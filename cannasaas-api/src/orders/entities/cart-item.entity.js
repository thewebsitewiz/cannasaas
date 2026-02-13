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
exports.CartItem = void 0;
var typeorm_1 = require("typeorm");
var cart_entity_1 = require("./cart.entity");
var product_variant_entity_1 = require("../../products/entities/product-variant.entity");
var CartItem = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('cart_items')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _cartId_decorators;
    var _cartId_initializers = [];
    var _cartId_extraInitializers = [];
    var _variantId_decorators;
    var _variantId_initializers = [];
    var _variantId_extraInitializers = [];
    var _quantity_decorators;
    var _quantity_initializers = [];
    var _quantity_extraInitializers = [];
    var _unitPrice_decorators;
    var _unitPrice_initializers = [];
    var _unitPrice_extraInitializers = [];
    var _cart_decorators;
    var _cart_initializers = [];
    var _cart_extraInitializers = [];
    var _variant_decorators;
    var _variant_initializers = [];
    var _variant_extraInitializers = [];
    var CartItem = _classThis = /** @class */ (function () {
        function CartItem_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.cartId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _cartId_initializers, void 0));
            this.variantId = (__runInitializers(this, _cartId_extraInitializers), __runInitializers(this, _variantId_initializers, void 0));
            this.quantity = (__runInitializers(this, _variantId_extraInitializers), __runInitializers(this, _quantity_initializers, void 0));
            this.unitPrice = (__runInitializers(this, _quantity_extraInitializers), __runInitializers(this, _unitPrice_initializers, void 0)); // Snapshot of price when added
            this.cart = (__runInitializers(this, _unitPrice_extraInitializers), __runInitializers(this, _cart_initializers, void 0));
            this.variant = (__runInitializers(this, _cart_extraInitializers), __runInitializers(this, _variant_initializers, void 0));
            __runInitializers(this, _variant_extraInitializers);
        }
        return CartItem_1;
    }());
    __setFunctionName(_classThis, "CartItem");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _cartId_decorators = [(0, typeorm_1.Column)({ name: 'cart_id', type: 'uuid' })];
        _variantId_decorators = [(0, typeorm_1.Column)({ name: 'variant_id', type: 'uuid' })];
        _quantity_decorators = [(0, typeorm_1.Column)({ type: 'int' })];
        _unitPrice_decorators = [(0, typeorm_1.Column)({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })];
        _cart_decorators = [(0, typeorm_1.ManyToOne)(function () { return cart_entity_1.Cart; }, function (cart) { return cart.items; }, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'cart_id' })];
        _variant_decorators = [(0, typeorm_1.ManyToOne)(function () { return product_variant_entity_1.ProductVariant; }), (0, typeorm_1.JoinColumn)({ name: 'variant_id' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _cartId_decorators, { kind: "field", name: "cartId", static: false, private: false, access: { has: function (obj) { return "cartId" in obj; }, get: function (obj) { return obj.cartId; }, set: function (obj, value) { obj.cartId = value; } }, metadata: _metadata }, _cartId_initializers, _cartId_extraInitializers);
        __esDecorate(null, null, _variantId_decorators, { kind: "field", name: "variantId", static: false, private: false, access: { has: function (obj) { return "variantId" in obj; }, get: function (obj) { return obj.variantId; }, set: function (obj, value) { obj.variantId = value; } }, metadata: _metadata }, _variantId_initializers, _variantId_extraInitializers);
        __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: function (obj) { return "quantity" in obj; }, get: function (obj) { return obj.quantity; }, set: function (obj, value) { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
        __esDecorate(null, null, _unitPrice_decorators, { kind: "field", name: "unitPrice", static: false, private: false, access: { has: function (obj) { return "unitPrice" in obj; }, get: function (obj) { return obj.unitPrice; }, set: function (obj, value) { obj.unitPrice = value; } }, metadata: _metadata }, _unitPrice_initializers, _unitPrice_extraInitializers);
        __esDecorate(null, null, _cart_decorators, { kind: "field", name: "cart", static: false, private: false, access: { has: function (obj) { return "cart" in obj; }, get: function (obj) { return obj.cart; }, set: function (obj, value) { obj.cart = value; } }, metadata: _metadata }, _cart_initializers, _cart_extraInitializers);
        __esDecorate(null, null, _variant_decorators, { kind: "field", name: "variant", static: false, private: false, access: { has: function (obj) { return "variant" in obj; }, get: function (obj) { return obj.variant; }, set: function (obj, value) { obj.variant = value; } }, metadata: _metadata }, _variant_initializers, _variant_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CartItem = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CartItem = _classThis;
}();
exports.CartItem = CartItem;
