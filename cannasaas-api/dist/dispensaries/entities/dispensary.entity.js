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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dispensary = void 0;
const typeorm_1 = require("typeorm");
const typeorm_2 = require("typeorm");
const company_entity_1 = require("../../companies/entities/company.entity");
const branding_config_entity_1 = require("./branding-config.entity");
let Dispensary = class Dispensary {
};
exports.Dispensary = Dispensary;
__decorate([
    (0, typeorm_2.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Dispensary.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], Dispensary.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Dispensary.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], Dispensary.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Dispensary.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'street_address', length: 255 }),
    __metadata("design:type", String)
], Dispensary.prototype, "streetAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Dispensary.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 2 }),
    __metadata("design:type", String)
], Dispensary.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'zip_code', length: 10 }),
    __metadata("design:type", String)
], Dispensary.prototype, "zipCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Dispensary.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Dispensary.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Dispensary.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phone_number', length: 20, nullable: true }),
    __metadata("design:type", String)
], Dispensary.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Dispensary.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Dispensary.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'operating_hours', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Dispensary.prototype, "operatingHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Dispensary.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => company_entity_1.Company, (company) => company.dispensaries),
    (0, typeorm_1.JoinColumn)({ name: 'company_id' }),
    __metadata("design:type", company_entity_1.Company)
], Dispensary.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => branding_config_entity_1.BrandingConfig, (branding) => branding.dispensary, {
        cascade: true,
    }),
    __metadata("design:type", branding_config_entity_1.BrandingConfig)
], Dispensary.prototype, "branding", void 0);
__decorate([
    (0, typeorm_2.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Dispensary.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_2.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Dispensary.prototype, "updatedAt", void 0);
exports.Dispensary = Dispensary = __decorate([
    (0, typeorm_1.Entity)('dispensaries')
], Dispensary);
//# sourceMappingURL=dispensary.entity.js.map