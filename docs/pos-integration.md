# CannaSaas — POS Integration Guide

**Version:** 2.0 | February 2026  
**Supported Systems:** Dutchie (GraphQL), Treez (REST)  
**Architecture:** Adapter/Strategy Pattern

---

## 1. Overview

CannaSaas integrates with external Point-of-Sale systems to keep inventory, menus, and orders synchronized. The integration layer uses an adapter pattern so new POS systems can be added without modifying core business logic.

```
CannaSaas Backend
    │
    ├── pos.service.ts (orchestrator)
    │   ├── Selects correct adapter based on dispensary config
    │   ├── Handles retry logic and error recovery
    │   └── Logs all sync operations
    │
    ├── interfaces/pos-provider.interface.ts (contract)
    │
    └── adapters/
        ├── dutchie.adapter.ts   (GraphQL)
        ├── treez.adapter.ts     (REST)
        └── [future].adapter.ts  (extensible)

Sync Types:
  1. Menu/Product Sync:  POS → CannaSaas (pull products)
  2. Inventory Sync:     POS ↔ CannaSaas (bidirectional quantities)
  3. Order Push:         CannaSaas → POS (push completed orders)
```

---

## 2. POS Provider Interface

All adapters implement this common interface:

```typescript
// src/pos/interfaces/pos-provider.interface.ts

export interface PosProduct {
  externalId: string;
  name: string;
  category: string;
  brand: string;
  productType: string;
  strainType?: string;
  thcContent?: number;
  cbdContent?: number;
  description?: string;
  imageUrl?: string;
  variants: PosVariant[];
}

export interface PosVariant {
  externalId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  weight?: number;
  weightUnit?: string;
}

export interface PosOrder {
  externalId: string;
  items: Array<{
    externalProductId: string;
    externalVariantId: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  customerName: string;
  customerPhone?: string;
}

export interface PosProvider {
  // Connection
  connect(credentials: PosCredentials): Promise<boolean>;
  testConnection(): Promise<boolean>;
  disconnect(): Promise<void>;

  // Product/Menu Sync
  fetchProducts(): Promise<PosProduct[]>;
  fetchProductById(externalId: string): Promise<PosProduct | null>;

  // Inventory Sync
  fetchInventory(): Promise<Array<{ externalVariantId: string; quantity: number }>>;
  updateInventory(variantId: string, quantity: number): Promise<boolean>;

  // Order Sync
  pushOrder(order: PosOrder): Promise<{ externalOrderId: string }>;
  getOrderStatus(externalOrderId: string): Promise<string>;
}
```

---

## 3. Dutchie Adapter (GraphQL)

```typescript
// src/pos/adapters/dutchie.adapter.ts

@Injectable()
export class DutchieAdapter implements PosProvider {
  private client: GraphQLClient;
  private apiKey: string;

  async connect(credentials: PosCredentials): Promise<boolean> {
    this.apiKey = credentials.apiKey;
    this.client = new GraphQLClient('https://dutchie.com/graphql', {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return this.testConnection();
  }

  async fetchProducts(): Promise<PosProduct[]> {
    const query = gql`
      query GetMenu($dispensaryId: ID!) {
        menu(dispensaryId: $dispensaryId) {
          products {
            id
            name
            type
            category
            brand { name }
            strainType
            potencyCbd { formatted }
            potencyThc { formatted }
            description
            image
            variants {
              id
              option
              priceMed
              priceRec
              quantity
              sku
            }
          }
        }
      }
    `;

    const data = await this.client.request(query, {
      dispensaryId: this.dispensaryExternalId,
    });

    return data.menu.products.map(this.mapDutchieProduct);
  }

  async pushOrder(order: PosOrder): Promise<{ externalOrderId: string }> {
    const mutation = gql`
      mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          id
          status
        }
      }
    `;

    const result = await this.client.request(mutation, {
      input: this.mapToOrderInput(order),
    });

    return { externalOrderId: result.createOrder.id };
  }

  private mapDutchieProduct(raw: any): PosProduct {
    return {
      externalId: raw.id,
      name: raw.name,
      category: raw.category,
      brand: raw.brand?.name || '',
      productType: raw.type,
      strainType: raw.strainType,
      thcContent: parseFloat(raw.potencyThc?.formatted) || undefined,
      cbdContent: parseFloat(raw.potencyCbd?.formatted) || undefined,
      description: raw.description,
      imageUrl: raw.image,
      variants: raw.variants.map(v => ({
        externalId: v.id,
        name: v.option,
        sku: v.sku || '',
        price: v.priceRec || v.priceMed,
        quantity: v.quantity || 0,
      })),
    };
  }
}
```

---

## 4. Treez Adapter (REST)

