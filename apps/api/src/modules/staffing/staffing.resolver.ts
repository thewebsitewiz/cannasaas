import { Resolver, Query, Mutation, Args, ID, Float, Int } from '@nestjs/graphql';
import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { StaffingService } from './staffing.service';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { EmployeeCertification } from './entities/employee-certification.entity';
import { PerformanceReview } from './entities/performance-review.entity';
import { LkpPosition, LkpCertificationType } from './entities/staffing-lookups.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

// ── Return Types ────────────────────────────────────────────────────────────

@ObjectType()
class EmployeeListItem {
  @Field(() => ID) profileId!: string;
  @Field(() => ID) userId!: string;
  @Field() email!: string;
  @Field({ nullable: true }) firstName?: string;
  @Field({ nullable: true }) lastName?: string;
  @Field() role!: string;
  @Field({ nullable: true }) positionName?: string;
  @Field({ nullable: true }) positionCode?: string;
  @Field({ nullable: true }) department?: string;
  @Field({ nullable: true }) employeeNumber?: string;
  @Field() employmentType!: string;
  @Field() employmentStatus!: string;
  @Field() hireDate!: string;
  @Field(() => Float, { nullable: true }) hourlyRate?: number;
  @Field() payType!: string;
  @Field({ nullable: true }) phone?: string;
  @Field(() => Int) activeCerts!: number;
  @Field(() => Int) expiringCerts!: number;
}

@ObjectType()
class ComplianceOverview {
  @Field(() => Int) totalEmployees!: number;
  @Field(() => Int) activeEmployees!: number;
  @Field(() => Int) totalCerts!: number;
  @Field(() => Int) activeCerts!: number;
  @Field(() => Int) expiredCerts!: number;
  @Field(() => Int) expiringSoon!: number;
  @Field(() => Int) pendingCerts!: number;
}

// ── Input Types ─────────────────────────────────────────────────────────────

@InputType()
class UpdateEmployeeInput {
  @Field(() => Int, { nullable: true }) positionId?: number;
  @Field({ nullable: true }) department?: string;
  @Field({ nullable: true }) employmentType?: string;
  @Field({ nullable: true }) employmentStatus?: string;
  @Field(() => Float, { nullable: true }) hourlyRate?: number;
  @Field(() => Float, { nullable: true }) salary?: number;
  @Field({ nullable: true }) payType?: string;
  @Field({ nullable: true }) overtimeEligible?: boolean;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) emergencyContactName?: string;
  @Field({ nullable: true }) emergencyContactPhone?: string;
  @Field({ nullable: true }) notes?: string;
  @Field({ nullable: true }) terminationReason?: string;
}

@InputType()
class AddCertificationInput {
  @Field(() => ID) profileId!: string;
  @Field(() => Int) certTypeId!: number;
  @Field({ nullable: true }) certificateNumber?: string;
  @Field({ nullable: true }) issuedDate?: string;
  @Field({ nullable: true }) expirationDate?: string;
  @Field({ nullable: true }) documentUrl?: string;
  @Field({ nullable: true }) notes?: string;
}

@InputType()
class CreateReviewInput {
  @Field(() => ID) profileId!: string;
  @Field() periodStart!: string;
  @Field() periodEnd!: string;
  @Field(() => Int, { nullable: true }) overallRating?: number;
  @Field(() => Int, { nullable: true }) salesRating?: number;
  @Field(() => Int, { nullable: true }) complianceRating?: number;
  @Field(() => Int, { nullable: true }) teamworkRating?: number;
  @Field(() => Int, { nullable: true }) reliabilityRating?: number;
  @Field({ nullable: true }) strengths?: string;
  @Field({ nullable: true }) areasForImprovement?: string;
  @Field({ nullable: true }) goals?: string;
  @Field({ nullable: true }) managerComments?: string;
}

// ── Resolver ────────────────────────────────────────────────────────────────

@Resolver()
export class StaffingResolver {
  constructor(private readonly staffing: StaffingService) {}

  private guard(user: JwtPayload, dispensaryId?: string) {
    if (user.role === 'dispensary_admin' && dispensaryId && dispensaryId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }
  }

  // ── Lookups ───────────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [LkpPosition], { name: 'positions' })
  async positions(): Promise<LkpPosition[]> {
    return this.staffing.getPositions();
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [LkpCertificationType], { name: 'certificationTypes' })
  async certTypes(): Promise<LkpCertificationType[]> {
    return this.staffing.getCertificationTypes();
  }

  // ── Employee Roster ───────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [EmployeeListItem], { name: 'employees' })
  async employees(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('status', { nullable: true }) status: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<EmployeeListItem[]> {
    this.guard(user, dispensaryId);
    return this.staffing.getEmployees(dispensaryId, status);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => EmployeeListItem, { name: 'employee' })
  async employee(
    @Args('profileId', { type: () => ID }) profileId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.staffing.getEmployee(profileId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => EmployeeProfile, { name: 'updateEmployee' })
  async updateEmployee(
    @Args('profileId', { type: () => ID }) profileId: string,
    @Args('input') input: UpdateEmployeeInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<EmployeeProfile> {
    return this.staffing.updateEmployee(profileId, input);
  }

  // ── Certifications ────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [EmployeeCertification], { name: 'employeeCertifications' })
  async certs(
    @Args('profileId', { type: () => ID }) profileId: string,
  ): Promise<any[]> {
    return this.staffing.getEmployeeCertifications(profileId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => EmployeeCertification, { name: 'addCertification' })
  async addCert(
    @Args('input') input: AddCertificationInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<EmployeeCertification> {
    return this.staffing.addCertification(input);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => EmployeeCertification, { name: 'verifyCertification' })
  async verifyCert(
    @Args('certificationId', { type: () => ID }) certificationId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<EmployeeCertification> {
    return this.staffing.verifyCertification(certificationId, user.sub);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => EmployeeCertification, { name: 'revokeCertification' })
  async revokeCert(
    @Args('certificationId', { type: () => ID }) certificationId: string,
    @Args('reason', { nullable: true }) reason: string,
  ): Promise<EmployeeCertification> {
    return this.staffing.revokeCertification(certificationId, reason);
  }

  // ── Expiration Alerts ─────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [EmployeeCertification], { name: 'expiringCertifications' })
  async expiring(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('daysAhead', { type: () => Int, nullable: true, defaultValue: 30 }) daysAhead: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<any[]> {
    this.guard(user, dispensaryId);
    return this.staffing.getExpiringCertifications(dispensaryId, daysAhead);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => ComplianceOverview, { name: 'staffComplianceOverview' })
  async complianceOverview(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    this.guard(user, dispensaryId);
    return this.staffing.getComplianceOverview(dispensaryId);
  }

  // ── Performance Reviews ───────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [PerformanceReview], { name: 'performanceReviews' })
  async reviews(
    @Args('profileId', { type: () => ID }) profileId: string,
  ): Promise<PerformanceReview[]> {
    return this.staffing.getReviews(profileId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => PerformanceReview, { name: 'createPerformanceReview' })
  async createReview(
    @Args('input') input: CreateReviewInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<PerformanceReview> {
    return this.staffing.createReview({ ...input, reviewerUserId: user.sub });
  }
}
