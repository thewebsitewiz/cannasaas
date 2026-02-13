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
exports.ComplianceLog = exports.ComplianceEventType = void 0;
var typeorm_1 = require("typeorm");
var dispensary_entity_1 = require("../../dispensaries/entities/dispensary.entity");
var ComplianceEventType;
(function (ComplianceEventType) {
    ComplianceEventType["SALE"] = "sale";
    ComplianceEventType["RETURN"] = "return";
    ComplianceEventType["INVENTORY_ADJUSTMENT"] = "inventory_adjustment";
    ComplianceEventType["INVENTORY_RECEIVED"] = "inventory_received";
    ComplianceEventType["INVENTORY_DESTROYED"] = "inventory_destroyed";
    ComplianceEventType["PRODUCT_RECALL"] = "product_recall";
    ComplianceEventType["ID_VERIFICATION"] = "id_verification";
    ComplianceEventType["PURCHASE_LIMIT_CHECK"] = "purchase_limit_check";
})(ComplianceEventType || (exports.ComplianceEventType = ComplianceEventType = {}));
var ComplianceLog = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('compliance_logs'), (0, typeorm_1.Index)(['dispensaryId', 'createdAt']), (0, typeorm_1.Index)(['eventType', 'createdAt'])];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _dispensaryId_decorators;
    var _dispensaryId_initializers = [];
    var _dispensaryId_extraInitializers = [];
    var _eventType_decorators;
    var _eventType_initializers = [];
    var _eventType_extraInitializers = [];
    var _details_decorators;
    var _details_initializers = [];
    var _details_extraInitializers = [];
    var _performedBy_decorators;
    var _performedBy_initializers = [];
    var _performedBy_extraInitializers = [];
    var _orderId_decorators;
    var _orderId_initializers = [];
    var _orderId_extraInitializers = [];
    var _dispensary_decorators;
    var _dispensary_initializers = [];
    var _dispensary_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var ComplianceLog = _classThis = /** @class */ (function () {
        function ComplianceLog_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.dispensaryId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _dispensaryId_initializers, void 0));
            this.eventType = (__runInitializers(this, _dispensaryId_extraInitializers), __runInitializers(this, _eventType_initializers, void 0));
            this.details = (__runInitializers(this, _eventType_extraInitializers), __runInitializers(this, _details_initializers, void 0));
            // For SALE: { orderId, items: [{productName, quantity, batchNumber, licenseNumber}], total }
            // For INVENTORY_ADJUSTMENT: { variantId, oldQuantity, newQuantity, reason }
            // For ID_VERIFICATION: { customerId, verificationType, verified }
            // For PURCHASE_LIMIT_CHECK: { customerId, dailyTotal, withinLimit }
            this.performedBy = (__runInitializers(this, _details_extraInitializers), __runInitializers(this, _performedBy_initializers, void 0));
            this.orderId = (__runInitializers(this, _performedBy_extraInitializers), __runInitializers(this, _orderId_initializers, void 0));
            this.dispensary = (__runInitializers(this, _orderId_extraInitializers), __runInitializers(this, _dispensary_initializers, void 0));
            this.createdAt = (__runInitializers(this, _dispensary_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            __runInitializers(this, _createdAt_extraInitializers);
        }
        return ComplianceLog_1;
    }());
    __setFunctionName(_classThis, "ComplianceLog");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _dispensaryId_decorators = [(0, typeorm_1.Column)({ name: 'dispensary_id', type: 'uuid' })];
        _eventType_decorators = [(0, typeorm_1.Column)({
                name: 'event_type',
                type: 'enum',
                enum: ComplianceEventType,
            })];
        _details_decorators = [(0, typeorm_1.Column)({ type: 'jsonb' })];
        _performedBy_decorators = [(0, typeorm_1.Column)({ name: 'performed_by', type: 'uuid', nullable: true })];
        _orderId_decorators = [(0, typeorm_1.Column)({ name: 'order_id', type: 'uuid', nullable: true })];
        _dispensary_decorators = [(0, typeorm_1.ManyToOne)(function () { return dispensary_entity_1.Dispensary; }), (0, typeorm_1.JoinColumn)({ name: 'dispensary_id' })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _dispensaryId_decorators, { kind: "field", name: "dispensaryId", static: false, private: false, access: { has: function (obj) { return "dispensaryId" in obj; }, get: function (obj) { return obj.dispensaryId; }, set: function (obj, value) { obj.dispensaryId = value; } }, metadata: _metadata }, _dispensaryId_initializers, _dispensaryId_extraInitializers);
        __esDecorate(null, null, _eventType_decorators, { kind: "field", name: "eventType", static: false, private: false, access: { has: function (obj) { return "eventType" in obj; }, get: function (obj) { return obj.eventType; }, set: function (obj, value) { obj.eventType = value; } }, metadata: _metadata }, _eventType_initializers, _eventType_extraInitializers);
        __esDecorate(null, null, _details_decorators, { kind: "field", name: "details", static: false, private: false, access: { has: function (obj) { return "details" in obj; }, get: function (obj) { return obj.details; }, set: function (obj, value) { obj.details = value; } }, metadata: _metadata }, _details_initializers, _details_extraInitializers);
        __esDecorate(null, null, _performedBy_decorators, { kind: "field", name: "performedBy", static: false, private: false, access: { has: function (obj) { return "performedBy" in obj; }, get: function (obj) { return obj.performedBy; }, set: function (obj, value) { obj.performedBy = value; } }, metadata: _metadata }, _performedBy_initializers, _performedBy_extraInitializers);
        __esDecorate(null, null, _orderId_decorators, { kind: "field", name: "orderId", static: false, private: false, access: { has: function (obj) { return "orderId" in obj; }, get: function (obj) { return obj.orderId; }, set: function (obj, value) { obj.orderId = value; } }, metadata: _metadata }, _orderId_initializers, _orderId_extraInitializers);
        __esDecorate(null, null, _dispensary_decorators, { kind: "field", name: "dispensary", static: false, private: false, access: { has: function (obj) { return "dispensary" in obj; }, get: function (obj) { return obj.dispensary; }, set: function (obj, value) { obj.dispensary = value; } }, metadata: _metadata }, _dispensary_initializers, _dispensary_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ComplianceLog = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ComplianceLog = _classThis;
}();
exports.ComplianceLog = ComplianceLog;
