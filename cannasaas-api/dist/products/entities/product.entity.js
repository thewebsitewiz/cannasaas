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
const base_entity_1 = require("../../common/entities/base.entity");
const organization_entity_1 = require("../../organizations/entities/organization.entity");
const product_variant_entity_1 = require("./product-variant.entity");
const product_image_entity_1 = require("./product-image.entity");
var ProductType;
(function (ProductType) {
    ProductType["FLOWER"] = "flower";
    ProductType["PRE_ROLLS"] = "pre_rolls";
    ProductType["VAPES"] = "vapes";
    ProductType["EDIBLES"] = "edibles";
    ProductType["CONCENTRATES"] = "concentrates";
    ProductType["TINCTURES"] = "tinctures";
    ProductType["TOPICALS"] = "topicals";
    ProductType["ACCESSORIES"] = "accessories";
    ProductType["APPAREL"] = "apparel";
    ProductType["OTHER"] = "other";
})(ProductType || (exports.ProductType = ProductType = {}));
var StrainType;
(function (StrainType) {
    StrainType["SATIVA"] = "sativa";
    StrainType["INDICA"] = "indica";
    StrainType["HYBRID"] = "hybrid";
    StrainType["SATIVA_DOMINANT"] = "sativa_dominant";
    StrainType["INDICA_DOMINANT"] = "indica_dominant";
})(StrainType || (exports.StrainType = StrainType = {}));
let Product = class Product extends base_entity_1.TenantBaseEntity {
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Product.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'short_description', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "shortDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'long_description', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "longDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_description', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "aiDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_description_generated_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Product.prototype, "aiDescriptionGeneratedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [
            'flower', 'pre_rolls', 'vapes', 'edibles', 'concentrates',
            'tinctures', 'topicals', 'accessories', 'apparel', 'other',
        ],
        default: 'flower',
    }),
    __metadata("design:type", String)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "subcategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Product.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'cannabis_info', default: {} }),
    __metadata("design:type", Object)
], Product.prototype, "cannabisInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Product.prototype, "terpenes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "seo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'review_count', default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "reviewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "averageRating", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['draft', 'active', 'archived', 'out_of_stock'],
        default: 'draft',
    }),
    __metadata("design:type", String)
], Product.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Product.prototype, "featured", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_featured', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Product.prototype, "isFeatured", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Product.prototype, "badges", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Product.prototype, "analytics", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'organization_id' }),
    __metadata("design:type", organization_entity_1.Organization)
], Product.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dispensary_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "dispensaryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_type', length: 50, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "productType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'strain_type', length: 50, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "strainType", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_variant_entity_1.ProductVariant, (variant) => variant.product, {
        cascade: true,
        eager: true,
    }),
    __metadata("design:type", Array)
], Product.prototype, "variants", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_image_entity_1.ProductImage, (image) => image.product, {
        cascade: true,
        eager: true,
    }),
    __metadata("design:type", Array)
], Product.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thc_content', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Product.prototype, "thcContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cbd_content', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Product.prototype, "cbdContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "manufacturer", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)('products'),
    (0, typeorm_1.Index)(['organizationId', 'slug'], { unique: true }),
    (0, typeorm_1.Index)(['organizationId', 'status']),
    (0, typeorm_1.Index)(['organizationId', 'category'])
], Product);
//# sourceMappingURL=product.entity.js.map