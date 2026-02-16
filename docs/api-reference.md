# CannaSaas — API Reference

**Base URL:** `https://api.cannasaas.com/v1`  
**Authentication:** JWT Bearer token in `Authorization` header  
**Tenant Context:** `X-Organization-Id` and `X-Dispensary-Id` headers required on most endpoints  
**Rate Limiting:** 60 req/min (free), 300 (basic), 1000 (premium), 5000 (enterprise)

---

## Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [{ "field": "email", "message": "must be valid email" }]
  }
}
```

---

## Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user account |
| POST | `/auth/login` | Public | Login, returns JWT + refresh token |
| POST | `/auth/logout` | Bearer | Invalidate refresh token |
| POST | `/auth/refresh` | Refresh Token | Get new access token |
| GET | `/auth/profile` | Bearer | Get current user profile |
| POST | `/auth/forgot-password` | Public | Request password reset email |
| POST | `/auth/reset-password` | Public | Reset password with token |

### POST /auth/register
```json
// Request
{ "email": "user@example.com", "password": "SecurePass123!", "firstName": "Jane", "lastName": "Doe" }

// Response 201
{ "user": { "id": "uuid", "email": "...", "roles": ["customer"] }, "accessToken": "jwt...", "refreshToken": "rt..." }
```

### POST /auth/login
```json
// Request
{ "email": "user@example.com", "password": "SecurePass123!" }

// Response 200
{ "user": { "id": "uuid", "email": "...", "organizationId": "...", "roles": [...] }, "accessToken": "jwt...", "refreshToken": "rt..." }
```

**JWT Payload:**
```typescript
{
  userId: string;
  email: string;
  organizationId: string;
  roles: string[];       // ["admin", "manager"]
  permissions: string[]; // ["products:read", "orders:write"]
  iat: number;
  exp: number;           // 15 min from issue
}
```

---

## Tenants

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/tenants/public` | Public | List available tenants (for login selector) |

---

## Organizations (Super Admin)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/organizations` | Super Admin | List all organizations |
| POST | `/organizations` | Super Admin | Create organization |
| GET | `/organizations/:id` | Org Admin+ | Get organization details |
| PUT | `/organizations/:id` | Org Admin | Update organization |
| DELETE | `/organizations/:id` | Super Admin | Delete organization |

### POST /organizations
```json
// Request
{ "name": "Green Leaf Holdings", "slug": "green-leaf", "contactEmail": "admin@greenleaf.com" }

// Response 201
{ "id": "uuid", "name": "...", "slug": "green-leaf", "isActive": true, "createdAt": "..." }
```

---

## Companies

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/companies` | Org Admin+ | List companies (filtered by org) |
| POST | `/companies` | Org Admin | Create company |
| GET | `/companies/:id` | Company Admin+ | Get company details |
| PUT | `/companies/:id` | Company Admin | Update company |
| DELETE | `/companies/:id` | Org Admin | Delete company |

### POST /companies
```json
// Request
{ "organizationId": "uuid", "name": "Green Leaf NY Inc.", "slug": "green-leaf-ny", "licenseNumber": "NY-123" }

// Response 201
{ "id": "uuid", "organizationId": "...", "name": "...", "slug": "...", "isActive": true }
```

---

## Dispensaries

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/dispensaries` | Authenticated | List dispensaries (filtered by tenant) |
| POST | `/dispensaries` | Company Admin | Create dispensary |
| GET | `/dispensaries/nearby` | Public | Find nearby dispensaries (PostGIS) |
| GET | `/dispensaries/:id` | Authenticated | Get dispensary details |
| PUT | `/dispensaries/:id` | Manager+ | Update dispensary |
| DELETE | `/dispensaries/:id` | Company Admin | Delete dispensary |
| POST | `/dispensaries/:id/branding/logo` | Manager+ | Upload logo (S3) |
| PUT | `/dispensaries/:id/branding` | Manager+ | Update branding config |

