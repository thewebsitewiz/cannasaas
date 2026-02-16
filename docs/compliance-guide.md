# CannaSaas — Compliance Guide

**Version:** 2.0 | February 2026  
**Target States:** New York, New Jersey, Connecticut

---

## 1. Overview

Cannabis compliance is non-negotiable. CannaSaas enforces compliance at the platform level so individual dispensaries can't accidentally violate regulations. Every sale, inventory change, and customer interaction is audit-logged.

**Three Pillars:**
1. **Age Verification** — No sales to anyone under 21
2. **Purchase Limits** — Daily/rolling limits per customer per state
3. **State Tracking** — Metrc integration for seed-to-sale reporting

---

## 2. Age Verification

### 2.1 Age Gate (Frontend)

Every storefront page is behind an age gate component (`AgeGate.tsx`). The user must confirm they are 21+ before viewing any products. This is stored in a session cookie (not persisted — must re-confirm each session).

### 2.2 ID Verification at Checkout

For first-time orders or when required by dispensary policy:

```typescript
// src/compliance/age-verification.service.ts

export class AgeVerificationService {
  // Option 1: Manual verification (budtender checks ID at pickup)
  async manualVerify(customerId: string, verifiedBy: string): Promise<void> {
    await this.complianceLogService.log({
      eventType: ComplianceEventType.ID_VERIFICATION,
      details: {
        customerId,
        verificationType: 'manual',
        verifiedBy,
        verified: true,
      },
    });
  }

  // Option 2: Automated verification (Onfido/Jumio integration)
  async automatedVerify(customerId: string, idImageUrl: string): Promise<VerificationResult> {
    const result = await this.onfidoClient.verify(idImageUrl);
    
    await this.complianceLogService.log({
      eventType: ComplianceEventType.ID_VERIFICATION,
      details: {
        customerId,
        verificationType: 'automated',
        provider: 'onfido',
        verified: result.isValid,
        dateOfBirth: result.dob,
        ageAtVerification: this.calculateAge(result.dob),
      },
    });

    return result;
  }
}
```

### 2.3 Delivery Verification

For delivery orders, the driver must verify ID at the door. The staff portal includes a "Verify ID" screen with:
- Photo comparison
- DOB confirmation (21+ check)
- ID expiration check
- Timestamp + GPS coordinates logged

---

## 3. Purchase Limits

### 3.1 State-Specific Limits

| State | Recreational Limit | Medical Limit | Rolling Window |
|---|---|---|---|
| **New York** | 3 oz flower, 24g concentrate | 2.5 oz / 30 days | 24 hours |
| **New Jersey** | 1 oz flower | 3 oz / 30 days | Per transaction |
| **Connecticut** | 1.5 oz flower | 2.5 oz / 30 days | Per transaction |

### 3.2 Limit Enforcement

```typescript
// src/compliance/purchase-limit.service.ts

export class PurchaseLimitService {
  async checkLimit(
    customerId: string,
    dispensaryId: string,
    items: CartItem[],
  ): Promise<PurchaseLimitResult> {
    const dispensary = await this.dispensaryRepo.findOne(dispensaryId);
    const state = dispensary.state; // NY, NJ, CT
    const limits = this.getStateLimits(state, dispensary.licenseType);

    // Calculate total weight by category
    const totals = this.calculateTotals(items);

    // Check rolling window purchases
    const recentPurchases = await this.getRecentPurchases(
      customerId,
      dispensaryId,
      limits.windowHours,
    );

    const combinedTotals = this.addTotals(totals, recentPurchases);

    // Check each category
    const violations: string[] = [];
    if (combinedTotals.flowerOz > limits.maxFlowerOz) {
      violations.push(
        `Flower limit exceeded: ${combinedTotals.flowerOz}oz of ${limits.maxFlowerOz}oz max`,
      );
    }
    if (combinedTotals.concentrateG > limits.maxConcentrateG) {
      violations.push(
        `Concentrate limit exceeded: ${combinedTotals.concentrateG}g of ${limits.maxConcentrateG}g max`,
      );
    }

    return {
      allowed: violations.length === 0,
      violations,
      remaining: {
        flowerOz: limits.maxFlowerOz - combinedTotals.flowerOz,
        concentrateG: limits.maxConcentrateG - combinedTotals.concentrateG,
      },
    };
  }

  // Endpoint: GET /compliance/purchase-limit?customerId=...
  // Returns remaining limits for the current customer
}
```

