import { Inject, Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Inject, CustomerProfile } from './entities/customer.entity';
import { Inject, CustomerAddress } from './entities/customer.entity';
import { Inject, AgeVerification } from './entities/customer.entity';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class CustomerService {
  private profileRepo: any;
  private verificationRepo: any;
  private addressRepo: any;
  private readonly logger = new Logger(CustomerService.name);

  constructor(

    @Inject(DRIZZLE) private db: any
  ) {
    this.profileRepo = this._makeRepo('customer_profiles');
    this.verificationRepo = this._makeRepo('age_verifications');
    this.addressRepo = this._makeRepo('customer_addresses');
  }

  // ── Registration Enhancement ──────────────────────────────────────────────

  async createCustomerProfile(userId: string, input: {
    phone?: string; dateOfBirth?: string; preferredDispensaryId?: string;
    marketingOptIn?: boolean; smsOptIn?: boolean;
  }): Promise<CustomerProfile> {
    const existing = await this.profileRepo.findOne({ where: { user_id: userId } });
    if (existing) throw new ConflictException('Customer profile already exists');

    const profile = this.profileRepo.create({
      user_id: userId,
      phone: input.phone,
      date_of_birth: input.dateOfBirth,
      preferred_dispensary_id: input.preferredDispensaryId,
      marketing_opt_in: input.marketingOptIn ?? false,
      sms_opt_in: input.smsOptIn ?? false,
    });

    // Update user phone/dob
    if (input.phone || input.dateOfBirth) {
      await this._q(
        `UPDATE users SET phone = COALESCE($1, phone), "dateOfBirth" = COALESCE($2::DATE, "dateOfBirth"), "updatedAt" = NOW() WHERE id = $3`,
        [input.phone, input.dateOfBirth, userId],
      );
    }

    return this.profileRepo.save(profile);
  }

  async getProfile(userId: string): Promise<any> {
    const [result] = await this._q(
      `SELECT cp.*, u.email, u."firstName", u."lastName", u."ageVerified"
       FROM customer_profiles cp JOIN users u ON u.id = cp.user_id WHERE cp.user_id = $1`,
      [userId],
    );
    if (!result) return null;
    return result;
  }

  async updateProfile(userId: string, input: any): Promise<CustomerProfile> {
    const profile = await this.profileRepo.findOne({ where: { user_id: userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    if (input.phone !== undefined) profile.phone = input.phone;
    if (input.preferredDispensaryId !== undefined) profile.preferred_dispensary_id = input.preferredDispensaryId;
    if (input.marketingOptIn !== undefined) profile.marketing_opt_in = input.marketingOptIn;
    if (input.smsOptIn !== undefined) profile.sms_opt_in = input.smsOptIn;
    if (input.isMedicalPatient !== undefined) profile.is_medical_patient = input.isMedicalPatient;
    if (input.medicalCardNumber !== undefined) profile.medical_card_number = input.medicalCardNumber;

    if (input.firstName || input.lastName || input.phone) {
      await this._q(
        `UPDATE users SET "firstName" = COALESCE($1, "firstName"), "lastName" = COALESCE($2, "lastName"), phone = COALESCE($3, phone), "updatedAt" = NOW() WHERE id = $4`,
        [input.firstName, input.lastName, input.phone, userId],
      );
    }

    return this.profileRepo.save(profile);
  }

  // ── Age Verification ──────────────────────────────────────────────────────

  async verifyAge(userId: string, input: {
    dateOfBirth: string; idType: string; idState?: string;
    idNumberLast4?: string; idExpiration?: string;
    dispensaryId?: string; method?: string;
    ipAddress?: string; userAgent?: string;
  }): Promise<{ verified: boolean; age: number; reason?: string }> {
    const dob = new Date(input.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;

    const verified = age >= 21;
    const result = verified ? 'approved' : 'rejected';
    const failureReason = verified ? undefined : `Age ${age} is under 21`;

    // Log verification attempt
    await this.verificationRepo.save(this.verificationRepo.create({
      user_id: userId,
      dispensary_id: input.dispensaryId,
      method: input.method || 'self_declared',
      id_type: input.idType,
      date_of_birth: input.dateOfBirth,
      calculated_age: age,
      result,
      failure_reason: failureReason,
    }));

    if (verified) {
      // Update profile and user
      await this._q(
        `UPDATE customer_profiles SET age_verified = true, age_verified_at = NOW(),
          age_verification_method = $1, id_document_type = $2, date_of_birth = $3,
          id_document_state = $4, id_expiration_date = $5::DATE, updated_at = NOW()
         WHERE user_id = $6`,
        [input.method || 'self_declared', input.idType, input.dateOfBirth, input.idState, input.idExpiration, userId],
      );
      await this._q(
        `UPDATE users SET "ageVerified" = true, "dateOfBirth" = $1::DATE, "updatedAt" = NOW() WHERE id = $2`,
        [input.dateOfBirth, userId],
      );
      this.logger.log(`Age verified: user=${userId} age=${age} method=${input.method || 'self_declared'}`);
    } else {
      this.logger.warn(`Age verification FAILED: user=${userId} age=${age}`);
    }

    return { verified, age, reason: failureReason };
  }

  async getVerificationHistory(userId: string): Promise<AgeVerification[]> {
    return this.verificationRepo.find({ where: { user_id: userId }, order: { created_at: 'DESC' } });
  }

  // ── Addresses ─────────────────────────────────────────────────────────────

  async getAddresses(userId: string): Promise<CustomerAddress[]> {
    return this.addressRepo.find({ where: { user_id: userId }, order: { is_default: 'DESC', created_at: 'ASC' } });
  }

  async addAddress(userId: string, input: any): Promise<CustomerAddress> {
    // If setting as default, clear other defaults
    if (input.isDefault) {
      await this.addressRepo.update({ user_id: userId }, { is_default: false });
    }

    const addr = this.addressRepo.create({
      user_id: userId,
      label: input.label || 'Home',
      address_line1: input.addressLine1,
      address_line2: input.addressLine2,
      city: input.city,
      state: input.state,
      zip: input.zip,
      latitude: input.latitude,
      longitude: input.longitude,
      is_default: input.isDefault ?? false,
      delivery_instructions: input.deliveryInstructions,
    });

    // If first address, make it default
    const count = await this.addressRepo.count({ where: { user_id: userId } });
    if (count === 0) addr.is_default = true;

    return this.addressRepo.save(addr);
  }

  async updateAddress(addressId: string, userId: string, input: any): Promise<CustomerAddress> {
    const addr = await this.addressRepo.findOne({ where: { addressId, user_id: userId } });
    if (!addr) throw new NotFoundException('Address not found');

    if (input.isDefault) {
      await this.addressRepo.update({ user_id: userId }, { is_default: false });
    }

    Object.assign(addr, {
      ...(input.label !== undefined && { label: input.label }),
      ...(input.addressLine1 !== undefined && { address_line1: input.addressLine1 }),
      ...(input.addressLine2 !== undefined && { address_line2: input.addressLine2 }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.state !== undefined && { state: input.state }),
      ...(input.zip !== undefined && { zip: input.zip }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
      ...(input.isDefault !== undefined && { is_default: input.isDefault }),
      ...(input.deliveryInstructions !== undefined && { delivery_instructions: input.deliveryInstructions }),
    });

    return this.addressRepo.save(addr);
  }

  async deleteAddress(addressId: string, userId: string): Promise<boolean> {
    const result = await this.addressRepo.delete({ addressId, user_id: userId });
    return (result.affected ?? 0) > 0;
  }

  // ── Order History ─────────────────────────────────────────────────────────

  async getOrderHistory(userId: string, limit = 20, offset = 0): Promise<{ orders: any[]; total: number }> {
    const [countResult] = await this._q(
      `SELECT COUNT(*) as total FROM orders WHERE "customerUserId" = $1`, [userId],
    );

    const orders = await this._q(
      `SELECT o.*, d.name as dispensary_name,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o."orderId") as item_count
       FROM orders o
       LEFT JOIN dispensaries d ON d.entity_id = o."dispensaryId"
       WHERE o."customerUserId" = $1
       ORDER BY o."createdAt" DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );

    return { orders, total: parseInt(countResult.total, 10) };
  }

  // ── Purchase Limit Check ──────────────────────────────────────────────────

  async checkPurchaseLimit(userId: string, dispensaryId: string, productCategory: string, quantityGrams: number): Promise<{ allowed: boolean; limit?: number; remaining?: number; reason?: string }> {
    const [disp] = await this._q(
      `SELECT state FROM dispensaries WHERE entity_id = $1`, [dispensaryId],
    );
    if (!disp) return { allowed: false, reason: 'Dispensary not found' };

    const profile = await this.profileRepo.findOne({ where: { user_id: userId } });
    const customerType = profile?.is_medical_patient ? 'medical' : 'adult_use';

    const rules = await this._q(
      `SELECT * FROM purchase_limit_rules
       WHERE state = $1 AND customer_type = $2 AND (product_category = $3 OR product_category IS NULL) AND is_active = true`,
      [disp.state, customerType, productCategory],
    );

    if (rules.length === 0) return { allowed: true };

    for (const rule of rules) {
      if (!rule.max_quantity_grams) continue;

      const maxGrams = parseFloat(rule.max_quantity_grams);

      if (rule.period_type === 'transaction') {
        if (quantityGrams > maxGrams) {
          return { allowed: false, limit: maxGrams, remaining: maxGrams, reason: rule.description };
        }
      } else if (rule.period_days) {
        // Check rolling period
        const [purchased] = await this._q(
          `SELECT COALESCE(SUM(oi.quantity * COALESCE(pv.weight_grams, 3.5)), 0) as total_grams
           FROM orders o JOIN order_items oi ON oi.order_id = o."orderId"
           LEFT JOIN product_variants pv ON pv.variant_id = oi.variant_id
           WHERE o."customerUserId" = $1 AND o."dispensaryId" = $2
             AND o."orderStatus" NOT IN ('cancelled')
             AND o."createdAt" >= NOW() - INTERVAL '1 day' * $3`,
          [userId, dispensaryId, rule.period_days],
        );

        const totalGrams = parseFloat(purchased.total_grams) || 0;
        const remaining = maxGrams - totalGrams;

        if (totalGrams + quantityGrams > maxGrams) {
          return { allowed: false, limit: maxGrams, remaining: Math.max(0, remaining), reason: rule.description };
        }
      }
    }

    return { allowed: true };
  }

  // ── Admin: Customer List ──────────────────────────────────────────────────

  async getCustomers(dispensaryId: string, limit = 50, offset = 0): Promise<any[]> {
    return this._q(
      `SELECT cp.*, u.email, u."firstName", u."lastName", u."ageVerified", u."createdAt" as registered_at
       FROM customer_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.preferred_dispensary_id = $1 OR EXISTS (
         SELECT 1 FROM orders o WHERE o."customerUserId" = cp.user_id AND o."dispensaryId" = $1
       )
       ORDER BY cp.total_spent DESC LIMIT $2 OFFSET $3`,
      [dispensaryId, limit, offset],
    );
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
