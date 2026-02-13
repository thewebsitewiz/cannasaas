import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Feature } from './entities/feature-flag.entity';
import { FeatureFlagService } from './feature-flag.service';
import { Reflector } from '@nestjs/core';
export declare const FEATURE_KEY = "required_feature";
export declare const RequireFeature: (feature: Feature) => import("@nestjs/common").CustomDecorator<string>;
export declare class FeatureFlagGuard implements CanActivate {
    private reflector;
    private featureFlags;
    constructor(reflector: Reflector, featureFlags: FeatureFlagService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
