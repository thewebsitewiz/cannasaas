import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  CustomerProfile,
  CustomerAddress,
  AgeVerification,
} from './entities/customer.entity';
import { KioskCustomerLookup } from './dto/kiosk-customer-lookup.type';

// ── Row Shapes for Raw Queries ─────────────────────────────────────────────
// These mirror SELECT column lists in this file. If you change a query's
// SELECT, update the matching interface. Naming follows the column alias
// (snake_case for cp.* fields, quoted camelCase for u."firstName" etc).

export interface CustomerProfileWithUserRow {
  profile_id: string;
  user_id: string;
  phone: string | null;
  date_of_birth: string | null;
  preferred_dispensary_id: string | null;
  age_verified: boolean;
  age_verified_at: Date | null;
  age_verification_method: string | null;
  id_document_type: string | null;
  id_document_state: string | null;
  id_expiration_date: Date | null;
  marketing_opt_in: boolean;
  sms_opt_in: boolean;
  is_medical_patient: boolean;
  medical_card_number: string | null;
  loyalty_points: number;
  total_orders: number;
  total_spent: string;
  created_at: Date;
  updated_at: Date;
  email: string;
  firstName: string | null;
  lastName: string | null;
  ageVerified: boolean;
  registered_at?: Date;
}

export interface OrderHistoryRow {
  orderId: string;
  customerUserId: string;
  dispensaryId: string;
  dispensary_name: string | null;
  orderType: string;
  orderStatus: string;
  subtotal: string;
  total: string;
  item_count: string;
  createdAt: Date;
}

interface CountRow {
  total: string;
}

interface DispensaryStateRow {
  state: string;
}

interface PurchaseLimitRuleRow {
  rule_id: string;
  state: string;
  customer_type: string;
  product_category: string | null;
  max_quantity_grams: string | null;
  period_type: string;
  period_days: number | null;
  description: string | null;
  is_active: boolean;
}

interface PurchaseTotalRow {
  total_grams: string;
}

// ── Service Input Shapes ───────────────────────────────────────────────────

interface CreateCustomerProfileInput {
  phone?: string;
  dateOfBirth?: string;
  preferredDispensaryId?: string;
  marketingOptIn?: boolean;
  smsOptIn?: boolean;
}

interface UpdateProfileInput {
  phone?: string;
  firstName?: string;
  lastName?: string;
  preferredDispensaryId?: string;
  marketingOptIn?: boolean;
  smsOptIn?: boolean;
  isMedicalPatient?: boolean;
  medicalCardNumber?: string;
}

interface AddressInput {
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  deliveryInstructions?: string;
}

