import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Float,
  Int,
} from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import {
  TimeClockService,
  ActiveClockRow,
  PayrollRow as PayrollRawRow,
} from './timeclock.service';
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
    @Args('breakMinutes', { type: () => Int, nullable: true, defaultValue: 0 })
    breakMinutes: number,
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
    if (user.role !== 'super_admin' && user.dispensaryId !== dispensaryId) {
      throw new ForbiddenException('Cross-dispensary access denied');
    }
    const rows: ActiveClockRow[] =
      await this.timeClock.getActiveClocks(dispensaryId);
    return rows.map((r) => ({
      entryId: r.entry_id,
      profileId: r.profile_id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      positionName: r.position_name ?? undefined,
      clockIn: r.clock_in instanceof Date ? r.clock_in : new Date(r.clock_in),
      hoursSoFar:
        typeof r.hours_so_far === 'number'
          ? r.hours_so_far
          : parseFloat(r.hours_so_far),
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
  ): Promise<PayrollRow[]> {
    if (
      user.role === 'dispensary_admin' &&
      dispensaryId !== user.dispensaryId
    ) {
      throw new ForbiddenException('Access denied');
    }
    const rows: PayrollRawRow[] = await this.timeClock.getPayrollReport(
      dispensaryId,
      startDate,
      endDate,
    );
    return rows.map((r) => {
      const hourly = r.hourly_rate == null ? undefined : Number(r.hourly_rate);
      const salary = r.salary == null ? undefined : Number(r.salary);
      return {
        employeeNumber: r.employee_number ?? undefined,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        positionName: r.position_name ?? undefined,
        payType: r.pay_type,
        hourlyRate: hourly,
        salary,
        isExempt: r.is_exempt,
        overtimeEligible: r.overtime_eligible,
        totalHours: Number(r.total_hours) || 0,
        overtimeHours: Number(r.overtime_hours) || 0,
        shiftsWorked:
          typeof r.shifts_worked === 'number'
            ? r.shifts_worked
            : parseInt(r.shifts_worked, 10),
        totalBreakMinutes:
          typeof r.total_break_minutes === 'number'
            ? r.total_break_minutes
            : parseInt(r.total_break_minutes, 10),
        regularPay: r.regular_pay == null ? undefined : Number(r.regular_pay),
        grossPayWithOt:
          r.gross_pay_with_ot == null ? undefined : Number(r.gross_pay_with_ot),
      };
    });
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [TimeEntry], { name: 'myTimeEntries' })
  async myTimeEntries(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<TimeEntry[]> {
    return this.timeClock.getMyTimeEntries(
      user.sub,
      dispensaryId,
      startDate,
      endDate,
    );
  }
}
