# CannaSaas — Metrc Connect + Otreeba API Integration Guide

**Sprint 13 — External Data Services Implementation**
**Version 1.0 — February 2026**
**CONFIDENTIAL — Internal Development Reference**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview — How the Services Fit Together](#2-architecture-overview)
3. [Metrc Connect Integration (Compliance Layer)](#3-metrc-connect-integration)
4. [Otreeba Open Cannabis API Integration (Product Data Layer)](#4-otreeba-open-cannabis-api-integration)
5. [The Bridge: How Metrc + Otreeba Work Together](#5-the-bridge-how-metrc--otreeba-work-together)
6. [Database Schema Updates](#6-database-schema-updates)
7. [New Module File Structure](#7-new-module-file-structure)
8. [Environment Configuration](#8-environment-configuration)
9. [Implementation Sequence (Sprint 13 Breakdown)](#9-implementation-sequence-sprint-13)
10. [Testing Strategy](#10-testing-strategy)
11. [Project Guide Updates](#11-project-guide-updates)
12. [Risk Register & Mitigations](#12-risk-register--mitigations)

---

## 1. Executive Summary

This document details the implementation plan for integrating two external cannabis data services into the CannaSaas platform:

- **Metrc Connect API** — The state-mandated seed-to-sale compliance tracking system. Required for all dispensary operations in NY (live as of Dec 2025), NJ (active), and CT (transitioning from BioTrack). This replaces the previous approach of "data export for dispensary upload" with direct, real-time API integration.

- **Otreeba Open Cannabis API** — An open-source standardized cannabis product database providing strain data, effects, flavors, terpene profiles, and product metadata. Used to bootstrap and enrich the CannaSaas product catalog so dispensaries don't start from scratch.

Together, these services form a data pipeline: Otreeba feeds rich product data INTO CannaSaas, while Metrc receives compliance data OUT of CannaSaas. Every sale, inventory adjustment, transfer, and package event flows automatically to the state regulator.

**This work is scoped as Sprint 13** in the CannaSaas build plan, replacing the placeholder Metrc module stubs in `src/modules/compliance/metrc/` and adding a new `src/modules/product-data/` module for Otreeba.

---

## 2. Architecture Overview

The two services serve opposite sides of the data flow and connect through the existing CannaSaas module architecture.

### 2.1 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL DATA SERVICES                      │
│                                                                 │
│  [Otreeba API]              │              [Metrc Connect API]  │
│  api.otreeba.com/v1         │         api-{state}.metrc.com     │
│  Strains, Brands,           │         Sales, Packages,          │
│  Effects, Products          │         Transfers, Plants          │
│       │                     │                    ▲              │
│       │  PULL (inbound)     │        PUSH (outbound) │          │
│       ▼                     │                    │              │
└──────┴──────────────────────┴───────────────────┴──────────────┘
       │                                         │
┌──────┴─────────────────────────────────────────┴───────────────┐
│                   CANNASAAS BACKEND (NestJS)                    │
│                                                                 │
│  product-data/         compliance/metrc/                        │
│   otreeba.service  -->  metrc.service                           │
│       │                     │                                   │
│       ▼                     ▼                                   │
│  [Products Module]    [Orders Module]   [Inventory Module]      │
│  Enriched catalog     Sale receipts      Package adjustments    │
│       │                     │                    │              │
│       ▼                     ▼                    ▼              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                        PostgreSQL                        │   │
│  │  products | strains | metrc_sync_log | compliance_logs   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Integration Points with Existing Modules

| Existing Module | Metrc Integration | Otreeba Integration |
|---|---|---|
| Products (S4) | Package UIDs mapped to products | Strain data, effects, terpenes enrichment |
| Inventory (S4) | Adjustments reported to Metrc | N/A |
| Orders (S5-6) | Sale receipts pushed within 24hrs | N/A |
| Compliance (S7-8) | Audit log events trigger Metrc sync | N/A |
| POS (S11) | POS adapter syncs Metrc package IDs | Product catalog seeding |
| Analytics (S12) | Metrc sync status dashboard | Catalog coverage metrics |

---

## 3. Metrc Connect Integration

### 3.1 Authentication

Metrc uses HTTP Basic Auth combining two API keys. Both are required for every request:

- **Integrator API Key** — Issued to CannaSaas when registered as a Metrc Connect third-party integrator. One key for all customers.
- **User API Key** — Created by each dispensary in their Metrc account and provided to CannaSaas. Tied to that user's permissions.

```typescript
// Authorization header construction
const combined = `${integratorApiKey}:${userApiKey}`;
const encoded = Buffer.from(combined).toString('base64');
headers: { Authorization: `Basic ${encoded}` }
```

State-specific base URLs:

- **New York:** `https://api-ny.metrc.com`
- **New Jersey:** `https://api-nj.metrc.com`
- **Connecticut:** `https://api-ct.metrc.com` (pending BioTrack transition)

### 3.2 Core Endpoints We Use

All endpoints are v2 (Metrc Connect). POST/PUT limited to 10 objects per call.

#### Sales Reporting (Critical — within 24 hours of each sale)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/sales/v2/receipts` | Report completed sale receipts |
| PUT | `/sales/v2/receipts` | Update existing sale receipts |
| DELETE | `/sales/v2/receipts/{id}` | Void a sale receipt |
| GET | `/sales/v2/receipts/active` | Retrieve active receipts for reconciliation |

#### Package Management

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/packages/v2/active` | Get active packages for inventory sync |
| GET | `/packages/v2/{id}` | Get specific package details |
| PUT | `/packages/v2/adjust` | Report inventory adjustments |
| POST | `/packages/v2` | Create new packages |

#### Transfers

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/transfers/v2/external/incoming` | Log incoming transfers from distributors |
| GET | `/transfers/v2/incoming` | Retrieve incoming transfer manifests |
| GET | `/transfers/v2/outgoing` | Retrieve outgoing transfer manifests |

#### Facilities & Items

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/facilities/v2` | List licensed facilities for dispensary |
| GET | `/items/v2/active` | Get active item categories |
| GET | `/strains/v2/active` | Get registered strains |

#### Webhooks (Metrc Connect paid tier)

| Method | Endpoint | Purpose |
|---|---|---|
| PUT | `/webhooks/v2` | Subscribe to events |
| GET | `/webhooks/v2` | List active webhook subscriptions |
| DELETE | `/webhooks/v2/{id}` | Remove subscription |

### 3.3 MetrcService Implementation

Located at: `src/modules/compliance/metrc/metrc.service.ts`

```typescript
@Injectable()
export class MetrcService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(MetrcSyncLog)
    private readonly syncLogRepo: Repository<MetrcSyncLog>,
    @InjectRepository(MetrcCredential)
    private readonly credentialRepo: Repository<MetrcCredential>,
  ) {}

  // Get auth headers for a specific dispensary
  private async getAuthHeaders(dispensaryId: string) {
    const cred = await this.credentialRepo.findOneOrFail({
      where: { dispensaryId },
    });
    const integratorKey = this.configService.get('METRC_INTEGRATOR_KEY');
    const combined = `${integratorKey}:${cred.userApiKey}`;
    const encoded = Buffer.from(combined).toString('base64');
    return {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
    };
  }

  // Get state-specific base URL from dispensary config
  private getBaseUrl(state: string): string {
    const urls = {
      NY: 'https://api-ny.metrc.com',
      NJ: 'https://api-nj.metrc.com',
      CT: 'https://api-ct.metrc.com',
    };
    return urls[state] || urls.NY;
  }

  // === SALES ===
  async reportSale(dispensaryId: string, receipt: MetrcSaleReceipt) {
    return this.callMetrc(dispensaryId, 'POST',
      '/sales/v2/receipts', [receipt]);
  }

  async voidSale(dispensaryId: string, receiptId: number) {
    return this.callMetrc(dispensaryId, 'DELETE',
      `/sales/v2/receipts/${receiptId}`);
  }

  // === PACKAGES ===
  async getActivePackages(dispensaryId: string, licenseNumber: string) {
    return this.callMetrc(dispensaryId, 'GET',
      `/packages/v2/active?licenseNumber=${licenseNumber}`);
  }

  async adjustPackage(dispensaryId: string, adjustment: MetrcAdjustment) {
    return this.callMetrc(dispensaryId, 'PUT',
      '/packages/v2/adjust', [adjustment]);
  }

  // === TRANSFERS ===
  async getIncomingTransfers(dispensaryId: string, license: string) {
    return this.callMetrc(dispensaryId, 'GET',
      `/transfers/v2/incoming?licenseNumber=${license}`);
  }

  // === SYNC ENGINE ===
  async syncInventory(dispensaryId: string): Promise<SyncResult> {
    // 1. Pull active packages from Metrc
    // 2. Compare with local inventory
    // 3. Flag discrepancies
    // 4. Log sync event
  }

  // === GENERIC API CALLER WITH RETRY + LOGGING ===
  private async callMetrc(
    dispensaryId: string,
    method: string,
    path: string,
    body?: any,
  ): Promise<any> {
    const cred = await this.credentialRepo.findOneOrFail({
      where: { dispensaryId },
      relations: ['dispensary'],
    });
    const baseUrl = this.getBaseUrl(cred.dispensary.state);
    const headers = await this.getAuthHeaders(dispensaryId);
    const url = `${baseUrl}${path}`;

    const syncLog = this.syncLogRepo.create({
      dispensaryId,
      endpoint: path,
      method,
      requestPayload: body,
      status: 'pending',
    });
    await this.syncLogRepo.save(syncLog);

    try {
      const response = await firstValueFrom(
        this.httpService.request({ method, url, headers, data: body })
      );
      syncLog.status = 'success';
      syncLog.responseCode = response.status;
      syncLog.responsePayload = response.data;
      return response.data;
    } catch (error) {
      syncLog.status = 'failed';
      syncLog.responseCode = error.response?.status;
      syncLog.errorMessage = error.message;
      // Queue for retry if transient error (429, 5xx)
      if (this.isRetryable(error.response?.status)) {
        syncLog.retryScheduledAt = this.getNextRetry(syncLog.retryCount);
      }
      throw error;
    } finally {
      await this.syncLogRepo.save(syncLog);
    }
  }
}
```

### 3.4 Automatic Sale Reporting

The order completion flow triggers Metrc reporting automatically via an event listener:

```typescript
// src/modules/orders/listeners/order-completed.listener.ts

@Injectable()
export class OrderCompletedListener {
  constructor(private readonly metrcService: MetrcService) {}

  @OnEvent('order.completed')
  async handleOrderCompleted(event: OrderCompletedEvent) {
    const receipt: MetrcSaleReceipt = {
      SalesDateTime: event.completedAt.toISOString(),
      SalesCustomerType: event.isMedical ? 'Patient' : 'Consumer',
      PatientLicenseNumber: event.medicalCardNumber || null,
      Transactions: event.items.map(item => ({
        PackageLabel: item.metrcPackageLabel,
        Quantity: item.quantity,
        UnitOfMeasure: item.unitOfMeasure,
        TotalAmount: item.lineTotal,
      })),
    };

    try {
      await this.metrcService.reportSale(
        event.dispensaryId, receipt
      );
    } catch (error) {
      // Queued for retry - compliance service monitors
      this.logger.error(
        `Metrc sale report failed for order ${event.orderId}`,
        error.stack,
      );
    }
  }
}
```

---

## 4. Otreeba Open Cannabis API Integration

### 4.1 Authentication

Otreeba uses API key authentication via an `X-API-Key` header:

```typescript
headers: { 'X-API-Key': process.env.OTREEBA_API_KEY }
Base URL: https://api.otreeba.com/v1
```

### 4.2 Endpoints We Use

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/strains` | List all strains (paginated) |
| GET | `/strains/{ocpc}` | Get strain by OCPC code |
| GET | `/flowers` | List flower products |
| GET | `/flowers/{ocpc}` | Get flower details |
| GET | `/edibles` | List edible products |
| GET | `/edibles/{ocpc}` | Get edible details |
| GET | `/extracts` | List extract/concentrate products |
| GET | `/extracts/{ocpc}` | Get extract details |
| GET | `/brands` | List cannabis brands |
| GET | `/brands/{ocpc}` | Get brand details |
| GET | `/brands/{ocpc}/products` | Get all products for a brand |
| GET | `/seed-companies` | List seed companies |
| GET | `/studies/conditions` | List medical conditions with studies |

All list endpoints accept `page`, `count` (max 50), and `sort` parameters. OCPC (Open Cannabis Product Code) is Otreeba's universal identifier.

### 4.3 OtreebaService Implementation

Located at: `src/modules/product-data/otreeba.service.ts`

```typescript
@Injectable()
export class OtreebaService {
  private readonly baseUrl = 'https://api.otreeba.com/v1';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(StrainData)
    private readonly strainRepo: Repository<StrainData>,
  ) {}

  private get headers() {
    return {
      'X-API-Key': this.configService.get('OTREEBA_API_KEY'),
    };
  }

  // Fetch and cache strain data
  async getStrain(ocpc: string): Promise<StrainData> {
    // Check local cache first
    const cached = await this.strainRepo.findOne({
      where: { ocpc },
    });
    if (cached && !this.isStale(cached.lastSyncedAt)) {
      return cached;
    }

    // Fetch from Otreeba
    const { data } = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/strains/${ocpc}`,
        { headers: this.headers },
      ),
    );

    // Upsert local cache
    return this.strainRepo.save({
      ...cached,
      ocpc: data.ocpc,
      name: data.name,
      type: data.type, // indica | sativa | hybrid
      description: data.description,
      effects: data.effects,
      flavors: data.flavors,
      lineage: data.lineage,
      genetics: data.genetics,
      lastSyncedAt: new Date(),
    });
  }

  // Bulk import strains for dispensary catalog seeding
  async bulkImportStrains(
    dispensaryId: string,
    options: { type?: string; page?: number; count?: number },
  ): Promise<BulkImportResult> {
    const params = {
      page: options.page || 0,
      count: Math.min(options.count || 50, 50),
      sort: '-createdAt',
    };

    const { data } = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/strains`, {
        headers: this.headers,
        params,
      }),
    );

    let imported = 0;
    let skipped = 0;
    for (const strain of data.data) {
      const exists = await this.strainRepo.findOne({
        where: { ocpc: strain.ocpc },
      });
      if (!exists) {
        await this.strainRepo.save({
          ocpc: strain.ocpc,
          name: strain.name,
          type: strain.type,
          description: strain.description,
          effects: strain.effects,
          flavors: strain.flavors,
          lastSyncedAt: new Date(),
        });
        imported++;
      } else {
        skipped++;
      }
    }

    return { imported, skipped, total: data.data.length };
  }

  // Enrich an existing product with Otreeba strain data
  async enrichProduct(
    productId: string,
    strainName: string,
  ): Promise<EnrichmentResult> {
    // Search Otreeba for matching strain
    // Map effects, flavors, terpenes to product metadata
    // Update product.cannabisMetadata
  }
}
```

---

## 5. The Bridge: How Metrc + Otreeba Work Together

The two services never talk to each other directly. CannaSaas is the orchestrator. Here's how the data flows through a product's lifecycle:

### 5.1 Product Onboarding Flow

1. **Dispensary creates a new product** in CannaSaas admin (strain name, category, pricing).
2. **CannaSaas enriches from Otreeba** — matches strain name, pulls effects (relaxed, euphoric, creative), flavors (earthy, citrus), type (indica/sativa/hybrid), description, and lineage.
3. **Dispensary links Metrc Package UID** — associates the product variant with the Metrc package label (received from distributor transfer).
4. **Product is now live** — storefront shows Otreeba-enriched details (effects, flavors), backend tracks the Metrc package label for compliance.

### 5.2 Sale Flow (End to End)

1. Customer adds product to cart → checkout → payment processed (Stripe)
2. OrderService emits `order.completed` event
3. ComplianceService logs the sale (`compliance_logs` table)
4. OrderCompletedListener maps order items to Metrc sale receipt format
5. MetrcService POSTs receipt to `/sales/v2/receipts` with package labels
6. Success → sync_log marked complete. Failure → queued for retry (exponential backoff)

### 5.3 Inventory Reconciliation

Nightly CRON job (or on-demand from admin):

1. Pull active packages from Metrc for each licensed dispensary
2. Compare quantities against local inventory (`ProductVariant.stockQuantity`)
3. Flag discrepancies > threshold in admin dashboard
4. Generate discrepancy report for compliance review

---

## 6. Database Schema Updates

### 6.1 New Entities

#### MetrcCredential

```typescript
@Entity('metrc_credentials')
export class MetrcCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  dispensaryId: string;

  @ManyToOne(() => Dispensary)
  dispensary: Dispensary;

  @Column({ type: 'varchar' })  // Encrypted at rest
  userApiKey: string;

  @Column({ type: 'varchar' })
  licenseNumber: string;

  @Column({ type: 'varchar', length: 2 })
  state: string;  // NY, NJ, CT

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastValidatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### MetrcSyncLog

```typescript
@Entity('metrc_sync_logs')
@Index(['dispensaryId', 'createdAt'])
@Index(['status', 'retryScheduledAt'])
export class MetrcSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  dispensaryId: string;

  @Column({ type: 'varchar' })
  endpoint: string;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'jsonb', nullable: true })
  requestPayload: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  responsePayload: Record<string, any>;

  @Column({ type: 'int', nullable: true })
  responseCode: number;

  @Column({ type: 'enum', enum: ['pending', 'success', 'failed', 'retrying'] })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  errorMessage: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  retryScheduledAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### StrainData (Otreeba cache)

```typescript
@Entity('strain_data')
@Index(['name'])
export class StrainData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  ocpc: string;  // Otreeba product code

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'enum', enum: ['indica', 'sativa', 'hybrid'] })
  type: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  effects: { name: string; score: number }[];

  @Column({ type: 'jsonb', nullable: true })
  flavors: { name: string; score: number }[];

  @Column({ type: 'jsonb', nullable: true })
  lineage: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  genetics: Record<string, any>;

  @Column({ type: 'timestamp' })
  lastSyncedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
```

### 6.2 Product Entity Update

Add these columns to the existing Product entity (`src/modules/products/entities/product.entity.ts`):

```typescript
// New columns on Product entity
@Column({ type: 'varchar', nullable: true })
metrcPackageLabel: string;  // Links to Metrc package UID

@Column({ type: 'varchar', nullable: true })
metrcPackageId: number;  // Metrc internal ID (returned on POST)

@Column({ type: 'uuid', nullable: true })
strainDataId: string;  // FK to strain_data table

@ManyToOne(() => StrainData, { eager: false })
strainData: StrainData;
```

---

## 7. New Module File Structure

These files add to the existing scaffolding. The compliance/metrc stubs from Sprint 13 are replaced with full implementations:

```
cannasaas-api/src/modules/
├── compliance/
│   ├── metrc/
│   │   ├── metrc.module.ts
│   │   ├── metrc.service.ts              # Core API client
│   │   ├── metrc.controller.ts           # Admin endpoints
│   │   ├── metrc-sync.cron.ts            # Nightly reconciliation
│   │   ├── metrc-retry.processor.ts      # Bull queue retry handler
│   │   ├── dto/
│   │   │   ├── metrc-sale-receipt.dto.ts
│   │   │   ├── metrc-package.dto.ts
│   │   │   ├── metrc-adjustment.dto.ts
│   │   │   ├── metrc-transfer.dto.ts
│   │   │   └── metrc-credential.dto.ts
│   │   ├── entities/
│   │   │   ├── metrc-credential.entity.ts
│   │   │   └── metrc-sync-log.entity.ts
│   │   └── interfaces/
│   │       └── metrc-api.interface.ts     # Type defs for Metrc
│   ├── audit/                              # Existing (Sprint 7-8)
│   ├── guards/                             # Existing (Sprint 7-8)
│   └── compliance.module.ts                # Updated imports
│
├── product-data/                           # NEW MODULE
│   ├── product-data.module.ts
│   ├── otreeba.service.ts                  # Otreeba API client
│   ├── product-enrichment.service.ts       # Enrichment orchestrator
│   ├── product-data.controller.ts          # Admin: import/enrich
│   ├── otreeba-sync.cron.ts               # Periodic catalog refresh
│   ├── dto/
│   │   ├── bulk-import.dto.ts
│   │   └── enrich-product.dto.ts
│   ├── entities/
│   │   └── strain-data.entity.ts
│   └── interfaces/
│       └── otreeba-api.interface.ts
│
└── orders/
    └── listeners/
        └── order-completed.listener.ts     # NEW: triggers Metrc
```

---

## 8. Environment Configuration

Add these variables to `.env` and ConfigModule validation:

```bash
# === METRC CONNECT ===
METRC_INTEGRATOR_KEY=your_integrator_api_key_here
METRC_SANDBOX_MODE=true          # Use sandbox endpoints during dev
METRC_NY_BASE_URL=https://api-ny.metrc.com
METRC_NJ_BASE_URL=https://api-nj.metrc.com
METRC_CT_BASE_URL=https://api-ct.metrc.com
METRC_RETRY_MAX=5
METRC_RETRY_DELAY_MS=30000       # 30 seconds initial backoff
METRC_SYNC_CRON=0 2 * * *        # Nightly at 2AM ET

# === OTREEBA ===
OTREEBA_API_KEY=your_otreeba_api_key_here
OTREEBA_BASE_URL=https://api.otreeba.com/v1
OTREEBA_CACHE_TTL_HOURS=168      # Refresh strain data weekly
OTREEBA_SYNC_CRON=0 4 * * 0      # Weekly Sundays at 4AM

# === ENCRYPTION (for Metrc user API keys at rest) ===
CREDENTIAL_ENCRYPTION_KEY=your_32_char_encryption_key
```

The `METRC_SANDBOX_MODE` flag should be `true` during development and testing. Metrc provides sandbox environments that mirror production but don't affect real compliance data.

---

## 9. Implementation Sequence (Sprint 13)

Sprint 13 is estimated at 3 weeks, broken into clear phases:

### Week 1: Foundation + Metrc Core

| Day | Task | Files |
|---|---|---|
| 1-2 | Database migrations: `metrc_credentials`, `metrc_sync_logs`, `strain_data` tables. Product entity updates. | `migrations/` |
| 2-3 | MetrcCredential + MetrcSyncLog entities, DTOs. Encryption utilities for API key storage. | `entities/`, `dto/` |
| 3-4 | MetrcService core: auth headers, generic `callMetrc()` with retry logic, error handling. | `metrc.service.ts` |
| 4-5 | MetrcService endpoints: `reportSale()`, `getActivePackages()`, `adjustPackage()`, `getIncomingTransfers()`. | `metrc.service.ts` |
| 5 | MetrcController: admin endpoints for credential management, manual sync trigger, sync log viewer. | `metrc.controller.ts` |

### Week 2: Otreeba + Event Wiring

| Day | Task | Files |
|---|---|---|
| 6-7 | StrainData entity. OtreebaService: `getStrain()`, `bulkImportStrains()`, search by name. | `otreeba.service.ts`, `entities/` |
| 7-8 | ProductEnrichmentService: match strain names, auto-populate effects/flavors/type on products. | `product-enrichment.service.ts` |
| 8-9 | OrderCompletedListener: event-driven Metrc sale reporting. Wire into existing order flow. | `order-completed.listener.ts` |
| 9-10 | Bull queue for Metrc retry processing. Failed sync recovery. | `metrc-retry.processor.ts` |

### Week 3: CRON Jobs + Testing + Admin UI

| Day | Task | Files |
|---|---|---|
| 11-12 | Metrc nightly sync CRON: inventory reconciliation, discrepancy flagging. | `metrc-sync.cron.ts` |
| 12-13 | Otreeba weekly sync CRON: refresh stale strain data, import new strains. | `otreeba-sync.cron.ts` |
| 13-14 | Integration tests: mock Metrc/Otreeba APIs, test full sale-to-report flow. | `*.spec.ts` |
| 15 | Admin dashboard updates: Metrc sync status panel, Otreeba catalog coverage widget. | `admin/` components |

---

## 10. Testing Strategy

### 10.1 Metrc Sandbox

Metrc provides sandbox environments for each state. These mirror production APIs but don't affect real compliance data. Test with:

- Sandbox API keys from Metrc Connect portal
- Synthetic dispensary data (test license numbers)
- Full sale lifecycle: create receipt → verify in sandbox UI → void
- Rate limit handling: verify 429 response triggers exponential backoff
- Auth failure: invalid/expired user API key returns 401, logged and flagged

### 10.2 Otreeba Testing

Use the real Otreeba API with test queries (free tier). Mock for unit tests:

- Strain lookup by OCPC: verify data mapping to StrainData entity
- Bulk import: verify deduplication, pagination handling
- Enrichment: verify effects/flavors mapped correctly to Product metadata
- Stale cache detection: verify TTL-based refresh triggers

### 10.3 Integration Tests

End-to-end flow with mocked external APIs:

- Product created → Otreeba enrichment triggered → strain data populated
- Order completed → Metrc sale receipt posted → sync log recorded
- Metrc API down → retry queued → recovered on next attempt
- Inventory discrepancy → nightly sync flags mismatch → admin notified

---

## 11. Project Guide Updates

The following sections of the CannaSaas Project Guide should be updated to reflect the Metrc Connect + Otreeba integration:

### 11.1 Section 4: Backend Module Architecture (add rows)

| Module | Sprint | Responsibility |
|---|---|---|
| `compliance/metrc` | S13 | Metrc Connect API client, sale reporting, inventory sync, credential mgmt, retry queue |
| `product-data` | S13 | Otreeba API client, strain data caching, product enrichment, bulk catalog seeding |

### 11.2 Section 6: Metrc Integration (REPLACE entire section)

The original Project Guide stated: *"Metrc integration is the dispensary's responsibility, not CannaSaas. CannaSaas provides data export in Metrc format."*

**This is now replaced with:** "CannaSaas integrates directly with Metrc Connect API as a registered third-party integrator. Sales are automatically reported within 24 hours of completion. Inventory reconciliation runs nightly. Dispensaries provide their Metrc user API key during onboarding, and all compliance reporting is handled by the platform."

### 11.3 Section on BioTrack (UPDATE)

Remove references to BioTrack SOAP integration. Since the August 2025 BioTrack/Metrc merger, all states are converging on Metrc. Connecticut operators on BioTrack will transition to Metrc. CannaSaas targets Metrc exclusively.

### 11.4 Compliance Guide (`docs/compliance-guide.md`)

Update Section 6 (Metrc Integration) to replace the stub MetrcService code with references to the full implementation in this document. Add sections on:

- Metrc credential onboarding flow (dispensary setup wizard)
- Retry and failure recovery procedures
- Nightly reconciliation process
- Sync log monitoring and alerting

### 11.5 POS Integration Guide (`docs/pos-integration.md`)

Add a section on how POS adapters should pass Metrc package labels through the order flow. When a POS system (Dutchie, Treez) creates a sale, the adapter must include the `metrcPackageLabel` on each line item so the OrderCompletedListener can build valid Metrc receipts.

### 11.6 File Structure (`cannasaas-scaffolding-commands.sh`)

Add the new files from Section 7 to the scaffolding script. Sprint 13 annotations:

```bash
# Compliance - METRC [CODE - Sprint 13] (replace stubs)
touch cannasaas-api/src/modules/compliance/metrc/metrc.service.ts
touch cannasaas-api/src/modules/compliance/metrc/metrc.controller.ts
touch cannasaas-api/src/modules/compliance/metrc/metrc.module.ts
touch cannasaas-api/src/modules/compliance/metrc/metrc-sync.cron.ts
touch cannasaas-api/src/modules/compliance/metrc/metrc-retry.processor.ts
mkdir -p cannasaas-api/src/modules/compliance/metrc/dto
mkdir -p cannasaas-api/src/modules/compliance/metrc/entities
mkdir -p cannasaas-api/src/modules/compliance/metrc/interfaces

# Product Data - Otreeba [CODE - Sprint 13] (new module)
mkdir -p cannasaas-api/src/modules/product-data/dto
mkdir -p cannasaas-api/src/modules/product-data/entities
mkdir -p cannasaas-api/src/modules/product-data/interfaces
touch cannasaas-api/src/modules/product-data/product-data.module.ts
touch cannasaas-api/src/modules/product-data/otreeba.service.ts
touch cannasaas-api/src/modules/product-data/product-enrichment.service.ts
touch cannasaas-api/src/modules/product-data/product-data.controller.ts
touch cannasaas-api/src/modules/product-data/otreeba-sync.cron.ts
```

### 11.7 Environment Variables (`.env.example`)

Add all variables from Section 8 to the project's `.env.example` file.

---

## 12. Risk Register & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Metrc API downtime | High — sales not reported | Low | Retry queue with exponential backoff. Sync logs track all failures. Dashboard alerts staff. |
| Metrc rate limiting (429) | Medium — batch delays | Medium | Batch POST requests (max 10 objects). Respect rate limit headers. Queue overflow handled by Bull. |
| Otreeba data staleness | Low — cosmetic only | Medium | Weekly CRON refresh. TTL-based cache invalidation. Dispensaries can manually override strain data. |
| Otreeba API shutdown | Low — enrichment stops | Low | Strain data cached locally in PostgreSQL. If Otreeba goes offline, existing data persists. Can migrate to alternative data source. |
| Metrc credential leak | Critical — compliance breach | Low | User API keys encrypted at rest (AES-256). Accessible only through service layer. Audit log on all access. |
| NY Metrc deadline (Feb 28) | High — can't sell | High | Prioritize sale reporting over other Metrc features. Minimum viable: `reportSale()` + `getActivePackages()`. |
| State-specific API differences | Medium — logic branching | Medium | Abstract state config into MetrcCredential entity. State-specific behavior isolated in MetrcService methods. |

The highest priority risk is the NY Metrc deadline of February 28, 2026, when products can no longer be transferred to dispensaries without Retail Item UIDs. The implementation sequence prioritizes Metrc sale reporting and package management to meet this deadline.
