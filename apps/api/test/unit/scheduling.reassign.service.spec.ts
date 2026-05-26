/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';

import { SchedulingService } from '../../src/modules/scheduling/scheduling.service';
import {
  ScheduledShift,
  ShiftTemplate,
  ShiftSwapRequest,
  TimeOffRequest,
  DriverProfile,
  DeliveryTrip,
} from '../../src/modules/scheduling/entities/scheduling.entity';

describe('SchedulingService.reassignShift (sc-686)', () => {
  let service: SchedulingService;
  let dsQuery: jest.Mock;
  let shiftFindOne: jest.Mock;
  let shiftSave: jest.Mock;

  const existingShift = {
    shiftId: 's-1',
    dispensary_id: 'd-1',
    profile_id: 'p-1',
    shift_date: '2026-05-25',
    start_time: '09:00:00',
    end_time: '17:00:00',
  };

  beforeEach(async () => {
    dsQuery = jest.fn().mockResolvedValue([]);
    shiftFindOne = jest.fn().mockResolvedValue({ ...existingShift });
    shiftSave = jest
      .fn()
      .mockImplementation((s: unknown) => Promise.resolve(s));

    const mockDataSource: Partial<DataSource> = { query: dsQuery };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        {
          provide: getRepositoryToken(ScheduledShift),
          useValue: { findOne: shiftFindOne, save: shiftSave },
        },
        { provide: getRepositoryToken(ShiftTemplate), useValue: {} },
        { provide: getRepositoryToken(ShiftSwapRequest), useValue: {} },
        { provide: getRepositoryToken(TimeOffRequest), useValue: {} },
        { provide: getRepositoryToken(DriverProfile), useValue: {} },
        { provide: getRepositoryToken(DeliveryTrip), useValue: {} },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get(SchedulingService);
  });

  it('throws when the shift does not exist', async () => {
    shiftFindOne.mockResolvedValueOnce(null);
    await expect(
      service.reassignShift({
        shiftId: 'missing',
        profileId: 'p-1',
        shiftDate: '2026-05-26',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(dsQuery).not.toHaveBeenCalled();
    expect(shiftSave).not.toHaveBeenCalled();
  });

  it('throws when another shift overlaps on the target slot', async () => {
    dsQuery.mockResolvedValueOnce([{ shift_id: 'other' }]);
    await expect(
      service.reassignShift({
        shiftId: 's-1',
        profileId: 'p-1',
        shiftDate: '2026-05-26',
      }),
    ).rejects.toThrow(/conflicts/i);
    expect(shiftSave).not.toHaveBeenCalled();
  });

  it('throws when the target profile has approved time-off that day', async () => {
    dsQuery
      .mockResolvedValueOnce([]) // conflict scan
      .mockResolvedValueOnce([{ request_id: 'req-1' }]); // time-off scan
    await expect(
      service.reassignShift({
        shiftId: 's-1',
        profileId: 'p-2',
        shiftDate: '2026-05-26',
      }),
    ).rejects.toThrow(/time off/i);
    expect(shiftSave).not.toHaveBeenCalled();
  });

  it('persists the new profile + date on success', async () => {
    const result = await service.reassignShift({
      shiftId: 's-1',
      profileId: 'p-9',
      shiftDate: '2026-05-30',
    });
    expect(shiftSave).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      shiftId: 's-1',
      profile_id: 'p-9',
      shift_date: '2026-05-30',
    });
  });

  it('excludes the shift itself from the conflict scan (no-op reassign)', async () => {
    await service.reassignShift({
      shiftId: 's-1',
      profileId: 'p-1',
      shiftDate: '2026-05-25',
    });
    const [, params] = dsQuery.mock.calls[0] as [string, unknown[]];
    // params: [profileId, shiftDate, shiftId, startTime, endTime]
    expect(params[2]).toBe('s-1');
    const [sql] = dsQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/shift_id <> \$3/);
  });
});
