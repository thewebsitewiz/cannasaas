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
exports.OrderStatusHistory = void 0;
var typeorm_1 = require("typeorm");
var order_entity_1 = require("./order.entity");
var OrderStatusHistory = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('order_status_history')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _orderId_decorators;
    var _orderId_initializers = [];
    var _orderId_extraInitializers = [];
    var _fromStatus_decorators;
    var _fromStatus_initializers = [];
    var _fromStatus_extraInitializers = [];
    var _toStatus_decorators;
    var _toStatus_initializers = [];
    var _toStatus_extraInitializers = [];
    var _changedBy_decorators;
    var _changedBy_initializers = [];
    var _changedBy_extraInitializers = [];
    var _notes_decorators;
    var _notes_initializers = [];
    var _notes_extraInitializers = [];
    var _order_decorators;
    var _order_initializers = [];
    var _order_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var OrderStatusHistory = _classThis = /** @class */ (function () {
        function OrderStatusHistory_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.orderId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _orderId_initializers, void 0));
            this.fromStatus = (__runInitializers(this, _orderId_extraInitializers), __runInitializers(this, _fromStatus_initializers, void 0));
            this.toStatus = (__runInitializers(this, _fromStatus_extraInitializers), __runInitializers(this, _toStatus_initializers, void 0));
            this.changedBy = (__runInitializers(this, _toStatus_extraInitializers), __runInitializers(this, _changedBy_initializers, void 0)); // User ID who made the change
            this.notes = (__runInitializers(this, _changedBy_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
            this.order = (__runInitializers(this, _notes_extraInitializers), __runInitializers(this, _order_initializers, void 0));
            this.createdAt = (__runInitializers(this, _order_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            __runInitializers(this, _createdAt_extraInitializers);
        }
        return OrderStatusHistory_1;
    }());
    __setFunctionName(_classThis, "OrderStatusHistory");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _orderId_decorators = [(0, typeorm_1.Column)({ name: 'order_id', type: 'uuid' })];
        _fromStatus_decorators = [(0, typeorm_1.Column)({
                name: 'from_status',
                type: 'enum',
                enum: order_entity_1.OrderStatus,
                nullable: true,
            })];
        _toStatus_decorators = [(0, typeorm_1.Column)({
                name: 'to_status',
                type: 'enum',
                enum: order_entity_1.OrderStatus,
            })];
        _changedBy_decorators = [(0, typeorm_1.Column)({ name: 'changed_by', type: 'uuid', nullable: true })];
        _notes_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _order_decorators = [(0, typeorm_1.ManyToOne)(function () { return order_entity_1.Order; }, function (order) { return order.statusHistory; }, {
                onDelete: 'CASCADE',
            }), (0, typeorm_1.JoinColumn)({ name: 'order_id' })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _orderId_decorators, { kind: "field", name: "orderId", static: false, private: false, access: { has: function (obj) { return "orderId" in obj; }, get: function (obj) { return obj.orderId; }, set: function (obj, value) { obj.orderId = value; } }, metadata: _metadata }, _orderId_initializers, _orderId_extraInitializers);
        __esDecorate(null, null, _fromStatus_decorators, { kind: "field", name: "fromStatus", static: false, private: false, access: { has: function (obj) { return "fromStatus" in obj; }, get: function (obj) { return obj.fromStatus; }, set: function (obj, value) { obj.fromStatus = value; } }, metadata: _metadata }, _fromStatus_initializers, _fromStatus_extraInitializers);
        __esDecorate(null, null, _toStatus_decorators, { kind: "field", name: "toStatus", static: false, private: false, access: { has: function (obj) { return "toStatus" in obj; }, get: function (obj) { return obj.toStatus; }, set: function (obj, value) { obj.toStatus = value; } }, metadata: _metadata }, _toStatus_initializers, _toStatus_extraInitializers);
        __esDecorate(null, null, _changedBy_decorators, { kind: "field", name: "changedBy", static: false, private: false, access: { has: function (obj) { return "changedBy" in obj; }, get: function (obj) { return obj.changedBy; }, set: function (obj, value) { obj.changedBy = value; } }, metadata: _metadata }, _changedBy_initializers, _changedBy_extraInitializers);
        __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: function (obj) { return "notes" in obj; }, get: function (obj) { return obj.notes; }, set: function (obj, value) { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
        __esDecorate(null, null, _order_decorators, { kind: "field", name: "order", static: false, private: false, access: { has: function (obj) { return "order" in obj; }, get: function (obj) { return obj.order; }, set: function (obj, value) { obj.order = value; } }, metadata: _metadata }, _order_initializers, _order_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OrderStatusHistory = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OrderStatusHistory = _classThis;
}();
exports.OrderStatusHistory = OrderStatusHistory;
