import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

// ── Sales Overview ──────────────────────────────────────────────────────────

@ObjectType()
export class SalesOverview {
  @Field(() => Float) totalRevenue!: number;
  @Field(() => Int) totalOrders!: number;
  @Field(() => Float) averageOrderValue!: number;
  @Field(() => Float) totalTax!: number;
  @Field(() => Float) totalDiscount!: number;
  @Field(() => Int) completedOrders!: number;
  @Field(() => Int) pendingOrders!: number;
  @Field(() => Int) cancelledOrders!: number;
}

@ObjectType()
export class SalesTrend {
  @Field() period!: string;
  @Field(() => Float) revenue!: number;
  @Field(() => Int) orders!: number;
  @Field(() => Float) averageOrderValue!: number;
}

// ── Product Performance ─────────────────────────────────────────────────────

@ObjectType()
export class TopProduct {
  @Field() productId!: string;
  @Field() productName!: string;
  @Field({ nullable: true }) strainType?: string;
  @Field(() => Int) unitsSold!: number;
  @Field(() => Float) revenue!: number;
}

@ObjectType()
export class CategoryBreakdown {
  @Field() category!: string;
  @Field(() => Int) productCount!: number;
  @Field(() => Int) unitsSold!: number;
  @Field(() => Float) revenue!: number;
}

// ── Inventory Health ────────────────────────────────────────────────────────

@ObjectType()
export class InventoryOverview {
  @Field(() => Int) totalVariants!: number;
  @Field(() => Float) totalUnitsOnHand!: number;
  @Field(() => Float) totalUnitsReserved!: number;
  @Field(() => Float) totalUnitsAvailable!: number;
  @Field(() => Float) estimatedInventoryValue!: number;
  @Field(() => Int) lowStockCount!: number;
  @Field(() => Int) outOfStockCount!: number;
}

@ObjectType()
export class LowStockItem {
  @Field() variantId!: string;
  @Field() productName!: string;
  @Field() variantName!: string;
  @Field(() => Float) quantityOnHand!: number;
  @Field(() => Float) quantityAvailable!: number;
  @Field(() => Float, { nullable: true }) reorderThreshold?: number;
}

// ── Compliance / Metrc ──────────────────────────────────────────────────────

@ObjectType()
export class MetrcSyncOverview {
  @Field(() => Int) totalSyncs!: number;
  @Field(() => Int) successCount!: number;
  @Field(() => Int) failedCount!: number;
  @Field(() => Int) pendingCount!: number;
  @Field(() => Float) successRate!: number;
  @Field(() => Int) ordersAwaitingSync!: number;
  @Field({ nullable: true }) lastSyncAt?: string;
}

@ObjectType()
export class ComplianceSummary {
  @Field(() => Int) totalProducts!: number;
  @Field(() => Int) compliantProducts!: number;
  @Field(() => Int) missingUid!: number;
  @Field(() => Int) missingCategory!: number;
  @Field(() => Int) missingPackageLabel!: number;
  @Field(() => Float) compliancePercent!: number;
}

// ── Combined Dashboard ──────────────────────────────────────────────────────

@ObjectType()
export class DashboardData {
  @Field(() => SalesOverview) sales!: SalesOverview;
  @Field(() => [SalesTrend]) salesTrend!: SalesTrend[];
  @Field(() => [TopProduct]) topProducts!: TopProduct[];
  @Field(() => [CategoryBreakdown]) categoryBreakdown!: CategoryBreakdown[];
  @Field(() => InventoryOverview) inventory!: InventoryOverview;
  @Field(() => [LowStockItem]) lowStockItems!: LowStockItem[];
  @Field(() => MetrcSyncOverview) metrcSync!: MetrcSyncOverview;
  @Field(() => ComplianceSummary) compliance!: ComplianceSummary;
}
