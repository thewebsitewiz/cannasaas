# CannaSaas — Phase 2 Implementation Guide

**Current State (completed):**
- API: NestJS running on port 3000 with 0 TypeScript errors, `synchronize: false`
- Database: PostgreSQL 16 with 31 tables, seeded with 4 orgs / 13 companies / 43 dispensaries / 44 users
- Admin: React/Vite on port 5173 with login (tenant selector), dashboard (stats + nav), sidebar layout
- Auth: JWT with tenant middleware, `x-tenant-id` header on all requests
- Storefront: Scaffolded React/Vite on port 3001 (minimal)

**Existing API Routes (from startup log):**

| Module | Method | Path |
|---|---|---|
| Auth | POST | `/api/v1/auth/register` |
| Auth | POST | `/api/v1/auth/login` |
| Auth | GET | `/api/v1/auth/profile` |
| Tenants | GET | `/api/v1/tenants/public` |
| Organizations | POST/GET | `/api/v1/organizations` |
| Organizations | GET/PUT/DELETE | `/api/v1/organizations/:id` |
| Companies | POST/GET | `/api/v1/companies` |
| Companies | GET/PUT/DELETE | `/api/v1/companies/:id` |
| Dispensaries | POST/GET | `/api/v1/dispensaries` |
| Dispensaries | GET | `/api/v1/dispensaries/nearby` |
| Dispensaries | GET/PUT/DELETE | `/api/v1/dispensaries/:id` |
| Dispensaries | POST | `/api/v1/dispensaries/:id/branding/logo` |
| Dispensaries | PUT | `/api/v1/dispensaries/:id/branding` |
| Products | POST/GET | `/api/v1/products/categories` |
| Products | POST/GET | `/api/v1/products` |
| Products | GET | `/api/v1/products/low-stock` |
| Products | GET/PUT/DELETE | `/api/v1/products/:id` |
| Products | PUT | `/api/v1/products/variants/:variantId/inventory` |
| Products | POST | `/api/v1/products/:id/images` |
| Compliance | GET | `/api/v1/compliance/logs` |
| Compliance | GET | `/api/v1/compliance/purchase-limit` |
| Compliance | POST | `/api/v1/compliance/reports/daily` |
| Compliance | GET | `/api/v1/compliance/analytics/sales` |
| Compliance | GET | `/api/v1/compliance/analytics/top-products` |
| Compliance | GET | `/api/v1/compliance/analytics/revenue` |

**Role Enum:** `super_admin`, `owner`, `admin`, `manager`, `budtender`, `driver`, `customer`

---

## Phase 2A — Companies CRUD Page

**Time:** 1-2 hours
**API endpoints already exist:** GET/POST `/companies`, GET/PUT/DELETE `/companies/:id`
**Files to create:** 1 | Files to modify: 0

### DB Schema Reference: `companies`

```
id              uuid            PK, auto-generated
organization_id uuid            FK → organizations(id), NOT NULL
name            varchar(255)    NOT NULL
slug            varchar(100)    UNIQUE, NOT NULL
description     text            nullable
is_active       boolean         default true
created_at      timestamp       default now()
updated_at      timestamp       default now()
```

### Step 2A.1 — Replace CompaniesPage Stub

**File:** `cannasaas-admin/src/pages/CompaniesPage.tsx`

This page needs to:
1. Fetch companies from `GET /companies` on mount
2. Display them in a table with name, slug, status, created date
3. Provide a "Create Company" button that opens an inline form
4. Support edit and delete actions per row