### 3.3 Cart Validation

Purchase limits are checked at two points:
1. **Add to cart** — warns if approaching limit
2. **Checkout** — blocks if limit would be exceeded

---

## 4. Audit Logging

### 4.1 Compliance Events

Every significant action creates a `compliance_log` entry:

```typescript
export enum ComplianceEventType {
  SALE = 'sale',
  RETURN = 'return',
  INVENTORY_ADJUSTMENT = 'inventory_adjustment',
  INVENTORY_RECEIVED = 'inventory_received',
  INVENTORY_DESTROYED = 'inventory_destroyed',
  PRODUCT_RECALL = 'product_recall',
  ID_VERIFICATION = 'id_verification',
  PURCHASE_LIMIT_CHECK = 'purchase_limit_check',
}
```

### 4.2 Compliance Log Entity

```typescript
@Entity('compliance_logs')
@Index(['dispensaryId', 'createdAt'])
@Index(['eventType', 'createdAt'])
export class ComplianceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  dispensaryId: string;

  @Column({ type: 'enum', enum: ComplianceEventType })
  eventType: ComplianceEventType;

  @Column({ type: 'jsonb' })
  details: Record<string, any>;
  // SALE: { orderId, items, total, customerId }
  // INVENTORY_ADJUSTMENT: { variantId, oldQty, newQty, reason, adjustedBy }
  // ID_VERIFICATION: { customerId, type, verified, verifiedBy }

  @Column({ type: 'uuid', nullable: true })
  performedBy: string; // User who performed the action

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

### 4.3 Automatic Logging

The order service automatically logs compliance events:

```typescript
// On every completed order:
await this.complianceService.logSale({
  dispensaryId: order.dispensaryId,
  orderId: order.id,
  customerId: order.customerId,
  items: order.items.map(item => ({
    productName: item.productName,
    quantity: item.quantity,
    weight: item.weight,
    batchNumber: item.batchNumber,
    thcContent: item.thcContent,
  })),
  total: order.total,
});
```

---

## 5. Daily Sales Reports

Generated nightly or on-demand for regulatory compliance:

```typescript
@Entity('daily_sales_reports')
export class DailySalesReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  dispensaryId: string;

  @Column({ type: 'date' })
  reportDate: Date;

  @Column({ type: 'jsonb' })
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalTax: number;
    totalItems: number;
    categoryBreakdown: Record<string, { quantity: number; revenue: number }>;
    averageOrderValue: number;
    uniqueCustomers: number;
    verificationCount: number;
    limitCheckCount: number;
    limitViolationCount: number;
  };

  @Column({ type: 'enum', enum: ['draft', 'finalized', 'submitted'] })
  status: string;
}
```

---

## 6. Metrc Integration

Metrc is the state-mandated seed-to-sale tracking system used by NY, NJ, and other states.

```typescript
// src/compliance/metrc.service.ts

export class MetrcService {
  private apiKey: string;
  private userKey: string;
  private baseUrl: string; // State-specific endpoint

  // Report a sale to Metrc
  async reportSale(sale: MetrcSalePayload): Promise<void> {
    await this.httpService.post(`${this.baseUrl}/sales/v2/receipts`, sale, {
      auth: { username: this.apiKey, password: this.userKey },
    });
  }

  // Sync inventory with Metrc
  async syncInventory(dispensaryId: string): Promise<void> {
    const packages = await this.httpService.get(
      `${this.baseUrl}/packages/v1/active`,
    );
    // Reconcile with local inventory
  }

  // Report inventory adjustment
  async reportAdjustment(adjustment: MetrcAdjustmentPayload): Promise<void> {
    await this.httpService.post(
      `${this.baseUrl}/packages/v1/adjust`,
      adjustment,
    );
  }
}
```

**Metrc Reporting Requirements:**
- All sales within 24 hours
- Inventory adjustments (damage, loss, destruction)
- Transfers between locations
- Package manifests for delivery

---

## 7. Data Retention

| Data Type | Retention Period | Reason |
|---|---|---|
| Compliance logs | 7 years | State regulatory requirement |
| Order history | 7 years | Tax/audit purposes |
| ID verification records | 3 years | State requirement |
| Daily sales reports | 7 years | Tax/audit purposes |
| Customer purchase history | 7 years | Purchase limit tracking |
| General user data | Until account deletion + 30 days | CCPA/privacy |
