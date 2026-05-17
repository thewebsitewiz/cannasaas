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
import {
  ScheduledShift,
  ShiftTemplate,
  ShiftSwapRequest,
  TimeOffRequest,
  DriverProfile,
  DeliveryTrip,
} from './entities/scheduling.entity';

// ── DB row types ──────────────────────────────────────────────────────────

interface ConflictRow {
  shift_id: string;
}

interface TimeOffIdRow {
  request_id: string;
}

interface PublishedShiftRow {
  shift_id: string;
}

interface EmployeeProfileRow {
  profile_id: string;
  position_id: number | null;
}

interface WeekScheduleRow {
  shift_id: string;
  shift_date: string | Date;
  start_time: string;
  end_time: string;
  status: string;
  published: boolean;
  notes: string | null;
  employee_number: string;
  profile_id: string;
  firstName: string;
  lastName: string;
  position_name: string | null;
  position_code: string | null;
}

interface CoverageGapRow {
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  min_staff: number;
  position_name: string | null;
  assigned: string | number;
  gap: string | number;
}

interface TimeOffListRow {
  request_id: string;
  profile_id: string;
  dispensary_id: string;
  start_date: string | Date;
  end_date: string | Date;
  status: string;
  request_type: string;
  reason: string | null;
  firstName: string;
  lastName: string;
  position_name: string | null;
  [key: string]: unknown;
}

interface DriverListRow {
  driver_id: string;
  profile_id: string;
  status: string;
  firstName: string;
  lastName: string;
  employee_number: string;
  phone: string | null;
  total_trips: string | number;
  avg_rating: string | number | null;
  trips_today: string | number;
  [key: string]: unknown;
}

interface DriverStatsRow {
  total_trips: string | number;
  completed: string | number;
  avg_delivery_minutes: string | number | null;
  avg_distance: string | number | null;
  avg_rating: string | number | null;
  positive_ratings: string | number;
  total_miles: string | number | null;
}

// ── Public DTOs ───────────────────────────────────────────────────────────

