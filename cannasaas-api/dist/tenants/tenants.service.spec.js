"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const tenant_entity_1 = require("./entities/tenant.entity");
const tenants_service_1 = require("./tenants.service");
describe('TenantsService', () => {
    let service;
    let repository;
    const mockTenant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Dispensary',
        subdomain: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                tenants_service_1.TenantsService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(tenant_entity_1.Tenant),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(tenants_service_1.TenantsService);
        repository = module.get((0, typeorm_1.getRepositoryToken)(tenant_entity_1.Tenant));
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('TenantsService', () => {
        it('should be created in Sprint 3', () => {
            expect(true).toBe(true);
        });
    });
    describe('findBySubdomain', () => {
        it('should return a tenant when found', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(mockTenant);
            const result = await service.findBySubdomain('test');
            expect(result).toEqual(mockTenant);
            expect(repository.findOne).toHaveBeenCalledWith({
                where: { subdomain: 'test' },
            });
        });
        it('should return null when tenant not found', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(null);
            const result = await service.findBySubdomain('nonexistent');
            expect(result).toBeNull();
        });
    });
});
//# sourceMappingURL=tenants.service.spec.js.map