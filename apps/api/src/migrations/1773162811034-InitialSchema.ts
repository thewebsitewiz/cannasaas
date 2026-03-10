import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1773162811034 implements MigrationInterface {
    name = 'InitialSchema1773162811034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tokenHash" character varying NOT NULL, "dispensaryId" uuid, "organizationId" uuid, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "isRevoked" boolean NOT NULL DEFAULT false, "revokedAt" TIMESTAMP WITH TIME ZONE, "userAgent" character varying, "ipAddress" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_c25bc63d248ca90e8dcc1d92d06" UNIQUE ("tokenHash"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_610102b60fea1455310ccd299d" ON "refresh_tokens" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c25bc63d248ca90e8dcc1d92d0" ON "refresh_tokens" ("tokenHash") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_c25bc63d248ca90e8dcc1d92d0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_610102b60fea1455310ccd299d"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }

}
