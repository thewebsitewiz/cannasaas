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
exports.Order = exports.FulfillmentType = exports.PaymentStatus = exports.OrderStatus = void 0;
var typeorm_1 = require("typeorm");
var dispensary_entity_1 = require("../../dispensaries/entities/dispensary.entity");
var order_item_entity_1 = require("./order-item.entity");
var order_status_history_entity_1 = require("./order-status-history.entity");
var user_entity_1 = require("../../users/entities/user.entity");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PREPARING"] = "preparing";
    OrderStatus["READY_FOR_PICKUP"] = "ready_for_pickup";
    OrderStatus["OUT_FOR_DELIVERY"] = "out_for_delivery";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["REFUNDED"] = "refunded";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["AUTHORIZED"] = "authorized";
    PaymentStatus["CAPTURED"] = "captured";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var FulfillmentType;
(function (FulfillmentType) {
    FulfillmentType["PICKUP"] = "pickup";
    FulfillmentType["DELIVERY"] = "delivery";
})(FulfillmentType || (exports.FulfillmentType = FulfillmentType = {}));
var Order = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('orders'), (0, typeorm_1.Index)(['dispensaryId', 'createdAt'])];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _orderNumber_decorators;
    var _orderNumber_initializers = [];
    var _orderNumber_extraInitializers = [];
    var _userId_decorators;
    var _userId_initializers = [];
    var _userId_extraInitializers = [];
    var _dispensaryId_decorators;
    var _dispensaryId_initializers = [];
    var _dispensaryId_extraInitializers = [];
    var _tenantId_decorators;
    var _tenantId_initializers = [];
    var _tenantId_extraInitializers = [];
    var _subtotal_decorators;
    var _subtotal_initializers = [];
    var _subtotal_extraInitializers = [];
    var _taxAmount_decorators;
    var _taxAmount_initializers = [];
    var _taxAmount_extraInitializers = [];
    var _exciseTax_decorators;
    var _exciseTax_initializers = [];
    var _exciseTax_extraInitializers = [];
    var _discountAmount_decorators;
    var _discountAmount_initializers = [];
    var _discountAmount_extraInitializers = [];
    var _total_decorators;
    var _total_initializers = [];
    var _total_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _paymentStatus_decorators;
    var _paymentStatus_initializers = [];
    var _paymentStatus_extraInitializers = [];
    var _fulfillmentType_decorators;
    var _fulfillmentType_initializers = [];
    var _fulfillmentType_extraInitializers = [];
    var _customerName_decorators;
    var _customerName_initializers = [];
    var _customerName_extraInitializers = [];
    var _customerEmail_decorators;
    var _customerEmail_initializers = [];
    var _customerEmail_extraInitializers = [];
    var _customerPhone_decorators;
    var _customerPhone_initializers = [];
    var _customerPhone_extraInitializers = [];
    var _deliveryAddress_decorators;
    var _deliveryAddress_initializers = [];
    var _deliveryAddress_extraInitializers = [];
    var _notes_decorators;
    var _notes_initializers = [];
    var _notes_extraInitializers = [];
    var _internalNotes_decorators;
    var _internalNotes_initializers = [];
    var _internalNotes_extraInitializers = [];
    var _confirmedAt_decorators;
    var _confirmedAt_initializers = [];
    var _confirmedAt_extraInitializers = [];
    var _completedAt_decorators;
    var _completedAt_initializers = [];
    var _completedAt_extraInitializers = [];
    var _cancelledAt_decorators;
    var _cancelledAt_initializers = [];
    var _cancelledAt_extraInitializers = [];
    var _user_decorators;
    var _user_initializers = [];
    var _user_extraInitializers = [];
    var _dispensary_decorators;
    var _dispensary_initializers = [];
    var _dispensary_extraInitializers = [];
    var _items_decorators;
    var _items_initializers = [];
    var _items_extraInitializers = [];
    var _statusHistory_decorators;
    var _statusHistory_initializers = [];
    var _statusHistory_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var Order = _classThis = /** @class */ (function () {
        function Order_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.orderNumber = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _orderNumber_initializers, void 0)); // Human-readable: "ORD-20260210-001"
            this.userId = (__runInitializers(this, _orderNumber_extraInitializers), __runInitializers(this, _userId_initializers, void 0));
            this.dispensaryId = (__runInitializers(this, _userId_extraInitializers), __runInitializers(this, _dispensaryId_initializers, void 0));
            this.tenantId = (__runInitializers(this, _dispensaryId_extraInitializers), __runInitializers(this, _tenantId_initializers, void 0));
            // Pricing
            this.subtotal = (__runInitializers(this, _tenantId_extraInitializers), __runInitializers(this, _subtotal_initializers, void 0));
            this.taxAmount = (__runInitializers(this, _subtotal_extraInitializers), __runInitializers(this, _taxAmount_initializers, void 0));
            this.exciseTax = (__runInitializers(this, _taxAmount_extraInitializers), __runInitializers(this, _exciseTax_initializers, void 0)); // Cannabis-specific excise tax
            this.discountAmount = (__runInitializers(this, _exciseTax_extraInitializers), __runInitializers(this, _discountAmount_initializers, void 0));
            this.total = (__runInitializers(this, _discountAmount_extraInitializers), __runInitializers(this, _total_initializers, void 0));
            // Status
            this.status = (__runInitializers(this, _total_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.paymentStatus = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _paymentStatus_initializers, void 0));
            this.fulfillmentType = (__runInitializers(this, _paymentStatus_extraInitializers), __runInitializers(this, _fulfillmentType_initializers, void 0));
            // Customer info (snapshot at time of order)
            this.customerName = (__runInitializers(this, _fulfillmentType_extraInitializers), __runInitializers(this, _customerName_initializers, void 0));
            this.customerEmail = (__runInitializers(this, _customerName_extraInitializers), __runInitializers(this, _customerEmail_initializers, void 0));
            this.customerPhone = (__runInitializers(this, _customerEmail_extraInitializers), __runInitializers(this, _customerPhone_initializers, void 0));
            // Delivery address (if delivery)
            this.deliveryAddress = (__runInitializers(this, _customerPhone_extraInitializers), __runInitializers(this, _deliveryAddress_initializers, void 0));
            // Notes
            this.notes = (__runInitializers(this, _deliveryAddress_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
            this.internalNotes = (__runInitializers(this, _notes_extraInitializers), __runInitializers(this, _internalNotes_initializers, void 0));
            // Timestamps
            this.confirmedAt = (__runInitializers(this, _internalNotes_extraInitializers), __runInitializers(this, _confirmedAt_initializers, void 0));
            this.completedAt = (__runInitializers(this, _confirmedAt_extraInitializers), __runInitializers(this, _completedAt_initializers, void 0));
            this.cancelledAt = (__runInitializers(this, _completedAt_extraInitializers), __runInitializers(this, _cancelledAt_initializers, void 0));
            // Relations
            this.user = (__runInitializers(this, _cancelledAt_extraInitializers), __runInitializers(this, _user_initializers, void 0));
            this.dispensary = (__runInitializers(this, _user_extraInitializers), __runInitializers(this, _dispensary_initializers, void 0));
            this.items = (__runInitializers(this, _dispensary_extraInitializers), __runInitializers(this, _items_initializers, void 0));
            this.statusHistory = (__runInitializers(this, _items_extraInitializers), __runInitializers(this, _statusHistory_initializers, void 0));
            this.createdAt = (__runInitializers(this, _statusHistory_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
        return Order_1;
    }());
    __setFunctionName(_classThis, "Order");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _orderNumber_decorators = [(0, typeorm_1.Column)({ name: 'order_number', length: 20, unique: true })];
        _userId_decorators = [(0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' })];
        _dispensaryId_decorators = [(0, typeorm_1.Column)({ name: 'dispensary_id', type: 'uuid' })];
        _tenantId_decorators = [(0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' })];
        _subtotal_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 })];
        _taxAmount_decorators = [(0, typeorm_1.Column)({
                name: 'tax_amount',
                type: 'decimal',
                precision: 10,
                scale: 2,
                default: 0,
            })];
        _exciseTax_decorators = [(0, typeorm_1.Column)({
                name: 'excise_tax',
                type: 'decimal',
                precision: 10,
                scale: 2,
                default: 0,
            })];
        _discountAmount_decorators = [(0, typeorm_1.Column)({
                name: 'discount_amount',
                type: 'decimal',
                precision: 10,
                scale: 2,
                default: 0,
            })];
        _total_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 })];
        _status_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: OrderStatus,
                default: OrderStatus.PENDING,
            })];
        _paymentStatus_decorators = [(0, typeorm_1.Column)({
                name: 'payment_status',
                type: 'enum',
                enum: PaymentStatus,
                default: PaymentStatus.PENDING,
            })];
        _fulfillmentType_decorators = [(0, typeorm_1.Column)({
                name: 'fulfillment_type',
                type: 'enum',
                enum: FulfillmentType,
            })];
        _customerName_decorators = [(0, typeorm_1.Column)({ name: 'customer_name', length: 255 })];
        _customerEmail_decorators = [(0, typeorm_1.Column)({ name: 'customer_email', length: 255 })];
        _customerPhone_decorators = [(0, typeorm_1.Column)({ name: 'customer_phone', length: 20, nullable: true })];
        _deliveryAddress_decorators = [(0, typeorm_1.Column)({ name: 'delivery_address', type: 'text', nullable: true })];
        _notes_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _internalNotes_decorators = [(0, typeorm_1.Column)({ name: 'internal_notes', type: 'text', nullable: true })];
        _confirmedAt_decorators = [(0, typeorm_1.Column)({ name: 'confirmed_at', type: 'timestamp', nullable: true })];
        _completedAt_decorators = [(0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true })];
        _cancelledAt_decorators = [(0, typeorm_1.Column)({ name: 'cancelled_at', type: 'timestamp', nullable: true })];
        _user_decorators = [(0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }), (0, typeorm_1.JoinColumn)({ name: 'user_id' })];
        _dispensary_decorators = [(0, typeorm_1.ManyToOne)(function () { return dispensary_entity_1.Dispensary; }), (0, typeorm_1.JoinColumn)({ name: 'dispensary_id' })];
        _items_decorators = [(0, typeorm_1.OneToMany)(function () { return order_item_entity_1.OrderItem; }, function (item) { return item.order; }, { cascade: true })];
        _statusHistory_decorators = [(0, typeorm_1.OneToMany)(function () { return order_status_history_entity_1.OrderStatusHistory; }, function (history) { return history.order; }, {
                cascade: true,
            })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' })];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _orderNumber_decorators, { kind: "field", name: "orderNumber", static: false, private: false, access: { has: function (obj) { return "orderNumber" in obj; }, get: function (obj) { return obj.orderNumber; }, set: function (obj, value) { obj.orderNumber = value; } }, metadata: _metadata }, _orderNumber_initializers, _orderNumber_extraInitializers);
        __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: function (obj) { return "userId" in obj; }, get: function (obj) { return obj.userId; }, set: function (obj, value) { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
        __esDecorate(null, null, _dispensaryId_decorators, { kind: "field", name: "dispensaryId", static: false, private: false, access: { has: function (obj) { return "dispensaryId" in obj; }, get: function (obj) { return obj.dispensaryId; }, set: function (obj, value) { obj.dispensaryId = value; } }, metadata: _metadata }, _dispensaryId_initializers, _dispensaryId_extraInitializers);
        __esDecorate(null, null, _tenantId_decorators, { kind: "field", name: "tenantId", static: false, private: false, access: { has: function (obj) { return "tenantId" in obj; }, get: function (obj) { return obj.tenantId; }, set: function (obj, value) { obj.tenantId = value; } }, metadata: _metadata }, _tenantId_initializers, _tenantId_extraInitializers);
        __esDecorate(null, null, _subtotal_decorators, { kind: "field", name: "subtotal", static: false, private: false, access: { has: function (obj) { return "subtotal" in obj; }, get: function (obj) { return obj.subtotal; }, set: function (obj, value) { obj.subtotal = value; } }, metadata: _metadata }, _subtotal_initializers, _subtotal_extraInitializers);
        __esDecorate(null, null, _taxAmount_decorators, { kind: "field", name: "taxAmount", static: false, private: false, access: { has: function (obj) { return "taxAmount" in obj; }, get: function (obj) { return obj.taxAmount; }, set: function (obj, value) { obj.taxAmount = value; } }, metadata: _metadata }, _taxAmount_initializers, _taxAmount_extraInitializers);
        __esDecorate(null, null, _exciseTax_decorators, { kind: "field", name: "exciseTax", static: false, private: false, access: { has: function (obj) { return "exciseTax" in obj; }, get: function (obj) { return obj.exciseTax; }, set: function (obj, value) { obj.exciseTax = value; } }, metadata: _metadata }, _exciseTax_initializers, _exciseTax_extraInitializers);
        __esDecorate(null, null, _discountAmount_decorators, { kind: "field", name: "discountAmount", static: false, private: false, access: { has: function (obj) { return "discountAmount" in obj; }, get: function (obj) { return obj.discountAmount; }, set: function (obj, value) { obj.discountAmount = value; } }, metadata: _metadata }, _discountAmount_initializers, _discountAmount_extraInitializers);
        __esDecorate(null, null, _total_decorators, { kind: "field", name: "total", static: false, private: false, access: { has: function (obj) { return "total" in obj; }, get: function (obj) { return obj.total; }, set: function (obj, value) { obj.total = value; } }, metadata: _metadata }, _total_initializers, _total_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _paymentStatus_decorators, { kind: "field", name: "paymentStatus", static: false, private: false, access: { has: function (obj) { return "paymentStatus" in obj; }, get: function (obj) { return obj.paymentStatus; }, set: function (obj, value) { obj.paymentStatus = value; } }, metadata: _metadata }, _paymentStatus_initializers, _paymentStatus_extraInitializers);
        __esDecorate(null, null, _fulfillmentType_decorators, { kind: "field", name: "fulfillmentType", static: false, private: false, access: { has: function (obj) { return "fulfillmentType" in obj; }, get: function (obj) { return obj.fulfillmentType; }, set: function (obj, value) { obj.fulfillmentType = value; } }, metadata: _metadata }, _fulfillmentType_initializers, _fulfillmentType_extraInitializers);
        __esDecorate(null, null, _customerName_decorators, { kind: "field", name: "customerName", static: false, private: false, access: { has: function (obj) { return "customerName" in obj; }, get: function (obj) { return obj.customerName; }, set: function (obj, value) { obj.customerName = value; } }, metadata: _metadata }, _customerName_initializers, _customerName_extraInitializers);
        __esDecorate(null, null, _customerEmail_decorators, { kind: "field", name: "customerEmail", static: false, private: false, access: { has: function (obj) { return "customerEmail" in obj; }, get: function (obj) { return obj.customerEmail; }, set: function (obj, value) { obj.customerEmail = value; } }, metadata: _metadata }, _customerEmail_initializers, _customerEmail_extraInitializers);
        __esDecorate(null, null, _customerPhone_decorators, { kind: "field", name: "customerPhone", static: false, private: false, access: { has: function (obj) { return "customerPhone" in obj; }, get: function (obj) { return obj.customerPhone; }, set: function (obj, value) { obj.customerPhone = value; } }, metadata: _metadata }, _customerPhone_initializers, _customerPhone_extraInitializers);
        __esDecorate(null, null, _deliveryAddress_decorators, { kind: "field", name: "deliveryAddress", static: false, private: false, access: { has: function (obj) { return "deliveryAddress" in obj; }, get: function (obj) { return obj.deliveryAddress; }, set: function (obj, value) { obj.deliveryAddress = value; } }, metadata: _metadata }, _deliveryAddress_initializers, _deliveryAddress_extraInitializers);
        __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: function (obj) { return "notes" in obj; }, get: function (obj) { return obj.notes; }, set: function (obj, value) { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
        __esDecorate(null, null, _internalNotes_decorators, { kind: "field", name: "internalNotes", static: false, private: false, access: { has: function (obj) { return "internalNotes" in obj; }, get: function (obj) { return obj.internalNotes; }, set: function (obj, value) { obj.internalNotes = value; } }, metadata: _metadata }, _internalNotes_initializers, _internalNotes_extraInitializers);
        __esDecorate(null, null, _confirmedAt_decorators, { kind: "field", name: "confirmedAt", static: false, private: false, access: { has: function (obj) { return "confirmedAt" in obj; }, get: function (obj) { return obj.confirmedAt; }, set: function (obj, value) { obj.confirmedAt = value; } }, metadata: _metadata }, _confirmedAt_initializers, _confirmedAt_extraInitializers);
        __esDecorate(null, null, _completedAt_decorators, { kind: "field", name: "completedAt", static: false, private: false, access: { has: function (obj) { return "completedAt" in obj; }, get: function (obj) { return obj.completedAt; }, set: function (obj, value) { obj.completedAt = value; } }, metadata: _metadata }, _completedAt_initializers, _completedAt_extraInitializers);
        __esDecorate(null, null, _cancelledAt_decorators, { kind: "field", name: "cancelledAt", static: false, private: false, access: { has: function (obj) { return "cancelledAt" in obj; }, get: function (obj) { return obj.cancelledAt; }, set: function (obj, value) { obj.cancelledAt = value; } }, metadata: _metadata }, _cancelledAt_initializers, _cancelledAt_extraInitializers);
        __esDecorate(null, null, _user_decorators, { kind: "field", name: "user", static: false, private: false, access: { has: function (obj) { return "user" in obj; }, get: function (obj) { return obj.user; }, set: function (obj, value) { obj.user = value; } }, metadata: _metadata }, _user_initializers, _user_extraInitializers);
        __esDecorate(null, null, _dispensary_decorators, { kind: "field", name: "dispensary", static: false, private: false, access: { has: function (obj) { return "dispensary" in obj; }, get: function (obj) { return obj.dispensary; }, set: function (obj, value) { obj.dispensary = value; } }, metadata: _metadata }, _dispensary_initializers, _dispensary_extraInitializers);
        __esDecorate(null, null, _items_decorators, { kind: "field", name: "items", static: false, private: false, access: { has: function (obj) { return "items" in obj; }, get: function (obj) { return obj.items; }, set: function (obj, value) { obj.items = value; } }, metadata: _metadata }, _items_initializers, _items_extraInitializers);
        __esDecorate(null, null, _statusHistory_decorators, { kind: "field", name: "statusHistory", static: false, private: false, access: { has: function (obj) { return "statusHistory" in obj; }, get: function (obj) { return obj.statusHistory; }, set: function (obj, value) { obj.statusHistory = value; } }, metadata: _metadata }, _statusHistory_initializers, _statusHistory_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Order = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Order = _classThis;
}();
exports.Order = Order;
