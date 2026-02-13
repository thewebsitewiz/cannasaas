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
exports.Product = exports.StrainType = exports.ProductType = void 0;
var typeorm_1 = require("typeorm");
var category_entity_1 = require("./category.entity");
var product_image_entity_1 = require("./product-image.entity");
var product_variant_entity_1 = require("./product-variant.entity");
var ProductType;
(function (ProductType) {
    ProductType["FLOWER"] = "flower";
    ProductType["EDIBLE"] = "edible";
    ProductType["CONCENTRATE"] = "concentrate";
    ProductType["VAPE"] = "vape";
    ProductType["TOPICAL"] = "topical";
    ProductType["TINCTURE"] = "tincture";
    ProductType["PRE_ROLL"] = "pre_roll";
    ProductType["ACCESSORY"] = "accessory";
})(ProductType || (exports.ProductType = ProductType = {}));
var StrainType;
(function (StrainType) {
    StrainType["SATIVA"] = "sativa";
    StrainType["INDICA"] = "indica";
    StrainType["HYBRID"] = "hybrid";
    StrainType["CBD"] = "cbd";
})(StrainType || (exports.StrainType = StrainType = {}));
var Product = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('products'), (0, typeorm_1.Index)(['dispensaryId', 'slug'], { unique: true })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
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
    var _labResultsUrl_decorators;
    var _labResultsUrl_initializers = [];
    var _labResultsUrl_extraInitializers = [];
    var _metaTitle_decorators;
    var _metaTitle_initializers = [];
    var _metaTitle_extraInitializers = [];
    var _metaDescription_decorators;
    var _metaDescription_initializers = [];
    var _metaDescription_extraInitializers = [];
    var _tags_decorators;
    var _tags_initializers = [];
    var _tags_extraInitializers = [];
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    var _isFeatured_decorators;
    var _isFeatured_initializers = [];
    var _isFeatured_extraInitializers = [];
    var _category_decorators;
    var _category_initializers = [];
    var _category_extraInitializers = [];
    var _variants_decorators;
    var _variants_initializers = [];
    var _variants_extraInitializers = [];
    var _images_decorators;
    var _images_initializers = [];
    var _images_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var Product = _classThis = /** @class */ (function () {
        function Product_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.dispensaryId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _dispensaryId_initializers, void 0));
            this.categoryId = (__runInitializers(this, _dispensaryId_extraInitializers), __runInitializers(this, _categoryId_initializers, void 0));
            this.name = (__runInitializers(this, _categoryId_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.slug = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _slug_initializers, void 0));
            this.description = (__runInitializers(this, _slug_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.productType = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _productType_initializers, void 0));
            this.strainType = (__runInitializers(this, _productType_extraInitializers), __runInitializers(this, _strainType_initializers, void 0));
            // Cannabis-specific fields
            this.thcContent = (__runInitializers(this, _strainType_extraInitializers), __runInitializers(this, _thcContent_initializers, void 0));
            this.cbdContent = (__runInitializers(this, _thcContent_extraInitializers), __runInitializers(this, _cbdContent_initializers, void 0));
            this.brand = (__runInitializers(this, _cbdContent_extraInitializers), __runInitializers(this, _brand_initializers, void 0));
            this.manufacturer = (__runInitializers(this, _brand_extraInitializers), __runInitializers(this, _manufacturer_initializers, void 0));
            // Compliance fields (critical for cannabis)
            this.licenseNumber = (__runInitializers(this, _manufacturer_extraInitializers), __runInitializers(this, _licenseNumber_initializers, void 0));
            this.batchNumber = (__runInitializers(this, _licenseNumber_extraInitializers), __runInitializers(this, _batchNumber_initializers, void 0));
            this.labTested = (__runInitializers(this, _batchNumber_extraInitializers), __runInitializers(this, _labTested_initializers, void 0));
            this.labResultsUrl = (__runInitializers(this, _labTested_extraInitializers), __runInitializers(this, _labResultsUrl_initializers, void 0));
            // SEO / Display
            this.metaTitle = (__runInitializers(this, _labResultsUrl_extraInitializers), __runInitializers(this, _metaTitle_initializers, void 0));
            this.metaDescription = (__runInitializers(this, _metaTitle_extraInitializers), __runInitializers(this, _metaDescription_initializers, void 0));
            this.tags = (__runInitializers(this, _metaDescription_extraInitializers), __runInitializers(this, _tags_initializers, void 0));
            this.isActive = (__runInitializers(this, _tags_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
            this.isFeatured = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _isFeatured_initializers, void 0));
            this.category = (__runInitializers(this, _isFeatured_extraInitializers), __runInitializers(this, _category_initializers, void 0));
            this.variants = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _variants_initializers, void 0));
            this.images = (__runInitializers(this, _variants_extraInitializers), __runInitializers(this, _images_initializers, void 0));
            this.createdAt = (__runInitializers(this, _images_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
        return Product_1;
    }());
    __setFunctionName(_classThis, "Product");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _dispensaryId_decorators = [(0, typeorm_1.Column)({ name: 'dispensary_id', type: 'uuid' })];
        _categoryId_decorators = [(0, typeorm_1.Column)({ name: 'category_id', type: 'uuid' })];
        _name_decorators = [(0, typeorm_1.Column)({ length: 255 })];
        _slug_decorators = [(0, typeorm_1.Column)({ length: 100 })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _productType_decorators = [(0, typeorm_1.Column)({
                name: 'product_type',
                type: 'enum',
                enum: ProductType,
            })];
        _strainType_decorators = [(0, typeorm_1.Column)({
                name: 'strain_type',
                type: 'enum',
                enum: StrainType,
                nullable: true,
            })];
        _thcContent_decorators = [(0, typeorm_1.Column)({
                name: 'thc_content',
                type: 'decimal',
                precision: 5,
                scale: 2,
                nullable: true,
            })];
        _cbdContent_decorators = [(0, typeorm_1.Column)({
                name: 'cbd_content',
                type: 'decimal',
                precision: 5,
                scale: 2,
                nullable: true,
            })];
        _brand_decorators = [(0, typeorm_1.Column)({ length: 255, nullable: true })];
        _manufacturer_decorators = [(0, typeorm_1.Column)({ length: 255, nullable: true })];
        _licenseNumber_decorators = [(0, typeorm_1.Column)({ name: 'license_number', length: 100, nullable: true })];
        _batchNumber_decorators = [(0, typeorm_1.Column)({ name: 'batch_number', length: 100, nullable: true })];
        _labTested_decorators = [(0, typeorm_1.Column)({ name: 'lab_tested', type: 'boolean', default: false })];
        _labResultsUrl_decorators = [(0, typeorm_1.Column)({ name: 'lab_results_url', length: 500, nullable: true })];
        _metaTitle_decorators = [(0, typeorm_1.Column)({ name: 'meta_title', length: 255, nullable: true })];
        _metaDescription_decorators = [(0, typeorm_1.Column)({ name: 'meta_description', type: 'text', nullable: true })];
        _tags_decorators = [(0, typeorm_1.Column)({ type: 'simple-array', nullable: true })];
        _isActive_decorators = [(0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true })];
        _isFeatured_decorators = [(0, typeorm_1.Column)({ name: 'is_featured', type: 'boolean', default: false })];
        _category_decorators = [(0, typeorm_1.ManyToOne)(function () { return category_entity_1.Category; }, function (category) { return category.products; }), (0, typeorm_1.JoinColumn)({ name: 'category_id' })];
        _variants_decorators = [(0, typeorm_1.OneToMany)(function () { return product_variant_entity_1.ProductVariant; }, function (variant) { return variant.product; }, {
                cascade: true,
            })];
        _images_decorators = [(0, typeorm_1.OneToMany)(function () { return product_image_entity_1.ProductImage; }, function (image) { return image.product; }, {
                cascade: true,
            })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' })];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
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
        __esDecorate(null, null, _labResultsUrl_decorators, { kind: "field", name: "labResultsUrl", static: false, private: false, access: { has: function (obj) { return "labResultsUrl" in obj; }, get: function (obj) { return obj.labResultsUrl; }, set: function (obj, value) { obj.labResultsUrl = value; } }, metadata: _metadata }, _labResultsUrl_initializers, _labResultsUrl_extraInitializers);
        __esDecorate(null, null, _metaTitle_decorators, { kind: "field", name: "metaTitle", static: false, private: false, access: { has: function (obj) { return "metaTitle" in obj; }, get: function (obj) { return obj.metaTitle; }, set: function (obj, value) { obj.metaTitle = value; } }, metadata: _metadata }, _metaTitle_initializers, _metaTitle_extraInitializers);
        __esDecorate(null, null, _metaDescription_decorators, { kind: "field", name: "metaDescription", static: false, private: false, access: { has: function (obj) { return "metaDescription" in obj; }, get: function (obj) { return obj.metaDescription; }, set: function (obj, value) { obj.metaDescription = value; } }, metadata: _metadata }, _metaDescription_initializers, _metaDescription_extraInitializers);
        __esDecorate(null, null, _tags_decorators, { kind: "field", name: "tags", static: false, private: false, access: { has: function (obj) { return "tags" in obj; }, get: function (obj) { return obj.tags; }, set: function (obj, value) { obj.tags = value; } }, metadata: _metadata }, _tags_initializers, _tags_extraInitializers);
        __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
        __esDecorate(null, null, _isFeatured_decorators, { kind: "field", name: "isFeatured", static: false, private: false, access: { has: function (obj) { return "isFeatured" in obj; }, get: function (obj) { return obj.isFeatured; }, set: function (obj, value) { obj.isFeatured = value; } }, metadata: _metadata }, _isFeatured_initializers, _isFeatured_extraInitializers);
        __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: function (obj) { return "category" in obj; }, get: function (obj) { return obj.category; }, set: function (obj, value) { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
        __esDecorate(null, null, _variants_decorators, { kind: "field", name: "variants", static: false, private: false, access: { has: function (obj) { return "variants" in obj; }, get: function (obj) { return obj.variants; }, set: function (obj, value) { obj.variants = value; } }, metadata: _metadata }, _variants_initializers, _variants_extraInitializers);
        __esDecorate(null, null, _images_decorators, { kind: "field", name: "images", static: false, private: false, access: { has: function (obj) { return "images" in obj; }, get: function (obj) { return obj.images; }, set: function (obj, value) { obj.images = value; } }, metadata: _metadata }, _images_initializers, _images_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Product = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Product = _classThis;
}();
exports.Product = Product;
