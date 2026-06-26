import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  Float,
} from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import {
  InventoryService,
  InventoryRow,
  InventoryAdjustResult,
  InventoryValueDto,
  type DispensaryTxRow,
} from './inventory.service';
import {
  ReorderSuggestionService,
  ReorderSuggestionDto,
} from './reorder-suggestion.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType()
class InventoryResult {
  @Field(() => ID) inventoryId!: string;
  @Field(() => ID) variantId!: string;
  @Field(() => ID) dispensaryId!: string;
  @Field(() => Float) quantityOnHand!: number;
  @Field(() => Float) quantityReserved!: number;
  @Field(() => Float) quantityAvailable!: number;
  @Field(() => Float, { nullable: true }) reorderThreshold?: number;
  @Field(() => Float, { nullable: true }) reorderQuantity?: number;
  @Field({ nullable: true }) locationInStore?: string;
  @Field(() => Date, { nullable: true }) lastMetrcSyncAt?: Date;
  @Field(() => Date, { nullable: true }) lastReconciledAt?: Date;
  @Field(() => Date, { nullable: true }) lastCountAt?: Date;
  @Field(() => ID, { nullable: true }) lastCountByUserId?: string;
  @Field(() => Date) createdAt!: Date;
  @Field(() => Date) updatedAt!: Date;
}

@ObjectType()
class InventoryListItem {
  @Field(() => ID) inventoryId!: string;
  @Field(() => ID) variantId!: string;
  @Field(() => ID) dispensaryId!: string;
  @Field(() => Float) quantityOnHand!: number;
  @Field(() => Float) quantityReserved!: number;
  @Field(() => Float) quantityAvailable!: number;
  @Field(() => Float, { nullable: true }) reorderThreshold?: number;
  @Field({ nullable: true }) locationInStore?: string;
  @Field(() => Date) createdAt!: Date;
  @Field(() => Date) updatedAt!: Date;
}

@ObjectType()
class InventoryTransactionResult {
  @Field(() => ID) transactionId!: string;
  @Field(() => ID) inventoryId!: string;
  @Field(() => ID) dispensaryId!: string;
  @Field() transactionType!: string;
  @Field(() => Float) quantityDelta!: number;
  @Field(() => Float) quantityBefore!: number;
  @Field(() => Float) quantityAfter!: number;
  @Field(() => ID, { nullable: true }) referenceOrderId?: string;
  @Field(() => ID, { nullable: true }) performedByUserId?: string;
  @Field({ nullable: true }) notes?: string;
  @Field(() => Date) createdAt!: Date;
}

@ObjectType('DispensaryInventoryTransaction')
class DispensaryInventoryTransactionResult {
  @Field(() => ID) transactionId!: string;
  @Field(() => ID) inventoryId!: string;
  @Field(() => ID) dispensaryId!: string;
  @Field() transactionType!: string;
  @Field(() => Float) quantityDelta!: number;
  @Field(() => Float) quantityBefore!: number;
  @Field(() => Float) quantityAfter!: number;
  @Field(() => ID, { nullable: true }) referenceOrderId?: string;
  @Field({ nullable: true }) referenceTransferManifestId?: string;
  @Field(() => ID, { nullable: true }) performedByUserId?: string;
  @Field({ nullable: true }) performedByEmail?: string;
  @Field({ nullable: true }) notes?: string;
  @Field(() => ID) variantId!: string;
  @Field({ nullable: true }) variantName?: string;
  @Field({ nullable: true }) productName?: string;
  @Field(() => Date) createdAt!: Date;
}

@ObjectType()
class AdjustResult {
  @Field(() => InventoryResult) inventory!: InventoryResult;
  @Field(() => InventoryTransactionResult)
  transaction!: InventoryTransactionResult;
}

@ObjectType('DispensaryInventoryTransactionsPage')
class DispensaryInventoryTransactionsPage {
  @Field(() => [DispensaryInventoryTransactionResult])
  rows!: DispensaryInventoryTransactionResult[];
  @Field(() => Int) totalCount!: number;
}

@ObjectType('InventoryLowStockItem')
class LowStockItem {
  @Field(() => ID) inventoryId!: string;
  @Field(() => ID) variantId!: string;
  @Field(() => Float) quantityOnHand!: number;
  @Field(() => Float) quantityAvailable!: number;
  @Field(() => Float, { nullable: true }) reorderThreshold?: number;
  @Field(() => Float, { nullable: true }) reorderQuantity?: number;
  @Field({ nullable: true }) locationInStore?: string;
}

@ObjectType()
class InventoryValueResult {
  @Field(() => Int) totalItems!: number;
  @Field(() => Float) totalOnHand!: number;
  @Field(() => Float) totalReserved!: number;
  @Field(() => Float) totalAvailable!: number;
}

@ObjectType()
class ReorderSuggestion {
  @Field(() => ID) inventoryId!: string;
  @Field(() => ID) variantId!: string;
  @Field() productName!: string;
  @Field({ nullable: true }) variantName?: string;
  @Field(() => Float) quantityAvailable!: number;
  @Field(() => Float) avgDailySales!: number;
  @Field(() => Float) leadTimeDays!: number;
  @Field(() => Float) daysOfStockRemaining!: number;
  @Field({ nullable: true }) suggestedReorderDate?: string;
  @Field(() => Int) suggestedQuantity!: number;
}

