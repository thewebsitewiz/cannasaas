import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let repository: Repository<Tenant>;

  const mockTenant = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Dispensary',
    subdomain: 'test',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    repository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));
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
      jest.spyOn(repPository, 'findOne').mockResolvedValue(mockTenant);

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