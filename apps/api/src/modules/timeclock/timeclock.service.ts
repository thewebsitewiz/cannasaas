import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TimeEntry } from './entities/time-entry.entity';

// ── DB row types ──────────────────────────────────────────────────────────

interface ProfileLookupRow {
  profile_id: string;
  is_exempt: boolean;
  employment_status?: string;
  position_name?: string | null;
}

interface ExistingEntryRow {
  entry_id: string;
}

interface TodayHoursRow {
  today_hours: string | number;
}

export interface ActiveClockRow {
  entry_id: string;
  profile_id: string;
  firstName: string;
  lastName: string;
  email: string;
  position_name: string | null;
  clock_in: Date | string;
  hours_so_far: string | number;
}

export interface PayrollRow {
  employee_number: string | null;
  firstName: string;
  lastName: string;
  email: string;
  position_name: string | null;
  pay_type: string;
  hourly_rate: string | number | null;
  salary: string | number | null;
  is_exempt: boolean;
  overtime_eligible: boolean;
  total_hours: string | number;
  total_break_minutes: string | number;
  shifts_worked: string | number;
  overtime_hours: string | number;
  regular_pay: string | number | null;
  gross_pay_with_ot: string | number | null;
}

interface DispensaryNameRow {
  name: string;
  state: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

function toNumber(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class TimeClockService {
  private readonly logger = new Logger(TimeClockService.name);

  constructor(
    @InjectRepository(TimeEntry) private entryRepo: Repository<TimeEntry>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  // ── Clock In ──────────────────────────────────────────────────────────────

  async clockIn(
    userId: string,
    dispensaryId: string,
    notes?: string,
  ): Promise<TimeEntry> {
    const profiles = await rawQuery<ProfileLookupRow>(
      this.dataSource,
      `SELECT ep.profile_id, ep.is_exempt, ep.employment_status, lp.name as position_name
       FROM employee_profiles ep
       LEFT JOIN lkp_positions lp ON lp.position_id = ep.position_id
       WHERE ep.user_id = $1 AND ep.dispensary_id = $2`,
      [userId, dispensaryId],
    );
    const profile = profiles[0];
    if (!profile) throw new NotFoundException('Employee profile not found');
    if (profile.employment_status !== 'active')
      throw new BadRequestException('Employee is not active');
    if (profile.is_exempt)
      throw new BadRequestException(
        `${profile.position_name ?? 'This position'} is exempt from time tracking`,
      );

    const existing = await rawQuery<ExistingEntryRow>(
      this.dataSource,
      `SELECT entry_id FROM time_entries WHERE profile_id = $1 AND status = 'clocked_in'`,
      [profile.profile_id],
    );
    if (existing[0])
      throw new BadRequestException('Already clocked in. Clock out first.');

    const entry = this.entryRepo.create({
      profile_id: profile.profile_id,
      dispensary_id: dispensaryId,
      clock_in: new Date(),
      status: 'clocked_in',
      notes,
    });

    const saved = await this.entryRepo.save(entry);
    this.logger.log(`Clock IN: user=${userId} profile=${profile.profile_id}`);
    return saved;
  }

  // ── Clock Out ─────────────────────────────────────────────────────────────

  async clockOut(
    userId: string,
    dispensaryId: string,
    breakMinutes = 0,
    notes?: string,
  ): Promise<TimeEntry> {
    const profiles = await rawQuery<ProfileLookupRow>(
      this.dataSource,
      `SELECT profile_id, is_exempt FROM employee_profiles WHERE user_id = $1 AND dispensary_id = $2`,
      [userId, dispensaryId],
    );
    const profile = profiles[0];
    if (!profile) throw new NotFoundException('Employee profile not found');

    const entry = await this.entryRepo.findOne({
      where: { profile_id: profile.profile_id, status: 'clocked_in' },
      order: { clock_in: 'DESC' },
    });
    if (!entry) throw new BadRequestException('Not currently clocked in');

    const clockOut = new Date();
    const rawHours =
      (clockOut.getTime() - entry.clock_in.getTime()) / (1000 * 60 * 60);
    const totalHours = Math.max(
      0,
      parseFloat((rawHours - breakMinutes / 60).toFixed(2)),
    );

    entry.clock_out = clockOut;
    entry.break_minutes = breakMinutes;
    entry.total_hours = totalHours;
    entry.status = 'completed';
    if (notes) entry.notes = entry.notes ? entry.notes + ' | ' + notes : notes;

    const saved = await this.entryRepo.save(entry);
    this.logger.log(
      `Clock OUT: profile=${profile.profile_id} hours=${String(totalHours)}`,
    );
    return saved;
  }

  // ── Current Status ────────────────────────────────────────────────────────

  async getClockStatus(
    userId: string,
    dispensaryId: string,
  ): Promise<{
    isClockedIn: boolean;
    isExempt: boolean;
    currentEntry?: TimeEntry;
    todayHours: number;
  }> {
    const profiles = await rawQuery<ProfileLookupRow>(
      this.dataSource,
      `SELECT profile_id, is_exempt FROM employee_profiles WHERE user_id = $1 AND dispensary_id = $2`,
      [userId, dispensaryId],
    );
    const profile = profiles[0];
    if (!profile) throw new NotFoundException('Employee profile not found');

    if (profile.is_exempt) {
      return { isClockedIn: false, isExempt: true, todayHours: 0 };
    }

    const currentEntry = await this.entryRepo.findOne({
      where: { profile_id: profile.profile_id, status: 'clocked_in' },
      order: { clock_in: 'DESC' },
    });

    const todayRows = await rawQuery<TodayHoursRow>(
      this.dataSource,
      `SELECT COALESCE(SUM(total_hours), 0) as today_hours
       FROM time_entries
       WHERE profile_id = $1 AND clock_in >= CURRENT_DATE AND status = 'completed'`,
      [profile.profile_id],
    );

    return {
      isClockedIn: !!currentEntry,
      isExempt: false,
      currentEntry: currentEntry ?? undefined,
      todayHours: toNumber(todayRows[0]?.today_hours),
    };
  }

  // ── Who's Clocked In ─────────────────────────────────────────────────────

  async getActiveClocks(dispensaryId: string): Promise<ActiveClockRow[]> {
    return rawQuery<ActiveClockRow>(
      this.dataSource,
      `SELECT te.entry_id, te.clock_in, te.profile_id,
        u."firstName", u."lastName", u.email,
        lp.name as position_name,
        ROUND(EXTRACT(EPOCH FROM (NOW() - te.clock_in)) / 3600.0, 2) as hours_so_far
       FROM time_entries te
       JOIN employee_profiles ep ON ep.profile_id = te.profile_id
       JOIN users u ON u.id = ep.user_id
       LEFT JOIN lkp_positions lp ON lp.position_id = ep.position_id
       WHERE te.dispensary_id = $1 AND te.status = 'clocked_in'
       ORDER BY te.clock_in ASC`,
      [dispensaryId],
    );
  }

  // ── Time Entries for Employee ─────────────────────────────────────────────

  async getTimeEntries(
    profileId: string,
    startDate: string,
    endDate: string,
  ): Promise<TimeEntry[]> {
    return this.entryRepo
      .createQueryBuilder('te')
      .where('te.profile_id = :profileId', { profileId })
      .andWhere('te.clock_in >= :start', { start: startDate })
      .andWhere('te.clock_in < :end', { end: endDate + 'T23:59:59Z' })
      .orderBy('te.clock_in', 'ASC')
      .getMany();
  }

  // ── Approve Timesheet ─────────────────────────────────────────────────────

  async approveEntry(
    entryId: string,
    approverUserId: string,
  ): Promise<TimeEntry> {
    const entry = await this.entryRepo.findOne({ where: { entryId } });
    if (!entry) throw new NotFoundException('Time entry not found');
    if (entry.status !== 'completed')
      throw new BadRequestException('Can only approve completed entries');
    entry.status = 'approved';
    entry.approved_by_user_id = approverUserId;
    entry.approved_at = new Date();
    return this.entryRepo.save(entry);
  }

  // ── Payroll Report ────────────────────────────────────────────────────────

  async getPayrollReport(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<PayrollRow[]> {
    return rawQuery<PayrollRow>(
      this.dataSource,
      `SELECT
        ep.employee_number,
        u."firstName", u."lastName", u.email,
        lp.name as position_name,
        ep.pay_type, ep.hourly_rate, ep.salary, ep.is_exempt,
        ep.overtime_eligible,
        COALESCE(SUM(te.total_hours), 0)::DECIMAL(8,2) as total_hours,
        COALESCE(SUM(CASE WHEN te.total_hours > 0 THEN te.break_minutes ELSE 0 END), 0) as total_break_minutes,
        COUNT(te.entry_id) FILTER (WHERE te.status IN ('completed','approved')) as shifts_worked,
        COALESCE(SUM(te.overtime_hours), 0)::DECIMAL(8,2) as overtime_hours,
        CASE
          WHEN ep.is_exempt THEN ep.salary
          ELSE ROUND(COALESCE(SUM(te.total_hours), 0) * ep.hourly_rate, 2)
        END as regular_pay,
        CASE
          WHEN ep.overtime_eligible AND NOT ep.is_exempt
          THEN ROUND(
            GREATEST(0, COALESCE(SUM(te.total_hours), 0) - 40) * ep.hourly_rate * 1.5
            + LEAST(COALESCE(SUM(te.total_hours), 0), 40) * ep.hourly_rate, 2)
          ELSE NULL
        END as gross_pay_with_ot
       FROM employee_profiles ep
       JOIN users u ON u.id = ep.user_id
       LEFT JOIN lkp_positions lp ON lp.position_id = ep.position_id
       LEFT JOIN time_entries te ON te.profile_id = ep.profile_id
         AND te.clock_in >= $2::DATE AND te.clock_in < ($3::DATE + INTERVAL '1 day')
         AND te.status IN ('completed', 'approved')
       WHERE ep.dispensary_id = $1 AND ep.employment_status = 'active'
       GROUP BY ep.profile_id, ep.employee_number, u."firstName", u."lastName", u.email,
                lp.name, ep.pay_type, ep.hourly_rate, ep.salary, ep.is_exempt, ep.overtime_eligible
       ORDER BY u."lastName", u."firstName"`,
      [dispensaryId, startDate, endDate],
    );
  }

  // ── CSV Export ────────────────────────────────────────────────────────────

  async generatePayrollCsv(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<string> {
    const rows = await this.getPayrollReport(dispensaryId, startDate, endDate);

    const dispRows = await rawQuery<DispensaryNameRow>(
      this.dataSource,
      `SELECT name, state FROM dispensaries WHERE entity_id = $1`,
      [dispensaryId],
    );
    const dispName = dispRows[0]?.name ?? 'Unknown';

    const headers = [
      'Employee #',
      'First Name',
      'Last Name',
      'Email',
      'Position',
      'Pay Type',
      'Hourly Rate',
      'Exempt',
      'OT Eligible',
      'Total Hours',
      'Regular Hours',
      'OT Hours',
      'Shifts',
      'Break Minutes',
      'Regular Pay',
      'OT Pay',
      'Gross Pay',
    ].join(',');

    const csvRows = rows.map((r) => {
      const totalHrs = toNumber(r.total_hours);
      const regHrs = Math.min(totalHrs, 40);
      const otHrs = Math.max(0, totalHrs - 40);
      const rate = toNumber(r.hourly_rate);
      const regPay = r.is_exempt
        ? toNumber(r.salary)
        : parseFloat((regHrs * rate).toFixed(2));
      const otPay =
        r.overtime_eligible && !r.is_exempt
          ? parseFloat((otHrs * rate * 1.5).toFixed(2))
          : 0;
      const grossPay = parseFloat((regPay + otPay).toFixed(2));

      return [
        r.employee_number ?? '',
        r.firstName,
        r.lastName,
        r.email,
        r.position_name ?? '',
        r.pay_type,
        rate.toFixed(2),
        r.is_exempt ? 'Yes' : 'No',
        r.overtime_eligible ? 'Yes' : 'No',
        totalHrs.toFixed(2),
        regHrs.toFixed(2),
        otHrs.toFixed(2),
        String(r.shifts_worked),
        String(r.total_break_minutes),
        regPay.toFixed(2),
        otPay.toFixed(2),
        grossPay.toFixed(2),
      ]
        .map((v) => `"${v}"`)
        .join(',');
    });

    const meta = [
      `"Payroll Report: ${dispName}"`,
      `"Period: ${startDate} to ${endDate}"`,
      `"Generated: ${new Date().toISOString()}"`,
      '',
    ].join('\n');

    return meta + headers + '\n' + csvRows.join('\n') + '\n';
  }

  async getMyTimeEntries(
    userId: string,
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<TimeEntry[]> {
    const profiles = await rawQuery<ProfileLookupRow>(
      this.dataSource,
      `SELECT profile_id, is_exempt FROM employee_profiles WHERE user_id = $1 AND dispensary_id = $2`,
      [userId, dispensaryId],
    );
    const profile = profiles[0];
    if (!profile) throw new NotFoundException('Employee profile not found');
    return this.getTimeEntries(profile.profile_id, startDate, endDate);
  }
}
