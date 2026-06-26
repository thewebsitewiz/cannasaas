import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Consolidated schema baseline (sc-745). Replaces every pre-existing
 * schema migration with a single source of truth generated from the
 * current `ALL_ENTITIES` set via `migration:generate`. See the ticket
 * for the multi-week rationale (synchronize:true legacy gap, broken
 * column references, missing CREATE TABLEs).
 *
 * Self-detecting:
 * - Fresh DB → `migrations` table is empty (TypeORM creates it before
 *   running anything) → run the full schema bootstrap below.
 * - Existing env → `migrations` table has prior rows (InitialSchema,
 *   etc.) → no-op. TypeORM records this Baseline as applied via its
 *   normal post-migration insert, so subsequent runs see it as done.
 *
 * Post-baseline migrations (SeedKioskUser, SeedLookupTables) stay in
 * the folder; on existing envs their names are already in the
 * migrations table so TypeORM skips them automatically.
 */
export class Baseline1700000000000 implements MigrationInterface {
  name = 'Baseline1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Self-detect: if any prior migration is recorded, treat as
    // an existing env and skip the schema bootstrap. The
    // migrations table itself exists by now (TypeORM creates it
    // on connect, before invoking any user migration).
    const prior = await queryRunner.query(`SELECT 1 FROM "migrations" LIMIT 1`);
    if (prior.length > 0) {
      return;
    }

