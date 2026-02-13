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
exports.BrandingConfig = void 0;
const typeorm_1 = require("typeorm");
const typeorm_2 = require("typeorm");
const dispensary_entity_1 = require("./dispensary.entity");
let BrandingConfig = class BrandingConfig {
};
exports.BrandingConfig = BrandingConfig;
__decorate([
    (0, typeorm_2.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BrandingConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dispensary_id', type: 'uuid', unique: true }),
    __metadata("design:type", String)
], BrandingConfig.prototype, "dispensaryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logo_url', length: 500, nullable: true }),
    __metadata("design:type", String)
], BrandingConfig.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logo_dark_url', length: 500, nullable: true }),
    __metadata("design:type", String)
], BrandingConfig.prototype, "logoDarkUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'favicon_url', length: 500, nullable: true }),
    __metadata("design:type", String)
], BrandingConfig.prototype, "faviconUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'primary_color', length: 7, default: '#10b981' }),
    __metadata("design:type", String)
], BrandingConfig.prototype, "primaryColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'secondary_color', length: 7, default: '#3b82f6' }),
    __metadata("design:type", String)
], BrandingConfig.prototype, "secondaryColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'accent_color', length: 7, default: '#8b5cf6' }),
    __metadata("design:type", String)
], BrandingConfig.prototype, "accentColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'font_family', length: 100, default: 'Inter' }),
    __metadata("design:type", String)
], BrandingConfig.prototype, "fontFamily", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'custom_css', type: 'text', nullable: true }),
    __metadata("design:type", String)
], BrandingConfig.prototype, "customCss", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => dispensary_entity_1.Dispensary, (dispensary) => dispensary.branding),
    (0, typeorm_1.JoinColumn)({ name: 'dispensary_id' }),
    __metadata("design:type", dispensary_entity_1.Dispensary)
], BrandingConfig.prototype, "dispensary", void 0);
__decorate([
    (0, typeorm_2.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BrandingConfig.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_2.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BrandingConfig.prototype, "updatedAt", void 0);
exports.BrandingConfig = BrandingConfig = __decorate([
    (0, typeorm_1.Entity)('branding_configs')
], BrandingConfig);
//# sourceMappingURL=branding-config.entity.js.map