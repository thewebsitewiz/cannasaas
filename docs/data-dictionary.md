# CannaSaaS — Data Dictionary

Column-level companion to [`data-model.md`](./data-model.md). For each of the ~54 TypeORM entities in `apps/api/src/modules/**/entities/`, this file lists every persisted column, its postgres type, nullability, default, and a one-line description. Refer to `data-model.md` for the ER diagrams that show how these tables fit together.

> **Column-casing caveat:** most tables follow the project standard of snake_case columns (enforced by `SnakeNamingStrategy`). A handful of legacy tables — `orders`, `order_line_items`, `payments`, `dispensary_payment_processors`, `promotions`, `promotion_products`, `promotion_categories` — use camelCase identifiers (`"orderId"`, `"dispensaryId"`, …) and must be quoted when written in raw SQL. The `Column` cells in those tables reflect the actual quoted identifier.

---

## 1. Tenancy backbone

The three-level `organization → company → dispensary` hierarchy that every other entity scopes through.

### organizations

The top-level tenant. One row per customer (multi-state operator or single-site operator).

| Column              | Type         | Nullable | Default             | Description                              |
| ------------------- | ------------ | -------- | ------------------- | ---------------------------------------- |
| **organization_id** | uuid         | no       | `gen_random_uuid()` | PK.                                      |
| name                | varchar(255) | no       | —                   | Operator's display name.                 |
| slug                | varchar(100) | no       | —                   | Unique URL slug for subdomain routing.   |
| billing_email       | varchar(255) | yes      | —                   | Where invoices go.                       |
| billing_address     | varchar(500) | yes      | —                   | Postal billing address.                  |
| subscription_tier   | varchar(50)  | no       | `'starter'`         | SaaS plan tier.                          |
| subscription_status | varchar(50)  | no       | `'active'`          | `active` / `past_due` / `cancelled` etc. |
| created_at          | timestamptz  | no       | `NOW()`             | Row created.                             |
| updated_at          | timestamptz  | no       | `NOW()`             | Row last modified.                       |
| deleted_at          | timestamptz  | yes      | —                   | Soft-delete tombstone.                   |

### companies

A legal entity that operates one or more dispensaries under an organization.

| Column                 | Type         | Nullable | Default             | Description                                   |
| ---------------------- | ------------ | -------- | ------------------- | --------------------------------------------- |
| **company_id**         | uuid         | no       | `gen_random_uuid()` | PK.                                           |
| organization_id        | uuid         | no       | —                   | FK → organizations.organization_id.           |
| legal_name             | varchar(255) | no       | —                   | Registered legal name.                        |
| dba_name               | varchar(255) | yes      | —                   | "Doing business as".                          |
| ein                    | varchar(20)  | yes      | —                   | Employer Identification Number.               |
| state_of_incorporation | varchar(50)  | yes      | —                   | US state where the LLC/corp is registered.    |
| license_number         | varchar(100) | yes      | —                   | State cannabis license.                       |
| license_type           | varchar(100) | yes      | —                   | License classification (retail, micro, etc.). |
| license_state          | varchar(2)   | yes      | —                   | Two-letter state code for the license.        |
| license_expiry_date    | date         | yes      | —                   | License expiration.                           |
| contact_email          | varchar(255) | yes      | —                   | Primary contact.                              |
| contact_phone          | varchar(20)  | yes      | —                   | Primary contact.                              |
| address_line1          | varchar(255) | yes      | —                   | Mailing address.                              |
| city                   | varchar(100) | yes      | —                   | Mailing city.                                 |
| state                  | varchar(2)   | yes      | —                   | Mailing state.                                |
| zip                    | varchar(10)  | yes      | —                   | Mailing ZIP.                                  |
| metrc_facility_license | varchar(100) | yes      | —                   | Metrc facility license string.                |
| created_at             | timestamptz  | no       | `NOW()`             | Row created.                                  |
| updated_at             | timestamptz  | no       | `NOW()`             | Row last modified.                            |
| deleted_at             | timestamptz  | yes      | —                   | Soft-delete tombstone.                        |

### dispensaries

A physical retail location. The tenancy unit every other domain table scopes through.

| Column                   | Type          | Nullable | Default             | Description                                              |
| ------------------------ | ------------- | -------- | ------------------- | -------------------------------------------------------- |
| **entity_id**            | uuid          | no       | `gen_random_uuid()` | PK.                                                      |
| company_id               | uuid          | no       | —                   | FK → companies.company_id.                               |
| type                     | varchar(50)   | no       | `'dispensary'`      | `dispensary` / `delivery` / etc.                         |
| name                     | varchar(255)  | no       | —                   | Display name.                                            |
| slug                     | varchar(100)  | no       | —                   | Subdomain / URL slug for storefront resolution.          |
| license_number           | varchar(100)  | yes      | —                   | State dispensary license.                                |
| license_type             | varchar(100)  | yes      | —                   | License classification.                                  |
| address_line1            | varchar(255)  | yes      | —                   | Storefront street.                                       |
| city                     | varchar(100)  | yes      | —                   | Storefront city.                                         |
| state                    | varchar(2)    | no       | —                   | Two-letter state code.                                   |
| zip                      | varchar(10)   | yes      | —                   | Storefront ZIP.                                          |
| latitude                 | numeric(10,7) | yes      | —                   | Geocoded latitude.                                       |
| longitude                | numeric(10,7) | yes      | —                   | Geocoded longitude.                                      |
| county                   | varchar(100)  | yes      | —                   | County name.                                             |
| municipality             | varchar(100)  | yes      | —                   | City/town for local tax.                                 |
| phone                    | varchar(20)   | yes      | —                   | Storefront phone.                                        |
| email                    | varchar(255)  | yes      | —                   | Storefront contact.                                      |
| website                  | varchar(255)  | yes      | —                   | Storefront marketing site.                               |
| is_active                | boolean       | no       | `true`              | Whether dispensary serves traffic.                       |
| is_delivery_enabled      | boolean       | no       | `false`             | Delivery fulfillment toggle.                             |
| is_pickup_enabled        | boolean       | no       | `false`             | In-store pickup toggle.                                  |
| metrc_license_number     | varchar(100)  | yes      | —                   | License string used in Metrc API calls.                  |
| timezone                 | varchar(50)   | yes      | —                   | IANA tz (e.g. `America/New_York`).                       |
| cash_discount_percent    | numeric(5,2)  | yes      | `0`                 | Discount applied to cash payments.                       |
| is_cash_enabled          | boolean       | no       | `true`              | Whether cash is an accepted method.                      |
| cash_delivery_enabled    | boolean       | no       | `true`              | Whether cash-on-delivery is accepted.                    |
| active_payment_processor | text          | yes      | —                   | `aeropay` or `canpay`; NULL = cash-only (sc-214/sc-217). |
| design_system            | varchar(50)   | no       | `'casual'`          | Selected theme preset code.                              |
| design_system_file       | varchar(100)  | no       | `'casual.css'`      | Theme CSS filename served by the API.                    |
| created_at               | timestamptz   | no       | `NOW()`             | Row created.                                             |
| updated_at               | timestamptz   | no       | `NOW()`             | Row last modified.                                       |
| deleted_at               | timestamptz   | yes      | —                   | Soft-delete tombstone.                                   |

---

## 2. Users, profiles, sessions

### users

One row per human (customer, staff, super-admin) and per service principal (kiosk operator).

| Column              | Type        | Nullable | Default             | Description                                                                     |
| ------------------- | ----------- | -------- | ------------------- | ------------------------------------------------------------------------------- |
| **id**              | uuid        | no       | `gen_random_uuid()` | PK.                                                                             |
| email               | varchar     | no       | —                   | Unique login email.                                                             |
| password_hash       | varchar     | yes      | —                   | Bcrypt hash; NULL for OAuth-only or kiosk-derived users.                        |
| role                | varchar     | no       | `'customer'`        | Role enum: `super_admin` / `dispensary_admin` / `staff` / `customer` / `kiosk`. |
| organization_id     | uuid        | yes      | —                   | FK → organizations.organization_id; NULL for super-admin.                       |
| dispensary_id       | uuid        | yes      | —                   | FK → dispensaries.entity_id; NULL for super-admin / org-admin.                  |
| first_name          | varchar     | yes      | —                   | Given name.                                                                     |
| last_name           | varchar     | yes      | —                   | Family name.                                                                    |
| is_active           | boolean     | no       | `true`              | Whether login is permitted.                                                     |
| email_verified      | boolean     | no       | `false`             | Email-confirmation flag.                                                        |
| last_login_at       | timestamptz | yes      | —                   | Most recent successful login.                                                   |
| password_changed_at | timestamptz | yes      | —                   | For forced-rotation policy.                                                     |
| created_at          | timestamptz | no       | `NOW()`             | Row created.                                                                    |
| updated_at          | timestamptz | no       | `NOW()`             | Row last modified.                                                              |

### customer_profiles

Per-customer profile extending `users` with cannabis-specific fields (age, medical card, loyalty).

| Column                  | Type          | Nullable | Default             | Description                                  |
| ----------------------- | ------------- | -------- | ------------------- | -------------------------------------------- |
| **profile_id**          | uuid          | no       | `gen_random_uuid()` | PK.                                          |
| user_id                 | uuid          | no       | —                   | FK → users.id; unique.                       |
| phone                   | varchar(20)   | yes      | —                   | Contact phone.                               |
| date_of_birth           | date          | yes      | —                   | Used to compute age.                         |
| age_verified            | boolean       | no       | `false`             | Whether 21+ check has been completed.        |
| age_verified_at         | timestamptz   | yes      | —                   | When the most recent verification ran.       |
| age_verification_method | varchar(30)   | yes      | —                   | `id_scan` / `manual_check` / etc.            |
| id_document_type        | varchar(30)   | yes      | —                   | `drivers_license` / `state_id` / `passport`. |
| is_medical_patient      | boolean       | no       | `false`             | Medical-patient eligibility flag.            |
| medical_card_number     | varchar(50)   | yes      | —                   | State medical card number.                   |
| preferred_dispensary_id | uuid          | yes      | —                   | FK → dispensaries.entity_id; sticky default. |
| marketing_opt_in        | boolean       | no       | `false`             | Email-marketing consent.                     |
| sms_opt_in              | boolean       | no       | `false`             | SMS consent.                                 |
| loyalty_points          | int           | no       | `0`                 | Accrued loyalty point balance.               |
| total_orders            | int           | no       | `0`                 | Lifetime order count.                        |
| total_spent             | numeric(12,2) | no       | `0`                 | Lifetime spend.                              |
| last_order_at           | timestamptz   | yes      | —                   | Most recent order placement.                 |
| created_at              | timestamptz   | no       | `NOW()`             | Row created.                                 |
| updated_at              | timestamptz   | no       | `NOW()`             | Row last modified.                           |

### customer_addresses

Saved shipping/delivery addresses for customers.

| Column                | Type          | Nullable | Default             | Description                              |
| --------------------- | ------------- | -------- | ------------------- | ---------------------------------------- |
| **address_id**        | uuid          | no       | `gen_random_uuid()` | PK.                                      |
| user_id               | uuid          | no       | —                   | FK → users.id.                           |
| label                 | varchar(50)   | no       | `'Home'`            | UI label (Home, Work, …).                |
| address_line1         | varchar(255)  | no       | —                   | Street.                                  |
| address_line2         | varchar(255)  | yes      | —                   | Apt/suite.                               |
| city                  | varchar(100)  | no       | —                   | City.                                    |
| state                 | varchar(5)    | no       | —                   | State code.                              |
| zip                   | varchar(10)   | no       | —                   | ZIP.                                     |
| latitude              | numeric(10,7) | yes      | —                   | Geocoded latitude for delivery routing.  |
| longitude             | numeric(10,7) | yes      | —                   | Geocoded longitude for delivery routing. |
| is_default            | boolean       | no       | `false`             | Default shipping address flag.           |
| delivery_instructions | text          | yes      | —                   | Free-form driver note.                   |
| created_at            | timestamptz   | no       | `NOW()`             | Row created.                             |

### age_verifications

Audit row written every time a customer is age-checked.

| Column              | Type        | Nullable | Default             | Description                                             |
| ------------------- | ----------- | -------- | ------------------- | ------------------------------------------------------- |
| **verification_id** | uuid        | no       | `gen_random_uuid()` | PK.                                                     |
| user_id             | uuid        | no       | —                   | FK → users.id.                                          |
| dispensary_id       | uuid        | yes      | —                   | FK → dispensaries.entity_id; NULL for org-level verify. |
| method              | varchar(30) | no       | —                   | `id_scan` / `manual` / `self_attest`.                   |
| id_type             | varchar(30) | yes      | —                   | Document type used.                                     |
| date_of_birth       | date        | yes      | —                   | DOB read from the document.                             |
| calculated_age      | int         | yes      | —                   | Age at time of verification.                            |
| result              | varchar(20) | no       | —                   | `pass` / `fail` / `manual_review`.                      |
| failure_reason      | text        | yes      | —                   | Why a failure was recorded.                             |
| created_at          | timestamptz | no       | `NOW()`             | Verification timestamp.                                 |

