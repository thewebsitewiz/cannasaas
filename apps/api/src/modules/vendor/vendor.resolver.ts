import { Resolver, Query, Mutation, Args, ID, Int, Float } from '@nestjs/graphql';
import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { VendorService } from './vendor.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import GraphQLJSON from 'graphql-type-json';

@ObjectType() class Vendor {
  @Field(() => ID) vendor_id!: string; @Field() name!: string; @Field() vendor_type!: string;
  @Field({ nullable: true }) license_number?: string; @Field({ nullable: true }) license_state?: string;
  @Field({ nullable: true }) city?: string; @Field({ nullable: true }) state?: string;
  @Field({ nullable: true }) phone?: string; @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) payment_terms?: string; @Field(() => Float, { nullable: true }) rating?: number;
  @Field() is_active!: boolean;
  @Field(() => Int, { nullable: true }) total_pos?: number; @Field(() => Float, { nullable: true }) total_spend?: number;
  @Field(() => GraphQLJSON, { nullable: true }) contacts?: any;
}

@ObjectType() class PurchaseOrder {
  @Field(() => ID) po_id!: string; @Field() po_number!: string; @Field() status!: string;
  @Field({ nullable: true }) vendor_name?: string; @Field({ nullable: true }) order_date?: string;
  @Field({ nullable: true }) expected_delivery?: string; @Field({ nullable: true }) payment_status?: string;
  @Field(() => Float) subtotal!: number; @Field(() => Float) total!: number;
  @Field(() => Int, { nullable: true }) line_items?: number; @Field(() => Int, { nullable: true }) total_units?: number;
  @Field(() => GraphQLJSON, { nullable: true }) items?: any;
}

@ObjectType() class VendorStats {
  @Field(() => Int) activeVendors!: number; @Field(() => Int) totalPOs!: number;
  @Field(() => Int) openPOs!: number; @Field(() => Float) totalSpend!: number; @Field(() => Float) outstanding!: number;
}

@InputType() class POLineItemInput {
  @Field({ nullable: true }) variantId?: string;
  @Field() productName!: string;
  @Field({ nullable: true }) sku?: string;
  @Field(() => Int) quantityOrdered!: number;
  @Field(() => Float) unitCost!: number;
}

@Resolver()
export class VendorResolver {
  constructor(private readonly vendors: VendorService) {}

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [Vendor], { name: 'vendors' })
  async vendorList(@CurrentUser() user: JwtPayload): Promise<any[]> {
    return this.vendors.getVendors(user.organizationId || '');
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => GraphQLJSON, { name: 'vendor' })
  async vendor(@Args('vendorId', { type: () => ID }) vendorId: string): Promise<any> {
    return this.vendors.getVendor(vendorId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Vendor, { name: 'createVendor' })
  async createVendor(
    @Args('name') name: string,
    @Args('vendorType', { defaultValue: 'cultivator' }) vendorType: string,
    @Args('licenseNumber', { nullable: true }) licenseNumber: string,
    @Args('licenseState', { nullable: true }) licenseState: string,
    @Args('city', { nullable: true }) city: string,
    @Args('state', { nullable: true }) state: string,
    @Args('phone', { nullable: true }) phone: string,
    @Args('email', { nullable: true }) email: string,
    @Args('paymentTerms', { nullable: true, defaultValue: 'net_30' }) paymentTerms: string,
    @Args('contactName', { nullable: true }) contactName: string,
    @Args('contactTitle', { nullable: true }) contactTitle: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.vendors.createVendor(user.organizationId || '', {
      name, vendorType, licenseNumber, licenseState, city, state, phone, email, paymentTerms, contactName, contactTitle,
    });
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => GraphQLJSON, { name: 'updateVendor' })
  async updateVendor(
    @Args('vendorId', { type: () => ID }) vendorId: string,
    @Args('name', { nullable: true }) name: string,
    @Args('phone', { nullable: true }) phone: string,
    @Args('email', { nullable: true }) email: string,
    @Args('isActive', { nullable: true }) isActive: boolean,
    @Args('paymentTerms', { nullable: true }) paymentTerms: string,
    @Args('notes', { nullable: true }) notes: string,
  ): Promise<any> {
    return this.vendors.updateVendor(vendorId, { name, phone, email, isActive, paymentTerms, notes });
  }

  // ── Purchase Orders ───────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [PurchaseOrder], { name: 'purchaseOrders' })
  async poList(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('status', { nullable: true }) status: string,
  ): Promise<any[]> {
    return this.vendors.getPurchaseOrders(dispensaryId, status);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => GraphQLJSON, { name: 'purchaseOrder' })
  async po(@Args('poId', { type: () => ID }) poId: string): Promise<any> {
    return this.vendors.getPurchaseOrder(poId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => GraphQLJSON, { name: 'createPurchaseOrder' })
  async createPO(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('vendorId', { type: () => ID }) vendorId: string,
    @Args('items', { type: () => [POLineItemInput] }) items: any[],
    @Args('notes', { nullable: true }) notes: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.vendors.createPurchaseOrder(dispensaryId, vendorId, items, user.sub, notes);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => GraphQLJSON, { name: 'updatePOStatus' })
  async updatePOStatus(
    @Args('poId', { type: () => ID }) poId: string,
    @Args('status') status: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.vendors.updatePOStatus(poId, status, user.sub);
  }

  // ── Stats ─────────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => VendorStats, { name: 'vendorStats' })
  async stats(@CurrentUser() user: JwtPayload): Promise<any> {
    return this.vendors.getVendorStats(user.organizationId || '');
  }
}
