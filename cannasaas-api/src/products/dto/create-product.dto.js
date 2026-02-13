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
exports.CreateProductDto = exports.CreateVariantDto = void 0;
var class_validator_1 = require("class-validator");
var product_entity_1 = require("../entities/product.entity");
var class_transformer_1 = require("class-transformer");
var CreateVariantDto = function () {
    var _a;
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
    var _weight_decorators;
    var _weight_initializers = [];
    var _weight_extraInitializers = [];
    var _weightUnit_decorators;
    var _weightUnit_initializers = [];
    var _weightUnit_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateVariantDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.sku = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _sku_initializers, void 0));
                this.price = (__runInitializers(this, _sku_extraInitializers), __runInitializers(this, _price_initializers, void 0));
                this.compareAtPrice = (__runInitializers(this, _price_extraInitializers), __runInitializers(this, _compareAtPrice_initializers, void 0));
                this.quantity = (__runInitializers(this, _compareAtPrice_extraInitializers), __runInitializers(this, _quantity_initializers, void 0));
                this.weight = (__runInitializers(this, _quantity_extraInitializers), __runInitializers(this, _weight_initializers, void 0));
                this.weightUnit = (__runInitializers(this, _weight_extraInitializers), __runInitializers(this, _weightUnit_initializers, void 0));
                __runInitializers(this, _weightUnit_extraInitializers);
            }
            return CreateVariantDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1), (0, class_validator_1.MaxLength)(100)];
            _sku_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _price_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0)];
            _compareAtPrice_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0)];
            _quantity_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0)];
            _weight_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)()];
            _weightUnit_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _sku_decorators, { kind: "field", name: "sku", static: false, private: false, access: { has: function (obj) { return "sku" in obj; }, get: function (obj) { return obj.sku; }, set: function (obj, value) { obj.sku = value; } }, metadata: _metadata }, _sku_initializers, _sku_extraInitializers);
            __esDecorate(null, null, _price_decorators, { kind: "field", name: "price", static: false, private: false, access: { has: function (obj) { return "price" in obj; }, get: function (obj) { return obj.price; }, set: function (obj, value) { obj.price = value; } }, metadata: _metadata }, _price_initializers, _price_extraInitializers);
            __esDecorate(null, null, _compareAtPrice_decorators, { kind: "field", name: "compareAtPrice", static: false, private: false, access: { has: function (obj) { return "compareAtPrice" in obj; }, get: function (obj) { return obj.compareAtPrice; }, set: function (obj, value) { obj.compareAtPrice = value; } }, metadata: _metadata }, _compareAtPrice_initializers, _compareAtPrice_extraInitializers);
            __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: function (obj) { return "quantity" in obj; }, get: function (obj) { return obj.quantity; }, set: function (obj, value) { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
            __esDecorate(null, null, _weight_decorators, { kind: "field", name: "weight", static: false, private: false, access: { has: function (obj) { return "weight" in obj; }, get: function (obj) { return obj.weight; }, set: function (obj, value) { obj.weight = value; } }, metadata: _metadata }, _weight_initializers, _weight_extraInitializers);
            __esDecorate(null, null, _weightUnit_decorators, { kind: "field", name: "weightUnit", static: false, private: false, access: { has: function (obj) { return "weightUnit" in obj; }, get: function (obj) { return obj.weightUnit; }, set: function (obj, value) { obj.weightUnit = value; } }, metadata: _metadata }, _weightUnit_initializers, _weightUnit_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateVariantDto = CreateVariantDto;
var CreateProductDto = function () {
    var _a;
    var _dispensaryId_decorators;
    var _dispensaryId_initializers = [];
    var _dispensaryId_extraInitializers = [];
    var _categoryId_decorators;
    var _categoryId_initializers = [];
    var _categoryId_extraInitializers = [];
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _slug_decorators;
    var _slug_initializers = [];
    var _slug_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _productType_decorators;
    var _productType_initializers = [];
    var _productType_extraInitializers = [];
    var _strainType_decorators;
    var _strainType_initializers = [];
    var _strainType_extraInitializers = [];
    var _thcContent_decorators;
    var _thcContent_initializers = [];
    var _thcContent_extraInitializers = [];
    var _cbdContent_decorators;
    var _cbdContent_initializers = [];
    var _cbdContent_extraInitializers = [];
    var _brand_decorators;
    var _brand_initializers = [];
    var _brand_extraInitializers = [];
    var _manufacturer_decorators;
    var _manufacturer_initializers = [];
    var _manufacturer_extraInitializers = [];
    var _licenseNumber_decorators;
    var _licenseNumber_initializers = [];
    var _licenseNumber_extraInitializers = [];
    var _batchNumber_decorators;
    var _batchNumber_initializers = [];
    var _batchNumber_extraInitializers = [];
    var _labTested_decorators;
    var _labTested_initializers = [];
    var _labTested_extraInitializers = [];
    var _tags_decorators;
    var _tags_initializers = [];
    var _tags_extraInitializers = [];
    var _isFeatured_decorators;
    var _isFeatured_initializers = [];
    var _isFeatured_extraInitializers = [];
    var _variants_decorators;
    var _variants_initializers = [];
    var _variants_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateProductDto() {
                this.dispensaryId = __runInitializers(this, _dispensaryId_initializers, void 0);
                this.categoryId = (__runInitializers(this, _dispensaryId_extraInitializers), __runInitializers(this, _categoryId_initializers, void 0));
                this.name = (__runInitializers(this, _categoryId_extraInitializers), __runInitializers(this, _name_initializers, void 0));
                this.slug = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _slug_initializers, void 0));
                this.description = (__runInitializers(this, _slug_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.productType = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _productType_initializers, void 0));
                this.strainType = (__runInitializers(this, _productType_extraInitializers), __runInitializers(this, _strainType_initializers, void 0));
                this.thcContent = (__runInitializers(this, _strainType_extraInitializers), __runInitializers(this, _thcContent_initializers, void 0));
                this.cbdContent = (__runInitializers(this, _thcContent_extraInitializers), __runInitializers(this, _cbdContent_initializers, void 0));
                this.brand = (__runInitializers(this, _cbdContent_extraInitializers), __runInitializers(this, _brand_initializers, void 0));
                this.manufacturer = (__runInitializers(this, _brand_extraInitializers), __runInitializers(this, _manufacturer_initializers, void 0));
                this.licenseNumber = (__runInitializers(this, _manufacturer_extraInitializers), __runInitializers(this, _licenseNumber_initializers, void 0));
                this.batchNumber = (__runInitializers(this, _licenseNumber_extraInitializers), __runInitializers(this, _batchNumber_initializers, void 0));
                this.labTested = (__runInitializers(this, _batchNumber_extraInitializers), __runInitializers(this, _labTested_initializers, void 0));
                this.tags = (__runInitializers(this, _labTested_extraInitializers), __runInitializers(this, _tags_initializers, void 0));
                this.isFeatured = (__runInitializers(this, _tags_extraInitializers), __runInitializers(this, _isFeatured_initializers, void 0));
                this.variants = (__runInitializers(this, _isFeatured_extraInitializers), __runInitializers(this, _variants_initializers, void 0));
                __runInitializers(this, _variants_extraInitializers);
            }
            return CreateProductDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _dispensaryId_decorators = [(0, class_validator_1.IsUUID)()];
            _categoryId_decorators = [(0, class_validator_1.IsUUID)()];
            _name_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(255)];
            _slug_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(100), (0, class_validator_1.Matches)(/^[a-z0-9-]+$/)];
            _description_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _productType_decorators = [(0, class_validator_1.IsEnum)(product_entity_1.ProductType)];
            _strainType_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(product_entity_1.StrainType)];
            _thcContent_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(100)];
            _cbdContent_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(100)];
            _brand_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _manufacturer_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _licenseNumber_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _batchNumber_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _labTested_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _tags_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true })];
            _isFeatured_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _variants_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(function () { return CreateVariantDto; })];
            __esDecorate(null, null, _dispensaryId_decorators, { kind: "field", name: "dispensaryId", static: false, private: false, access: { has: function (obj) { return "dispensaryId" in obj; }, get: function (obj) { return obj.dispensaryId; }, set: function (obj, value) { obj.dispensaryId = value; } }, metadata: _metadata }, _dispensaryId_initializers, _dispensaryId_extraInitializers);
            __esDecorate(null, null, _categoryId_decorators, { kind: "field", name: "categoryId", static: false, private: false, access: { has: function (obj) { return "categoryId" in obj; }, get: function (obj) { return obj.categoryId; }, set: function (obj, value) { obj.categoryId = value; } }, metadata: _metadata }, _categoryId_initializers, _categoryId_extraInitializers);
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _slug_decorators, { kind: "field", name: "slug", static: false, private: false, access: { has: function (obj) { return "slug" in obj; }, get: function (obj) { return obj.slug; }, set: function (obj, value) { obj.slug = value; } }, metadata: _metadata }, _slug_initializers, _slug_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _productType_decorators, { kind: "field", name: "productType", static: false, private: false, access: { has: function (obj) { return "productType" in obj; }, get: function (obj) { return obj.productType; }, set: function (obj, value) { obj.productType = value; } }, metadata: _metadata }, _productType_initializers, _productType_extraInitializers);
            __esDecorate(null, null, _strainType_decorators, { kind: "field", name: "strainType", static: false, private: false, access: { has: function (obj) { return "strainType" in obj; }, get: function (obj) { return obj.strainType; }, set: function (obj, value) { obj.strainType = value; } }, metadata: _metadata }, _strainType_initializers, _strainType_extraInitializers);
            __esDecorate(null, null, _thcContent_decorators, { kind: "field", name: "thcContent", static: false, private: false, access: { has: function (obj) { return "thcContent" in obj; }, get: function (obj) { return obj.thcContent; }, set: function (obj, value) { obj.thcContent = value; } }, metadata: _metadata }, _thcContent_initializers, _thcContent_extraInitializers);
            __esDecorate(null, null, _cbdContent_decorators, { kind: "field", name: "cbdContent", static: false, private: false, access: { has: function (obj) { return "cbdContent" in obj; }, get: function (obj) { return obj.cbdContent; }, set: function (obj, value) { obj.cbdContent = value; } }, metadata: _metadata }, _cbdContent_initializers, _cbdContent_extraInitializers);
            __esDecorate(null, null, _brand_decorators, { kind: "field", name: "brand", static: false, private: false, access: { has: function (obj) { return "brand" in obj; }, get: function (obj) { return obj.brand; }, set: function (obj, value) { obj.brand = value; } }, metadata: _metadata }, _brand_initializers, _brand_extraInitializers);
            __esDecorate(null, null, _manufacturer_decorators, { kind: "field", name: "manufacturer", static: false, private: false, access: { has: function (obj) { return "manufacturer" in obj; }, get: function (obj) { return obj.manufacturer; }, set: function (obj, value) { obj.manufacturer = value; } }, metadata: _metadata }, _manufacturer_initializers, _manufacturer_extraInitializers);
            __esDecorate(null, null, _licenseNumber_decorators, { kind: "field", name: "licenseNumber", static: false, private: false, access: { has: function (obj) { return "licenseNumber" in obj; }, get: function (obj) { return obj.licenseNumber; }, set: function (obj, value) { obj.licenseNumber = value; } }, metadata: _metadata }, _licenseNumber_initializers, _licenseNumber_extraInitializers);
            __esDecorate(null, null, _batchNumber_decorators, { kind: "field", name: "batchNumber", static: false, private: false, access: { has: function (obj) { return "batchNumber" in obj; }, get: function (obj) { return obj.batchNumber; }, set: function (obj, value) { obj.batchNumber = value; } }, metadata: _metadata }, _batchNumber_initializers, _batchNumber_extraInitializers);
            __esDecorate(null, null, _labTested_decorators, { kind: "field", name: "labTested", static: false, private: false, access: { has: function (obj) { return "labTested" in obj; }, get: function (obj) { return obj.labTested; }, set: function (obj, value) { obj.labTested = value; } }, metadata: _metadata }, _labTested_initializers, _labTested_extraInitializers);
            __esDecorate(null, null, _tags_decorators, { kind: "field", name: "tags", static: false, private: false, access: { has: function (obj) { return "tags" in obj; }, get: function (obj) { return obj.tags; }, set: function (obj, value) { obj.tags = value; } }, metadata: _metadata }, _tags_initializers, _tags_extraInitializers);
            __esDecorate(null, null, _isFeatured_decorators, { kind: "field", name: "isFeatured", static: false, private: false, access: { has: function (obj) { return "isFeatured" in obj; }, get: function (obj) { return obj.isFeatured; }, set: function (obj, value) { obj.isFeatured = value; } }, metadata: _metadata }, _isFeatured_initializers, _isFeatured_extraInitializers);
            __esDecorate(null, null, _variants_decorators, { kind: "field", name: "variants", static: false, private: false, access: { has: function (obj) { return "variants" in obj; }, get: function (obj) { return obj.variants; }, set: function (obj, value) { obj.variants = value; } }, metadata: _metadata }, _variants_initializers, _variants_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateProductDto = CreateProductDto;
