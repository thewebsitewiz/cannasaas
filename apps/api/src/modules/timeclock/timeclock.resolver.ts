import { Resolver, Query, Mutation, Args, ID, Float, Int } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { TimeClockService } from './timeclock.service';
import { TimeEntry } from './entities/time-entry.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

// ── Return Types ────────────────────────────────────────────────────────────

@ObjectType()
class ClockStatus {
  @Field() isClockedIn!: boolean;
  @Field() isExempt!: boolean;
  @Field(() => TimeEntry, { nullable: true }) currentEntry?: TimeEntry;
  @Field(() => Float) todayHours!: number;
}

@ObjectType()
class ActiveClock {
  @Field(() => ID) entryId!: string;
  @Field(() => ID) profileId!: string;
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field() email!: string;
  @Field({ nullable: true }) positionName?: string;
  @Field(() => Date) clockIn!: Date;
  @Field(() => Float) hoursSoFar!: number;
}

@ObjectType()
class PayrollRow {
  @Field({ nullable: true }) employeeNumber?: string;
  @Field() firstName!: string;
  @Field() lastName!: string;
  @Field() email!: string;
  @Field({ nullable: true }) positionName?: string;
  @Field() payType!: string;
  @Field(() => Float, { nullable: true }) hourlyRate?: number;
  @Field(() => Float, { nullable: true }) salary?: number;
  @Field() isExempt!: boolean;
  @Field() overtimeEligible!: boolean;
  @Field(() => Float) totalHours!: number;
  @Field(() => Float) overtimeHours!: number;
  @Field(() => Int) shiftsWorked!: number;
  @Field(() => Int) totalBreakMinutes!: number;
  @Field(() => Float, { nullable: true }) regularPay?: number;
  @Field(() => Float, { nullable: true }) grossPayWithOt?: number;
}

// ── Resolver ────────────────────────────────────────────────────────────────

@Resolver()
export class TimeClockResolver {
  constructor(private readonly timeClock: TimeClockService) {}

  // ── Self-Service: Clock In/Out ────────────────────────────────────────────

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => TimeEntry, { name: 'clockIn' })
  async clockIn(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('notes', { nullable: true }) notes: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<TimeEntry> {
    return this.timeClock.clockIn(user.sub, dispensaryId, notes);
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => TimeEntry, { name: 'clockOut' })
  async clockOut(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('breakMinutes', { type: () => Int, nullable: true, defaultValue: 0 }) breakMinutes: number,
    @Args('notes', { nullable: true }) notes: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<TimeEntry> {
    return this.timeClock.clockOut(user.sub, dispensaryId, breakMinutes, notes);
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => ClockStatus, { name: 'clockStatus' })
  async clockStatus(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ClockStatus> {
    return this.timeClock.getClockStatus(user.sub, dispensaryId);
  }

  // ── Admin: Who's Working ──────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [ActiveClock], { name: 'activeClocks' })
  async activeClocks(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ActiveClock[]> {
    const rows = await this.timeClock.getActiveClocks(dispensaryId);
    return rows.map((r: any) => ({
      entryId: r.entry_id,
      profileId: r.profile_id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      positionName: r.position_name,
      clockIn: r.clock_in,
      hoursSoFar: parseFloat(r.hours_so_far),
    }));
  }

  // ── Admin: Time Entries ───────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [TimeEntry], { name: 'timeEntries' })
  async timeEntries(
    @Args('profileId', { type: () => ID }) profileId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ): Promise<TimeEntry[]> {
    return this.timeClock.getTimeEntries(profileId, startDate, endDate);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => TimeEntry, { name: 'approveTimeEntry' })
  async approve(
    @Args('entryId', { type: () => ID }) entryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<TimeEntry> {
    return this.timeClock.approveEntry(entryId, user.sub);
  }

  // ── Admin: Payroll Report ─────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [PayrollRow], { name: 'payrollReport' })
  async payroll(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any[]> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }
    const rows = await this.timeClock.getPayrollReport(dispensaryId, startDate, endDate);
    return rows.map((r: any) => ({
      employeeNumber: r.employee_number,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      positionName: r.position_name,
      payType: r.pay_type,
      hourlyRate: r.hourly_rate ? parseFloat(r.hourly_rate) : null,
      salary: r.salary ? parseFloat(r.salary) : null,
      isExempt: r.is_exempt,
      overtimeEligible: r.overtime_eligible,
      totalHours: parseFloat(r.total_hours) || 0,
      overtimeHours: parseFloat(r.overtime_hours) || 0,
      shiftsWorked: parseInt(r.shifts_worked, 10),
      totalBreakMinutes: parseInt(r.total_break_minutes, 10),
      regularPay: r.regular_pay ? parseFloat(r.regular_pay) : null,
      grossPayWithOt: r.gross_pay_with_ot ? parseFloat(r.gross_pay_with_ot) : null,
    }));
  }
}
