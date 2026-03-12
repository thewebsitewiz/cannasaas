import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { PosService } from './pos.service';
import { PosIntegration } from './entities/pos-integration.entity';
import { PosProductMapping } from './entities/pos-product-mapping.entity';
import { PosSyncLog } from './entities/pos-sync-log.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
class PosConnectionResult {
  @Field() success!: boolean;
  @Field() message!: string;
}

@ObjectType()
class PosOrderPushResult {
  @Field() success!: boolean;
  @Field({ nullable: true }) externalOrderId?: string;
  @Field({ nullable: true }) error?: string;
}

@Resolver()
export class PosResolver {
  constructor(private readonly pos: PosService) {}

  private guard(user: JwtPayload, dispensaryId: string): void {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId) throw new ForbiddenException('Access denied');
  }

  // ── Integration Management ────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => PosIntegration, { name: 'posIntegration', nullable: true })
  async getIntegration(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PosIntegration | null> {
    this.guard(user, dispensaryId);
    return this.pos.getIntegration(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => PosIntegration, { name: 'upsertPosIntegration' })
  async upsertIntegration(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('provider') provider: string,
    @Args('credentials', { type: () => GraphQLJSON }) credentials: Record<string, any>,
    @Args('dispensaryExternalId', { nullable: true }) dispensaryExternalId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PosIntegration> {
    this.guard(user, dispensaryId);
    return this.pos.upsertIntegration({ dispensaryId, provider, credentials, dispensaryExternalId });
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => PosConnectionResult, { name: 'testPosConnection' })
  async testConnection(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; message: string }> {
    this.guard(user, dispensaryId);
    return this.pos.testConnection(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => PosIntegration, { name: 'togglePosSync' })
  async toggleSync(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('enabled') enabled: boolean,
    @CurrentUser() user: JwtPayload,
  ): Promise<PosIntegration> {
    this.guard(user, dispensaryId);
    return this.pos.activateSync(dispensaryId, enabled);
  }

  // ── Sync Triggers ─────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => PosSyncLog, { name: 'syncPosProducts' })
  async syncProducts(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PosSyncLog> {
    this.guard(user, dispensaryId);
    return this.pos.syncProducts(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => PosSyncLog, { name: 'syncPosInventory' })
  async syncInventory(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PosSyncLog> {
    this.guard(user, dispensaryId);
    return this.pos.syncInventory(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => PosOrderPushResult, { name: 'pushOrderToPos' })
  async pushOrder(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; externalOrderId?: string; error?: string }> {
    this.guard(user, dispensaryId);
    return this.pos.pushOrderToPos(orderId, dispensaryId);
  }

  // ── Logs & Mappings ───────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [PosSyncLog], { name: 'posSyncLogs' })
  async syncLogs(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<PosSyncLog[]> {
    this.guard(user, dispensaryId);
    return this.pos.getSyncLogs(dispensaryId, limit);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [PosProductMapping], { name: 'posProductMappings' })
  async mappings(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PosProductMapping[]> {
    this.guard(user, dispensaryId);
    return this.pos.getMappings(dispensaryId);
  }
}
