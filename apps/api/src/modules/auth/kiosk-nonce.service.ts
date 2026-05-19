import { Injectable } from '@nestjs/common';

import { CacheService } from '../../common/services/cache.service';

/**
 * Sliding-window nonce cache for kiosk device-signature replay protection.
 *
 * On every signed kiosk request, the guard calls `consume(userId, nonce)`.
 * Redis `SET key NX EX 90` is atomic; first writer wins, replays return
 * `false`. The 90-second TTL is loose enough to cover the iat freshness
 * window (60 s skew) plus a buffer for clock drift and request latency.
 */
@Injectable()
export class KioskNonceService {
  private static readonly TTL_SECONDS = 90;

  constructor(private readonly cache: CacheService) {}

  /**
   * Returns true if the nonce was accepted (first use); false if it was
   * already present in the window and should be rejected as a replay.
   */
  async consume(userId: string, nonce: string): Promise<boolean> {
    return this.cache.setNxEx(
      `kiosk-nonce:${userId}:${nonce}`,
      '1',
      KioskNonceService.TTL_SECONDS,
    );
  }
}
