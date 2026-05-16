import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { RegisterSession } from './entities/register-session.entity';
import { RegisterSessionService } from './register-session.service';

type MockRepo = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

describe('RegisterSessionService', () => {
  let service: RegisterSessionService;
  let repo: MockRepo;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((dto: Partial<RegisterSession>) => ({ ...dto })),
      save: jest.fn((row: RegisterSession) =>
        Promise.resolve({ ...row, id: row.id ?? 'gen' }),
      ),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterSessionService,
        {
          provide: getRepositoryToken(RegisterSession),
          useValue: repo,
        },
      ],
    }).compile();

    service = moduleRef.get(RegisterSessionService);
  });

  describe('open', () => {
    it('rejects a negative opening cash amount', async () => {
      await expect(
        service.open({
          dispensaryId: 'd',
          userId: 'u',
          openingCashCents: -1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when the user already has an open session', async () => {
      repo.findOne.mockResolvedValue({ id: 'existing', status: 'open' });
      await expect(
        service.open({
          dispensaryId: 'd',
          userId: 'u',
          openingCashCents: 10000,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('opens a new session', async () => {
      repo.findOne.mockResolvedValue(null);
      const saved = await service.open({
        dispensaryId: 'd-1',
        userId: 'u-1',
        openingCashCents: 25000,
      });
      expect(saved.openingCashCents).toBe(25000);
      expect(saved.status).toBe('open');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dispensaryId: 'd-1',
          openedByUserId: 'u-1',
          openingCashCents: 25000,
          status: 'open',
        }),
      );
    });
  });

  describe('close', () => {
    it('rejects negative closing cash', async () => {
      await expect(
        service.close({
          sessionId: 's',
          userId: 'u',
          closingCashCents: -1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when the session does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.close({
          sessionId: 'missing',
          userId: 'u',
          closingCashCents: 0,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects when a different user tries to close', async () => {
      repo.findOne.mockResolvedValue({
        id: 's-1',
        openedByUserId: 'other',
        status: 'open',
      });
      await expect(
        service.close({
          sessionId: 's-1',
          userId: 'u-1',
          closingCashCents: 25000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an already-closed session', async () => {
      repo.findOne.mockResolvedValue({
        id: 's-1',
        openedByUserId: 'u-1',
        status: 'closed',
      });
      await expect(
        service.close({
          sessionId: 's-1',
          userId: 'u-1',
          closingCashCents: 25000,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('closes an open session and records closing cash + closedAt', async () => {
      const session = {
        id: 's-1',
        openedByUserId: 'u-1',
        status: 'open',
        openingCashCents: 25000,
      } as RegisterSession;
      repo.findOne.mockResolvedValue(session);

      const saved = await service.close({
        sessionId: 's-1',
        userId: 'u-1',
        closingCashCents: 26500,
      });

      expect(saved.status).toBe('closed');
      expect(saved.closingCashCents).toBe(26500);
      expect(saved.closedAt).toBeInstanceOf(Date);
    });
  });

  describe('myCurrent', () => {
    it('returns the open session for the user when one exists', async () => {
      repo.findOne.mockResolvedValue({ id: 's-1', status: 'open' });
      const result = await service.myCurrent('d-1', 'u-1');
      expect(result?.id).toBe('s-1');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { dispensaryId: 'd-1', openedByUserId: 'u-1', status: 'open' },
      });
    });

    it('returns null when none open', async () => {
      repo.findOne.mockResolvedValue(null);
      expect(await service.myCurrent('d-1', 'u-1')).toBeNull();
    });
  });
});
