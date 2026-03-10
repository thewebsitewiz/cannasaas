import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1773161853363 implements MigrationInterface {
    name = 'InitialSchema1773161853363'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastLoginAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordChangedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "organizationId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "dispensaryId"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "dispensaryId" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "dispensaryId"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "dispensaryId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "organizationId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordChangedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLoginAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerified"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
    }

}
