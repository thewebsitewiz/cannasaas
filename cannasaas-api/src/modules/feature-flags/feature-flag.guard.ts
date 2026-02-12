import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';

import { Feature } from './entities/feature-flag.entity';
import { FeatureFlagService } from './feature-flag.service';
import { Reflector } from '@nestjs/core';

export const FEATURE_KEY = 'required_feature';
export const RequireFeature = (feature: Feature) =>
  SetMetadata(FEATURE_KEY, feature);

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlags: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<Feature>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!feature) return true;

    const request = context.switchToHttp().getRequest();
    const orgId = request.user?.organizationId;
    if (!orgId) throw new ForbiddenException('No organization context');

    const enabled = await this.featureFlags.isEnabled(orgId, feature);
    if (!enabled) {
      throw new ForbiddenException(
        `Feature "${feature}" not available on your plan. Upgrade to access.`,
      );
    }
    return true;
  }
}

// Usage:
// @UseGuards(AuthGuard, FeatureFlagGuard)
// @RequireFeature(Feature.AI_RECOMMENDATIONS)
// @Get('recommendations')
// async getRecommendations() { ... }
