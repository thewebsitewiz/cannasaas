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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlag = exports.PLAN_FEATURES = exports.Plan = exports.Feature = void 0;
var typeorm_1 = require("typeorm");
var Feature;
(function (Feature) {
    Feature["MULTI_LOCATION"] = "multi_location";
    Feature["SUBSCRIPTION_ORDERS"] = "subscription_orders";
    Feature["LOYALTY_PROGRAM"] = "loyalty_program";
    Feature["AI_RECOMMENDATIONS"] = "ai_recommendations";
    Feature["AI_CHATBOT"] = "ai_chatbot";
    Feature["ADVANCED_ANALYTICS"] = "advanced_analytics";
    Feature["CUSTOM_DOMAIN"] = "custom_domain";
    Feature["API_ACCESS"] = "api_access";
    Feature["GIFT_CARDS"] = "gift_cards";
    Feature["DELIVERY_TRACKING"] = "delivery_tracking";
    Feature["METRC_INTEGRATION"] = "metrc_integration";
    Feature["WHITE_LABEL"] = "white_label";
    Feature["BULK_IMPORT"] = "bulk_import";
    Feature["MULTI_CURRENCY"] = "multi_currency";
})(Feature || (exports.Feature = Feature = {}));
var Plan;
(function (Plan) {
    Plan["STARTER"] = "starter";
    Plan["PROFESSIONAL"] = "professional";
    Plan["ENTERPRISE"] = "enterprise";
})(Plan || (exports.Plan = Plan = {}));
exports.PLAN_FEATURES = (_a = {},
    _a[Plan.STARTER] = [Feature.DELIVERY_TRACKING, Feature.GIFT_CARDS],
    _a[Plan.PROFESSIONAL] = [
        Feature.DELIVERY_TRACKING,
        Feature.GIFT_CARDS,
        Feature.MULTI_LOCATION,
        Feature.SUBSCRIPTION_ORDERS,
        Feature.LOYALTY_PROGRAM,
        Feature.AI_RECOMMENDATIONS,
        Feature.ADVANCED_ANALYTICS,
        Feature.BULK_IMPORT,
    ],
    _a[Plan.ENTERPRISE] = Object.values(Feature),
    _a);
var FeatureFlag = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('feature_flags'), (0, typeorm_1.Index)(['organizationId'])];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _organizationId_decorators;
    var _organizationId_initializers = [];
    var _organizationId_extraInitializers = [];
    var _plan_decorators;
    var _plan_initializers = [];
    var _plan_extraInitializers = [];
    var _overrides_decorators;
    var _overrides_initializers = [];
    var _overrides_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var FeatureFlag = _classThis = /** @class */ (function () {
        function FeatureFlag_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.organizationId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _organizationId_initializers, void 0));
            this.plan = (__runInitializers(this, _organizationId_extraInitializers), __runInitializers(this, _plan_initializers, void 0));
            this.overrides = (__runInitializers(this, _plan_extraInitializers), __runInitializers(this, _overrides_initializers, void 0));
            this.createdAt = (__runInitializers(this, _overrides_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
        return FeatureFlag_1;
    }());
    __setFunctionName(_classThis, "FeatureFlag");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _organizationId_decorators = [(0, typeorm_1.Column)('uuid')];
        _plan_decorators = [(0, typeorm_1.Column)({ type: 'enum', enum: Plan })];
        _overrides_decorators = [(0, typeorm_1.Column)({ type: 'jsonb', default: {} })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
        __esDecorate(null, null, _plan_decorators, { kind: "field", name: "plan", static: false, private: false, access: { has: function (obj) { return "plan" in obj; }, get: function (obj) { return obj.plan; }, set: function (obj, value) { obj.plan = value; } }, metadata: _metadata }, _plan_initializers, _plan_extraInitializers);
        __esDecorate(null, null, _overrides_decorators, { kind: "field", name: "overrides", static: false, private: false, access: { has: function (obj) { return "overrides" in obj; }, get: function (obj) { return obj.overrides; }, set: function (obj, value) { obj.overrides = value; } }, metadata: _metadata }, _overrides_initializers, _overrides_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FeatureFlag = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FeatureFlag = _classThis;
}();
exports.FeatureFlag = FeatureFlag;
