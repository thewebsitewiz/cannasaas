import { Test, TestingModule } from '@nestjs/testing';
import { FulfillmentService } from '../../src/modules/fulfillment/fulfillment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeliveryZone } from '../../src/modules/fulfillment/entities/delivery-zone.entity';
import { DeliveryTimeSlot } from '../../src/modules/fulfillment/entities/delivery-time-slot.entity';
import { OrderTracking } from '../../src/modules/fulfillment/entities/order-tracking.entity';
import { DataSource } from 'typeorm';

describe('FulfillmentService', () => {
  let service: FulfillmentService;
  let mockQuery: jest.Mock;
  let mockZoneRepo: any;
  let mockSlotRepo: any;
  let mockTrackingRepo: any;

  beforeEach(async () => {
    mockQuery = jest.fn();
    mockZoneRepo = { find: jest.fn() };
    mockSlotRepo = { find: jest.fn() };
    mockTrackingRepo = { find: jest.fn(), create: jest.fn((d) => d), save: jest.fn((d) => ({ ...d, trackingId: 'track-1' })) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FulfillmentService,
        { provide: getRepositoryToken(DeliveryZone), useValue: mockZoneRepo },
        { provide: getRepositoryToken(DeliveryTimeSlot), useValue: mockSlotRepo },
        { provide: getRepositoryToken(OrderTracking), useValue: mockTrackingRepo },
        { provide: DataSource, useValue: { query: mockQuery, createQueryRunner: jest.fn() } },
      ],
    }).compile();

    service = module.get<FulfillmentService>(FulfillmentService);
  });

  describe('checkDeliveryEligibility', () => {
    it('should return eligible with matching zone', async () => {
      mockQuery
        .mockResolvedValueOnce([{ latitude: 41.0907, longitude: -73.9185, is_delivery_enabled: true }]) // dispensary
        .mockResolvedValueOnce([{ distance: 4.5 }]) // haversine
        .mockResolvedValueOnce([{ // matching zone
          zone_id: 'z1', name: 'Standard', radius_miles: 7, delivery_fee: 5.99,
          min_order_amount: 35, free_delivery_threshold: 75,
          estimated_minutes_min: 30, estimated_minutes_max: 50,
        }]);

      const result = await service.checkDeliveryEligibility('disp-1', 41.02, -73.95, 50);

      expect(result.eligible).toBe(true);
      expect(result.distance).toBe(4.5);
      expect(result.zone?.name).toBe('Standard');
      expect(result.zone?.deliveryFee).toBe(5.99);
    });

    it('should waive fee above threshold', async () => {
      mockQuery
        .mockResolvedValueOnce([{ latitude: 41.09, longitude: -73.92, is_delivery_enabled: true }])
        .mockResolvedValueOnce([{ distance: 4.5 }])
        .mockResolvedValueOnce([{
          zone_id: 'z1', name: 'Standard', radius_miles: 7, delivery_fee: '5.99',
          min_order_amount: '35', free_delivery_threshold: '75',
          estimated_minutes_min: 30, estimated_minutes_max: 50,
        }]);

      const result = await service.checkDeliveryEligibility('disp-1', 41.02, -73.95, 100);

      expect(result.eligible).toBe(true);
      expect(result.zone?.deliveryFee).toBe(0);
    });

    it('should reject when delivery is disabled', async () => {
      mockQuery.mockResolvedValueOnce([{ latitude: 41.09, longitude: -73.92, is_delivery_enabled: false }]);

      const result = await service.checkDeliveryEligibility('disp-1', 41.02, -73.95);

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('not available');
    });

    it('should reject when outside all zones', async () => {
      mockQuery
        .mockResolvedValueOnce([{ latitude: 41.09, longitude: -73.92, is_delivery_enabled: true }])
        .mockResolvedValueOnce([{ distance: 25.0 }])
        .mockResolvedValueOnce([]); // no matching zone

      const result = await service.checkDeliveryEligibility('disp-1', 40.5, -74.5);

      expect(result.eligible).toBe(false);
      expect(result.distance).toBe(25.0);
      expect(result.reason).toContain('beyond delivery range');
    });

    it('should reject when below minimum order', async () => {
      mockQuery
        .mockResolvedValueOnce([{ latitude: 41.09, longitude: -73.92, is_delivery_enabled: true }])
        .mockResolvedValueOnce([{ distance: 4.5 }])
        .mockResolvedValueOnce([{
          zone_id: 'z1', name: 'Standard', radius_miles: 7, delivery_fee: '5.99',
          min_order_amount: '35', free_delivery_threshold: null,
          estimated_minutes_min: 30, estimated_minutes_max: 50,
        }]);

      const result = await service.checkDeliveryEligibility('disp-1', 41.02, -73.95, 20);

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Minimum order');
    });

    it('should return not found for missing dispensary', async () => {
      mockQuery.mockResolvedValueOnce([]);

      const result = await service.checkDeliveryEligibility('bad-id', 41.02, -73.95);

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Dispensary not found');
    });
  });

  describe('getZones', () => {
    it('should return active zones sorted by radius', async () => {
      const zones = [
        { zoneId: 'z1', name: 'Local', radius_miles: 3 },
        { zoneId: 'z2', name: 'Standard', radius_miles: 7 },
      ];
      mockZoneRepo.find.mockResolvedValueOnce(zones);

      const result = await service.getZones('disp-1');

      expect(result).toEqual(zones);
      expect(mockZoneRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { dispensary_id: 'disp-1', is_active: true },
      }));
    });
  });

  describe('updateFulfillmentStatus', () => {
    it('should reject invalid status', async () => {
      await expect(
        service.updateFulfillmentStatus('order-1', 'disp-1', 'invalid_status', 'user-1')
      ).rejects.toThrow('Invalid status');
    });

    it('should reject non-existent order', async () => {
      mockQuery.mockResolvedValueOnce([]); // no order found

      await expect(
        service.updateFulfillmentStatus('bad-order', 'disp-1', 'confirmed', 'user-1')
      ).rejects.toThrow('Order not found');
    });

    it('should update status and create tracking entry', async () => {
      mockQuery
        .mockResolvedValueOnce([{ orderId: 'order-1', fulfillment_status: 'pending' }]) // find order
        .mockResolvedValueOnce([]); // update order

      const result = await service.updateFulfillmentStatus('order-1', 'disp-1', 'confirmed', 'user-1', { notes: 'Confirmed by staff' });

      expect(mockTrackingRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        order_id: 'order-1',
        status: 'confirmed',
        notes: 'Confirmed by staff',
        updated_by_user_id: 'user-1',
      }));
      expect(mockTrackingRepo.save).toHaveBeenCalled();
    });
  });

  describe('getOrderTracking', () => {
    it('should return tracking history in order', async () => {
      const tracking = [
        { trackingId: 't1', status: 'pending', created_at: new Date('2026-03-12T10:00:00') },
        { trackingId: 't2', status: 'confirmed', created_at: new Date('2026-03-12T10:05:00') },
      ];
      mockTrackingRepo.find.mockResolvedValueOnce(tracking);

      const result = await service.getOrderTracking('order-1');

      expect(result).toEqual(tracking);
      expect(mockTrackingRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { order_id: 'order-1' },
        order: { created_at: 'ASC' },
      }));
    });
  });
});