### refresh_tokens

Long-lived refresh tokens issued alongside JWT access tokens.

| Column          | Type        | Nullable | Default             | Description                                 |
| --------------- | ----------- | -------- | ------------------- | ------------------------------------------- |
| **id**          | uuid        | no       | `gen_random_uuid()` | PK.                                         |
| user_id         | uuid        | no       | —                   | FK → users.id.                              |
| token_hash      | varchar     | no       | —                   | SHA-256 hash of the refresh secret; unique. |
| dispensary_id   | uuid        | yes      | —                   | Captured for cross-tenant scoping.          |
| organization_id | uuid        | yes      | —                   | Captured for cross-tenant scoping.          |
| expires_at      | timestamptz | no       | —                   | Token expiry.                               |
| is_revoked      | boolean     | no       | `false`             | Whether the token has been invalidated.     |
| revoked_at      | timestamptz | yes      | —                   | When revocation happened.                   |
| user_agent      | varchar     | yes      | —                   | UA string at issuance.                      |
| ip_address      | varchar     | yes      | —                   | IP at issuance.                             |
| created_at      | timestamptz | no       | `NOW()`             | Issued at.                                  |

### kiosk_devices

One row per provisioned in-store kiosk; rotating `current_token_id` invalidates prior tokens.

| Column           | Type        | Nullable | Default             | Description                                                                   |
| ---------------- | ----------- | -------- | ------------------- | ----------------------------------------------------------------------------- |
| **id**           | uuid        | no       | `gen_random_uuid()` | PK.                                                                           |
| user_id          | uuid        | no       | —                   | FK → users.id; unique. The synthetic kiosk operator user.                     |
| dispensary_id    | uuid        | no       | —                   | FK → dispensaries.entity_id.                                                  |
| label            | varchar     | no       | —                   | Display name (e.g. "Front Counter").                                          |
| current_token_id | uuid        | no       | —                   | The only valid `tokenId` JWT claim — rotated on re-provision (sc-474).        |
| public_key       | text        | yes      | —                   | SPKI ECDSA P-256 PEM used for signature verification; NULL on legacy devices. |
| created_at       | timestamptz | no       | `NOW()`             | Row created.                                                                  |
| updated_at       | timestamptz | no       | `NOW()`             | Row last modified.                                                            |

### employee_profiles

Per-staff-user profile with HR/payroll fields, scoped to one dispensary.

| Column                         | Type          | Nullable | Default             | Description                             |
| ------------------------------ | ------------- | -------- | ------------------- | --------------------------------------- |
| **profile_id**                 | uuid          | no       | `gen_random_uuid()` | PK.                                     |
| user_id                        | uuid          | no       | —                   | FK → users.id; unique.                  |
| dispensary_id                  | uuid          | no       | —                   | FK → dispensaries.entity_id.            |
| position_id                    | int           | yes      | —                   | FK → lkp_positions.position_id.         |
| employee_number                | varchar(20)   | yes      | —                   | Operator-assigned employee number.      |
| department                     | varchar(50)   | yes      | —                   | Department code.                        |
| employment_type                | varchar(20)   | no       | `'full_time'`       | `full_time` / `part_time` / `contract`. |
| employment_status              | varchar(20)   | no       | `'active'`          | `active` / `on_leave` / `terminated`.   |
| hire_date                      | date          | no       | —                   | First day of employment.                |
| termination_date               | date          | yes      | —                   | Last day of employment.                 |
| termination_reason             | text          | yes      | —                   | Free-form termination note.             |
| hourly_rate                    | numeric(8,2)  | yes      | —                   | Hourly wage.                            |
| salary                         | numeric(10,2) | yes      | —                   | Annual salary.                          |
| pay_type                       | varchar(10)   | no       | `'hourly'`          | `hourly` / `salary`.                    |
| overtime_eligible              | boolean       | no       | `true`              | Whether OT rules apply.                 |
| phone                          | varchar(20)   | yes      | —                   | Personal phone.                         |
| emergency_contact_name         | varchar(100)  | yes      | —                   | Emergency contact.                      |
| emergency_contact_phone        | varchar(20)   | yes      | —                   | Emergency contact phone.                |
| emergency_contact_relationship | varchar(50)   | yes      | —                   | Emergency contact relationship.         |
| is_exempt                      | boolean       | no       | `false`             | FLSA exempt flag.                       |
| exempt_reason                  | varchar(100)  | yes      | —                   | Reason for exemption.                   |
| notes                          | text          | yes      | —                   | HR free-form notes.                     |
| created_at                     | timestamptz   | no       | `NOW()`             | Row created.                            |
| updated_at                     | timestamptz   | no       | `NOW()`             | Row last modified.                      |

---

## 3. Products & catalog

### brands

A consumer-facing brand. Scoped to an organization (cross-dispensary within the same operator).

| Column          | Type         | Nullable | Default             | Description                         |
| --------------- | ------------ | -------- | ------------------- | ----------------------------------- |
| **brand_id**    | uuid         | no       | `gen_random_uuid()` | PK.                                 |
| organization_id | uuid         | no       | —                   | FK → organizations.organization_id. |
| name            | varchar(255) | no       | —                   | Brand display name.                 |
| slug            | varchar(100) | yes      | —                   | URL-safe slug.                      |
| description     | text         | yes      | —                   | Marketing copy.                     |
| logo_url        | varchar(500) | yes      | —                   | Brand logo URL.                     |
| website_url     | varchar(500) | yes      | —                   | Brand website.                      |
| is_active       | boolean      | no       | `true`              | Whether brand surfaces in catalog.  |
| created_at      | timestamptz  | no       | `NOW()`             | Row created.                        |
| updated_at      | timestamptz  | no       | `NOW()`             | Row last modified.                  |
| deleted_at      | timestamptz  | yes      | —                   | Soft-delete tombstone.              |

### manufacturers

The licensed entity that physically produced a product.

| Column              | Type         | Nullable | Default             | Description                 |
| ------------------- | ------------ | -------- | ------------------- | --------------------------- |
| **manufacturer_id** | uuid         | no       | `gen_random_uuid()` | PK.                         |
| brand_id            | uuid         | yes      | —                   | FK → brands.brand_id.       |
| legal_name          | varchar(255) | no       | —                   | Registered legal name.      |
| dba_name            | varchar(255) | yes      | —                   | "Doing business as".        |
| license_number      | varchar(100) | yes      | —                   | State manufacturer license. |
| license_type        | varchar(100) | yes      | —                   | License classification.     |
| license_state       | varchar(2)   | yes      | —                   | Two-letter state code.      |
| license_expiry_date | date         | yes      | —                   | License expiration.         |
| address_line1       | varchar(255) | yes      | —                   | Address.                    |
| city                | varchar(100) | yes      | —                   | City.                       |
| state               | varchar(2)   | yes      | —                   | State.                      |
| zip                 | varchar(10)  | yes      | —                   | ZIP.                        |
| contact_email       | varchar(255) | yes      | —                   | Contact email.              |
| contact_phone       | varchar(20)  | yes      | —                   | Contact phone.              |
| is_active           | boolean      | no       | `true`              | Active flag.                |
| created_at          | timestamptz  | no       | `NOW()`             | Row created.                |
| updated_at          | timestamptz  | no       | `NOW()`             | Row last modified.          |
| deleted_at          | timestamptz  | yes      | —                   | Soft-delete tombstone.      |

### strain_data

Reference strain library (sourced from Otreeba/OCPC). Shared across operators.

| Column             | Type         | Nullable | Default             | Description                     |
| ------------------ | ------------ | -------- | ------------------- | ------------------------------- |
| **strain_data_id** | uuid         | no       | `gen_random_uuid()` | PK.                             |
| ocpc               | varchar(50)  | yes      | —                   | Otreeba OCPC; unique.           |
| name               | varchar(255) | no       | —                   | Strain name.                    |
| type               | varchar(20)  | yes      | —                   | `sativa` / `indica` / `hybrid`. |
| description        | text         | yes      | —                   | Strain marketing copy.          |
| effects            | jsonb        | no       | `'[]'`              | Array of effect codes.          |
| flavors            | jsonb        | no       | `'[]'`              | Array of flavor codes.          |
| terpenes           | jsonb        | no       | `'[]'`              | Array of terpene profiles.      |
| lineage            | jsonb        | no       | `'{}'`              | Parent strain references.       |
| genetics           | varchar(500) | yes      | —                   | Free-form genetic lineage.      |
| thc_avg            | numeric(6,3) | yes      | —                   | Average THC %.                  |
| cbd_avg            | numeric(6,3) | yes      | —                   | Average CBD %.                  |
| photo_url          | varchar(500) | yes      | —                   | Strain hero image.              |
| source             | varchar(50)  | yes      | `'otreeba'`         | Where the row was sourced.      |
| last_synced_at     | timestamptz  | yes      | —                   | Last upstream sync.             |
| created_at         | timestamptz  | no       | `NOW()`             | Row created.                    |
| updated_at         | timestamptz  | no       | `NOW()`             | Row last modified.              |

### products

Per-dispensary catalog SKU. Holds taxonomy IDs, strain metadata, compliance flags.

| Column                      | Type          | Nullable | Default             | Description                                                  |
| --------------------------- | ------------- | -------- | ------------------- | ------------------------------------------------------------ |
| **id**                      | uuid          | no       | `gen_random_uuid()` | PK.                                                          |
| dispensary_id               | uuid          | no       | —                   | FK → dispensaries.entity_id.                                 |
| brand_id                    | uuid          | yes      | —                   | FK → brands.brand_id.                                        |
| manufacturer_id             | uuid          | yes      | —                   | FK → manufacturers.manufacturer_id.                          |
| strain_id                   | uuid          | yes      | —                   | FK → strain_data.strain_data_id.                             |
| product_type_id             | int           | yes      | —                   | FK → lkp_product_types.product_type_id.                      |
| primary_category_id         | int           | yes      | —                   | FK → lkp_product_categories.category_id.                     |
| tax_category_id             | int           | yes      | —                   | FK → lkp_tax_categories.tax_category_id.                     |
| packaging_type_id           | int           | yes      | —                   | FK → lkp_packaging_types.packaging_type_id.                  |
| extraction_method_id        | int           | yes      | —                   | FK → lkp_extraction_methods.extraction_method_id.            |
| uom_id                      | int           | yes      | —                   | FK → lkp_unit_of_measure.uom_id.                             |
| metrc_item_category_id      | int           | yes      | —                   | FK → lkp_metrc_item_categories.metrc_category_id.            |
| strain_name                 | varchar(255)  | yes      | —                   | Denormalized strain name.                                    |
| strain_type                 | varchar(20)   | yes      | —                   | Denormalized strain type.                                    |
| effects                     | jsonb         | no       | `'[]'`              | Override effect tags.                                        |
| flavors                     | jsonb         | no       | `'[]'`              | Override flavor tags.                                        |
| terpenes                    | jsonb         | no       | `'[]'`              | Override terpene tags.                                       |
| lineage                     | jsonb         | no       | `'{}'`              | Override lineage.                                            |
| otreeba_ocpc                | varchar(50)   | yes      | —                   | OCPC link back to strain library.                            |
| enriched_at                 | timestamptz   | yes      | —                   | Last enrichment pass timestamp.                              |
| name                        | varchar(255)  | no       | —                   | Product display name.                                        |
| sort_order                  | int           | yes      | —                   | Admin-defined manual sort order (sc-682c); NULL = name sort. |
| description                 | text          | yes      | —                   | Long-form copy.                                              |
| short_description           | text          | yes      | —                   | Listing-tile copy.                                           |
| sku                         | varchar(100)  | yes      | —                   | Operator-assigned SKU; unique.                               |
| metrc_item_uid              | varchar(50)   | yes      | —                   | Metrc Item identifier.                                       |
| net_weight_g                | numeric(10,4) | yes      | —                   | Net weight in grams.                                         |
| net_volume_ml               | numeric(10,4) | yes      | —                   | Net volume in mL.                                            |
| thc_percent                 | numeric(6,3)  | yes      | —                   | Listed THC potency.                                          |
| cbd_percent                 | numeric(6,3)  | yes      | —                   | Listed CBD potency.                                          |
| total_thc_mg_per_container  | numeric(10,4) | yes      | —                   | Total mg THC per package.                                    |
| is_hemp_derived             | boolean       | no       | `false`             | Hemp-derived product flag.                                   |
| is_child_resistant_packaged | boolean       | no       | `false`             | Compliance: CRP packaging.                                   |
| is_tamper_evident           | boolean       | no       | `false`             | Compliance: tamper-evident.                                  |
| is_resealable               | boolean       | no       | `false`             | Compliance: resealable.                                      |
| has_no_minor_appeals        | boolean       | no       | `true`              | Compliance: no kid-appeal claims.                            |
| is_active                   | boolean       | no       | `false`             | Whether product surfaces in storefront.                      |
| is_approved                 | boolean       | no       | `false`             | Admin-approved-for-sale flag.                                |
| approved_by_user_id         | uuid          | yes      | —                   | FK → users.id (approver).                                    |
| approved_at                 | timestamptz   | yes      | —                   | Approval timestamp.                                          |
| created_at                  | timestamptz   | no       | `NOW()`             | Row created.                                                 |
| updated_at                  | timestamptz   | no       | `NOW()`             | Row last modified.                                           |
| deleted_at                  | timestamptz   | yes      | —                   | Soft-delete tombstone.                                       |

