import { Resolver, Query, Mutation, Args, ID, Int, InputType } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { ManufacturersService } from './manufacturers.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType() class ManufacturerResult {
  @Field(() => ID) manufacturerId!: string;
  @Field(() => ID, { nullable: true }) brandId?: string;
  @Field() legalName!: string;
  @Field({ nullable: true }) dbaName?: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field({ nullable: true }) licenseType?: string;
  @Field({ nullable: true }) licenseState?: string;
  @Field(() => Date, { nullable: true }) licenseExpiryDate?: Date;
  @Field({ nullable: true }) addressLine1?: string;
  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) state?: string;
  @Field({ nullable: true }) zip?: string;
  @Field({ nullable: true }) contactEmail?: string;
  @Field({ nullable: true }) contactPhone?: string;
  @Field() isActive!: boolean;
  @Field(() => Date) createdAt!: Date;
  @Field(() => Date) updatedAt!: Date;
}

@ObjectType() class ManufacturerListItem {
  @Field(() => ID) manufacturerId!: string;
  @Field(() => ID, { nullable: true }) brandId?: string;
  @Field() legalName!: string;
  @Field({ nullable: true }) dbaName?: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field({ nullable: true }) licenseState?: string;
  @Field({ nullable: true }) contactEmail?: string;
  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) state?: string;
  @Field() isActive!: boolean;
  @Field(() => Date) createdAt!: Date;
}

@InputType() class CreateManufacturerInput {
  @Field(() => ID, { nullable: true }) brandId?: string;
  @Field() legalName!: string;
  @Field({ nullable: true }) dbaName?: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field({ nullable: true }) licenseType?: string;
  @Field({ nullable: true }) licenseState?: string;
  @Field({ nullable: true }) licenseExpiryDate?: string;
  @Field({ nullable: true }) addressLine1?: string;
  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) state?: string;
  @Field({ nullable: true }) zip?: string;
  @Field({ nullable: true }) contactEmail?: string;
  @Field({ nullable: true }) contactPhone?: string;
}

@InputType() class UpdateManufacturerInput {
  @Field(() => ID, { nullable: true }) brandId?: string;
  @Field({ nullable: true }) legalName?: string;
  @Field({ nullable: true }) dbaName?: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field({ nullable: true }) licenseType?: string;
  @Field({ nullable: true }) licenseState?: string;
  @Field({ nullable: true }) licenseExpiryDate?: string;
  @Field({ nullable: true }) addressLine1?: string;
  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) state?: string;
  @Field({ nullable: true }) zip?: string;
  @Field({ nullable: true }) contactEmail?: string;
  @Field({ nullable: true }) contactPhone?: string;
  @Field({ nullable: true }) isActive?: boolean;
}

@Resolver()
export class ManufacturersResolver {
  constructor(private readonly manufacturers: ManufacturersService) {}

  // ── Queries ─────────────────────────────────────────────────────────

  @Roles('org_admin', 'dispensary_admin', 'super_admin')
  @Query(() => ManufacturerResult, { name: 'manufacturer', nullable: true })
  async manufacturer(
    @Args('manufacturerId', { type: () => ID }) manufacturerId: string,
  ): Promise<any> {
    return this.manufacturers.findById(manufacturerId);
  }

  @Roles('super_admin')
  @Query(() => [ManufacturerListItem], { name: 'manufacturers' })
  async manufacturers(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<any[]> {
    return this.manufacturers.findAll(limit, offset);
  }

  @Roles('org_admin', 'dispensary_admin', 'super_admin')
  @Query(() => [ManufacturerListItem], { name: 'manufacturersByBrand' })
  async manufacturersByBrand(
    @Args('brandId', { type: () => ID }) brandId: string,
  ): Promise<any[]> {
    return this.manufacturers.findByBrand(brandId);
  }

  // ── Mutations ───────────────────────────────────────────────────────

  @Roles('org_admin', 'super_admin')
  @Mutation(() => ManufacturerResult, { name: 'createManufacturer' })
  async createManufacturer(
    @Args('input') input: CreateManufacturerInput,
  ): Promise<any> {
    return this.manufacturers.create(input);
  }

  @Roles('org_admin', 'super_admin')
  @Mutation(() => ManufacturerResult, { name: 'updateManufacturer' })
  async updateManufacturer(
    @Args('manufacturerId', { type: () => ID }) manufacturerId: string,
    @Args('input') input: UpdateManufacturerInput,
  ): Promise<any> {
    return this.manufacturers.update(manufacturerId, input);
  }

  @Roles('org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'deleteManufacturer' })
  async deleteManufacturer(
    @Args('manufacturerId', { type: () => ID }) manufacturerId: string,
  ): Promise<boolean> {
    return this.manufacturers.softDelete(manufacturerId);
  }
}
