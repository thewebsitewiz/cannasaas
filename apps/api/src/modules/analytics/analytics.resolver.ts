import { Resolver, Query, Args, ID, Int } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  DashboardData, SalesOverview, SalesTrend, TopProduct,
  InventoryOverview, LowStockItem, MetrcSyncOverview, ComplianceSummary,
} from './dto/dashboard.types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analytics: AnalyticsService) {}

  private resolveDispensary(user: JwtPayload, dispensaryId?: string): string {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (user.role === 'dispensary_admin' && targetId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return targetId;
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => DashboardData, { name: 'dashboard' })
  async dashboard(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
    @Args('days', { type: () => Int, nullable: true }) days?: number,
  ): Promise<DashboardData> {
    return this.analytics.getDashboard(this.resolveDispensary(user, dispensaryId), days ?? 30);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => SalesOverview, { name: 'salesOverview' })
  async salesOverview(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
    @Args('days', { type: () => Int, nullable: true }) days?: number,
  ): Promise<SalesOverview> {
    return this.analytics.getSalesOverview(this.resolveDispensary(user, dispensaryId), days ?? 30);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [SalesTrend], { name: 'salesTrend' })
  async salesTrend(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
    @Args('days', { type: () => Int, nullable: true }) days?: number,
  ): Promise<SalesTrend[]> {
    return this.analytics.getSalesTrend(this.resolveDispensary(user, dispensaryId), days ?? 30);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [TopProduct], { name: 'topProducts' })
  async topProducts(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
    @Args('days', { type: () => Int, nullable: true }) days?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<TopProduct[]> {
    return this.analytics.getTopProducts(this.resolveDispensary(user, dispensaryId), days ?? 30, limit ?? 10);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => InventoryOverview, { name: 'inventoryOverview' })
  async inventoryOverview(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
  ): Promise<InventoryOverview> {
    return this.analytics.getInventoryOverview(this.resolveDispensary(user, dispensaryId));
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [LowStockItem], { name: 'lowStockItems' })
  async lowStockItems(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
  ): Promise<LowStockItem[]> {
    return this.analytics.getLowStockItems(this.resolveDispensary(user, dispensaryId));
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => MetrcSyncOverview, { name: 'metrcSyncOverview' })
  async metrcSyncOverview(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
  ): Promise<MetrcSyncOverview> {
    return this.analytics.getMetrcSyncOverview(this.resolveDispensary(user, dispensaryId));
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => ComplianceSummary, { name: 'complianceSummary' })
  async complianceSummary(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
  ): Promise<ComplianceSummary> {
    return this.analytics.getComplianceSummary(this.resolveDispensary(user, dispensaryId));
  }
}