### product_variants

Sellable SKU under a product (e.g. 1g vs. 3.5g jar). Inventory tracking lives at the variant level.

| Column              | Type          | Nullable | Default             | Description                         |
| ------------------- | ------------- | -------- | ------------------- | ----------------------------------- |
| **variant_id**      | uuid          | no       | `gen_random_uuid()` | PK.                                 |
| product_id          | uuid          | no       | —                   | FK → products.id.                   |
| dispensary_id       | uuid          | no       | —                   | FK → dispensaries.entity_id.        |
| uom_id              | int           | yes      | —                   | FK → lkp_unit_of_measure.uom_id.    |
| name                | varchar(100)  | no       | —                   | Variant display name.               |
| quantity_per_unit   | numeric(10,4) | yes      | —                   | UoM quantity per packaged unit.     |
| sku                 | varchar(100)  | yes      | —                   | Variant SKU.                        |
| barcode             | varchar(100)  | yes      | —                   | UPC/EAN.                            |
| metrc_package_label | varchar(100)  | yes      | —                   | Metrc package tag for this variant. |
| is_active           | boolean       | no       | `true`              | Whether variant is sellable.        |
| sort_order          | int           | yes      | —                   | Display order in variant list.      |
| created_at          | timestamptz   | no       | `NOW()`             | Row created.                        |
| updated_at          | timestamptz   | no       | `NOW()`             | Row last modified.                  |
| deleted_at          | timestamptz   | yes      | —                   | Soft-delete tombstone.              |

### product_batches

A received lot of a variant with batch-level provenance and remaining quantity.

| Column              | Type          | Nullable | Default             | Description                                     |
| ------------------- | ------------- | -------- | ------------------- | ----------------------------------------------- |
| **batch_id**        | uuid          | no       | `gen_random_uuid()` | PK.                                             |
| variant_id          | uuid          | no       | —                   | FK → product_variants.variant_id.               |
| dispensary_id       | uuid          | no       | —                   | FK → dispensaries.entity_id.                    |
| manufacturer_id     | uuid          | yes      | —                   | FK → manufacturers.manufacturer_id.             |
| uom_id              | int           | yes      | —                   | FK → lkp_unit_of_measure.uom_id.                |
| lot_number          | varchar(100)  | yes      | —                   | Manufacturer lot identifier.                    |
| metrc_package_label | varchar(100)  | yes      | —                   | Metrc package tag at batch level.               |
| quantity_received   | numeric(10,4) | no       | `0`                 | Quantity at receive time.                       |
| quantity_remaining  | numeric(10,4) | no       | `0`                 | Current remaining quantity in this batch.       |
| status              | varchar(20)   | no       | `'active'`          | `active` / `recalled` / `depleted` / `expired`. |
| manufacture_date    | date          | yes      | —                   | Manufacture date.                               |
| expiry_date         | date          | yes      | —                   | Expiry.                                         |
| received_at         | timestamptz   | yes      | —                   | Receive timestamp.                              |
| received_by_user_id | uuid          | yes      | —                   | FK → users.id (receiver).                       |
| recall_id           | uuid          | yes      | —                   | Reference to recall record (if any).            |
| created_at          | timestamptz   | no       | `NOW()`             | Row created.                                    |
| updated_at          | timestamptz   | no       | `NOW()`             | Row last modified.                              |

### product_pricing

Time-bounded price tier for a variant. Multiple rows form a price history.

| Column           | Type          | Nullable | Default             | Description                           |
| ---------------- | ------------- | -------- | ------------------- | ------------------------------------- |
| **pricing_id**   | uuid          | no       | `gen_random_uuid()` | PK.                                   |
| variant_id       | uuid          | no       | —                   | FK → product_variants.variant_id.     |
| dispensary_id    | uuid          | no       | —                   | FK → dispensaries.entity_id.          |
| price_type       | varchar(20)   | no       | `'retail'`          | `retail` / `medical` / `staff` / etc. |
| price            | numeric(10,2) | no       | —                   | The active price.                     |
| compare_at_price | numeric(10,2) | yes      | —                   | Strikethrough MSRP.                   |
| effective_from   | timestamptz   | no       | —                   | When this price starts being active.  |
| effective_until  | timestamptz   | yes      | —                   | When it stops; NULL = open-ended.     |
| set_by_user_id   | uuid          | yes      | —                   | FK → users.id (who set it).           |
| created_at       | timestamptz   | no       | `NOW()`             | Row created.                          |

### lab_tests

One COA per batch.

| Column             | Type         | Nullable | Default             | Description                     |
| ------------------ | ------------ | -------- | ------------------- | ------------------------------- |
| **lab_test_id**    | uuid         | no       | `gen_random_uuid()` | PK.                             |
| batch_id           | uuid         | no       | —                   | FK → product_batches.batch_id.  |
| dispensary_id      | uuid         | no       | —                   | FK → dispensaries.entity_id.    |
| lab_name           | varchar(255) | yes      | —                   | Testing lab.                    |
| lab_license_number | varchar(100) | yes      | —                   | Lab license.                    |
| coa_number         | varchar(100) | yes      | —                   | Certificate of Analysis number. |
| coa_document_url   | varchar(500) | yes      | —                   | URL to the COA PDF.             |
| coa_qr_code_url    | varchar(500) | yes      | —                   | Public QR-code landing page.    |
| overall_result     | varchar(20)  | no       | `'pending'`         | `pending` / `pass` / `fail`.    |
| tested_at          | date         | yes      | —                   | Test date.                      |
| created_at         | timestamptz  | no       | `NOW()`             | Row created.                    |
| updated_at         | timestamptz  | no       | `NOW()`             | Row last modified.              |

### lab_test_results

Per-analyte row hanging off a `lab_tests` parent.

| Column           | Type          | Nullable | Default             | Description                                    |
| ---------------- | ------------- | -------- | ------------------- | ---------------------------------------------- |
| **result_id**    | uuid          | no       | `gen_random_uuid()` | PK.                                            |
| lab_test_id      | uuid          | no       | —                   | FK → lab_tests.lab_test_id.                    |
| test_category_id | int           | no       | —                   | FK → lkp_lab_test_categories.test_category_id. |
| analyte_name     | varchar(100)  | no       | —                   | The analyte tested (e.g. THC, lead).           |
| unit             | varchar(20)   | yes      | —                   | Measurement unit.                              |
| value            | numeric(10,6) | yes      | —                   | Measured value.                                |
| action_limit     | numeric(10,6) | yes      | —                   | Action / pass threshold.                       |
| result           | varchar(20)   | no       | `'pass'`            | `pass` / `fail` / `pending`.                   |
| created_at       | timestamptz   | no       | `NOW()`             | Row created.                                   |

---

## 4. Inventory & stock movement

### inventory

Per-dispensary, per-variant stock row. One row per (dispensary, variant) tuple.

| Column                | Type          | Nullable | Default             | Description                                                                     |
| --------------------- | ------------- | -------- | ------------------- | ------------------------------------------------------------------------------- |
| **inventory_id**      | uuid          | no       | `gen_random_uuid()` | PK.                                                                             |
| variant_id            | uuid          | no       | —                   | FK → product_variants.variant_id.                                               |
| dispensary_id         | uuid          | no       | —                   | FK → dispensaries.entity_id.                                                    |
| quantity_on_hand      | numeric(12,4) | no       | `0`                 | Physical stock count.                                                           |
| quantity_reserved     | numeric(12,4) | no       | `0`                 | Held by open carts/orders.                                                      |
| quantity_available    | numeric(12,4) | no       | `0`                 | `on_hand - reserved` (maintained in app code).                                  |
| reorder_threshold     | numeric(12,4) | yes      | —                   | Low-stock alert fires when `quantity_available` drops to ≤ this value (sc-674). |
| reorder_quantity      | numeric(12,4) | yes      | —                   | Suggested reorder amount.                                                       |
| location_in_store     | varchar(200)  | yes      | —                   | Shelf/bin location label.                                                       |
| last_metrc_sync_at    | timestamptz   | yes      | —                   | Last Metrc reconcile.                                                           |
| last_reconciled_at    | timestamptz   | yes      | —                   | Last local reconcile.                                                           |
| last_count_at         | timestamptz   | yes      | —                   | Last physical count.                                                            |
| last_count_by_user_id | uuid          | yes      | —                   | FK → users.id (who counted).                                                    |
| created_at            | timestamptz   | no       | `NOW()`             | Row created.                                                                    |
| updated_at            | timestamptz   | no       | `NOW()`             | Row last modified.                                                              |

### inventory_transactions

Immutable ledger of every stock movement (sale, receive, adjust, transfer, count).

| Column                         | Type          | Nullable | Default             | Description                                                               |
| ------------------------------ | ------------- | -------- | ------------------- | ------------------------------------------------------------------------- |
| **transaction_id**             | uuid          | no       | `gen_random_uuid()` | PK.                                                                       |
| inventory_id                   | uuid          | no       | —                   | FK → inventory.inventory_id.                                              |
| batch_id                       | uuid          | yes      | —                   | FK → product_batches.batch_id.                                            |
| dispensary_id                  | uuid          | no       | —                   | FK → dispensaries.entity_id.                                              |
| transaction_type               | varchar       | no       | —                   | `sale` / `receive` / `adjust` / `transfer_in` / `transfer_out` / `count`. |
| adjustment_reason_id           | smallint      | yes      | —                   | FK → lkp_adjustment_reasons.reason_id when type=`adjust`.                 |
| quantity_delta                 | numeric(12,4) | no       | —                   | Signed change applied.                                                    |
| quantity_before                | numeric(12,4) | no       | —                   | `quantity_on_hand` before this txn.                                       |
| quantity_after                 | numeric(12,4) | no       | —                   | `quantity_on_hand` after this txn.                                        |
| reference_order_id             | uuid          | yes      | —                   | FK → orders.orderId for sale txns.                                        |
| reference_transfer_manifest_id | varchar(100)  | yes      | —                   | Metrc manifest ID for transfer txns.                                      |
| performed_by_user_id           | uuid          | yes      | —                   | FK → users.id.                                                            |
| metrc_synced                   | boolean       | no       | `false`             | Whether Metrc has been notified.                                          |
| metrc_synced_at                | timestamptz   | yes      | —                   | When Metrc sync succeeded.                                                |
| notes                          | text          | yes      | —                   | Free-form note.                                                           |
| created_at                     | timestamptz   | no       | `NOW()`             | Ledger timestamp (immutable).                                             |

### inventory_transfers

A transfer of stock between two dispensaries inside the same organization.

| Column               | Type         | Nullable | Default             | Description                                                     |
| -------------------- | ------------ | -------- | ------------------- | --------------------------------------------------------------- |
| **transfer_id**      | uuid         | no       | `gen_random_uuid()` | PK.                                                             |
| organization_id      | uuid         | no       | —                   | FK → organizations.organization_id.                             |
| from_dispensary_id   | uuid         | no       | —                   | FK → dispensaries.entity_id (origin).                           |
| to_dispensary_id     | uuid         | no       | —                   | FK → dispensaries.entity_id (destination).                      |
| status               | varchar(20)  | no       | `'requested'`       | `requested` / `approved` / `shipped` / `received` / `rejected`. |
| requested_by_user_id | uuid         | no       | —                   | FK → users.id.                                                  |
| approved_by_user_id  | uuid         | yes      | —                   | FK → users.id.                                                  |
| approved_at          | timestamptz  | yes      | —                   | Approval timestamp.                                             |
| shipped_at           | timestamptz  | yes      | —                   | Ship timestamp.                                                 |
| received_at          | timestamptz  | yes      | —                   | Receive timestamp.                                              |
| metrc_manifest_id    | varchar(100) | yes      | —                   | Metrc transfer manifest ID.                                     |
| notes                | text         | yes      | —                   | Free-form note.                                                 |
| rejection_reason     | text         | yes      | —                   | Reason if rejected.                                             |
| created_at           | timestamptz  | no       | `NOW()`             | Row created.                                                    |
| updated_at           | timestamptz  | no       | `NOW()`             | Row last modified.                                              |

### inventory_transfer_items

Per-variant line on a transfer.

| Column             | Type         | Nullable | Default             | Description                           |
| ------------------ | ------------ | -------- | ------------------- | ------------------------------------- |
| **item_id**        | uuid         | no       | `gen_random_uuid()` | PK.                                   |
| transfer_id        | uuid         | no       | —                   | FK → inventory_transfers.transfer_id. |
| variant_id         | uuid         | no       | —                   | FK → product_variants.variant_id.     |
| product_name       | varchar(255) | no       | —                   | Denormalized product name.            |
| variant_name       | varchar(100) | yes      | —                   | Denormalized variant name.            |
| quantity_requested | int          | no       | —                   | Asked for.                            |
| quantity_shipped   | int          | yes      | —                   | Actually shipped.                     |
| quantity_received  | int          | yes      | —                   | Actually received.                    |
| metrc_package_tag  | varchar(100) | yes      | —                   | Metrc package tag for this line.      |
| notes              | text         | yes      | —                   | Free-form note.                       |

