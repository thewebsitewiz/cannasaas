import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { FeatureFlag, Feature } from './entities/feature-flag.entity';
export declare class FeatureFlagService {
    private flagRepo;
    private cache;
    private readonly TTL;
    constructor(flagRepo: Repository<FeatureFlag>, cache: Cache);
    isEnabled(orgId: string, feature: Feature): Promise<boolean>;
    getAllFlags(orgId: string): Promise<Record<Feature, boolean>>;
    setOverride(orgId: string, feature: Feature, enabled: boolean): Promise<void>;
    invalidateCache(orgId: string): Promise<void>;
}
