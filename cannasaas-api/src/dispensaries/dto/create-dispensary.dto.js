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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDispensaryDto = void 0;
var class_validator_1 = require("class-validator");
var CreateDispensaryDto = function () {
    var _a;
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
    return _a = /** @class */ (function () {
            function CreateDispensaryDto() {
                this.companyId = __runInitializers(this, _companyId_initializers, void 0);
                this.name = (__runInitializers(this, _companyId_extraInitializers), __runInitializers(this, _name_initializers, void 0));
                this.slug = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _slug_initializers, void 0));
                this.description = (__runInitializers(this, _slug_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.streetAddress = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _streetAddress_initializers, void 0));
                this.city = (__runInitializers(this, _streetAddress_extraInitializers), __runInitializers(this, _city_initializers, void 0));
                this.state = (__runInitializers(this, _city_extraInitializers), __runInitializers(this, _state_initializers, void 0));
                this.zipCode = (__runInitializers(this, _state_extraInitializers), __runInitializers(this, _zipCode_initializers, void 0));
                this.latitude = (__runInitializers(this, _zipCode_extraInitializers), __runInitializers(this, _latitude_initializers, void 0));
                this.longitude = (__runInitializers(this, _latitude_extraInitializers), __runInitializers(this, _longitude_initializers, void 0));
                this.phoneNumber = (__runInitializers(this, _longitude_extraInitializers), __runInitializers(this, _phoneNumber_initializers, void 0));
                this.email = (__runInitializers(this, _phoneNumber_extraInitializers), __runInitializers(this, _email_initializers, void 0));
                this.website = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _website_initializers, void 0));
                this.operatingHours = (__runInitializers(this, _website_extraInitializers), __runInitializers(this, _operatingHours_initializers, void 0));
                __runInitializers(this, _operatingHours_extraInitializers);
            }
            return CreateDispensaryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _companyId_decorators = [(0, class_validator_1.IsUUID)()];
            _name_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(255)];
            _slug_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(100), (0, class_validator_1.Matches)(/^[a-z0-9-]+$/)];
            _description_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _streetAddress_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(5), (0, class_validator_1.MaxLength)(255)];
            _city_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(100)];
            _state_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(2), (0, class_validator_1.Matches)(/^[A-Z]{2}$/)];
            _zipCode_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(5), (0, class_validator_1.MaxLength)(10), (0, class_validator_1.Matches)(/^\d{5}(-\d{4})?$/)];
            _latitude_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(-90), (0, class_validator_1.Max)(90)];
            _longitude_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(-180), (0, class_validator_1.Max)(180)];
            _phoneNumber_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Matches)(/^\+?[1-9]\d{1,14}$/)];
            _email_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEmail)()];
            _website_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _operatingHours_decorators = [(0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _companyId_decorators, { kind: "field", name: "companyId", static: false, private: false, access: { has: function (obj) { return "companyId" in obj; }, get: function (obj) { return obj.companyId; }, set: function (obj, value) { obj.companyId = value; } }, metadata: _metadata }, _companyId_initializers, _companyId_extraInitializers);
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _slug_decorators, { kind: "field", name: "slug", static: false, private: false, access: { has: function (obj) { return "slug" in obj; }, get: function (obj) { return obj.slug; }, set: function (obj, value) { obj.slug = value; } }, metadata: _metadata }, _slug_initializers, _slug_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _streetAddress_decorators, { kind: "field", name: "streetAddress", static: false, private: false, access: { has: function (obj) { return "streetAddress" in obj; }, get: function (obj) { return obj.streetAddress; }, set: function (obj, value) { obj.streetAddress = value; } }, metadata: _metadata }, _streetAddress_initializers, _streetAddress_extraInitializers);
            __esDecorate(null, null, _city_decorators, { kind: "field", name: "city", static: false, private: false, access: { has: function (obj) { return "city" in obj; }, get: function (obj) { return obj.city; }, set: function (obj, value) { obj.city = value; } }, metadata: _metadata }, _city_initializers, _city_extraInitializers);
            __esDecorate(null, null, _state_decorators, { kind: "field", name: "state", static: false, private: false, access: { has: function (obj) { return "state" in obj; }, get: function (obj) { return obj.state; }, set: function (obj, value) { obj.state = value; } }, metadata: _metadata }, _state_initializers, _state_extraInitializers);
            __esDecorate(null, null, _zipCode_decorators, { kind: "field", name: "zipCode", static: false, private: false, access: { has: function (obj) { return "zipCode" in obj; }, get: function (obj) { return obj.zipCode; }, set: function (obj, value) { obj.zipCode = value; } }, metadata: _metadata }, _zipCode_initializers, _zipCode_extraInitializers);
            __esDecorate(null, null, _latitude_decorators, { kind: "field", name: "latitude", static: false, private: false, access: { has: function (obj) { return "latitude" in obj; }, get: function (obj) { return obj.latitude; }, set: function (obj, value) { obj.latitude = value; } }, metadata: _metadata }, _latitude_initializers, _latitude_extraInitializers);
            __esDecorate(null, null, _longitude_decorators, { kind: "field", name: "longitude", static: false, private: false, access: { has: function (obj) { return "longitude" in obj; }, get: function (obj) { return obj.longitude; }, set: function (obj, value) { obj.longitude = value; } }, metadata: _metadata }, _longitude_initializers, _longitude_extraInitializers);
            __esDecorate(null, null, _phoneNumber_decorators, { kind: "field", name: "phoneNumber", static: false, private: false, access: { has: function (obj) { return "phoneNumber" in obj; }, get: function (obj) { return obj.phoneNumber; }, set: function (obj, value) { obj.phoneNumber = value; } }, metadata: _metadata }, _phoneNumber_initializers, _phoneNumber_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: function (obj) { return "email" in obj; }, get: function (obj) { return obj.email; }, set: function (obj, value) { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _website_decorators, { kind: "field", name: "website", static: false, private: false, access: { has: function (obj) { return "website" in obj; }, get: function (obj) { return obj.website; }, set: function (obj, value) { obj.website = value; } }, metadata: _metadata }, _website_initializers, _website_extraInitializers);
            __esDecorate(null, null, _operatingHours_decorators, { kind: "field", name: "operatingHours", static: false, private: false, access: { has: function (obj) { return "operatingHours" in obj; }, get: function (obj) { return obj.operatingHours; }, set: function (obj, value) { obj.operatingHours = value; } }, metadata: _metadata }, _operatingHours_initializers, _operatingHours_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateDispensaryDto = CreateDispensaryDto;
