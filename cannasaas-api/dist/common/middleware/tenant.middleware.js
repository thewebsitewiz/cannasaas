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
exports.TenantMiddleware = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tenant_entity_1 = require("../../tenants/entities/tenant.entity");
const tenant_service_1 = require("../tenant/tenant.service");
let TenantMiddleware = class TenantMiddleware {
    constructor(tenantRepository, tenantService) {
        this.tenantRepository = tenantRepository;
        this.tenantService = tenantService;
    }
    async use(req, res, next) {
        if (req.method === "OPTIONS") {
            next();
            return;
        }
        const headerTenantId = req.headers['x-tenant-id'];
        const subdomain = this.extractSubdomain(req.hostname);
        console.log('🔍 Middleware hit:', { headerTenantId, subdomain });
        let tenant = null;
        if (headerTenantId) {
            const rawResult = await this.tenantRepository.query(`SELECT * FROM tenants WHERE subdomain = $1`, [headerTenantId]);
            console.log('🔍 Raw query result:', rawResult);
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(headerTenantId);
            console.log('🔍 isUuid:', isUuid);
            if (isUuid) {
                tenant = await this.tenantRepository.findOne({
                    where: [{ id: headerTenantId }, { subdomain: headerTenantId }],
                });
            }
            else {
                tenant = await this.tenantRepository.findOne({
                    where: { subdomain: headerTenantId },
                });
            }
        }
        else if (subdomain) {
            tenant = await this.tenantRepository.findOne({
                where: { subdomain },
            });
        }
        console.log('🔍 Tenant result:', tenant);
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found. Provide x-tenant-id header or use a valid subdomain.');
        }
        this.tenantService.setTenantId(tenant.id);
        req.tenant = tenant;
        next();
    }
    extractSubdomain(hostname) {
        const parts = hostname.split('.');
        if (parts.length >= 2) {
            return parts[0];
        }
        return '';
    }
};
exports.TenantMiddleware = TenantMiddleware;
exports.TenantMiddleware = TenantMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        tenant_service_1.TenantService])
], TenantMiddleware);
//# sourceMappingURL=tenant.middleware.js.map