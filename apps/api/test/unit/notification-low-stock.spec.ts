/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';

import { NotificationService } from '../../src/modules/notifications/notification.service';
import {
  NotificationTemplate,
  NotificationLog,
} from '../../src/modules/notifications/entities/notification.entity';
import { CacheService } from '../../src/common/services/cache.service';

/**
 * Sc-113: NotificationService listens on `inventory.low_stock` and
 * `inventory.out_of_stock`, fans out an email per dispensary admin,
 * and dedups via a per-(dispensary, product, severity) cooldown so a
 * busy weekend doesn't flood inboxes.
 */
describe('NotificationService low-stock listener (sc-113)', () => {
  let service: NotificationService;
  let dsQuery: jest.Mock;
  let setNxEx: jest.Mock;
  let sendByTemplate: jest.SpyInstance;

  beforeEach(async () => {
    dsQuery = jest.fn();
    setNxEx = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(NotificationTemplate),
          useValue: {} as Partial<Repository<NotificationTemplate>>,
        },
        {
          provide: getRepositoryToken(NotificationLog),
          useValue: {} as Partial<Repository<NotificationLog>>,
        },
        { provide: DataSource, useValue: { query: dsQuery } },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: unknown) => {
              if (key === 'ADMIN_URL') return 'https://admin.test.com';
              return fallback;
            },
          },
        },
        { provide: CacheService, useValue: { setNxEx } },
      ],
    }).compile();
    service = module.get(NotificationService);
    sendByTemplate = jest
      .spyOn(service, 'sendByTemplate')
      .mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('TC-NOTIF-LS-001 — onLowStock fans out one email per dispensary admin', async () => {
    setNxEx.mockResolvedValueOnce(true);
    dsQuery
      // resolveStockAlertRecipients
      .mockResolvedValueOnce([
        { userId: 'u-1', email: 'a@x.com', firstName: 'Alice' },
        { userId: 'u-2', email: 'b@x.com', firstName: 'Bob' },
      ])
      // dispensary name lookup
      .mockResolvedValueOnce([{ name: 'Test Dispensary' }]);

    await service.onLowStock({
      dispensaryId: 'disp-1',
      productName: 'Sour Diesel 1g',
      quantity: 3,
    });

    expect(setNxEx).toHaveBeenCalledWith(
      'lowstock:disp-1:low_stock_alert:Sour Diesel 1g',
      '1',
      3600,
    );
    expect(sendByTemplate).toHaveBeenCalledTimes(2);
    expect(sendByTemplate.mock.calls[0][0]).toBe('low_stock_alert');
    expect(sendByTemplate.mock.calls[0][1]).toMatchObject({
      firstName: 'Alice',
      productName: 'Sour Diesel 1g',
      dispensaryName: 'Test Dispensary',
      quantity: 3,
      adminUrl: 'https://admin.test.com',
    });
    expect(sendByTemplate.mock.calls[0][2]).toMatchObject({
      email: 'a@x.com',
      userId: 'u-1',
      dispensaryId: 'disp-1',
    });
    expect(sendByTemplate.mock.calls[1][2]).toMatchObject({ email: 'b@x.com' });
  });

  it('TC-NOTIF-LS-002 — cooldown short-circuits a repeat low_stock within the window', async () => {
    setNxEx.mockResolvedValueOnce(false); // already in cooldown

    await service.onLowStock({
      dispensaryId: 'disp-1',
      productName: 'Sour Diesel 1g',
      quantity: 2,
    });

    expect(dsQuery).not.toHaveBeenCalled();
    expect(sendByTemplate).not.toHaveBeenCalled();
  });

  it('TC-NOTIF-LS-003 — onOutOfStock uses out_of_stock_alert template + a distinct cooldown key', async () => {
    setNxEx.mockResolvedValueOnce(true);
    dsQuery
      .mockResolvedValueOnce([
        { userId: 'u-1', email: 'a@x.com', firstName: 'Alice' },
      ])
      .mockResolvedValueOnce([{ name: 'Test Dispensary' }]);

    await service.onOutOfStock({
      dispensaryId: 'disp-1',
      productName: 'Sour Diesel 1g',
      quantity: 0,
    });

    expect(setNxEx).toHaveBeenCalledWith(
      'lowstock:disp-1:out_of_stock_alert:Sour Diesel 1g',
      '1',
      3600,
    );
    expect(sendByTemplate).toHaveBeenCalledWith(
      'out_of_stock_alert',
      expect.objectContaining({ productName: 'Sour Diesel 1g', quantity: 0 }),
      expect.objectContaining({ email: 'a@x.com' }),
    );
  });

  it('TC-NOTIF-LS-004 — skips sending when no admin recipients are configured', async () => {
    setNxEx.mockResolvedValueOnce(true);
    dsQuery.mockResolvedValueOnce([]); // no recipients

    await service.onLowStock({
      dispensaryId: 'disp-1',
      productName: 'Sour Diesel 1g',
      quantity: 1,
    });

    expect(sendByTemplate).not.toHaveBeenCalled();
  });

  it('TC-NOTIF-LS-005 — falls back to default firstName when recipient.firstName is null', async () => {
    setNxEx.mockResolvedValueOnce(true);
    dsQuery
      .mockResolvedValueOnce([
        { userId: 'u-1', email: 'a@x.com', firstName: null },
      ])
      .mockResolvedValueOnce([{ name: 'Test Dispensary' }]);

    await service.onLowStock({
      dispensaryId: 'disp-1',
      productName: 'Sour Diesel 1g',
      quantity: 4,
    });

    expect(sendByTemplate.mock.calls[0][1]).toMatchObject({ firstName: 'team' });
  });
});