export interface DriverStatsDto {
  totalTrips: number;
  completed: number;
  avgDeliveryMinutes: number;
  avgDistance: number;
  avgRating: number;
  positiveRatings: number;
  totalMiles: number;
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

function toInt(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? Math.trunc(val) : parseInt(val, 10);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    @InjectRepository(ScheduledShift)
    private shiftRepo: Repository<ScheduledShift>,
    @InjectRepository(ShiftTemplate)
    private templateRepo: Repository<ShiftTemplate>,
    @InjectRepository(ShiftSwapRequest)
    private swapRepo: Repository<ShiftSwapRequest>,
    @InjectRepository(TimeOffRequest)
    private timeOffRepo: Repository<TimeOffRequest>,
    @InjectRepository(DriverProfile)
    private driverRepo: Repository<DriverProfile>,
    @InjectRepository(DeliveryTrip) private tripRepo: Repository<DeliveryTrip>,
    @InjectDataSource() public ds: DataSource,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // SHIFT SCHEDULING
  // ═══════════════════════════════════════════════════════════════════════════

  async getWeekSchedule(
    dispensaryId: string,
    weekStart: string,
  ): Promise<WeekScheduleRow[]> {
    const sql = `SELECT ss.shift_id, ss.shift_date, ss.start_time, ss.end_time, ss.status, ss.published, ss.notes,
      ep.employee_number, ep.profile_id, u."firstName", u."lastName",
      lp.name as position_name, lp.code as position_code
     FROM scheduled_shifts ss
     JOIN employee_profiles ep ON ep.profile_id = ss.profile_id
     JOIN users u ON u.id = ep.user_id
     LEFT JOIN lkp_positions lp ON lp.position_id = ep.position_id
     WHERE ss.dispensary_id = $1 AND ss.shift_date >= $2::DATE AND ss.shift_date < $2::DATE + INTERVAL '7 days'
     ORDER BY ss.shift_date, ss.start_time, u."lastName"`;
    return rawQuery<WeekScheduleRow>(this.ds, sql, [dispensaryId, weekStart]);
  }

  async getMyShifts(
    profileId: string,
    startDate: string,
    endDate: string,
  ): Promise<ScheduledShift[]> {
    return this.shiftRepo
      .createQueryBuilder('s')
      .where('s.profile_id = :profileId', { profileId })
      .andWhere('s.shift_date >= :start', { start: startDate })
      .andWhere('s.shift_date <= :end', { end: endDate })
      .orderBy('s.shift_date', 'ASC')
      .addOrderBy('s.start_time', 'ASC')
      .getMany();
  }

  async createShift(input: {
    dispensaryId: string;
    profileId: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    notes?: string;
    createdByUserId: string;
  }): Promise<ScheduledShift> {
    const conflicts = await rawQuery<ConflictRow>(
      this.ds,
      `SELECT shift_id FROM scheduled_shifts WHERE profile_id = $1 AND shift_date = $2 AND ((start_time < $4::TIME AND end_time > $3::TIME))`,
      [input.profileId, input.shiftDate, input.startTime, input.endTime],
    );
    if (conflicts[0])
      throw new BadRequestException('Shift conflicts with existing schedule');

    const timeOff = await rawQuery<TimeOffIdRow>(
      this.ds,
      `SELECT request_id FROM time_off_requests WHERE profile_id = $1 AND status = 'approved' AND $2::DATE BETWEEN start_date AND end_date`,
      [input.profileId, input.shiftDate],
    );
    if (timeOff[0])
      throw new BadRequestException(
        'Employee has approved time off on this date',
      );

    const shift = this.shiftRepo.create({
      dispensary_id: input.dispensaryId,
      profile_id: input.profileId,
      shift_date: input.shiftDate,
      start_time: input.startTime,
      end_time: input.endTime,
      notes: input.notes,
    });

    return this.shiftRepo.save(shift);
  }

  async deleteShift(shiftId: string): Promise<boolean> {
    const result = await this.shiftRepo.delete({ shiftId });
    return (result.affected ?? 0) > 0;
  }

  async publishWeek(dispensaryId: string, weekStart: string): Promise<number> {
    const result = await rawQuery<PublishedShiftRow>(
      this.ds,
      `UPDATE scheduled_shifts SET published = true, updated_at = NOW() WHERE dispensary_id = $1 AND shift_date >= $2::DATE AND shift_date < $2::DATE + INTERVAL '7 days' AND published = false RETURNING shift_id`,
      [dispensaryId, weekStart],
    );
    this.logger.log(
      'Published ' + String(result.length) + ' shifts for week of ' + weekStart,
    );
    return result.length;
  }

  async autoGenerateWeek(
    dispensaryId: string,
    weekStart: string,
    createdByUserId: string,
  ): Promise<number> {
    const templates = await this.templateRepo.find({
      where: { dispensary_id: dispensaryId, is_active: true },
    });
    const employees = await rawQuery<EmployeeProfileRow>(
      this.ds,
      `SELECT ep.profile_id, ep.position_id FROM employee_profiles ep WHERE ep.dispensary_id = $1 AND ep.employment_status = 'active' AND ep.is_exempt = false`,
      [dispensaryId],
    );

    let created = 0;
    for (const tmpl of templates) {
      const shiftDate = new Date(weekStart);
      shiftDate.setDate(
        shiftDate.getDate() + tmpl.day_of_week - (shiftDate.getDay() || 7),
      );
      const dateStr = shiftDate.toISOString().split('T')[0];

      const eligible = employees.filter(
        (e) => !tmpl.position_id || e.position_id === tmpl.position_id,
      );
      const toAssign = eligible.slice(0, tmpl.max_staff);

      for (const emp of toAssign) {
        try {
          await this.createShift({
            dispensaryId,
            profileId: emp.profile_id,
            shiftDate: dateStr,
            startTime: tmpl.start_time,
            endTime: tmpl.end_time,
            createdByUserId,
          });
          created++;
        } catch {
          /* conflict — skip */
        }
      }
    }

    this.logger.log(
      'Auto-generated ' + String(created) + ' shifts for ' + weekStart,
    );
    return created;
  }

  async getCoverageGaps(
    dispensaryId: string,
    weekStart: string,
  ): Promise<CoverageGapRow[]> {
    const sql = `SELECT st.name, st.day_of_week, st.start_time, st.end_time, st.min_staff,
      lp.name as position_name,
      COUNT(ss.shift_id) as assigned,
      st.min_staff - COUNT(ss.shift_id) as gap
     FROM shift_templates st
     LEFT JOIN lkp_positions lp ON lp.position_id = st.position_id
     LEFT JOIN scheduled_shifts ss ON ss.dispensary_id = st.dispensary_id
       AND ss.shift_date = $2::DATE + ((st.day_of_week - 1) || ' days')::INTERVAL
       AND ss.start_time = st.start_time AND ss.end_time = st.end_time
       AND ss.status != 'cancelled'
     WHERE st.dispensary_id = $1 AND st.is_active = true
     GROUP BY st.template_id, st.name, st.day_of_week, st.start_time, st.end_time, st.min_staff, lp.name
     HAVING COUNT(ss.shift_id) < st.min_staff
     ORDER BY st.day_of_week, st.start_time`;
    return rawQuery<CoverageGapRow>(this.ds, sql, [dispensaryId, weekStart]);
  }

  // ── Shift Swaps ───────────────────────────────────────────────────────────

  async requestSwap(
    shiftId: string,
    profileId: string,
    reason?: string,
  ): Promise<ShiftSwapRequest> {
    const swap = this.swapRepo.create({
      original_shift_id: shiftId,
      requesting_profile_id: profileId,
      reason,
    });
    return this.swapRepo.save(swap);
  }

  async claimSwap(
    swapId: string,
    coveringProfileId: string,
  ): Promise<ShiftSwapRequest> {
    const swap = await this.swapRepo.findOne({ where: { swapId } });
    if (!swap) throw new NotFoundException('Swap not found');
    swap.covering_profile_id = coveringProfileId;
    swap.status = 'claimed';
    return this.swapRepo.save(swap);
  }

  async approveSwap(
    swapId: string,
    managerUserId: string,
  ): Promise<ShiftSwapRequest> {
    const swap = await this.swapRepo.findOne({ where: { swapId } });
    if (!swap || !swap.covering_profile_id)
      throw new BadRequestException('Swap must be claimed first');
    await this.shiftRepo.update(
      { shiftId: swap.original_shift_id },
      { profile_id: swap.covering_profile_id },
    );
    swap.status = 'approved';
    void managerUserId;
    return this.swapRepo.save(swap);
  }

  // ── Time Off ──────────────────────────────────────────────────────────────

  async requestTimeOff(
    profileId: string,
    dispensaryId: string,
    input: {
      startDate: string;
      endDate: string;
      requestType: string;
      reason?: string;
    },
  ): Promise<TimeOffRequest> {
    const req = this.timeOffRepo.create({
      profile_id: profileId,
      dispensary_id: dispensaryId,
      start_date: input.startDate,
      end_date: input.endDate,
      request_type: input.requestType,
      reason: input.reason,
    });
    return this.timeOffRepo.save(req);
  }

  async reviewTimeOff(
    requestId: string,
    approved: boolean,
    reviewerUserId: string,
  ): Promise<TimeOffRequest> {
    const req = await this.timeOffRepo.findOne({ where: { requestId } });
    if (!req) throw new NotFoundException('Request not found');
    req.status = approved ? 'approved' : 'denied';
    void reviewerUserId;
    return this.timeOffRepo.save(req);
  }

  async getTimeOffRequests(
    dispensaryId: string,
    status?: string,
  ): Promise<TimeOffListRow[]> {
    const sql = `SELECT tor.*, u."firstName", u."lastName", lp.name as position_name
     FROM time_off_requests tor
     JOIN employee_profiles ep ON ep.profile_id = tor.profile_id
     JOIN users u ON u.id = ep.user_id
     LEFT JOIN lkp_positions lp ON lp.position_id = ep.position_id
     WHERE tor.dispensary_id = $1 ${status ? 'AND tor.status = $2' : ''}
     ORDER BY tor.start_date ASC`;
    return rawQuery<TimeOffListRow>(
      this.ds,
      sql,
      status ? [dispensaryId, status] : [dispensaryId],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELIVERY DRIVER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async getDrivers(dispensaryId: string): Promise<DriverListRow[]> {
    const sql = `SELECT dp.*, u."firstName", u."lastName", ep.employee_number, ep.phone,
      (SELECT COUNT(*) FROM delivery_trips dt WHERE dt.driver_id = dp.driver_id AND dt.status = 'completed') as total_trips,
      (SELECT ROUND(AVG(dt.customer_rating)::NUMERIC, 1) FROM delivery_trips dt WHERE dt.driver_id = dp.driver_id AND dt.customer_rating IS NOT NULL) as avg_rating,
      (SELECT COUNT(*) FROM delivery_trips dt WHERE dt.driver_id = dp.driver_id AND dt.status = 'completed' AND dt.created_at >= NOW() - INTERVAL '24 hours') as trips_today
     FROM driver_profiles dp
     JOIN employee_profiles ep ON ep.profile_id = dp.profile_id
     JOIN users u ON u.id = ep.user_id
     WHERE dp.dispensary_id = $1
     ORDER BY u."lastName"`;
    return rawQuery<DriverListRow>(this.ds, sql, [dispensaryId]);
  }

  async updateDriverStatus(
    driverId: string,
    status: string,
    lat?: number,
    lng?: number,
  ): Promise<DriverProfile> {
    const driver = await this.driverRepo.findOne({ where: { driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    driver.status = status;
    if (lat !== undefined) driver.current_latitude = lat;
    if (lng !== undefined) driver.current_longitude = lng;
    if (lat !== undefined || lng !== undefined)
      driver.last_location_update = new Date();
    return this.driverRepo.save(driver);
  }

  async assignDelivery(
    driverId: string,
    dispensaryId: string,
    input: {
      orderId?: string;
      deliveryAddress: string;
      lat?: number;
      lng?: number;
      distanceMiles?: number;
      estimatedMinutes?: number;
    },
  ): Promise<DeliveryTrip> {
    const driver = await this.driverRepo.findOne({ where: { driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    if (driver.status === 'off_duty')
      throw new BadRequestException('Driver is off duty');

    const trips = await rawQuery<DeliveryTrip>(
      this.ds,
      'INSERT INTO delivery_trips (driver_id, dispensary_id, order_id, delivery_address, delivery_latitude, delivery_longitude, distance_miles, estimated_minutes, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        driverId,
        dispensaryId,
        input.orderId ?? null,
        input.deliveryAddress,
        input.lat ?? null,
        input.lng ?? null,
        input.distanceMiles ?? null,
        input.estimatedMinutes ?? null,
        'assigned',
      ],
    );

    await this.driverRepo.update({ driverId }, { status: 'on_delivery' });
    return trips[0];
  }

  async completeTrip(
    tripId: string,
    rating?: number,
    feedback?: string,
  ): Promise<DeliveryTrip> {
    const trip = await this.tripRepo.findOne({ where: { tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    trip.status = 'completed';
    trip.delivered_at = new Date();
    if (trip.departed_at) {
      trip.actual_minutes = Math.round(
        (new Date().getTime() - trip.departed_at.getTime()) / 60000,
      );
    }
    if (rating) trip.customer_rating = rating;
    void feedback;

    await this.driverRepo.update(
      { driverId: trip.driver_id },
      { status: 'available' },
    );
    return this.tripRepo.save(trip);
  }

  async getDriverTrips(driverId: string, days = 7): Promise<DeliveryTrip[]> {
    const sql =
      "SELECT * FROM delivery_trips WHERE driver_id = $1 AND created_at >= NOW() - ($2 || ' days')::INTERVAL ORDER BY created_at DESC";
    return rawQuery<DeliveryTrip>(this.ds, sql, [driverId, days]);
  }

  async getDriverStats(
    dispensaryId: string,
    days = 30,
  ): Promise<DriverStatsDto> {
    const sql = `SELECT COUNT(*) as total_trips,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      ROUND(AVG(actual_minutes) FILTER (WHERE status = 'completed'), 1) as avg_delivery_minutes,
      ROUND(AVG(distance_miles) FILTER (WHERE status = 'completed'), 1) as avg_distance,
      ROUND(AVG(customer_rating) FILTER (WHERE customer_rating IS NOT NULL), 1) as avg_rating,
      COUNT(*) FILTER (WHERE customer_rating >= 4) as positive_ratings,
      ROUND(SUM(distance_miles) FILTER (WHERE status = 'completed'), 1) as total_miles
     FROM delivery_trips WHERE dispensary_id = $1 AND created_at >= NOW() - INTERVAL '1 day' * $2`;
    const rows = await rawQuery<DriverStatsRow>(this.ds, sql, [
      dispensaryId,
      days,
    ]);
    const stats = rows[0];
    return {
      totalTrips: toInt(stats.total_trips),
      completed: toInt(stats.completed),
      avgDeliveryMinutes: toNumber(stats.avg_delivery_minutes),
      avgDistance: toNumber(stats.avg_distance),
      avgRating: toNumber(stats.avg_rating),
      positiveRatings: toInt(stats.positive_ratings),
      totalMiles: toNumber(stats.total_miles),
    };
  }
}
