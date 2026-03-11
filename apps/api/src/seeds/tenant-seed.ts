import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env['DATABASE_URL'],
  entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    const [org] = await qr.query(`
      INSERT INTO organizations (organization_id, name, slug, billing_email, subscription_tier, subscription_status)
      VALUES (gen_random_uuid(), 'Green Leaf Holdings', 'green-leaf-holdings', 'billing@greenleaf.com', 'professional', 'active')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING organization_id
    `);
    const orgId = org.organization_id;
    console.log('✓ Organization:', orgId);

    const companyResult = await qr.query(`
      INSERT INTO companies (company_id, organization_id, legal_name, dba_name, license_number, license_type, license_state, contact_email, address_line1, city, state, zip)
      VALUES (gen_random_uuid(), $1, 'Green Leaf Cannabis LLC', 'Green Leaf', 'NY-MED-123456', 'Adult-Use Retail', 'NY', 'ops@greenleaf.com', '123 Main St', 'Nyack', 'NY', '10960')
      ON CONFLICT DO NOTHING
      RETURNING company_id
    `, [orgId]);
    const companyId = companyResult[0]?.company_id ?? (await qr.query(`SELECT company_id FROM companies WHERE organization_id = $1 LIMIT 1`, [orgId]))[0].company_id;
    console.log('✓ Company:', companyId);

    const dispResult = await qr.query(`
      INSERT INTO dispensaries (entity_id, company_id, type, name, slug, license_number, license_type, address_line1, city, state, zip, county, phone, email, is_active, is_pickup_enabled, metrc_license_number, timezone)
      VALUES (gen_random_uuid(), $1, 'dispensary', 'Green Leaf Nyack', 'green-leaf-nyack', 'NY-MED-123456', 'Adult-Use Retail', '123 Main St', 'Nyack', 'NY', '10960', 'Rockland', '845-555-0100', 'nyack@greenleaf.com', true, true, 'NY-MED-123456', 'America/New_York')
      ON CONFLICT DO NOTHING
      RETURNING entity_id
    `, [companyId]);
    const dispensaryId = dispResult[0]?.entity_id ?? (await qr.query(`SELECT entity_id FROM dispensaries WHERE slug = $1 LIMIT 1`, ['green-leaf-nyack']))[0].entity_id;
    console.log('✓ Dispensary:', dispensaryId);

    const passwordHash = await bcrypt.hash('Admin1234!', 12);
    await qr.query(`
      INSERT INTO users (id, email, "passwordHash", role, "firstName", "lastName", "isActive", "emailVerified", "dispensaryId", "organizationId")
      VALUES (gen_random_uuid(), 'admin@greenleaf.com', $1, 'dispensary_admin', 'Admin', 'User', true, true, $2, $3)
      ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "dispensaryId" = EXCLUDED."dispensaryId", "organizationId" = EXCLUDED."organizationId"
    `, [passwordHash, dispensaryId, orgId]);
    console.log('✓ Admin user: admin@greenleaf.com / Admin1234!');

    const products = [
      { name: 'Blue Dream', type_code: 'FLOWER', cat_code: 'FLOWER_HYBRID', thc: 22.5, cbd: 0.3, price: 29.99, desc: 'A classic sativa-dominant hybrid with sweet berry aroma.' },
      { name: 'OG Kush Pre-Roll', type_code: 'PRE_ROLL', cat_code: 'PREROLL_SINGLE', thc: 24.0, cbd: 0.1, price: 12.99, desc: 'Premium OG Kush ground flower in a 1g pre-roll.' },
      { name: 'Strawberry Cough Vape', type_code: 'VAPE', cat_code: 'VAPE_510', thc: 85.0, cbd: 0.5, price: 49.99, desc: 'Live resin 510 cartridge with sweet strawberry terpenes.' },
      { name: 'Mango Gummies', type_code: 'EDIBLE', cat_code: 'EDIBLE_GUMMY', thc: 5.0, cbd: 0.0, price: 24.99, desc: '10-pack mango flavored gummies, 5mg THC each.' },
      { name: 'Wedding Cake', type_code: 'FLOWER', cat_code: 'FLOWER_INDICA', thc: 25.0, cbd: 0.2, price: 39.99, desc: 'Rich and tangy with earthy pepper notes.' },
    ];

    for (const p of products) {
      const typeRows = await qr.query(`SELECT product_type_id FROM lkp_product_types WHERE code = $1`, [p.type_code]);
      const catRows = await qr.query(`SELECT category_id FROM lkp_product_categories WHERE code = $1`, [p.cat_code]);
      const sku = 'GLN-' + crypto.randomBytes(3).toString('hex').toUpperCase();

      const prodResult = await qr.query(`
        INSERT INTO products (id, dispensary_id, product_type_id, primary_category_id, name, description, thc_percent, cbd_percent, is_active, is_approved, sku)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, true, $8)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [dispensaryId, typeRows[0]?.product_type_id, catRows[0]?.category_id, p.name, p.desc, p.thc, p.cbd, sku]);

      if (!prodResult[0]) { console.log('  skipped (exists):', p.name); continue; }
      const productId = prodResult[0].id;

      const varResult = await qr.query(`
        INSERT INTO product_variants (variant_id, product_id, dispensary_id, name, is_active, sort_order)
        VALUES (gen_random_uuid(), $1, $2, 'Standard', true, 1)
        ON CONFLICT DO NOTHING
        RETURNING variant_id
      `, [productId, dispensaryId]);

      if (!varResult[0]) continue;

      await qr.query(`
        INSERT INTO product_pricing (pricing_id, variant_id, dispensary_id, price_type, price, effective_from)
        VALUES (gen_random_uuid(), $1, $2, 'retail', $3, NOW())
        ON CONFLICT DO NOTHING
      `, [varResult[0].variant_id, dispensaryId, p.price]);

      console.log(`✓ Product: ${p.name} @ $${p.price}`);
    }

    await qr.commitTransaction();
    console.log('\n✅ Seed complete!');
    console.log(`   Dispensary ID: ${dispensaryId}`);
    console.log(`   Test: products(dispensaryId: "${dispensaryId}")`);

  } catch (err) {
    await qr.rollbackTransaction();
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

seed();
