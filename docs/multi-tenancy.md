# CannaSaas — Multi-Tenancy Architecture

**Version:** 2.0 | February 2026

---

## 1. Isolation Strategy

CannaSaas uses a **hybrid multi-tenancy** approach that balances security, performance, and cost:

| Level | Strategy | Reasoning |
|---|---|---|
| **Organization** | Separate PostgreSQL schemas | Hard partition for security and compliance |
| **Company / Dispensary** | Shared tables with `tenant_id` filtering | Query performance, cost efficiency |

```
org_greenleaf (schema)          org_budtender (schema)
├── companies                   ├── companies
├── dispensaries                ├── dispensaries
├── products                    ├── products
├── orders                      ├── orders
└── ...                         └── ...

Each schema is identical in structure but completely isolated.
Within a schema, rows are filtered by (company_id, dispensary_id).
```

**Benefits:**
- Organization data is completely isolated (no cross-org leaks possible)
- Within-org queries are fast (single schema, indexed tenant columns)
- Row-level security as defense-in-depth
- Cost-effective — not a database-per-tenant model

---

## 2. Tenant Context Flow

Every API request carries tenant context through three layers:

### 2.1 Request Headers

```
X-Organization-Id: org_greenleaf
X-Dispensary-Id: disp_brooklyn
Authorization: Bearer <jwt>
```

The JWT payload also contains `organizationId`, providing a second verification path.

### 2.2 Tenant Middleware

```typescript
// src/common/middleware/tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const orgId = req.headers['x-organization-id'] as string;
    const companyId = req.headers['x-company-id'] as string;
    const dispensaryId = req.headers['x-dispensary-id'] as string;

    if (!orgId) {
      throw new UnauthorizedException('Organization context required');
    }

    // Attach tenant context to request
    req['tenantContext'] = {
      organizationId: orgId,
      companyId: companyId || null,
      dispensaryId: dispensaryId || null,
      schemaName: `org_${orgId}`,  // Maps to PostgreSQL schema
    };

    next();
  }
}
```

### 2.3 Tenant Guard

```typescript
// src/common/guards/tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;           // From JWT
    const tenant = request.tenantContext; // From middleware

    // Verify the authenticated user belongs to this organization
    if (user.organizationId !== tenant.organizationId) {
      throw new ForbiddenException('Access denied to this organization');
    }

    // Verify dispensary access if dispensary-scoped
    if (tenant.dispensaryId && !user.dispensaryIds.includes(tenant.dispensaryId)) {
      throw new ForbiddenException('Access denied to this dispensary');
    }

    return true;
  }
}
```

### 2.4 Tenant Decorator

```typescript
// src/common/decorators/tenant.decorator.ts
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantContext;
  },
);

// Usage in controllers:
@Get('products')
findAll(@CurrentTenant() tenant: TenantContext) {
  return this.productsService.findAll(tenant);
}
```

---

## 3. Database Schema Management

### 3.1 Schema Provisioning

When a new organization signs up, the `tenants.service.ts` provisions a new PostgreSQL schema:

```typescript
async provisionTenant(organizationId: string): Promise<void> {
  const schemaName = `org_${organizationId}`;

  // 1. Create the schema
  await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

  // 2. Run all migrations against the new schema
  await this.dataSource.query(`SET search_path TO "${schemaName}"`);
  await this.runMigrations(schemaName);

  // 3. Seed default data (roles, categories, etc.)
  await this.seedDefaults(schemaName);

  // 4. Reset search path
  await this.dataSource.query(`SET search_path TO public`);
}
```

### 3.2 Query Scoping

Every service method receives tenant context and filters accordingly:

```typescript
// src/products/products.service.ts
async findAll(tenant: TenantContext, filters: ProductFilterDto) {
  const qb = this.productRepo
    .createQueryBuilder('p')
    .where('p.organization_id = :orgId', { orgId: tenant.organizationId });

  if (tenant.dispensaryId) {
    qb.andWhere('p.dispensary_id = :dispId', { dispId: tenant.dispensaryId });
  }

  // Apply user filters (category, strain, price range, etc.)
  if (filters.category) qb.andWhere('p.category = :cat', { cat: filters.category });
  if (filters.minThc) qb.andWhere('p.thc_content >= :minThc', { minThc: filters.minThc });

  return qb.andWhere('p.is_active = true').getMany();
}
```

### 3.3 Row-Level Security (Defense-in-Depth)

PostgreSQL RLS policies as an additional safety net:

```sql
-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see products in their organization
CREATE POLICY products_tenant_isolation ON products
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Set the org context before each request (done in middleware)
SET app.current_org_id = 'org_greenleaf_uuid';
```

---

## 4. Branding / White-Label

Each dispensary can fully customize its storefront appearance:

```typescript
interface BrandingConfig {
  // Logos
  logoUrl: string;          // Primary logo (S3 + CloudFront)
  faviconUrl: string;

  // Colors (CSS custom properties injected at runtime)
  primaryColor: string;     // --primary
  secondaryColor: string;   // --secondary
  accentColor: string;      // --accent
  backgroundColor: string;  // --background
  textColor: string;        // --text

  // Typography
  headingFont: string;      // Google Fonts family
  bodyFont: string;

  // Custom domain
  customDomain?: string;    // shop.greenleafbrooklyn.com
}
```

**Branding Inheritance:**
```
Organization branding (defaults)
  └── Company branding (overrides org)
      └── Dispensary branding (overrides company)
```

The `ThemeProvider` component on the frontend reads the branding config from `GET /dispensaries/:id/branding` and injects CSS variables at runtime.

---

## 5. Subdomain Routing

Each dispensary gets a unique subdomain:

```
shop.greenleafbrooklyn.com  →  Dispensary "Green Leaf Brooklyn"
shop.greenleafnewark.com    →  Dispensary "Green Leaf Newark"
admin.cannasaas.com         →  Admin Portal
staff.cannasaas.com         →  Staff Portal
```

**Resolution:**
1. CloudFront receives request for `shop.greenleafbrooklyn.com`
2. Wildcard SSL cert covers `*.cannasaas.com` + custom domains
3. Frontend reads hostname → calls `GET /tenants/resolve?domain=shop.greenleafbrooklyn.com`
4. API returns tenant context → frontend sets `X-Organization-Id` and `X-Dispensary-Id` headers
5. All subsequent API calls are tenant-scoped
