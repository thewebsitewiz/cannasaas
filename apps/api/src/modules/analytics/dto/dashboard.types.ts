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

// ── Weekly Digest ───────────────────────────────────────────────────────────

@ObjectType()
export class DigestRevenue {
  @Field(() => Float) current!: number;
  @Field(() => Float) previous!: number;
  @Field(() => Float) changePercent!: number;
  @Field() trend!: string;
}

@ObjectType()
export class DigestOrders {
  @Field(() => Int) current!: number;
  @Field(() => Int) previous!: number;
  @Field(() => Float) changePercent!: number;
}

@ObjectType()
export class DigestProduct {
  @Field() name!: string;
  @Field(() => Int) currentUnits!: number;
  @Field(() => Int) previousUnits!: number;
  @Field(() => Int) change!: number;
}

@ObjectType()
export class DigestBusiestHour {
  @Field(() => Int) hour!: number;
  @Field(() => Int) orders!: number;
}

@ObjectType()
export class DigestCustomerRatio {
  @Field(() => Int) newCustomers!: number;
  @Field(() => Int) returningCustomers!: number;
  @Field(() => Float) newPercent!: number;
}

@ObjectType()
export class DigestInventoryAlert {
  @Field() productName!: string;
  @Field() variantName!: string;
  @Field(() => Float) available!: number;
  @Field(() => Int) daysUntilOut!: number;
}

@ObjectType()
export class DigestPeriod {
  @Field() start!: string;
  @Field() end!: string;
}

@ObjectType()
export class WeeklyDigestData {
  @Field() dispensaryId!: string;
  @Field() dispensaryName!: string;
  @Field(() => DigestPeriod) period!: DigestPeriod;
  @Field(() => DigestRevenue) revenue!: DigestRevenue;
  @Field(() => DigestOrders) orders!: DigestOrders;
  @Field(() => DigestProduct, { nullable: true }) topGainingProduct?: DigestProduct;
  @Field(() => DigestProduct, { nullable: true }) topDecliningProduct?: DigestProduct;
  @Field(() => DigestBusiestHour, { nullable: true }) busiestHour?: DigestBusiestHour;
  @Field(() => DigestCustomerRatio) customerRatio!: DigestCustomerRatio;
  @Field(() => [DigestInventoryAlert]) inventoryAlerts!: DigestInventoryAlert[];
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
