// cannasaas-api/src/modules/feature-flags/feature-flag.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { FeatureFlag, Feature, Plan, PLAN_FEATURES }
  from './entities/feature-flag.entity';

@Injectable()
export class FeatureFlagService {
  private readonly TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(FeatureFlag)
    private flagRepo: Repository<FeatureFlag>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async isEnabled(orgId: string, feature: Feature): Promise<boolean> {
    const cacheKey = `ff:${orgId}:${feature}`;
    const cached = await this.cache.get<boolean>(cacheKey);
    if (cached !== undefined && cached !== null) return cached;

    const flag = await this.flagRepo.findOne({
      where: { organizationId: orgId },
    });
    if (!flag) return false;

    // Check org-specific overrides first, then plan defaults
    if (flag.overrides[feature] !== undefined) {
      await this.cache.set(cacheKey, flag.overrides[feature], this.TTL);
      return flag.overrides[feature];
    }

    const enabled = PLAN_FEATURES[flag.plan]?.includes(feature) ?? false;
    await this.cache.set(cacheKey, enabled, this.TTL);
    return enabled;
  }

  async getAllFlags(orgId: string): Promise<Record<Feature, boolean>> {
    const flag = await this.flagRepo.findOne({
      where: { organizationId: orgId },
    });
    const result = {} as Record<Feature, boolean>;
    for (const f of Object.values(Feature)) {
      if (flag?.overrides[f] !== undefined) {
        result[f] = flag.overrides[f];
      } else {
        result[f] = PLAN_FEATURES[flag?.plan]?.includes(f) ?? false;
      }
    }
    return result;
  }

  async setOverride(orgId: string, feature: Feature, enabled: boolean) {
    const flag = await this.flagRepo.findOneOrFail({
      where: { organizationId: orgId },
    });
    flag.overrides = { ...flag.overrides, [feature]: enabled };
    await this.flagRepo.save(flag);
    await this.cache.del(`ff:${orgId}:${feature}`);
  }

  async invalidateCache(orgId: string) {
    for (const f of Object.values(Feature)) {
      await this.cache.del(`ff:${orgId}:${f}`);
    }
  }
}
