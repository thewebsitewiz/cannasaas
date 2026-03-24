import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject, ScheduledShift, ShiftTemplate, ShiftSwapRequest, TimeOffRequest, DriverProfile, DeliveryTrip } from './entities/scheduling.entity';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class SchedulingService {
  private shiftRepo: any;
  private templateRepo: any;
  private swapRepo: any;
  private timeOffRepo: any;
  private driverRepo: any;
  private tripRepo: any;
  private readonly logger = new Logger(SchedulingService.name);

  constructor(

    @Inject(DRIZZLE) private db: any
  ) {
    this.shiftRepo = this._makeRepo('scheduled_shifts');
    this.templateRepo = this._makeRepo('notification_templates');
    this.swapRepo = this._makeRepo('shift_swap_requests');
    this.timeOffRepo = this._makeRepo('time_off_requests');
    this.driverRepo = this._makeRepo('driver_profiles');
    this.tripRepo = this._makeRepo('delivery_trips');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHIFT SCHEDULING
  // ═══════════════════════════════════════════════════════════════════════════

  async getWeekSchedule(dispensaryId: string, weekStart: string): Promise<any[]> {
    const sql = `SELECT ss.shift_id, ss.shift_date, ss.start_time, ss.end_time, ss.status, ss.published, ss.notes,
      ep.employee_number, ep.profile_id, u."firstName", u."lastName",
      lp.name as position_name, lp.code as position_code
     FROM scheduled_shifts ss
     JOIN employee_profiles ep ON ep.profile_id = ss.profile_id
     JOIN users u ON u.id = ep.user_id
     LEFT JOIN lkp_positions lp ON lp.position_id = ep.position_id
     WHERE ss.dispensary_id = $1 AND ss.shift_date >= $2::DATE AND ss.shift_date < $2::DATE + INTERVAL '7 days'
     ORDER BY ss.shift_date, ss.start_time, u."lastName"`;
    return this._q(sql, [dispensaryId, weekStart]);
  }

  async getMyShifts(profileId: string, startDate: string, endDate: string): Promise<ScheduledShift[]> {
    return this.shiftRepo.createQueryBuilder('s')
      .where('s.profile_id = :profileId', { profileId })
      .andWhere('s.shift_date >= :start', { start: startDate })
      .andWhere('s.shift_date <= :end', { end: endDate })
      .orderBy('s.shift_date', 'ASC')
      .addOrderBy('s.start_time', 'ASC')
      .getMany();
  }

  async createShift(input: { dispensaryId: string; profileId: string; shiftDate: string; startTime: string; endTime: string; notes?: string; createdByUserId: string }): Promise<ScheduledShift> {
    const [conflict] = await this._q(
      `SELECT shift_id FROM scheduled_shifts WHERE profile_id = $1 AND shift_date = $2 AND ((start_time < $4::TIME AND end_time > $3::TIME))`,
      [input.profileId, input.shiftDate, input.startTime, input.endTime],
    );
    if (conflict) throw new BadRequestException('Shift conflicts with existing schedule');

    const [timeOff] = await this._q(
      `SELECT request_id FROM time_off_requests WHERE profile_id = $1 AND status = 'approved' AND $2::DATE BETWEEN start_date AND end_date`,
      [input.profileId, input.shiftDate],
    );
    if (timeOff) throw new BadRequestException('Employee has approved time off on this date');

    const shift = this.shiftRepo.create({
      dispensary_id: input.dispensaryId,
      profile_id: input.profileId,
      shift_date: input.shiftDate,
      start_time: input.startTime,
      end_time: input.endTime,
      notes: input.notes,
    });

    return this.shiftRepo.save(shift) as Promise<ScheduledShift>;
  }

  async deleteShift(shiftId: string): Promise<boolean> {
    const result = await this.shiftRepo.delete({ shiftId });
    return (result.affected ?? 0) > 0;
  }

  async publishWeek(dispensaryId: string, weekStart: string): Promise<number> {
    const result = await this._q(
      `UPDATE scheduled_shifts SET published = true, updated_at = NOW() WHERE dispensary_id = $1 AND shift_date >= $2::DATE AND shift_date < $2::DATE + INTERVAL '7 days' AND published = false RETURNING shift_id`,
      [dispensaryId, weekStart],
    );
    this.logger.log('Published ' + result.length + ' shifts for week of ' + weekStart);
    return result.length;
  }

  async autoGenerateWeek(dispensaryId: string, weekStart: string, createdByUserId: string): Promise<number> {
    const templates = await this.templateRepo.find({ where: { dispensary_id: dispensaryId, is_active: true } });
    const employees = await this._q(
      `SELECT ep.profile_id, ep.position_id FROM employee_profiles ep WHERE ep.dispensary_id = $1 AND ep.employment_status = 'active' AND ep.is_exempt = false`,
      [dispensaryId],
    );

    let created = 0;
    for (const tmpl of templates) {
      const shiftDate = new Date(weekStart);
      shiftDate.setDate(shiftDate.getDate() + tmpl.day_of_week - (shiftDate.getDay() || 7));
      const dateStr = shiftDate.toISOString().split('T')[0];

      const eligible = employees.filter((e: any) => !tmpl.position_id || e.position_id === tmpl.position_id);
      const toAssign = eligible.slice(0, tmpl.max_staff);

      for (const emp of toAssign) {
        try {
          await this.createShift({ dispensaryId, profileId: emp.profile_id, shiftDate: dateStr, startTime: tmpl.start_time, endTime: tmpl.end_time, createdByUserId });
          created++;
        } catch { /* conflict — skip */ }
      }
    }

    this.logger.log('Auto-generated ' + created + ' shifts for ' + weekStart);
    return created;
  }

  async getCoverageGaps(dispensaryId: string, weekStart: string): Promise<any[]> {
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
    return this._q(sql, [dispensaryId, weekStart]);
  }

  // ── Shift Swaps ───────────────────────────────────────────────────────────

  async requestSwap(shiftId: string, profileId: string, reason?: string): Promise<ShiftSwapRequest> {
    const swap = this.swapRepo.create({ original_shift_id: shiftId, requesting_profile_id: profileId, reason });
    return this.swapRepo.save(swap) as Promise<ShiftSwapRequest>;
  }

  async claimSwap(swapId: string, coveringProfileId: string): Promise<ShiftSwapRequest> {
    const swap = await this.swapRepo.findOne({ where: { swapId } });
    if (!swap) throw new NotFoundException('Swap not found');
    swap.covering_profile_id = coveringProfileId;
    swap.status = 'claimed';
    return this.swapRepo.save(swap);
  }

  async approveSwap(swapId: string, managerUserId: string): Promise<ShiftSwapRequest> {
    const swap = await this.swapRepo.findOne({ where: { swapId } });
    if (!swap || !swap.covering_profile_id) throw new BadRequestException('Swap must be claimed first');
    await this.shiftRepo.update({ shiftId: swap.original_shift_id }, { profile_id: swap.covering_profile_id });
    swap.status = 'approved';
    return this.swapRepo.save(swap);
  }

  // ── Time Off ──────────────────────────────────────────────────────────────

  async requestTimeOff(profileId: string, dispensaryId: string, input: { startDate: string; endDate: string; requestType: string; reason?: string }): Promise<TimeOffRequest> {
    const req = this.timeOffRepo.create({
      profile_id: profileId, dispensary_id: dispensaryId,
      start_date: input.startDate, end_date: input.endDate,
      request_type: input.requestType, reason: input.reason,
    });
    return this.timeOffRepo.save(req) as Promise<TimeOffRequest>;
  }

  async reviewTimeOff(requestId: string, approved: boolean, reviewerUserId: string): Promise<TimeOffRequest> {
    const req = await this.timeOffRepo.findOne({ where: { requestId } });
    if (!req) throw new NotFoundException('Request not found');
    req.status = approved ? 'approved' : 'denied';
    return this.timeOffRepo.save(req);
  }

  async getTimeOffRequests(dispensaryId: string, status?: string): Promise<any[]> {
    const sql = `SELECT tor.*, u."firstName", u."lastName", lp.name as position_name
     FROM time_off_requests tor
     JOIN employee_profiles ep ON ep.profile_id = tor.profile_id
     JOIN users u ON u.id = ep.user_id
     LEFT JOIN lkp_positions lp ON lp.position_id = ep.position_id
     WHERE tor.dispensary_id = $1 ${status ? 'AND tor.status = $2' : ''}
     ORDER BY tor.start_date ASC`;
    return this._q(sql, status ? [dispensaryId, status] : [dispensaryId]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELIVERY DRIVER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async getDrivers(dispensaryId: string): Promise<any[]> {
    const sql = `SELECT dp.*, u."firstName", u."lastName", ep.employee_number, ep.phone,
      (SELECT COUNT(*) FROM delivery_trips dt WHERE dt.driver_id = dp.driver_id AND dt.status = 'completed') as total_trips,
      (SELECT ROUND(AVG(dt.customer_rating)::NUMERIC, 1) FROM delivery_trips dt WHERE dt.driver_id = dp.driver_id AND dt.customer_rating IS NOT NULL) as avg_rating,
      (SELECT COUNT(*) FROM delivery_trips dt WHERE dt.driver_id = dp.driver_id AND dt.status = 'completed' AND dt.created_at >= NOW() - INTERVAL '24 hours') as trips_today
     FROM driver_profiles dp
     JOIN employee_profiles ep ON ep.profile_id = dp.profile_id
     JOIN users u ON u.id = ep.user_id
     WHERE dp.dispensary_id = $1
     ORDER BY u."lastName"`;
    return this._q(sql, [dispensaryId]);
  }

  async updateDriverStatus(driverId: string, status: string, lat?: number, lng?: number): Promise<DriverProfile> {
    const driver = await this.driverRepo.findOne({ where: { driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    driver.status = status;
    if (lat !== undefined) driver.current_latitude = lat;
    if (lng !== undefined) driver.current_longitude = lng;
    if (lat || lng) driver.last_location_update = new Date();
    return this.driverRepo.save(driver);
  }

  async assignDelivery(driverId: string, dispensaryId: string, input: { orderId?: string; deliveryAddress: string; lat?: number; lng?: number; distanceMiles?: number; estimatedMinutes?: number }): Promise<any> {
    const driver = await this.driverRepo.findOne({ where: { driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    if (driver.status === 'off_duty') throw new BadRequestException('Driver is off duty');

    const [trip] = await this._q(
      'INSERT INTO delivery_trips (driver_id, dispensary_id, order_id, delivery_address, delivery_latitude, delivery_longitude, distance_miles, estimated_minutes, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [driverId, dispensaryId, input.orderId || null, input.deliveryAddress, input.lat || null, input.lng || null, input.distanceMiles || null, input.estimatedMinutes || null, 'assigned'],
    );

    await this.driverRepo.update({ driverId }, { status: 'on_delivery' });
    return trip;
  }

  async completeTrip(tripId: string, rating?: number, feedback?: string): Promise<DeliveryTrip> {
    const trip = await this.tripRepo.findOne({ where: { tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    trip.status = 'completed';
    trip.delivered_at = new Date();
    if (trip.departed_at) {
      trip.actual_minutes = Math.round((new Date().getTime() - trip.departed_at.getTime()) / 60000);
    }
    if (rating) trip.customer_rating = rating;

    await this.driverRepo.update({ driverId: trip.driver_id }, { status: 'available' });
    return this.tripRepo.save(trip);
  }

  async getDriverTrips(driverId: string, days = 7): Promise<DeliveryTrip[]> {
    const sql = 'SELECT * FROM delivery_trips WHERE driver_id = $1 AND created_at >= NOW() - ($2 || \' days\')::INTERVAL ORDER BY created_at DESC';
    return this._q(sql, [driverId, days]);
  }

  async getDriverStats(dispensaryId: string, days = 30): Promise<any> {
    const sql = `SELECT COUNT(*) as total_trips,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      ROUND(AVG(actual_minutes) FILTER (WHERE status = 'completed'), 1) as avg_delivery_minutes,
      ROUND(AVG(distance_miles) FILTER (WHERE status = 'completed'), 1) as avg_distance,
      ROUND(AVG(customer_rating) FILTER (WHERE customer_rating IS NOT NULL), 1) as avg_rating,
      COUNT(*) FILTER (WHERE customer_rating >= 4) as positive_ratings,
      ROUND(SUM(distance_miles) FILTER (WHERE status = 'completed'), 1) as total_miles
     FROM delivery_trips WHERE dispensary_id = $1 AND created_at >= NOW() - INTERVAL '1 day' * $2`;
    const [stats] = await this._q(sql, [dispensaryId, days]);
    return {
      totalTrips: parseInt(stats.total_trips),
      completed: parseInt(stats.completed),
      avgDeliveryMinutes: parseFloat(stats.avg_delivery_minutes) || 0,
      avgDistance: parseFloat(stats.avg_distance) || 0,
      avgRating: parseFloat(stats.avg_rating) || 0,
      positiveRatings: parseInt(stats.positive_ratings),
      totalMiles: parseFloat(stats.total_miles) || 0,
    };
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }

  private _makeRepo(table: string) {
    const q = this._q.bind(this);
    return {
      async find(opts?: any): Promise<any[]> {
        let s = 'SELECT * FROM ' + table; const p: any[] = []; let i = 1;
        if (opts?.where) { const cd: string[] = []; for (const [k,v] of Object.entries(opts.where)) { if (v !== undefined) { cd.push(k+' = $'+i++); p.push(v); } } if (cd.length) s += ' WHERE ' + cd.join(' AND '); }
        if (opts?.order) { const sr = Object.entries(opts.order).map(([k,d]) => k+' '+d); if (sr.length) s += ' ORDER BY ' + sr.join(', '); }
        if (opts?.take) { s += ' LIMIT $'+i++; p.push(opts.take); }
        return q(s, p.length ? p : undefined);
      },
      async findOne(opts?: any): Promise<any> { const rows = await this.find({...opts, take: 1}); return rows[0] ?? null; },
      async findOneOrFail(opts?: any): Promise<any> { const r = await this.findOne(opts); if (!r) throw new Error('Entity not found'); return r; },
      create(data: any): any { return {...data}; },
      async save(entity: any): Promise<any> {
        const cols = Object.keys(entity).filter(k => entity[k] !== undefined);
        const vals = cols.map(k => entity[k]);
        const ph = cols.map((_,i) => '$'+(i+1));
        const [row] = await q('INSERT INTO '+table+' ('+cols.join(',')+') VALUES ('+ph.join(',')+') ON CONFLICT DO NOTHING RETURNING *', vals);
        return row ?? entity;
      },
      async update(criteria: any, values: any): Promise<any> {
        const sets: string[] = []; const p: any[] = []; let i = 1;
        for (const [k,v] of Object.entries(values)) { if (v !== undefined) { sets.push(k+' = $'+i++); p.push(v); } }
        if (!sets.length) return {affected:0};
        const cd: string[] = [];
        if (typeof criteria === 'string' || typeof criteria === 'number') { cd.push('id = $'+i++); p.push(criteria); }
        else { for (const [k,v] of Object.entries(criteria)) { cd.push(k+' = $'+i++); p.push(v); } }
        await q('UPDATE '+table+' SET '+sets.join(',')+' WHERE '+cd.join(' AND '), p);
        return {affected:1};
      },
      async delete(criteria: any): Promise<any> {
        const cd: string[] = []; const p: any[] = []; let i = 1;
        for (const [k,v] of Object.entries(criteria)) { cd.push(k+' = $'+i++); p.push(v); }
        await q('DELETE FROM '+table+(cd.length ? ' WHERE '+cd.join(' AND ') : ''), p);
        return {affected:1};
      },
      async count(opts?: any): Promise<number> {
        let s = 'SELECT COUNT(*)::int as count FROM '+table; const p: any[] = []; let i = 1;
        if (opts?.where) { const cd: string[] = []; for (const [k,v] of Object.entries(opts.where)) { if (v !== undefined) { cd.push(k+' = $'+i++); p.push(v); } } if (cd.length) s += ' WHERE ' + cd.join(' AND '); }
        const [r] = await q(s, p.length ? p : undefined); return r?.count ?? 0;
      },
      async remove(entity: any): Promise<void> { const keys = Object.keys(entity); await q('DELETE FROM '+table+' WHERE '+keys[0]+' = $1', [entity[keys[0]]]); },
      createQueryBuilder(alias: string) {
        let s = 'SELECT '+alias+'.* FROM '+table+' '+alias;
        const wheres: string[] = []; const p: any[] = []; let i = 1;
        const obs: string[] = []; let lim: number|undefined;
        return {
          where(cond: string, params?: any) { let c2=cond; if (params) for (const [k,v] of Object.entries(params)) { c2=c2.replace(':'+k,'$'+i++); p.push(v); } wheres.push(c2); return this; },
          andWhere(cond: string, params?: any) { return this.where(cond, params); },
          orderBy(col: string, dir: string) { obs.push(col+' '+dir); return this; },
          addOrderBy(col: string, dir: string) { obs.push(col+' '+dir); return this; },
          take(n: number) { lim=n; return this; },
          async getMany() { let full=s; if (wheres.length) full+=' WHERE '+wheres.join(' AND '); if (obs.length) full+=' ORDER BY '+obs.join(', '); if (lim) { full+=' LIMIT $'+i++; p.push(lim); } return q(full, p.length?p:undefined); },
        };
      },
    };
  }
}