```tsx
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Building2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies');
      setCompanies(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : generateSlug(name),
    }));
  };

  const handleCreate = async () => {
    try {
      await api.post('/companies', formData);
      setShowForm(false);
      setFormData({ name: '', slug: '', description: '' });
      fetchCompanies();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create company');
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await api.put(`/companies/${editingId}`, formData);
      setEditingId(null);
      setFormData({ name: '', slug: '', description: '' });
      fetchCompanies();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update company');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete company "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/companies/${id}`);
      fetchCompanies();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete company');
    }
  };

  const startEdit = (company: Company) => {
    setEditingId(company.id);
    setFormData({
      name: company.name,
      slug: company.slug,
      description: company.description || '',
    });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({ name: '', slug: '', description: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-500 mt-1">Manage operating companies within your organization.</p>
        </div>
        <Button onClick={() => { setShowForm(true); cancelEdit(); }} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Company
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="float-right">&times;</button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Company</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="company-slug"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate}>Create</Button>
            <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Companies Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Name</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Slug</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Created</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No companies found. Create one to get started.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  {editingId === company.id ? (
                    <>
                      <td className="px-6 py-4">
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="h-8"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          className="h-8"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="h-8"
                          placeholder="Description"
                        />
                      </td>
                      <td className="px-6 py-4" />
                      <td className="px-6 py-4 text-right">
                        <button onClick={handleUpdate} className="text-green-600 hover:text-green-800 mr-3">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{company.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm font-mono">{company.slug}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          company.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => startEdit(company)} className="text-gray-400 hover:text-blue-600 mr-3">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(company.id, company.name)} className="text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Step 2A.2 — Verify

1. Navigate to `http://localhost:5173/companies`
2. Should see the seeded companies for the selected tenant's organization
3. Click "Add Company" — create form appears
4. Fill in name (slug auto-generates), click Create
5. Edit icon — inline editing works
6. Delete icon — confirmation dialog, then removal

### Troubleshooting

If `GET /companies` returns empty or 404:
- The companies controller may filter by `organization_id` based on the tenant. Check `companies.service.ts` to see if it uses `TenantService` to scope queries.
- If it doesn't filter, all 13 seeded companies will appear regardless of tenant. That's fine for now.

---

## Phase 2B — Dispensaries CRUD Page

**Time:** 1.5-2 hours
**API endpoints already exist:** GET/POST `/dispensaries`, GET/PUT/DELETE `/dispensaries/:id`
**Files to create:** 1 | Files to modify: 0

### DB Schema Reference: `dispensaries`

```
id              uuid            PK, auto-generated
company_id      uuid            FK → companies(id), NOT NULL
name            varchar(255)    NOT NULL
slug            varchar(100)    UNIQUE, NOT NULL
description     text            nullable
street_address  varchar(255)    NOT NULL
city            varchar(100)    NOT NULL
state           varchar(2)      NOT NULL
zip_code        varchar(10)     NOT NULL
latitude        numeric(10,7)   nullable
longitude       numeric(10,7)   nullable
phone_number    varchar(20)     nullable
email           varchar(255)    nullable
website         varchar(255)    nullable
operating_hours jsonb           nullable
is_active       boolean         default true
created_at      timestamp       default now()
updated_at      timestamp       default now()
```

### Step 2B.1 — Replace DispensariesPage Stub

**File:** `cannasaas-admin/src/pages/DispensariesPage.tsx`

This page needs to:
1. Fetch dispensaries from `GET /dispensaries` on mount
2. Display in a table: name, company, city/state, phone, status
3. "Add Dispensary" button opens a form with address fields
4. Edit and delete actions per row
5. Show a company selector dropdown (fetched from `GET /companies`)

The component follows the same CRUD pattern as CompaniesPage but with more fields. Key differences:

- Needs a `company_id` selector — fetch companies on mount for the dropdown
- Has address fields (street_address, city, state, zip_code)
- Has contact fields (phone_number, email)
- Display format shows `city, state` as location

```tsx
// Structure (abbreviated — full code follows same pattern as CompaniesPage)

interface Dispensary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string | null;
  email: string | null;
  isActive: boolean;
  companyId: string;
  createdAt: string;
}

// Form fields needed for create/edit:
const [formData, setFormData] = useState({
  name: '',
  slug: '',
  description: '',
  companyId: '',        // dropdown from GET /companies
  streetAddress: '',
  city: '',
  state: '',
  zipCode: '',
  phoneNumber: '',
  email: '',
});

// Fetch both dispensaries and companies on mount:
useEffect(() => {
  Promise.all([
    api.get('/dispensaries'),
    api.get('/companies'),
  ]).then(([dispRes, compRes]) => {
    setDispensaries(dispRes.data);
    setCompanies(compRes.data);
  });
}, []);
```

The table columns should be: Name, Company (looked up from companies array), Location (city + state), Phone, Status, Actions.

The create/edit form should be a modal or expandable section with two rows:
- Row 1: Name, Slug, Company (dropdown)
- Row 2: Street Address, City, State (2-char), Zip
- Row 3: Phone, Email, Description

### Step 2B.2 — API Field Name Mapping

The API likely uses camelCase (NestJS default serialization) but the DB uses snake_case. When sending POST/PUT requests, use camelCase property names:

```json
{
  "name": "New Location",
  "slug": "new-location",
  "companyId": "20000000-...",
  "streetAddress": "123 Main St",
  "city": "Denver",
  "state": "CO",
  "zipCode": "80202",
  "phoneNumber": "303-555-0100",
  "email": "info@newlocation.com"
}
```

Check the API response format by running:

```bash
curl -s http://localhost:3000/api/v1/dispensaries \
  -H "x-tenant-id: 10000000-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer YOUR_TOKEN" | python3 -m json.tool | head -30
```

Match your interface fields to what the API actually returns.

---

## Phase 2C — Products CRUD Page

**Time:** 2-3 hours (most complex entity)
**API endpoints already exist:** Full CRUD + categories + variants + images
**Files to create:** 1 | Files to modify: 0

### API Endpoints for Products

```
POST   /products/categories         — Create category
GET    /products/categories         — List categories
POST   /products                    — Create product
GET    /products                    — List products
GET    /products/low-stock          — Low stock alert
GET    /products/:id                — Get product detail
PUT    /products/:id                — Update product
DELETE /products/:id                — Delete product
PUT    /products/variants/:variantId/inventory  — Update inventory
POST   /products/:id/images         — Upload product image
```

### DB Schema Reference: `products` (key fields)

From entity fixes in previous sessions, the product entity includes:
- `name`, `description`, `sku`, `price`, `category`
- `productType` enum (flower, edible, concentrate, topical, accessory, pre_roll, vape, tincture)
- `strainType` enum (sativa, indica, hybrid, cbd)
- `thcContent`, `cbdContent` — decimal percentages
- `manufacturer` — string
- `organizationId` — FK to organizations

### Step 2C.1 — Replace ProductsPage Stub

**File:** `cannasaas-admin/src/pages/ProductsPage.tsx`

This page should have:
1. A filterable/searchable product table
2. Category filter dropdown (from `GET /products/categories`)
3. "Add Product" button opening a detailed form
4. Product type and strain type dropdowns
5. Price, THC%, CBD% inputs
6. Low stock indicator badge

**Product form fields:**

```tsx
const [formData, setFormData] = useState({
  name: '',
  description: '',
  sku: '',
  price: '',
  category: '',
  productType: 'flower',     // enum: flower, edible, concentrate, etc.
  strainType: 'hybrid',      // enum: sativa, indica, hybrid, cbd
  thcContent: '',
  cbdContent: '',
  manufacturer: '',
});
```

**Table columns:** Name, SKU, Type, Strain, Price, THC%, Status, Actions

### Step 2C.2 — Create Categories First

Before products can be created, you need at least one category. The products page should include a secondary section or modal for managing categories:

```tsx
// Fetch categories on mount
const [categories, setCategories] = useState([]);

useEffect(() => {
  api.get('/products/categories').then(res => setCategories(res.data));
}, []);

// Create category inline
const createCategory = async (name: string) => {
  await api.post('/products/categories', { name });
  const res = await api.get('/products/categories');
  setCategories(res.data);
};
```

### Step 2C.3 — Seed Some Products (SQL)

The database has no products yet. After the page is built, seed some test data:

```bash
docker exec cannasaas-postgres psql -U postgres -d cannasaas -c "
INSERT INTO categories (id, name, slug, dispensary_id, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Flower', 'flower', '30000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 'Edibles', 'edibles', '30000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 'Concentrates', 'concentrates', '30000000-0000-0000-0000-000000000001', NOW(), NOW()),
  (gen_random_uuid(), 'Pre-Rolls', 'pre-rolls', '30000000-0000-0000-0000-000000000001', NOW(), NOW());
"
```

Check the categories table schema first to confirm exact columns:

```bash
docker exec cannasaas-postgres psql -U postgres -d cannasaas -c "\d categories"
```

Then create products through the admin UI or via curl.

---

## Phase 2D — Users Management Page

**Time:** 1.5-2 hours
**API endpoints needed:** Must create a users endpoint (does not exist yet)
**Files to create:** 4 (API) + 1 (Admin)

### Step 2D.1 — Create Users Controller (API)

Currently there is no `/users` endpoint. Create one.

**Create file:** `cannasaas-api/src/users/users.controller.ts`

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Get()
  async findAll() {
    const users = await this.userRepository.find({
      select: [
        'id', 'email', 'firstName', 'lastName', 'role',
        'isActive', 'emailVerified', 'createdAt', 'lastLogin',
      ],
      order: { createdAt: 'DESC' },
    });
    return users;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userRepository.findOne({
      where: { id },
      select: [
        'id', 'email', 'firstName', 'lastName', 'role',
        'isActive', 'emailVerified', 'phone', 'createdAt',
        'lastLogin', 'ageVerified',
      ],
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateData: Partial<User>) {
    // Only allow updating safe fields
    const allowedFields = ['firstName', 'lastName', 'role', 'isActive', 'phone'];
    const safeData: any = {};
    for (const field of allowedFields) {
      if (updateData[field as keyof User] !== undefined) {
        safeData[field] = updateData[field as keyof User];
      }
    }
    await this.userRepository.update(id, safeData);
    return this.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userRepository.softDelete(id);
    return { deleted: true };
  }
}
```

**Create file:** `cannasaas-api/src/users/users.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  exports: [TypeOrmModule],
})
export class UsersModule {}
```

**Modify:** `cannasaas-api/src/app.module.ts`

Add `UsersModule` to imports:

```typescript
import { UsersModule } from './users/users.module';

// In @Module imports array:
UsersModule,
```

**Modify middleware:** The users endpoint needs the tenant middleware. Since it's already set to `forRoutes('*')` with only `tenants/public` excluded, it should work automatically.

### Step 2D.2 — Check for Existing Users Module

Before creating, check if a users module already exists:

```bash
ls -la ~/Documents/Projects/CannaSaas/cannasaas-api/src/users/
cat ~/Documents/Projects/CannaSaas/cannasaas-api/src/users/users.module.ts 2>/dev/null
```

If it exists, you only need to add the controller and ensure the module exports are correct.

### Step 2D.3 — Build UsersPage (Admin)

**File:** `cannasaas-admin/src/pages/UsersPage.tsx`

This page should show:
- Table: Name, Email, Role (color-coded badge), Status, Last Login, Actions
- Role filter dropdown
- "Invite User" button (can be a stub for now)
- Edit role via dropdown in edit mode
- Deactivate/activate toggle

Role badge colors:

```tsx
const roleColors: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-800',
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  manager: 'bg-yellow-100 text-yellow-800',
  budtender: 'bg-green-100 text-green-800',
  driver: 'bg-orange-100 text-orange-800',
  customer: 'bg-gray-100 text-gray-800',
};
```

---

## Phase 2E — Compliance Analytics Page

**Time:** 1-2 hours
**API endpoints already exist:** 4 analytics endpoints
**Files to create:** 1 | Dependencies: `recharts` (for charts)

### Available Compliance Endpoints

```
GET /compliance/logs                    — Audit trail
GET /compliance/purchase-limit          — Current purchase limit info
GET /compliance/analytics/sales         — Sales analytics
GET /compliance/analytics/top-products  — Best sellers
GET /compliance/analytics/revenue       — Revenue data
```

### Step 2E.1 — Install recharts

```bash
cd ~/Documents/Projects/CannaSaas/cannasaas-admin
npm install recharts
```

### Step 2E.2 — Build CompliancePage

**File:** `cannasaas-admin/src/pages/CompliancePage.tsx`

Layout:
1. Top row: 3 stat cards (total sales, purchase limit, compliance status)
2. Middle: Revenue chart (line chart using recharts `LineChart`)
3. Bottom left: Top products table
4. Bottom right: Recent compliance logs

```tsx
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Shield, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

export function CompliancePage() {
  const [sales, setSales] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/compliance/analytics/sales'),
      api.get('/compliance/analytics/top-products'),
      api.get('/compliance/analytics/revenue'),
      api.get('/compliance/logs'),
    ]).then(([salesRes, productsRes, revenueRes, logsRes]) => {
      if (salesRes.status === 'fulfilled') setSales(salesRes.value.data);
      if (productsRes.status === 'fulfilled') setTopProducts(productsRes.value.data || []);
      if (revenueRes.status === 'fulfilled') setRevenue(revenueRes.value.data || []);
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data || []);
      setLoading(false);
    });
  }, []);

  // ... render stat cards, chart, tables
}
```

**Important:** These endpoints may return empty data or errors if no orders/products exist yet. Use `Promise.allSettled` and handle gracefully with "No data yet" placeholders.

### Step 2E.3 — Test the Endpoints First

Before building the full UI, verify what each endpoint returns:

```bash
TOKEN="YOUR_JWT_TOKEN"
TENANT="10000000-0000-0000-0000-000000000001"