### inventory_counts

A physical count cycle (cycle / annual).

| Column               | Type        | Nullable | Default             | Description                                |
| -------------------- | ----------- | -------- | ------------------- | ------------------------------------------ |
| **count_id**         | uuid        | no       | `gen_random_uuid()` | PK.                                        |
| dispensary_id        | uuid        | no       | —                   | FK → dispensaries.entity_id.               |
| count_type           | varchar(20) | no       | `'cycle'`           | `cycle` / `full` / `spot`.                 |
| status               | varchar(20) | no       | `'in_progress'`     | `in_progress` / `completed` / `cancelled`. |
| started_by_user_id   | uuid        | no       | —                   | FK → users.id.                             |
| completed_by_user_id | uuid        | yes      | —                   | FK → users.id.                             |
| started_at           | timestamptz | no       | —                   | Start timestamp.                           |
| completed_at         | timestamptz | yes      | —                   | Completion timestamp.                      |
| notes                | text        | yes      | —                   | Free-form note.                            |
| total_items          | int         | no       | `0`                 | Count items in scope.                      |
| items_counted        | int         | no       | `0`                 | Items physically counted.                  |
| variance_count       | int         | no       | `0`                 | Items with non-zero variance.              |
| created_at           | timestamptz | no       | `NOW()`             | Row created.                               |
| updated_at           | timestamptz | no       | `NOW()`             | Row last modified.                         |

### inventory_count_items

Per-variant line in a count.

| Column             | Type         | Nullable | Default             | Description                                                    |
| ------------------ | ------------ | -------- | ------------------- | -------------------------------------------------------------- |
| **count_item_id**  | uuid         | no       | `gen_random_uuid()` | PK.                                                            |
| count_id           | uuid         | no       | —                   | FK → inventory_counts.count_id.                                |
| variant_id         | uuid         | no       | —                   | FK → product_variants.variant_id.                              |
| product_name       | varchar(255) | no       | —                   | Denormalized product name.                                     |
| variant_name       | varchar(100) | yes      | —                   | Denormalized variant name.                                     |
| expected_quantity  | int          | no       | `0`                 | System's expected quantity.                                    |
| counted_quantity   | int          | yes      | —                   | Physically counted quantity.                                   |
| variance           | int          | yes      | —                   | Generated column = `counted - expected` (insert/update=false). |
| counted_by_user_id | uuid         | yes      | —                   | FK → users.id.                                                 |
| counted_at         | timestamptz  | yes      | —                   | Count timestamp.                                               |
| notes              | text         | yes      | —                   | Free-form note.                                                |

### inventory_adjustments

Discrete adjustment request with optional approval workflow.

| Column               | Type         | Nullable | Default             | Description                            |
| -------------------- | ------------ | -------- | ------------------- | -------------------------------------- |
| **adjustment_id**    | uuid         | no       | `gen_random_uuid()` | PK.                                    |
| dispensary_id        | uuid         | no       | —                   | FK → dispensaries.entity_id.           |
| variant_id           | uuid         | no       | —                   | FK → product_variants.variant_id.      |
| product_name         | varchar(255) | no       | —                   | Denormalized product name.             |
| reason_id            | int          | no       | —                   | FK → lkp_adjustment_reasons.reason_id. |
| quantity_change      | int          | no       | —                   | Signed delta requested.                |
| quantity_before      | int          | no       | —                   | Quantity before applying.              |
| quantity_after       | int          | no       | —                   | Quantity after applying.               |
| status               | varchar(20)  | no       | `'pending'`         | `pending` / `approved` / `rejected`.   |
| submitted_by_user_id | uuid         | no       | —                   | FK → users.id.                         |
| approved_by_user_id  | uuid         | yes      | —                   | FK → users.id.                         |
| approved_at          | timestamptz  | yes      | —                   | Approval timestamp.                    |
| notes                | text         | yes      | —                   | Free-form note.                        |
| created_at           | timestamptz  | no       | `NOW()`             | Row created.                           |
| updated_at           | timestamptz  | no       | `NOW()`             | Row last modified.                     |

---

## 5. Orders, line items, payments

> Legacy camelCase tables — column identifiers are quoted as written below.

### orders

Customer order header with status, totals, fulfillment metadata, Metrc receipt sync.

| Column                  | Type          | Nullable | Default             | Description                                                     |
| ----------------------- | ------------- | -------- | ------------------- | --------------------------------------------------------------- |
| **`orderId`**           | uuid          | no       | `gen_random_uuid()` | PK.                                                             |
| `dispensaryId`          | uuid          | no       | —                   | FK → dispensaries.entity_id.                                    |
| `customerUserId`        | uuid          | yes      | —                   | FK → users.id; NULL for anonymous walk-in.                      |
| `staffUserId`           | uuid          | yes      | —                   | FK → users.id (staff who rang it up).                           |
| `orderType`             | varchar       | no       | `'pickup'`          | `pickup` / `delivery` / `in_store` / `kiosk`.                   |
| `orderStatus`           | varchar       | no       | `'draft'`           | Lifecycle state.                                                |
| `subtotal`              | numeric(10,2) | no       | `0`                 | Pre-tax line-item sum.                                          |
| `discountTotal`         | numeric(10,2) | no       | `0`                 | Sum of applied discounts.                                       |
| `taxTotal`              | numeric(10,2) | no       | `0`                 | Sum of tax components.                                          |
| `total`                 | numeric(10,2) | no       | `0`                 | Final charge total.                                             |
| `taxBreakdown`          | jsonb         | yes      | —                   | Per-jurisdiction tax detail (not exposed via GraphQL).          |
| `appliedPromotions`     | jsonb         | yes      | —                   | Array of applied promotion snapshots (not exposed via GraphQL). |
| `metrcReceiptId`        | varchar(100)  | yes      | —                   | Metrc sale receipt ID.                                          |
| `metrcReportedAt`       | timestamptz   | yes      | —                   | When Metrc sync succeeded.                                      |
| `metrcSyncStatus`       | varchar       | yes      | `'pending'`         | `pending` / `synced` / `failed`.                                |
| `payment_method`        | varchar       | yes      | `'cash'`            | Payment method used (snake_case override).                      |
| `cash_discount_applied` | numeric(10,2) | no       | `0`                 | Cash-discount value applied (snake_case override).              |
| `fulfillmentAddress`    | jsonb         | yes      | —                   | Snapshot of delivery address (denormalized).                    |
| `scheduledPickupAt`     | timestamptz   | yes      | —                   | Customer-selected pickup time.                                  |
| `notes`                 | text          | yes      | —                   | Free-form note.                                                 |
| `cancellationReason`    | text          | yes      | —                   | Reason if cancelled.                                            |
| `cancelledAt`           | timestamptz   | yes      | —                   | Cancellation timestamp.                                         |
| `createdAt`             | timestamptz   | no       | `NOW()`             | Row created.                                                    |
| `updatedAt`             | timestamptz   | no       | `NOW()`             | Row last modified.                                              |

### order_line_items

One row per cart line. Captures the price/tax/discount snapshot at sale time.

| Column              | Type          | Nullable | Default             | Description                                           |
| ------------------- | ------------- | -------- | ------------------- | ----------------------------------------------------- |
| **`lineItemId`**    | uuid          | no       | `gen_random_uuid()` | PK.                                                   |
| `orderId`           | uuid          | no       | —                   | FK → orders."orderId".                                |
| `productId`         | uuid          | no       | —                   | FK → products.id.                                     |
| `variantId`         | uuid          | yes      | —                   | FK → product_variants.variant_id.                     |
| `batchId`           | uuid          | yes      | —                   | FK → product_batches.batch_id (allocated batch).      |
| `quantity`          | numeric(12,4) | no       | —                   | Units sold.                                           |
| `unitPrice`         | numeric(10,2) | no       | —                   | Per-unit price at time of sale.                       |
| `discountApplied`   | numeric(10,2) | no       | `0`                 | Discount applied to this line.                        |
| `taxApplied`        | numeric(10,2) | no       | `0`                 | Tax applied to this line.                             |
| `metrcPackageLabel` | varchar(100)  | yes      | —                   | Metrc package tag for this line (Metrc sale receipt). |
| `metrcItemUid`      | varchar(100)  | yes      | —                   | Metrc Item identifier.                                |
| `thcMgPerUnit`      | numeric(10,4) | yes      | —                   | THC mg per unit at sale time.                         |
| `cbdMgPerUnit`      | numeric(10,4) | yes      | —                   | CBD mg per unit at sale time.                         |
| `createdAt`         | timestamptz   | no       | `NOW()`             | Row created.                                          |

### payments

A payment attempt against an order. Multiple rows allowed (split tender, retries).

| Column                   | Type          | Nullable | Default             | Description                                      |
| ------------------------ | ------------- | -------- | ------------------- | ------------------------------------------------ |
| **`paymentId`**          | uuid          | no       | `gen_random_uuid()` | PK.                                              |
| `orderId`                | uuid          | no       | —                   | FK → orders."orderId".                           |
| `dispensaryId`           | uuid          | no       | —                   | FK → dispensaries.entity_id.                     |
| `method`                 | varchar       | no       | `'cash'`            | `cash` / `aeropay` / `canpay` / `debit` etc.     |
| `amount`                 | numeric(10,2) | no       | —                   | Amount tendered.                                 |
| `status`                 | varchar       | no       | `'pending'`         | `pending` / `succeeded` / `failed` / `refunded`. |
| `terminalId`             | varchar(100)  | yes      | —                   | Register/terminal identifier.                    |
| `processorName`          | varchar(32)   | yes      | —                   | Processor used (aeropay / canpay).               |
| `processorTransactionId` | varchar(128)  | yes      | —                   | External processor txn ID.                       |
| `failureReason`          | varchar       | yes      | —                   | Processor failure reason.                        |
| `cashTendered`           | numeric(10,2) | yes      | —                   | Cash tendered (for cash method).                 |
| `changeGiven`            | numeric(10,2) | yes      | —                   | Change owed back (for cash method).              |
| `createdAt`              | timestamptz   | no       | `NOW()`             | Row created.                                     |
| `updatedAt`              | timestamptz   | no       | `NOW()`             | Row last modified.                               |

### dispensary_payment_processors

Per-dispensary toggle + encrypted credentials for each supported processor.

| Column                 | Type        | Nullable | Default             | Description                                                                |
| ---------------------- | ----------- | -------- | ------------------- | -------------------------------------------------------------------------- |
| **`id`**               | uuid        | no       | `gen_random_uuid()` | PK.                                                                        |
| `dispensaryId`         | uuid        | no       | —                   | FK → dispensaries.entity_id.                                               |
| `processorName`        | text        | no       | —                   | `aeropay` or `canpay`; unique with dispensaryId.                           |
| `isEnabled`            | boolean     | no       | `false`             | Whether new orders can use this processor.                                 |
| `isSandbox`            | boolean     | no       | `true`              | Sandbox vs. live credentials.                                              |
| `credentialsEncrypted` | text        | yes      | —                   | AES-encrypted credentials JSON (sc-214/sc-217); never exposed via GraphQL. |
| `merchantExternalId`   | text        | yes      | —                   | Processor-side merchant identifier.                                        |
| `provisionedAt`        | timestamptz | yes      | —                   | When merchant onboarding finished.                                         |
| `createdAt`            | timestamptz | no       | `NOW()`             | Row created.                                                               |
| `updatedAt`            | timestamptz | no       | `NOW()`             | Row last modified.                                                         |

### order_tracking

Append-only status events for an order (state, location, note).

| Column             | Type          | Nullable | Default             | Description                 |
| ------------------ | ------------- | -------- | ------------------- | --------------------------- |
| **tracking_id**    | uuid          | no       | `gen_random_uuid()` | PK.                         |
| order_id           | uuid          | no       | —                   | FK → orders."orderId".      |
| status             | varchar(50)   | no       | —                   | Status value at this event. |
| notes              | text          | yes      | —                   | Free-form note.             |
| updated_by_user_id | uuid          | yes      | —                   | FK → users.id.              |
| latitude           | numeric(10,7) | yes      | —                   | Driver/event latitude.      |
| longitude          | numeric(10,7) | yes      | —                   | Driver/event longitude.     |
| created_at         | timestamptz   | no       | `NOW()`             | Event timestamp.            |

---

## 6. Compliance — Metrc, audit, waste

### metrc_credentials

API credentials and validation status for a dispensary's Metrc tenant.