interface VerifyAgeInput {
  dateOfBirth: string;
  idType: string;
  idState?: string;
  idNumberLast4?: string;
  idExpiration?: string;
  dispensaryId?: string;
  method?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    @InjectRepository(CustomerProfile)
    private profileRepo: Repository<CustomerProfile>,
    @InjectRepository(CustomerAddress)
    private addressRepo: Repository<CustomerAddress>,
    @InjectRepository(AgeVerification)
    private verificationRepo: Repository<AgeVerification>,
    @InjectDataSource() private ds: DataSource,
  ) {}

  // ── Registration Enhancement ──────────────────────────────────────────────

  async createCustomerProfile(
    userId: string,
    input: CreateCustomerProfileInput,
  ): Promise<CustomerProfile> {
    const existing = await this.profileRepo.findOne({
      where: { user_id: userId },
    });
    if (existing)
      throw new ConflictException('Customer profile already exists');

    const profile = this.profileRepo.create({
      user_id: userId,
      phone: input.phone,
      date_of_birth: input.dateOfBirth,
      preferred_dispensary_id: input.preferredDispensaryId,
      marketing_opt_in: input.marketingOptIn ?? false,
      sms_opt_in: input.smsOptIn ?? false,
    });

    if (input.phone || input.dateOfBirth) {
      await this.ds.query(
        `UPDATE users SET phone = COALESCE($1, phone), "dateOfBirth" = COALESCE($2::DATE, "dateOfBirth"), "updatedAt" = NOW() WHERE id = $3`,
        [input.phone, input.dateOfBirth, userId],
      );
    }

    return this.profileRepo.save(profile);
  }

  async getProfile(userId: string): Promise<CustomerProfileWithUserRow | null> {
    const rows = await this.ds.query<CustomerProfileWithUserRow[]>(
      `SELECT cp.*, u.email, u."firstName", u."lastName", u."ageVerified"
       FROM customer_profiles cp JOIN users u ON u.id = cp.user_id WHERE cp.user_id = $1`,
      [userId],
    );
    return rows[0] ?? null;
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<CustomerProfile> {
    const profile = await this.profileRepo.findOne({
      where: { user_id: userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    if (input.phone !== undefined) profile.phone = input.phone;
    if (input.preferredDispensaryId !== undefined)
      profile.preferred_dispensary_id = input.preferredDispensaryId;
    if (input.marketingOptIn !== undefined)
      profile.marketing_opt_in = input.marketingOptIn;
    if (input.smsOptIn !== undefined) profile.sms_opt_in = input.smsOptIn;
    if (input.isMedicalPatient !== undefined)
      profile.is_medical_patient = input.isMedicalPatient;
    if (input.medicalCardNumber !== undefined)
      profile.medical_card_number = input.medicalCardNumber;

    if (input.firstName || input.lastName || input.phone) {
      await this.ds.query(
        `UPDATE users SET "firstName" = COALESCE($1, "firstName"), "lastName" = COALESCE($2, "lastName"), phone = COALESCE($3, phone), "updatedAt" = NOW() WHERE id = $4`,
        [input.firstName, input.lastName, input.phone, userId],
      );
    }

    return this.profileRepo.save(profile);
  }

  // ── Age Verification ──────────────────────────────────────────────────────

  async verifyAge(
    userId: string,
    input: VerifyAgeInput,
  ): Promise<{ verified: boolean; age: number; reason?: string }> {
    const dob = new Date(input.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()))
      age--;

    const verified = age >= 21;
    const result = verified ? 'approved' : 'rejected';
    const failureReason = verified ? undefined : `Age ${age} is under 21`;

    await this.verificationRepo.save(
      this.verificationRepo.create({
        user_id: userId,
        dispensary_id: input.dispensaryId,
        method: input.method || 'self_declared',
        id_type: input.idType,
        date_of_birth: input.dateOfBirth,
        calculated_age: age,
        result,
        failure_reason: failureReason,
      }),
    );

    if (verified) {
      await this.ds.query(
        `UPDATE customer_profiles SET age_verified = true, age_verified_at = NOW(),
          age_verification_method = $1, id_document_type = $2, date_of_birth = $3,
          id_document_state = $4, id_expiration_date = $5::DATE, updated_at = NOW()
         WHERE user_id = $6`,
        [
          input.method || 'self_declared',
          input.idType,
          input.dateOfBirth,
          input.idState,
          input.idExpiration,
          userId,
        ],
      );
      await this.ds.query(
        `UPDATE users SET "ageVerified" = true, "dateOfBirth" = $1::DATE, "updatedAt" = NOW() WHERE id = $2`,
        [input.dateOfBirth, userId],
      );
      this.logger.log(
        `Age verified: user=${userId} age=${age} method=${input.method || 'self_declared'}`,
      );
    } else {
      this.logger.warn(`Age verification FAILED: user=${userId} age=${age}`);
    }

    return { verified, age, reason: failureReason };
  }

  async getVerificationHistory(userId: string): Promise<AgeVerification[]> {
    return this.verificationRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  // ── Addresses ─────────────────────────────────────────────────────────────

  async getAddresses(userId: string): Promise<CustomerAddress[]> {
    return this.addressRepo.find({
      where: { user_id: userId },
      order: { is_default: 'DESC', created_at: 'ASC' },
    });
  }

  async addAddress(
    userId: string,
    input: AddressInput,
  ): Promise<CustomerAddress> {
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

    const count = await this.addressRepo.count({ where: { user_id: userId } });
    if (count === 0) addr.is_default = true;

    return this.addressRepo.save(addr);
  }

  async updateAddress(
    addressId: string,
    userId: string,
    input: AddressInput,
  ): Promise<CustomerAddress> {
    const addr = await this.addressRepo.findOne({
      where: { addressId, user_id: userId },
    });
    if (!addr) throw new NotFoundException('Address not found');

    if (input.isDefault) {
      await this.addressRepo.update({ user_id: userId }, { is_default: false });
    }

    Object.assign(addr, {
      ...(input.label !== undefined && { label: input.label }),
      ...(input.addressLine1 !== undefined && {
        address_line1: input.addressLine1,
      }),
      ...(input.addressLine2 !== undefined && {
        address_line2: input.addressLine2,
      }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.state !== undefined && { state: input.state }),
      ...(input.zip !== undefined && { zip: input.zip }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
      ...(input.isDefault !== undefined && { is_default: input.isDefault }),
      ...(input.deliveryInstructions !== undefined && {
        delivery_instructions: input.deliveryInstructions,
      }),
    });

    return this.addressRepo.save(addr);
  }

  async deleteAddress(addressId: string, userId: string): Promise<boolean> {
    const result = await this.addressRepo.delete({
      addressId,
      user_id: userId,
    });
    return (result.affected ?? 0) > 0;
  }

  // ── Order History ─────────────────────────────────────────────────────────

  async getOrderHistory(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ orders: OrderHistoryRow[]; total: number }> {
    const countRows = await this.ds.query<CountRow[]>(
      `SELECT COUNT(*) as total FROM orders WHERE "customerUserId" = $1`,
      [userId],
    );

    const orders = await this.ds.query<OrderHistoryRow[]>(
      `SELECT o.*, d.name as dispensary_name,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o."orderId") as item_count
       FROM orders o
       LEFT JOIN dispensaries d ON d.entity_id = o."dispensaryId"
       WHERE o."customerUserId" = $1
       ORDER BY o."createdAt" DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );

    return { orders, total: parseInt(countRows[0]?.total ?? '0', 10) };
  }

  // ── Purchase Limit Check ──────────────────────────────────────────────────

  async checkPurchaseLimit(
    userId: string,
    dispensaryId: string,
    productCategory: string,
    quantityGrams: number,
  ): Promise<{
    allowed: boolean;
    limit?: number;
    remaining?: number;
    reason?: string;
  }> {
    const dispRows = await this.ds.query<DispensaryStateRow[]>(
      `SELECT state FROM dispensaries WHERE entity_id = $1`,
      [dispensaryId],
    );
    const disp = dispRows[0];
    if (!disp) return { allowed: false, reason: 'Dispensary not found' };

    const profile = await this.profileRepo.findOne({
      where: { user_id: userId },
    });
    const customerType = profile?.is_medical_patient ? 'medical' : 'adult_use';

    const rules = await this.ds.query<PurchaseLimitRuleRow[]>(
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
          return {
            allowed: false,
            limit: maxGrams,
            remaining: maxGrams,
            reason: rule.description ?? undefined,
          };
        }
      } else if (rule.period_days) {
        const purchasedRows = await this.ds.query<PurchaseTotalRow[]>(
          `SELECT COALESCE(SUM(oi.quantity * COALESCE(pv.weight_grams, 3.5)), 0) as total_grams
           FROM orders o JOIN order_items oi ON oi.order_id = o."orderId"
           LEFT JOIN product_variants pv ON pv.variant_id = oi.variant_id
           WHERE o."customerUserId" = $1 AND o."dispensaryId" = $2
             AND o."orderStatus" NOT IN ('cancelled')
             AND o."createdAt" >= NOW() - INTERVAL '1 day' * $3`,
          [userId, dispensaryId, rule.period_days],
        );

        const totalGrams =
          parseFloat(purchasedRows[0]?.total_grams ?? '0') || 0;
        const remaining = maxGrams - totalGrams;

        if (totalGrams + quantityGrams > maxGrams) {
          return {
            allowed: false,
            limit: maxGrams,
            remaining: Math.max(0, remaining),
            reason: rule.description ?? undefined,
          };
        }
      }
    }

    return { allowed: true };
  }

  // ── Admin: Customer List ──────────────────────────────────────────────────

  async getCustomers(
    dispensaryId: string,
    limit = 50,
    offset = 0,
  ): Promise<CustomerProfileWithUserRow[]> {
    return this.ds.query<CustomerProfileWithUserRow[]>(
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

  /**
   * Look up a customer by 10-digit phone, scoped to a dispensary.
   *
   * Phone matching is digit-normalized on both sides (regexp_replace strips
   * non-digits in the column), so dirty legacy data like "(555) 123-4567"
   * still matches a normalized "5551234567" input. Tenant scope uses
   * `preferred_dispensary_id` — customers without a preferred dispensary
   * are invisible to kiosk lookup and fall through to the guest flow.
   *
   * Returns null if the phone isn't exactly 10 digits after normalization
   * or no customer is found.
   */
  async findByPhoneForKiosk(
    dispensaryId: string,
    phoneInput: string,
  ): Promise<KioskCustomerLookup | null> {
    const normalized = (phoneInput ?? '').replace(/\D/g, '');
    if (normalized.length !== 10) return null;

    const rows = await this.ds.query<
      Array<{
        customer_id: string;
        first_name: string | null;
        last_name: string | null;
        loyalty_points: number;
      }>
    >(
      `SELECT
         cp.user_id        AS customer_id,
         u.first_name      AS first_name,
         u.last_name       AS last_name,
         cp.loyalty_points AS loyalty_points
       FROM customer_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.preferred_dispensary_id = $1
         AND regexp_replace(COALESCE(cp.phone, ''), '[^0-9]', '', 'g') = $2
       LIMIT 1`,
      [dispensaryId, normalized],
    );

    const row = rows[0];
    if (!row) return null;
    return {
      customerId: row.customer_id,
      firstName: row.first_name ?? undefined,
      lastName: row.last_name ?? undefined,
      loyaltyPoints: Number(row.loyalty_points ?? 0),
    };
  }
}
