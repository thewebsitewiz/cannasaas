import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrderLineItems1773237365512 implements MigrationInterface {
    name = 'CreateOrderLineItems1773237365512'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_line_items" ("lineItemId" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "productId" uuid NOT NULL, "variantId" uuid, "batchId" uuid, "quantity" numeric(12,4) NOT NULL, "unitPrice" numeric(10,2) NOT NULL, "discountApplied" numeric(10,2) NOT NULL DEFAULT '0', "taxApplied" numeric(10,2) NOT NULL DEFAULT '0', "metrcPackageLabel" character varying(100), "metrcItemUid" character varying(100), "thcMgPerUnit" numeric(10,4), "cbdMgPerUnit" numeric(10,4), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_32f517dac0325272ab7f7ce51f6" PRIMARY KEY ("lineItemId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_87e26f6441c7787271dcde8305" ON "order_line_items" ("orderId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_87e26f6441c7787271dcde8305"`);
        await queryRunner.query(`DROP TABLE "order_line_items"`);
    }

}
