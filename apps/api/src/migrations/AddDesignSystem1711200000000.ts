import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDesignSystem1711200000000 implements MigrationInterface {
  name = 'AddDesignSystem1711200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "dispensaries"
        ADD COLUMN "design_system" varchar(50) NOT NULL DEFAULT 'casual',
        ADD COLUMN "design_system_file" varchar(100) NOT NULL DEFAULT 'casual.css'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "dispensaries"
        DROP COLUMN "design_system_file",
        DROP COLUMN "design_system"
    `);
  }
}
