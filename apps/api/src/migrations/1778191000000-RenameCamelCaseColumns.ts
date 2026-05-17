import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renames every camelCase column in the schema to snake_case so the codebase
 * can adopt a single naming convention. Postgres `RENAME COLUMN` automatically
 * updates references in indexes, foreign keys, and views — no need to drop
 * and recreate them.
 *
 * Tables touched:
 *   - users
 *   - orders
 *   - order_line_items
 *   - payments
 *   - refresh_tokens
 *
 * Tables that were already snake_case (companies, dispensaries, organizations,
 * products, product_variants, product_pricing, inventory, customer_profiles,
 * customer_addresses, employee_profiles, etc.) are unchanged.
 */
const RENAMES: ReadonlyArray<
  readonly [string, ReadonlyArray<readonly [string, string]>]
> = [
  [
    'users',
    [
      ['passwordHash', 'password_hash'],
      ['organizationId', 'organization_id'],
      ['dispensaryId', 'dispensary_id'],
      ['firstName', 'first_name'],
      ['lastName', 'last_name'],
      ['isActive', 'is_active'],
      ['emailVerified', 'email_verified'],
      ['lastLoginAt', 'last_login_at'],
      ['passwordChangedAt', 'password_changed_at'],
      ['createdAt', 'created_at'],
      ['updatedAt', 'updated_at'],
    ],
  ],
  [
    'orders',
    [
      ['orderId', 'order_id'],
      ['dispensaryId', 'dispensary_id'],
      ['customerUserId', 'customer_user_id'],
      ['staffUserId', 'staff_user_id'],
      ['orderType', 'order_type'],
      ['orderStatus', 'order_status'],
      ['discountTotal', 'discount_total'],
      ['taxTotal', 'tax_total'],
      ['taxBreakdown', 'tax_breakdown'],
      ['appliedPromotions', 'applied_promotions'],
      ['metrcReceiptId', 'metrc_receipt_id'],
      ['metrcReportedAt', 'metrc_reported_at'],
      ['metrcSyncStatus', 'metrc_sync_status'],
      ['fulfillmentAddress', 'fulfillment_address'],
      ['scheduledPickupAt', 'scheduled_pickup_at'],
      ['cancellationReason', 'cancellation_reason'],
      ['cancelledAt', 'cancelled_at'],
      ['createdAt', 'created_at'],
      ['updatedAt', 'updated_at'],
    ],
  ],
  [
    'order_line_items',
    [
      ['lineItemId', 'line_item_id'],
      ['orderId', 'order_id'],
      ['productId', 'product_id'],
      ['variantId', 'variant_id'],
      ['batchId', 'batch_id'],
      ['unitPrice', 'unit_price'],
      ['discountApplied', 'discount_applied'],
      ['taxApplied', 'tax_applied'],
      ['metrcPackageLabel', 'metrc_package_label'],
      ['metrcItemUid', 'metrc_item_uid'],
      ['thcMgPerUnit', 'thc_mg_per_unit'],
      ['cbdMgPerUnit', 'cbd_mg_per_unit'],
      ['createdAt', 'created_at'],
    ],
  ],
  [
    'payments',
    [
      ['paymentId', 'payment_id'],
      ['orderId', 'order_id'],
      ['dispensaryId', 'dispensary_id'],
      ['stripePaymentIntentId', 'stripe_payment_intent_id'],
      ['stripeChargeId', 'stripe_charge_id'],
      ['terminalId', 'terminal_id'],
      ['cashTendered', 'cash_tendered'],
      ['changeGiven', 'change_given'],
      ['createdAt', 'created_at'],
      ['updatedAt', 'updated_at'],
    ],
  ],
  [
    'refresh_tokens',
    [
      ['userId', 'user_id'],
      ['tokenHash', 'token_hash'],
      ['dispensaryId', 'dispensary_id'],
      ['organizationId', 'organization_id'],
      ['expiresAt', 'expires_at'],
      ['isRevoked', 'is_revoked'],
      ['revokedAt', 'revoked_at'],
      ['userAgent', 'user_agent'],
      ['ipAddress', 'ip_address'],
      ['createdAt', 'created_at'],
    ],
  ],
];

export class RenameCamelCaseColumns1778191000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [table, renames] of RENAMES) {
      for (const [from, to] of renames) {
        const exists = await queryRunner.query(
          `SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
          [table, from],
        );
        if (exists.length > 0) {
          await queryRunner.query(
            `ALTER TABLE ${table} RENAME COLUMN "${from}" TO ${to}`,
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (let i = RENAMES.length - 1; i >= 0; i -= 1) {
      const entry = RENAMES[i];
      if (!entry) continue;
      const [table, renames] = entry;
      for (let j = renames.length - 1; j >= 0; j -= 1) {
        const pair = renames[j];
        if (!pair) continue;
        const [from, to] = pair;
        const exists = await queryRunner.query(
          `SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
          [table, to],
        );
        if (exists.length > 0) {
          await queryRunner.query(
            `ALTER TABLE ${table} RENAME COLUMN ${to} TO "${from}"`,
          );
        }
      }
    }
  }
}