curl -s http://localhost:3000/api/v1/compliance/analytics/sales \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

curl -s http://localhost:3000/api/v1/compliance/analytics/top-products \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

curl -s http://localhost:3000/api/v1/compliance/analytics/revenue \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Match your TypeScript interfaces to the actual response shapes.

---

## Phase 2F — Orders Page (Read-Only)

**Time:** 1 hour
**API note:** The OrdersController exists but has no mapped routes in the startup log — meaning it likely has no `@Get()` etc. decorators, or the methods are empty.

### Step 2F.1 — Check the Orders Controller

```bash
cat ~/Documents/Projects/CannaSaas/cannasaas-api/src/orders/orders.controller.ts
```

If it has no route decorators, add basic ones:

```typescript
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
```

Then check if `OrdersService` has `findAll` and `findOne` methods. If not, add them:

```typescript
async findAll() {
  return this.orderRepository.find({
    order: { createdAt: 'DESC' },
    take: 50,
    relations: ['items'],
  });
}

async findOne(id: string) {
  return this.orderRepository.findOne({
    where: { id },
    relations: ['items', 'statusHistory'],
  });
}
```

### Step 2F.2 — Build OrdersPage (Admin)

Since there are no orders in the database yet, this page should gracefully show an empty state. The table columns would be: Order #, Customer, Dispensary, Items, Total, Status, Date.

