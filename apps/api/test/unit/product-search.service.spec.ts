import { Test, TestingModule } from '@nestjs/testing';
import { ProductSearchService } from '../../src/modules/products/product-search.service';
import { DataSource } from 'typeorm';

describe('ProductSearchService', () => {
  let service: ProductSearchService;
  let mockQuery: jest.Mock;

  beforeEach(async () => {
    mockQuery = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSearchService,
        { provide: DataSource, useValue: { query: mockQuery } },
      ],
    }).compile();

    service = module.get<ProductSearchService>(ProductSearchService);
  });

  describe('search', () => {
    const mockFacets = () => {
      // 6 facet queries
      mockQuery
        .mockResolvedValueOnce([{ value: 'hybrid', count: '3' }, { value: 'sativa', count: '2' }])
        .mockResolvedValueOnce([{ value: 'FLOWER', label: 'Flower', count: '3' }])
        .mockResolvedValueOnce([{ value: 'Happy', count: '4' }, { value: 'Relaxed', count: '3' }])
        .mockResolvedValueOnce([{ value: 'Earthy', count: '3' }])
        .mockResolvedValueOnce([{ min: '12.99', max: '70.00' }])
        .mockResolvedValueOnce([{ min: '17.0', max: '26.0' }]);
    };

    it('should return products with total count and facets', async () => {
      mockQuery
        .mockResolvedValueOnce([{ total: '5' }]) // count
        .mockResolvedValueOnce([ // products
          { id: 'p1', name: 'Blue Dream', strain_type: 'hybrid' },
          { id: 'p2', name: 'Sour Diesel', strain_type: 'sativa' },
        ]);
      mockFacets();

      const result = await service.search({ dispensaryId: 'disp-1' });

      expect(result.total).toBe(5);
      expect(result.products).toHaveLength(2);
      expect(result.facets.strainTypes).toHaveLength(2);
      expect(result.facets.minPrice).toBe(12.99);
      expect(result.facets.maxPrice).toBe(70);
    });

    it('should apply text search with tsvector', async () => {
      mockQuery
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([{ id: 'p1', name: 'Blue Dream' }]);
      mockFacets();

      await service.search({ dispensaryId: 'disp-1', search: 'dream' });

      const countCall = mockQuery.mock.calls[0];
      expect(countCall[0]).toContain('search_vector');
      expect(countCall[0]).toContain('plainto_tsquery');
      expect(countCall[1]).toContain('dream');
    });

    it('should filter by strain type', async () => {
      mockQuery
        .mockResolvedValueOnce([{ total: '2' }])
        .mockResolvedValueOnce([]);
      mockFacets();

      await service.search({ dispensaryId: 'disp-1', strainType: 'sativa' });

      const countCall = mockQuery.mock.calls[0];
      expect(countCall[0]).toContain('strain_type');
      expect(countCall[1]).toContain('sativa');
    });

    it('should filter by effects array', async () => {
      mockQuery
        .mockResolvedValueOnce([{ total: '2' }])
        .mockResolvedValueOnce([]);
      mockFacets();

      await service.search({ dispensaryId: 'disp-1', effects: ['Happy', 'Creative'] });

      const countCall = mockQuery.mock.calls[0];
      expect(countCall[0]).toContain('effects');
      expect(countCall[1]).toContainEqual((['Happy', 'Creative']));
    });

    it('should filter by THC range', async () => {
      mockQuery
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([]);
      mockFacets();

      await service.search({ dispensaryId: 'disp-1', minThc: 20, maxThc: 30 });

      const countCall = mockQuery.mock.calls[0];
      expect(countCall[0]).toContain('thc_percent >=');
      expect(countCall[0]).toContain('thc_percent <=');
    });

    it('should apply pagination', async () => {
      mockQuery
        .mockResolvedValueOnce([{ total: '50' }])
        .mockResolvedValueOnce([]);
      mockFacets();

      const result = await service.search({ dispensaryId: 'disp-1', limit: 10, offset: 20 });

      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
      const mainCall = mockQuery.mock.calls[1];
      expect(mainCall[1]).toContain(10); // limit
      expect(mainCall[1]).toContain(20); // offset
    });
  });

  describe('autocomplete', () => {
    it('should return matching products with similarity', async () => {
      mockQuery.mockResolvedValueOnce([
        { id: 'p1', name: 'Blue Dream', strain_type: 'hybrid', sim: '0.35', rank: '0.1' },
      ]);

      const result = await service.autocomplete('disp-1', 'blue');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Blue Dream');
      expect(result[0].similarity).toBe(0.35);
    });

    it('should use trigram and tsvector for matching', async () => {
      mockQuery.mockResolvedValueOnce([]);

      await service.autocomplete('disp-1', 'dre');

      const call = mockQuery.mock.calls[0];
      expect(call[0]).toContain('similarity');
      expect(call[0]).toContain('search_vector');
      expect(call[0]).toContain('ILIKE');
    });

    it('should respect limit parameter', async () => {
      mockQuery.mockResolvedValueOnce([]);

      await service.autocomplete('disp-1', 'blue', 5);

      expect(mockQuery.mock.calls[0][1]).toContain(5);
    });
  });
});
