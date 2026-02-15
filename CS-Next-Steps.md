# CannaSaas — Next Steps Implementation Guide

**Three tasks to take the admin dashboard from "coming soon" to functional:**

1. Strip `passwordHash` from the login response (security fix)
2. Add tenant selector to the login form
3. Build out the dashboard UI (stats, charts, nav)

---

## Task 1: Strip passwordHash from Login Response

**Priority:** Critical security fix — do this first.
**Time estimate:** 15 minutes
**Files to modify:** 1

### Problem

The `/api/v1/auth/login` endpoint currently returns the full User entity, including `passwordHash`, `refreshToken`, and other sensitive fields in the JSON response. This is a security vulnerability.

### Step 1.1 — Add `@Exclude()` Decorators to the User Entity

**File:** `cannasaas-api/src/users/entities/user.entity.ts`

Install the required package if not already present:

```bash
cd ~/Documents/Projects/CannaSaas/cannasaas-api
npm list class-transformer || npm install class-transformer
```

Add the `@Exclude()` decorator to sensitive fields in the User entity:

```typescript
import { Exclude } from 'class-transformer';

// Add @Exclude() to these fields:
@Column({ name: 'password_hash' })
@Exclude()
passwordHash!: string;

@Column({ name: 'refresh_token', nullable: true, length: 500 })
@Exclude()
refreshToken!: string | null;

@Column({ name: 'email_verification_token', nullable: true })
@Exclude()
emailVerificationToken!: string | null;

@Column({ name: 'last_login_ip', nullable: true, length: 45 })
@Exclude()
lastLoginIp!: string | null;

@Column({ name: 'failed_login_attempts', default: 0 })
@Exclude()
failedLoginAttempts!: number;

@Column({ name: 'two_factor_enabled', default: false })
@Exclude()
twoFactorEnabled!: boolean;
```

### Step 1.2 — Enable Serialization in the Auth Service

**File:** `cannasaas-api/src/auth/auth.service.ts`

In the `login()` method, use `class-transformer` to strip excluded fields before returning:

```typescript
import { instanceToPlain } from 'class-transformer';

// In the login method, before returning:
return {
  user: instanceToPlain(user),
  accessToken,
  refreshToken,
};
```

**Alternative (simpler) approach** — manually pick fields in the return object if `class-transformer` isn't wired into the app globally:

```typescript
// In the login method, construct a clean user object:
const { passwordHash, refreshToken: rt, emailVerificationToken, lastLoginIp, failedLoginAttempts, ...safeUser } = user as any;

return {
  user: safeUser,
  accessToken,
  refreshToken: newRefreshToken,
};
```

### Step 1.3 — Verify

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 10000000-0000-0000-0000-000000000001" \
  -d '{"email":"sarah.chen@greenvalley.com","password":"admin123"}' | python3 -m json.tool
```

Confirm that `passwordHash`, `refreshToken`, `emailVerificationToken`, `lastLoginIp`, and `failedLoginAttempts` are **not** present in the response.

---

## Task 2: Add Tenant Selector to the Login Form

**Priority:** High — currently hardcoded to Green Valley (tenant `...0001`).
**Time estimate:** 30-45 minutes
**Files to modify:** 3 | Files to create: 1

### Current State

- `cannasaas-admin/src/lib/api.ts` has a hardcoded fallback tenant ID: `10000000-0000-0000-0000-000000000001`
- The login form has no way for users to select their organization/tenant
- The tenant middleware requires `x-tenant-id` header on every request

### Step 2.1 — Create a Public Tenants Endpoint (API)

We need an unauthenticated endpoint that returns available tenants.

**Create file:** `cannasaas-api/src/tenants/tenants.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

@Controller('tenants')
export class TenantsController {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  @Get('public')
  async getPublicTenants() {
    const tenants = await this.tenantRepository.find({
      select: ['id', 'name', 'subdomain'],
    });
    return tenants;
  }
}
```

**Create file (if not exists):** `cannasaas-api/src/tenants/tenants.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantsController } from './tenants.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantsController],
  exports: [TypeOrmModule],
})
export class TenantsModule {}
```

**Modify:** `cannasaas-api/src/app.module.ts`

Add `TenantsModule` to imports:

```typescript
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [
    // ... existing imports
    TenantsModule,
    // ...
  ],
})
```

**Modify:** `cannasaas-api/src/app.module.ts` — Exclude the public tenants route from tenant middleware:

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude('tenants/public')   // <-- Add this exclusion
      .forRoutes('*');             // <-- Apply to all other routes
  }
}
```

