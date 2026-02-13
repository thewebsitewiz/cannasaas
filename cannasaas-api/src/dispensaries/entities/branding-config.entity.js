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
exports.BrandingConfig = void 0;
var typeorm_1 = require("typeorm");
var typeorm_2 = require("typeorm");
var dispensary_entity_1 = require("./dispensary.entity");
var BrandingConfig = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('branding_configs')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _dispensaryId_decorators;
    var _dispensaryId_initializers = [];
    var _dispensaryId_extraInitializers = [];
    var _logoUrl_decorators;
    var _logoUrl_initializers = [];
    var _logoUrl_extraInitializers = [];
    var _logoDarkUrl_decorators;
    var _logoDarkUrl_initializers = [];
    var _logoDarkUrl_extraInitializers = [];
    var _faviconUrl_decorators;
    var _faviconUrl_initializers = [];
    var _faviconUrl_extraInitializers = [];
    var _primaryColor_decorators;
    var _primaryColor_initializers = [];
    var _primaryColor_extraInitializers = [];
    var _secondaryColor_decorators;
    var _secondaryColor_initializers = [];
    var _secondaryColor_extraInitializers = [];
    var _accentColor_decorators;
    var _accentColor_initializers = [];
    var _accentColor_extraInitializers = [];
    var _fontFamily_decorators;
    var _fontFamily_initializers = [];
    var _fontFamily_extraInitializers = [];
    var _customCss_decorators;
    var _customCss_initializers = [];
    var _customCss_extraInitializers = [];
    var _dispensary_decorators;
    var _dispensary_initializers = [];
    var _dispensary_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var BrandingConfig = _classThis = /** @class */ (function () {
        function BrandingConfig_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.dispensaryId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _dispensaryId_initializers, void 0));
            // Logo URLs
            this.logoUrl = (__runInitializers(this, _dispensaryId_extraInitializers), __runInitializers(this, _logoUrl_initializers, void 0));
            this.logoDarkUrl = (__runInitializers(this, _logoUrl_extraInitializers), __runInitializers(this, _logoDarkUrl_initializers, void 0));
            this.faviconUrl = (__runInitializers(this, _logoDarkUrl_extraInitializers), __runInitializers(this, _faviconUrl_initializers, void 0));
            // Colors
            this.primaryColor = (__runInitializers(this, _faviconUrl_extraInitializers), __runInitializers(this, _primaryColor_initializers, void 0));
            this.secondaryColor = (__runInitializers(this, _primaryColor_extraInitializers), __runInitializers(this, _secondaryColor_initializers, void 0));
            this.accentColor = (__runInitializers(this, _secondaryColor_extraInitializers), __runInitializers(this, _accentColor_initializers, void 0));
            // Typography
            this.fontFamily = (__runInitializers(this, _accentColor_extraInitializers), __runInitializers(this, _fontFamily_initializers, void 0));
            // Custom CSS
            this.customCss = (__runInitializers(this, _fontFamily_extraInitializers), __runInitializers(this, _customCss_initializers, void 0));
            this.dispensary = (__runInitializers(this, _customCss_extraInitializers), __runInitializers(this, _dispensary_initializers, void 0));
            this.createdAt = (__runInitializers(this, _dispensary_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
        return BrandingConfig_1;
    }());
    __setFunctionName(_classThis, "BrandingConfig");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_2.PrimaryGeneratedColumn)('uuid')];
        _dispensaryId_decorators = [(0, typeorm_1.Column)({ name: 'dispensary_id', type: 'uuid', unique: true })];
        _logoUrl_decorators = [(0, typeorm_1.Column)({ name: 'logo_url', length: 500, nullable: true })];
        _logoDarkUrl_decorators = [(0, typeorm_1.Column)({ name: 'logo_dark_url', length: 500, nullable: true })];
        _faviconUrl_decorators = [(0, typeorm_1.Column)({ name: 'favicon_url', length: 500, nullable: true })];
        _primaryColor_decorators = [(0, typeorm_1.Column)({ name: 'primary_color', length: 7, default: '#10b981' })];
        _secondaryColor_decorators = [(0, typeorm_1.Column)({ name: 'secondary_color', length: 7, default: '#3b82f6' })];
        _accentColor_decorators = [(0, typeorm_1.Column)({ name: 'accent_color', length: 7, default: '#8b5cf6' })];
        _fontFamily_decorators = [(0, typeorm_1.Column)({ name: 'font_family', length: 100, default: 'Inter' })];
        _customCss_decorators = [(0, typeorm_1.Column)({ name: 'custom_css', type: 'text', nullable: true })];
        _dispensary_decorators = [(0, typeorm_1.OneToOne)(function () { return dispensary_entity_1.Dispensary; }, function (dispensary) { return dispensary.branding; }), (0, typeorm_1.JoinColumn)({ name: 'dispensary_id' })];
        _createdAt_decorators = [(0, typeorm_2.CreateDateColumn)({ name: 'created_at' })];
        _updatedAt_decorators = [(0, typeorm_2.UpdateDateColumn)({ name: 'updated_at' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _dispensaryId_decorators, { kind: "field", name: "dispensaryId", static: false, private: false, access: { has: function (obj) { return "dispensaryId" in obj; }, get: function (obj) { return obj.dispensaryId; }, set: function (obj, value) { obj.dispensaryId = value; } }, metadata: _metadata }, _dispensaryId_initializers, _dispensaryId_extraInitializers);
        __esDecorate(null, null, _logoUrl_decorators, { kind: "field", name: "logoUrl", static: false, private: false, access: { has: function (obj) { return "logoUrl" in obj; }, get: function (obj) { return obj.logoUrl; }, set: function (obj, value) { obj.logoUrl = value; } }, metadata: _metadata }, _logoUrl_initializers, _logoUrl_extraInitializers);
        __esDecorate(null, null, _logoDarkUrl_decorators, { kind: "field", name: "logoDarkUrl", static: false, private: false, access: { has: function (obj) { return "logoDarkUrl" in obj; }, get: function (obj) { return obj.logoDarkUrl; }, set: function (obj, value) { obj.logoDarkUrl = value; } }, metadata: _metadata }, _logoDarkUrl_initializers, _logoDarkUrl_extraInitializers);
        __esDecorate(null, null, _faviconUrl_decorators, { kind: "field", name: "faviconUrl", static: false, private: false, access: { has: function (obj) { return "faviconUrl" in obj; }, get: function (obj) { return obj.faviconUrl; }, set: function (obj, value) { obj.faviconUrl = value; } }, metadata: _metadata }, _faviconUrl_initializers, _faviconUrl_extraInitializers);
        __esDecorate(null, null, _primaryColor_decorators, { kind: "field", name: "primaryColor", static: false, private: false, access: { has: function (obj) { return "primaryColor" in obj; }, get: function (obj) { return obj.primaryColor; }, set: function (obj, value) { obj.primaryColor = value; } }, metadata: _metadata }, _primaryColor_initializers, _primaryColor_extraInitializers);
        __esDecorate(null, null, _secondaryColor_decorators, { kind: "field", name: "secondaryColor", static: false, private: false, access: { has: function (obj) { return "secondaryColor" in obj; }, get: function (obj) { return obj.secondaryColor; }, set: function (obj, value) { obj.secondaryColor = value; } }, metadata: _metadata }, _secondaryColor_initializers, _secondaryColor_extraInitializers);
        __esDecorate(null, null, _accentColor_decorators, { kind: "field", name: "accentColor", static: false, private: false, access: { has: function (obj) { return "accentColor" in obj; }, get: function (obj) { return obj.accentColor; }, set: function (obj, value) { obj.accentColor = value; } }, metadata: _metadata }, _accentColor_initializers, _accentColor_extraInitializers);
        __esDecorate(null, null, _fontFamily_decorators, { kind: "field", name: "fontFamily", static: false, private: false, access: { has: function (obj) { return "fontFamily" in obj; }, get: function (obj) { return obj.fontFamily; }, set: function (obj, value) { obj.fontFamily = value; } }, metadata: _metadata }, _fontFamily_initializers, _fontFamily_extraInitializers);
        __esDecorate(null, null, _customCss_decorators, { kind: "field", name: "customCss", static: false, private: false, access: { has: function (obj) { return "customCss" in obj; }, get: function (obj) { return obj.customCss; }, set: function (obj, value) { obj.customCss = value; } }, metadata: _metadata }, _customCss_initializers, _customCss_extraInitializers);
        __esDecorate(null, null, _dispensary_decorators, { kind: "field", name: "dispensary", static: false, private: false, access: { has: function (obj) { return "dispensary" in obj; }, get: function (obj) { return obj.dispensary; }, set: function (obj, value) { obj.dispensary = value; } }, metadata: _metadata }, _dispensary_initializers, _dispensary_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BrandingConfig = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BrandingConfig = _classThis;
}();
exports.BrandingConfig = BrandingConfig;
