/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';

import { KioskDevicesService } from '../../src/modules/auth/kiosk-devices.service';
import { KioskDevice } from '../../src/modules/auth/entities/kiosk-device.entity';

describe('KioskDevicesService.rotate — re-provisioning (sc-600 TC-MIG-005)', () => {
  let service: KioskDevicesService;
  let findOne: jest.Mock;
  let update: jest.Mock;
  let save: jest.Mock;
  let create: jest.Mock;

  beforeEach(async () => {
    findOne = jest.fn();
    update = jest.fn().mockResolvedValue(undefined);
    save = jest.fn().mockImplementation((row) => Promise.resolve(row));
    create = jest.fn().mockImplementation((row) => row);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KioskDevicesService,
        {
          provide: getRepositoryToken(KioskDevice),
          useValue: { findOne, update, save, create },
        },
      ],
    }).compile();

    service = module.get(KioskDevicesService);
  });

  it('TC-MIG-005 — re-provisioning an existing kiosk clears publicKey to null', async () => {
    findOne.mockResolvedValueOnce({
      id: 'k-1',
      userId: 'u-1',
      dispensaryId: 'd-1',
      label: 'Front-of-house',
      currentTokenId: 'tok-old',
      publicKey: 'EXISTING_KEY',
    });

    await service.rotate({
      userId: 'u-1',
      dispensaryId: 'd-1',
      label: 'Front-of-house',
    });

    expect(update).toHaveBeenCalledTimes(1);
    const [id, patch] = update.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(id).toBe('k-1');
    expect(patch.publicKey).toBeNull();
  });

  it('TC-MIG-005 — re-provisioning generates a fresh currentTokenId (UUID v4)', async () => {
    findOne.mockResolvedValueOnce({
      id: 'k-1',
      userId: 'u-1',
      dispensaryId: 'd-1',
      label: 'Front',
      currentTokenId: 'tok-old',
      publicKey: 'EXISTING',
    });

    const newTokenId = await service.rotate({
      userId: 'u-1',
      dispensaryId: 'd-1',
      label: 'Front',
    });

    expect(newTokenId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(newTokenId).not.toBe('tok-old');
    const [, patch] = update.mock.calls[0] as [string, Record<string, unknown>];
    expect(patch.currentTokenId).toBe(newTokenId);
  });

  it('TC-MIG-005 — fresh provision (no existing row) creates a row with publicKey=null', async () => {
    findOne.mockResolvedValueOnce(null);

    await service.rotate({
      userId: 'u-new',
      dispensaryId: 'd-1',
      label: 'New',
    });

    expect(update).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as Record<string, unknown>;
    expect(saved.publicKey).toBeNull();
    expect(saved.userId).toBe('u-new');
    expect(saved.dispensaryId).toBe('d-1');
    expect(saved.label).toBe('New');
  });

  it('re-provisioning preserves identity (does not create a new row)', async () => {
    findOne.mockResolvedValueOnce({
      id: 'k-1',
      userId: 'u-1',
      dispensaryId: 'd-1',
      label: 'Front',
      currentTokenId: 'tok-old',
      publicKey: 'EXISTING',
    });

    await service.rotate({
      userId: 'u-1',
      dispensaryId: 'd-1',
      label: 'Front',
    });

    expect(save).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('re-provisioning to a new dispensary + label updates both fields', async () => {
    findOne.mockResolvedValueOnce({
      id: 'k-1',
      userId: 'u-1',
      dispensaryId: 'd-old',
      label: 'Old',
      currentTokenId: 'tok-old',
      publicKey: 'EXISTING',
    });

    await service.rotate({
      userId: 'u-1',
      dispensaryId: 'd-new',
      label: 'New',
    });

    const [, patch] = update.mock.calls[0] as [string, Record<string, unknown>];
    expect(patch.dispensaryId).toBe('d-new');
    expect(patch.label).toBe('New');
  });
});

describe('KioskDevicesService.attestPublicKey', () => {
  let service: KioskDevicesService;
  let findOne: jest.Mock;
  let update: jest.Mock;

  beforeEach(async () => {
    findOne = jest.fn();
    update = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KioskDevicesService,
        {
          provide: getRepositoryToken(KioskDevice),
          useValue: { findOne, update, save: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(KioskDevicesService);
  });

  it('stores the SPKI key on a freshly-provisioned device (publicKey was null)', async () => {
    findOne.mockResolvedValueOnce({ id: 'k-1', publicKey: null });
    await service.attestPublicKey('u-1', 'PEM_BYTES');
    expect(update).toHaveBeenCalledWith('k-1', { publicKey: 'PEM_BYTES' });
  });

  it('rejects when no device exists for the user', async () => {
    findOne.mockResolvedValueOnce(null);
    await expect(service.attestPublicKey('u-missing', 'PEM')).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects when the device already has a public key (re-provision required to rotate)', async () => {
    findOne.mockResolvedValueOnce({ id: 'k-1', publicKey: 'ALREADY' });
    await expect(service.attestPublicKey('u-1', 'NEW')).rejects.toThrow(
      /already attested/i,
    );
  });
});