    // Extensions needed by the schema. TypeORM auto-creates uuid-ossp
    // on first connect; pg_trgm has to be requested explicitly (used
    // by product search via `similarity()`).
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);

    await queryRunner.query(
      `CREATE TABLE "kiosk_devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "dispensary_id" uuid NOT NULL, "label" character varying NOT NULL, "current_token_id" uuid NOT NULL, "public_key" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c4d72f67c19f337b3614f9b811f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_kiosk_devices_user_id" ON "kiosk_devices" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token_hash" character varying NOT NULL, "dispensary_id" uuid, "organization_id" uuid, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "is_revoked" boolean NOT NULL DEFAULT false, "revoked_at" TIMESTAMP WITH TIME ZONE, "user_agent" character varying, "ip_address" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a7838d2ba25be1342091b6695f1" UNIQUE ("token_hash"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash") `,
    );
    await queryRunner.query(
      `CREATE TABLE "biotrack_credentials" ("credential_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "api_key" character varying NOT NULL, "api_secret" character varying, "state" character varying(10) NOT NULL, "license_number" character varying, "is_active" boolean NOT NULL DEFAULT true, "last_validated_at" TIMESTAMP WITH TIME ZONE, "validation_error" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_260d0db206b24a1222b5741d2b5" PRIMARY KEY ("credential_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_biotrack_credentials_dispensary_id" ON "biotrack_credentials" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "brands" ("brand_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(100), "description" text, "logo_url" character varying(500), "website_url" character varying(500), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_f55d2203577d8ae7b060b205c6d" PRIMARY KEY ("brand_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_brands_organization_id" ON "brands" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations" ("organization_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "slug" character varying(100) NOT NULL, "billing_email" character varying(255), "billing_address" character varying(500), "subscription_tier" character varying(50) NOT NULL DEFAULT 'starter', "subscription_status" character varying(50) NOT NULL DEFAULT 'active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_963693341bd612aa01ddf3a4b68" UNIQUE ("slug"), CONSTRAINT "PK_256856c7ab20081dd27937d43ed" PRIMARY KEY ("organization_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_organizations_slug" ON "organizations" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "companies" ("company_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "legal_name" character varying(255) NOT NULL, "dba_name" character varying(255), "ein" character varying(20), "state_of_incorporation" character varying(50), "license_number" character varying(100), "license_type" character varying(100), "license_state" character varying(2), "license_expiry_date" date, "contact_email" character varying(255), "contact_phone" character varying(20), "address_line1" character varying(255), "city" character varying(100), "state" character varying(2), "zip" character varying(10), "metrc_facility_license" character varying(100), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_8c008cd5c4c0c20cf1e77f68e8d" PRIMARY KEY ("company_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_companies_organization_id" ON "companies" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "metrc_manifests" ("manifest_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transfer_id" uuid, "dispensary_id" uuid NOT NULL, "manifest_number" character varying(50) NOT NULL, "manifest_type" character varying(30) NOT NULL DEFAULT 'transfer', "from_license" character varying(50) NOT NULL, "to_license" character varying(50) NOT NULL, "from_facility_name" character varying(200), "to_facility_name" character varying(200), "driver_name" character varying(100), "vehicle_license_plate" character varying(20), "status" character varying(20) NOT NULL DEFAULT 'draft', "metrc_transfer_id" character varying(100), "total_packages" integer NOT NULL DEFAULT '0', "total_quantity" numeric(10,2) NOT NULL DEFAULT '0', "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5303439bc0dda7a207688f95dcf" PRIMARY KEY ("manifest_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_metrc_manifests_dispensary_id" ON "metrc_manifests" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "metrc_manifest_items" ("item_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "manifest_id" uuid NOT NULL, "variant_id" uuid NOT NULL, "product_name" character varying(255) NOT NULL, "metrc_package_tag" character varying(100), "quantity" numeric(10,2) NOT NULL, "unit_of_measure" character varying(20) NOT NULL DEFAULT 'each', "notes" text, CONSTRAINT "PK_b9afc160847414b02193f1124f3" PRIMARY KEY ("item_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_metrc_manifest_items_manifest_id" ON "metrc_manifest_items" ("manifest_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "waste_destruction_logs" ("log_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "variant_id" uuid, "product_name" character varying(255) NOT NULL, "metrc_package_tag" character varying(100), "quantity" numeric(10,2) NOT NULL, "unit_of_measure" character varying(20) NOT NULL DEFAULT 'grams', "waste_type" character varying(30) NOT NULL DEFAULT 'plant_waste', "destruction_method" character varying(50), "reason" text NOT NULL, "witness1_name" character varying(100) NOT NULL, "witness1_title" character varying(50), "witness2_name" character varying(100), "witness2_title" character varying(50), "destroyed_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "submitted_by_user_id" uuid NOT NULL, "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0f48f46187e327233532d1e6f59" PRIMARY KEY ("log_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_waste_destruction_logs_dispensary_id" ON "waste_destruction_logs" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_log" ("audit_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid, "user_id" uuid, "user_email" character varying(255), "action" character varying(50) NOT NULL, "entity_type" character varying(50) NOT NULL, "entity_id" character varying(100), "changes" jsonb, "old_values" jsonb, "new_values" jsonb, "ip_address" character varying(45), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_90d705dc65e834a7bfc79ea4df0" PRIMARY KEY ("audit_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_log_user_id" ON "audit_log" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "reconciliation_reports" ("report_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "report_date" date NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "total_local_items" integer NOT NULL DEFAULT '0', "total_metrc_items" integer NOT NULL DEFAULT '0', "matched_items" integer NOT NULL DEFAULT '0', "discrepancy_count" integer NOT NULL DEFAULT '0', "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ec7cad283d9419dd8da9004f607" PRIMARY KEY ("report_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "reconciliation_items" ("item_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "report_id" uuid NOT NULL, "product_name" character varying(255), "metrc_package_tag" character varying(100), "local_quantity" integer, "metrc_quantity" integer, "variance" integer, "status" character varying(20) NOT NULL DEFAULT 'matched', CONSTRAINT "PK_16f1b32be31db931ec699a05044" PRIMARY KEY ("item_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_reconciliation_items_report_id" ON "reconciliation_items" ("report_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_profiles" ("profile_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "phone" character varying(20), "date_of_birth" date, "age_verified" boolean NOT NULL DEFAULT false, "age_verified_at" TIMESTAMP WITH TIME ZONE, "age_verification_method" character varying(30), "id_document_type" character varying(30), "is_medical_patient" boolean NOT NULL DEFAULT false, "medical_card_number" character varying(50), "preferred_dispensary_id" uuid, "marketing_opt_in" boolean NOT NULL DEFAULT false, "sms_opt_in" boolean NOT NULL DEFAULT false, "loyalty_points" integer NOT NULL DEFAULT '0', "total_orders" integer NOT NULL DEFAULT '0', "total_spent" numeric(12,2) NOT NULL DEFAULT '0', "last_order_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e7cf9008fb263fb380d236d4c2c" PRIMARY KEY ("profile_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_customer_profiles_user_id" ON "customer_profiles" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_addresses" ("address_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "label" character varying(50) NOT NULL DEFAULT 'Home', "address_line1" character varying(255) NOT NULL, "address_line2" character varying(255), "city" character varying(100) NOT NULL, "state" character varying(5) NOT NULL, "zip" character varying(10) NOT NULL, "latitude" numeric(10,7), "longitude" numeric(10,7), "is_default" boolean NOT NULL DEFAULT false, "delivery_instructions" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a2d77da8e4c521383d48dcd3279" PRIMARY KEY ("address_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customer_addresses_user_id" ON "customer_addresses" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "age_verifications" ("verification_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "dispensary_id" uuid, "method" character varying(30) NOT NULL, "id_type" character varying(30), "date_of_birth" date, "calculated_age" integer, "result" character varying(20) NOT NULL, "failure_reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9b62c0bf0843d71bd1ff3226b69" PRIMARY KEY ("verification_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dispensaries" ("entity_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "type" character varying(50) NOT NULL DEFAULT 'dispensary', "name" character varying(255) NOT NULL, "slug" character varying(100) NOT NULL, "license_number" character varying(100), "license_type" character varying(100), "address_line1" character varying(255), "city" character varying(100), "state" character varying(2) NOT NULL, "zip" character varying(10), "latitude" numeric(10,7), "longitude" numeric(10,7), "county" character varying(100), "municipality" character varying(100), "phone" character varying(20), "email" character varying(255), "website" character varying(255), "is_active" boolean NOT NULL DEFAULT true, "is_delivery_enabled" boolean NOT NULL DEFAULT false, "is_pickup_enabled" boolean NOT NULL DEFAULT false, "metrc_license_number" character varying(100), "timezone" character varying(50), "cash_discount_percent" numeric(5,2) NOT NULL DEFAULT '0', "is_cash_enabled" boolean NOT NULL DEFAULT true, "cash_delivery_enabled" boolean NOT NULL DEFAULT true, "active_payment_processor" text, "design_system" character varying(50) NOT NULL DEFAULT 'casual', "design_system_file" character varying(100) NOT NULL DEFAULT 'casual.css', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_aff1505a5ea0c53d336a0b5f669" PRIMARY KEY ("entity_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_dispensaries_company_id" ON "dispensaries" ("company_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_dispensaries_slug" ON "dispensaries" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "delivery_time_slots" ("slot_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "slot_type" character varying(20) NOT NULL DEFAULT 'delivery', "day_of_week" integer NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "max_orders" integer DEFAULT '10', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c86e0a407351791d2811bbe8bbd" PRIMARY KEY ("slot_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_delivery_time_slots_dispensary_id" ON "delivery_time_slots" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "delivery_zones" ("zone_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "radius_miles" numeric(6,2) NOT NULL DEFAULT '5', "delivery_fee" numeric(10,2) NOT NULL DEFAULT '0', "min_order_amount" numeric(10,2), "free_delivery_threshold" numeric(10,2), "estimated_minutes_min" integer DEFAULT '30', "estimated_minutes_max" integer DEFAULT '60', "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0385b1cee1d29255eaeee12179c" PRIMARY KEY ("zone_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_delivery_zones_dispensary_id" ON "delivery_zones" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "order_tracking" ("tracking_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "status" character varying(50) NOT NULL, "notes" text, "updated_by_user_id" uuid, "latitude" numeric(10,7), "longitude" numeric(10,7), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_28cccd2a811d4ffe88eec088ef3" PRIMARY KEY ("tracking_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_order_tracking_order_id" ON "order_tracking" ("order_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_transactions" ("transaction_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "inventory_id" uuid NOT NULL, "batch_id" uuid, "dispensary_id" uuid NOT NULL, "transaction_type" character varying NOT NULL, "adjustment_reason_id" smallint, "quantity_delta" numeric(12,4) NOT NULL, "quantity_before" numeric(12,4) NOT NULL, "quantity_after" numeric(12,4) NOT NULL, "reference_order_id" uuid, "reference_transfer_manifest_id" character varying(100), "performed_by_user_id" uuid, "metrc_synced" boolean NOT NULL DEFAULT false, "metrc_synced_at" TIMESTAMP WITH TIME ZONE, "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d6c1a1f1b5f76757a03860168aa" PRIMARY KEY ("transaction_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_transactions_inventory_id" ON "inventory_transactions" ("inventory_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_transactions_inventory_id_created_at" ON "inventory_transactions" ("inventory_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_transactions_dispensary_id_created_at" ON "inventory_transactions" ("dispensary_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory" ("inventory_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "variant_id" uuid NOT NULL, "dispensary_id" uuid NOT NULL, "quantity_on_hand" numeric(12,4) NOT NULL DEFAULT '0', "quantity_reserved" numeric(12,4) NOT NULL DEFAULT '0', "quantity_available" numeric(12,4) NOT NULL DEFAULT '0', "reorder_threshold" numeric(12,4), "reorder_quantity" numeric(12,4), "location_in_store" character varying(200), "last_metrc_sync_at" TIMESTAMP WITH TIME ZONE, "last_reconciled_at" TIMESTAMP WITH TIME ZONE, "last_count_at" TIMESTAMP WITH TIME ZONE, "last_count_by_user_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_711db979ad954f0ab33e3eea53a" PRIMARY KEY ("inventory_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_variant_id" ON "inventory" ("variant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_dispensary_id" ON "inventory" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_inventory_dispensary_id_variant_id" ON "inventory" ("dispensary_id", "variant_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_transfers" ("transfer_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "from_dispensary_id" uuid NOT NULL, "to_dispensary_id" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'requested', "requested_by_user_id" uuid NOT NULL, "approved_by_user_id" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "shipped_at" TIMESTAMP WITH TIME ZONE, "received_at" TIMESTAMP WITH TIME ZONE, "metrc_manifest_id" character varying(100), "notes" text, "rejection_reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6f013bfa90689d52388c804fc5d" PRIMARY KEY ("transfer_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_transfers_from_dispensary_id" ON "inventory_transfers" ("from_dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_transfers_to_dispensary_id" ON "inventory_transfers" ("to_dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_transfer_items" ("item_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transfer_id" uuid NOT NULL, "variant_id" uuid NOT NULL, "product_name" character varying(255) NOT NULL, "variant_name" character varying(100), "quantity_requested" integer NOT NULL, "quantity_shipped" integer, "quantity_received" integer, "metrc_package_tag" character varying(100), "notes" text, CONSTRAINT "PK_eb90c11b270e004a06ee089bb2b" PRIMARY KEY ("item_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_transfer_items_transfer_id" ON "inventory_transfer_items" ("transfer_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_counts" ("count_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "count_type" character varying(20) NOT NULL DEFAULT 'cycle', "status" character varying(20) NOT NULL DEFAULT 'in_progress', "started_by_user_id" uuid NOT NULL, "completed_by_user_id" uuid, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "completed_at" TIMESTAMP WITH TIME ZONE, "notes" text, "total_items" integer NOT NULL DEFAULT '0', "items_counted" integer NOT NULL DEFAULT '0', "variance_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_de300d2350247eec44dd8917c7d" PRIMARY KEY ("count_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_counts_dispensary_id" ON "inventory_counts" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_count_items" ("count_item_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "count_id" uuid NOT NULL, "variant_id" uuid NOT NULL, "product_name" character varying(255) NOT NULL, "variant_name" character varying(100), "expected_quantity" integer NOT NULL DEFAULT '0', "counted_quantity" integer, "variance" integer, "counted_by_user_id" uuid, "counted_at" TIMESTAMP WITH TIME ZONE, "notes" text, CONSTRAINT "PK_b0ef79eb487e35b1fa1fc55a567" PRIMARY KEY ("count_item_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_count_items_count_id" ON "inventory_count_items" ("count_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_adjustments" ("adjustment_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "variant_id" uuid NOT NULL, "product_name" character varying(255) NOT NULL, "reason_id" integer NOT NULL, "quantity_change" integer NOT NULL, "quantity_before" integer NOT NULL, "quantity_after" integer NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "submitted_by_user_id" uuid NOT NULL, "approved_by_user_id" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9f37d044697bf40c145809c29bf" PRIMARY KEY ("adjustment_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_adjustments_dispensary_id" ON "inventory_adjustments" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_adjustment_reasons" ("reason_id" SERIAL NOT NULL, "code" character varying(30) NOT NULL, "name" character varying(100) NOT NULL, "direction" character varying(10) NOT NULL DEFAULT 'decrease', "requires_approval" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_4ff40311790d96f1b3d27f76acf" UNIQUE ("code"), CONSTRAINT "PK_8c1ad8d7a2340b31e5249bf299b" PRIMARY KEY ("reason_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "manufacturers" ("manufacturer_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "brand_id" uuid, "legal_name" character varying(255) NOT NULL, "dba_name" character varying(255), "license_number" character varying(100), "license_type" character varying(100), "license_state" character varying(2), "license_expiry_date" date, "address_line1" character varying(255), "city" character varying(100), "state" character varying(2), "zip" character varying(10), "contact_email" character varying(255), "contact_phone" character varying(20), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_1ea127882114baa682a19aa2ef3" PRIMARY KEY ("manufacturer_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_manufacturers_brand_id" ON "manufacturers" ("brand_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "compliance_logs" ("log_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "event_type" character varying NOT NULL, "user_id" uuid, "entity_type" character varying, "entity_id" character varying, "action" character varying, "details" jsonb, "ip_address" character varying, "user_agent" character varying, "metrc_synced" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5c54711ef9729d51b5050505d6e" PRIMARY KEY ("log_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_compliance_logs_dispensary_id_entity_type_entity_id" ON "compliance_logs" ("dispensary_id", "entity_type", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_compliance_logs_dispensary_id_created_at" ON "compliance_logs" ("dispensary_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "metrc_credentials" ("credential_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "user_api_key" character varying NOT NULL, "integrator_api_key" character varying, "state" character varying(10) NOT NULL, "metrc_username" character varying, "is_active" boolean NOT NULL DEFAULT true, "last_validated_at" TIMESTAMP WITH TIME ZONE, "validation_error" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e536172c3d11883201a0efd57cb" PRIMARY KEY ("credential_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_metrc_credentials_dispensary_id" ON "metrc_credentials" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "metrc_sync_logs" ("sync_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "credential_id" uuid NOT NULL, "sync_type" character varying NOT NULL, "reference_entity_type" character varying, "reference_entity_id" character varying, "status" character varying NOT NULL DEFAULT 'pending', "metrc_response" jsonb, "error_message" text, "attempt_count" integer NOT NULL DEFAULT '0', "next_retry_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_51108f8c278219b4b564c7f518e" PRIMARY KEY ("sync_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_metrc_sync_logs_credential_id" ON "metrc_sync_logs" ("credential_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_metrc_sync_logs_dispensary_id_status" ON "metrc_sync_logs" ("dispensary_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_metrc_sync_logs_dispensary_id_created_at" ON "metrc_sync_logs" ("dispensary_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "regulatory_library" ("reg_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "jurisdiction_level" character varying, "jurisdiction_name" character varying, "state" character varying(10), "statute_number" character varying, "title" character varying, "summary" text, "full_text" text, "effective_date" date, "expiry_date" date, "status" character varying NOT NULL DEFAULT 'active', "tags" jsonb, "source_url" character varying, "last_verified_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9fc9dbfe616c2987e82f56bb10f" PRIMARY KEY ("reg_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_regulatory_library_state_status" ON "regulatory_library" ("state", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_templates" ("template_id" SERIAL NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "channel" character varying(10) NOT NULL DEFAULT 'email', "subject" character varying(255), "body_template" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_0f527489aa40b6ba96faf6b5024" UNIQUE ("code"), CONSTRAINT "PK_f0581a1da2a1b5dab8a072c59fb" PRIMARY KEY ("template_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_log" ("log_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "dispensary_id" uuid, "channel" character varying(10) NOT NULL, "template_code" character varying(50), "recipient" character varying(255) NOT NULL, "subject" character varying(255), "body" text, "status" character varying(20) NOT NULL DEFAULT 'pending', "error_message" text, "external_id" character varying(255), "sent_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7b7db89a1f9826841ee6a1b8d51" PRIMARY KEY ("log_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notification_log_user_id" ON "notification_log" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "order_line_items" ("line_item_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "variant_id" uuid, "batch_id" uuid, "quantity" numeric(12,4) NOT NULL, "unit_price" numeric(10,2) NOT NULL, "discount_applied" numeric(10,2) NOT NULL DEFAULT '0', "tax_applied" numeric(10,2) NOT NULL DEFAULT '0', "metrc_package_label" character varying(100), "metrc_item_uid" character varying(100), "thc_mg_per_unit" numeric(10,4), "cbd_mg_per_unit" numeric(10,4), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a599f46f619b7678ae3b12b3ed2" PRIMARY KEY ("line_item_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_order_line_items_order_id" ON "order_line_items" ("order_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("order_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "customer_user_id" uuid, "staff_user_id" uuid, "order_type" character varying NOT NULL DEFAULT 'pickup', "order_status" character varying NOT NULL DEFAULT 'draft', "subtotal" numeric(10,2) NOT NULL DEFAULT '0', "discount_total" numeric(10,2) NOT NULL DEFAULT '0', "tax_total" numeric(10,2) NOT NULL DEFAULT '0', "total" numeric(10,2) NOT NULL DEFAULT '0', "tax_breakdown" jsonb, "applied_promotions" jsonb, "metrc_receipt_id" character varying(100), "metrc_reported_at" TIMESTAMP WITH TIME ZONE, "metrc_sync_status" character varying DEFAULT 'pending', "payment_method" character varying DEFAULT 'cash', "cash_discount_applied" numeric(10,2) NOT NULL DEFAULT '0', "fulfillment_address" jsonb, "scheduled_pickup_at" TIMESTAMP WITH TIME ZONE, "notes" text, "cancellation_reason" text, "cancelled_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cad55b3cb25b38be94d2ce831db" PRIMARY KEY ("order_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_dispensary_id" ON "orders" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_customer_user_id" ON "orders" ("customer_user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_customer_user_id_created_at" ON "orders" ("customer_user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_dispensary_id_created_at" ON "orders" ("dispensary_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "dispensary_payment_processors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "processor_name" text NOT NULL, "is_enabled" boolean NOT NULL DEFAULT false, "is_sandbox" boolean NOT NULL DEFAULT true, "credentials_encrypted" text, "merchant_external_id" text, "provisioned_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uniq_dpp_dispensary_processor" UNIQUE ("dispensary_id", "processor_name"), CONSTRAINT "PK_18faa0ab334d0dd7aa8ce501e63" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_dispensary_payment_processors_dispensary_id" ON "dispensary_payment_processors" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("payment_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "dispensary_id" uuid NOT NULL, "method" character varying NOT NULL DEFAULT 'cash', "amount" numeric(10,2) NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "terminal_id" character varying(100), "processor_name" character varying(32), "processor_transaction_id" character varying(128), "failure_reason" character varying, "cash_tendered" numeric(10,2), "change_given" numeric(10,2), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8866a3cfff96b8e17c2b204aae0" PRIMARY KEY ("payment_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payments_dispensary_id_created_at" ON "payments" ("dispensary_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payments_order_id" ON "payments" ("order_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "pos_integrations" ("integration_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "provider" character varying(50) NOT NULL, "credentials" jsonb NOT NULL DEFAULT '{}', "dispensary_external_id" character varying(255), "is_active" boolean NOT NULL DEFAULT false, "is_sync_enabled" boolean NOT NULL DEFAULT false, "last_sync_at" TIMESTAMP WITH TIME ZONE, "last_sync_status" character varying(50), "last_sync_error" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_559e377dbf1d68017a2d499c841" PRIMARY KEY ("integration_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_pos_integrations_dispensary_id" ON "pos_integrations" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "pos_product_mappings" ("mapping_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "internal_product_id" uuid NOT NULL, "internal_variant_id" uuid, "external_product_id" character varying(255) NOT NULL, "external_variant_id" character varying(255), "provider" character varying(50) NOT NULL, "match_method" character varying(50), "is_confirmed" boolean NOT NULL DEFAULT false, "last_synced_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3e32df96b63e04382f3b13aac88" PRIMARY KEY ("mapping_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_pos_product_mappings_dispensary_id_external_product_id_provider" ON "pos_product_mappings" ("dispensary_id", "external_product_id", "provider") `,
    );
    await queryRunner.query(
      `CREATE TABLE "pos_sync_logs" ("sync_log_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "provider" character varying(50) NOT NULL, "sync_type" character varying(50) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "items_processed" integer NOT NULL DEFAULT '0', "items_created" integer NOT NULL DEFAULT '0', "items_updated" integer NOT NULL DEFAULT '0', "items_failed" integer NOT NULL DEFAULT '0', "error_message" text, "duration_ms" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a1db9eab4268aecefe6cec6e1ce" PRIMARY KEY ("sync_log_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_pos_sync_logs_dispensary_id_created_at" ON "pos_sync_logs" ("dispensary_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "strain_data" ("strain_data_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ocpc" character varying(50), "name" character varying(255) NOT NULL, "type" character varying(20), "description" text, "effects" jsonb NOT NULL DEFAULT '[]', "flavors" jsonb NOT NULL DEFAULT '[]', "terpenes" jsonb NOT NULL DEFAULT '[]', "lineage" jsonb NOT NULL DEFAULT '{}', "genetics" character varying(500), "thc_avg" numeric(6,3), "cbd_avg" numeric(6,3), "photo_url" character varying(500), "source" character varying(50) NOT NULL DEFAULT 'otreeba', "last_synced_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_94a6b00fc76e7e811e70472c505" PRIMARY KEY ("strain_data_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_strain_data_ocpc" ON "strain_data" ("ocpc") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_strain_data_name" ON "strain_data" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_strain_data_type" ON "strain_data" ("type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "brand_id" uuid, "manufacturer_id" uuid, "strain_id" uuid, "product_type_id" integer, "primary_category_id" integer, "tax_category_id" integer, "packaging_type_id" integer, "extraction_method_id" integer, "uom_id" integer, "metrc_item_category_id" integer, "strain_name" character varying(255), "strain_type" character varying(20), "effects" jsonb NOT NULL DEFAULT '[]', "flavors" jsonb NOT NULL DEFAULT '[]', "terpenes" jsonb NOT NULL DEFAULT '[]', "lineage" jsonb NOT NULL DEFAULT '{}', "otreeba_ocpc" character varying(50), "enriched_at" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "sort_order" integer, "description" text, "short_description" text, "sku" character varying(100), "metrc_item_uid" character varying(50), "net_weight_g" numeric(10,4), "net_volume_ml" numeric(10,4), "thc_percent" numeric(6,3), "cbd_percent" numeric(6,3), "total_thc_mg_per_container" numeric(10,4), "is_hemp_derived" boolean NOT NULL DEFAULT false, "is_child_resistant_packaged" boolean NOT NULL DEFAULT false, "is_tamper_evident" boolean NOT NULL DEFAULT false, "is_resealable" boolean NOT NULL DEFAULT false, "has_no_minor_appeals" boolean NOT NULL DEFAULT true, "is_active" boolean NOT NULL DEFAULT false, "is_approved" boolean NOT NULL DEFAULT false, "approved_by_user_id" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_dispensary_id" ON "products" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_products_sku" ON "products" ("sku") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_metrc_item_uid" ON "products" ("metrc_item_uid") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_dispensary_id_primary_category_id_is_active" ON "products" ("dispensary_id", "primary_category_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_dispensary_id_is_active_product_type_id" ON "products" ("dispensary_id", "is_active", "product_type_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_variants" ("variant_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "dispensary_id" uuid NOT NULL, "uom_id" integer, "name" character varying(100) NOT NULL, "quantity_per_unit" numeric(10,4), "sku" character varying(100), "barcode" character varying(100), "metrc_package_label" character varying(100), "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_4c6116b1b96c664f518916e92a2" PRIMARY KEY ("variant_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_variants_product_id" ON "product_variants" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_variants_dispensary_id" ON "product_variants" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_variants_sku" ON "product_variants" ("sku") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_variants_barcode" ON "product_variants" ("barcode") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_variants_metrc_package_label" ON "product_variants" ("metrc_package_label") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_variants_product_id_is_active" ON "product_variants" ("product_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_batches" ("batch_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "variant_id" uuid NOT NULL, "dispensary_id" uuid NOT NULL, "manufacturer_id" uuid, "uom_id" integer, "lot_number" character varying(100), "metrc_package_label" character varying(100), "quantity_received" numeric(10,4) NOT NULL DEFAULT '0', "quantity_remaining" numeric(10,4) NOT NULL DEFAULT '0', "status" character varying(20) NOT NULL DEFAULT 'active', "manufacture_date" date, "expiry_date" date, "received_at" TIMESTAMP WITH TIME ZONE, "received_by_user_id" uuid, "recall_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8a48d3093e6aa0cade2f866ad78" PRIMARY KEY ("batch_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_batches_variant_id" ON "product_batches" ("variant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_batches_dispensary_id" ON "product_batches" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_batches_lot_number" ON "product_batches" ("lot_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_batches_metrc_package_label" ON "product_batches" ("metrc_package_label") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_batches_dispensary_id_status_expiry_date" ON "product_batches" ("dispensary_id", "status", "expiry_date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "lab_tests" ("lab_test_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "batch_id" uuid NOT NULL, "dispensary_id" uuid NOT NULL, "lab_name" character varying(255), "lab_license_number" character varying(100), "coa_number" character varying(100), "coa_document_url" character varying(500), "coa_qr_code_url" character varying(500), "overall_result" character varying(20) NOT NULL DEFAULT 'pending', "tested_at" date, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a7e953fe154e1cd0c7ee3e8723e" PRIMARY KEY ("lab_test_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_lab_tests_batch_id" ON "lab_tests" ("batch_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_lab_tests_batch_id_overall_result" ON "lab_tests" ("batch_id", "overall_result") `,
    );
    await queryRunner.query(
      `CREATE TABLE "lab_test_results" ("result_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lab_test_id" uuid NOT NULL, "test_category_id" integer NOT NULL, "analyte_name" character varying(100) NOT NULL, "unit" character varying(20), "value" numeric(10,6), "action_limit" numeric(10,6), "result" character varying(20) NOT NULL DEFAULT 'pass', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ed978dc89c011ec067ffcf9aed9" PRIMARY KEY ("result_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_lab_test_results_lab_test_id" ON "lab_test_results" ("lab_test_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_product_types" ("product_type_id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "requires_lab_test" boolean NOT NULL DEFAULT false, "requires_serving_info" boolean NOT NULL DEFAULT false, "requires_ingredient_list" boolean NOT NULL DEFAULT false, "requires_extraction_method" boolean NOT NULL DEFAULT false, "is_inhalable" boolean NOT NULL DEFAULT false, "is_ingestible" boolean NOT NULL DEFAULT false, "metrc_default_category_code" character varying(100), "hemp_eligible" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_bdf582f3e0f24263e30a3b9db38" UNIQUE ("code"), CONSTRAINT "PK_5c113e50d72a594fb598181e402" PRIMARY KEY ("product_type_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_product_categories" ("category_id" SERIAL NOT NULL, "parent_category_id" integer, "code" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "depth" integer NOT NULL DEFAULT '0', "metrc_category_code" character varying(100), "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_4eaa9f013229a20323423be960d" UNIQUE ("code"), CONSTRAINT "PK_a42873ea06145cc64d860f2bdd2" PRIMARY KEY ("category_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_unit_of_measure" ("uom_id" SERIAL NOT NULL, "code" character varying(20) NOT NULL, "name" character varying(50) NOT NULL, "uom_type" character varying(20) NOT NULL, "is_metrc_supported" boolean NOT NULL DEFAULT false, "metrc_code" character varying(50), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_64a4df2feae42698d3a4e25c549" UNIQUE ("code"), CONSTRAINT "PK_409622fdf16eb3d465a6094817d" PRIMARY KEY ("uom_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_packaging_types" ("packaging_type_id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "is_child_resistant" boolean NOT NULL DEFAULT false, "is_tamper_evident" boolean NOT NULL DEFAULT false, "is_resealable" boolean NOT NULL DEFAULT false, "is_opaque" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_eaf668d9215248ba6e01a80e20a" UNIQUE ("code"), CONSTRAINT "PK_f39c3f339a11054037e3b33ffcf" PRIMARY KEY ("packaging_type_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_extraction_methods" ("extraction_method_id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "uses_solvent" boolean NOT NULL DEFAULT false, "solvent_type" character varying(100), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_8b16f01408ec92aa5ffa65b7110" UNIQUE ("code"), CONSTRAINT "PK_27ab54f8b87391d117f17824597" PRIMARY KEY ("extraction_method_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_effects" ("effect_id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "effect_category" character varying(50), "is_medical_claim" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_6c16809cee156ba7499716b6524" UNIQUE ("code"), CONSTRAINT "PK_376ff7dbebf5ea1dd86f2a96d70" PRIMARY KEY ("effect_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_flavors" ("flavor_id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "flavor_family" character varying(50), "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_b45def73e86c6fa1462162f03a9" UNIQUE ("code"), CONSTRAINT "PK_0f989e7afff42645889943d1139" PRIMARY KEY ("flavor_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_terpenes" ("terpene_id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "aroma" text, "potential_effects" text, "boiling_point_celsius" numeric(5,1), "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_f0aa74b263a54d24bf80dd84257" UNIQUE ("code"), CONSTRAINT "PK_d5423f808e8daed300e8e67e906" PRIMARY KEY ("terpene_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_cannabinoids" ("cannabinoid_id" SERIAL NOT NULL, "code" character varying(20) NOT NULL, "name" character varying(50) NOT NULL, "abbreviation" character varying(20), "is_psychoactive" boolean NOT NULL DEFAULT false, "is_hemp_restricted" boolean NOT NULL DEFAULT false, "is_scheduled" boolean NOT NULL DEFAULT false, "schedule" character varying(50), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_c0ce23069454f1d6b25922afac6" UNIQUE ("code"), CONSTRAINT "PK_562724cda0c1a91a7cb71024cfc" PRIMARY KEY ("cannabinoid_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_allergens" ("allergen_id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "is_fda_major" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_db3703c839ec5ee6acbb4e54fec" UNIQUE ("code"), CONSTRAINT "PK_cbd8eacbab18c6cc079c040d756" PRIMARY KEY ("allergen_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_lab_test_categories" ("test_category_id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "applies_to_product_types" text, "is_mandatory" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_ae8cf24d1434b9cc09ea3adb29c" UNIQUE ("code"), CONSTRAINT "PK_66cab84fcf6edc183edea7e6d90" PRIMARY KEY ("test_category_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_tax_categories" ("tax_category_id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "state" character varying(10), "name" character varying(100) NOT NULL, "tax_basis" character varying(20) NOT NULL, "rate" numeric(6,4) NOT NULL DEFAULT '0', "effective_date" date, "statutory_reference" character varying(255), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_dc40a5a62553b63ceb4ac3e9253" UNIQUE ("code"), CONSTRAINT "PK_045f0293545fc7a900d78da2d75" PRIMARY KEY ("tax_category_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_metrc_item_categories" ("metrc_category_id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "state" character varying(10), "name" character varying(100) NOT NULL, "product_type_code" character varying(100), "requires_unit_weight" boolean NOT NULL DEFAULT false, "effective_date" date, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_9f7277e65259ea9116487f05020" UNIQUE ("code"), CONSTRAINT "PK_0ad8b03c8f4b3727c8621c15e39" PRIMARY KEY ("metrc_category_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_metrc_adjustment_reasons" ("adjustment_reason_id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "state" character varying(10), "name" character varying(255) NOT NULL, "reason_category" character varying(50), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_9da79433e3ca5bf2ae69a322765" UNIQUE ("code"), CONSTRAINT "PK_7e24a038b0da89dd665e10502a4" PRIMARY KEY ("adjustment_reason_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_warning_statements" ("warning_id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "jurisdiction" character varying(5) NOT NULL, "statement_text" text NOT NULL, "applies_to_product_types" text, "applies_to_license_type" character varying(50), "is_mandatory" boolean NOT NULL DEFAULT false, "effective_date" date, "statutory_reference" character varying(255), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_3b9813b9ad56a9992246d6631db" UNIQUE ("code"), CONSTRAINT "PK_d2525dda092550fc4705e22e7c4" PRIMARY KEY ("warning_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_pricing" ("pricing_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "variant_id" uuid NOT NULL, "dispensary_id" uuid NOT NULL, "price_type" character varying(20) NOT NULL DEFAULT 'retail', "price" numeric(10,2) NOT NULL, "compare_at_price" numeric(10,2), "effective_from" TIMESTAMP WITH TIME ZONE NOT NULL, "effective_until" TIMESTAMP WITH TIME ZONE, "set_by_user_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_870a3ee6e12796b97c4dd4be31b" PRIMARY KEY ("pricing_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_pricing_variant_id" ON "product_pricing" ("variant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_pricing_variant_id_price_type_effective_from_effective_until" ON "product_pricing" ("variant_id", "price_type", "effective_from", "effective_until") `,
    );
    await queryRunner.query(
      `CREATE TABLE "promotion_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "promo_id" uuid NOT NULL, "category_id" integer NOT NULL, "is_eligible" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_54ecd6c42480bf073c766b478b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_promotion_categories_promo_id" ON "promotion_categories" ("promo_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "promotion_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "promo_id" uuid NOT NULL, "product_id" uuid, "variant_id" uuid, "is_eligible" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_14c87cc62743f4ebc46884c9f49" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_promotion_products_promo_id" ON "promotion_products" ("promo_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "promotions" ("promo_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "type" character varying(50) NOT NULL, "code" character varying(50), "discount_value" numeric(10,2) NOT NULL DEFAULT '0', "minimum_order_total" numeric(10,2), "max_uses" integer, "uses_count" integer NOT NULL DEFAULT '0', "max_uses_per_customer" integer, "applies_to" character varying(50), "applies_to_product_type_id" integer, "applies_to_brand_id" uuid, "applies_to_tax_category_id" integer, "stackable_with_others" boolean NOT NULL DEFAULT false, "is_staff_discount" boolean NOT NULL DEFAULT false, "is_medical_discount" boolean NOT NULL DEFAULT false, "start_at" TIMESTAMP WITH TIME ZONE, "end_at" TIMESTAMP WITH TIME ZONE, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c65edc8429d0b627611e1cd04b4" PRIMARY KEY ("promo_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_promotions_dispensary_id" ON "promotions" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_promotions_dispensary_id_is_active" ON "promotions" ("dispensary_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE TABLE "register_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "opened_by_user_id" uuid NOT NULL, "opening_cash_cents" integer NOT NULL, "closing_cash_cents" integer, "status" text NOT NULL DEFAULT 'open', "opened_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "closed_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ddccd1bf0b5a1dfef68f85103ca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_register_sessions_opened_by_user_id_status" ON "register_sessions" ("opened_by_user_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_register_sessions_dispensary_id_status" ON "register_sessions" ("dispensary_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shift_templates" ("template_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "day_of_week" integer NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "position_id" integer, "min_staff" integer NOT NULL DEFAULT '1', "max_staff" integer NOT NULL DEFAULT '3', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_cf1d7a493ba900d1fb465408e07" PRIMARY KEY ("template_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shift_templates_dispensary_id" ON "shift_templates" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "scheduled_shifts" ("shift_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "profile_id" uuid NOT NULL, "template_id" uuid, "shift_date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'scheduled', "notes" text, "published" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_414d9505684f0333b3ea06d38ba" PRIMARY KEY ("shift_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_scheduled_shifts_dispensary_id" ON "scheduled_shifts" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_scheduled_shifts_profile_id" ON "scheduled_shifts" ("profile_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shift_swap_requests" ("swap_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "original_shift_id" uuid NOT NULL, "requesting_profile_id" uuid NOT NULL, "covering_profile_id" uuid, "status" character varying(20) NOT NULL DEFAULT 'open', "reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7fd5d06464d86cc11cceb338708" PRIMARY KEY ("swap_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "time_off_requests" ("request_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "profile_id" uuid NOT NULL, "dispensary_id" uuid NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "request_type" character varying(20) NOT NULL DEFAULT 'pto', "reason" text, "status" character varying(20) NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_fc1fef3e892e9a0b11057abb793" PRIMARY KEY ("request_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "driver_profiles" ("driver_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "profile_id" uuid NOT NULL, "dispensary_id" uuid NOT NULL, "vehicle_make" character varying(50), "vehicle_model" character varying(50), "vehicle_year" integer, "vehicle_color" character varying(30), "license_plate" character varying(15), "insurance_provider" character varying(100), "insurance_expiry" date, "max_deliveries_per_hour" integer NOT NULL DEFAULT '3', "status" character varying(20) NOT NULL DEFAULT 'available', "current_latitude" numeric(10,7), "current_longitude" numeric(10,7), "last_location_update" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_44f05ddc6685120e06e455da62d" PRIMARY KEY ("driver_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_driver_profiles_profile_id" ON "driver_profiles" ("profile_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_driver_profiles_dispensary_id" ON "driver_profiles" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "delivery_trips" ("trip_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "driver_id" uuid NOT NULL, "dispensary_id" uuid NOT NULL, "order_id" uuid, "status" character varying(20) NOT NULL DEFAULT 'assigned', "departed_at" TIMESTAMP WITH TIME ZONE, "delivered_at" TIMESTAMP WITH TIME ZONE, "delivery_address" text, "distance_miles" numeric(6,2), "estimated_minutes" integer, "actual_minutes" integer, "customer_rating" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2f3285f0469f624785ce1bb2687" PRIMARY KEY ("trip_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_delivery_trips_driver_id" ON "delivery_trips" ("driver_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_certifications" ("certification_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "profile_id" uuid NOT NULL, "cert_type_id" integer NOT NULL, "certificate_number" character varying(100), "issued_date" date, "expiration_date" date, "status" character varying(20) NOT NULL DEFAULT 'pending', "verified_by_user_id" uuid, "verified_at" TIMESTAMP WITH TIME ZONE, "document_url" character varying(500), "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d039ca481da1c415c05cae807d2" PRIMARY KEY ("certification_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_employee_certifications_profile_id" ON "employee_certifications" ("profile_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_profiles" ("profile_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "dispensary_id" uuid NOT NULL, "position_id" integer, "employee_number" character varying(20), "department" character varying(50), "employment_type" character varying(20) NOT NULL DEFAULT 'full_time', "employment_status" character varying(20) NOT NULL DEFAULT 'active', "hire_date" date NOT NULL, "termination_date" date, "termination_reason" text, "hourly_rate" numeric(8,2), "salary" numeric(10,2), "pay_type" character varying(10) NOT NULL DEFAULT 'hourly', "overtime_eligible" boolean NOT NULL DEFAULT true, "phone" character varying(20), "emergency_contact_name" character varying(100), "emergency_contact_phone" character varying(20), "emergency_contact_relationship" character varying(50), "is_exempt" boolean NOT NULL DEFAULT false, "exempt_reason" character varying(100), "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_75e9f60cf8a49584a2b7aaf53a2" PRIMARY KEY ("profile_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_employee_profiles_user_id" ON "employee_profiles" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_employee_profiles_dispensary_id" ON "employee_profiles" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_employee_profiles_employment_status" ON "employee_profiles" ("employment_status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "performance_reviews" ("review_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "profile_id" uuid NOT NULL, "reviewer_user_id" uuid NOT NULL, "review_period_start" date NOT NULL, "review_period_end" date NOT NULL, "overall_rating" integer, "sales_rating" integer, "compliance_rating" integer, "teamwork_rating" integer, "reliability_rating" integer, "strengths" text, "areas_for_improvement" text, "goals" text, "manager_comments" text, "employee_comments" text, "status" character varying(20) NOT NULL DEFAULT 'draft', "acknowledged_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_93dfe017265895096319404040f" PRIMARY KEY ("review_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_performance_reviews_profile_id" ON "performance_reviews" ("profile_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_positions" ("position_id" SERIAL NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "department" character varying(50) NOT NULL DEFAULT 'operations', "is_management" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_e1aece9782e7fcfce5063bd1aab" UNIQUE ("code"), CONSTRAINT "PK_9da8833621daa7bd8dcac90f6df" PRIMARY KEY ("position_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lkp_certification_types" ("cert_type_id" SERIAL NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(150) NOT NULL, "description" text, "issuing_authority" character varying(200), "validity_months" integer, "is_state_required" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_d076823a0b86976f9d4ef579fd9" UNIQUE ("code"), CONSTRAINT "PK_ffe22f006e481a77a329996cd31" PRIMARY KEY ("cert_type_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "theme_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dispensary_id" uuid NOT NULL, "preset" character varying NOT NULL DEFAULT 'casual', "primary" character varying NOT NULL DEFAULT '#2d6a4f', "secondary" character varying NOT NULL DEFAULT '#74956c', "accent" character varying NOT NULL DEFAULT '#c47820', "bg_primary" character varying NOT NULL DEFAULT '#faf6f0', "bg_secondary" character varying NOT NULL DEFAULT '#f0ebe3', "bg_card" character varying NOT NULL DEFAULT '#ffffff', "text_primary" character varying NOT NULL DEFAULT '#2c2418', "text_secondary" character varying NOT NULL DEFAULT '#6b5e4f', "sidebar_bg" character varying NOT NULL DEFAULT '#1b3a2a', "sidebar_text" character varying NOT NULL DEFAULT '#c8d8c4', "color_success" character varying NOT NULL DEFAULT '#27ae60', "color_warning" character varying NOT NULL DEFAULT '#d97706', "color_error" character varying NOT NULL DEFAULT '#c0392b', "color_info" character varying NOT NULL DEFAULT '#2e86ab', "is_dark" boolean NOT NULL DEFAULT false, "logo_url" character varying(500), "masthead_url" character varying(500), "display_font" character varying(100), "body_font" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ba6fd1ac098ba4b91cf32a0e4cd" UNIQUE ("dispensary_id"), CONSTRAINT "PK_a5b941ccdfb884480d668036aa9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "time_entries" ("entry_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "profile_id" uuid NOT NULL, "dispensary_id" uuid NOT NULL, "clock_in" TIMESTAMP WITH TIME ZONE NOT NULL, "clock_out" TIMESTAMP WITH TIME ZONE, "break_minutes" integer NOT NULL DEFAULT '0', "total_hours" numeric(6,2), "overtime_hours" numeric(6,2) NOT NULL DEFAULT '0', "status" character varying(20) NOT NULL DEFAULT 'clocked_in', "notes" text, "approved_by_user_id" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a5b0518ee265bd222b72b22da2b" PRIMARY KEY ("entry_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_time_entries_profile_id" ON "time_entries" ("profile_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_time_entries_dispensary_id" ON "time_entries" ("dispensary_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying, "role" character varying NOT NULL DEFAULT 'customer', "organization_id" uuid, "dispensary_id" uuid, "first_name" character varying, "last_name" character varying, "is_active" boolean NOT NULL DEFAULT true, "email_verified" boolean NOT NULL DEFAULT false, "last_login_at" TIMESTAMP WITH TIME ZONE, "password_changed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD CONSTRAINT "FK_4a99045ca7335fb66fa4a15f8ae" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispensaries" ADD CONSTRAINT "FK_21e35b1fc00894cbc2edc60e435" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "manufacturers" ADD CONSTRAINT "FK_fce6b7d542fc728e866f7d71395" FOREIGN KEY ("brand_id") REFERENCES "brands"("brand_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD CONSTRAINT "FK_6343513e20e2deab45edfce1316" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_batches" ADD CONSTRAINT "FK_9e874589807ffcc252fb3b06fc7" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("variant_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_tests" ADD CONSTRAINT "FK_faea8f45658c2d57c0abbd4012f" FOREIGN KEY ("batch_id") REFERENCES "product_batches"("batch_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_test_results" ADD CONSTRAINT "FK_72a0e74e0bd0e3d2558ff942eb8" FOREIGN KEY ("lab_test_id") REFERENCES "lab_tests"("lab_test_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_pricing" ADD CONSTRAINT "FK_ff024390b21c49ac8be876de1e6" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("variant_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_pricing" DROP CONSTRAINT "FK_ff024390b21c49ac8be876de1e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_test_results" DROP CONSTRAINT "FK_72a0e74e0bd0e3d2558ff942eb8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_tests" DROP CONSTRAINT "FK_faea8f45658c2d57c0abbd4012f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_batches" DROP CONSTRAINT "FK_9e874589807ffcc252fb3b06fc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP CONSTRAINT "FK_6343513e20e2deab45edfce1316"`,
    );
    await queryRunner.query(
      `ALTER TABLE "manufacturers" DROP CONSTRAINT "FK_fce6b7d542fc728e866f7d71395"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispensaries" DROP CONSTRAINT "FK_21e35b1fc00894cbc2edc60e435"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP CONSTRAINT "FK_4a99045ca7335fb66fa4a15f8ae"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_time_entries_dispensary_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_time_entries_profile_id"`,
    );
    await queryRunner.query(`DROP TABLE "time_entries"`);
    await queryRunner.query(`DROP TABLE "theme_configs"`);
    await queryRunner.query(`DROP TABLE "lkp_certification_types"`);
    await queryRunner.query(`DROP TABLE "lkp_positions"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_performance_reviews_profile_id"`,
    );
    await queryRunner.query(`DROP TABLE "performance_reviews"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_employee_profiles_employment_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_employee_profiles_dispensary_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_employee_profiles_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "employee_profiles"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_employee_certifications_profile_id"`,
    );
    await queryRunner.query(`DROP TABLE "employee_certifications"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_delivery_trips_driver_id"`,
    );
    await queryRunner.query(`DROP TABLE "delivery_trips"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_driver_profiles_dispensary_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_driver_profiles_profile_id"`,
    );
    await queryRunner.query(`DROP TABLE "driver_profiles"`);
    await queryRunner.query(`DROP TABLE "time_off_requests"`);
    await queryRunner.query(`DROP TABLE "shift_swap_requests"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_scheduled_shifts_profile_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_scheduled_shifts_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "scheduled_shifts"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_shift_templates_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "shift_templates"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_register_sessions_dispensary_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_register_sessions_opened_by_user_id_status"`,
    );
    await queryRunner.query(`DROP TABLE "register_sessions"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_promotions_dispensary_id_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_promotions_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "promotions"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_promotion_products_promo_id"`,
    );
    await queryRunner.query(`DROP TABLE "promotion_products"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_promotion_categories_promo_id"`,
    );
    await queryRunner.query(`DROP TABLE "promotion_categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_pricing_variant_id_price_type_effective_from_effective_until"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_pricing_variant_id"`,
    );
    await queryRunner.query(`DROP TABLE "product_pricing"`);
    await queryRunner.query(`DROP TABLE "lkp_warning_statements"`);
    await queryRunner.query(`DROP TABLE "lkp_metrc_adjustment_reasons"`);
    await queryRunner.query(`DROP TABLE "lkp_metrc_item_categories"`);
    await queryRunner.query(`DROP TABLE "lkp_tax_categories"`);
    await queryRunner.query(`DROP TABLE "lkp_lab_test_categories"`);
    await queryRunner.query(`DROP TABLE "lkp_allergens"`);
    await queryRunner.query(`DROP TABLE "lkp_cannabinoids"`);
    await queryRunner.query(`DROP TABLE "lkp_terpenes"`);
    await queryRunner.query(`DROP TABLE "lkp_flavors"`);
    await queryRunner.query(`DROP TABLE "lkp_effects"`);
    await queryRunner.query(`DROP TABLE "lkp_extraction_methods"`);
    await queryRunner.query(`DROP TABLE "lkp_packaging_types"`);
    await queryRunner.query(`DROP TABLE "lkp_unit_of_measure"`);
    await queryRunner.query(`DROP TABLE "lkp_product_categories"`);
    await queryRunner.query(`DROP TABLE "lkp_product_types"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_lab_test_results_lab_test_id"`,
    );
    await queryRunner.query(`DROP TABLE "lab_test_results"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_lab_tests_batch_id_overall_result"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_lab_tests_batch_id"`);
    await queryRunner.query(`DROP TABLE "lab_tests"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_batches_dispensary_id_status_expiry_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_batches_metrc_package_label"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_batches_lot_number"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_batches_dispensary_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_batches_variant_id"`,
    );
    await queryRunner.query(`DROP TABLE "product_batches"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_variants_product_id_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_variants_metrc_package_label"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_variants_barcode"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_product_variants_sku"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_variants_dispensary_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_variants_product_id"`,
    );
    await queryRunner.query(`DROP TABLE "product_variants"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_products_dispensary_id_is_active_product_type_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_products_dispensary_id_primary_category_id_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_products_metrc_item_uid"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_products_sku"`);
    await queryRunner.query(`DROP INDEX "public"."idx_products_dispensary_id"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP INDEX "public"."idx_strain_data_type"`);
    await queryRunner.query(`DROP INDEX "public"."idx_strain_data_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_strain_data_ocpc"`);
    await queryRunner.query(`DROP TABLE "strain_data"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_pos_sync_logs_dispensary_id_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "pos_sync_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_pos_product_mappings_dispensary_id_external_product_id_provider"`,
    );
    await queryRunner.query(`DROP TABLE "pos_product_mappings"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_pos_integrations_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "pos_integrations"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payments_order_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_payments_dispensary_id_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_dispensary_payment_processors_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "dispensary_payment_processors"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_orders_dispensary_id_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_orders_customer_user_id_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_orders_customer_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_orders_dispensary_id"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_order_line_items_order_id"`,
    );
    await queryRunner.query(`DROP TABLE "order_line_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_notification_log_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "notification_log"`);
    await queryRunner.query(`DROP TABLE "notification_templates"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_regulatory_library_state_status"`,
    );
    await queryRunner.query(`DROP TABLE "regulatory_library"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_metrc_sync_logs_dispensary_id_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_metrc_sync_logs_dispensary_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_metrc_sync_logs_credential_id"`,
    );
    await queryRunner.query(`DROP TABLE "metrc_sync_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_metrc_credentials_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "metrc_credentials"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_compliance_logs_dispensary_id_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_compliance_logs_dispensary_id_entity_type_entity_id"`,
    );
    await queryRunner.query(`DROP TABLE "compliance_logs"`);
    await queryRunner.query(`DROP INDEX "public"."idx_manufacturers_brand_id"`);
    await queryRunner.query(`DROP TABLE "manufacturers"`);
    await queryRunner.query(`DROP TABLE "lkp_adjustment_reasons"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_adjustments_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_adjustments"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_count_items_count_id"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_count_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_counts_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_counts"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_transfer_items_transfer_id"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_transfer_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_transfers_to_dispensary_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_transfers_from_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_transfers"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_dispensary_id_variant_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_dispensary_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_inventory_variant_id"`);
    await queryRunner.query(`DROP TABLE "inventory"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_transactions_dispensary_id_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_transactions_inventory_id_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_transactions_inventory_id"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_transactions"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_order_tracking_order_id"`,
    );
    await queryRunner.query(`DROP TABLE "order_tracking"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_delivery_zones_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "delivery_zones"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_delivery_time_slots_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "delivery_time_slots"`);
    await queryRunner.query(`DROP INDEX "public"."idx_dispensaries_slug"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_dispensaries_company_id"`,
    );
    await queryRunner.query(`DROP TABLE "dispensaries"`);
    await queryRunner.query(`DROP TABLE "age_verifications"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_customer_addresses_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "customer_addresses"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_customer_profiles_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "customer_profiles"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_reconciliation_items_report_id"`,
    );
    await queryRunner.query(`DROP TABLE "reconciliation_items"`);
    await queryRunner.query(`DROP TABLE "reconciliation_reports"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_log_user_id"`);
    await queryRunner.query(`DROP TABLE "audit_log"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_waste_destruction_logs_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "waste_destruction_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_metrc_manifest_items_manifest_id"`,
    );
    await queryRunner.query(`DROP TABLE "metrc_manifest_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_metrc_manifests_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "metrc_manifests"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_companies_organization_id"`,
    );
    await queryRunner.query(`DROP TABLE "companies"`);
    await queryRunner.query(`DROP INDEX "public"."idx_organizations_slug"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP INDEX "public"."idx_brands_organization_id"`);
    await queryRunner.query(`DROP TABLE "brands"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_biotrack_credentials_dispensary_id"`,
    );
    await queryRunner.query(`DROP TABLE "biotrack_credentials"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_refresh_tokens_token_hash"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_user_id"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP INDEX "public"."idx_kiosk_devices_user_id"`);
    await queryRunner.query(`DROP TABLE "kiosk_devices"`);
  }
}
