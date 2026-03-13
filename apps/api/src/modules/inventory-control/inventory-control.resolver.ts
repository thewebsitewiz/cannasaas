import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { InventoryControlService } from './inventory-control.service';
import { InventoryTransfer, InventoryTransferItem, InventoryCount, InventoryCountItem, InventoryAdjustment, LkpAdjustmentReason } from './entities/inventory-control.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType() class InventoryHealth {
  @Field(() => Int) totalSkus!: number;
  @Field(() => Int) totalUnits!: number;
  @Field(() => Int) lowStock!: number;
  @Field(() => Int) outOfStock!: number;
  @Field(() => Int) expired!: number;
  @Field(() => Int) expiring30d!: number;
  @Field(() => Int) deadStock!: number;
  @Field(() => Int) pendingTransfers!: number;
  @Field(() => Int) pendingAdjustments!: number;
}

@InputType() class TransferItemInput {
  @Field(() => ID) variantId!: string;
  @Field(() => Int) quantity!: number;
}
@InputType() class ReceiveItemInput {
  @Field(() => ID) itemId!: string;
  @Field(() => Int) quantityReceived!: number;
  @Field({ nullable: true }) notes?: string;
}

@Resolver()
export class InventoryControlResolver {
  constructor(private readonly invCtrl: InventoryControlService) {}

  // ── Transfers ─────────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => InventoryTransfer, { name: 'createTransfer' })
  async createTransfer(
    @Args('fromDispensaryId', { type: () => ID }) fromDispensaryId: string,
    @Args('toDispensaryId', { type: () => ID }) toDispensaryId: string,
    @Args('items', { type: () => [TransferItemInput] }) items: TransferItemInput[],
    @Args('notes', { nullable: true }) notes: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<InventoryTransfer> {
    return this.invCtrl.createTransfer({
      organizationId: user.organizationId || '', fromDispensaryId, toDispensaryId,
      requestedByUserId: user.sub, notes, items,
    });
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => InventoryTransfer, { name: 'approveTransfer' })
  async approveTransfer(
    @Args('transferId', { type: () => ID }) transferId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<InventoryTransfer> {
    return this.invCtrl.approveTransfer(transferId, user.sub);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => InventoryTransfer, { name: 'shipTransfer' })
  async shipTransfer(@Args('transferId', { type: () => ID }) transferId: string): Promise<InventoryTransfer> {
    return this.invCtrl.shipTransfer(transferId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => InventoryTransfer, { name: 'receiveTransfer' })
  async receiveTransfer(
    @Args('transferId', { type: () => ID }) transferId: string,
    @Args('items', { type: () => [ReceiveItemInput] }) items: ReceiveItemInput[],
  ): Promise<InventoryTransfer> {
    return this.invCtrl.receiveTransfer(transferId, items);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => InventoryTransfer, { name: 'rejectTransfer' })
  async rejectTransfer(
    @Args('transferId', { type: () => ID }) transferId: string,
    @Args('reason') reason: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<InventoryTransfer> {
    return this.invCtrl.rejectTransfer(transferId, user.sub, reason);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [InventoryTransfer], { name: 'inventoryTransfers' })
  async transfers(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('direction', { nullable: true }) direction: string,
  ): Promise<any[]> {
    return this.invCtrl.getTransfers(dispensaryId, direction);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [InventoryTransferItem], { name: 'transferItems' })
  async transferItems(@Args('transferId', { type: () => ID }) transferId: string): Promise<InventoryTransferItem[]> {
    return this.invCtrl.getTransferItems(transferId);
  }

  // ── Counts ────────────────────────────────────────────────────────────────

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => InventoryCount, { name: 'startInventoryCount' })
  async startCount(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('countType', { defaultValue: 'cycle' }) countType: string,
    @Args('notes', { nullable: true }) notes: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<InventoryCount> {
    return this.invCtrl.startCount(dispensaryId, user.sub, countType, notes);
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => InventoryCountItem, { name: 'recordCountItem' })
  async recordCount(
    @Args('countItemId', { type: () => ID }) countItemId: string,
    @Args('countedQuantity', { type: () => Int }) countedQuantity: number,
    @Args('notes', { nullable: true }) notes: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<InventoryCountItem> {
    return this.invCtrl.recordCount(countItemId, countedQuantity, user.sub, notes);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => InventoryCount, { name: 'completeInventoryCount' })
  async completeCount(
    @Args('countId', { type: () => ID }) countId: string,
    @Args('autoAdjust', { defaultValue: false }) autoAdjust: boolean,
    @CurrentUser() user: JwtPayload,
  ): Promise<InventoryCount> {
    return this.invCtrl.completeCount(countId, user.sub, autoAdjust);
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [InventoryCountItem], { name: 'countItems' })
  async countItems(@Args('countId', { type: () => ID }) countId: string): Promise<InventoryCountItem[]> {
    return this.invCtrl.getCountItems(countId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [InventoryCountItem], { name: 'varianceReport' })
  async varianceReport(@Args('countId', { type: () => ID }) countId: string): Promise<any[]> {
    return this.invCtrl.getVarianceReport(countId);
  }

  // ── Adjustments ───────────────────────────────────────────────────────────

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => InventoryAdjustment, { name: 'createAdjustment' })
  async createAdj(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('variantId', { type: () => ID }) variantId: string,
    @Args('reasonCode') reasonCode: string,
    @Args('quantityChange', { type: () => Int }) quantityChange: number,
    @Args('notes', { nullable: true }) notes: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<InventoryAdjustment> {
    return this.invCtrl.createAdjustment({ dispensaryId, variantId, reasonCode, quantityChange, submittedByUserId: user.sub, notes });
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => InventoryAdjustment, { name: 'approveAdjustment' })
  async approveAdj(
    @Args('adjustmentId', { type: () => ID }) adjustmentId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<InventoryAdjustment> {
    return this.invCtrl.approveAdjustment(adjustmentId, user.sub);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [InventoryAdjustment], { name: 'inventoryAdjustments' })
  async adjustments(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit: number,
  ): Promise<any[]> {
    return this.invCtrl.getAdjustments(dispensaryId, limit);
  }

  @Query(() => [LkpAdjustmentReason], { name: 'adjustmentReasons' })
  async reasons(): Promise<LkpAdjustmentReason[]> {
    return this.invCtrl.getAdjustmentReasons();
  }

  // ── Alerts & Health ───────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => InventoryHealth, { name: 'inventoryHealth' })
  async health(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<any> {
    return this.invCtrl.getInventoryHealthDashboard(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [InventoryAdjustment], { name: 'expiringInventory', nullable: true })
  async expiring(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('daysAhead', { type: () => Int, nullable: true, defaultValue: 30 }) daysAhead: number,
  ): Promise<any[]> {
    return this.invCtrl.getExpiringInventory(dispensaryId, daysAhead);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [InventoryAdjustment], { name: 'reorderAlerts' })
  async reorder(@Args('dispensaryId', { type: () => ID }) dispensaryId: string): Promise<any[]> {
    return this.invCtrl.getReorderAlerts(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [InventoryAdjustment], { name: 'deadStock' })
  async deadStock(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('daysSinceMovement', { type: () => Int, nullable: true, defaultValue: 30 }) days: number,
  ): Promise<any[]> {
    return this.invCtrl.getDeadStock(dispensaryId, days);
  }
}