> **Note:** Check the current `configure()` method. It may only apply to `'auth'` routes. If so, you may need to expand it to `'*'` and exclude the public endpoint. If the middleware is already applied to all routes, just add the `.exclude()`.

### Step 2.2 — Verify the Public Endpoint

```bash
# This should work WITHOUT x-tenant-id header
curl -s http://localhost:3000/api/v1/tenants/public | python3 -m json.tool
```

Expected response:

```json
[
  { "id": "10000000-0000-0000-0000-000000000001", "name": "Green Valley Cannabis", "subdomain": "greenvalley" },
  { "id": "10000000-0000-0000-0000-000000000002", "name": "Pacific Leaf Holdings", "subdomain": "pacificleaf" },
  { "id": "10000000-0000-0000-0000-000000000003", "name": "Mountain High Group", "subdomain": "mountainhigh" },
  { "id": "10000000-0000-0000-0000-000000000004", "name": "Sunrise Dispensaries", "subdomain": "sunrise" }
]
```

### Step 2.3 — Update the Login Form (Admin Frontend)

**File:** `cannasaas-admin/src/components/auth/LoginForm.tsx`

Add a tenant dropdown above the email field. The form should:

1. Fetch available tenants on mount from `/api/v1/tenants/public` (without the tenant header)
2. Store the selected tenant ID in state
3. On successful login, save `tenantId` to localStorage

```tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Fetch tenants on mount (no auth/tenant header needed)
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    axios.get(`${baseUrl}/tenants/public`)
      .then((res) => {
        setTenants(res.data);
        if (res.data.length > 0) {
          setSelectedTenantId(res.data[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch tenants:', err);
        toast({
          title: 'Error',
          description: 'Could not load organizations',
          variant: 'destructive',
        });
      });
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    if (!selectedTenantId) {
      toast({
        title: 'Error',
        description: 'Please select an organization',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Save tenant ID BEFORE making the API call
      // so the axios interceptor picks it up
      localStorage.setItem('tenantId', selectedTenantId);

      const response = await api.post('/auth/login', data);

      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Select your organization and enter your credentials</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tenant Selector */}
          <div className="space-y-2">
            <Label htmlFor="tenant">Organization</Label>
            <select
              id="tenant"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              disabled={isLoading || tenants.length === 0}
            >
              {tenants.length === 0 && <option value="">Loading...</option>}
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !selectedTenantId}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Step 2.4 — Update api.ts to Read from localStorage Dynamically

**File:** `cannasaas-admin/src/lib/api.ts`

This should already be in place from our earlier fix, but verify it reads `tenantId` from localStorage on each request:

```typescript
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Dynamic tenant ID — set by login form, falls back to first tenant
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
```

> **Important:** Remove the hardcoded fallback `|| '10000000-...'` from the interceptor. If no `tenantId` is in localStorage, the request should fail so the user is redirected to login.

### Step 2.5 — Verify

1. Clear localStorage in browser console: `localStorage.clear()`
2. Refresh the login page
3. You should see a dropdown with all 4 organizations
4. Select "Pacific Leaf Holdings"
5. Login with `jessica.park@pacificleaf.com` / `admin123`
6. Check that the tenant middleware logs show `x-tenant-id: 10000000-0000-0000-0000-000000000002`

---

## Task 3: Build Out the Dashboard UI

**Priority:** High — the core admin experience.
**Time estimate:** 2-4 hours
**Files to modify:** 3 | Files to create:** ~10

### Architecture Overview

The dashboard will have:

```
┌─────────────────────────────────────────────────────┐
│  Top Navbar (logo, org name, user menu, logout)     │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│  Sidebar │   Main Content Area                      │
│          │                                          │
│  - Dashboard   ← Stats + Charts                    │
│  - Companies                                        │
│  - Dispensaries                                     │
│  - Products                                         │
│  - Orders                                           │
│  - Compliance                                       │
│  - Users                                            │
│  - Settings                                         │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### Step 3.1 — Create the Auth Context