| Column             | Type        | Nullable | Default             | Description                                 |
| ------------------ | ----------- | -------- | ------------------- | ------------------------------------------- |
| **credential_id**  | uuid        | no       | `gen_random_uuid()` | PK.                                         |
| dispensary_id      | uuid        | no       | —                   | FK → dispensaries.entity_id; unique.        |
| user_api_key       | varchar     | no       | —                   | Metrc per-user API key (encrypted at rest). |
| integrator_api_key | varchar     | yes      | —                   | Vendor integrator API key.                  |
| state              | varchar(10) | no       | —                   | Two-letter state code.                      |
| metrc_username     | varchar     | yes      | —                   | Owning Metrc username.                      |
| is_active          | boolean     | no       | `true`              | Whether credentials are used.               |
| last_validated_at  | timestamptz | yes      | —                   | Last successful validation ping.            |
| validation_error   | text        | yes      | —                   | Most recent validation error.               |
| created_at         | timestamptz | no       | `NOW()`             | Row created.                                |
| updated_at         | timestamptz | no       | `NOW()`             | Row last modified.                          |

### biotrack_credentials

Same as metrc_credentials, but for the Biotrack track-and-trace system.

| Column            | Type        | Nullable | Default             | Description                           |
| ----------------- | ----------- | -------- | ------------------- | ------------------------------------- |
| **credential_id** | uuid        | no       | `gen_random_uuid()` | PK.                                   |
| dispensary_id     | uuid        | no       | —                   | FK → dispensaries.entity_id; unique.  |
| api_key           | varchar     | no       | —                   | Biotrack API key (encrypted at rest). |
| api_secret        | varchar     | yes      | —                   | Biotrack API secret.                  |
| state             | varchar(10) | no       | —                   | Two-letter state code.                |
| license_number    | varchar     | yes      | —                   | Biotrack license number.              |
| is_active         | boolean     | no       | `true`              | Whether credentials are used.         |
| last_validated_at | timestamptz | yes      | —                   | Last successful validation ping.      |
| validation_error  | text        | yes      | —                   | Most recent validation error.         |
| created_at        | timestamptz | no       | `NOW()`             | Row created.                          |
| updated_at        | timestamptz | no       | `NOW()`             | Row last modified.                    |

### metrc_sync_logs

One row per Metrc API call attempt (sync to upstream).

| Column                | Type        | Nullable | Default             | Description                                           |
| --------------------- | ----------- | -------- | ------------------- | ----------------------------------------------------- |
| **sync_id**           | uuid        | no       | `gen_random_uuid()` | PK.                                                   |
| dispensary_id         | uuid        | no       | —                   | FK → dispensaries.entity_id.                          |
| credential_id         | uuid        | no       | —                   | FK → metrc_credentials.credential_id.                 |
| sync_type             | varchar     | no       | —                   | `package` / `transfer` / `sale` / `adjustment` / etc. |
| reference_entity_type | varchar     | yes      | —                   | Originating entity table.                             |
| reference_entity_id   | varchar     | yes      | —                   | Originating entity ID.                                |
| status                | varchar     | no       | `'pending'`         | `pending` / `success` / `failed` / `retry`.           |
| metrc_response        | jsonb       | yes      | —                   | Raw Metrc API response (not exposed via GraphQL).     |
| error_message         | text        | yes      | —                   | Error detail.                                         |
| attempt_count         | int         | no       | `0`                 | Retry attempt counter (BullMQ).                       |
| next_retry_at         | timestamptz | yes      | —                   | Next exponential-backoff retry time.                  |
| created_at            | timestamptz | no       | `NOW()`             | Row created.                                          |
| updated_at            | timestamptz | no       | `NOW()`             | Row last modified.                                    |

### metrc_manifests

Local mirror of a Metrc transfer manifest.

| Column                | Type          | Nullable | Default             | Description                                      |
| --------------------- | ------------- | -------- | ------------------- | ------------------------------------------------ |
| **manifest_id**       | uuid          | no       | `gen_random_uuid()` | PK.                                              |
| transfer_id           | uuid          | yes      | —                   | FK → inventory_transfers.transfer_id.            |
| dispensary_id         | uuid          | no       | —                   | FK → dispensaries.entity_id.                     |
| manifest_number       | varchar(50)   | no       | —                   | Manifest number.                                 |
| manifest_type         | varchar(30)   | no       | `'transfer'`        | `transfer` / `return`.                           |
| from_license          | varchar(50)   | no       | —                   | Origin license.                                  |
| to_license            | varchar(50)   | no       | —                   | Destination license.                             |
| from_facility_name    | varchar(200)  | yes      | —                   | Origin facility.                                 |
| to_facility_name      | varchar(200)  | yes      | —                   | Destination facility.                            |
| driver_name           | varchar(100)  | yes      | —                   | Driver name.                                     |
| vehicle_license_plate | varchar(20)   | yes      | —                   | Vehicle plate.                                   |
| status                | varchar(20)   | no       | `'draft'`           | `draft` / `in_transit` / `delivered` / `voided`. |
| metrc_transfer_id     | varchar(100)  | yes      | —                   | Metrc transfer ID.                               |
| total_packages        | int           | no       | `0`                 | Package count.                                   |
| total_quantity        | numeric(10,2) | no       | `0`                 | Aggregate quantity.                              |
| notes                 | text          | yes      | —                   | Free-form note.                                  |
| created_at            | timestamptz   | no       | `NOW()`             | Row created.                                     |
| updated_at            | timestamptz   | no       | `NOW()`             | Row last modified.                               |

### metrc_manifest_items

Per-package line on a manifest.

| Column            | Type          | Nullable | Default             | Description                       |
| ----------------- | ------------- | -------- | ------------------- | --------------------------------- |
| **item_id**       | uuid          | no       | `gen_random_uuid()` | PK.                               |
| manifest_id       | uuid          | no       | —                   | FK → metrc_manifests.manifest_id. |
| variant_id        | uuid          | no       | —                   | FK → product_variants.variant_id. |
| product_name      | varchar(255)  | no       | —                   | Denormalized product name.        |
| metrc_package_tag | varchar(100)  | yes      | —                   | Metrc package tag.                |
| quantity          | numeric(10,2) | no       | —                   | Quantity shipped.                 |
| unit_of_measure   | varchar(20)   | no       | `'each'`            | UoM.                              |
| notes             | text          | yes      | —                   | Free-form note.                   |

### compliance_logs

Generic compliance-event log (alarms, expirations, regulatory events).

| Column        | Type        | Nullable | Default             | Description                                        |
| ------------- | ----------- | -------- | ------------------- | -------------------------------------------------- |
| **log_id**    | uuid        | no       | `gen_random_uuid()` | PK.                                                |
| dispensary_id | uuid        | no       | —                   | FK → dispensaries.entity_id.                       |
| event_type    | varchar     | no       | —                   | Event category string.                             |
| user_id       | uuid        | yes      | —                   | FK → users.id.                                     |
| entity_type   | varchar     | yes      | —                   | Originating entity table.                          |
| entity_id     | varchar     | yes      | —                   | Originating entity ID.                             |
| action        | varchar     | yes      | —                   | Action verb.                                       |
| details       | jsonb       | yes      | —                   | Free-form event payload (not exposed via GraphQL). |
| ip_address    | varchar     | yes      | —                   | Client IP.                                         |
| user_agent    | varchar     | yes      | —                   | Client UA.                                         |
| metrc_synced  | boolean     | no       | `false`             | Whether event reported to Metrc.                   |
| created_at    | timestamptz | no       | `NOW()`             | Event timestamp.                                   |

### waste_destruction_logs

Witnessed destruction of cannabis product (required by state regs).

| Column               | Type          | Nullable | Default             | Description                                      |
| -------------------- | ------------- | -------- | ------------------- | ------------------------------------------------ |
| **log_id**           | uuid          | no       | `gen_random_uuid()` | PK.                                              |
| dispensary_id        | uuid          | no       | —                   | FK → dispensaries.entity_id.                     |
| variant_id           | uuid          | yes      | —                   | FK → product_variants.variant_id.                |
| product_name         | varchar(255)  | no       | —                   | Denormalized product name.                       |
| metrc_package_tag    | varchar(100)  | yes      | —                   | Metrc package tag destroyed.                     |
| quantity             | numeric(10,2) | no       | —                   | Quantity destroyed.                              |
| unit_of_measure      | varchar(20)   | no       | `'grams'`           | UoM.                                             |
| waste_type           | varchar(30)   | no       | `'plant_waste'`     | `plant_waste` / `product` / `concentrate` / etc. |
| destruction_method   | varchar(50)   | yes      | —                   | Method (rendered unusable, incinerated, etc.).   |
| reason               | text          | no       | —                   | Reason for destruction (required).               |
| witness1_name        | varchar(100)  | no       | —                   | First witness (required).                        |
| witness1_title       | varchar(50)   | yes      | —                   | First witness title.                             |
| witness2_name        | varchar(100)  | yes      | —                   | Second witness.                                  |
| witness2_title       | varchar(50)   | yes      | —                   | Second witness title.                            |
| destroyed_at         | timestamptz   | no       | —                   | When destruction happened.                       |
| status               | varchar(20)   | no       | `'pending'`         | `pending` / `confirmed` / `reported`.            |
| submitted_by_user_id | uuid          | no       | —                   | FK → users.id.                                   |
| notes                | text          | yes      | —                   | Free-form note.                                  |
| created_at           | timestamptz   | no       | `NOW()`             | Row created.                                     |

### reconciliation_reports

Per-day Metrc-vs-local reconciliation summary.

| Column            | Type        | Nullable | Default             | Description                        |
| ----------------- | ----------- | -------- | ------------------- | ---------------------------------- |
| **report_id**     | uuid        | no       | `gen_random_uuid()` | PK.                                |
| dispensary_id     | uuid        | no       | —                   | FK → dispensaries.entity_id.       |
| report_date       | date        | no       | —                   | Reconciliation date.               |
| status            | varchar(20) | no       | `'pending'`         | `pending` / `complete` / `failed`. |
| total_local_items | int         | no       | `0`                 | Items in local inventory.          |
| total_metrc_items | int         | no       | `0`                 | Items in Metrc snapshot.           |
| matched_items     | int         | no       | `0`                 | Lines that matched.                |
| discrepancy_count | int         | no       | `0`                 | Lines with variance.               |
| notes             | text        | yes      | —                   | Free-form note.                    |
| created_at        | timestamptz | no       | `NOW()`             | Row created.                       |

### reconciliation_items

Per-line item in a reconciliation report.

| Column            | Type         | Nullable | Default             | Description                            |
| ----------------- | ------------ | -------- | ------------------- | -------------------------------------- |
| **item_id**       | uuid         | no       | `gen_random_uuid()` | PK.                                    |
| report_id         | uuid         | no       | —                   | FK → reconciliation_reports.report_id. |
| product_name      | varchar(255) | yes      | —                   | Denormalized product name.             |
| metrc_package_tag | varchar(100) | yes      | —                   | Metrc package tag.                     |
| local_quantity    | int          | yes      | —                   | Local quantity recorded.               |
| metrc_quantity    | int          | yes      | —                   | Metrc quantity recorded.               |
| variance          | int          | yes      | —                   | `local - metrc`.                       |
| status            | varchar(20)  | no       | `'matched'`         | `matched` / `variance` / `missing`.    |

### audit_log

Generic audit-log row written for sensitive admin actions (entity create/update/delete, role changes).

| Column        | Type         | Nullable | Default             | Description                                             |
| ------------- | ------------ | -------- | ------------------- | ------------------------------------------------------- |
| **audit_id**  | uuid         | no       | `gen_random_uuid()` | PK.                                                     |
| dispensary_id | uuid         | yes      | —                   | FK → dispensaries.entity_id; NULL for org-level audits. |
| user_id       | uuid         | yes      | —                   | FK → users.id (who acted).                              |
| user_email    | varchar(255) | yes      | —                   | Cached email for forensics if user is later deleted.    |
| action        | varchar(50)  | no       | —                   | `create` / `update` / `delete` / `login` etc.           |
| entity_type   | varchar(50)  | no       | —                   | Touched entity table name.                              |
| entity_id     | varchar(100) | yes      | —                   | Touched entity primary key.                             |
| changes       | jsonb        | yes      | —                   | Generic change payload (or stringified summary).        |
| old_values    | jsonb        | yes      | —                   | Pre-change snapshot.                                    |
| new_values    | jsonb        | yes      | —                   | Post-change snapshot.                                   |
| ip_address    | varchar(45)  | yes      | —                   | Client IP.                                              |
| created_at    | timestamptz  | no       | `NOW()`             | Audit timestamp.                                        |

### regulatory_library

Curated regulatory-text library (statutes, regs, guidance) keyed by state/jurisdiction.

