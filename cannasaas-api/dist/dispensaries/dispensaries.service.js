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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispensariesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const dispensary_entity_1 = require("./entities/dispensary.entity");
const branding_config_entity_1 = require("./entities/branding-config.entity");
let DispensariesService = class DispensariesService {
    constructor(dispensaryRepository, brandingRepository) {
        this.dispensaryRepository = dispensaryRepository;
        this.brandingRepository = brandingRepository;
    }
    async create(createDto) {
        const dispensary = this.dispensaryRepository.create({
            ...createDto,
            location: {
                type: 'Point',
                coordinates: [createDto.longitude, createDto.latitude],
            },
        });
        const savedDispensary = await this.dispensaryRepository.save(dispensary);
        const branding = this.brandingRepository.create({
            dispensaryId: savedDispensary.id,
        });
        await this.brandingRepository.save(branding);
        return this.findOne(savedDispensary.id);
    }
    async findAll(companyId) {
        const where = companyId ? { companyId } : {};
        return this.dispensaryRepository.find({
            where,
            relations: ['branding', 'company'],
        });
    }
    async findOne(id) {
        const dispensary = await this.dispensaryRepository.findOne({
            where: { id },
            relations: ['branding', 'company'],
        });
        if (!dispensary) {
            throw new common_1.NotFoundException(`Dispensary with ID ${id} not found`);
        }
        return dispensary;
    }
    async findNearby(latitude, longitude, radiusMiles = 10) {
        const radiusMeters = radiusMiles * 1609.34;
        const query = `
      SELECT * FROM dispensaries
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      AND is_active = true
      ORDER BY ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      )
    `;
        return this.dispensaryRepository.query(query, [
            longitude,
            latitude,
            radiusMeters,
        ]);
    }
    async update(id, updateDto) {
        const dispensary = await this.findOne(id);
        const updateData = { ...updateDto };
        if (updateDto.latitude && updateDto.longitude) {
            updateData.location = {
                type: 'Point',
                coordinates: [updateDto.longitude, updateDto.latitude],
            };
        }
        Object.assign(dispensary, updateData);
        await this.dispensaryRepository.save(dispensary);
        return this.findOne(id);
    }
    async remove(id) {
        const dispensary = await this.findOne(id);
        await this.dispensaryRepository.remove(dispensary);
    }
    async updateBranding(dispensaryId, updateDto) {
        const dispensary = await this.findOne(dispensaryId);
        if (!dispensary.branding) {
            const branding = this.brandingRepository.create({
                dispensaryId,
                ...updateDto,
            });
            return this.brandingRepository.save(branding);
        }
        Object.assign(dispensary.branding, updateDto);
        return this.brandingRepository.save(dispensary.branding);
    }
};
exports.DispensariesService = DispensariesService;
exports.DispensariesService = DispensariesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(dispensary_entity_1.Dispensary)),
    __param(1, (0, typeorm_1.InjectRepository)(branding_config_entity_1.BrandingConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DispensariesService);
//# sourceMappingURL=dispensaries.service.js.map