This stores the logged-in user and tenant info, and provides a `logout()` function.

**Create file:** `cannasaas-admin/src/contexts/AuthContext.tsx`

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Validate token by fetching profile
      api.get('/auth/profile')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.clear();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenantId');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Step 3.2 — Create the Admin Layout (Sidebar + Navbar)

**Create file:** `cannasaas-admin/src/components/layout/AdminLayout.tsx`

```tsx
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Building2, Store, Package,
  ShoppingCart, Shield, Users, Settings, LogOut, Cannabis,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/dispensaries', label: 'Dispensaries', icon: Store },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/compliance', label: 'Compliance', icon: Shield },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CS</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">CannaSaas</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.firstName} {user?.lastName}
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
              {user?.role}
            </span>
          </span>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16 p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### Step 3.3 — Create the Dashboard Page with Stats + Charts

**Create file:** `cannasaas-admin/src/pages/DashboardPage.tsx` (replace existing stub)

```tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
  Building2, Store, Package, ShoppingCart,
  Users, DollarSign, TrendingUp, AlertTriangle,
} from 'lucide-react';

interface DashboardStats {
  companies: number;
  dispensaries: number;
  products: number;
  users: number;
}

function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: number | string; icon: any; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    companies: 0, dispensaries: 0, products: 0, users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stats from API endpoints
    // For now, fetch counts from each entity
    Promise.allSettled([
      api.get('/companies').then((r) => r.data),
      api.get('/dispensaries').then((r) => r.data),
      api.get('/products').then((r) => r.data),
    ])
      .then(([companies, dispensaries, products]) => {
        setStats({
          companies: companies.status === 'fulfilled' ? (Array.isArray(companies.value) ? companies.value.length : 0) : 0,
          dispensaries: dispensaries.status === 'fulfilled' ? (Array.isArray(dispensaries.value) ? dispensaries.value.length : 0) : 0,
          products: products.status === 'fulfilled' ? (Array.isArray(products.value) ? products.value.length : 0) : 0,
          users: 0, // No public user count endpoint yet
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'Admin'}
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what's happening across your organization today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Companies"
          value={loading ? '...' : stats.companies}
          icon={Building2}
          color="bg-blue-500"
        />
        <StatCard
          label="Dispensaries"
          value={loading ? '...' : stats.dispensaries}
          icon={Store}
          color="bg-green-500"
        />
        <StatCard
          label="Products"
          value={loading ? '...' : stats.products}
          icon={Package}
          color="bg-purple-500"
        />
        <StatCard
          label="Users"
          value={loading ? '...' : stats.users}
          icon={Users}
          color="bg-orange-500"
        />
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <QuickAction
              label="Add New Product"
              description="Create a new product listing"
              href="/products"
              icon={Package}
            />
            <QuickAction
              label="View Orders"
              description="Check recent order activity"
              href="/orders"
              icon={ShoppingCart}
            />
            <QuickAction
              label="Compliance Check"
              description="Review compliance status"
              href="/compliance"
              icon={AlertTriangle}
            />
            <QuickAction
              label="Manage Dispensaries"
              description="Edit dispensary details and hours"
              href="/dispensaries"
              icon={Store}
            />
          </div>
        </div>

        {/* Recent Activity (placeholder) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <ActivityItem
              message="System initialized with seed data"
              time="Just now"
              type="info"
            />
            <ActivityItem
              message="4 organizations configured"
              time="Just now"
              type="success"
            />
            <ActivityItem
              message="43 dispensaries ready to operate"
              time="Just now"
              type="success"
            />
            <ActivityItem
              message="AWS file uploads disabled (no credentials)"
              time="Startup"
              type="warning"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  label, description, href, icon: Icon,
}: {
  label: string; description: string; href: string; icon: any;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-green-50">
        <Icon className="w-5 h-5 text-gray-500 group-hover:text-green-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </a>
  );
}

function ActivityItem({
  message, time, type,
}: {
  message: string; time: string; type: 'info' | 'success' | 'warning';
}) {
  const colors = {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
      <div className="flex-1">
        <p className="text-sm text-gray-700">{message}</p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  );
}
```

### Step 3.4 — Create Placeholder Pages for Each Nav Item

Create stub pages so routing doesn't break. Each follows the same pattern:

**Create file:** `cannasaas-admin/src/pages/CompaniesPage.tsx`

```tsx
export function CompaniesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Companies</h1>
      <p className="text-gray-500">Company management — coming soon.</p>
    </div>
  );
}
```

Repeat this pattern for each of these files:

| File | Title |
|---|---|
| `src/pages/CompaniesPage.tsx` | Companies |
| `src/pages/DispensariesPage.tsx` | Dispensaries |
| `src/pages/ProductsPage.tsx` | Products |
| `src/pages/OrdersPage.tsx` | Orders |
| `src/pages/CompliancePage.tsx` | Compliance |
| `src/pages/UsersPage.tsx` | Users |
| `src/pages/SettingsPage.tsx` | Settings |

### Step 3.5 — Update App.tsx with Routing

**Replace:** `cannasaas-admin/src/App.tsx`

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { DispensariesPage } from './pages/DispensariesPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { CompliancePage } from './pages/CompliancePage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes with layout */}
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/dispensaries" element={<DispensariesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### Step 3.6 — Install lucide-react (Icons)

```bash
cd ~/Documents/Projects/CannaSaas/cannasaas-admin
npm list lucide-react || npm install lucide-react
```

### Step 3.7 — Update LoginForm to Store User + Redirect

In the LoginForm's `onSubmit` success handler, also store the user data:

```typescript
// After storing tokens:
localStorage.setItem('accessToken', response.data.accessToken);
localStorage.setItem('refreshToken', response.data.refreshToken);
localStorage.setItem('user', JSON.stringify(response.data.user));
```

### Step 3.8 — Verify the Full Flow

1. Clear localStorage: `localStorage.clear()` in browser console
2. Navigate to `http://localhost:5173/login`
3. Select an organization from the dropdown
4. Login with valid credentials
5. Should redirect to `/dashboard` with:
   - Top navbar showing user name and role
   - Sidebar with navigation links
   - Stats cards (companies, dispensaries, products)
   - Quick actions panel
   - Recent activity panel
6. Click sidebar links — each should show the stub page
7. Click Logout — should return to login page

---

## File Change Summary

### API (cannasaas-api)

| Action | File | Purpose |
|---|---|---|
| Modify | `src/users/entities/user.entity.ts` | Add `@Exclude()` to sensitive fields |
| Modify | `src/auth/auth.service.ts` | Strip passwordHash from response |
| Create | `src/tenants/tenants.controller.ts` | Public tenants endpoint |
| Create | `src/tenants/tenants.module.ts` | Tenants module |
| Modify | `src/app.module.ts` | Import TenantsModule, exclude from middleware |

### Admin (cannasaas-admin)

| Action | File | Purpose |
|---|---|---|
| Create | `src/contexts/AuthContext.tsx` | Auth state management |
| Create | `src/components/layout/AdminLayout.tsx` | Sidebar + navbar layout |
| Replace | `src/pages/DashboardPage.tsx` | Full dashboard with stats |
| Replace | `src/components/auth/LoginForm.tsx` | Add tenant selector |
| Modify | `src/lib/api.ts` | Remove hardcoded tenant fallback |
| Replace | `src/App.tsx` | Full routing setup |
| Create | `src/pages/CompaniesPage.tsx` | Stub page |
| Create | `src/pages/DispensariesPage.tsx` | Stub page |
| Create | `src/pages/ProductsPage.tsx` | Stub page |
| Create | `src/pages/OrdersPage.tsx` | Stub page |
| Create | `src/pages/CompliancePage.tsx` | Stub page |
| Create | `src/pages/UsersPage.tsx` | Stub page |
| Create | `src/pages/SettingsPage.tsx` | Stub page |

### Dependencies to Install

```bash
# API
cd cannasaas-api
npm install class-transformer

# Admin
cd cannasaas-admin
npm install lucide-react  # if not already installed
```

---

## Recommended Implementation Order

1. **Task 1 (Security)** — Strip passwordHash (15 min)
2. **Task 2 (Tenant Selector)** — Public endpoint + login dropdown (30-45 min)
3. **Task 3 (Dashboard UI)** — Layout, routing, stats (2-4 hours)

Each task is independently deployable. Task 1 should be done immediately as it's a security issue. Task 2 makes multi-tenant testing possible. Task 3 is the visual payoff.
