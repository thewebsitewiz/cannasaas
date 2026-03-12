import { Test, TestingModule } from '@nestjs/testing';
import { ProductEnrichmentService } from '../../src/modules/product-data/product-enrichment.service';
import { OtreebaService } from '../../src/modules/product-data/otreeba.service';
import { DataSource } from 'typeorm';

describe('ProductEnrichmentService', () => {
  let service: ProductEnrichmentService;
  let mockOtreeba: Partial<OtreebaService>;
  let mockQuery: jest.Mock;
  let mockQr: any;

  beforeEach(async () => {
    mockQuery = jest.fn();
    mockQr = { connect: jest.fn(), query: jest.fn(), release: jest.fn() };

    mockOtreeba = {
      searchStrains: jest.fn(),
      getStrainByOcpc: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductEnrichmentService,
        { provide: OtreebaService, useValue: mockOtreeba },
        { provide: DataSource, useValue: { query: mockQuery, createQueryRunner: () => mockQr } },
      ],
    }).compile();

    service = module.get<ProductEnrichmentService>(ProductEnrichmentService);
  });

  describe('enrichProduct', () => {
    it('should match product to strain by name extraction', async () => {
      mockQr.query
        .mockResolvedValueOnce([{ id: 'p1', name: 'Blue Dream Pre-Roll', strain_name: null, strain_id: null, otreeba_ocpc: null }]);

      (mockOtreeba.searchStrains as jest.Mock).mockResolvedValueOnce([{
        strainDataId: 's1', name: 'Blue Dream', type: 'hybrid', ocpc: 'ABCD',
        effects: ['Relaxed', 'Happy'], flavors: ['Blueberry'], terpenes: ['Myrcene'], lineage: {},
      }]);

      mockQr.query.mockResolvedValueOnce([]); // UPDATE

      const result = await service.enrichProduct('p1', 'disp-1');

      expect(result.strainMatched).toBe(true);
      expect(result.strainName).toBe('Blue Dream');
      expect(result.fieldsUpdated).toContain('strainName');
      expect(result.fieldsUpdated).toContain('effects');
    });

    it('should return no match when strain not found', async () => {
      mockQr.query.mockResolvedValueOnce([{ id: 'p1', name: 'Mystery Product', strain_name: null, strain_id: null, otreeba_ocpc: null }]);
      (mockOtreeba.searchStrains as jest.Mock).mockResolvedValueOnce([]);

      const result = await service.enrichProduct('p1', 'disp-1');

      expect(result.strainMatched).toBe(false);
      expect(result.fieldsUpdated).toHaveLength(0);
    });

    it('should return early for non-existent product', async () => {
      mockQr.query.mockResolvedValueOnce([]); // no product

      const result = await service.enrichProduct('bad-id', 'disp-1');

      expect(result.strainMatched).toBe(false);
    });

    it('should try OCPC lookup first if available', async () => {
      mockQr.query.mockResolvedValueOnce([{ id: 'p1', name: 'Test', strain_name: null, strain_id: null, otreeba_ocpc: 'ABCD1234' }]);
      (mockOtreeba.getStrainByOcpc as jest.Mock).mockResolvedValueOnce({
        strainDataId: 's1', name: 'Known Strain', type: 'indica', ocpc: 'ABCD1234',
        effects: ['Sleepy'], flavors: ['Earthy'], terpenes: [], lineage: {},
      });
      mockQr.query.mockResolvedValueOnce([]); // UPDATE

      const result = await service.enrichProduct('p1', 'disp-1');

      expect(mockOtreeba.getStrainByOcpc).toHaveBeenCalledWith('ABCD1234');
      expect(result.strainMatched).toBe(true);
    });
  });

  describe('enrichDispensary', () => {
    it('should enrich all unenriched products', async () => {
      mockQuery.mockResolvedValueOnce([{ id: 'p1' }, { id: 'p2' }]); // find unenriched

      // Mock enrichProduct for each
      mockQr.query
        .mockResolvedValueOnce([{ id: 'p1', name: 'Blue Dream', strain_name: null, strain_id: null, otreeba_ocpc: null }])
      ;
      (mockOtreeba.searchStrains as jest.Mock)
        .mockResolvedValueOnce([{ strainDataId: 's1', name: 'Blue Dream', type: 'hybrid', effects: [], flavors: [], terpenes: [], lineage: {}, ocpc: null }])
        .mockResolvedValueOnce([]);
      mockQr.query
        .mockResolvedValueOnce([]) // UPDATE p1
        .mockResolvedValueOnce([{ id: 'p2', name: 'Unknown', strain_name: null, strain_id: null, otreeba_ocpc: null }]);

      const result = await service.enrichDispensary('disp-1');

      expect(result.total).toBe(2);
      expect(result.enriched + result.failed).toBe(2);
    });
  });
});