```typescript
// src/pos/adapters/treez.adapter.ts

@Injectable()
export class TreezAdapter implements PosProvider {
  private baseUrl: string;
  private apiKey: string;
  private clientId: string;

  async connect(credentials: PosCredentials): Promise<boolean> {
    this.baseUrl = credentials.endpoint; // e.g., https://api.treez.io/v2
    this.apiKey = credentials.apiKey;
    this.clientId = credentials.clientId;
    return this.testConnection();
  }

  async fetchProducts(): Promise<PosProduct[]> {
    const response = await this.httpService.get(
      `${this.baseUrl}/inventory/products`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-Id': this.clientId,
        },
      },
    );

    return response.data.products.map(this.mapTreezProduct);
  }

  async updateInventory(variantId: string, quantity: number): Promise<boolean> {
    const response = await this.httpService.put(
      `${this.baseUrl}/inventory/${variantId}`,
      { quantity },
      { headers: this.getHeaders() },
    );
    return response.status === 200;
  }

  async pushOrder(order: PosOrder): Promise<{ externalOrderId: string }> {
    const response = await this.httpService.post(
      `${this.baseUrl}/orders`,
      this.mapToTreezOrder(order),
      { headers: this.getHeaders() },
    );
    return { externalOrderId: response.data.orderId };
  }
}
```

---

## 5. Product Mapping

External POS product IDs must be mapped to internal CannaSaas product IDs:

```typescript
// src/pos/entities/product-mapping.entity.ts

@Entity('pos_product_mappings')
@Index(['dispensaryId', 'externalProductId'], { unique: true })
export class ProductMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  dispensaryId: string;

  @Column({ type: 'uuid' })
  internalProductId: string;

  @Column({ type: 'uuid', nullable: true })
  internalVariantId: string;

  @Column()
  externalProductId: string;

  @Column({ nullable: true })
  externalVariantId: string;

  @Column({ type: 'varchar' })
  posProvider: string; // 'dutchie' | 'treez'

  @Column({ type: 'timestamp' })
  lastSyncedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  syncMetadata: Record<string, any>;
}
```

### Auto-Mapping

On first sync, products are matched by:
1. **SKU** (exact match)
2. **Name + Brand** (fuzzy match, requires manual confirmation)
3. **Unmatched** items flagged for manual mapping in the admin UI

---

## 6. Sync Scheduling

### 6.1 Automated Sync (Every 10 Minutes)

```typescript
// src/workers/pos-sync.cron.ts

@Injectable()
export class PosSyncCron {
  @Cron('*/10 * * * *') // Every 10 minutes
  async syncAll(): Promise<void> {
    const connections = await this.posConnectionRepo.find({
      where: { isActive: true, autoSyncEnabled: true },
    });

    for (const conn of connections) {
      try {
        await this.posService.syncInventory(conn.dispensaryId);
        await this.logSync(conn.dispensaryId, 'inventory', 'success');
      } catch (error) {
        await this.logSync(conn.dispensaryId, 'inventory', 'error', error.message);
        // Alert after 3 consecutive failures
        if (await this.getConsecutiveFailures(conn.dispensaryId) >= 3) {
          await this.notificationService.alertPosFailure(conn.dispensaryId);
        }
      }
    }
  }
}
```

### 6.2 Manual Sync

Triggered from the admin portal POS page:

```
POST /dispensaries/:id/pos/sync
Body: { syncType: "full" | "inventory_only" | "orders_only" }
```

---

## 7. Sync Audit Logging

```typescript
// src/pos/entities/sync-log.entity.ts

@Entity('pos_sync_logs')
@Index(['dispensaryId', 'createdAt'])
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  dispensaryId: string;

  @Column({ type: 'varchar' })
  syncType: 'products' | 'inventory' | 'orders';

  @Column({ type: 'varchar' })
  direction: 'pull' | 'push' | 'bidirectional';

  @Column({ type: 'varchar' })
  status: 'started' | 'completed' | 'failed';

  @Column({ type: 'integer', default: 0 })
  itemsProcessed: number;

  @Column({ type: 'integer', default: 0 })
  itemsFailed: number;

  @Column({ type: 'jsonb', nullable: true })
  errors: Array<{ item: string; error: string }>;

  @Column({ type: 'integer' }) // milliseconds
  durationMs: number;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## 8. POS Connection Configuration

```typescript
// src/pos/entities/pos-connection.entity.ts

@Entity('pos_connections')
export class PosConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  dispensaryId: string;

  @Column({ type: 'varchar' })
  provider: 'dutchie' | 'treez'; // Extensible

  @Column({ type: 'jsonb' })
  credentials: {
    apiKey: string;     // Encrypted at rest (AWS KMS)
    clientId?: string;
    endpoint?: string;
    dispensaryExternalId?: string;
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  autoSyncEnabled: boolean;

  @Column({ type: 'integer', default: 10 })
  syncIntervalMinutes: number;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @Column({ type: 'varchar', nullable: true })
  lastSyncStatus: string;
}
```

---

## 9. Adding a New POS Adapter

1. Create `src/pos/adapters/[name].adapter.ts`
2. Implement the `PosProvider` interface
3. Register in `pos.module.ts` providers
4. Add the provider name to the `PosConnection.provider` enum
5. Add product field mapping logic
6. Test with sandbox/staging credentials
7. Document any provider-specific quirks

The adapter pattern ensures no changes to `pos.service.ts`, `pos.controller.ts`, or any other existing code.

---

## 10. Error Handling & Recovery

| Scenario | Behavior |
|---|---|
| POS API timeout | Retry 3x with exponential backoff (1s, 2s, 4s) |
| Authentication failure | Disable auto-sync, notify admin |
| Partial sync failure | Complete remaining items, log failures |
| 3+ consecutive failures | Alert via SMS/email, mark connection unhealthy |
| POS API rate limit | Respect `Retry-After` header, queue remaining items |
| Network outage | Queue sync operations, resume when connectivity returns |
