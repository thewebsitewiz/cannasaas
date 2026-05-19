import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import { KioskDevice } from './entities/kiosk-device.entity';

/**
 * Manages the kiosk_devices table — the source of truth for which `tokenId`
 * claim a given kiosk's JWT must currently carry.
 *
 * Two operations matter:
 *
 * - `rotate`: called from `provisionKiosk`. Generates a fresh `tokenId` and
 *   upserts the device row by `userId` (the kiosk operator user is 1:1 with
 *   the device). Returns the new `tokenId` to be embedded in the JWT.
 *
 * - `findByUser`: called from the JWT strategy on every kiosk-role request.
 *   Returns null for legacy kiosks (no row) so they bypass the check;
 *   returns the row for provisioned kiosks so the strategy can match
 *   `currentTokenId` against the token's claim.
 */
@Injectable()
export class KioskDevicesService {
  constructor(
    @InjectRepository(KioskDevice)
    private readonly repo: Repository<KioskDevice>,
  ) {}

  async rotate(args: {
    userId: string;
    dispensaryId: string;
    label: string;
  }): Promise<string> {
    const tokenId = crypto.randomUUID();
    const existing = await this.repo.findOne({
      where: { userId: args.userId },
    });
    if (existing) {
      await this.repo.update(existing.id, {
        currentTokenId: tokenId,
        label: args.label,
        dispensaryId: args.dispensaryId,
      });
    } else {
      const row = this.repo.create({
        userId: args.userId,
        dispensaryId: args.dispensaryId,
        label: args.label,
        currentTokenId: tokenId,
      });
      await this.repo.save(row);
    }
    return tokenId;
  }

  findByUser(userId: string): Promise<KioskDevice | null> {
    return this.repo.findOne({ where: { userId } });
  }
}