---

## Phase 2G — Settings Page

**Time:** 30 minutes
**Files to create:** 1 | Modify: 0

### Step 2G.1 — Build SettingsPage

**File:** `cannasaas-admin/src/pages/SettingsPage.tsx`

This page shows the current organization's settings and allows editing. Fetch from `GET /organizations/:id` (where id = user's `organizationId` from AuthContext).

Display:
- Organization name, legal name, contact email, phone
- Plan tier (starter/professional/enterprise)
- License info (number, type)
- Compliance config (max daily purchase grams, age verification required)
- Editable fields with a "Save" button that calls `PUT /organizations/:id`

```tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export function SettingsPage() {
  const { user } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.organizationId) {
      api.get(`/organizations/${user.organizationId}`).then(res => setOrg(res.data));
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/organizations/${user?.organizationId}`, {
        name: org.name,
        legalName: org.legalName,
        contactEmail: org.contactEmail,
        contactPhone: org.contactPhone,
      });
    } finally {
      setSaving(false);
    }
  };

  // ... render form with org fields
}
```

---

## Phase 3 — API Hardening & Cross-Cutting Concerns

These should be done after the CRUD pages work.

### 3A — Tenant Scoping on All Queries

**Problem:** Controllers may return data from ALL tenants, not just the logged-in tenant's organization.

**Solution:** Every service's `find` methods should filter by `organizationId`:

```typescript
// In companies.service.ts, dispensaries.service.ts, etc.
async findAll(organizationId: string) {
  return this.companyRepository.find({
    where: { organizationId },
  });
}
```

Controllers should extract the org ID from the JWT or tenant:

```typescript
@Get()
async findAll(@Req() req: Request) {
  const orgId = req.tenant?.id; // or from JWT payload
  return this.companiesService.findAll(orgId);
}
```

Check each controller/service pair:
- `companies.controller.ts` / `companies.service.ts`
- `dispensaries.controller.ts` / `dispensaries.service.ts`
- `products.controller.ts` / `products.service.ts`
- `orders.controller.ts` / `orders.service.ts`
- `users.controller.ts` (new)

### 3B — Role-Based Route Guards

**Problem:** Any authenticated user can access any endpoint regardless of role.

**Solution:** Create a `RolesGuard`:

**Create file:** `cannasaas-api/src/auth/guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

