import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { DispensaryProcessorConfigService } from './dispensary-processor-config.service';
import {
  DispensaryPaymentProcessor,
  DispensaryProcessorName,
} from './entities/dispensary-payment-processor.entity';

type MockRepo = {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

describe('DispensaryProcessorConfigService', () => {
  let service: DispensaryProcessorConfigService;
  let repo: MockRepo;
  let dataSourceQuery: jest.Mock;

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto: Partial<DispensaryPaymentProcessor>) => ({
        ...dto,
      })),
      save: jest.fn((row: DispensaryPaymentProcessor) =>
        Promise.resolve({ ...row, id: row.id ?? 'generated-id' }),
      ),
    };
    dataSourceQuery = jest.fn();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DispensaryProcessorConfigService,
        {
          provide: getRepositoryToken(DispensaryPaymentProcessor),
          useValue: repo,
        },
        {
          provide: DataSource,
          useValue: { query: dataSourceQuery } as Partial<DataSource>,
        },
      ],
    }).compile();

    service = moduleRef.get(DispensaryProcessorConfigService);
  });

  describe('list', () => {
    it('returns the rows from the repo, ordered by processorName', async () => {
      repo.find.mockResolvedValue([{ processorName: 'aeropay' }]);
      const rows = await service.list('disp-1');
      expect(rows).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: { dispensaryId: 'disp-1' },
        order: { processorName: 'ASC' },
      });
    });
  });

  describe('getActiveProcessor', () => {
    it('returns the column value when present', async () => {
      dataSourceQuery.mockResolvedValue([
        { active_payment_processor: 'aeropay' },
      ]);
      const active = await service.getActiveProcessor('disp-1');
      expect(active).toBe(DispensaryProcessorName.AEROPAY);
    });

    it('returns null when the column is null', async () => {
      dataSourceQuery.mockResolvedValue([{ active_payment_processor: null }]);
      const active = await service.getActiveProcessor('disp-1');
      expect(active).toBeNull();
    });

    it('throws NotFoundException when the dispensary does not exist', async () => {
      dataSourceQuery.mockResolvedValue([]);
      await expect(service.getActiveProcessor('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setEnabled', () => {
    it('upserts a new row when none exists', async () => {
      repo.findOne.mockResolvedValue(null);

      const saved = await service.setEnabled({
        dispensaryId: 'disp-1',
        processorName: DispensaryProcessorName.AEROPAY,
        isEnabled: true,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dispensaryId: 'disp-1',
          processorName: DispensaryProcessorName.AEROPAY,
          isEnabled: true,
          isSandbox: true,
        }),
      );
      expect(repo.save).toHaveBeenCalled();
      expect(saved.isEnabled).toBe(true);
    });

    it('updates an existing row', async () => {
      const existing: Partial<DispensaryPaymentProcessor> = {
        id: 'row-1',
        dispensaryId: 'disp-1',
        processorName: DispensaryProcessorName.CANPAY,
        isEnabled: false,
        isSandbox: true,
      };
      repo.findOne.mockResolvedValue(existing);

      const saved = await service.setEnabled({
        dispensaryId: 'disp-1',
        processorName: DispensaryProcessorName.CANPAY,
        isEnabled: true,
        isSandbox: false,
      });

      expect(repo.create).not.toHaveBeenCalled();
      expect(saved.isEnabled).toBe(true);
      expect(saved.isSandbox).toBe(false);
    });

    it('clears the active processor when disabling the currently active one', async () => {
      repo.findOne.mockResolvedValue(null);
      dataSourceQuery
        // getActiveProcessor inside setEnabled
        .mockResolvedValueOnce([{ active_payment_processor: 'aeropay' }])
        // setActiveProcessor → UPDATE ... RETURNING
        .mockResolvedValueOnce([{ active_payment_processor: null }]);

      await service.setEnabled({
        dispensaryId: 'disp-1',
        processorName: DispensaryProcessorName.AEROPAY,
        isEnabled: false,
      });

      const calls = dataSourceQuery.mock.calls as Array<[string, unknown[]]>;
      const updateCall = calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('UPDATE dispensaries'),
      );
      expect(updateCall).toBeDefined();
      expect(updateCall?.[1]).toEqual([null, 'disp-1']);
    });
  });

  describe('setActiveProcessor', () => {
    it('rejects setting an active processor that is not enabled', async () => {
      repo.findOne.mockResolvedValue({ isEnabled: false });
      await expect(
        service.setActiveProcessor({
          dispensaryId: 'disp-1',
          processorName: DispensaryProcessorName.AEROPAY,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects setting an active processor with no row at all', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.setActiveProcessor({
          dispensaryId: 'disp-1',
          processorName: DispensaryProcessorName.CANPAY,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts setting active to null without checking rows', async () => {
      dataSourceQuery.mockResolvedValue([{ active_payment_processor: null }]);
      const result = await service.setActiveProcessor({
        dispensaryId: 'disp-1',
        processorName: null,
      });
      expect(repo.findOne).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('sets active when the processor is enabled', async () => {
      repo.findOne.mockResolvedValue({ isEnabled: true });
      dataSourceQuery.mockResolvedValue([
        { active_payment_processor: 'aeropay' },
      ]);
      const result = await service.setActiveProcessor({
        dispensaryId: 'disp-1',
        processorName: DispensaryProcessorName.AEROPAY,
      });
      expect(result).toBe(DispensaryProcessorName.AEROPAY);
    });

    it('throws NotFoundException when the dispensary does not exist', async () => {
      dataSourceQuery.mockResolvedValue([]);
      await expect(
        service.setActiveProcessor({
          dispensaryId: 'missing',
          processorName: null,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
