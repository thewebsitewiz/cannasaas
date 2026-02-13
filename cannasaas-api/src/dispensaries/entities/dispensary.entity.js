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
exports.Dispensary = void 0;
var typeorm_1 = require("typeorm");
var typeorm_2 = require("typeorm");
var company_entity_1 = require("../../companies/entities/company.entity");
var branding_config_entity_1 = require("./branding-config.entity");
var Dispensary = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('dispensaries')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _companyId_decorators;
    var _companyId_initializers = [];
    var _companyId_extraInitializers = [];
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _slug_decorators;
    var _slug_initializers = [];
    var _slug_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _streetAddress_decorators;
    var _streetAddress_initializers = [];
    var _streetAddress_extraInitializers = [];
    var _city_decorators;
    var _city_initializers = [];
    var _city_extraInitializers = [];
    var _state_decorators;
    var _state_initializers = [];
    var _state_extraInitializers = [];
    var _zipCode_decorators;
    var _zipCode_initializers = [];
    var _zipCode_extraInitializers = [];
    var _location_decorators;
    var _location_initializers = [];
    var _location_extraInitializers = [];
    var _latitude_decorators;
    var _latitude_initializers = [];
    var _latitude_extraInitializers = [];
    var _longitude_decorators;
    var _longitude_initializers = [];
    var _longitude_extraInitializers = [];
    var _phoneNumber_decorators;
    var _phoneNumber_initializers = [];
    var _phoneNumber_extraInitializers = [];
    var _email_decorators;
    var _email_initializers = [];
    var _email_extraInitializers = [];
    var _website_decorators;
    var _website_initializers = [];
    var _website_extraInitializers = [];
    var _operatingHours_decorators;
    var _operatingHours_initializers = [];
    var _operatingHours_extraInitializers = [];
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    var _company_decorators;
    var _company_initializers = [];
    var _company_extraInitializers = [];
    var _branding_decorators;
    var _branding_initializers = [];
    var _branding_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var Dispensary = _classThis = /** @class */ (function () {
        function Dispensary_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.companyId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _companyId_initializers, void 0));
            this.name = (__runInitializers(this, _companyId_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.slug = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _slug_initializers, void 0));
            this.description = (__runInitializers(this, _slug_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            // Address fields
            this.streetAddress = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _streetAddress_initializers, void 0));
            this.city = (__runInitializers(this, _streetAddress_extraInitializers), __runInitializers(this, _city_initializers, void 0));
            this.state = (__runInitializers(this, _city_extraInitializers), __runInitializers(this, _state_initializers, void 0));
            this.zipCode = (__runInitializers(this, _state_extraInitializers), __runInitializers(this, _zipCode_initializers, void 0));
            // Geospatial location
            this.location = (__runInitializers(this, _zipCode_extraInitializers), __runInitializers(this, _location_initializers, void 0));
            this.latitude = (__runInitializers(this, _location_extraInitializers), __runInitializers(this, _latitude_initializers, void 0));
            this.longitude = (__runInitializers(this, _latitude_extraInitializers), __runInitializers(this, _longitude_initializers, void 0));
            // Contact
            this.phoneNumber = (__runInitializers(this, _longitude_extraInitializers), __runInitializers(this, _phoneNumber_initializers, void 0));
            this.email = (__runInitializers(this, _phoneNumber_extraInitializers), __runInitializers(this, _email_initializers, void 0));
            this.website = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _website_initializers, void 0));
            // Operating hours
            this.operatingHours = (__runInitializers(this, _website_extraInitializers), __runInitializers(this, _operatingHours_initializers, void 0));
            this.isActive = (__runInitializers(this, _operatingHours_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
            this.company = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _company_initializers, void 0));
            this.branding = (__runInitializers(this, _company_extraInitializers), __runInitializers(this, _branding_initializers, void 0));
            this.createdAt = (__runInitializers(this, _branding_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
        return Dispensary_1;
    }());
    __setFunctionName(_classThis, "Dispensary");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_2.PrimaryGeneratedColumn)('uuid')];
        _companyId_decorators = [(0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' })];
        _name_decorators = [(0, typeorm_1.Column)({ length: 255 })];
        _slug_decorators = [(0, typeorm_1.Column)({ length: 100, unique: true })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _streetAddress_decorators = [(0, typeorm_1.Column)({ name: 'street_address', length: 255 })];
        _city_decorators = [(0, typeorm_1.Column)({ length: 100 })];
        _state_decorators = [(0, typeorm_1.Column)({ length: 2 })];
        _zipCode_decorators = [(0, typeorm_1.Column)({ name: 'zip_code', length: 10 })];
        _location_decorators = [(0, typeorm_1.Column)({
                type: 'geography',
                spatialFeatureType: 'Point',
                srid: 4326,
                nullable: true,
            })];
        _latitude_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true })];
        _longitude_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true })];
        _phoneNumber_decorators = [(0, typeorm_1.Column)({ name: 'phone_number', length: 20, nullable: true })];
        _email_decorators = [(0, typeorm_1.Column)({ length: 255, nullable: true })];
        _website_decorators = [(0, typeorm_1.Column)({ length: 255, nullable: true })];
        _operatingHours_decorators = [(0, typeorm_1.Column)({ name: 'operating_hours', type: 'jsonb', nullable: true })];
        _isActive_decorators = [(0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true })];
        _company_decorators = [(0, typeorm_1.ManyToOne)(function () { return company_entity_1.Company; }, function (company) { return company.dispensaries; }), (0, typeorm_1.JoinColumn)({ name: 'company_id' })];
        _branding_decorators = [(0, typeorm_1.OneToOne)(function () { return branding_config_entity_1.BrandingConfig; }, function (branding) { return branding.dispensary; }, {
                cascade: true,
            })];
        _createdAt_decorators = [(0, typeorm_2.CreateDateColumn)({ name: 'created_at' })];
        _updatedAt_decorators = [(0, typeorm_2.UpdateDateColumn)({ name: 'updated_at' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _companyId_decorators, { kind: "field", name: "companyId", static: false, private: false, access: { has: function (obj) { return "companyId" in obj; }, get: function (obj) { return obj.companyId; }, set: function (obj, value) { obj.companyId = value; } }, metadata: _metadata }, _companyId_initializers, _companyId_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _slug_decorators, { kind: "field", name: "slug", static: false, private: false, access: { has: function (obj) { return "slug" in obj; }, get: function (obj) { return obj.slug; }, set: function (obj, value) { obj.slug = value; } }, metadata: _metadata }, _slug_initializers, _slug_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _streetAddress_decorators, { kind: "field", name: "streetAddress", static: false, private: false, access: { has: function (obj) { return "streetAddress" in obj; }, get: function (obj) { return obj.streetAddress; }, set: function (obj, value) { obj.streetAddress = value; } }, metadata: _metadata }, _streetAddress_initializers, _streetAddress_extraInitializers);
        __esDecorate(null, null, _city_decorators, { kind: "field", name: "city", static: false, private: false, access: { has: function (obj) { return "city" in obj; }, get: function (obj) { return obj.city; }, set: function (obj, value) { obj.city = value; } }, metadata: _metadata }, _city_initializers, _city_extraInitializers);
        __esDecorate(null, null, _state_decorators, { kind: "field", name: "state", static: false, private: false, access: { has: function (obj) { return "state" in obj; }, get: function (obj) { return obj.state; }, set: function (obj, value) { obj.state = value; } }, metadata: _metadata }, _state_initializers, _state_extraInitializers);
        __esDecorate(null, null, _zipCode_decorators, { kind: "field", name: "zipCode", static: false, private: false, access: { has: function (obj) { return "zipCode" in obj; }, get: function (obj) { return obj.zipCode; }, set: function (obj, value) { obj.zipCode = value; } }, metadata: _metadata }, _zipCode_initializers, _zipCode_extraInitializers);
        __esDecorate(null, null, _location_decorators, { kind: "field", name: "location", static: false, private: false, access: { has: function (obj) { return "location" in obj; }, get: function (obj) { return obj.location; }, set: function (obj, value) { obj.location = value; } }, metadata: _metadata }, _location_initializers, _location_extraInitializers);
        __esDecorate(null, null, _latitude_decorators, { kind: "field", name: "latitude", static: false, private: false, access: { has: function (obj) { return "latitude" in obj; }, get: function (obj) { return obj.latitude; }, set: function (obj, value) { obj.latitude = value; } }, metadata: _metadata }, _latitude_initializers, _latitude_extraInitializers);
        __esDecorate(null, null, _longitude_decorators, { kind: "field", name: "longitude", static: false, private: false, access: { has: function (obj) { return "longitude" in obj; }, get: function (obj) { return obj.longitude; }, set: function (obj, value) { obj.longitude = value; } }, metadata: _metadata }, _longitude_initializers, _longitude_extraInitializers);
        __esDecorate(null, null, _phoneNumber_decorators, { kind: "field", name: "phoneNumber", static: false, private: false, access: { has: function (obj) { return "phoneNumber" in obj; }, get: function (obj) { return obj.phoneNumber; }, set: function (obj, value) { obj.phoneNumber = value; } }, metadata: _metadata }, _phoneNumber_initializers, _phoneNumber_extraInitializers);
        __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: function (obj) { return "email" in obj; }, get: function (obj) { return obj.email; }, set: function (obj, value) { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
        __esDecorate(null, null, _website_decorators, { kind: "field", name: "website", static: false, private: false, access: { has: function (obj) { return "website" in obj; }, get: function (obj) { return obj.website; }, set: function (obj, value) { obj.website = value; } }, metadata: _metadata }, _website_initializers, _website_extraInitializers);
        __esDecorate(null, null, _operatingHours_decorators, { kind: "field", name: "operatingHours", static: false, private: false, access: { has: function (obj) { return "operatingHours" in obj; }, get: function (obj) { return obj.operatingHours; }, set: function (obj, value) { obj.operatingHours = value; } }, metadata: _metadata }, _operatingHours_initializers, _operatingHours_extraInitializers);
        __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
        __esDecorate(null, null, _company_decorators, { kind: "field", name: "company", static: false, private: false, access: { has: function (obj) { return "company" in obj; }, get: function (obj) { return obj.company; }, set: function (obj, value) { obj.company = value; } }, metadata: _metadata }, _company_initializers, _company_extraInitializers);
        __esDecorate(null, null, _branding_decorators, { kind: "field", name: "branding", static: false, private: false, access: { has: function (obj) { return "branding" in obj; }, get: function (obj) { return obj.branding; }, set: function (obj, value) { obj.branding = value; } }, metadata: _metadata }, _branding_initializers, _branding_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Dispensary = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Dispensary = _classThis;
}();
exports.Dispensary = Dispensary;