**Create file:** `cannasaas-api/src/auth/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

**Usage on controllers:**

```typescript
@Post()
@Roles('super_admin', 'owner', 'admin')
async create(@Body() dto: CreateCompanyDto) { ... }

@Delete(':id')
@Roles('super_admin', 'owner')
async remove(@Param('id') id: string) { ... }
```

### 3C — Add JwtAuthGuard to All Protected Controllers

Ensure every controller (except `tenants/public`) has:

```typescript
@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController { ... }
```

Check these files:
- `companies.controller.ts`
- `dispensaries.controller.ts`
- `products.controller.ts`
- `orders.controller.ts`
- `organizations.controller.ts`
- `compliance.controller.ts`

---

## Phase 4 — Storefront (Customer-Facing)

**Time:** 4-6 hours
**Location:** `cannasaas-storefront/` (port 3001)

### 4A — Storefront Architecture

```
┌─────────────────────────────────────┐
│  Header (dispensary name + logo)     │
├─────────────────────────────────────┤
│  Age Verification Gate (first visit) │
├─────────────────────────────────────┤
│  Category Tabs / Filter Bar          │
├─────────────────────────────────────┤
│  Product Grid (cards with images)    │
│    - Name, strain, price, THC%       │
│    - Add to Cart button              │
├─────────────────────────────────────┤
│  Cart Sidebar (slide-in)             │
│    - Line items with quantities      │
│    - Subtotal                        │
│    - Checkout button                 │
├─────────────────────────────────────┤
│  Footer (hours, contact, legal)      │
└─────────────────────────────────────┘
```

### 4B — Storefront Pages to Build

1. **Home / Menu** — Product grid with category filters
2. **Product Detail** — Full product info, reviews, add to cart
3. **Cart** — Cart management, quantity adjustments
4. **Checkout** — Customer info, age verification, order placement
5. **Order Confirmation** — Success page with order number

### 4C — Storefront API Integration

The storefront uses the same API but with a `customer` role JWT. Key endpoints:
- `GET /products` — Browse menu
- `GET /products/:id` — Product detail
- `POST /auth/register` — Customer registration
- `POST /auth/login` — Customer login
- Cart endpoints (may need to be built)
- Order placement (may need to be built)

---

## Implementation Priority Order

| Priority | Task | Time | Impact |
|---|---|---|---|
| 1 | Companies CRUD (Phase 2A) | 1-2 hrs | Validates full CRUD pattern |
| 2 | Dispensaries CRUD (Phase 2B) | 1.5-2 hrs | Core business entity |
| 3 | Users Management (Phase 2D) | 1.5-2 hrs | Staff management |
| 4 | Products CRUD (Phase 2C) | 2-3 hrs | Catalog foundation |
| 5 | Tenant Scoping (Phase 3A) | 1-2 hrs | Security critical |
| 6 | Compliance Analytics (Phase 2E) | 1-2 hrs | Visual payoff |
| 7 | Role Guards (Phase 3B) | 1 hr | Security |
| 8 | Settings Page (Phase 2G) | 30 min | Quick win |
| 9 | Orders Page (Phase 2F) | 1 hr | Depends on order data |
| 10 | Storefront (Phase 4) | 4-6 hrs | Customer-facing |

---

## Pre-Flight Checklist (Before Starting)

Run these to confirm the current state matches what this guide expects:

```bash
# API is running and responding
curl -s http://localhost:3000/api/v1/tenants/public | python3 -m json.tool

# Database has seed data
docker exec cannasaas-postgres psql -U postgres -d cannasaas -c "
  SELECT 'tenants' as tbl, count(*) FROM tenants
  UNION ALL SELECT 'organizations', count(*) FROM organizations
  UNION ALL SELECT 'companies', count(*) FROM companies
  UNION ALL SELECT 'dispensaries', count(*) FROM dispensaries
  UNION ALL SELECT 'users', count(*) FROM users;"

# Admin is accessible
curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/login

# Login works
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 10000000-0000-0000-0000-000000000001" \
  -d '{"email":"sarah.chen@greenvalley.com","password":"admin123"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if 'accessToken' in d else 'FAIL')"
```

Expected output: 4 tenants, 4 orgs, 13 companies, 43 dispensaries, 44 users, HTTP 200, "OK".