| Column             | Type        | Nullable | Default             | Description                         |
| ------------------ | ----------- | -------- | ------------------- | ----------------------------------- |
| **reg_id**         | uuid        | no       | `gen_random_uuid()` | PK.                                 |
| jurisdiction_level | varchar     | yes      | —                   | `federal` / `state` / `municipal`.  |
| jurisdiction_name  | varchar     | yes      | —                   | Display name.                       |
| state              | varchar(10) | yes      | —                   | Two-letter state code.              |
| statute_number     | varchar     | yes      | —                   | Statute / regulation number.        |
| title              | varchar     | yes      | —                   | Title.                              |
| summary            | text        | yes      | —                   | Short summary.                      |
| full_text          | text        | yes      | —                   | Full text.                          |
| effective_date     | date        | yes      | —                   | When the rule takes effect.         |
| expiry_date        | date        | yes      | —                   | When it sunsets.                    |
| status             | varchar     | no       | `'active'`          | `active` / `proposed` / `repealed`. |
| tags               | jsonb       | yes      | —                   | Free-form tag array.                |
| source_url         | varchar     | yes      | —                   | Canonical source URL.               |
| last_verified_at   | timestamptz | yes      | —                   | Last human verification timestamp.  |
| created_at         | timestamptz | no       | `NOW()`             | Row created.                        |
| updated_at         | timestamptz | no       | `NOW()`             | Row last modified.                  |

---

## 7. Workforce — POS, shifts, scheduling, delivery

### register_sessions

A cashier's open-to-close session on a register/drawer.

| Column             | Type        | Nullable | Default             | Description                                |
| ------------------ | ----------- | -------- | ------------------- | ------------------------------------------ |
| **id**             | uuid        | no       | `gen_random_uuid()` | PK.                                        |
| dispensary_id      | uuid        | no       | —                   | FK → dispensaries.entity_id.               |
| opened_by_user_id  | uuid        | no       | —                   | FK → users.id (cashier who opened).        |
| opening_cash_cents | int         | no       | —                   | Cents — opening drawer cash.               |
| closing_cash_cents | int         | yes      | —                   | Cents — counted at close; NULL while open. |
| status             | text        | no       | `'open'`            | `open` or `closed`.                        |
| opened_at          | timestamptz | no       | `NOW()`             | Session open timestamp.                    |
| closed_at          | timestamptz | yes      | —                   | Session close timestamp.                   |
| updated_at         | timestamptz | no       | `NOW()`             | Row last modified.                         |

### pos_integrations

Connection config to an external POS provider (Dutchie, Treez).

| Column                 | Type         | Nullable | Default             | Description                          |
| ---------------------- | ------------ | -------- | ------------------- | ------------------------------------ |
| **integration_id**     | uuid         | no       | `gen_random_uuid()` | PK.                                  |
| dispensary_id          | uuid         | no       | —                   | FK → dispensaries.entity_id; unique. |
| provider               | varchar(50)  | no       | —                   | `dutchie` / `treez`.                 |
| credentials            | jsonb        | no       | `'{}'`              | Encrypted-at-rest credential JSON.   |
| dispensary_external_id | varchar(255) | yes      | —                   | Provider's dispensary ID.            |
| is_active              | boolean      | no       | `false`             | Whether the integration is on.       |
| is_sync_enabled        | boolean      | no       | `false`             | Whether background sync runs.        |
| last_sync_at           | timestamptz  | yes      | —                   | Last sync attempt.                   |
| last_sync_status       | varchar(50)  | yes      | —                   | Status of last sync.                 |
| last_sync_error        | text         | yes      | —                   | Error message if failed.             |
| created_at             | timestamptz  | no       | `NOW()`             | Row created.                         |
| updated_at             | timestamptz  | no       | `NOW()`             | Row last modified.                   |

### pos_product_mappings

Cross-walk between internal products/variants and external POS provider IDs.

| Column              | Type         | Nullable | Default             | Description                                              |
| ------------------- | ------------ | -------- | ------------------- | -------------------------------------------------------- |
| **mapping_id**      | uuid         | no       | `gen_random_uuid()` | PK.                                                      |
| dispensary_id       | uuid         | no       | —                   | FK → dispensaries.entity_id.                             |
| internal_product_id | uuid         | no       | —                   | FK → products.id.                                        |
| internal_variant_id | uuid         | yes      | —                   | FK → product_variants.variant_id.                        |
| external_product_id | varchar(255) | no       | —                   | Provider product ID (unique within dispensary+provider). |
| external_variant_id | varchar(255) | yes      | —                   | Provider variant ID.                                     |
| provider            | varchar(50)  | no       | —                   | `dutchie` / `treez`.                                     |
| match_method        | varchar(50)  | yes      | —                   | `sku` / `name` / `manual`.                               |
| is_confirmed        | boolean      | no       | `false`             | Whether an admin approved the match.                     |
| last_synced_at      | timestamptz  | yes      | —                   | Last sync.                                               |
| created_at          | timestamptz  | no       | `NOW()`             | Row created.                                             |
| updated_at          | timestamptz  | no       | `NOW()`             | Row last modified.                                       |

### pos_sync_logs

Per-run log of POS sync jobs.

| Column          | Type        | Nullable | Default             | Description                                       |
| --------------- | ----------- | -------- | ------------------- | ------------------------------------------------- |
| **sync_log_id** | uuid        | no       | `gen_random_uuid()` | PK.                                               |
| dispensary_id   | uuid        | no       | —                   | FK → dispensaries.entity_id.                      |
| provider        | varchar(50) | no       | —                   | POS provider.                                     |
| sync_type       | varchar(50) | no       | —                   | `product_pull` / `inventory_sync` / `order_push`. |
| status          | varchar(20) | no       | `'pending'`         | `pending` / `success` / `partial` / `failed`.     |
| items_processed | int         | no       | `0`                 | Items processed.                                  |
| items_created   | int         | no       | `0`                 | Items created.                                    |
| items_updated   | int         | no       | `0`                 | Items updated.                                    |
| items_failed    | int         | no       | `0`                 | Items failed.                                     |
| error_message   | text        | yes      | —                   | Error message.                                    |
| duration_ms     | int         | yes      | —                   | Wall-clock duration.                              |
| created_at      | timestamptz | no       | `NOW()`             | Row created.                                      |

### shift_templates

Recurring weekly shift template (e.g. "Mon morning opener, position 3").

| Column          | Type         | Nullable | Default             | Description                        |
| --------------- | ------------ | -------- | ------------------- | ---------------------------------- |
| **template_id** | uuid         | no       | `gen_random_uuid()` | PK.                                |
| dispensary_id   | uuid         | no       | —                   | FK → dispensaries.entity_id.       |
| name            | varchar(100) | no       | —                   | Display name.                      |
| day_of_week     | int          | no       | —                   | 0–6 (Sun=0).                       |
| start_time      | time         | no       | —                   | Local start time.                  |
| end_time        | time         | no       | —                   | Local end time.                    |
| position_id     | int          | yes      | —                   | FK → lkp_positions.position_id.    |
| min_staff       | int          | no       | `1`                 | Minimum required staff.            |
| max_staff       | int          | no       | `3`                 | Maximum allowed staff.             |
| is_active       | boolean      | no       | `true`              | Whether template generates shifts. |

### scheduled_shifts

A concrete shift on a date assigned to an employee profile.

| Column        | Type        | Nullable | Default             | Description                                            |
| ------------- | ----------- | -------- | ------------------- | ------------------------------------------------------ |
| **shift_id**  | uuid        | no       | `gen_random_uuid()` | PK.                                                    |
| dispensary_id | uuid        | no       | —                   | FK → dispensaries.entity_id.                           |
| profile_id    | uuid        | no       | —                   | FK → employee_profiles.profile_id.                     |
| template_id   | uuid        | yes      | —                   | FK → shift_templates.template_id (origin template).    |
| shift_date    | date        | no       | —                   | Shift date.                                            |
| start_time    | time        | no       | —                   | Start time.                                            |
| end_time      | time        | no       | —                   | End time.                                              |
| status        | varchar(20) | no       | `'scheduled'`       | `scheduled` / `confirmed` / `cancelled` / `completed`. |
| notes         | text        | yes      | —                   | Free-form note.                                        |
| published     | boolean     | no       | `false`             | Whether the schedule is visible to staff.              |
| created_at    | timestamptz | no       | `NOW()`             | Row created.                                           |
| updated_at    | timestamptz | no       | `NOW()`             | Row last modified.                                     |

### shift_swap_requests

Employee-initiated swap or coverage request against a scheduled shift.

| Column                | Type        | Nullable | Default             | Description                                         |
| --------------------- | ----------- | -------- | ------------------- | --------------------------------------------------- |
| **swap_id**           | uuid        | no       | `gen_random_uuid()` | PK.                                                 |
| original_shift_id     | uuid        | no       | —                   | FK → scheduled_shifts.shift_id.                     |
| requesting_profile_id | uuid        | no       | —                   | FK → employee_profiles.profile_id (gives up shift). |
| covering_profile_id   | uuid        | yes      | —                   | FK → employee_profiles.profile_id (takes shift).    |
| status                | varchar(20) | no       | `'open'`            | `open` / `accepted` / `denied` / `cancelled`.       |
| reason                | text        | yes      | —                   | Free-form reason.                                   |
| created_at            | timestamptz | no       | `NOW()`             | Row created.                                        |

### time_entries

Punch-in/out records used for payroll.

| Column              | Type         | Nullable | Default             | Description                                |
| ------------------- | ------------ | -------- | ------------------- | ------------------------------------------ |
| **entry_id**        | uuid         | no       | `gen_random_uuid()` | PK.                                        |
| profile_id          | uuid         | no       | —                   | FK → employee_profiles.profile_id.         |
| dispensary_id       | uuid         | no       | —                   | FK → dispensaries.entity_id.               |
| clock_in            | timestamptz  | no       | —                   | Clock-in.                                  |
| clock_out           | timestamptz  | yes      | —                   | Clock-out (NULL while clocked in).         |
| break_minutes       | int          | no       | `0`                 | Unpaid break minutes.                      |
| total_hours         | numeric(6,2) | yes      | —                   | Computed total hours.                      |
| overtime_hours      | numeric(6,2) | yes      | `0`                 | Computed OT hours.                         |
| status              | varchar(20)  | no       | `'clocked_in'`      | `clocked_in` / `clocked_out` / `approved`. |
| notes               | text         | yes      | —                   | Free-form note.                            |
| approved_by_user_id | uuid         | yes      | —                   | FK → users.id (manager approver).          |
| approved_at         | timestamptz  | yes      | —                   | Approval timestamp.                        |
| created_at          | timestamptz  | no       | `NOW()`             | Row created.                               |
| updated_at          | timestamptz  | no       | `NOW()`             | Row last modified.                         |

### time_off_requests

Employee PTO / time-off request.

| Column         | Type        | Nullable | Default             | Description                                |
| -------------- | ----------- | -------- | ------------------- | ------------------------------------------ |
| **request_id** | uuid        | no       | `gen_random_uuid()` | PK.                                        |
| profile_id     | uuid        | no       | —                   | FK → employee_profiles.profile_id.         |
| dispensary_id  | uuid        | no       | —                   | FK → dispensaries.entity_id.               |
| start_date     | date        | no       | —                   | Start date.                                |
| end_date       | date        | no       | —                   | End date.                                  |
| request_type   | varchar(20) | no       | `'pto'`             | `pto` / `unpaid` / `sick` / `bereavement`. |
| reason         | text        | yes      | —                   | Free-form reason.                          |
| status         | varchar(20) | no       | `'pending'`         | `pending` / `approved` / `denied`.         |
| created_at     | timestamptz | no       | `NOW()`             | Row created.                               |

### driver_profiles

Delivery-driver record extending an employee_profile with vehicle/insurance/location data.

| Column                  | Type          | Nullable | Default             | Description                                |
| ----------------------- | ------------- | -------- | ------------------- | ------------------------------------------ |
| **driver_id**           | uuid          | no       | `gen_random_uuid()` | PK.                                        |
| profile_id              | uuid          | no       | —                   | FK → employee_profiles.profile_id; unique. |
| dispensary_id           | uuid          | no       | —                   | FK → dispensaries.entity_id.               |
| vehicle_make            | varchar(50)   | yes      | —                   | Vehicle make.                              |
| vehicle_model           | varchar(50)   | yes      | —                   | Vehicle model.                             |
| vehicle_year            | int           | yes      | —                   | Vehicle year.                              |
| vehicle_color           | varchar(30)   | yes      | —                   | Vehicle color.                             |
| license_plate           | varchar(15)   | yes      | —                   | Plate.                                     |
| insurance_provider      | varchar(100)  | yes      | —                   | Insurer.                                   |
| insurance_expiry        | date          | yes      | —                   | Insurance expiry.                          |
| max_deliveries_per_hour | int           | no       | `3`                 | Throughput cap for dispatch.               |
| status                  | varchar(20)   | no       | `'available'`       | `available` / `on_delivery` / `off_duty`.  |
| current_latitude        | numeric(10,7) | yes      | —                   | Last reported latitude.                    |
| current_longitude       | numeric(10,7) | yes      | —                   | Last reported longitude.                   |
| last_location_update    | timestamptz   | yes      | —                   | Last position ping.                        |
| created_at              | timestamptz   | no       | `NOW()`             | Row created.                               |
| updated_at              | timestamptz   | no       | `NOW()`             | Row last modified.                         |

### delivery_trips

A driver's run for one (or more) delivery orders.

