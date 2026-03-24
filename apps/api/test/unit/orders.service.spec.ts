import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockDataSource: Partial<DataSource>;
  let mockQuery: jest.Mock;
  let mockQueryRunner: Record<string, jest.Mock>;
  let mockEventEmitter: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockQuery = jest.fn();
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      query: jest.fn(),
    };

    mockDataSource = {
      query: mockQuery,
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('createOrder', () => {
    const validInput = {
      dispensaryId: 'disp-1',
      orderType: 'in_store',
      lineItems: [
        { productId: 'prod-1', variantId: 'var-1', quantity: 2 },
        { productId: 'prod-2', variantId: 'var-2', quantity: 1 },
      ],
    };

    it('should create order with line items', async () => {
      // Dispensary check
      mockQuery.mockResolvedValueOnce([{ entity_id: 'disp-1' }]);
      // Product existence check
      mockQuery.mockResolvedValueOnce([{ product_id: 'prod-1' }, { product_id: 'prod-2' }]);

      // QueryRunner: dispensary lookup
      mockQueryRunner.query
        .mockResolvedValueOnce([{ entity_id: 'disp-1', state: 'NY', is_active: true }])
        // Tax rules
        .mockResolvedValueOnce([
          { tax_category_id: 1, code: 'NY_SALES', state: 'NY', name: 'NY Sales Tax', tax_basis: 'retail_price', rate: '0.08', effective_date: '2024-01-01', statutory_reference: 'NY Tax Law', is_active: true },
        ])
        // Product 1 lookup
        .mockResolvedValueOnce([{ id: 'prod-1', name: 'Blue Dream', is_active: true, is_approved: true, metrc_item_uid: 'uid-1', dispensary_id: 'disp-1', total_thc_mg_per_container: '100', product_type_code: 'FLOWER' }])
        // Product 1 pricing
        .mockResolvedValueOnce([{ price: '25.00' }])
        // Product 2 lookup
        .mockResolvedValueOnce([{ id: 'prod-2', name: 'OG Kush', is_active: true, is_approved: true, metrc_item_uid: 'uid-2', dispensary_id: 'disp-1', total_thc_mg_per_container: '50', product_type_code: 'EDIBLE' }])
        // Product 2 pricing
        .mockResolvedValueOnce([{ price: '15.00' }])
        // Insert order
        .mockResolvedValueOnce([{ orderId: 'order-1', createdAt: new Date() }])
        // Insert line item 1
        .mockResolvedValueOnce([])
        // Reserve inventory 1
        .mockResolvedValueOnce([])
        // Insert line item 2
        .mockResolvedValueOnce([])
        // Reserve inventory 2
        .mockResolvedValueOnce([]);

      const result = await service.createOrder(validInput as any);

      expect(result).toHaveProperty('orderId', 'order-1');
      expect(result).toHaveProperty('orderStatus', 'pending');
      expect(result.subtotal).toBe(65); // 25*2 + 15*1
      expect(result.lineItemCount).toBe(2);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should calculate tax correctly', async () => {
      // Dispensary check
      mockQuery.mockResolvedValueOnce([{ entity_id: 'disp-1' }]);
      // Product existence check
      mockQuery.mockResolvedValueOnce([{ product_id: 'prod-1' }]);

      const singleInput = {
        dispensaryId: 'disp-1',
        orderType: 'in_store',
        lineItems: [{ productId: 'prod-1', variantId: 'var-1', quantity: 1 }],
      };

      mockQueryRunner.query
        .mockResolvedValueOnce([{ entity_id: 'disp-1', state: 'NJ', is_active: true }])
        // Tax rules: 6.625% sales tax
        .mockResolvedValueOnce([
          { tax_category_id: 1, code: 'NJ_SALES', state: 'NJ', name: 'NJ Sales Tax', tax_basis: 'retail_price', rate: '0.06625', effective_date: '2024-01-01', statutory_reference: 'NJ Tax', is_active: true },
        ])
        // Product lookup
        .mockResolvedValueOnce([{ id: 'prod-1', name: 'Test', is_active: true, is_approved: true, metrc_item_uid: null, dispensary_id: 'disp-1', total_thc_mg_per_container: '0', product_type_code: 'ACCESSORY' }])
        // Pricing: $100
        .mockResolvedValueOnce([{ price: '100.00' }])
        // Insert order
        .mockResolvedValueOnce([{ orderId: 'order-2', createdAt: new Date() }])
        // Insert line item
        .mockResolvedValueOnce([])
        // Reserve inventory
        .mockResolvedValueOnce([]);

      const result = await service.createOrder(singleInput as any);

      expect(result.subtotal).toBe(100);
      expect(result.taxTotal).toBe(6.63); // 100 * 0.06625 rounded
      expect(result.total).toBe(106.63);
    });

    it('should reject empty line items', async () => {
      const emptyInput = {
        dispensaryId: 'disp-1',
        orderType: 'in_store',
        lineItems: [],
      };

      await expect(service.createOrder(emptyInput as any)).rejects.toThrow(BadRequestException);
      await expect(service.createOrder(emptyInput as any)).rejects.toThrow('Order must contain at least one line item');
    });
  });

  describe('cancelOrder', () => {
    it('should set status to cancelled', async () => {
      mockQuery.mockResolvedValueOnce([[], 1]); // UPDATE returns [rows, rowCount]

      const result = await service.cancelOrder('order-1', 'disp-1', 'Customer request');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('cancelled'),
        ['Customer request', 'order-1', 'disp-1'],
      );
      expect(result).toBe(true);
    });
  });

  describe('completeOrder', () => {
    it('should deduct inventory and emit event', async () => {
      // Order lookup
      mockQueryRunner.query
        .mockResolvedValueOnce([{
          orderId: 'order-1',
          dispensaryId: 'disp-1',
          orderStatus: 'confirmed',
          subtotal: 50,
          taxTotal: 4,
          total: 54,
          taxBreakdown: '[]',
          customerUserId: 'cust-1',
          orderType: 'in_store',
          createdAt: new Date(),
        }])
        // Line items
        .mockResolvedValueOnce([
          { lineItemId: 'li-1', productId: 'prod-1', variantId: 'var-1', quantity: 2, unitPrice: 25, taxApplied: 4, metrcItemUid: null, metrcPackageLabel: null, product_name: 'Blue Dream' },
        ])
        // Update order status
        .mockResolvedValueOnce([])
        // Deduct inventory
        .mockResolvedValueOnce([]);

      const result = await service.completeOrder({ orderId: 'order-1', dispensaryId: 'disp-1' });

      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('lineItems');
      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining('quantity_on_hand = quantity_on_hand -'),
        [2, 'disp-1', 'var-1'],
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.completed', expect.anything());
    });
  });
});