### GET /dispensaries/nearby
```
GET /dispensaries/nearby?latitude=40.6782&longitude=-73.9442&radius=25
```
```json
// Response 200
[
  {
    "id": "uuid",
    "name": "Green Leaf Brooklyn",
    "distance": 2.4,
    "address": { "street": "...", "city": "Brooklyn", "state": "NY", "zip": "11201" },
    "operatingHours": { "monday": { "open": "09:00", "close": "21:00" } },
    "licenseType": "medical_recreational",
    "deliveryAvailable": true
  }
]
```

---

## Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | Public | List products (filtered by dispensary) |
| POST | `/products` | Manager+ | Create product |
| GET | `/products/:id` | Public | Get product detail |
| PUT | `/products/:id` | Manager+ | Update product |
| DELETE | `/products/:id` | Manager+ | Delete product |
| GET | `/products/low-stock` | Manager+ | Products below threshold |
| POST | `/products/:id/images` | Manager+ | Upload product image |
| PUT | `/products/variants/:variantId/inventory` | Manager+ | Adjust variant stock |
| GET | `/products/categories` | Public | List product categories |
| POST | `/products/categories` | Admin+ | Create category |

### GET /products
```
GET /products?category=flower&strainType=sativa&minThc=20&maxPrice=60&sort=price_asc&page=1&limit=20
```
```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "name": "Blue Dream",
      "category": "flower",
      "brand": "Premium Farms",
      "strainType": "sativa_dominant_hybrid",
      "thcContent": 24.5,
      "cbdContent": 0.8,
      "description": "...",
      "effects": ["uplifting", "creative", "euphoric"],
      "flavors": ["berry", "sweet", "earthy"],
      "images": [{ "url": "https://cdn...", "isPrimary": true }],
      "variants": [
        { "id": "uuid", "name": "1/8 oz", "sku": "BD-125", "weight": 3.5, "weightUnit": "g", "price": 45.00, "quantity": 24 }
      ]
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 147, "totalPages": 8 }
}
```

---

## Cart

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/cart` | Authenticated | Get current cart |
| POST | `/cart/items` | Authenticated | Add item to cart |
| PUT | `/cart/items/:id` | Authenticated | Update item quantity |
| DELETE | `/cart/items/:id` | Authenticated | Remove item |
| POST | `/cart/promo` | Authenticated | Apply promo code |
| DELETE | `/cart/promo` | Authenticated | Remove promo code |

### POST /cart/items
```json
// Request
{ "productId": "uuid", "variantId": "uuid", "quantity": 2 }

// Response 200
{
  "id": "uuid",
  "items": [
    { "id": "uuid", "productName": "Blue Dream", "variantName": "1/8 oz", "quantity": 2, "unitPrice": 45.00, "totalPrice": 90.00 }
  ],
  "subtotal": 90.00,
  "promoDiscount": 0,
  "tax": 18.68,
  "total": 108.68
}
```

---

## Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/orders` | Authenticated | List user's orders |
| POST | `/orders` | Authenticated | Create order from cart |
| GET | `/orders/:id` | Authenticated | Get order detail |
| PUT | `/orders/:id/status` | Manager+ | Update order status |
| POST | `/orders/:id/cancel` | Authenticated | Cancel order |
| POST | `/orders/:id/refund` | Admin+ | Refund order |

**Order Status Lifecycle:**
```
pending → confirmed → preparing → ready_for_pickup → completed
                   → out_for_delivery → delivered → completed
pending → cancelled
completed → refunded (partial or full)
```

---

## Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/payments` | Authenticated | Create Stripe payment intent |
| POST | `/payments/webhook` | Stripe | Stripe webhook handler |

---

## Search (Elasticsearch)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/search?q=blue+dream` | Public | Full-text product search with autocomplete |
| GET | `/search/suggest?q=blu` | Public | Autocomplete suggestions |

Cannabis-specific synonyms: "weed" ↔ "flower" ↔ "bud", "cart" ↔ "vape cartridge", etc.

---

