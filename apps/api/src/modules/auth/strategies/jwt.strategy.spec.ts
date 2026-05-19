import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

import { KioskDevicesService } from '../kiosk-devices.service';
import { JwtPayload, JwtStrategy } from './jwt.strategy';
import { KioskDevice } from '../entities/kiosk-device.entity';

describe('JwtStrategy — kiosk revocation', () => {
  let strategy: JwtStrategy;
  let findByUser: jest.Mock;

  beforeEach(async () => {
    findByUser = jest.fn();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { get: () => 'test-secret' },
        },
        {
          provide: KioskDevicesService,
          useValue: { findByUser },
        },
      ],
    }).compile();
    strategy = moduleRef.get(JwtStrategy);
  });

  function customer(): JwtPayload {
    return {
      sub: 'u-cust',
      email: 'c@example.com',
      role: 'customer',
    };
  }

  function kioskTokenWith(tokenId: string | undefined): JwtPayload {
    return {
      sub: 'u-kiosk',
      email: 'kiosk-pos-1@disp.kiosk.local',
      role: 'kiosk',
      dispensaryId: 'd-1',
      tokenId,
    };
  }

  it('passes non-kiosk payloads through without a DB lookup', async () => {
    await expect(strategy.validate(customer())).resolves.toEqual(customer());
    expect(findByUser).not.toHaveBeenCalled();
  });

  it('passes legacy kiosks (no kiosk_devices row) through', async () => {
    findByUser.mockResolvedValue(null);
    const payload = kioskTokenWith(undefined);
    await expect(strategy.validate(payload)).resolves.toEqual(payload);
    expect(findByUser).toHaveBeenCalledWith('u-kiosk');
  });

  it('accepts a kiosk token whose tokenId matches currentTokenId', async () => {
    findByUser.mockResolvedValue({
      id: 'kd-1',
      userId: 'u-kiosk',
      currentTokenId: 'tok-current',
    } as KioskDevice);
    const payload = kioskTokenWith('tok-current');
    await expect(strategy.validate(payload)).resolves.toEqual(payload);
  });

  it('rejects a kiosk token whose tokenId no longer matches', async () => {
    findByUser.mockResolvedValue({
      id: 'kd-1',
      userId: 'u-kiosk',
      currentTokenId: 'tok-current',
    } as KioskDevice);
    const payload = kioskTokenWith('tok-stale');
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a kiosk token with no tokenId when a row exists', async () => {
    findByUser.mockResolvedValue({
      id: 'kd-1',
      userId: 'u-kiosk',
      currentTokenId: 'tok-current',
    } as KioskDevice);
    const payload = kioskTokenWith(undefined);
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
