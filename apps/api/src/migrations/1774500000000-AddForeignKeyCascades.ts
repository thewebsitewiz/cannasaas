import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForeignKeyCascades1774500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop and recreate FKs with CASCADE for parent->child relationships
    // companies -> organizations
    await queryRunner.query(`ALTER TABLE companies DROP CONSTRAINT IF EXISTS fk_companies_organization`);
    await queryRunner.query(`ALTER TABLE companies ADD CONSTRAINT fk_companies_organization FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE`);

    // dispensaries -> companies
    await queryRunner.query(`ALTER TABLE dispensaries DROP CONSTRAINT IF EXISTS fk_dispensaries_company`);
    await queryRunner.query(`ALTER TABLE dispensaries ADD CONSTRAINT fk_dispensaries_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE`);

    // products -> dispensaries
    await queryRunner.query(`ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_dispensary`);
    await queryRunner.query(`ALTER TABLE products ADD CONSTRAINT fk_products_dispensary FOREIGN KEY (dispensary_id) REFERENCES dispensaries(dispensary_id) ON DELETE CASCADE`);

    // orders -> dispensaries
    await queryRunner.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_dispensary`);
    await queryRunner.query(`ALTER TABLE orders ADD CONSTRAINT fk_orders_dispensary FOREIGN KEY (dispensary_id) REFERENCES dispensaries(dispensary_id) ON DELETE RESTRICT`);

    // order_line_items -> orders
    await queryRunner.query(`ALTER TABLE order_line_items DROP CONSTRAINT IF EXISTS fk_order_items_order`);
    await queryRunner.query(`ALTER TABLE order_line_items ADD CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE`);

    // payments -> orders
    await queryRunner.query(`ALTER TABLE payments DROP CONSTRAINT IF EXISTS fk_payments_order`);
    await queryRunner.query(`ALTER TABLE payments ADD CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE`);

    // inventory -> dispensaries
    await queryRunner.query(`ALTER TABLE inventory DROP CONSTRAINT IF EXISTS fk_inventory_dispensary`);
    await queryRunner.query(`ALTER TABLE inventory ADD CONSTRAINT fk_inventory_dispensary FOREIGN KEY (dispensary_id) REFERENCES dispensaries(dispensary_id) ON DELETE CASCADE`);

    // product_variants -> products
    await queryRunner.query(`ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS fk_variants_product`);
    await queryRunner.query(`ALTER TABLE product_variants ADD CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE`);

    // product_pricing -> product_variants
    await queryRunner.query(`ALTER TABLE product_pricing DROP CONSTRAINT IF EXISTS fk_pricing_variant`);
    await queryRunner.query(`ALTER TABLE product_pricing ADD CONSTRAINT fk_pricing_variant FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE CASCADE`);

    // customer_profiles -> users
    await queryRunner.query(`ALTER TABLE customer_profiles DROP CONSTRAINT IF EXISTS fk_customer_user`);
    await queryRunner.query(`ALTER TABLE customer_profiles ADD CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE`);

    // customer_addresses -> customer_profiles
    await queryRunner.query(`ALTER TABLE customer_addresses DROP CONSTRAINT IF EXISTS fk_address_customer`);
    await queryRunner.query(`ALTER TABLE customer_addresses ADD CONSTRAINT fk_address_customer FOREIGN KEY (customer_id) REFERENCES customer_profiles(profile_id) ON DELETE CASCADE`);

    // employee_profiles -> users
    await queryRunner.query(`ALTER TABLE employee_profiles DROP CONSTRAINT IF EXISTS fk_employee_user`);
    await queryRunner.query(`ALTER TABLE employee_profiles ADD CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE`);

    // refresh_tokens -> users
    await queryRunner.query(`ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS fk_refresh_user`);
    await queryRunner.query(`ALTER TABLE refresh_tokens ADD CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE`);

    // users -> organizations
    await queryRunner.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_organization`);
    await queryRunner.query(`ALTER TABLE users ADD CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE`);

    // Add NOT NULL constraints on critical FK columns
    await queryRunner.query(`ALTER TABLE companies ALTER COLUMN organization_id SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE dispensaries ALTER COLUMN company_id SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE products ALTER COLUMN dispensary_id SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE orders ALTER COLUMN dispensary_id SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE inventory ALTER COLUMN dispensary_id SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE inventory ALTER COLUMN variant_id SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE order_line_items ALTER COLUMN order_id SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE payments ALTER COLUMN order_id SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert NOT NULL constraints
    await queryRunner.query(`ALTER TABLE payments ALTER COLUMN order_id DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE order_line_items ALTER COLUMN order_id DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE inventory ALTER COLUMN variant_id DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE inventory ALTER COLUMN dispensary_id DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE orders ALTER COLUMN dispensary_id DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE products ALTER COLUMN dispensary_id DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE dispensaries ALTER COLUMN company_id DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE companies ALTER COLUMN organization_id DROP NOT NULL`);

    // Revert to original constraints without CASCADE
    const fks = [
      'fk_companies_organization', 'fk_dispensaries_company', 'fk_products_dispensary',
      'fk_orders_dispensary', 'fk_order_items_order', 'fk_payments_order',
      'fk_inventory_dispensary', 'fk_variants_product', 'fk_pricing_variant',
      'fk_customer_user', 'fk_address_customer', 'fk_employee_user',
      'fk_refresh_user', 'fk_users_organization'
    ];
    for (const fk of fks) {
      const table = fk.replace('fk_', '').split('_')[0] + 's';
      await queryRunner.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${fk}`);
    }
  }
}
