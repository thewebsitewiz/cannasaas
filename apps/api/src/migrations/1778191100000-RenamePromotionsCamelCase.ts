import { MigrationInterface, QueryRunner } from 'typeorm';

const RENAMES: ReadonlyArray<
  readonly [string, ReadonlyArray<readonly [string, string]>]
> = [
  [
    'promotion_categories',
    [
      ['promoId', 'promo_id'],
      ['categoryId', 'category_id'],
      ['isEligible', 'is_eligible'],
    ],
  ],
  [
    'promotion_products',
    [
      ['promoId', 'promo_id'],
      ['productId', 'product_id'],
      ['variantId', 'variant_id'],
      ['isEligible', 'is_eligible'],
    ],
  ],
  [
    'promotions',
    [
      ['promoId', 'promo_id'],
      ['dispensaryId', 'dispensary_id'],
      ['discountValue', 'discount_value'],
      ['minimumOrderTotal', 'minimum_order_total'],
      ['maxUses', 'max_uses'],
      ['usesCount', 'uses_count'],
      ['maxUsesPerCustomer', 'max_uses_per_customer'],
      ['appliesTo', 'applies_to'],
      ['appliesToProductTypeId', 'applies_to_product_type_id'],
      ['appliesToBrandId', 'applies_to_brand_id'],
      ['appliesToTaxCategoryId', 'applies_to_tax_category_id'],
      ['stackableWithOthers', 'stackable_with_others'],
      ['isStaffDiscount', 'is_staff_discount'],
      ['isMedicalDiscount', 'is_medical_discount'],
      ['startAt', 'start_at'],
      ['endAt', 'end_at'],
      ['isActive', 'is_active'],
      ['createdAt', 'created_at'],
      ['updatedAt', 'updated_at'],
    ],
  ],
];

export class RenamePromotionsCamelCase1778191100000 implements MigrationInterface {
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