## Delivery

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/delivery/zones` | Manager+ | List delivery zones |
| POST | `/delivery/zones` | Admin+ | Create delivery zone (PostGIS polygon) |
| POST | `/delivery/check-address` | Public | Check if address is deliverable |
| GET | `/delivery/drivers` | Manager+ | List drivers |
| POST | `/delivery/assign` | Manager+ | Assign driver to order |
| WS | `/delivery/tracking` | Authenticated | WebSocket: real-time delivery updates |

---

## POS Integration

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/dispensaries/:id/pos/configure` | Admin+ | Connect POS system |
| GET | `/dispensaries/:id/pos/status` | Manager+ | Connection status |
| POST | `/dispensaries/:id/pos/sync` | Manager+ | Trigger manual sync |
| GET | `/dispensaries/:id/pos/sync-logs` | Manager+ | Sync history |

Supported POS systems: Dutchie (GraphQL), Treez (REST). Adapter pattern for extensibility.

---

## Compliance

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/compliance/logs` | Manager+ | Audit log entries |
| GET | `/compliance/purchase-limit` | Authenticated | Check customer's remaining daily limit |
| POST | `/compliance/reports/daily` | Manager+ | Generate daily sales report |
| GET | `/compliance/analytics/sales` | Manager+ | Sales analytics |
| GET | `/compliance/analytics/top-products` | Manager+ | Top selling products |
| GET | `/compliance/analytics/revenue` | Manager+ | Revenue breakdown |

---

## Analytics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/analytics/dashboard` | Manager+ | Dashboard metrics (revenue, orders, AOV) |
| GET | `/analytics/products` | Manager+ | Product performance |
| GET | `/analytics/customers` | Manager+ | Customer metrics |
| GET | `/analytics/export?format=csv` | Admin+ | CSV data export |

### GET /analytics/dashboard
```json
{
  "revenue": { "total": 125000.00, "change": 15.5, "byDay": [...] },
  "orders": { "total": 1456, "change": 12.3 },
  "customers": { "total": 456, "new": 45, "returning": 411 },
  "avgOrderValue": { "value": 85.85, "change": 3.1 },
  "topProducts": [
    { "productId": "uuid", "name": "Blue Dream", "revenue": 12500.00, "quantity": 156 }
  ]
}
```

---

## Age Verification

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/age-verification/upload-id` | Authenticated | Upload ID for verification |
| POST | `/age-verification/verify` | Authenticated | Verify age (21+ check) |

---

## Users (Admin)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | Admin+ | List users |
| POST | `/users` | Admin+ | Create user |
| GET | `/users/:id` | Admin+ | Get user details |
| PUT | `/users/:id` | Admin+ | Update user |
| DELETE | `/users/:id` | Admin+ | Deactivate user |
| POST | `/users/:id/roles` | Admin+ | Assign roles |

---

## AI Services

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/ai/product-description` | Manager+ | Generate product description |
| POST | `/ai/recommendations` | Authenticated | Get personalized recommendations |
| POST | `/ai/chatbot` | Public | Dispensary chatbot |

---

## Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | Public | API health check |

---

## Role Permissions Matrix

| Permission | Super Admin | Owner | Admin | Manager | Budtender | Driver | Customer |
|---|---|---|---|---|---|---|---|
| Manage organizations | ✅ | | | | | | |
| Manage companies | ✅ | ✅ | | | | | |
| Manage dispensaries | ✅ | ✅ | ✅ | | | | |
| Manage products | ✅ | ✅ | ✅ | ✅ | | | |
| Manage orders | ✅ | ✅ | ✅ | ✅ | ✅ | | |
| View analytics | ✅ | ✅ | ✅ | ✅ | | | |
| Manage users | ✅ | ✅ | ✅ | | | | |
| View compliance logs | ✅ | ✅ | ✅ | ✅ | | | |
| Manage delivery | ✅ | ✅ | ✅ | ✅ | | ✅ | |
| Place orders | | | | | | | ✅ |
| View own orders | | | | | | | ✅ |
