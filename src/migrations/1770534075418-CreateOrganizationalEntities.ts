import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrganizationalEntities1770534075418 implements MigrationInterface {
    name = 'CreateOrganizationalEntities1770534075418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "subdomain" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_21bb89e012fa5b58532009c1601" UNIQUE ("subdomain"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('super_admin', 'org_admin', 'dispensary_manager', 'budtender', 'customer')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "first_name" character varying(100), "last_name" character varying(100), "role" "public"."users_role_enum" NOT NULL DEFAULT 'customer', "is_active" boolean NOT NULL DEFAULT true, "is_email_verified" boolean NOT NULL DEFAULT false, "email_verification_token" character varying, "password_reset_token" character varying, "password_reset_expires" TIMESTAMP, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "branding_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "logo_url" character varying(500), "logo_dark_url" character varying(500), "favicon_url" character varying(500), "primary_color" character varying(7) NOT NULL DEFAULT '#10b981', "secondary_color" character varying(7) NOT NULL DEFAULT '#3b82f6', "accent_color" character varying(7) NOT NULL DEFAULT '#8b5cf6', "font_family" character varying(100) NOT NULL DEFAULT 'Inter', "custom_css" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3b0649d78b5c16f8a3d1cd18543" UNIQUE ("dispensary_id"), CONSTRAINT "REL_3b0649d78b5c16f8a3d1cd1854" UNIQUE ("dispensary_id"), CONSTRAINT "PK_218a0821821e255d0c72af92cd4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "dispensaries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(100) NOT NULL, "description" text, "street_address" character varying(255) NOT NULL, "city" character varying(100) NOT NULL, "state" character varying(2) NOT NULL, "zip_code" character varying(10) NOT NULL, "location" geography(Point,4326), "latitude" numeric(10,7), "longitude" numeric(10,7), "phone_number" character varying(20), "email" character varying(255), "website" character varying(255), "operating_hours" jsonb, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_92d32ec6d6994580517a67a50ef" UNIQUE ("slug"), CONSTRAINT "PK_9f31589ebc8859f63b38cb482b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(100) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b28b07d25e4324eee577de5496d" UNIQUE ("slug"), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "subdomain" character varying(100) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0660118ba6c48a1781452f75b63" UNIQUE ("subdomain"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_109638590074998bb72a2f2cf08" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branding_configs" ADD CONSTRAINT "FK_3b0649d78b5c16f8a3d1cd18543" FOREIGN KEY ("dispensary_id") REFERENCES "dispensaries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dispensaries" ADD CONSTRAINT "FK_21e35b1fc00894cbc2edc60e435" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "companies" ADD CONSTRAINT "FK_4a99045ca7335fb66fa4a15f8ae" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "FK_4a99045ca7335fb66fa4a15f8ae"`);
        await queryRunner.query(`ALTER TABLE "dispensaries" DROP CONSTRAINT "FK_21e35b1fc00894cbc2edc60e435"`);
        await queryRunner.query(`ALTER TABLE "branding_configs" DROP CONSTRAINT "FK_3b0649d78b5c16f8a3d1cd18543"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_109638590074998bb72a2f2cf08"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TABLE "dispensaries"`);
        await queryRunner.query(`DROP TABLE "branding_configs"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
    }

}
