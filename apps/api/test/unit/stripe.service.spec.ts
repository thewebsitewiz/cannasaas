import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from '../../src/modules/stripe/stripe.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock Stripe module
const mockPaymentIntentsCreate = jest.fn();
const mockPaymentIntentsRetrieve = jest.fn();
const mockRefundsCreate = jest.fn();
const mockWebhooksConstructEvent = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockPaymentIntentsCreate,
      retrieve: mockPaymentIntentsRetrieve,
    },
    refunds: {
      create: mockRefundsCreate,
    },
    webhooks: {
      constructEvent: mockWebhooksConstructEvent,
    },
  }));
});

describe('StripeService', () => {
  let service: StripeService;
  let mockQuery: jest.Mock;
  let mockEvents: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockQuery = jest.fn();
    mockEvents = { emit: jest.fn() };

    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'stripe.secretKey') return 'sk_test_valid_key';
              if (key === 'stripe.webhookSecret') return 'whsec_test';
              return undefined;
            }),
          },
        },
        { provide: DataSource, useValue: { query: mockQuery } },
        { provide: EventEmitter2, useValue: mockEvents },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  describe('createPaymentIntent', () => {
    it('should return client secret for new payment', async () => {
      // No existing payment
      mockQuery.mockResolvedValueOnce([]);
      mockPaymentIntentsCreate.mockResolvedValueOnce({
        id: 'pi_123',
        client_secret: 'pi_123_secret',
      });
      // Save to DB
      mockQuery.mockResolvedValueOnce([]);

      const result = await service.createPaymentIntent('order-1', 'disp-1', 5000);

      expect(result.clientSecret).toBe('pi_123_secret');
      expect(result.paymentIntentId).toBe('pi_123');
      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 5000, currency: 'usd' }),
        expect.objectContaining({ idempotencyKey: 'order-1' }),
      );
    });

    it('should be idempotent — return existing intent for same order', async () => {
      // Existing payment found in DB
      mockQuery.mockResolvedValueOnce([{ stripe_payment_intent_id: 'pi_existing' }]);
      mockPaymentIntentsRetrieve.mockResolvedValueOnce({
        id: 'pi_existing',
        client_secret: 'pi_existing_secret',
      });

      const result = await service.createPaymentIntent('order-1', 'disp-1', 5000);

      expect(result.clientSecret).toBe('pi_existing_secret');
      expect(result.paymentIntentId).toBe('pi_existing');
      expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('should update order on payment_intent.succeeded', async () => {
      const payload = Buffer.from('{}');
      const signature = 'sig_test';

      mockWebhooksConstructEvent.mockReturnValueOnce({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            latest_charge: 'ch_123',
            amount: 5000,
            metadata: { orderId: 'order-1', dispensaryId: 'disp-1' },
          },
        },
      });

      // markPaymentSucceeded: update payments
      mockQuery.mockResolvedValueOnce([]);
      // markPaymentSucceeded: get payment for order update
      mockQuery.mockResolvedValueOnce([{ order_id: 'order-1' }]);
      // markPaymentSucceeded: update order payment status
      mockQuery.mockResolvedValueOnce([]);

      const result = await service.handleWebhook(payload, signature);

      expect(result).toEqual({ received: true });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE payments SET status'),
        ['succeeded', 'ch_123', 'pi_123'],
      );
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'order.payment_received',
        expect.objectContaining({ orderId: 'order-1' }),
      );
    });
  });

  describe('refundPayment', () => {
    it('should process full refund', async () => {
      // Find payment
      mockQuery.mockResolvedValueOnce([{
        stripe_payment_intent_id: 'pi_123',
        stripe_charge_id: 'ch_123',
        amount: '50.00',
      }]);
      mockRefundsCreate.mockResolvedValueOnce({
        id: 're_123',
        amount: 5000,
        status: 'succeeded',
      });
      // Update payment status
      mockQuery.mockResolvedValueOnce([]);

      const result = await service.refundPayment('order-1');

      expect(result.refundId).toBe('re_123');
      expect(result.amount).toBe('50.00');
      expect(result.status).toBe('succeeded');
      expect(mockRefundsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_intent: 'pi_123',
          reason: 'requested_by_customer',
        }),
      );
      // Full refund sets status to 'refunded'
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE payments SET status'),
        ['refunded', 'pi_123'],
      );
    });

    it('should process partial refund', async () => {
      // Find payment
      mockQuery.mockResolvedValueOnce([{
        stripe_payment_intent_id: 'pi_123',
        stripe_charge_id: 'ch_123',
        amount: '50.00',
      }]);
      mockRefundsCreate.mockResolvedValueOnce({
        id: 're_456',
        amount: 2000,
        status: 'succeeded',
      });
      // Update payment status
      mockQuery.mockResolvedValueOnce([]);

      const result = await service.refundPayment('order-1', 2000, 'requested_by_customer');

      expect(result.refundId).toBe('re_456');
      expect(result.amount).toBe('20.00');
      expect(mockRefundsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 2000, payment_intent: 'pi_123' }),
      );
      // Partial refund sets status to 'partially_refunded'
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE payments SET status'),
        ['partially_refunded', 'pi_123'],
      );
    });
  });
});
