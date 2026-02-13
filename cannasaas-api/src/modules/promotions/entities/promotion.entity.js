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
exports.Promotion = exports.PromotionType = void 0;
// cannasaas-api/src/modules/promotions/entities/promotion.entity.ts
var typeorm_1 = require("typeorm");
var PromotionType;
(function (PromotionType) {
    PromotionType["PERCENTAGE"] = "percentage";
    PromotionType["FIXED_AMOUNT"] = "fixed_amount";
    PromotionType["BUY_X_GET_Y"] = "buy_x_get_y";
    PromotionType["FREE_SHIPPING"] = "free_shipping";
})(PromotionType || (exports.PromotionType = PromotionType = {}));
var Promotion = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('promotions')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _organizationId_decorators;
    var _organizationId_initializers = [];
    var _organizationId_extraInitializers = [];
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _code_decorators;
    var _code_initializers = [];
    var _code_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _value_decorators;
    var _value_initializers = [];
    var _value_extraInitializers = [];
    var _minimumOrderValue_decorators;
    var _minimumOrderValue_initializers = [];
    var _minimumOrderValue_extraInitializers = [];
    var _maximumDiscount_decorators;
    var _maximumDiscount_initializers = [];
    var _maximumDiscount_extraInitializers = [];
    var _conditions_decorators;
    var _conditions_initializers = [];
    var _conditions_extraInitializers = [];
    var _usageLimit_decorators;
    var _usageLimit_initializers = [];
    var _usageLimit_extraInitializers = [];
    var _usageCount_decorators;
    var _usageCount_initializers = [];
    var _usageCount_extraInitializers = [];
    var _perCustomerLimit_decorators;
    var _perCustomerLimit_initializers = [];
    var _perCustomerLimit_extraInitializers = [];
    var _startsAt_decorators;
    var _startsAt_initializers = [];
    var _startsAt_extraInitializers = [];
    var _expiresAt_decorators;
    var _expiresAt_initializers = [];
    var _expiresAt_extraInitializers = [];
    var _active_decorators;
    var _active_initializers = [];
    var _active_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var Promotion = _classThis = /** @class */ (function () {
        function Promotion_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.organizationId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _organizationId_initializers, void 0));
            this.name = (__runInitializers(this, _organizationId_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.code = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _code_initializers, void 0));
            this.type = (__runInitializers(this, _code_extraInitializers), __runInitializers(this, _type_initializers, void 0));
            this.value = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _value_initializers, void 0));
            this.minimumOrderValue = (__runInitializers(this, _value_extraInitializers), __runInitializers(this, _minimumOrderValue_initializers, void 0));
            this.maximumDiscount = (__runInitializers(this, _minimumOrderValue_extraInitializers), __runInitializers(this, _maximumDiscount_initializers, void 0));
            this.conditions = (__runInitializers(this, _maximumDiscount_extraInitializers), __runInitializers(this, _conditions_initializers, void 0));
            this.usageLimit = (__runInitializers(this, _conditions_extraInitializers), __runInitializers(this, _usageLimit_initializers, void 0));
            this.usageCount = (__runInitializers(this, _usageLimit_extraInitializers), __runInitializers(this, _usageCount_initializers, void 0));
            this.perCustomerLimit = (__runInitializers(this, _usageCount_extraInitializers), __runInitializers(this, _perCustomerLimit_initializers, void 0));
            this.startsAt = (__runInitializers(this, _perCustomerLimit_extraInitializers), __runInitializers(this, _startsAt_initializers, void 0));
            this.expiresAt = (__runInitializers(this, _startsAt_extraInitializers), __runInitializers(this, _expiresAt_initializers, void 0));
            this.active = (__runInitializers(this, _expiresAt_extraInitializers), __runInitializers(this, _active_initializers, void 0));
            this.createdAt = (__runInitializers(this, _active_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
        return Promotion_1;
    }());
    __setFunctionName(_classThis, "Promotion");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _organizationId_decorators = [(0, typeorm_1.Column)('uuid')];
        _name_decorators = [(0, typeorm_1.Column)()];
        _code_decorators = [(0, typeorm_1.Column)({ unique: true })];
        _type_decorators = [(0, typeorm_1.Column)({ type: 'enum', enum: PromotionType })];
        _value_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true })];
        _minimumOrderValue_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 })];
        _maximumDiscount_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true })];
        _conditions_decorators = [(0, typeorm_1.Column)({ type: 'jsonb', nullable: true })];
        _usageLimit_decorators = [(0, typeorm_1.Column)({ type: 'int', nullable: true })];
        _usageCount_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _perCustomerLimit_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 1 })];
        _startsAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp' })];
        _expiresAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp' })];
        _active_decorators = [(0, typeorm_1.Column)({ default: true })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _code_decorators, { kind: "field", name: "code", static: false, private: false, access: { has: function (obj) { return "code" in obj; }, get: function (obj) { return obj.code; }, set: function (obj, value) { obj.code = value; } }, metadata: _metadata }, _code_initializers, _code_extraInitializers);
        __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
        __esDecorate(null, null, _value_decorators, { kind: "field", name: "value", static: false, private: false, access: { has: function (obj) { return "value" in obj; }, get: function (obj) { return obj.value; }, set: function (obj, value) { obj.value = value; } }, metadata: _metadata }, _value_initializers, _value_extraInitializers);
        __esDecorate(null, null, _minimumOrderValue_decorators, { kind: "field", name: "minimumOrderValue", static: false, private: false, access: { has: function (obj) { return "minimumOrderValue" in obj; }, get: function (obj) { return obj.minimumOrderValue; }, set: function (obj, value) { obj.minimumOrderValue = value; } }, metadata: _metadata }, _minimumOrderValue_initializers, _minimumOrderValue_extraInitializers);
        __esDecorate(null, null, _maximumDiscount_decorators, { kind: "field", name: "maximumDiscount", static: false, private: false, access: { has: function (obj) { return "maximumDiscount" in obj; }, get: function (obj) { return obj.maximumDiscount; }, set: function (obj, value) { obj.maximumDiscount = value; } }, metadata: _metadata }, _maximumDiscount_initializers, _maximumDiscount_extraInitializers);
        __esDecorate(null, null, _conditions_decorators, { kind: "field", name: "conditions", static: false, private: false, access: { has: function (obj) { return "conditions" in obj; }, get: function (obj) { return obj.conditions; }, set: function (obj, value) { obj.conditions = value; } }, metadata: _metadata }, _conditions_initializers, _conditions_extraInitializers);
        __esDecorate(null, null, _usageLimit_decorators, { kind: "field", name: "usageLimit", static: false, private: false, access: { has: function (obj) { return "usageLimit" in obj; }, get: function (obj) { return obj.usageLimit; }, set: function (obj, value) { obj.usageLimit = value; } }, metadata: _metadata }, _usageLimit_initializers, _usageLimit_extraInitializers);
        __esDecorate(null, null, _usageCount_decorators, { kind: "field", name: "usageCount", static: false, private: false, access: { has: function (obj) { return "usageCount" in obj; }, get: function (obj) { return obj.usageCount; }, set: function (obj, value) { obj.usageCount = value; } }, metadata: _metadata }, _usageCount_initializers, _usageCount_extraInitializers);
        __esDecorate(null, null, _perCustomerLimit_decorators, { kind: "field", name: "perCustomerLimit", static: false, private: false, access: { has: function (obj) { return "perCustomerLimit" in obj; }, get: function (obj) { return obj.perCustomerLimit; }, set: function (obj, value) { obj.perCustomerLimit = value; } }, metadata: _metadata }, _perCustomerLimit_initializers, _perCustomerLimit_extraInitializers);
        __esDecorate(null, null, _startsAt_decorators, { kind: "field", name: "startsAt", static: false, private: false, access: { has: function (obj) { return "startsAt" in obj; }, get: function (obj) { return obj.startsAt; }, set: function (obj, value) { obj.startsAt = value; } }, metadata: _metadata }, _startsAt_initializers, _startsAt_extraInitializers);
        __esDecorate(null, null, _expiresAt_decorators, { kind: "field", name: "expiresAt", static: false, private: false, access: { has: function (obj) { return "expiresAt" in obj; }, get: function (obj) { return obj.expiresAt; }, set: function (obj, value) { obj.expiresAt = value; } }, metadata: _metadata }, _expiresAt_initializers, _expiresAt_extraInitializers);
        __esDecorate(null, null, _active_decorators, { kind: "field", name: "active", static: false, private: false, access: { has: function (obj) { return "active" in obj; }, get: function (obj) { return obj.active; }, set: function (obj, value) { obj.active = value; } }, metadata: _metadata }, _active_initializers, _active_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Promotion = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Promotion = _classThis;
}();
exports.Promotion = Promotion;
