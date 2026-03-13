import { Resolver, Query, Args, ID, Int, Float } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { ReportingService } from './reporting.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType() class SalesSummary {
  @Field(() => Int) totalOrders!: number;
  @Field(() => Int) completedOrders!: number;
  @Field(() => Int) cancelledOrders!: number;
  @Field(() => Float) grossSales!: number;
  @Field(() => Float) totalDiscounts!: number;
  @Field(() => Float) totalTax!: number;
  @Field(() => Float) netRevenue!: number;
  @Field(() => Float) avgOrderValue!: number;
  @Field(() => Int) deliveryOrders!: number;
  @Field(() => Int) pickupOrders!: number;
  @Field(() => Int) cashOrders!: number;
  @Field(() => Int) cardOrders!: number;
  @Field(() => Float) totalCashDiscounts!: number;
}

@ObjectType() class DailySales {
  @Field() date!: string;
  @Field(() => Int) orders!: number;
  @Field(() => Float) gross!: number;
  @Field(() => Float) discounts!: number;
  @Field(() => Float) tax!: number;
  @Field(() => Float) net!: number;
}

@ObjectType() class ProductSales {
  @Field() productName!: string;
  @Field({ nullable: true }) strainType?: string;
  @Field({ nullable: true }) variantName?: string;
  @Field(() => Int) orders!: number;
  @Field(() => Int) unitsSold!: number;
  @Field(() => Float) revenue!: number;
}

@ObjectType() class HourlySales {
  @Field(() => Int) hour!: number;
  @Field(() => Int) orders!: number;
  @Field(() => Float) revenue!: number;
}

@ObjectType() class TaxBreakdownItem {
  @Field() taxName!: string;
  @Field() taxCode!: string;
  @Field(() => Float) rate!: number;
  @Field() taxBasis!: string;
  @Field({ nullable: true }) statutoryReference?: string;
  @Field(() => Float) estimatedTax!: number;
}

@ObjectType() class TaxReport {
  @Field({ nullable: true }) dispensaryName?: string;
  @Field({ nullable: true }) state?: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field(() => Float) taxableSales!: number;
  @Field(() => Float) totalDiscounts!: number;
  @Field(() => Float) netTaxable!: number;
  @Field(() => Float) totalTaxCollected!: number;
  @Field(() => Int) transactionCount!: number;
  @Field(() => [TaxBreakdownItem]) taxBreakdown!: TaxBreakdownItem[];
}

@ObjectType() class LaborCostSummary {
  @Field(() => Int) employeeCount!: number;
  @Field(() => Float) totalHours!: number;
  @Field(() => Float) totalLaborCost!: number;
  @Field(() => Float) totalRevenue!: number;
  @Field(() => Float) laborCostPercent!: number;
}

@ObjectType() class ShrinkageByReason {
  @Field() reason!: string;
  @Field() reasonCode!: string;
  @Field(() => Int) count!: number;
  @Field(() => Int) units!: number;
  @Field(() => Float) estimatedValue!: number;
}

@ObjectType() class ShrinkageReport {
  @Field(() => Int) totalAdjustments!: number;
  @Field(() => Int) totalUnitsLost!: number;
  @Field(() => Float) estimatedValueLost!: number;
  @Field(() => [ShrinkageByReason]) byReason!: ShrinkageByReason[];
}

@Resolver()
export class ReportingResolver {
  constructor(private readonly reporting: ReportingService) {}

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => SalesSummary, { name: 'salesReport' })
  async salesReport(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ): Promise<any> {
    return this.reporting.salesSummary(dispensaryId, startDate, endDate);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [DailySales], { name: 'salesByDay' })
  async salesByDay(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ): Promise<any[]> {
    return this.reporting.salesByDay(dispensaryId, startDate, endDate);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [ProductSales], { name: 'salesByProduct' })
  async salesByProduct(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ): Promise<any[]> {
    return this.reporting.salesByProduct(dispensaryId, startDate, endDate);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [HourlySales], { name: 'salesByHour' })
  async salesByHour(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ): Promise<any[]> {
    return this.reporting.salesByHour(dispensaryId, startDate, endDate);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => TaxReport, { name: 'taxReport' })
  async taxReport(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ): Promise<any> {
    return this.reporting.taxReport(dispensaryId, startDate, endDate);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => LaborCostSummary, { name: 'laborCostReport' })
  async laborCost(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ): Promise<any> {
    return this.reporting.laborCostSummary(dispensaryId, startDate, endDate);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => ShrinkageReport, { name: 'shrinkageReport' })
  async shrinkage(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ): Promise<any> {
    return this.reporting.shrinkageReport(dispensaryId, startDate, endDate);
  }
}
