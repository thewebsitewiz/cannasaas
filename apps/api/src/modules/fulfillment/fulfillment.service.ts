import { Inject, Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Inject, DeliveryZone } from './entities/delivery-zone.entity';
import { Inject, DeliveryTimeSlot } from './entities/delivery-time-slot.entity';
import { Inject, OrderTracking } from './entities/order-tracking.entity';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

export interface DeliveryEligibility {
  eligible: boolean;
  zone?: { zoneId: string; name: string; deliveryFee: number; estimatedMinutesMin: number; estimatedMinutesMax: number };
  distance?: number;
  reason?: string;
}

export interface AvailableSlot {
  slotId: string;
  startTime: string;
  endTime: string;
  spotsRemaining: number;
}

const FULFILLMENT_STATUSES = [
  'pending', 'confirmed', 'preparing', 'ready_for_pickup',
  'out_for_delivery', 'delivered', 'picked_up', 'cancelled',
] as const;

@Injectable()
export class FulfillmentService {
  private zoneRepo: any;
  private trackingRepo: any;
  private readonly logger = new Logger(FulfillmentService.name);

  constructor(

    @Inject(DRIZZLE) private db: any
  ) {
    this.zoneRepo = this._makeRepo('delivery_zones');
    this.trackingRepo = this._makeRepo('order_tracking');
  }

  // ── Delivery Zones ────────────────────────────────────────────────────────

  async getZones(dispensaryId: string): Promise<DeliveryZone[]> {
    return this.zoneRepo.find({
      where: { dispensary_id: dispensaryId, is_active: true },
      order: { sort_order: 'ASC', radius_miles: 'ASC' },
    });
  }

  // ── Delivery Eligibility Check ────────────────────────────────────────────

  async checkDeliveryEligibility(
    dispensaryId: string,
    customerLat: number,
    customerLng: number,
    orderSubtotal?: number,
  ): Promise<DeliveryEligibility> {
    // Get dispensary location
    const [dispensary] = await this._q(
      `SELECT latitude, longitude, is_delivery_enabled FROM dispensaries WHERE entity_id = $1`,
      [dispensaryId],
    );

    if (!dispensary) return { eligible: false, reason: 'Dispensary not found' };
    if (!dispensary.is_delivery_enabled) return { eligible: false, reason: 'Delivery not available at this location' };
    if (!dispensary.latitude || !dispensary.longitude) return { eligible: false, reason: 'Dispensary location not configured' };

    // Calculate distance
    const [{ distance }] = await this._q(
      `SELECT haversine_miles($1, $2, $3, $4) as distance`,
      [dispensary.latitude, dispensary.longitude, customerLat, customerLng],
    );

    const distanceMiles = parseFloat(distance);

    // Find matching zone (smallest radius that covers the distance)
    const zones = await this._q(
      `SELECT zone_id, name, radius_miles, delivery_fee, min_order_amount,
              free_delivery_threshold, estimated_minutes_min, estimated_minutes_max
       FROM delivery_zones
       WHERE dispensary_id = $1 AND is_active = true AND radius_miles >= $2
       ORDER BY radius_miles ASC LIMIT 1`,
      [dispensaryId, distanceMiles],
    );

    if (zones.length === 0) {
      return { eligible: false, distance: distanceMiles, reason: `Address is ${distanceMiles.toFixed(1)} miles away, beyond delivery range` };
    }

    const zone = zones[0];

    // Check minimum order
    if (orderSubtotal !== undefined && zone.min_order_amount && orderSubtotal < parseFloat(zone.min_order_amount)) {
      return {
        eligible: false,
        distance: distanceMiles,
        reason: `Minimum order of $${parseFloat(zone.min_order_amount).toFixed(2)} required for delivery to this area`,
      };
    }

    // Calculate fee (waive if above threshold)
    let fee = parseFloat(zone.delivery_fee);
    if (zone.free_delivery_threshold && orderSubtotal && orderSubtotal >= parseFloat(zone.free_delivery_threshold)) {
      fee = 0;
    }

    return {
      eligible: true,
      distance: distanceMiles,
      zone: {
        zoneId: zone.zone_id,
        name: zone.name,
        deliveryFee: fee,
        estimatedMinutesMin: zone.estimated_minutes_min,
        estimatedMinutesMax: zone.estimated_minutes_max,
      },
    };
  }

