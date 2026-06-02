/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

import { CashlessPaymentsService } from '../../src/modules/payments/cashless-payments.service';
import { DispensaryProcessorConfigService } from '../../src/modules/payments/dispensary-processor-config.service';
import { DispensaryProcessorName } from '../../src/modules/payments/entities/dispensary-payment-processor.entity';

describe('CashlessPaymentsService.initialize* (sc-587 TC-PAY-005)', () => {
  let service: CashlessPaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashlessPaymentsService,
        { provide: DataSource, useValue: { query: jest.fn() } },
        {
          provide: DispensaryProcessorConfigService,
          useValue: { list: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(CashlessPaymentsService);
  });

  // ── TC-PAY-005 — initiateCashlessPayment returns redirect or referenceId ──

  it('TC-PAY-005 — CanPay returns a redirectUrl + transactionId (CANPAY- prefixed)', async () => {
    const result = await service.initializeCanPayPayment('order-1', 49.99);
    expect(result.redirectUrl).toMatch(
      /^https:\/\/canpaydebit\.com\/pay\?txn=/,
    );
    expect(result.redirectUrl).toContain('amount=49.99');
    // First 12 chars of a UUID include one `-`, so the suffix is alnum+hyphen.
    expect(result.transactionId).toMatch(/^CANPAY-[A-F0-9-]{12}$/);
    // The transactionId is embedded in the URL
    expect(result.redirectUrl).toContain(result.transactionId);
  });

  it('TC-PAY-005 — AeroPay returns a paymentUrl + referenceId (AERO- prefixed)', async () => {
    const result = await service.initializeAeroPayPayment('order-2', 120);
    expect(result.paymentUrl).toMatch(
      /^https:\/\/aeropay\.com\/checkout\?ref=/,
    );
    expect(result.paymentUrl).toContain('amount=120');
    expect(result.referenceId).toMatch(/^AERO-[A-F0-9-]{12}$/);
    expect(result.paymentUrl).toContain(result.referenceId);
  });

  it('TC-PAY-005 — successive calls produce unique reference IDs', async () => {
    const a = await service.initializeCanPayPayment('order-1', 10);
    const b = await service.initializeCanPayPayment('order-1', 10);
    expect(a.transactionId).not.toBe(b.transactionId);
  });

  it('TC-PAY-005 — successive AeroPay calls produce unique reference IDs', async () => {
    const a = await service.initializeAeroPayPayment('order-1', 10);
    const b = await service.initializeAeroPayPayment('order-1', 10);
    expect(a.referenceId).not.toBe(b.referenceId);
  });
});

describe('CashlessPaymentsService.handle*Webhook', () => {
  let service: CashlessPaymentsService;
  let dsQuery: jest.Mock;

  beforeEach(async () => {
    dsQuery = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashlessPaymentsService,
        { provide: DataSource, useValue: { query: dsQuery } },
        {
          provide: DispensaryProcessorConfigService,
          useValue: { list: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(CashlessPaymentsService);
  });

  it('AeroPay completed webhook stamps payment_method=aeropay on the order', async () => {
    const result = await service.handleAeroPayWebhook({
      referenceId: 'AERO-X',
      status: 'completed',
      orderId: 'order-77',
    });
    expect(result.success).toBe(true);
    expect(dsQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = dsQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/payment_method = 'aeropay'/);
    expect(params).toEqual(['order-77']);
  });

  it('AeroPay non-completed status (e.g. failed) does NOT stamp payment_method', async () => {
    await service.handleAeroPayWebhook({
      referenceId: 'AERO-X',
      status: 'failed',
      orderId: 'order-77',
    });
    expect(dsQuery).not.toHaveBeenCalled();
  });

  it('CanPay completed webhook stamps payment_method=canpay', async () => {
    await service.handleCanPayWebhook({
      transactionId: 'CANPAY-X',
      status: 'completed',
      orderId: 'order-77',
    });
    const [sql, params] = dsQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/payment_method = 'canpay'/);
    expect(params).toEqual(['order-77']);
  });

  it('webhook with no orderId is observational only (no DB write)', async () => {
    await service.handleAeroPayWebhook({
      referenceId: 'X',
      status: 'completed',
    });
    expect(dsQuery).not.toHaveBeenCalled();
  });
});

describe('CashlessPaymentsService.getAvailablePaymentMethods', () => {
  let service: CashlessPaymentsService;
  let dsQuery: jest.Mock;
  let configList: jest.Mock;

  beforeEach(async () => {
    dsQuery = jest.fn();
    configList = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashlessPaymentsService,
        { provide: DataSource, useValue: { query: dsQuery } },
        {
          provide: DispensaryProcessorConfigService,
          useValue: { list: configList },
        },
      ],
    }).compile();
    service = module.get(CashlessPaymentsService);
  });

  it('returns cash + canpay + aeropay flags from the dispensary row + processor config', async () => {
    dsQuery.mockResolvedValueOnce([{ is_cash_enabled: true }]);
    configList.mockResolvedValueOnce([
      { processorName: DispensaryProcessorName.AEROPAY, isEnabled: true },
      { processorName: DispensaryProcessorName.CANPAY, isEnabled: false },
    ]);

    const methods = await service.getAvailablePaymentMethods('d-1');
    expect(methods).toEqual([
      { method: 'cash', enabled: true },
      { method: 'canpay', enabled: false },
      { method: 'aeropay', enabled: true },
    ]);
  });

  it('cash defaults to enabled when is_cash_enabled is null', async () => {
    dsQuery.mockResolvedValueOnce([{ is_cash_enabled: null }]);
    configList.mockResolvedValueOnce([]);
    const methods = await service.getAvailablePaymentMethods('d-1');
    expect(methods.find((m) => m.method === 'cash')?.enabled).toBe(true);
  });

  it('throws NotFound when the dispensary row is missing', async () => {
    dsQuery.mockResolvedValueOnce([]);
    await expect(
      service.getAvailablePaymentMethods('d-missing'),
    ).rejects.toThrow(NotFoundException);
  });
});
