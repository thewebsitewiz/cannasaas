"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = exports.StrainType = exports.ProductType = void 0;
const typeorm_1 = require("typeorm");
const category_entity_1 = require("./category.entity");
const product_image_entity_1 = require("./product-image.entity");
const product_variant_entity_1 = require("./product-variant.entity");
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
aiDescription: string;
aiDescriptionGeneratedAt: Date;
terpenes: string[];
price: number;
var StrainType;
(function (StrainType) {
    StrainType["SATIVA"] = "sativa";
    StrainType["INDICA"] = "indica";
    StrainType["HYBRID"] = "hybrid";
    StrainType["CBD"] = "cbd";
})(StrainType || (exports.StrainType = StrainType = {}));
aiDescription: string;
aiDescriptionGeneratedAt: Date;
terpenes: string[];
price: number;
let Product = class Product {
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Product.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dispensary_id', type: 'uuid' }),
    __metadata("design:type", String)
], Product.prototype, "dispensaryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id', type: 'uuid' }),
    __metadata("design:type", String)
], Product.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Product.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'product_type',
        type: 'enum',
        enum: ProductType,
    }),
    __metadata("design:type", String)
], Product.prototype, "productType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'strain_type',
        type: 'enum',
        enum: StrainType,
        nullable: true,
    }),
    __metadata("design:type", String)
], Product.prototype, "strainType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'thc_content',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], Product.prototype, "thcContent", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'cbd_content',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], Product.prototype, "cbdContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "manufacturer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'license_number', length: 100, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "licenseNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'batch_number', length: 100, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "batchNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lab_tested', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Product.prototype, "labTested", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lab_results_url', length: 500, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "labResultsUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'meta_title', length: 255, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "metaTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'meta_description', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "metaDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Product.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_featured', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Product.prototype, "isFeatured", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, (category) => category.products),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", category_entity_1.Category)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_variant_entity_1.ProductVariant, (variant) => variant.product, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Product.prototype, "variants", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_image_entity_1.ProductImage, (image) => image.product, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Product.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Product.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Product.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "ai_description", type: "text", nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "aiDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "ai_description_generated_at", type: "timestamptz", nullable: true }),
    __metadata("design:type", Date)
], Product.prototype, "aiDescriptionGeneratedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-array", nullable: true }),
    __metadata("design:type", Array)
], Product.prototype, "terpenes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)('products'),
    (0, typeorm_1.Index)(['dispensaryId', 'slug'], { unique: true })
], Product);
//# sourceMappingURL=product.entity.js.map