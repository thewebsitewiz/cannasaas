import { Resolver, Query, Mutation, Args, ID, Int, InputType } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { CompaniesService } from './companies.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType() class CompanyResult {
  @Field(() => ID) companyId!: string;
  @Field(() => ID) organizationId!: string;
  @Field() legalName!: string;
  @Field({ nullable: true }) dbaName?: string;
  @Field({ nullable: true }) ein?: string;
  @Field({ nullable: true }) stateOfIncorporation?: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field({ nullable: true }) licenseType?: string;
  @Field({ nullable: true }) licenseState?: string;
  @Field(() => Date, { nullable: true }) licenseExpiryDate?: Date;
  @Field({ nullable: true }) contactEmail?: string;
  @Field({ nullable: true }) contactPhone?: string;
  @Field({ nullable: true }) addressLine1?: string;
  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) state?: string;
  @Field({ nullable: true }) zip?: string;
  @Field({ nullable: true }) metrcFacilityLicense?: string;
  @Field(() => Date) createdAt!: Date;
  @Field(() => Date) updatedAt!: Date;
}

@ObjectType() class CompanyListItem {
  @Field(() => ID) companyId!: string;
  @Field(() => ID) organizationId!: string;
  @Field() legalName!: string;
  @Field({ nullable: true }) dbaName?: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field({ nullable: true }) licenseState?: string;
  @Field({ nullable: true }) contactEmail?: string;
  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) state?: string;
  @Field(() => Date) createdAt!: Date;
}

@InputType() class CreateCompanyInput {
  @Field(() => ID) organizationId!: string;
  @Field() legalName!: string;
  @Field({ nullable: true }) dbaName?: string;
  @Field({ nullable: true }) ein?: string;
  @Field({ nullable: true }) stateOfIncorporation?: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field({ nullable: true }) licenseType?: string;
  @Field({ nullable: true }) licenseState?: string;
  @Field({ nullable: true }) licenseExpiryDate?: string;
  @Field({ nullable: true }) contactEmail?: string;
  @Field({ nullable: true }) contactPhone?: string;
  @Field({ nullable: true }) addressLine1?: string;
  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) state?: string;
  @Field({ nullable: true }) zip?: string;
}

@InputType() class UpdateCompanyInput {
  @Field({ nullable: true }) legalName?: string;
  @Field({ nullable: true }) dbaName?: string;
  @Field({ nullable: true }) ein?: string;
  @Field({ nullable: true }) stateOfIncorporation?: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field({ nullable: true }) licenseType?: string;
  @Field({ nullable: true }) licenseState?: string;
  @Field({ nullable: true }) licenseExpiryDate?: string;
  @Field({ nullable: true }) contactEmail?: string;
  @Field({ nullable: true }) contactPhone?: string;
  @Field({ nullable: true }) addressLine1?: string;
  @Field({ nullable: true }) city?: string;
  @Field({ nullable: true }) state?: string;
  @Field({ nullable: true }) zip?: string;
  @Field({ nullable: true }) metrcFacilityLicense?: string;
}

@Resolver()
export class CompaniesResolver {
  constructor(private readonly companies: CompaniesService) {}

  // ── Queries ─────────────────────────────────────────────────────────

  @Roles('org_admin', 'super_admin')
  @Query(() => CompanyResult, { name: 'company', nullable: true })
  async company(
    @Args('companyId', { type: () => ID }) companyId: string,
  ): Promise<any> {
    return this.companies.findById(companyId);
  }

  @Roles('super_admin')
  @Query(() => [CompanyListItem], { name: 'companies' })
  async companies(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<any[]> {
    return this.companies.findAll(limit, offset);
  }

  @Roles('org_admin', 'super_admin')
  @Query(() => [CompanyListItem], { name: 'companiesByOrganization' })
  async companiesByOrganization(
    @Args('organizationId', { type: () => ID }) organizationId: string,
  ): Promise<any[]> {
    return this.companies.findByOrganization(organizationId);
  }

  // ── Mutations ───────────────────────────────────────────────────────

  @Roles('org_admin', 'super_admin')
  @Mutation(() => CompanyResult, { name: 'createCompany' })
  async createCompany(
    @Args('input') input: CreateCompanyInput,
  ): Promise<any> {
    return this.companies.create(input);
  }

  @Roles('org_admin', 'super_admin')
  @Mutation(() => CompanyResult, { name: 'updateCompany' })
  async updateCompany(
    @Args('companyId', { type: () => ID }) companyId: string,
    @Args('input') input: UpdateCompanyInput,
  ): Promise<any> {
    return this.companies.update(companyId, input);
  }

  @Roles('super_admin')
  @Mutation(() => Boolean, { name: 'deleteCompany' })
  async deleteCompany(
    @Args('companyId', { type: () => ID }) companyId: string,
  ): Promise<boolean> {
    return this.companies.softDelete(companyId);
  }
}
