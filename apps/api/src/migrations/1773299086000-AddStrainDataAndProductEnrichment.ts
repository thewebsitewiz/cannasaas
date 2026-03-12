import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStrainDataAndProductEnrichment1741761600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create strain_data table
    await queryRunner.query(`
      CREATE TABLE strain_data (
        strain_data_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ocpc VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20),
        description TEXT,
        effects JSONB DEFAULT '[]',
        flavors JSONB DEFAULT '[]',
        terpenes JSONB DEFAULT '[]',
        lineage JSONB DEFAULT '{}',
        genetics VARCHAR(500),
        thc_avg DECIMAL(6,3),
        cbd_avg DECIMAL(6,3),
        photo_url VARCHAR(500),
        source VARCHAR(50) DEFAULT 'otreeba',
        last_synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_strain_data_name ON strain_data(name);
      CREATE INDEX idx_strain_data_type ON strain_data(type);
      CREATE INDEX idx_strain_data_ocpc ON strain_data(ocpc);
    `);

    // Add enrichment columns to products
    await queryRunner.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS strain_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS strain_type VARCHAR(20),
        ADD COLUMN IF NOT EXISTS effects JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS flavors JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS terpenes JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS lineage JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS otreeba_ocpc VARCHAR(50),
        ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;
    `);

    // Update strain_id FK
    await queryRunner.query(`
      ALTER TABLE products
        DROP CONSTRAINT IF EXISTS fk_products_strain,
        ADD CONSTRAINT fk_products_strain
          FOREIGN KEY (strain_id) REFERENCES strain_data(strain_data_id)
          ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_strain;
      ALTER TABLE products
        DROP COLUMN IF EXISTS strain_name,
        DROP COLUMN IF EXISTS strain_type,
        DROP COLUMN IF EXISTS effects,
        DROP COLUMN IF EXISTS flavors,
        DROP COLUMN IF EXISTS terpenes,
        DROP COLUMN IF EXISTS lineage,
        DROP COLUMN IF EXISTS otreeba_ocpc,
        DROP COLUMN IF EXISTS enriched_at;
      DROP TABLE IF EXISTS strain_data;
    `);
  }
}
