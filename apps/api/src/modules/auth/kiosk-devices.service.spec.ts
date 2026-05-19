import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';

import { KioskDevice } from './entities/kiosk-device.entity';
import { KioskDevicesService } from './kiosk-devices.service';

type MockRepo = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
};

describe('KioskDevicesService', () => {
  let service: KioskDevicesService;
  let repo: MockRepo;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((dto: Partial<KioskDevice>) => ({ ...dto })),
      save: jest.fn((row: KioskDevice) =>
        Promise.resolve({ ...row, id: row.id ?? 'gen' }),
      ),
      update: jest.fn(() => Promise.resolve({ affected: 1 })),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        KioskDevicesService,
        { provide: getRepositoryToken(KioskDevice), useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(KioskDevicesService);
  });

  describe('rotate', () => {
    it('creates a row with a fresh tokenId on first provision', async () => {
      repo.findOne.mockResolvedValue(null);
      const tokenId = await service.rotate({
        userId: 'u-1',
        dispensaryId: 'd-1',
        label: 'pos-1',
      });
      expect(tokenId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          dispensaryId: 'd-1',
          label: 'pos-1',
          currentTokenId: tokenId,
        }),
      );
      expect(repo.save).toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('updates the existing row with a new tokenId on re-provision', async () => {
      repo.findOne.mockResolvedValue({
        id: 'kd-1',
        userId: 'u-1',
        dispensaryId: 'd-1',
        label: 'pos-1',
        currentTokenId: 'previous-token',
      });
      const tokenId = await service.rotate({
        userId: 'u-1',
        dispensaryId: 'd-1',
        label: 'pos-1',
      });
      expect(tokenId).not.toBe('previous-token');
      expect(repo.update).toHaveBeenCalledWith(
        'kd-1',
        expect.objectContaining({
          currentTokenId: tokenId,
          label: 'pos-1',
          dispensaryId: 'd-1',
        }),
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('returns a different tokenId on every call', async () => {
      repo.findOne.mockResolvedValue(null);
      const t1 = await service.rotate({
        userId: 'u-1',
        dispensaryId: 'd-1',
        label: 'pos-1',
      });
      const t2 = await service.rotate({
        userId: 'u-2',
        dispensaryId: 'd-1',
        label: 'pos-2',
      });
      expect(t1).not.toBe(t2);
    });
  });

  describe('findByUser', () => {
    it('returns the row when present', async () => {
      const row = {
        id: 'kd-1',
        userId: 'u-1',
        dispensaryId: 'd-1',
        label: 'pos-1',
        currentTokenId: 'tok-1',
      } as KioskDevice;
      repo.findOne.mockResolvedValue(row);
      await expect(service.findByUser('u-1')).resolves.toEqual(row);
    });

    it('returns null when no row exists (legacy kiosk path)', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findByUser('u-1')).resolves.toBeNull();
    });
  });

  describe('attestPublicKey', () => {
    it('writes the public key to a freshly-rotated row', async () => {
      repo.findOne.mockResolvedValue({
        id: 'kd-1',
        userId: 'u-1',
        publicKey: null,
      });
      await service.attestPublicKey('u-1', '-----BEGIN PUBLIC KEY-----...');
      expect(repo.update).toHaveBeenCalledWith(
        'kd-1',
        expect.objectContaining({
          publicKey: expect.stringContaining('BEGIN PUBLIC KEY') as unknown,
        }),
      );
    });

    it('rejects when the device already has a key (must re-provision)', async () => {
      repo.findOne.mockResolvedValue({
        id: 'kd-1',
        userId: 'u-1',
        publicKey: '-----BEGIN PUBLIC KEY-----existing',
      });
      await expect(
        service.attestPublicKey('u-1', '-----BEGIN PUBLIC KEY-----new'),
      ).rejects.toThrow(ConflictException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('rejects when no device exists for this user', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.attestPublicKey('u-1', '-----BEGIN PUBLIC KEY-----'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('rotate clears publicKey', () => {
    it('null-outs publicKey on re-provision (forces re-attestation)', async () => {
      repo.findOne.mockResolvedValue({
        id: 'kd-1',
        userId: 'u-1',
        dispensaryId: 'd-1',
        label: 'pos-1',
        currentTokenId: 'previous',
        publicKey: '-----BEGIN PUBLIC KEY-----old',
      });
      await service.rotate({
        userId: 'u-1',
        dispensaryId: 'd-1',
        label: 'pos-1',
      });
      expect(repo.update).toHaveBeenCalledWith(
        'kd-1',
        expect.objectContaining({ publicKey: null }),
      );
    });
  });
});
