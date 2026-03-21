import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateThemeConfigs1773667650000 implements MigrationInterface {
  name = 'CreateThemeConfigs1773667650000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'theme_configs',
        columns: [
          { name: 'id',             type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'dispensary_id',  type: 'uuid', isUnique: true },
          { name: 'preset',         type: 'varchar', default: "'casual'" },
          { name: 'primary',        type: 'varchar', length: '7', default: "'#2d6a4f'" },
          { name: 'secondary',      type: 'varchar', length: '7', default: "'#74956c'" },
          { name: 'accent',         type: 'varchar', length: '7', default: "'#c47820'" },
          { name: 'bg_primary',     type: 'varchar', length: '7', default: "'#faf6f0'" },
          { name: 'bg_secondary',   type: 'varchar', length: '7', default: "'#f0ebe3'" },
          { name: 'bg_card',        type: 'varchar', length: '7', default: "'#ffffff'" },
          { name: 'text_primary',   type: 'varchar', length: '7', default: "'#2c2418'" },
          { name: 'text_secondary', type: 'varchar', length: '7', default: "'#6b5e4f'" },
          { name: 'sidebar_bg',     type: 'varchar', length: '7', default: "'#1b3a2a'" },
          { name: 'sidebar_text',   type: 'varchar', length: '7', default: "'#c8d8c4'" },
          { name: 'color_success',  type: 'varchar', length: '7', default: "'#27ae60'" },
          { name: 'color_warning',  type: 'varchar', length: '7', default: "'#d97706'" },
          { name: 'color_error',    type: 'varchar', length: '7', default: "'#c0392b'" },
          { name: 'color_info',     type: 'varchar', length: '7', default: "'#2e86ab'" },
          { name: 'is_dark',        type: 'boolean', default: false },
          { name: 'created_at',     type: 'timestamptz', default: 'NOW()' },
          { name: 'updated_at',     type: 'timestamptz', default: 'NOW()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'theme_configs',
      new TableIndex({ name: 'IDX_theme_configs_dispensary', columnNames: ['dispensary_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('theme_configs', true);
  }
}
