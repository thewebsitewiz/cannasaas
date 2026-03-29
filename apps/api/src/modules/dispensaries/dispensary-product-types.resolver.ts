import { Resolver, Query, Mutation, Args, ID, Int, InputType, ObjectType } from '@nestjs/graphql';
import { Field } from '@nestjs/graphql';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

// ── Types ────────────────────────────────────────────────────

@ObjectType()
export class DispensaryProductType {
  @Field(() => Int) productTypeId!: number;
  @Field() code!: string;
  @Field() name!: string;
  @Field() isEnabled!: boolean;
  @Field(() => Int) sortOrder!: number;
}

@InputType()
export class DispensaryProductTypeInput {
  @Field(() => Int) productTypeId!: number;
  @Field() isEnabled!: boolean;
  @Field(() => Int) sortOrder!: number;
}

// ── Resolver ─────────────────────────────────────────────────

@Resolver()
export class DispensaryProductTypesResolver {
  constructor(@InjectDataSource() private ds: DataSource) {}

  /**
   * Returns all product types with per-dispensary enabled/sort settings.
   * Types not yet in the junction table are returned as enabled with default sort.
   * Public so the storefront can filter its menu by enabled types.
   */
  @Public()
  @Query(() => [DispensaryProductType], { name: 'dispensaryProductTypes' })
  async getDispensaryProductTypes(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<DispensaryProductType[]> {
    const rows = await this.ds.query(
      `SELECT
         pt.product_type_id AS "productTypeId",
         pt.code,
         pt.name,
         COALESCE(dpt.is_enabled, true) AS "isEnabled",
         COALESCE(dpt.sort_order, pt.sort_order) AS "sortOrder"
       FROM lkp_product_types pt
       LEFT JOIN dispensary_product_types dpt
         ON dpt.product_type_id = pt.product_type_id
         AND dpt.dispensary_id = $1
       WHERE pt.is_active = true
       ORDER BY COALESCE(dpt.sort_order, pt.sort_order)`,
      [dispensaryId],
    );
    return rows;
  }

  /**
   * Bulk-save dispensary product type configuration.
   * Upserts all provided types in one transaction.
   */
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => [DispensaryProductType], { name: 'saveDispensaryProductTypes' })
  async saveDispensaryProductTypes(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('types', { type: () => [DispensaryProductTypeInput] }) types: DispensaryProductTypeInput[],
  ): Promise<DispensaryProductType[]> {
    const qr = this.ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      for (const t of types) {
        await qr.query(
          `INSERT INTO dispensary_product_types (dispensary_id, product_type_id, is_enabled, sort_order, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (dispensary_id, product_type_id)
           DO UPDATE SET is_enabled = $3, sort_order = $4, updated_at = NOW()`,
          [dispensaryId, t.productTypeId, t.isEnabled, t.sortOrder],
        );
      }
      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    return this.getDispensaryProductTypes(dispensaryId);
  }
}