| Column            | Type         | Nullable | Default             | Description                                         |
| ----------------- | ------------ | -------- | ------------------- | --------------------------------------------------- |
| **trip_id**       | uuid         | no       | `gen_random_uuid()` | PK.                                                 |
| driver_id         | uuid         | no       | —                   | FK → driver_profiles.driver_id.                     |
| dispensary_id     | uuid         | no       | —                   | FK → dispensaries.entity_id.                        |
| order_id          | uuid         | yes      | —                   | FK → orders."orderId".                              |
| status            | varchar(20)  | no       | `'assigned'`        | `assigned` / `in_transit` / `delivered` / `failed`. |
| departed_at       | timestamptz  | yes      | —                   | Driver departed dispensary.                         |
| delivered_at      | timestamptz  | yes      | —                   | Delivery completed.                                 |
| delivery_address  | text         | yes      | —                   | Snapshot of address.                                |
| distance_miles    | numeric(6,2) | yes      | —                   | Route distance.                                     |
| estimated_minutes | int          | yes      | —                   | Estimated duration.                                 |
| actual_minutes    | int          | yes      | —                   | Actual duration.                                    |
| customer_rating   | int          | yes      | —                   | Post-delivery rating (1–5).                         |
| created_at        | timestamptz  | no       | `NOW()`             | Row created.                                        |

### delivery_zones

Geographic zone a dispensary delivers into; carries fees and SLAs.

| Column                  | Type          | Nullable | Default             | Description                            |
| ----------------------- | ------------- | -------- | ------------------- | -------------------------------------- |
| **zone_id**             | uuid          | no       | `gen_random_uuid()` | PK.                                    |
| dispensary_id           | uuid          | no       | —                   | FK → dispensaries.entity_id.           |
| name                    | varchar(100)  | no       | —                   | Zone display name.                     |
| radius_miles            | numeric(6,2)  | no       | `5.0`               | Radius from dispensary.                |
| delivery_fee            | numeric(10,2) | no       | `0`                 | Base delivery fee.                     |
| min_order_amount        | numeric(10,2) | yes      | —                   | Minimum order for delivery.            |
| free_delivery_threshold | numeric(10,2) | yes      | —                   | Order total at which delivery is free. |
| estimated_minutes_min   | int           | yes      | `30`                | Low end of ETA window.                 |
| estimated_minutes_max   | int           | yes      | `60`                | High end of ETA window.                |
| is_active               | boolean       | no       | `true`              | Whether the zone serves orders.        |
| sort_order              | int           | yes      | `0`                 | Display order.                         |
| created_at              | timestamptz   | no       | `NOW()`             | Row created.                           |
| updated_at              | timestamptz   | no       | `NOW()`             | Row last modified.                     |

### delivery_time_slots

Bookable delivery (or pickup) time window for a day of week.

| Column        | Type        | Nullable | Default             | Description                  |
| ------------- | ----------- | -------- | ------------------- | ---------------------------- |
| **slot_id**   | uuid        | no       | `gen_random_uuid()` | PK.                          |
| dispensary_id | uuid        | no       | —                   | FK → dispensaries.entity_id. |
| slot_type     | varchar(20) | no       | `'delivery'`        | `delivery` or `pickup`.      |
| day_of_week   | int         | no       | —                   | 0–6 (Sun=0).                 |
| start_time    | time        | no       | —                   | Window start.                |
| end_time      | time        | no       | —                   | Window end.                  |
| max_orders    | int         | yes      | `10`                | Capacity cap.                |
| is_active     | boolean     | no       | `true`              | Whether bookable.            |
| created_at    | timestamptz | no       | `NOW()`             | Row created.                 |
| updated_at    | timestamptz | no       | `NOW()`             | Row last modified.           |

### employee_certifications

Per-employee credential record (cannabis-handler card, food handler, etc.).

| Column               | Type         | Nullable | Default             | Description                                     |
| -------------------- | ------------ | -------- | ------------------- | ----------------------------------------------- |
| **certification_id** | uuid         | no       | `gen_random_uuid()` | PK.                                             |
| profile_id           | uuid         | no       | —                   | FK → employee_profiles.profile_id.              |
| cert_type_id         | int          | no       | —                   | FK → lkp_certification_types.cert_type_id.      |
| certificate_number   | varchar(100) | yes      | —                   | Certificate number.                             |
| issued_date          | date         | yes      | —                   | Issued date.                                    |
| expiration_date      | date         | yes      | —                   | Expiry date.                                    |
| status               | varchar(20)  | no       | `'pending'`         | `pending` / `verified` / `expired` / `revoked`. |
| verified_by_user_id  | uuid         | yes      | —                   | FK → users.id (verifier).                       |
| verified_at          | timestamptz  | yes      | —                   | When verified.                                  |
| document_url         | varchar(500) | yes      | —                   | URL to scanned cert.                            |
| notes                | text         | yes      | —                   | Free-form note.                                 |
| created_at           | timestamptz  | no       | `NOW()`             | Row created.                                    |
| updated_at           | timestamptz  | no       | `NOW()`             | Row last modified.                              |

### performance_reviews

Periodic performance review for an employee profile.

| Column                | Type        | Nullable | Default             | Description                             |
| --------------------- | ----------- | -------- | ------------------- | --------------------------------------- |
| **review_id**         | uuid        | no       | `gen_random_uuid()` | PK.                                     |
| profile_id            | uuid        | no       | —                   | FK → employee_profiles.profile_id.      |
| reviewer_user_id      | uuid        | no       | —                   | FK → users.id (reviewer).               |
| review_period_start   | date        | no       | —                   | Period start.                           |
| review_period_end     | date        | no       | —                   | Period end.                             |
| overall_rating        | int         | yes      | —                   | Overall rating (1–5).                   |
| sales_rating          | int         | yes      | —                   | Sales rating.                           |
| compliance_rating     | int         | yes      | —                   | Compliance rating.                      |
| teamwork_rating       | int         | yes      | —                   | Teamwork rating.                        |
| reliability_rating    | int         | yes      | —                   | Reliability rating.                     |
| strengths             | text        | yes      | —                   | Strengths comments.                     |
| areas_for_improvement | text        | yes      | —                   | Improvement comments.                   |
| goals                 | text        | yes      | —                   | Goals for next period.                  |
| manager_comments      | text        | yes      | —                   | Manager comments.                       |
| employee_comments     | text        | yes      | —                   | Employee response.                      |
| status                | varchar(20) | no       | `'draft'`           | `draft` / `submitted` / `acknowledged`. |
| acknowledged_at       | timestamptz | yes      | —                   | When employee acknowledged.             |
| created_at            | timestamptz | no       | `NOW()`             | Row created.                            |
| updated_at            | timestamptz | no       | `NOW()`             | Row last modified.                      |

---

## 8. Promotions

> Legacy camelCase tables — column identifiers are quoted as written below.

### promotions

A discount or promo offer scoped to a dispensary, with eligibility filters and usage caps.

| Column                   | Type          | Nullable | Default             | Description                                                 |
| ------------------------ | ------------- | -------- | ------------------- | ----------------------------------------------------------- |
| **`promoId`**            | uuid          | no       | `gen_random_uuid()` | PK.                                                         |
| `dispensaryId`           | uuid          | no       | —                   | FK → dispensaries.entity_id.                                |
| `name`                   | varchar(255)  | no       | —                   | Display name.                                               |
| `description`            | text          | yes      | —                   | Marketing copy.                                             |
| `type`                   | varchar(50)   | no       | —                   | `percent_off` / `dollar_off` / `bogo` / `free_item`.        |
| `code`                   | varchar(50)   | yes      | —                   | Customer-entered promo code (if any).                       |
| `discountValue`          | numeric(10,2) | no       | `0`                 | Discount magnitude.                                         |
| `minimumOrderTotal`      | numeric(10,2) | yes      | —                   | Cart-total floor.                                           |
| `maxUses`                | int           | yes      | —                   | Global usage cap.                                           |
| `usesCount`              | int           | no       | `0`                 | Current usage counter.                                      |
| `maxUsesPerCustomer`     | int           | yes      | —                   | Per-customer usage cap.                                     |
| `appliesTo`              | varchar(50)   | yes      | —                   | `cart` / `category` / `brand` / `product_type` / `variant`. |
| `appliesToProductTypeId` | int           | yes      | —                   | FK → lkp_product_types.product_type_id.                     |
| `appliesToBrandId`       | uuid          | yes      | —                   | FK → brands.brand_id.                                       |
| `appliesToTaxCategoryId` | int           | yes      | —                   | FK → lkp_tax_categories.tax_category_id.                    |
| `stackableWithOthers`    | boolean       | no       | `false`             | Stackable with other promos.                                |
| `isStaffDiscount`        | boolean       | no       | `false`             | Marks as staff-only.                                        |
| `isMedicalDiscount`      | boolean       | no       | `false`             | Marks as medical-only.                                      |
| `startAt`                | timestamptz   | yes      | —                   | Promo start.                                                |
| `endAt`                  | timestamptz   | yes      | —                   | Promo end.                                                  |
| `isActive`               | boolean       | no       | `true`              | Whether currently eligible.                                 |
| `createdAt`              | timestamptz   | no       | `NOW()`             | Row created.                                                |
| `updatedAt`              | timestamptz   | no       | `NOW()`             | Row last modified.                                          |

### promotion_products

Junction row attaching a promotion to specific products/variants.

| Column       | Type    | Nullable | Default             | Description                                    |
| ------------ | ------- | -------- | ------------------- | ---------------------------------------------- |
| **`id`**     | uuid    | no       | `gen_random_uuid()` | PK.                                            |
| `promoId`    | uuid    | no       | —                   | FK → promotions."promoId".                     |
| `productId`  | uuid    | yes      | —                   | FK → products.id.                              |
| `variantId`  | uuid    | yes      | —                   | FK → product_variants.variant_id.              |
| `isEligible` | boolean | no       | `true`              | Eligibility flag (allows explicit exclusions). |

### promotion_categories

Junction row attaching a promotion to product categories.

| Column       | Type    | Nullable | Default             | Description                                    |
| ------------ | ------- | -------- | ------------------- | ---------------------------------------------- |
| **`id`**     | uuid    | no       | `gen_random_uuid()` | PK.                                            |
| `promoId`    | uuid    | no       | —                   | FK → promotions."promoId".                     |
| `categoryId` | int     | no       | —                   | FK → lkp_product_categories.category_id.       |
| `isEligible` | boolean | no       | `true`              | Eligibility flag (allows explicit exclusions). |

---

## 9. Notifications & per-dispensary theme

### notification_templates

Reusable template (subject + body) for outbound email/SMS notifications.

| Column          | Type         | Nullable | Default   | Description                                |
| --------------- | ------------ | -------- | --------- | ------------------------------------------ |
| **template_id** | int          | no       | (serial)  | PK.                                        |
| code            | varchar(50)  | no       | —         | Unique template code (e.g. `order_ready`). |
| name            | varchar(100) | no       | —         | Display name.                              |
| channel         | varchar(10)  | no       | `'email'` | `email` / `sms`.                           |
| subject         | varchar(255) | yes      | —         | Subject for email.                         |
| body_template   | text         | no       | —         | Mustache/Handlebars body source.           |
| is_active       | boolean      | no       | `true`    | Whether template is in use.                |

### notification_log

Per-attempt log of every notification dispatched.

| Column        | Type         | Nullable | Default             | Description                                |
| ------------- | ------------ | -------- | ------------------- | ------------------------------------------ |
| **log_id**    | uuid         | no       | `gen_random_uuid()` | PK.                                        |
| user_id       | uuid         | yes      | —                   | FK → users.id (recipient if known).        |
| dispensary_id | uuid         | yes      | —                   | FK → dispensaries.entity_id.               |
| channel       | varchar(10)  | no       | —                   | `email` / `sms`.                           |
| template_code | varchar(50)  | yes      | —                   | FK → notification_templates.code.          |
| recipient     | varchar(255) | no       | —                   | Email address / phone number sent to.      |
| subject       | varchar(255) | yes      | —                   | Rendered subject.                          |
| body          | text         | yes      | —                   | Rendered body.                             |
| status        | varchar(20)  | no       | `'pending'`         | `pending` / `sent` / `failed` / `bounced`. |
| error_message | text         | yes      | —                   | Failure reason.                            |
| external_id   | varchar(255) | yes      | —                   | Provider message ID (SES, Twilio, etc.).   |
| sent_at       | timestamptz  | yes      | —                   | Send timestamp.                            |
| created_at    | timestamptz  | no       | `NOW()`             | Row created.                               |

### theme_configs

Per-dispensary theme palette + branding assets (consumed by the per-dispensary theme CSS endpoint, sc-637/sc-709).

