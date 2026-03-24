import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CustomerProfile } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer.entity';
import { AgeVerification } from './entities/customer.entity';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    @InjectRepository(CustomerProfile) private profileRepo: Repository<CustomerProfile>,
    @InjectRepository(CustomerAddress) private addressRepo: Repository<CustomerAddress>,
    @InjectRepository(AgeVerification) private verificationRepo: Repository<AgeVerification>,
    @InjectDataSource() private ds: DataSource,
  ) {}

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
      await this.ds.query(
        `UPDATE users SET phone = COALESCE($1, phone), "dateOfBirth" = COALESCE($2::DATE, "dateOfBirth"), "updatedAt" = NOW() WHERE id = $3`,
        [input.phone, input.dateOfBirth, userId],
      );
    }

    return this.profileRepo.save(profile);
  }

  async getProfile(userId: string): Promise<any> {
    const [result] = await this.ds.query(
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
      await this.ds.query(
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
      await this.ds.query(
        `UPDATE customer_profiles SET age_verified = true, age_verified_at = NOW(),
          age_verification_method = $1, id_document_type = $2, date_of_birth = $3,
          id_document_state = $4, id_expiration_date = $5::DATE, updated_at = NOW()
         WHERE user_id = $6`,
        [input.method || 'self_declared', input.idType, input.dateOfBirth, input.idState, input.idExpiration, userId],
      );
      await this.ds.query(
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
    const [countResult] = await this.ds.query(
      `SELECT COUNT(*) as total FROM orders WHERE "customerUserId" = $1`, [userId],
    );

    const orders = await this.ds.query(
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
    const [disp] = await this.ds.query(
      `SELECT state FROM dispensaries WHERE entity_id = $1`, [dispensaryId],
    );
    if (!disp) return { allowed: false, reason: 'Dispensary not found' };

    const profile = await this.profileRepo.findOne({ where: { user_id: userId } });
    const customerType = profile?.is_medical_patient ? 'medical' : 'adult_use';

    const rules = await this.ds.query(
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
        const [purchased] = await this.ds.query(
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
    return this.ds.query(
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
}