  // ── Time Slots ────────────────────────────────────────────────────────────

  async getAvailableSlots(
    dispensaryId: string,
    slotType: 'delivery' | 'pickup',
    date: string, // YYYY-MM-DD
  ): Promise<AvailableSlot[]> {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Get slots for this day
    const slots = await this._q(
      `SELECT s.slot_id, s.start_time, s.end_time, s.max_orders,
        COALESCE(booked.count, 0) as booked_count
       FROM delivery_time_slots s
       LEFT JOIN (
         SELECT delivery_slot_id, COUNT(*) as count
         FROM orders
         WHERE "dispensaryId" = $1
           AND DATE("scheduledPickupAt") = $4
           AND "orderStatus" NOT IN ('cancelled')
           AND delivery_slot_id IS NOT NULL
         GROUP BY delivery_slot_id
       ) booked ON booked.delivery_slot_id = s.slot_id
       WHERE s.dispensary_id = $1 AND s.slot_type = $2 AND s.day_of_week = $3 AND s.is_active = true
       ORDER BY s.start_time ASC`,
      [dispensaryId, slotType, dayOfWeek, date],
    );

    return slots
      .filter((s: any) => parseInt(s.booked_count, 10) < (s.max_orders ?? 10))
      .map((s: any) => ({
        slotId: s.slot_id,
        startTime: s.start_time,
        endTime: s.end_time,
        spotsRemaining: (s.max_orders ?? 10) - parseInt(s.booked_count, 10),
      }));
  }

  // ── Order Tracking ────────────────────────────────────────────────────────

  async updateFulfillmentStatus(
    orderId: string,
    dispensaryId: string,
    status: string,
    userId: string,
    opts?: { notes?: string; latitude?: number; longitude?: number },
  ): Promise<OrderTracking> {
    // Validate status
    if (!FULFILLMENT_STATUSES.includes(status as any)) {
      throw new BadRequestException(`Invalid status: ${status}. Valid: ${FULFILLMENT_STATUSES.join(', ')}`);
    }

    // Verify order exists
    const [order] = await this._q(
      `SELECT "orderId", fulfillment_status FROM orders WHERE "orderId" = $1 AND "dispensaryId" = $2`,
      [orderId, dispensaryId],
    );
    if (!order) throw new NotFoundException('Order not found');

    // Update order
    const timestampField = this.getTimestampField(status);
    let updateSql = `UPDATE orders SET fulfillment_status = $1, "updatedAt" = NOW()`;
    const params: any[] = [status];
    let paramIdx = 2;

    if (timestampField) {
      updateSql += `, ${timestampField} = NOW()`;
    }

    updateSql += ` WHERE "orderId" = $${paramIdx}`;
    params.push(orderId);

    await this._q(updateSql, params);

    // Create tracking entry
    const tracking = this.trackingRepo.create({
      order_id: orderId,
      status,
      notes: opts?.notes,
      updated_by_user_id: userId,
      latitude: opts?.latitude,
      longitude: opts?.longitude,
    });

    this.logger.log(`Order ${orderId} → ${status} by ${userId}`);
    return this.trackingRepo.save(tracking);
  }

  async getOrderTracking(orderId: string): Promise<OrderTracking[]> {
    return this.trackingRepo.find({
      where: { order_id: orderId },
      order: { created_at: 'ASC' },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private getTimestampField(status: string): string | null {
    const map: Record<string, string> = {
      ready_for_pickup: 'actual_ready_at',
      out_for_delivery: 'dispatched_at',
      delivered: 'delivered_at',
      picked_up: 'delivered_at',
    };
    return map[status] ?? null;
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