| Column         | Type         | Nullable | Default             | Description                                                   |
| -------------- | ------------ | -------- | ------------------- | ------------------------------------------------------------- |
| **id**         | uuid         | no       | `gen_random_uuid()` | PK.                                                           |
| dispensary_id  | uuid         | no       | —                   | FK → dispensaries.entity_id; unique (one row per dispensary). |
| preset         | varchar      | no       | `'casual'`          | Preset code or `'custom'`.                                    |
| primary        | varchar      | no       | `'#2d6a4f'`         | Primary brand color.                                          |
| secondary      | varchar      | no       | `'#74956c'`         | Secondary brand color.                                        |
| accent         | varchar      | no       | `'#c47820'`         | Accent color.                                                 |
| bg_primary     | varchar      | no       | `'#faf6f0'`         | Primary surface background.                                   |
| bg_secondary   | varchar      | no       | `'#f0ebe3'`         | Secondary surface background.                                 |
| bg_card        | varchar      | no       | `'#ffffff'`         | Card surface background.                                      |
| text_primary   | varchar      | no       | `'#2c2418'`         | Primary text.                                                 |
| text_secondary | varchar      | no       | `'#6b5e4f'`         | Secondary text.                                               |
| sidebar_bg     | varchar      | no       | `'#1b3a2a'`         | Admin sidebar background.                                     |
| sidebar_text   | varchar      | no       | `'#c8d8c4'`         | Admin sidebar text.                                           |
| color_success  | varchar      | no       | `'#27ae60'`         | Success color.                                                |
| color_warning  | varchar      | no       | `'#d97706'`         | Warning color.                                                |
| color_error    | varchar      | no       | `'#c0392b'`         | Error color.                                                  |
| color_info     | varchar      | no       | `'#2e86ab'`         | Info color.                                                   |
| is_dark        | boolean      | no       | `false`             | Dark-mode flag.                                               |
| logo_url       | varchar(500) | yes      | —                   | Brand logo asset URL (sc-637 follow-on).                      |
| masthead_url   | varchar(500) | yes      | —                   | Storefront masthead asset URL.                                |
| display_font   | varchar(100) | yes      | —                   | Google Font for display text.                                 |
| body_font      | varchar(100) | yes      | —                   | Google Font for body text.                                    |
| created_at     | timestamptz  | no       | `NOW()`             | Row created.                                                  |
| updated_at     | timestamptz  | no       | `NOW()`             | Row last modified.                                            |

---

## 10. Lookup tables (the ones with FKs in)

These are reference tables that get FK'd to from domain tables. Pure-enum lookups (`lkp_effects`, `lkp_flavors`, `lkp_terpenes`, `lkp_cannabinoids`, `lkp_allergens`, `lkp_warning_statements`) live in `apps/api/src/modules/products/entities/lookups/lookups.entity.ts` and are not tabulated here — they're flat code/label pairs.

### lkp_product_types

Top-level product type taxonomy (flower, edible, vape, etc.). 15 rows seeded.

| Column                      | Type         | Nullable | Default  | Description                                 |
| --------------------------- | ------------ | -------- | -------- | ------------------------------------------- |
| **product_type_id**         | int          | no       | (serial) | PK.                                         |
| code                        | varchar(100) | no       | —        | Unique code.                                |
| name                        | varchar(100) | no       | —        | Display name.                               |
| requires_lab_test           | boolean      | no       | `false`  | Whether COA is required.                    |
| requires_serving_info       | boolean      | no       | `false`  | Whether serving info must be printed.       |
| requires_ingredient_list    | boolean      | no       | `false`  | Whether ingredient list is required.        |
| requires_extraction_method  | boolean      | no       | `false`  | Whether extraction method must be recorded. |
| is_inhalable                | boolean      | no       | `false`  | Inhalable form factor.                      |
| is_ingestible               | boolean      | no       | `false`  | Ingestible form factor.                     |
| metrc_default_category_code | varchar(100) | yes      | —        | Default Metrc item category mapping.        |
| hemp_eligible               | boolean      | no       | `false`  | Eligible for hemp-derived path.             |
| is_active                   | boolean      | no       | `true`   | Whether available in catalog.               |
| sort_order                  | int          | no       | `0`      | Sort order.                                 |

### lkp_product_categories

Hierarchical product category tree (parent_category_id self-FK).

| Column              | Type         | Nullable | Default  | Description                                   |
| ------------------- | ------------ | -------- | -------- | --------------------------------------------- |
| **category_id**     | int          | no       | (serial) | PK.                                           |
| parent_category_id  | int          | yes      | —        | Self-FK → lkp_product_categories.category_id. |
| code                | varchar(100) | no       | —        | Unique code.                                  |
| name                | varchar(100) | no       | —        | Display name.                                 |
| depth               | int          | no       | `0`      | Tree depth (root=0).                          |
| metrc_category_code | varchar(100) | yes      | —        | Metrc category mapping.                       |
| is_active           | boolean      | no       | `true`   | Active flag.                                  |
| sort_order          | int          | no       | `0`      | Sort order.                                   |

### lkp_unit_of_measure

Units of measure used for quantities and pricing.

| Column             | Type        | Nullable | Default  | Description                           |
| ------------------ | ----------- | -------- | -------- | ------------------------------------- |
| **uom_id**         | int         | no       | (serial) | PK.                                   |
| code               | varchar(20) | no       | —        | Unique code (e.g. `g`, `mg`, `each`). |
| name               | varchar(50) | no       | —        | Display name.                         |
| uom_type           | varchar(20) | no       | —        | `weight` / `volume` / `count`.        |
| is_metrc_supported | boolean     | no       | `false`  | Whether Metrc accepts this UoM.       |
| metrc_code         | varchar(50) | yes      | —        | Metrc-side code mapping.              |
| is_active          | boolean     | no       | `true`   | Active flag.                          |

### lkp_packaging_types

Packaging-format catalog with compliance flags (CRP, tamper-evident, etc.).

| Column                | Type         | Nullable | Default  | Description          |
| --------------------- | ------------ | -------- | -------- | -------------------- |
| **packaging_type_id** | int          | no       | (serial) | PK.                  |
| code                  | varchar(100) | no       | —        | Unique code.         |
| name                  | varchar(100) | no       | —        | Display name.        |
| is_child_resistant    | boolean      | no       | `false`  | CRP flag.            |
| is_tamper_evident     | boolean      | no       | `false`  | Tamper-evident flag. |
| is_resealable         | boolean      | no       | `false`  | Resealable flag.     |
| is_opaque             | boolean      | no       | `false`  | Opaque flag.         |
| is_active             | boolean      | no       | `true`   | Active flag.         |

### lkp_extraction_methods

Extraction process catalog with solvent tracking.

| Column                   | Type         | Nullable | Default  | Description                    |
| ------------------------ | ------------ | -------- | -------- | ------------------------------ |
| **extraction_method_id** | int          | no       | (serial) | PK.                            |
| code                     | varchar(100) | no       | —        | Unique code.                   |
| name                     | varchar(100) | no       | —        | Display name.                  |
| uses_solvent             | boolean      | no       | `false`  | Whether method uses a solvent. |
| solvent_type             | varchar(100) | yes      | —        | Solvent name when applicable.  |
| is_active                | boolean      | no       | `true`   | Active flag.                   |

### lkp_tax_categories

State-level tax category rates (used for line-item tax computation).

| Column              | Type         | Nullable | Default  | Description                            |
| ------------------- | ------------ | -------- | -------- | -------------------------------------- |
| **tax_category_id** | int          | no       | (serial) | PK.                                    |
| code                | varchar(100) | no       | —        | Unique code.                           |
| state               | varchar(10)  | yes      | —        | Two-letter state.                      |
| name                | varchar(100) | no       | —        | Display name.                          |
| tax_basis           | varchar(20)  | no       | —        | `sale_price` / `wholesale` / `thc_mg`. |
| rate                | numeric(6,4) | no       | `0`      | Decimal rate (0.10 = 10%).             |
| effective_date      | date         | yes      | —        | When this rate takes effect.           |
| statutory_reference | varchar(255) | yes      | —        | Statute citation.                      |
| is_active           | boolean      | no       | `true`   | Active flag.                           |

### lkp_lab_test_categories

Lab-test analyte category lookup (potency, contaminants, etc.).

| Column                   | Type         | Nullable | Default  | Description                                         |
| ------------------------ | ------------ | -------- | -------- | --------------------------------------------------- |
| **test_category_id**     | int          | no       | (serial) | PK.                                                 |
| code                     | varchar(100) | no       | —        | Unique code.                                        |
| name                     | varchar(100) | no       | —        | Display name.                                       |
| applies_to_product_types | text         | yes      | —        | Comma-separated product type codes this applies to. |
| is_mandatory             | boolean      | no       | `false`  | Whether a test in this category is required.        |
| is_active                | boolean      | no       | `true`   | Active flag.                                        |

### lkp_metrc_item_categories

Metrc-side item category strings keyed by state.

| Column                | Type         | Nullable | Default  | Description                                    |
| --------------------- | ------------ | -------- | -------- | ---------------------------------------------- |
| **metrc_category_id** | int          | no       | (serial) | PK.                                            |
| code                  | varchar(100) | no       | —        | Unique code.                                   |
| state                 | varchar(10)  | yes      | —        | Two-letter state.                              |
| name                  | varchar(100) | no       | —        | Metrc category display string.                 |
| product_type_code     | varchar(100) | yes      | —        | FK → lkp_product_types.code (via string code). |
| requires_unit_weight  | boolean      | no       | `false`  | Whether Metrc requires a unit weight.          |
| effective_date        | date         | yes      | —        | When this category became valid.               |
| is_active             | boolean      | no       | `true`   | Active flag.                                   |

### lkp_metrc_adjustment_reasons

Metrc-side adjustment reason codes (for package adjustments).

| Column                   | Type         | Nullable | Default  | Description            |
| ------------------------ | ------------ | -------- | -------- | ---------------------- |
| **adjustment_reason_id** | int          | no       | (serial) | PK.                    |
| code                     | varchar(100) | no       | —        | Unique code.           |
| state                    | varchar(10)  | yes      | —        | Two-letter state.      |
| name                     | varchar(255) | no       | —        | Display name.          |
| reason_category          | varchar(50)  | yes      | —        | Higher-level grouping. |
| is_active                | boolean      | no       | `true`   | Active flag.           |

### lkp_adjustment_reasons

Local-side inventory-adjustment reason codes (decoupled from Metrc reasons).

| Column            | Type         | Nullable | Default      | Description                           |
| ----------------- | ------------ | -------- | ------------ | ------------------------------------- |
| **reason_id**     | int          | no       | (serial)     | PK.                                   |
| code              | varchar(30)  | no       | —            | Unique code.                          |
| name              | varchar(100) | no       | —            | Display name.                         |
| direction         | varchar(10)  | no       | `'decrease'` | `increase` / `decrease`.              |
| requires_approval | boolean      | no       | `false`      | Whether manager approval is required. |
| is_active         | boolean      | no       | `true`       | Active flag.                          |

### lkp_positions

Employee position / role catalog (budtender, manager, security, etc.).

| Column          | Type         | Nullable | Default        | Description                        |
| --------------- | ------------ | -------- | -------------- | ---------------------------------- |
| **position_id** | int          | no       | (serial)       | PK.                                |
| code            | varchar(50)  | no       | —              | Unique code.                       |
| name            | varchar(100) | no       | —              | Display name.                      |
| department      | varchar(50)  | no       | `'operations'` | Department grouping.               |
| is_management   | boolean      | no       | `false`        | Whether this is a management role. |
| is_active       | boolean      | no       | `true`         | Active flag.                       |
| sort_order      | int          | no       | `0`            | Sort order.                        |

### lkp_certification_types

Employee-certification type catalog (state cannabis card, food handler, etc.).

| Column            | Type         | Nullable | Default  | Description                    |
| ----------------- | ------------ | -------- | -------- | ------------------------------ |
| **cert_type_id**  | int          | no       | (serial) | PK.                            |
| code              | varchar(50)  | no       | —        | Unique code.                   |
| name              | varchar(150) | no       | —        | Display name.                  |
| description       | text         | yes      | —        | Detailed description.          |
| issuing_authority | varchar(200) | yes      | —        | Issuing body.                  |
| validity_months   | int          | yes      | —        | Default validity in months.    |
| is_state_required | boolean      | no       | `false`  | Whether the state mandates it. |
| is_active         | boolean      | no       | `true`   | Active flag.                   |

---

## How to regenerate

Source of truth is the TypeORM entity files under `apps/api/src/modules/**/entities/`. When you add or change a column:

1. Update the entity file (with `@Column({ name: 'foo' })` for explicit DB names).
2. Generate a TypeORM migration in `apps/api/src/migrations/` — never rely on `synchronize: true`.
3. Add or update the row in the corresponding table below.
4. If the entity is brand-new, add a new `### table_name` block in the relevant domain section and update `data-model.md` to include the FK in its Mermaid diagram.

Pure-enum lookups (`lkp_effects`, `lkp_flavors`, `lkp_terpenes`, `lkp_cannabinoids`, `lkp_allergens`, `lkp_warning_statements`) live in `apps/api/src/modules/products/entities/lookups/lookups.entity.ts` and are intentionally omitted from this dictionary — they are flat (code, name, sort_order) reference tables with no inbound FKs from domain tables.
