import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../../src/modules/analytics/analytics.service';
import { DataSource } from 'typeorm';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockDataSource: Partial<DataSource>;
  let mockQuery: jest.Mock;

  beforeEach(async () => {
    mockQuery = jest.fn();
    mockDataSource = { query: mockQuery };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('getSalesOverview', () => {
    it('should return formatted sales data', async () => {
      mockQuery.mockResolvedValueOnce([{
        total_revenue: '1250.50',
        total_orders: '15',
        average_order_value: '83.37',
        total_tax: '275.11',
        total_discount: '50.00',
        completed_orders: '12',
        pending_orders: '2',
        cancelled_orders: '1',
      }]);

      const result = await service.getSalesOverview('disp-1', 30);

      expect(result.totalRevenue).toBe(1250.50);
      expect(result.totalOrders).toBe(15);
      expect(result.averageOrderValue).toBe(83.37);
      expect(result.completedOrders).toBe(12);
      expect(result.pendingOrders).toBe(2);
      expect(result.cancelledOrders).toBe(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM orders'), ['disp-1', 30]);
    });

    it('should handle zero orders', async () => {
      mockQuery.mockResolvedValueOnce([{
        total_revenue: '0', total_orders: '0', average_order_value: '0',
        total_tax: '0', total_discount: '0', completed_orders: '0',
        pending_orders: '0', cancelled_orders: '0',
      }]);

      const result = await service.getSalesOverview('disp-1', 30);
      expect(result.totalRevenue).toBe(0);
      expect(result.totalOrders).toBe(0);
    });
  });

  describe('getSalesTrend', () => {
    it('should return daily trend for 30 days', async () => {
      mockQuery.mockResolvedValueOnce([
        { period: new Date('2026-03-10'), revenue: '500.00', orders: '5', average_order_value: '100.00' },
        { period: new Date('2026-03-11'), revenue: '750.00', orders: '8', average_order_value: '93.75' },
      ]);

      const result = await service.getSalesTrend('disp-1', 30);

      expect(result).toHaveLength(2);
      expect(result[0].revenue).toBe(500);
      expect(result[0].orders).toBe(5);
      expect(result[1].revenue).toBe(750);
      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), ['disp-1', 30, 'day']);
    });

    it('should use week intervals for >30 days', async () => {
      mockQuery.mockResolvedValueOnce([]);
      await service.getSalesTrend('disp-1', 90);
      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), ['disp-1', 90, 'week']);
    });
  });

  describe('getTopProducts', () => {
    it('should return products sorted by revenue', async () => {
      mockQuery.mockResolvedValueOnce([
        { product_id: 'p1', product_name: 'Blue Dream', strain_type: 'hybrid', units_sold: '20', revenue: '600.00' },
        { product_id: 'p2', product_name: 'OG Kush', strain_type: 'hybrid', units_sold: '15', revenue: '450.00' },
      ]);

      const result = await service.getTopProducts('disp-1', 30, 10);

      expect(result).toHaveLength(2);
      expect(result[0].productName).toBe('Blue Dream');
      expect(result[0].revenue).toBe(600);
      expect(result[0].unitsSold).toBe(20);
    });
  });

  describe('getInventoryOverview', () => {
    it('should return inventory stats', async () => {
      mockQuery
        .mockResolvedValueOnce([{
          total_variants: '10', total_on_hand: '500', total_reserved: '25',
          total_available: '475', low_stock: '2', out_of_stock: '1',
        }])
        .mockResolvedValueOnce([{ est_value: '15000.00' }]);

      const result = await service.getInventoryOverview('disp-1');

      expect(result.totalVariants).toBe(10);
      expect(result.totalUnitsOnHand).toBe(500);
      expect(result.totalUnitsAvailable).toBe(475);
      expect(result.estimatedInventoryValue).toBe(15000);
      expect(result.lowStockCount).toBe(2);
      expect(result.outOfStockCount).toBe(1);
    });
  });

  describe('getMetrcSyncOverview', () => {
    it('should calculate success rate', async () => {
      mockQuery
        .mockResolvedValueOnce([{
          total_syncs: '20', success_count: '18', failed_count: '2',
          pending_count: '0', last_sync_at: '2026-03-12T10:00:00Z',
        }])
        .mockResolvedValueOnce([{ awaiting: '3' }]);

      const result = await service.getMetrcSyncOverview('disp-1');

      expect(result.totalSyncs).toBe(20);
      expect(result.successRate).toBe(90);
      expect(result.ordersAwaitingSync).toBe(3);
    });

    it('should return 100% success rate with no syncs', async () => {
      mockQuery
        .mockResolvedValueOnce([{
          total_syncs: '0', success_count: '0', failed_count: '0',
          pending_count: '0', last_sync_at: null,
        }])
        .mockResolvedValueOnce([{ awaiting: '0' }]);

      const result = await service.getMetrcSyncOverview('disp-1');
      expect(result.successRate).toBe(100);
    });
  });

  describe('getComplianceSummary', () => {
    it('should calculate compliance percent', async () => {
      mockQuery
        .mockResolvedValueOnce([{ total: '10', compliant: '8', missing_uid: '1', missing_category: '1' }])
        .mockResolvedValueOnce([{ missing_label: '2' }]);

      const result = await service.getComplianceSummary('disp-1');

      expect(result.totalProducts).toBe(10);
      expect(result.compliantProducts).toBe(8);
      expect(result.compliancePercent).toBe(80);
      expect(result.missingUid).toBe(1);
      expect(result.missingPackageLabel).toBe(2);
    });

    it('should return 100% with all compliant', async () => {
      mockQuery
        .mockResolvedValueOnce([{ total: '5', compliant: '5', missing_uid: '0', missing_category: '0' }])
        .mockResolvedValueOnce([{ missing_label: '0' }]);

      const result = await service.getComplianceSummary('disp-1');
      expect(result.compliancePercent).toBe(100);
    });
  });

  describe('getDashboard', () => {
    it('should call all sub-queries in parallel', async () => {
      // Mock all 8 queries that getDashboard calls
      mockQuery.mockResolvedValue([{
        total_revenue: '0', total_orders: '0', average_order_value: '0',
        total_tax: '0', total_discount: '0', completed_orders: '0',
        pending_orders: '0', cancelled_orders: '0', total: '0',
        compliant: '0', missing_uid: '0', missing_category: '0',
        missing_label: '0', total_syncs: '0', success_count: '0',
        failed_count: '0', pending_count: '0', last_sync_at: null,
        awaiting: '0', total_variants: '0', total_on_hand: '0',
        total_reserved: '0', total_available: '0', low_stock: '0',
        out_of_stock: '0', est_value: '0',
      }]);

      const result = await service.getDashboard('disp-1', 30);

      expect(result).toHaveProperty('sales');
      expect(result).toHaveProperty('salesTrend');
      expect(result).toHaveProperty('topProducts');
      expect(result).toHaveProperty('inventory');
      expect(result).toHaveProperty('metrcSync');
      expect(result).toHaveProperty('compliance');
    });
  });
});