@Resolver()
export class InventoryResolver {
  constructor(
    private readonly inventory: InventoryService,
    private readonly reorderSuggestions: ReorderSuggestionService,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
  ) {}

  /**
   * Entity-typed accessor (sc-748). Exposes the typed Inventory entity
   * so the GraphQL schema includes it and introspection can reach it.
   * The other queries return DTO shapes for back-compat.
   */
  @Roles('dispensary_admin', 'org_admin', 'super_admin', 'budtender')
  @Query(() => Inventory, { name: 'inventoryEntity', nullable: true })
  async inventoryEntity(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Inventory | null> {
    return this.inventoryRepo.findOne({ where: { inventoryId: id } });
  }

  // ── Queries ─────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin', 'budtender')
  @Query(() => InventoryResult, { name: 'inventoryItem', nullable: true })
  async inventoryItem(
    @Args('inventoryId', { type: () => ID }) inventoryId: string,
  ): Promise<InventoryRow> {
    return this.inventory.findById(inventoryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin', 'budtender')
  @Query(() => [InventoryListItem], { name: 'inventoryByDispensary' })
  async inventoryByDispensary(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 100 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
  ): Promise<InventoryRow[]> {
    return this.inventory.getByDispensary(dispensaryId, limit, offset);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin', 'budtender')
  @Query(() => InventoryResult, { name: 'inventoryByVariant', nullable: true })
  async inventoryByVariant(
    @Args('variantId', { type: () => ID }) variantId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<InventoryRow | null> {
    return this.inventory.getByVariant(variantId, dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [LowStockItem], { name: 'lowStockItems' })
  async lowStockItems(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<unknown[]> {
    return this.inventory.getLowStock(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => InventoryValueResult, { name: 'inventoryValue' })
  async inventoryValue(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<InventoryValueDto> {
    return this.inventory.getInventoryValue(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin', 'budtender')
  @Query(() => [InventoryTransactionResult], { name: 'inventoryTransactions' })
  async inventoryTransactions(
    @Args('inventoryId', { type: () => ID }) inventoryId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 })
    limit: number,
  ): Promise<unknown[]> {
    return this.inventory.getTransactions(inventoryId, limit);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => DispensaryInventoryTransactionsPage, {
    name: 'inventoryTransactionsByDispensary',
  })
  async inventoryTransactionsByDispensary(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
    @Args('since', { type: () => Date, nullable: true })
    since: Date | null,
    @Args('until', { type: () => Date, nullable: true })
    until: Date | null,
    @Args('transactionType', { type: () => String, nullable: true })
    transactionType: string | null,
    @Args('performedByUserId', { type: () => ID, nullable: true })
    performedByUserId: string | null,
  ): Promise<{ rows: DispensaryTxRow[]; totalCount: number }> {
    const filters = {
      since,
      until,
      transactionType,
      performedByUserId,
    };
    const [rows, totalCount] = await Promise.all([
      this.inventory.getDispensaryTransactions(dispensaryId, {
        ...filters,
        limit,
        offset,
      }),
      this.inventory.countDispensaryTransactions(dispensaryId, filters),
    ]);
    return { rows, totalCount };
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [ReorderSuggestion], { name: 'reorderSuggestions' })
  async reorderSuggestionsQuery(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<ReorderSuggestionDto[]> {
    return this.reorderSuggestions.getReorderSuggestions(dispensaryId);
  }

  // ── Mutations ───────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin', 'budtender')
  @Mutation(() => AdjustResult, { name: 'adjustInventory' })
  async adjustInventory(
    @Args('inventoryId', { type: () => ID }) inventoryId: string,
    @Args('delta', { type: () => Float }) delta: number,
    @Args('transactionType') transactionType: string,
    @Args('notes', { nullable: true }) notes: string,
    @Args('referenceOrderId', { type: () => ID, nullable: true })
    referenceOrderId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<InventoryAdjustResult> {
    return this.inventory.adjustQuantity(
      inventoryId,
      delta,
      transactionType,
      user.sub,
      notes,
      referenceOrderId,
    );
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => InventoryResult, { name: 'setReorderThreshold' })
  async setReorderThreshold(
    @Args('inventoryId', { type: () => ID }) inventoryId: string,
    @Args('value', { type: () => Float, nullable: true })
    value: number | null,
  ): Promise<InventoryRow> {
    return this.inventory.setReorderThreshold(inventoryId, value);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin', 'budtender')
  @Mutation(() => AdjustResult, { name: 'reserveStock' })
  async reserveStock(
    @Args('inventoryId', { type: () => ID }) inventoryId: string,
    @Args('quantity', { type: () => Float }) quantity: number,
    @Args('referenceOrderId', { type: () => ID, nullable: true })
    referenceOrderId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<InventoryAdjustResult> {
    return this.inventory.reserveStock(
      inventoryId,
      quantity,
      user.sub,
      referenceOrderId,
    );
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin', 'budtender')
  @Mutation(() => AdjustResult, { name: 'releaseReserve' })
  async releaseReserve(
    @Args('inventoryId', { type: () => ID }) inventoryId: string,
    @Args('quantity', { type: () => Float }) quantity: number,
    @Args('referenceOrderId', { type: () => ID, nullable: true })
    referenceOrderId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<InventoryAdjustResult> {
    return this.inventory.releaseReserve(
      inventoryId,
      quantity,
      user.sub,
      referenceOrderId,
    );
  }
}
