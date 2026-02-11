Complete Multi-Tenant Cannabis E-Commerce Platform

Tuesday, January 20, 2026
12:46 PM

            i) [Executive Summary](#executive-summary)

1. [System Architecture](#system-architecture)
2. [Complete Database Schemas](#complete-database-schemas)
3. [Complete API Specifications](#complete-api-specifications)
4. [AI Integration & Prompt Templates](#ai-integration--prompt-templates)
5. [Build Plan: Prototype → MVP → Feature Releases](#build-plan-prototype--mvp--feature-releases)
6. [Implementation Examples](#implementation-examples)
7. [Launch Strategy](#launch-strategy)
   [Appendices](#appendices)

Multi-Tenant Cannabis E-Commerce Platform
Document Version: 1.0
Date: January 20, 2026
Focus: Frontend Architecture with React

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [State Management Strategy](#state-management-strategy)
5. [Routing & Navigation](#routing--navigation)
6. [Component Architecture](#component-architecture)
7. [API Integration Layer](#api-integration-layer)
8. [Authentication & Authorization](#authentication--authorization)
9. [Theming & Branding System](#theming--branding-system)
10. [Performance Optimization](#performance-optimization)
11. [Testing Strategy](#testing-strategy)
12. [Build & Deployment](#build--deployment)
13. [Code Examples](#code-examples)

---

Architecture Overview

High-Level React Architecture

┌─────────────────────────────────────────────────────────────────┐
│ React Application │
└─────────────────────────────────────────────────────────────────┘
│
┌─────────────────────┼─────────────────────┐
│ │ │
▼ ▼ ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Customer │ │ Admin │ │ Staff │
│ Storefront │ │ Portal │ │ Portal │
│ │ │ │ │ │
│ - Browse │ │ - Dashboard │ │ - Orders │
│ - Cart │ │ - Products │ │ - Customers │
│ - Checkout │ │ - Orders │ │ - Inventory │
│ - Account │ │ - Analytics │ │ - Delivery │
└──────────────┘ └──────────────┘ └──────────────┘
│ │ │
└─────────────────────┼─────────────────────┘
│
▼
┌─────────────────────────────────────────┐
│ Shared Core Infrastructure │
│ │
│ ┌────────────┐ ┌────────────┐ │
│ │ State │ │ Router │ │
│ │ Management │ │ │ │
│ │ (Zustand) │ │ React │ │
│ └────────────┘ │ Router v6 │ │
│ └────────────┘ │
│ │
│ ┌────────────┐ ┌────────────┐ │
│ │ API │ │ Theme │ │
│ │ Client │ │ System │ │
│ │ (TanStack │ │ │ │
│ │ Query) │ │ Tailwind + │ │
│ └────────────┘ │ shadcn/ui │ │
│ └────────────┘ │
└─────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────┐
│ UI Component Library │
│ │
│ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│ │ Design │ │ shadcn/ │ │ Custom │ │
│ │ System │ │ ui │ │ Comps │ │
│ └──────────┘ └──────────┘ └─────────┘ │
└─────────────────────────────────────────┘

Application Types

We'll build three separate React applications that share common code:

1. Customer Storefront (`apps/storefront`)
   · Public-facing e-commerce site
   · Product browsing and search
   · Shopping cart and checkout
   · User accounts and order history
   · Responsive, mobile-first design

2. Admin Portal (`apps/admin`)
   · Store management dashboard
   · Product and inventory management
   · Order processing
   · Analytics and reporting
   · Staff management

3. Staff Portal (`apps/staff`)
   · Simplified interface for staff/budtenders
   · Order fulfillment
   · Customer service
   · Inventory lookup
   · Quick actions

---

Project Structure

Monorepo Structure (Recommended)

cannabis-platform/
├── apps/
│ ├── storefront/ # Customer-facing app
│ │ ├── public/
│ │ ├── src/
│ │ │ ├── assets/
│ │ │ ├── components/ # App-specific components
│ │ │ ├── pages/
│ │ │ ├── layouts/
│ │ │ ├── hooks/ # Custom hooks
│ │ │ ├── utils/
│ │ │ ├── App.tsx
│ │ │ ├── main.tsx
│ │ │ └── routes.tsx
│ │ ├── index.html
│ │ ├── vite.config.ts
│ │ └── package.json
│ │
│ ├── admin/ # Admin portal
│ │ ├── public/
│ │ ├── src/
│ │ │ ├── components/
│ │ │ ├── pages/
│ │ │ │ ├── Dashboard/
│ │ │ │ ├── Products/
│ │ │ │ ├── Orders/
│ │ │ │ ├── Customers/
│ │ │ │ ├── Analytics/
│ │ │ │ └── Settings/
│ │ │ ├── layouts/
│ │ │ ├── App.tsx
│ │ │ └── main.tsx
│ │ └── vite.config.ts
│ │
│ └── staff/ # Staff portal
│ └── src/
│ └── ...
│
├── packages/
│ ├── ui/ # Shared UI components
│ │ ├── src/
│ │ │ ├── components/
│ │ │ │ ├── Button/
│ │ │ │ │ ├── Button.tsx
│ │ │ │ │ ├── Button.test.tsx
│ │ │ │ │ └── index.ts
│ │ │ │ ├── Input/
│ │ │ │ ├── Card/
│ │ │ │ ├── Modal/
│ │ │ │ ├── Table/
│ │ │ │ └── ...
│ │ │ ├── layouts/
│ │ │ ├── index.ts
│ │ │ └── styles/
│ │ └── package.json
│ │
│ ├── api-client/ # API client library
│ │ ├── src/
│ │ │ ├── client.ts
│ │ │ ├── hooks/
│ │ │ │ ├── useProducts.ts
│ │ │ │ ├── useOrders.ts
│ │ │ │ ├── useAuth.ts
│ │ │ │ └── ...
│ │ │ ├── services/
│ │ │ │ ├── products.ts
│ │ │ │ ├── orders.ts
│ │ │ │ ├── users.ts
│ │ │ │ └── ...
│ │ │ ├── types/
│ │ │ │ ├── product.ts
│ │ │ │ ├── order.ts
│ │ │ │ ├── user.ts
│ │ │ │ └── ...
│ │ │ └── index.ts
│ │ └── package.json
│ │
│ ├── stores/ # Shared state stores
│ │ ├── src/
│ │ │ ├── authStore.ts
│ │ │ ├── cartStore.ts
│ │ │ ├── organizationStore.ts
│ │ │ ├── themeStore.ts
│ │ │ └── index.ts
│ │ └── package.json
│ │
│ ├── utils/ # Shared utilities
│ │ ├── src/
│ │ │ ├── formatting.ts
│ │ │ ├── validation.ts
│ │ │ ├── date.ts
│ │ │ ├── currency.ts
│ │ │ └── ...
│ │ └── package.json
│ │
│ └── types/ # Shared TypeScript types
│ ├── src/
│ │ ├── api.ts
│ │ ├── models/
│ │ │ ├── Product.ts
│ │ │ ├── Order.ts
│ │ │ ├── User.ts
│ │ │ └── ...
│ │ └── index.ts
│ └── package.json
│
├── package.json # Root package.json
├── pnpm-workspace.yaml # PNPM workspace config
├── turbo.json # Turborepo config
├── tsconfig.json # Base TypeScript config
└── .eslintrc.js # ESLint config

Single App Structure (Alternative)

src/
├── apps/
│ ├── storefront/
│ ├── admin/
│ └── staff/
├── components/
│ ├── ui/ # shadcn/ui components
│ │ ├── button.tsx
│ │ ├── input.tsx
│ │ ├── card.tsx
│ │ └── ...
│ ├── common/ # Shared components
│ │ ├── Header/
│ │ ├── Footer/
│ │ ├── ProductCard/
│ │ ├── SearchBar/
│ │ └── ...
│ ├── storefront/ # Storefront-specific
│ ├── admin/ # Admin-specific
│ └── staff/ # Staff-specific
├── lib/
│ ├── api/ # API client
│ ├── hooks/ # Custom hooks
│ ├── utils/ # Utility functions
│ └── constants/ # Constants
├── stores/ # Zustand stores
├── types/ # TypeScript types
├── styles/ # Global styles
├── App.tsx
└── main.tsx

---

Technology Stack

Core Dependencies

{
"dependencies": {
"react": "^18.2.0",
"react-dom": "^18.2.0",

    // Routing
    "react-router-dom": "^6.20.0",

    // State Management
    "zustand": "^4.4.7",

    // Data Fetching
    "@tanstack/react-query": "^5.14.2",
    "axios": "^1.6.2",

    // Forms
    "react-hook-form": "^7.49.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.3",

    // UI Components
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",

    // Styling
    "tailwindcss": "^3.3.6",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",

    // Icons
    "lucide-react": "^0.294.0",

    // Dates
    "date-fns": "^3.0.0",

    // Charts
    "recharts": "^2.10.3",

    // Image handling
    "react-image-crop": "^11.0.4",

    // Rich text
    "@tiptap/react": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13",

    // Utilities
    "react-hot-toast": "^2.4.1",
    "nanoid": "^5.0.4",
    "immer": "^10.0.3"

},
"devDependencies": {
"@types/react": "^18.2.43",
"@types/react-dom": "^18.2.17",
"@typescript-eslint/eslint-plugin": "^6.14.0",
"@typescript-eslint/parser": "^6.14.0",
"@vitejs/plugin-react": "^4.2.1",

    // Testing
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",

    // Linting & Formatting
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "prettier": "^3.1.1",
    "prettier-plugin-tailwindcss": "^0.5.9",

    "typescript": "^5.3.3",
    "vite": "^5.0.8"

}
}

Justification for Choices

Zustand over Redux
· **Simpler API**: Less boilerplate
· **Better TypeScript support**: Type inference works naturally
· **Smaller bundle size**: ~1KB vs ~10KB
· **Easier testing**: No need for complex setup
· **Perfect for our use case**: We don't need Redux's advanced features

TanStack Query over SWR/Redux Toolkit Query
· **Powerful caching**: Automatic background refetching
· **Optimistic updates**: Better UX for mutations
· **Devtools**: Excellent debugging experience
· **Infinite queries**: Perfect for pagination
· **Offline support**: Built-in

React Hook Form over Formik
· **Performance**: Uncontrolled components = less re-renders
· **Bundle size**: Smaller footprint
· **Integration**: Works seamlessly with Zod
· **TypeScript**: Better type inference

Tailwind CSS over CSS-in-JS
· **Performance**: No runtime overhead
· **Developer experience**: Rapid prototyping
· **Consistency**: Design system constraints
· **Production ready**: Proven at scale
· **shadcn/ui**: Perfect component library using Tailwind

---

State Management Strategy

Zustand Store Architecture

Auth Store

// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
user: User | null;
accessToken: string | null;
refreshToken: string | null;
isAuthenticated: boolean;

// Actions
login: (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
logout: () => void;
updateUser: (user: Partial<User>) => void;
setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
}

export const useAuthStore = create<AuthState>()(
persist(
(set) => ({
user: null,
accessToken: null,
refreshToken: null,
isAuthenticated: false,

      login: (user, tokens) => set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true,
      }),

      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      }),

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

      setTokens: (tokens) => set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        // Don't persist accessToken (it expires quickly)
      }),
    }

)
);

Cart Store

// stores/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CartItem, Product, Variant } from '@/types';

interface CartState {
items: CartItem[];

// Computed values
itemCount: number;
subtotal: number;

// Actions
addItem: (product: Product, variant: Variant, quantity: number) => void;
removeItem: (itemId: string) => void;
updateQuantit y: (itemId: string, quantity: number) => void;
clearCart: () => void;

// Helpers
getItem: (productId: string, variantId: string) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
persist(
immer((set, get) => ({
items: [],

      get itemCount() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      get subtotal() {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      addItem: (product, variant, quantity) => set((state) => {
        const existingItem = state.items.find(
          (item) => item.productId === product._id && item.variantId === variant._id
        );

        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          state.items.push({
            id: `${product._id}-${variant._id}`,
            productId: product._id,
            variantId: variant._id,
            product: {
              name: product.name,
              slug: product.slug,
              image: product.media.images[0]?.url,
            },
            variant: {
              name: variant.name,
              sku: variant.sku,
            },
            quantity,
            price: variant.pricing.salePrice || variant.pricing.basePrice,
          });
        }
      }),

      removeItem: (itemId) => set((state) => {
        state.items = state.items.filter((item) => item.id !== itemId);
      }),

      updateQuantity: (itemId, quantity) => set((state) => {
        const item = state.items.find((item) => item.id === itemId);
        if (item) {
          if (quantity <= 0) {
            state.items = state.items.filter((item) => item.id !== itemId);
          } else {
            item.quantity = quantity;
          }
        }
      }),

      clearCart: () => set({ items: [] }),

      getItem: (productId, variantId) => {
        return get().items.find(
          (item) => item.productId === productId && item.variantId === variantId
        );
      },
    })),
    {
      name: 'cart-storage',
    }

)
);

Organization Store (Multi-Tenancy)

// stores/organizationStore.ts
import { create } from 'zustand';
import type { Organization } from '@/types';

interface OrganizationState {
organization: Organization | null;
loading: boolean;
error: string | null;

setOrganization: (org: Organization) => void;
setLoading: (loading: boolean) => void;
setError: (error: string | null) => void;
clearOrganization: () => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
organization: null,
loading: true,
error: null,

setOrganization: (org) => set({ organization: org, loading: false, error: null }),
setLoading: (loading) => set({ loading }),
setError: (error) => set({ error, loading: false }),
clearOrganization: () => set({ organization: null, loading: false, error: null }),
}));

Theme Store

// stores/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
mode: 'light' | 'dark';
customColors: {
primary?: string;
secondary?: string;
accent?: string;
};

setMode: (mode: 'light' | 'dark') => void;
toggleMode: () => void;
setCustomColors: (colors: ThemeState['customColors']) => void;
}

export const useThemeStore = create<ThemeState>()(
persist(
(set) => ({
mode: 'light',
customColors: {},

      setMode: (mode) => set({ mode }),

      toggleMode: () => set((state) => ({
        mode: state.mode === 'light' ? 'dark' : 'light',
      })),

      setCustomColors: (colors) => set({ customColors: colors }),
    }),
    {
      name: 'theme-storage',
    }

)
);

When to Use State vs. Server Cache

Use Zustand for:
· **UI State**: Modals, sidebars, filters
· **User Session**: Auth tokens, user data
· **Client-Side Only**: Cart, theme preferences
· **Cross-Component**: Data needed by multiple unrelated components

Use TanStack Query for:
· **Server Data**: Products, orders, users
· **Real-Time Updates**: Order status, inventory
· **Cached Data**: Frequently accessed API data
· **Background Syncing**: Automatic refetching

---

Routing & Navigation

React Router v6 Setup

Router Configuration

// routes.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Layouts
import RootLayout from '@/layouts/RootLayout';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import AdminLayout from '@/layouts/AdminLayout';

// Auth guard
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy load pages
const HomePage = lazy(() => import('@/pages/storefront/Home'));
const ProductsPage = lazy(() => import('@/pages/storefront/Products'));
const ProductDetailPage = lazy(() => import('@/pages/storefront/ProductDetail'));
const CartPage = lazy(() => import('@/pages/storefront/Cart'));
const CheckoutPage = lazy(() => import('@/pages/storefront/Checkout'));
const AccountPage = lazy(() => import('@/pages/storefront/Account'));

const LoginPage = lazy(() => import('@/pages/auth/Login'));
const RegisterPage = lazy(() => import('@/pages/auth/Register'));

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('@/pages/admin/Products'));
const AdminOrders = lazy(() => import('@/pages/admin/Orders'));

export const router = createBrowserRouter([
{
path: '/',
element: <RootLayout />,
errorElement: <ErrorPage />,
children: [
// Storefront routes
{
element: <StorefrontLayout />,
children: [
{ index: true, element: <Suspense fallback={<LoadingSpinner />}><HomePage /></Suspense> },
{ path: 'products', element: <Suspense fallback={<LoadingSpinner />}><ProductsPage /></Suspense> },
{ path: 'products/:slug', element: <Suspense fallback={<LoadingSpinner />}><ProductDetailPage /></Suspense> },
{ path: 'cart', element: <Suspense fallback={<LoadingSpinner />}><CartPage /></Suspense> },
{
path: 'checkout',
element: (
<ProtectedRoute>
<Suspense fallback={<LoadingSpinner />}><CheckoutPage /></Suspense>
</ProtectedRoute>
)
},
{
path: 'account/*',
element: (
<ProtectedRoute>
<Suspense fallback={<LoadingSpinner />}><AccountPage /></Suspense>
</ProtectedRoute>
)
},
],
},

      // Auth routes
      { path: 'login', element: <Suspense fallback={<LoadingSpinner />}><LoginPage /></Suspense> },
      { path: 'register', element: <Suspense fallback={<LoadingSpinner />}><RegisterPage /></Suspense> },

      // Admin routes
      {
        path: 'admin',
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Suspense fallback={<LoadingSpinner />}><AdminDashboard /></Suspense> },
          { path: 'products', element: <Suspense fallback={<LoadingSpinner />}><AdminProducts /></Suspense> },
          { path: 'products/new', element: <Suspense fallback={<LoadingSpinner />}><AdminProductForm /></Suspense> },
          { path: 'products/:id/edit', element: <Suspense fallback={<LoadingSpinner />}><AdminProductForm /></Suspense> },
          { path: 'orders', element: <Suspense fallback={<LoadingSpinner />}><AdminOrders /></Suspense> },
          { path: 'orders/:id', element: <Suspense fallback={<LoadingSpinner />}><AdminOrderDetail /></Suspense> },
          { path: 'customers', element: <Suspense fallback={<LoadingSpinner />}><AdminCustomers /></Suspense> },
          { path: 'analytics', element: <Suspense fallback={<LoadingSpinner />}><AdminAnalytics /></Suspense> },
          { path: 'settings', element: <Suspense fallback={<LoadingSpinner />}><AdminSettings /></Suspense> },
        ],
      },
    ],

},
]);

// App.tsx
function App() {
return <RouterProvider router={router} />;
}

export default App;

Protected Route Component

// components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
children: React.ReactNode;
requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
const { isAuthenticated, user } = useAuthStore();
const location = useLocation();

if (!isAuthenticated) {
return <Navigate to="/login" state={{ from: location }} replace />;
}

if (requiredRole && user?.role !== requiredRole) {
return <Navigate to="/" replace />;
}

return <>{children}</>;
}

---

Component Architecture

Component Hierarchy

App
├── RootLayout
│ ├── OrganizationProvider (loads org data)
│ ├── ThemeProvider (applies branding)
│ └── Outlet (renders child routes)
│
├── StorefrontLayout
│ ├── Header
│ │ ├── Logo
│ │ ├── SearchBar
│ │ ├── Navigation
│ │ ├── CartButton
│ │ └── UserMenu
│ ├── main
│ │ └── Outlet
│ └── Footer
│
├── AdminLayout
│ ├── AdminHeader
│ ├── Sidebar
│ │ └── Navigation
│ ├── main
│ │ └── Outlet
│ └── AdminFooter
│
└── Pages
├── Home
├── Products
├── ProductDetail
├── Cart
├── Checkout
└── ...

Component Patterns

1. Presentational Components (Pure UI)

// components/ui/button.tsx
import \* as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
{
variants: {
variant: {
default: 'bg-primary text-primary-foreground hover:bg-primary/90',
destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
ghost: 'hover:bg-accent hover:text-accent-foreground',
link: 'text-primary underline-offset-4 hover:underline',
},
size: {
default: 'h-10 px-4 py-2',
sm: 'h-9 rounded-md px-3',
lg: 'h-11 rounded-md px-8',
icon: 'h-10 w-10',
},
},
defaultVariants: {
variant: 'default',
size: 'default',
},
}
);

export interface ButtonProps
extends React.ButtonHTMLAttributes<HTMLButtonElement>,
VariantProps<typeof buttonVariants> {
asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
({ className, variant, size, asChild = false, ...props }, ref) => {
const Comp = asChild ? Slot : 'button';
return (
<Comp
className={cn(buttonVariants({ variant, size, className }))}
ref={ref}
{...props}
/>
);
}
);

Button.displayName = 'Button';

export { Button, buttonVariants };

2. Container Components (Business Logic)

// components/storefront/ProductCard.tsx
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardProps {
product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
const addItem = useCartStore((state) => state.addItem);
const variant = product.variants[0]; // Default variant

const handleAddToCart = (e: React.MouseEvent) => {
e.preventDefault(); // Don't navigate to product page
addItem(product, variant, 1);
toast.success(`${product.name} added to cart`);
};

const isOnSale = variant.pricing.onSale;
const price = variant.pricing.salePrice || variant.pricing.basePrice;

return (
<Card className="group relative overflow-hidden">

<Link to={`/products/${product.slug}`}>
{/_ Image _/}
<div className="aspect-square overflow-hidden bg-gray-100">
<img
            src={product.media.images[0]?.url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
</div>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-2">
          {isOnSale && <Badge variant="destructive">Sale</Badge>}
          {product.featured && <Badge>Featured</Badge>}
          {product.badges?.includes('new_arrival') && <Badge variant="secondary">New</Badge>}
        </div>

        {/* Content */}
        <CardContent className="p-4">
          {/* Category */}
          <p className="text-xs text-muted-foreground uppercase">
            {product.category}
          </p>

          {/* Name */}
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary">
            {product.name}
          </h3>

          {/* Cannabis Info */}
          <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
            <span>THC: {product.cannabisInfo.cannabinoids.thc.percentage}%</span>
            <span>•</span>
            <span>{product.cannabisInfo.strain.type}</span>
          </div>

          {/* Price */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold">
              {formatCurrency(price)}
            </span>
            {isOnSale && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(variant.pricing.basePrice)}
              </span>
            )}
          </div>
        </CardContent>

        {/* Actions */}
        <CardFooter className="p-4 pt-0">
          <div className="flex w-full gap-2">
            <Button
              className="flex-1"
              onClick={handleAddToCart}
              disabled={variant.inventory.available === 0}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {variant.inventory.available === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>

            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Link>
    </Card>

);
}

3. Compound Components

// components/common/ProductFilters.tsx
import { useState } from 'react';
import {
Accordion,
AccordionContent,
AccordionItem,
AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface ProductFiltersProps {
filters: {
categories: string[];
priceRange: [number, number];
thcRange: [number, number];
strainTypes: string[];
};
onChange: (filters: any) => void;
}

export default function ProductFilters({ filters, onChange }: ProductFiltersProps) {
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
const [thcRange, setThcRange] = useState<[number, number]>([0, 35]);
const [selectedStrainTypes, setSelectedStrainTypes] = useState<string[]>([]);

const handleApply = () => {
onChange({
categories: selectedCategories,
priceRange,
thcRange,
strainTypes: selectedStrainTypes,
});
};

const handleReset = () => {
setSelectedCategories([]);
setPriceRange([0, 200]);
setThcRange([0, 35]);
setSelectedStrainTypes([]);
onChange({});
};

return (

<div className="space-y-4">
<div className="flex items-center justify-between">
<h3 className="font-semibold">Filters</h3>
<Button variant="ghost" size="sm" onClick={handleReset}>
Reset
</Button>
</div>

      <Accordion type="multiple" defaultValue={['category', 'price', 'thc']}>
        {/* Category Filter */}
        <AccordionItem value="category">
          <AccordionTrigger>Category</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {filters.categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked) => {
                      setSelectedCategories(
                        checked
                          ? [...selectedCategories, category]
                          : selectedCategories.filter((c) => c !== category)
                      );
                    }}
                  />
                  <Label htmlFor={category} className="cursor-pointer capitalize">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range Filter */}
        <AccordionItem value="price">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider
                min={0}
                max={200}
                step={5}
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* THC Range Filter */}
        <AccordionItem value="thc">
          <AccordionTrigger>THC %</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider
                min={0}
                max={35}
                step={1}
                value={thcRange}
                onValueChange={(value) => setThcRange(value as [number, number])}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{thcRange[0]}%</span>
                <span>{thcRange[1]}%</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Strain Type Filter */}
        <AccordionItem value="strain">
          <AccordionTrigger>Strain Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {filters.strainTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={selectedStrainTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      setSelectedStrainTypes(
                        checked
                          ? [...selectedStrainTypes, type]
                          : selectedStrainTypes.filter((t) => t !== type)
                      );
                    }}
                  />
                  <Label htmlFor={type} className="cursor-pointer capitalize">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button className="w-full" onClick={handleApply}>
        Apply Filters
      </Button>
    </div>

);
}

4. Custom Hooks

// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
const [debouncedValue, setDebouncedValue] = useState<T>(value);

useEffect(() => {
const handler = setTimeout(() => {
setDebouncedValue(value);
}, delay);

    return () => {
      clearTimeout(handler);
    };

}, [value, delay]);

return debouncedValue;
}

// hooks/useMediaQuery.ts
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
const [matches, setMatches] = useState(false);

useEffect(() => {
const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);

}, [matches, query]);

return matches;
}

// Usage
const isMobile = useMediaQuery('(max-width: 768px)');

// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
key: string,
initialValue: T
): [T, (value: T) => void] {
const [storedValue, setStoredValue] = useState<T>(() => {
try {
const item = window.localStorage.getItem(key);
return item ? JSON.parse(item) : initialValue;
} catch (error) {
console.error(error);
return initialValue;
}
});

const setValue = (value: T) => {
try {
setStoredValue(value);
window.localStorage.setItem(key, JSON.stringify(value));
} catch (error) {
console.error(error);
}
};

return [storedValue, setValue];
}

// hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver(
options: IntersectionObserverInit = {}
) {
const [isIntersecting, setIsIntersecting] = useState(false);
const ref = useRef<HTMLDivElement>(null);

useEffect(() => {
if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };

}, [options]);

return { ref, isIntersecting };
}

// Usage: Infinite scroll
function ProductList() {
const { ref, isIntersecting } = useIntersectionObserver({
threshold: 0.5,
});

const { data, fetchNextPage, hasNextPage } = useInfiniteProducts();

useEffect(() => {
if (isIntersecting && hasNextPage) {
fetchNextPage();
}
}, [isIntersecting, hasNextPage, fetchNextPage]);

return (

<div>
{/_ Product list _/}
<div ref={ref} />
</div>
);
}

---

API Integration Layer

TanStack Query Setup

Query Client Configuration

// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
defaultOptions: {
queries: {
staleTime: 1000 _ 60 _ 5, // 5 minutes
gcTime: 1000 _ 60 _ 30, // 30 minutes (formerly cacheTime)
retry: 1,
refetchOnWindowFocus: false,
},
mutations: {
retry: 0,
},
},
});

// main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
<QueryClientProvider client={queryClient}>
<App />
<ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
</React.StrictMode>
);

Axios API Client

// lib/api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.cannasaas.com/v1';

export const apiClient = axios.create({
baseURL: API_BASE_URL,
headers: {
'Content-Type': 'application/json',
},
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
(config) => {
const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;

},
(error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
(response) => response,
async (error) => {
const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Call refresh endpoint
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        // Update tokens
        useAuthStore.getState().setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);

}
);

API Service Layer

// lib/api/services/products.ts
import { apiClient } from '../client';
import type { Product, ProductFilters, PaginatedResponse } from '@/types';

export const productsService = {
getProducts: async (filters?: ProductFilters, page = 1, limit = 20) => {
const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', {
params: { ...filters, page, limit },
});
return data;
},

getProduct: async (slugOrId: string) => {
const { data } = await apiClient.get<{ data: Product }>(`/products/${slugOrId}`);
return data.data;
},

searchProducts: async (query: string) => {
const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', {
params: { search: query },
});
return data;
},

createProduct: async (product: Partial<Product>) => {
const { data } = await apiClient.post<{ data: Product }>('/products', product);
return data.data;
},

updateProduct: async (id: string, updates: Partial<Product>) => {
const { data} = await apiClient.put<{ data: Product }>(`/products/${id}`, updates);
return data.data;
},

deleteProduct: async (id: string) => {
await apiClient.delete(`/products/${id}`);
},
};

React Query Hooks

// lib/api/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { productsService } from '../services/products';
import type { ProductFilters } from '@/types';

// Get paginated products
export function useProducts(filters?: ProductFilters, page = 1, limit = 20) {
return useQuery({
queryKey: ['products', filters, page, limit],
queryFn: () => productsService.getProducts(filters, page, limit),
});
}

// Infinite scroll products
export function useInfiniteProducts(filters?: ProductFilters) {
return useInfiniteQuery({
queryKey: ['products', 'infinite', filters],
queryFn: ({ pageParam = 1 }) => productsService.getProducts(filters, pageParam, 20),
getNextPageParam: (lastPage) => {
if (lastPage.pagination.page < lastPage.pagination.totalPages) {
return lastPage.pagination.page + 1;
}
return undefined;
},
initialPageParam: 1,
});
}

// Get single product
export function useProduct(slugOrId: string) {
return useQuery({
queryKey: ['product', slugOrId],
queryFn: () => productsService.getProduct(slugOrId),
enabled: !!slugOrId,
});
}

// Search products with debounce
export function useProductSearch(query: string) {
return useQuery({
queryKey: ['products', 'search', query],
queryFn: () => productsService.searchProducts(query),
enabled: query.length >= 3,
});
}

// Create product mutation
export function useCreateProduct() {
const queryClient = useQueryClient();

return useMutation({
mutationFn: productsService.createProduct,
onSuccess: () => {
queryClient.invalidateQueries({ queryKey: ['products'] });
},
});
}

// Update product mutation
export function useUpdateProduct() {
const queryClient = useQueryClient();

return useMutation({
mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
productsService.updateProduct(id, updates),
onSuccess: (data) => {
queryClient.invalidateQueries({ queryKey: ['products'] });
queryClient.setQueryData(['product', data._id], data);
},
});
}

// Delete product mutation
export function useDeleteProduct() {
const queryClient = useQueryClient();

return useMutation({
mutationFn: productsService.deleteProduct,
onSuccess: () => {
queryClient.invalidateQueries({ queryKey: ['products'] });
},
});
}

Optimistic Updates Example

// lib/api/hooks/useCart.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart';
import { useCartStore } from '@/stores/cartStore';

export function useAddToCart() {
const queryClient = useQueryClient();
const addItem = useCartStore((state) => state.addItem);

return useMutation({
mutationFn: cartService.addItem,

    // Optimistic update
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart'] });

      // Snapshot previous value
      const previousCart = queryClient.getQueryData(['cart']);

      // Optimistically update to the new value
      addItem(newItem.product, newItem.variant, newItem.quantity);

      // Return context with snapshot
      return { previousCart };
    },

    // If mutation fails, use context to roll back
    onError: (err, newItem, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },

});
}

---

Due to character limits, I'll continue in the next part. Let me create this file and continue with the rest of the sections.

Authentication & Authorization

Auth Flow

// hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/lib/api/services/auth';
import toast from 'react-hot-toast';

export function useLogin() {
const navigate = useNavigate();
const login = useAuthStore((state) => state.login);

return useMutation({
mutationFn: authService.login,
onSuccess: (data) => {
login(data.user, data.tokens);
toast.success('Welcome back!');
navigate('/');
},
onError: (error: any) => {
toast.error(error.response?.data?.message || 'Login failed');
},
});
}

export function useRegister() {
const navigate = useNavigate();
const login = useAuthStore((state) => state.login);

return useMutation({
mutationFn: authService.register,
onSuccess: (data) => {
login(data.user, data.tokens);
toast.success('Account created successfully!');
navigate('/');
},
onError: (error: any) => {
toast.error(error.response?.data?.message || 'Registration failed');
},
});
}

export function useLogout() {
const navigate = useNavigate();
const logout = useAuthStore((state) => state.logout);

return useMutation({
mutationFn: authService.logout,
onSuccess: () => {
logout();
navigate('/login');
toast.success('Logged out successfully');
},
});
}

Login Form Component

// pages/auth/Login.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import \* as z from 'zod';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useLogin } from '@/hooks/useAuth';

const loginSchema = z.object({
email: z.string().email('Invalid email address'),
password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
const { mutate: login, isPending } = useLogin();

const {
register,
handleSubmit,
formState: { errors },
} = useForm<LoginFormData>({
resolver: zodResolver(loginSchema),
});

const onSubmit = (data: LoginFormData) => {
login(data);
};

return (

<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
<Card className="w-full max-w-md">
<CardHeader>
<CardTitle>Sign In</CardTitle>
<CardDescription>
Enter your email and password to access your account
</CardDescription>
</CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing in...' : 'Sign In'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>

);
}

---

Theming & Branding System

Dynamic Theme Application

// components/providers/ThemeProvider.tsx
import { useEffect } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useThemeStore } from '@/stores/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
const organization = useOrganizationStore((state) => state.organization);
const mode = useThemeStore((state) => state.mode);

useEffect(() => {
if (!organization?.branding) return;

    const { colors, fonts, customCSS } = organization.branding;

    // Apply color scheme
    if (colors) {
      const root = document.documentElement;

      // Convert hex to HSL for Tailwind CSS variables
      if (colors.primary) {
        const hsl = hexToHSL(colors.primary);
        root.style.setProperty('--primary', hsl);
      }

      if (colors.secondary) {
        const hsl = hexToHSL(colors.secondary);
        root.style.setProperty('--secondary', hsl);
      }

      if (colors.accent) {
        const hsl = hexToHSL(colors.accent);
        root.style.setProperty('--accent', hsl);
      }
    }

    // Apply fonts
    if (fonts) {
      const root = document.documentElement;

      if (fonts.heading) {
        root.style.setProperty('--font-heading', fonts.heading);
      }

      if (fonts.body) {
        root.style.setProperty('--font-body', fonts.body);
      }
    }

    // Inject custom CSS
    if (customCSS) {
      const styleId = 'custom-org-styles';
      let styleEl = document.getElementById(styleId);

      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      styleEl.innerHTML = customCSS;
    }

    // Update favicon
    if (organization.branding.logo?.favicon) {
      const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (link) {
        link.href = organization.branding.logo.favicon;
      }
    }

    // Update document title
    document.title = organization.name || 'Cannabis Dispensary';

}, [organization]);

// Apply dark/light mode
useEffect(() => {
const root = document.documentElement;

    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

}, [mode]);

return <>{children}</>;
}

// Utility function to convert hex to HSL
function hexToHSL(hex: string): string {
// Remove # if present
hex = hex.replace('#', '');

// Convert hex to RGB
const r = parseInt(hex.substring(0, 2), 16) / 255;
const g = parseInt(hex.substring(2, 4), 16) / 255;
const b = parseInt(hex.substring(4, 6), 16) / 255;

const max = Math.max(r, g, b);
const min = Math.min(r, g, b);
let h = 0;
let s = 0;
const l = (max + min) / 2;

if (max !== min) {
const d = max - min;
s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }

}

h = Math.round(h _ 360);
s = Math.round(s _ 100);
const lightness = Math.round(l \* 100);

return `${h} ${s}% ${lightness}%`;
}

Tailwind Configuration

// tailwind.config.js
/** @type {import('tailwindcss').Config} \*/
export default {
darkMode: ['class'],
content: [
'./pages/**/_.{ts,tsx}',
'./components/\*\*/_.{ts,tsx}',
'./app/**/\*.{ts,tsx}',
'./src/**/\*.{ts,tsx}',
],
theme: {
container: {
center: true,
padding: '2rem',
screens: {
'2xl': '1400px',
},
},
extend: {
colors: {
border: 'hsl(var(--border))',
input: 'hsl(var(--input))',
ring: 'hsl(var(--ring))',
background: 'hsl(var(--background))',
foreground: 'hsl(var(--foreground))',
primary: {
DEFAULT: 'hsl(var(--primary))',
foreground: 'hsl(var(--primary-foreground))',
},
secondary: {
DEFAULT: 'hsl(var(--secondary))',
foreground: 'hsl(var(--secondary-foreground))',
},
destructive: {
DEFAULT: 'hsl(var(--destructive))',
foreground: 'hsl(var(--destructive-foreground))',
},
muted: {
DEFAULT: 'hsl(var(--muted))',
foreground: 'hsl(var(--muted-foreground))',
},
accent: {
DEFAULT: 'hsl(var(--accent))',
foreground: 'hsl(var(--accent-foreground))',
},
popover: {
DEFAULT: 'hsl(var(--popover))',
foreground: 'hsl(var(--popover-foreground))',
},
card: {
DEFAULT: 'hsl(var(--card))',
foreground: 'hsl(var(--card-foreground))',
},
},
borderRadius: {
lg: 'var(--radius)',
md: 'calc(var(--radius) - 2px)',
sm: 'calc(var(--radius) - 4px)',
},
fontFamily: {
heading: 'var(--font-heading)',
body: 'var(--font-body)',
},
keyframes: {
'accordion-down': {
from: { height: 0 },
to: { height: 'var(--radix-accordion-content-height)' },
},
'accordion-up': {
from: { height: 'var(--radix-accordion-content-height)' },
to: { height: 0 },
},
},
animation: {
'accordion-down': 'accordion-down 0.2s ease-out',
'accordion-up': 'accordion-up 0.2s ease-out',
},
},
},
plugins: [require('tailwindcss-animate')],
};

---

Performance Optimization

Code Splitting

// Lazy load routes
const HomePage = lazy(() => import('@/pages/storefront/Home'));
const ProductsPage = lazy(() => import('@/pages/storefront/Products'));

// Lazy load heavy components
const ProductReviewsSection = lazy(() => import('@/components/ProductReviews'));

function ProductDetailPage() {
return (

<div>
{/_ Main content _/}
<ProductInfo />

      {/* Lazy load reviews section */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviewsSection productId={productId} />
      </Suspense>
    </div>

);
}

Image Optimization

// components/common/OptimizedImage.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
src: string;
alt: string;
width?: number;
height?: number;
aspectRatio?: string;
}

export function OptimizedImage({
src,
alt,
width,
height,
aspectRatio,
className,
...props
}: OptimizedImageProps) {
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(false);

// Generate srcset for responsive images
const srcset = `     ${src}?w=400 400w,
    ${src}?w=800 800w,
    ${src}?w=1200 1200w
  `;

return (

<div className={cn('relative overflow-hidden', className)} style={{ aspectRatio }}>
{isLoading && (
<div className="absolute inset-0 animate-pulse bg-gray-200" />
)}

      {error ? (
        <div className="flex h-full items-center justify-center bg-gray-100">
          <span className="text-sm text-gray-400">Failed to load image</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          srcSet={srcset}
          sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          {...props}
        />
      )}
    </div>

);
}

Virtual Scrolling for Large Lists

// components/common/VirtualProductList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '@/types';

interface VirtualProductListProps {
products: Product[];
}

export function VirtualProductList({ products }: VirtualProductListProps) {
const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
count: products.length,
getScrollElement: () => parentRef.current,
estimateSize: () => 400, // Estimated height of each item
overscan: 5,
});

return (

<div ref={parentRef} className="h-screen overflow-auto">
<div
style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }} >
{virtualizer.getVirtualItems().map((virtualItem) => {
const product = products[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ProductCard product={product} />
            </div>
          );
        })}
      </div>
    </div>

);
}

Memoization

// Use React.memo for expensive components
import { memo } from 'react';

const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
// Component implementation
}, (prevProps, nextProps) => {
// Custom comparison function
return prevProps.product.\_id === nextProps.product.\_id;
});

// Use useMemo for expensive calculations
import { useMemo } from 'react';

function ProductList({ products, filters }: Props) {
const filteredProducts = useMemo(() => {
return products.filter(product => {
if (filters.category && product.category !== filters.category) {
return false;
}
if (filters.minPrice && product.price < filters.minPrice) {
return false;
}
return true;
});
}, [products, filters]);

return (

<div>
{filteredProducts.map(product => (
<ProductCard key={product._id} product={product} />
))}
</div>
);
}

// Use useCallback for functions passed as props
import { useCallback } from 'react';

function ProductsPage() {
const handleAddToCart = useCallback((product: Product) => {
// Add to cart logic
}, []);

return (

<div>
{products.map(product => (
<ProductCard
          key={product._id}
          product={product}
          onAddToCart={handleAddToCart}
        />
))}
</div>
);
}

---

Testing Strategy

Vitest Configuration

// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
plugins: [react()],
test: {
globals: true,
environment: 'jsdom',
setupFiles: ['./src/test/setup.ts'],
coverage: {
reporter: ['text', 'json', 'html'],
exclude: [
'node_modules/',
'src/test/',
],
},
},
resolve: {
alias: {
'@': path.resolve(\_\_dirname, './src'),
},
},
});

// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
cleanup();
});

Component Testing

// components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
it('renders correctly', () => {
render(<Button>Click me</Button>);
expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
});

it('handles click events', () => {
const handleClick = vi.fn();
render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);

});

it('can be disabled', () => {
render(<Button disabled>Click me</Button>);
expect(screen.getByRole('button')).toBeDisabled();
});

it('applies variant styles', () => {
const { container } = render(<Button variant="destructive">Delete</Button>);
expect(container.firstChild).toHaveClass('bg-destructive');
});
});

Hook Testing

// hooks/useCart.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/stores/cartStore';

describe('useCartStore', () => {
beforeEach(() => {
// Reset store before each test
useCartStore.setState({ items: [] });
});

it('adds item to cart', () => {
const { result } = renderHook(() => useCartStore());

    const mockProduct = {
      _id: 'prod_1',
      name: 'Test Product',
      // ... other product fields
    };

    const mockVariant = {
      _id: 'var_1',
      pricing: { basePrice: 29.99 },
      // ... other variant fields
    };

    act(() => {
      result.current.addItem(mockProduct, mockVariant, 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.itemCount).toBe(2);

});

it('updates quantity', () => {
const { result } = renderHook(() => useCartStore());

    // Add item first
    act(() => {
      result.current.addItem(mockProduct, mockVariant, 1);
    });

    const itemId = result.current.items[0].id;

    // Update quantity
    act(() => {
      result.current.updateQuantity(itemId, 5);
    });

    expect(result.current.items[0].quantity).toBe(5);

});

it('calculates subtotal correctly', () => {
const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProduct, mockVariant, 2);
    });

    expect(result.current.subtotal).toBe(59.98); // 2 * 29.99

});
});

Integration Testing

// pages/Products.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ProductsPage from './Products';
import \* as productsApi from '@/lib/api/hooks/useProducts';

// Mock API
vi.mock('@/lib/api/hooks/useProducts');

const queryClient = new QueryClient({
defaultOptions: {
queries: { retry: false },
},
});

function renderWithProviders(ui: React.ReactElement) {
return render(
<QueryClientProvider client={queryClient}>
<BrowserRouter>
{ui}
</BrowserRouter>
</QueryClientProvider>
);
}

describe('ProductsPage', () => {
it('displays loading state', () => {
vi.spyOn(productsApi, 'useProducts').mockReturnValue({
data: undefined,
isLoading: true,
error: null,
} as any);

    renderWithProviders(<ProductsPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

});

it('displays products when loaded', async () => {
const mockProducts = [
{
_id: 'prod_1',
name: 'Blue Dream',
slug: 'blue-dream',
// ... other fields
},
{
_id: 'prod_2',
name: 'Green Crack',
slug: 'green-crack',
// ... other fields
},
];

    vi.spyOn(productsApi, 'useProducts').mockReturnValue({
      data: { data: mockProducts, pagination: { total: 2 } },
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByText('Blue Dream')).toBeInTheDocument();
      expect(screen.getByText('Green Crack')).toBeInTheDocument();
    });

});

it('displays error state', async () => {
vi.spyOn(productsApi, 'useProducts').mockReturnValue({
data: undefined,
isLoading: false,
error: new Error('Failed to fetch'),
} as any);

    renderWithProviders(<ProductsPage />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();

});
});

---

Build & Deployment

Vite Configuration

// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
plugins: [react()],
resolve: {
alias: {
'@': path.resolve(\_\_dirname, './src'),
},
},
build: {
sourcemap: true,
rollupOptions: {
output: {
manualChunks: {
'react-vendor': ['react', 'react-dom', 'react-router-dom'],
'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
'query-vendor': ['@tanstack/react-query'],
},
},
},
},
server: {
port: 3000,
proxy: {
'/api': {
target: 'http://localhost:5000',
changeOrigin: true,
},
},
},
});

Environment Variables

.env.example
VITE*API_BASE_URL=https://api.cannasaas.com/v1
VITE_STRIPE_PUBLIC_KEY=pk_test*...
VITE_GOOGLE_MAPS_API_KEY=AIza...
VITE_SENTRY_DSN=https://...

Docker Configuration

Dockerfile
Copy package files
Install dependencies
Copy source
Build
Production image
Copy built assets
Copy nginx config
FROM node:20-alpine AS builder

WORKDIR /app

COPY package\*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

CI/CD Pipeline (GitHub Actions)

.github/workflows/deploy.yml
name: Deploy to Production

on:
push:
branches: [main]

jobs:
build-and-deploy:
runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          VITE_STRIPE_PUBLIC_KEY: ${{ secrets.STRIPE_PUBLIC_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

---

Additional Code Examples

Complete Page Example: Products Page

// pages/storefront/Products.tsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@/lib/api/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import ProductCard from '@/components/storefront/ProductCard';
import ProductFilters from '@/components/common/ProductFilters';
import SearchBar from '@/components/common/SearchBar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select';

export default function ProductsPage() {
const [searchParams, setSearchParams] = useSearchParams();
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 500);

// Get filters from URL
const filters = {
category: searchParams.get('category') || undefined,
minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
minThc: searchParams.get('minThc') ? Number(searchParams.get('minThc')) : undefined,
strainType: searchParams.get('strainType') || undefined,
search: debouncedSearch || undefined,
};

const page = Number(searchParams.get('page')) || 1;
const sort = searchParams.get('sort') || 'popularity';

const { data, isLoading, error } = useProducts({ ...filters, sort }, page, 20);

const handleFilterChange = (newFilters: any) => {
const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, String(value));
      }
    });

    setSearchParams(params);

};

const handleSortChange = (value: string) => {
searchParams.set('sort', value);
setSearchParams(searchParams);
};

const handlePageChange = (newPage: number) => {
searchParams.set('page', String(newPage));
setSearchParams(searchParams);
window.scrollTo({ top: 0, behavior: 'smooth' });
};

if (error) {
return (

<div className="container py-8">
<div className="text-center">
<h2 className="text-2xl font-bold text-destructive">Error loading products</h2>
<p className="mt-2 text-muted-foreground">Please try again later</p>
</div>
</div>
);
}

return (

<div className="container py-8">
{/_ Header _/}
<div className="mb-8">
<h1 className="text-3xl font-bold">Shop Products</h1>
<p className="mt-2 text-muted-foreground">
Browse our selection of premium cannabis products
</p>
</div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search products..."
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block">
          <ProductFilters filters={data?.filters || {}} onChange={handleFilterChange} />
        </aside>

        {/* Products Grid */}
        <div>
          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data?.pagination.total || 0} products found
            </p>

            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="name_asc">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          ) : data?.data.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data?.data.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>

              {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show first, last, current, and adjacent pages
                  return (
                    p === 1 ||
                    p === data.pagination.totalPages ||
                    Math.abs(p - page) <= 1
                  );
                })
                .map((p, i, arr) => {
                  // Show ellipsis if there's a gap
                  const prevPage = arr[i - 1];
                  const showEllipsis = prevPage && p - prevPage > 1;

                  return (
                    <div key={p} className="flex gap-2">
                      {showEllipsis && <span className="px-2">...</span>}
                      <Button
                        variant={p === page ? 'default' : 'outline'}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </Button>
                    </div>
                  );
                })}

              <Button
                variant="outline"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === data.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>

);
}

Complete Form Example: Checkout Form

// components/checkout/CheckoutForm.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import \* as z from 'zod';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useCreateOrder } from '@/lib/api/hooks/useOrders';
import toast from 'react-hot-toast';

const checkoutSchema = z.object({
fulfillmentMethod: z.enum(['delivery', 'pickup']),

// Delivery fields
addressId: z.string().optional(),
deliveryInstructions: z.string().optional(),

// Pickup fields
pickupLocationId: z.string().optional(),

// Payment
paymentMethod: z.enum(['card', 'cash']),
savePaymentMethod: z.boolean().default(false),

// Optional
couponCode: z.string().optional(),
usePoints: z.number().min(0).optional(),
notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutForm() {
const stripe = useStripe();
const elements = useElements();
const items = useCartStore((state) => state.items);
const clearCart = useCartStore((state) => state.clearCart);
const user = useAuthStore((state) => state.user);
const { mutate: createOrder, isPending } = useCreateOrder();

const {
register,
handleSubmit,
watch,
control,
formState: { errors },
} = useForm<CheckoutFormData>({
resolver: zodResolver(checkoutSchema),
defaultValues: {
fulfillmentMethod: 'delivery',
paymentMethod: 'card',
savePaymentMethod: false,
usePoints: 0,
},
});

const fulfillmentMethod = watch('fulfillmentMethod');
const paymentMethod = watch('paymentMethod');

const onSubmit = async (data: CheckoutFormData) => {
try {
// Handle Stripe payment if card selected
let paymentMethodId: string | undefined;

      if (data.paymentMethod === 'card') {
        if (!stripe || !elements) {
          toast.error('Payment system not ready');
          return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          toast.error('Card element not found');
          return;
        }

        // Create payment method
        const { error, paymentMethod: pm } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: `${user?.profile.firstName} ${user?.profile.lastName}`,
            email: user?.email,
          },
        });

        if (error) {
          toast.error(error.message || 'Payment failed');
          return;
        }

        paymentMethodId = pm.id;
      }

      // Create order
      createOrder(
        {
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          fulfillment: {
            method: data.fulfillmentMethod,
            addressId: data.addressId,
            deliveryInstructions: data.deliveryInstructions,
            pickupLocationId: data.pickupLocationId,
          },
          payment: {
            method: data.paymentMethod,
            paymentMethodId,
            savePaymentMethod: data.savePaymentMethod,
          },
          couponCodes: data.couponCode ? [data.couponCode] : undefined,
          loyaltyPoints: data.usePoints,
          notes: {
            customer: data.notes,
          },
        },
        {
          onSuccess: (order) => {
            // Handle 3D Secure if needed
            if (order.paymentIntent?.clientSecret) {
              handlePaymentConfirmation(order.paymentIntent.clientSecret);
            } else {
              // Order complete
              clearCart();
              toast.success('Order placed successfully!');
              window.location.href = `/orders/${order.orderNumber}`;
            }
          },
          onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Order failed');
          },
        }
      );
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('An error occurred during checkout');
    }

};

const handlePaymentConfirmation = async (clientSecret: string) => {
if (!stripe) return;

    const { error } = await stripe.confirmCardPayment(clientSecret);

    if (error) {
      toast.error(error.message || 'Payment confirmation failed');
    } else {
      clearCart();
      toast.success('Order placed successfully!');
      window.location.href = '/account/orders';
    }

};

return (

<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
{/_ Fulfillment Method _/}
<div>
<Label className="text-base font-semibold">Fulfillment Method</Label>
<Controller
name="fulfillmentMethod"
control={control}
render={({ field }) => (
<RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-3 grid gap-4 sm:grid-cols-2"
            >
<Label
                htmlFor="delivery"
                className="flex cursor-pointer items-center space-x-3 rounded-lg border p-4"
              >
<RadioGroupItem value="delivery" id="delivery" />
<div>
<div className="font-medium">Delivery</div>
<div className="text-sm text-muted-foreground">
Get it delivered to your door
</div>
</div>
</Label>

              <Label
                htmlFor="pickup"
                className="flex cursor-pointer items-center space-x-3 rounded-lg border p-4"
              >
                <RadioGroupItem value="pickup" id="pickup" />
                <div>
                  <div className="font-medium">Pickup</div>
                  <div className="text-sm text-muted-foreground">
                    Pick up from store
                  </div>
                </div>
              </Label>
            </RadioGroup>
          )}
        />
      </div>

      {/* Delivery Address */}
      {fulfillmentMethod === 'delivery' && (
        <div className="space-y-4">
          <Label htmlFor="addressId">Delivery Address</Label>
          <select
            id="addressId"
            {...register('addressId')}
            className="w-full rounded-md border p-2"
          >
            <option value="">Select address</option>
            {user?.addresses.map((address) => (
              <option key={address._id} value={address._id}>
                {address.label} - {address.street}, {address.city}
              </option>
            ))}
          </select>
          {errors.addressId && (
            <p className="text-sm text-destructive">{errors.addressId.message}</p>
          )}

          <div>
            <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
            <Textarea
              id="deliveryInstructions"
              {...register('deliveryInstructions')}
              placeholder="e.g., Ring doorbell, leave at door"
            />
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div>
        <Label className="text-base font-semibold">Payment Method</Label>
        <Controller
          name="paymentMethod"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-3 space-y-3"
            >
              <Label
                htmlFor="card"
                className="flex cursor-pointer items-center space-x-3 rounded-lg border p-4"
              >
                <RadioGroupItem value="card" id="card" />
                <div className="flex-1">
                  <div className="font-medium">Credit/Debit Card</div>
                </div>
              </Label>

              <Label
                htmlFor="cash"
                className="flex cursor-pointer items-center space-x-3 rounded-lg border p-4"
              >
                <RadioGroupItem value="cash" id="cash" />
                <div>
                  <div className="font-medium">Cash on Delivery</div>
                </div>
              </Label>
            </RadioGroup>
          )}
        />
      </div>

      {/* Card Element */}
      {paymentMethod === 'card' && (
        <div className="rounded-lg border p-4">
          <Label>Card Details</Label>
          <div className="mt-2">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? 'Processing...' : 'Place Order'}
      </Button>
    </form>

);
}

---

Conclusion

This React architecture provides:

· ✅ **Scalable Structure**: Monorepo setup for multiple apps
· ✅ **Type Safety**: Full TypeScript coverage
· ✅ **State Management**: Zustand for client state, TanStack Query for server state
· ✅ **Performance**: Code splitting, lazy loading, memoization
· ✅ **Developer Experience**: Hot reload, TypeScript, ESLint, Prettier
· ✅ **Testing**: Comprehensive testing with Vitest
· ✅ **Production Ready**: Optimized builds, Docker support, CI/CD

The architecture is designed to be:
· **Maintainable**: Clear separation of concerns
· **Testable**: Isolated components and hooks
· **Performant**: Optimized for production
· **Extensible**: Easy to add new features

Next Steps: 14. Set up the monorepo structure 15. Install dependencies 16. Configure Tailwind and shadcn/ui 17. Build out shared component library 18. Implement core pages (Products, Cart, Checkout) 19. Add authentication and routing 20. Integrate with backend API 21. Add testing 22. Deploy to production

This architecture will serve as the foundation for a professional, scalable cannabis e-commerce platform.

---

End of Document

Multi-Tenant Cannabis E-Commerce Platform
Document Version: 1.0
Date: January 20, 2026
Focus: Frontend Architecture with React

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [State Management Strategy](#state-management-strategy)
5. [Routing & Navigation](#routing--navigation)
6. [Component Architecture](#component-architecture)
7. [API Integration Layer](#api-integration-layer)
8. [Authentication & Authorization](#authentication--authorization)
9. [Theming & Branding System](#theming--branding-system)
10. [Performance Optimization](#performance-optimization)
11. [Testing Strategy](#testing-strategy)
12. [Build & Deployment](#build--deployment)
13. [Code Examples](#code-examples)

---

Architecture Overview

High-Level React Architecture

┌─────────────────────────────────────────────────────────────────┐
│ React Application │
└─────────────────────────────────────────────────────────────────┘
│
┌─────────────────────┼─────────────────────┐
│ │ │
▼ ▼ ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Customer │ │ Admin │ │ Staff │
│ Storefront │ │ Portal │ │ Portal │
│ │ │ │ │ │
│ - Browse │ │ - Dashboard │ │ - Orders │
│ - Cart │ │ - Products │ │ - Customers │
│ - Checkout │ │ - Orders │ │ - Inventory │
│ - Account │ │ - Analytics │ │ - Delivery │
└──────────────┘ └──────────────┘ └──────────────┘
│ │ │
└─────────────────────┼─────────────────────┘
│
▼
┌─────────────────────────────────────────┐
│ Shared Core Infrastructure │
│ │
│ ┌────────────┐ ┌────────────┐ │
│ │ State │ │ Router │ │
│ │ Management │ │ │ │
│ │ (Zustand) │ │ React │ │
│ └────────────┘ │ Router v6 │ │
│ └────────────┘ │
│ │
│ ┌────────────┐ ┌────────────┐ │
│ │ API │ │ Theme │ │
│ │ Client │ │ System │ │
│ │ (TanStack │ │ │ │
│ │ Query) │ │ Tailwind + │ │
│ └────────────┘ │ shadcn/ui │ │
│ └────────────┘ │
└─────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────┐
│ UI Component Library │
│ │
│ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│ │ Design │ │ shadcn/ │ │ Custom │ │
│ │ System │ │ ui │ │ Comps │ │
│ └──────────┘ └──────────┘ └─────────┘ │
└─────────────────────────────────────────┘

Application Types

We'll build three separate React applications that share common code:

1. Customer Storefront (`apps/storefront`)
   · Public-facing e-commerce site
   · Product browsing and search
   · Shopping cart and checkout
   · User accounts and order history
   · Responsive, mobile-first design

2. Admin Portal (`apps/admin`)
   · Store management dashboard
   · Product and inventory management
   · Order processing
   · Analytics and reporting
   · Staff management

3. Staff Portal (`apps/staff`)
   · Simplified interface for staff/budtenders
   · Order fulfillment
   · Customer service
   · Inventory lookup
   · Quick actions

---

Project Structure

Monorepo Structure (Recommended)

cannabis-platform/
├── apps/
│ ├── storefront/ # Customer-facing app
│ │ ├── public/
│ │ ├── src/
│ │ │ ├── assets/
│ │ │ ├── components/ # App-specific components
│ │ │ ├── pages/
│ │ │ ├── layouts/
│ │ │ ├── hooks/ # Custom hooks
│ │ │ ├── utils/
│ │ │ ├── App.tsx
│ │ │ ├── main.tsx
│ │ │ └── routes.tsx
│ │ ├── index.html
│ │ ├── vite.config.ts
│ │ └── package.json
│ │
│ ├── admin/ # Admin portal
│ │ ├── public/
│ │ ├── src/
│ │ │ ├── components/
│ │ │ ├── pages/
│ │ │ │ ├── Dashboard/
│ │ │ │ ├── Products/
│ │ │ │ ├── Orders/
│ │ │ │ ├── Customers/
│ │ │ │ ├── Analytics/
│ │ │ │ └── Settings/
│ │ │ ├── layouts/
│ │ │ ├── App.tsx
│ │ │ └── main.tsx
│ │ └── vite.config.ts
│ │
│ └── staff/ # Staff portal
│ └── src/
│ └── ...
│
├── packages/
│ ├── ui/ # Shared UI components
│ │ ├── src/
│ │ │ ├── components/
│ │ │ │ ├── Button/
│ │ │ │ │ ├── Button.tsx
│ │ │ │ │ ├── Button.test.tsx
│ │ │ │ │ └── index.ts
│ │ │ │ ├── Input/
│ │ │ │ ├── Card/
│ │ │ │ ├── Modal/
│ │ │ │ ├── Table/
│ │ │ │ └── ...
│ │ │ ├── layouts/
│ │ │ ├── index.ts
│ │ │ └── styles/
│ │ └── package.json
│ │
│ ├── api-client/ # API client library
│ │ ├── src/
│ │ │ ├── client.ts
│ │ │ ├── hooks/
│ │ │ │ ├── useProducts.ts
│ │ │ │ ├── useOrders.ts
│ │ │ │ ├── useAuth.ts
│ │ │ │ └── ...
│ │ │ ├── services/
│ │ │ │ ├── products.ts
│ │ │ │ ├── orders.ts
│ │ │ │ ├── users.ts
│ │ │ │ └── ...
│ │ │ ├── types/
│ │ │ │ ├── product.ts
│ │ │ │ ├── order.ts
│ │ │ │ ├── user.ts
│ │ │ │ └── ...
│ │ │ └── index.ts
│ │ └── package.json
│ │
│ ├── stores/ # Shared state stores
│ │ ├── src/
│ │ │ ├── authStore.ts
│ │ │ ├── cartStore.ts
│ │ │ ├── organizationStore.ts
│ │ │ ├── themeStore.ts
│ │ │ └── index.ts
│ │ └── package.json
│ │
│ ├── utils/ # Shared utilities
│ │ ├── src/
│ │ │ ├── formatting.ts
│ │ │ ├── validation.ts
│ │ │ ├── date.ts
│ │ │ ├── currency.ts
│ │ │ └── ...
│ │ └── package.json
│ │
│ └── types/ # Shared TypeScript types
│ ├── src/
│ │ ├── api.ts
│ │ ├── models/
│ │ │ ├── Product.ts
│ │ │ ├── Order.ts
│ │ │ ├── User.ts
│ │ │ └── ...
│ │ └── index.ts
│ └── package.json
│
├── package.json # Root package.json
├── pnpm-workspace.yaml # PNPM workspace config
├── turbo.json # Turborepo config
├── tsconfig.json # Base TypeScript config
└── .eslintrc.js # ESLint config

Single App Structure (Alternative)

src/
├── apps/
│ ├── storefront/
│ ├── admin/
│ └── staff/
├── components/
│ ├── ui/ # shadcn/ui components
│ │ ├── button.tsx
│ │ ├── input.tsx
│ │ ├── card.tsx
│ │ └── ...
│ ├── common/ # Shared components
│ │ ├── Header/
│ │ ├── Footer/
│ │ ├── ProductCard/
│ │ ├── SearchBar/
│ │ └── ...
│ ├── storefront/ # Storefront-specific
│ ├── admin/ # Admin-specific
│ └── staff/ # Staff-specific
├── lib/
│ ├── api/ # API client
│ ├── hooks/ # Custom hooks
│ ├── utils/ # Utility functions
│ └── constants/ # Constants
├── stores/ # Zustand stores
├── types/ # TypeScript types
├── styles/ # Global styles
├── App.tsx
└── main.tsx

---

Technology Stack

Core Dependencies

{
"dependencies": {
"react": "^18.2.0",
"react-dom": "^18.2.0",

    // Routing
    "react-router-dom": "^6.20.0",

    // State Management
    "zustand": "^4.4.7",

    // Data Fetching
    "@tanstack/react-query": "^5.14.2",
    "axios": "^1.6.2",

    // Forms
    "react-hook-form": "^7.49.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.3",

    // UI Components
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",

    // Styling
    "tailwindcss": "^3.3.6",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",

    // Icons
    "lucide-react": "^0.294.0",

    // Dates
    "date-fns": "^3.0.0",

    // Charts
    "recharts": "^2.10.3",

    // Image handling
    "react-image-crop": "^11.0.4",

    // Rich text
    "@tiptap/react": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13",

    // Utilities
    "react-hot-toast": "^2.4.1",
    "nanoid": "^5.0.4",
    "immer": "^10.0.3"

},
"devDependencies": {
"@types/react": "^18.2.43",
"@types/react-dom": "^18.2.17",
"@typescript-eslint/eslint-plugin": "^6.14.0",
"@typescript-eslint/parser": "^6.14.0",
"@vitejs/plugin-react": "^4.2.1",

    // Testing
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",

    // Linting & Formatting
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "prettier": "^3.1.1",
    "prettier-plugin-tailwindcss": "^0.5.9",

    "typescript": "^5.3.3",
    "vite": "^5.0.8"

}
}

Justification for Choices

Zustand over Redux
· **Simpler API**: Less boilerplate
· **Better TypeScript support**: Type inference works naturally
· **Smaller bundle size**: ~1KB vs ~10KB
· **Easier testing**: No need for complex setup
· **Perfect for our use case**: We don't need Redux's advanced features

TanStack Query over SWR/Redux Toolkit Query
· **Powerful caching**: Automatic background refetching
· **Optimistic updates**: Better UX for mutations
· **Devtools**: Excellent debugging experience
· **Infinite queries**: Perfect for pagination
· **Offline support**: Built-in

React Hook Form over Formik
· **Performance**: Uncontrolled components = less re-renders
· **Bundle size**: Smaller footprint
· **Integration**: Works seamlessly with Zod
· **TypeScript**: Better type inference

Tailwind CSS over CSS-in-JS
· **Performance**: No runtime overhead
· **Developer experience**: Rapid prototyping
· **Consistency**: Design system constraints
· **Production ready**: Proven at scale
· **shadcn/ui**: Perfect component library using Tailwind

---

State Management Strategy

Zustand Store Architecture

Auth Store

// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
user: User | null;
accessToken: string | null;
refreshToken: string | null;
isAuthenticated: boolean;

// Actions
login: (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
logout: () => void;
updateUser: (user: Partial<User>) => void;
setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
}

export const useAuthStore = create<AuthState>()(
persist(
(set) => ({
user: null,
accessToken: null,
refreshToken: null,
isAuthenticated: false,

      login: (user, tokens) => set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true,
      }),

      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      }),

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

      setTokens: (tokens) => set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        // Don't persist accessToken (it expires quickly)
      }),
    }

)
);

Cart Store

// stores/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CartItem, Product, Variant } from '@/types';

interface CartState {
items: CartItem[];

// Computed values
itemCount: number;
subtotal: number;

// Actions
addItem: (product: Product, variant: Variant, quantity: number) => void;
removeItem: (itemId: string) => void;
updateQuantit y: (itemId: string, quantity: number) => void;
clearCart: () => void;

// Helpers
getItem: (productId: string, variantId: string) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
persist(
immer((set, get) => ({
items: [],

      get itemCount() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      get subtotal() {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      addItem: (product, variant, quantity) => set((state) => {
        const existingItem = state.items.find(
          (item) => item.productId === product._id && item.variantId === variant._id
        );

        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          state.items.push({
            id: `${product._id}-${variant._id}`,
            productId: product._id,
            variantId: variant._id,
            product: {
              name: product.name,
              slug: product.slug,
              image: product.media.images[0]?.url,
            },
            variant: {
              name: variant.name,
              sku: variant.sku,
            },
            quantity,
            price: variant.pricing.salePrice || variant.pricing.basePrice,
          });
        }
      }),

      removeItem: (itemId) => set((state) => {
        state.items = state.items.filter((item) => item.id !== itemId);
      }),

      updateQuantity: (itemId, quantity) => set((state) => {
        const item = state.items.find((item) => item.id === itemId);
        if (item) {
          if (quantity <= 0) {
            state.items = state.items.filter((item) => item.id !== itemId);
          } else {
            item.quantity = quantity;
          }
        }
      }),

      clearCart: () => set({ items: [] }),

      getItem: (productId, variantId) => {
        return get().items.find(
          (item) => item.productId === productId && item.variantId === variantId
        );
      },
    })),
    {
      name: 'cart-storage',
    }

)
);

Organization Store (Multi-Tenancy)

// stores/organizationStore.ts
import { create } from 'zustand';
import type { Organization } from '@/types';

interface OrganizationState {
organization: Organization | null;
loading: boolean;
error: string | null;

setOrganization: (org: Organization) => void;
setLoading: (loading: boolean) => void;
setError: (error: string | null) => void;
clearOrganization: () => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
organization: null,
loading: true,
error: null,

setOrganization: (org) => set({ organization: org, loading: false, error: null }),
setLoading: (loading) => set({ loading }),
setError: (error) => set({ error, loading: false }),
clearOrganization: () => set({ organization: null, loading: false, error: null }),
}));

Theme Store

// stores/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
mode: 'light' | 'dark';
customColors: {
primary?: string;
secondary?: string;
accent?: string;
};

setMode: (mode: 'light' | 'dark') => void;
toggleMode: () => void;
setCustomColors: (colors: ThemeState['customColors']) => void;
}

export const useThemeStore = create<ThemeState>()(
persist(
(set) => ({
mode: 'light',
customColors: {},

      setMode: (mode) => set({ mode }),

      toggleMode: () => set((state) => ({
        mode: state.mode === 'light' ? 'dark' : 'light',
      })),

      setCustomColors: (colors) => set({ customColors: colors }),
    }),
    {
      name: 'theme-storage',
    }

)
);

When to Use State vs. Server Cache

Use Zustand for:
· **UI State**: Modals, sidebars, filters
· **User Session**: Auth tokens, user data
· **Client-Side Only**: Cart, theme preferences
· **Cross-Component**: Data needed by multiple unrelated components

Use TanStack Query for:
· **Server Data**: Products, orders, users
· **Real-Time Updates**: Order status, inventory
· **Cached Data**: Frequently accessed API data
· **Background Syncing**: Automatic refetching

---

Routing & Navigation

React Router v6 Setup

Router Configuration

// routes.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Layouts
import RootLayout from '@/layouts/RootLayout';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import AdminLayout from '@/layouts/AdminLayout';

// Auth guard
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy load pages
const HomePage = lazy(() => import('@/pages/storefront/Home'));
const ProductsPage = lazy(() => import('@/pages/storefront/Products'));
const ProductDetailPage = lazy(() => import('@/pages/storefront/ProductDetail'));
const CartPage = lazy(() => import('@/pages/storefront/Cart'));
const CheckoutPage = lazy(() => import('@/pages/storefront/Checkout'));
const AccountPage = lazy(() => import('@/pages/storefront/Account'));

const LoginPage = lazy(() => import('@/pages/auth/Login'));
const RegisterPage = lazy(() => import('@/pages/auth/Register'));

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('@/pages/admin/Products'));
const AdminOrders = lazy(() => import('@/pages/admin/Orders'));

export const router = createBrowserRouter([
{
path: '/',
element: <RootLayout />,
errorElement: <ErrorPage />,
children: [
// Storefront routes
{
element: <StorefrontLayout />,
children: [
{ index: true, element: <Suspense fallback={<LoadingSpinner />}><HomePage /></Suspense> },
{ path: 'products', element: <Suspense fallback={<LoadingSpinner />}><ProductsPage /></Suspense> },
{ path: 'products/:slug', element: <Suspense fallback={<LoadingSpinner />}><ProductDetailPage /></Suspense> },
{ path: 'cart', element: <Suspense fallback={<LoadingSpinner />}><CartPage /></Suspense> },
{
path: 'checkout',
element: (
<ProtectedRoute>
<Suspense fallback={<LoadingSpinner />}><CheckoutPage /></Suspense>
</ProtectedRoute>
)
},
{
path: 'account/*',
element: (
<ProtectedRoute>
<Suspense fallback={<LoadingSpinner />}><AccountPage /></Suspense>
</ProtectedRoute>
)
},
],
},

      // Auth routes
      { path: 'login', element: <Suspense fallback={<LoadingSpinner />}><LoginPage /></Suspense> },
      { path: 'register', element: <Suspense fallback={<LoadingSpinner />}><RegisterPage /></Suspense> },

      // Admin routes
      {
        path: 'admin',
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Suspense fallback={<LoadingSpinner />}><AdminDashboard /></Suspense> },
          { path: 'products', element: <Suspense fallback={<LoadingSpinner />}><AdminProducts /></Suspense> },
          { path: 'products/new', element: <Suspense fallback={<LoadingSpinner />}><AdminProductForm /></Suspense> },
          { path: 'products/:id/edit', element: <Suspense fallback={<LoadingSpinner />}><AdminProductForm /></Suspense> },
          { path: 'orders', element: <Suspense fallback={<LoadingSpinner />}><AdminOrders /></Suspense> },
          { path: 'orders/:id', element: <Suspense fallback={<LoadingSpinner />}><AdminOrderDetail /></Suspense> },
          { path: 'customers', element: <Suspense fallback={<LoadingSpinner />}><AdminCustomers /></Suspense> },
          { path: 'analytics', element: <Suspense fallback={<LoadingSpinner />}><AdminAnalytics /></Suspense> },
          { path: 'settings', element: <Suspense fallback={<LoadingSpinner />}><AdminSettings /></Suspense> },
        ],
      },
    ],

},
]);

// App.tsx
function App() {
return <RouterProvider router={router} />;
}

export default App;

Protected Route Component

// components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
children: React.ReactNode;
requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
const { isAuthenticated, user } = useAuthStore();
const location = useLocation();

if (!isAuthenticated) {
return <Navigate to="/login" state={{ from: location }} replace />;
}

if (requiredRole && user?.role !== requiredRole) {
return <Navigate to="/" replace />;
}

return <>{children}</>;
}

---

Component Architecture

Component Hierarchy

App
├── RootLayout
│ ├── OrganizationProvider (loads org data)
│ ├── ThemeProvider (applies branding)
│ └── Outlet (renders child routes)
│
├── StorefrontLayout
│ ├── Header
│ │ ├── Logo
│ │ ├── SearchBar
│ │ ├── Navigation
│ │ ├── CartButton
│ │ └── UserMenu
│ ├── main
│ │ └── Outlet
│ └── Footer
│
├── AdminLayout
│ ├── AdminHeader
│ ├── Sidebar
│ │ └── Navigation
│ ├── main
│ │ └── Outlet
│ └── AdminFooter
│
└── Pages
├── Home
├── Products
├── ProductDetail
├── Cart
├── Checkout
└── ...

Component Patterns

1. Presentational Components (Pure UI)

// components/ui/button.tsx
import \* as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
{
variants: {
variant: {
default: 'bg-primary text-primary-foreground hover:bg-primary/90',
destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
ghost: 'hover:bg-accent hover:text-accent-foreground',
link: 'text-primary underline-offset-4 hover:underline',
},
size: {
default: 'h-10 px-4 py-2',
sm: 'h-9 rounded-md px-3',
lg: 'h-11 rounded-md px-8',
icon: 'h-10 w-10',
},
},
defaultVariants: {
variant: 'default',
size: 'default',
},
}
);

export interface ButtonProps
extends React.ButtonHTMLAttributes<HTMLButtonElement>,
VariantProps<typeof buttonVariants> {
asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
({ className, variant, size, asChild = false, ...props }, ref) => {
const Comp = asChild ? Slot : 'button';
return (
<Comp
className={cn(buttonVariants({ variant, size, className }))}
ref={ref}
{...props}
/>
);
}
);

Button.displayName = 'Button';

export { Button, buttonVariants };

2. Container Components (Business Logic)

// components/storefront/ProductCard.tsx
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardProps {
product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
const addItem = useCartStore((state) => state.addItem);
const variant = product.variants[0]; // Default variant

const handleAddToCart = (e: React.MouseEvent) => {
e.preventDefault(); // Don't navigate to product page
addItem(product, variant, 1);
toast.success(`${product.name} added to cart`);
};

const isOnSale = variant.pricing.onSale;
const price = variant.pricing.salePrice || variant.pricing.basePrice;

return (
<Card className="group relative overflow-hidden">

<Link to={`/products/${product.slug}`}>
{/_ Image _/}
<div className="aspect-square overflow-hidden bg-gray-100">
<img
            src={product.media.images[0]?.url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
</div>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-2">
          {isOnSale && <Badge variant="destructive">Sale</Badge>}
          {product.featured && <Badge>Featured</Badge>}
          {product.badges?.includes('new_arrival') && <Badge variant="secondary">New</Badge>}
        </div>

        {/* Content */}
        <CardContent className="p-4">
          {/* Category */}
          <p className="text-xs text-muted-foreground uppercase">
            {product.category}
          </p>

          {/* Name */}
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary">
            {product.name}
          </h3>

          {/* Cannabis Info */}
          <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
            <span>THC: {product.cannabisInfo.cannabinoids.thc.percentage}%</span>
            <span>•</span>
            <span>{product.cannabisInfo.strain.type}</span>
          </div>

          {/* Price */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold">
              {formatCurrency(price)}
            </span>
            {isOnSale && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(variant.pricing.basePrice)}
              </span>
            )}
          </div>
        </CardContent>

        {/* Actions */}
        <CardFooter className="p-4 pt-0">
          <div className="flex w-full gap-2">
            <Button
              className="flex-1"
              onClick={handleAddToCart}
              disabled={variant.inventory.available === 0}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {variant.inventory.available === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>

            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Link>
    </Card>

);
}

3. Compound Components

// components/common/ProductFilters.tsx
import { useState } from 'react';
import {
Accordion,
AccordionContent,
AccordionItem,
AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface ProductFiltersProps {
filters: {
categories: string[];
priceRange: [number, number];
thcRange: [number, number];
strainTypes: string[];
};
onChange: (filters: any) => void;
}

export default function ProductFilters({ filters, onChange }: ProductFiltersProps) {
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
const [thcRange, setThcRange] = useState<[number, number]>([0, 35]);
const [selectedStrainTypes, setSelectedStrainTypes] = useState<string[]>([]);

const handleApply = () => {
onChange({
categories: selectedCategories,
priceRange,
thcRange,
strainTypes: selectedStrainTypes,
});
};

const handleReset = () => {
setSelectedCategories([]);
setPriceRange([0, 200]);
setThcRange([0, 35]);
setSelectedStrainTypes([]);
onChange({});
};

return (

<div className="space-y-4">
<div className="flex items-center justify-between">
<h3 className="font-semibold">Filters</h3>
<Button variant="ghost" size="sm" onClick={handleReset}>
Reset
</Button>
</div>

      <Accordion type="multiple" defaultValue={['category', 'price', 'thc']}>
        {/* Category Filter */}
        <AccordionItem value="category">
          <AccordionTrigger>Category</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {filters.categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked) => {
                      setSelectedCategories(
                        checked
                          ? [...selectedCategories, category]
                          : selectedCategories.filter((c) => c !== category)
                      );
                    }}
                  />
                  <Label htmlFor={category} className="cursor-pointer capitalize">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range Filter */}
        <AccordionItem value="price">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider
                min={0}
                max={200}
                step={5}
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* THC Range Filter */}
        <AccordionItem value="thc">
          <AccordionTrigger>THC %</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider
                min={0}
                max={35}
                step={1}
                value={thcRange}
                onValueChange={(value) => setThcRange(value as [number, number])}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{thcRange[0]}%</span>
                <span>{thcRange[1]}%</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Strain Type Filter */}
        <AccordionItem value="strain">
          <AccordionTrigger>Strain Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {filters.strainTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={selectedStrainTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      setSelectedStrainTypes(
                        checked
                          ? [...selectedStrainTypes, type]
                          : selectedStrainTypes.filter((t) => t !== type)
                      );
                    }}
                  />
                  <Label htmlFor={type} className="cursor-pointer capitalize">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button className="w-full" onClick={handleApply}>
        Apply Filters
      </Button>
    </div>

);
}

4. Custom Hooks

// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
const [debouncedValue, setDebouncedValue] = useState<T>(value);

useEffect(() => {
const handler = setTimeout(() => {
setDebouncedValue(value);
}, delay);

    return () => {
      clearTimeout(handler);
    };

}, [value, delay]);

return debouncedValue;
}

// hooks/useMediaQuery.ts
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
const [matches, setMatches] = useState(false);

useEffect(() => {
const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);

}, [matches, query]);

return matches;
}

// Usage
const isMobile = useMediaQuery('(max-width: 768px)');

// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
key: string,
initialValue: T
): [T, (value: T) => void] {
const [storedValue, setStoredValue] = useState<T>(() => {
try {
const item = window.localStorage.getItem(key);
return item ? JSON.parse(item) : initialValue;
} catch (error) {
console.error(error);
return initialValue;
}
});

const setValue = (value: T) => {
try {
setStoredValue(value);
window.localStorage.setItem(key, JSON.stringify(value));
} catch (error) {
console.error(error);
}
};

return [storedValue, setValue];
}

// hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver(
options: IntersectionObserverInit = {}
) {
const [isIntersecting, setIsIntersecting] = useState(false);
const ref = useRef<HTMLDivElement>(null);

useEffect(() => {
if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };

}, [options]);

return { ref, isIntersecting };
}

// Usage: Infinite scroll
function ProductList() {
const { ref, isIntersecting } = useIntersectionObserver({
threshold: 0.5,
});

const { data, fetchNextPage, hasNextPage } = useInfiniteProducts();

useEffect(() => {
if (isIntersecting && hasNextPage) {
fetchNextPage();
}
}, [isIntersecting, hasNextPage, fetchNextPage]);

return (

<div>
{/_ Product list _/}
<div ref={ref} />
</div>
);
}

---

API Integration Layer

TanStack Query Setup

Query Client Configuration

// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
defaultOptions: {
queries: {
staleTime: 1000 _ 60 _ 5, // 5 minutes
gcTime: 1000 _ 60 _ 30, // 30 minutes (formerly cacheTime)
retry: 1,
refetchOnWindowFocus: false,
},
mutations: {
retry: 0,
},
},
});

// main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
<QueryClientProvider client={queryClient}>
<App />
<ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
</React.StrictMode>
);

Axios API Client

// lib/api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.cannasaas.com/v1';

export const apiClient = axios.create({
baseURL: API_BASE_URL,
headers: {
'Content-Type': 'application/json',
},
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
(config) => {
const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;

},
(error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
(response) => response,
async (error) => {
const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Call refresh endpoint
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        // Update tokens
        useAuthStore.getState().setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);

}
);

API Service Layer

// lib/api/services/products.ts
import { apiClient } from '../client';
import type { Product, ProductFilters, PaginatedResponse } from '@/types';

export const productsService = {
getProducts: async (filters?: ProductFilters, page = 1, limit = 20) => {
const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', {
params: { ...filters, page, limit },
});
return data;
},

getProduct: async (slugOrId: string) => {
const { data } = await apiClient.get<{ data: Product }>(`/products/${slugOrId}`);
return data.data;
},

searchProducts: async (query: string) => {
const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', {
params: { search: query },
});
return data;
},

createProduct: async (product: Partial<Product>) => {
const { data } = await apiClient.post<{ data: Product }>('/products', product);
return data.data;
},

updateProduct: async (id: string, updates: Partial<Product>) => {
const { data} = await apiClient.put<{ data: Product }>(`/products/${id}`, updates);
return data.data;
},

deleteProduct: async (id: string) => {
await apiClient.delete(`/products/${id}`);
},
};

React Query Hooks

// lib/api/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { productsService } from '../services/products';
import type { ProductFilters } from '@/types';

// Get paginated products
export function useProducts(filters?: ProductFilters, page = 1, limit = 20) {
return useQuery({
queryKey: ['products', filters, page, limit],
queryFn: () => productsService.getProducts(filters, page, limit),
});
}

// Infinite scroll products
export function useInfiniteProducts(filters?: ProductFilters) {
return useInfiniteQuery({
queryKey: ['products', 'infinite', filters],
queryFn: ({ pageParam = 1 }) => productsService.getProducts(filters, pageParam, 20),
getNextPageParam: (lastPage) => {
if (lastPage.pagination.page < lastPage.pagination.totalPages) {
return lastPage.pagination.page + 1;
}
return undefined;
},
initialPageParam: 1,
});
}

// Get single product
export function useProduct(slugOrId: string) {
return useQuery({
queryKey: ['product', slugOrId],
queryFn: () => productsService.getProduct(slugOrId),
enabled: !!slugOrId,
});
}

// Search products with debounce
export function useProductSearch(query: string) {
return useQuery({
queryKey: ['products', 'search', query],
queryFn: () => productsService.searchProducts(query),
enabled: query.length >= 3,
});
}

// Create product mutation
export function useCreateProduct() {
const queryClient = useQueryClient();

return useMutation({
mutationFn: productsService.createProduct,
onSuccess: () => {
queryClient.invalidateQueries({ queryKey: ['products'] });
},
});
}

// Update product mutation
export function useUpdateProduct() {
const queryClient = useQueryClient();

return useMutation({
mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
productsService.updateProduct(id, updates),
onSuccess: (data) => {
queryClient.invalidateQueries({ queryKey: ['products'] });
queryClient.setQueryData(['product', data._id], data);
},
});
}

// Delete product mutation
export function useDeleteProduct() {
const queryClient = useQueryClient();

return useMutation({
mutationFn: productsService.deleteProduct,
onSuccess: () => {
queryClient.invalidateQueries({ queryKey: ['products'] });
},
});
}

Optimistic Updates Example

// lib/api/hooks/useCart.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart';
import { useCartStore } from '@/stores/cartStore';

export function useAddToCart() {
const queryClient = useQueryClient();
const addItem = useCartStore((state) => state.addItem);

return useMutation({
mutationFn: cartService.addItem,

    // Optimistic update
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart'] });

      // Snapshot previous value
      const previousCart = queryClient.getQueryData(['cart']);

      // Optimistically update to the new value
      addItem(newItem.product, newItem.variant, newItem.quantity);

      // Return context with snapshot
      return { previousCart };
    },

    // If mutation fails, use context to roll back
    onError: (err, newItem, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },

});
}

---

Due to character limits, I'll continue in the next part. Let me create this file and continue with the rest of the sections.

Authentication & Authorization

Auth Flow

// hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/lib/api/services/auth';
import toast from 'react-hot-toast';

export function useLogin() {
const navigate = useNavigate();
const login = useAuthStore((state) => state.login);

return useMutation({
mutationFn: authService.login,
onSuccess: (data) => {
login(data.user, data.tokens);
toast.success('Welcome back!');
navigate('/');
},
onError: (error: any) => {
toast.error(error.response?.data?.message || 'Login failed');
},
});
}

export function useRegister() {
const navigate = useNavigate();
const login = useAuthStore((state) => state.login);

return useMutation({
mutationFn: authService.register,
onSuccess: (data) => {
login(data.user, data.tokens);
toast.success('Account created successfully!');
navigate('/');
},
onError: (error: any) => {
toast.error(error.response?.data?.message || 'Registration failed');
},
});
}

export function useLogout() {
const navigate = useNavigate();
const logout = useAuthStore((state) => state.logout);

return useMutation({
mutationFn: authService.logout,
onSuccess: () => {
logout();
navigate('/login');
toast.success('Logged out successfully');
},
});
}

Login Form Component

// pages/auth/Login.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import \* as z from 'zod';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useLogin } from '@/hooks/useAuth';

const loginSchema = z.object({
email: z.string().email('Invalid email address'),
password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
const { mutate: login, isPending } = useLogin();

const {
register,
handleSubmit,
formState: { errors },
} = useForm<LoginFormData>({
resolver: zodResolver(loginSchema),
});

const onSubmit = (data: LoginFormData) => {
login(data);
};

return (

<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
<Card className="w-full max-w-md">
<CardHeader>
<CardTitle>Sign In</CardTitle>
<CardDescription>
Enter your email and password to access your account
</CardDescription>
</CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Signing in...' : 'Sign In'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>

);
}

---

Theming & Branding System

Dynamic Theme Application

// components/providers/ThemeProvider.tsx
import { useEffect } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useThemeStore } from '@/stores/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
const organization = useOrganizationStore((state) => state.organization);
const mode = useThemeStore((state) => state.mode);

useEffect(() => {
if (!organization?.branding) return;

    const { colors, fonts, customCSS } = organization.branding;

    // Apply color scheme
    if (colors) {
      const root = document.documentElement;

      // Convert hex to HSL for Tailwind CSS variables
      if (colors.primary) {
        const hsl = hexToHSL(colors.primary);
        root.style.setProperty('--primary', hsl);
      }

      if (colors.secondary) {
        const hsl = hexToHSL(colors.secondary);
        root.style.setProperty('--secondary', hsl);
      }

      if (colors.accent) {
        const hsl = hexToHSL(colors.accent);
        root.style.setProperty('--accent', hsl);
      }
    }

    // Apply fonts
    if (fonts) {
      const root = document.documentElement;

      if (fonts.heading) {
        root.style.setProperty('--font-heading', fonts.heading);
      }

      if (fonts.body) {
        root.style.setProperty('--font-body', fonts.body);
      }
    }

    // Inject custom CSS
    if (customCSS) {
      const styleId = 'custom-org-styles';
      let styleEl = document.getElementById(styleId);

      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      styleEl.innerHTML = customCSS;
    }

    // Update favicon
    if (organization.branding.logo?.favicon) {
      const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (link) {
        link.href = organization.branding.logo.favicon;
      }
    }

    // Update document title
    document.title = organization.name || 'Cannabis Dispensary';

}, [organization]);

// Apply dark/light mode
useEffect(() => {
const root = document.documentElement;

    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

}, [mode]);

return <>{children}</>;
}

// Utility function to convert hex to HSL
function hexToHSL(hex: string): string {
// Remove # if present
hex = hex.replace('#', '');

// Convert hex to RGB
const r = parseInt(hex.substring(0, 2), 16) / 255;
const g = parseInt(hex.substring(2, 4), 16) / 255;
const b = parseInt(hex.substring(4, 6), 16) / 255;

const max = Math.max(r, g, b);
const min = Math.min(r, g, b);
let h = 0;
let s = 0;
const l = (max + min) / 2;

if (max !== min) {
const d = max - min;
s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }

}

h = Math.round(h _ 360);
s = Math.round(s _ 100);
const lightness = Math.round(l \* 100);

return `${h} ${s}% ${lightness}%`;
}

Tailwind Configuration

// tailwind.config.js
/** @type {import('tailwindcss').Config} \*/
export default {
darkMode: ['class'],
content: [
'./pages/**/_.{ts,tsx}',
'./components/\*\*/_.{ts,tsx}',
'./app/**/\*.{ts,tsx}',
'./src/**/\*.{ts,tsx}',
],
theme: {
container: {
center: true,
padding: '2rem',
screens: {
'2xl': '1400px',
},
},
extend: {
colors: {
border: 'hsl(var(--border))',
input: 'hsl(var(--input))',
ring: 'hsl(var(--ring))',
background: 'hsl(var(--background))',
foreground: 'hsl(var(--foreground))',
primary: {
DEFAULT: 'hsl(var(--primary))',
foreground: 'hsl(var(--primary-foreground))',
},
secondary: {
DEFAULT: 'hsl(var(--secondary))',
foreground: 'hsl(var(--secondary-foreground))',
},
destructive: {
DEFAULT: 'hsl(var(--destructive))',
foreground: 'hsl(var(--destructive-foreground))',
},
muted: {
DEFAULT: 'hsl(var(--muted))',
foreground: 'hsl(var(--muted-foreground))',
},
accent: {
DEFAULT: 'hsl(var(--accent))',
foreground: 'hsl(var(--accent-foreground))',
},
popover: {
DEFAULT: 'hsl(var(--popover))',
foreground: 'hsl(var(--popover-foreground))',
},
card: {
DEFAULT: 'hsl(var(--card))',
foreground: 'hsl(var(--card-foreground))',
},
},
borderRadius: {
lg: 'var(--radius)',
md: 'calc(var(--radius) - 2px)',
sm: 'calc(var(--radius) - 4px)',
},
fontFamily: {
heading: 'var(--font-heading)',
body: 'var(--font-body)',
},
keyframes: {
'accordion-down': {
from: { height: 0 },
to: { height: 'var(--radix-accordion-content-height)' },
},
'accordion-up': {
from: { height: 'var(--radix-accordion-content-height)' },
to: { height: 0 },
},
},
animation: {
'accordion-down': 'accordion-down 0.2s ease-out',
'accordion-up': 'accordion-up 0.2s ease-out',
},
},
},
plugins: [require('tailwindcss-animate')],
};

---

Performance Optimization

Code Splitting

// Lazy load routes
const HomePage = lazy(() => import('@/pages/storefront/Home'));
const ProductsPage = lazy(() => import('@/pages/storefront/Products'));

// Lazy load heavy components
const ProductReviewsSection = lazy(() => import('@/components/ProductReviews'));

function ProductDetailPage() {
return (

<div>
{/_ Main content _/}
<ProductInfo />

      {/* Lazy load reviews section */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviewsSection productId={productId} />
      </Suspense>
    </div>

);
}

Image Optimization

// components/common/OptimizedImage.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
src: string;
alt: string;
width?: number;
height?: number;
aspectRatio?: string;
}

export function OptimizedImage({
src,
alt,
width,
height,
aspectRatio,
className,
...props
}: OptimizedImageProps) {
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(false);

// Generate srcset for responsive images
const srcset = `     ${src}?w=400 400w,
    ${src}?w=800 800w,
    ${src}?w=1200 1200w
  `;

return (

<div className={cn('relative overflow-hidden', className)} style={{ aspectRatio }}>
{isLoading && (
<div className="absolute inset-0 animate-pulse bg-gray-200" />
)}

      {error ? (
        <div className="flex h-full items-center justify-center bg-gray-100">
          <span className="text-sm text-gray-400">Failed to load image</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          srcSet={srcset}
          sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          {...props}
        />
      )}
    </div>

);
}

Virtual Scrolling for Large Lists

// components/common/VirtualProductList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '@/types';

interface VirtualProductListProps {
products: Product[];
}

export function VirtualProductList({ products }: VirtualProductListProps) {
const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
count: products.length,
getScrollElement: () => parentRef.current,
estimateSize: () => 400, // Estimated height of each item
overscan: 5,
});

return (

<div ref={parentRef} className="h-screen overflow-auto">
<div
style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }} >
{virtualizer.getVirtualItems().map((virtualItem) => {
const product = products[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ProductCard product={product} />
            </div>
          );
        })}
      </div>
    </div>

);
}

Memoization

// Use React.memo for expensive components
import { memo } from 'react';

const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
// Component implementation
}, (prevProps, nextProps) => {
// Custom comparison function
return prevProps.product.\_id === nextProps.product.\_id;
});

// Use useMemo for expensive calculations
import { useMemo } from 'react';

function ProductList({ products, filters }: Props) {
const filteredProducts = useMemo(() => {
return products.filter(product => {
if (filters.category && product.category !== filters.category) {
return false;
}
if (filters.minPrice && product.price < filters.minPrice) {
return false;
}
return true;
});
}, [products, filters]);

return (

<div>
{filteredProducts.map(product => (
<ProductCard key={product._id} product={product} />
))}
</div>
);
}

// Use useCallback for functions passed as props
import { useCallback } from 'react';

function ProductsPage() {
const handleAddToCart = useCallback((product: Product) => {
// Add to cart logic
}, []);

return (

<div>
{products.map(product => (
<ProductCard
          key={product._id}
          product={product}
          onAddToCart={handleAddToCart}
        />
))}
</div>
);
}

---

Testing Strategy

Vitest Configuration

// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
plugins: [react()],
test: {
globals: true,
environment: 'jsdom',
setupFiles: ['./src/test/setup.ts'],
coverage: {
reporter: ['text', 'json', 'html'],
exclude: [
'node_modules/',
'src/test/',
],
},
},
resolve: {
alias: {
'@': path.resolve(\_\_dirname, './src'),
},
},
});

// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
cleanup();
});

Component Testing

// components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
it('renders correctly', () => {
render(<Button>Click me</Button>);
expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
});

it('handles click events', () => {
const handleClick = vi.fn();
render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);

});

it('can be disabled', () => {
render(<Button disabled>Click me</Button>);
expect(screen.getByRole('button')).toBeDisabled();
});

it('applies variant styles', () => {
const { container } = render(<Button variant="destructive">Delete</Button>);
expect(container.firstChild).toHaveClass('bg-destructive');
});
});

Hook Testing

// hooks/useCart.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/stores/cartStore';

describe('useCartStore', () => {
beforeEach(() => {
// Reset store before each test
useCartStore.setState({ items: [] });
});

it('adds item to cart', () => {
const { result } = renderHook(() => useCartStore());

    const mockProduct = {
      _id: 'prod_1',
      name: 'Test Product',
      // ... other product fields
    };

    const mockVariant = {
      _id: 'var_1',
      pricing: { basePrice: 29.99 },
      // ... other variant fields
    };

    act(() => {
      result.current.addItem(mockProduct, mockVariant, 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.itemCount).toBe(2);

});

it('updates quantity', () => {
const { result } = renderHook(() => useCartStore());

    // Add item first
    act(() => {
      result.current.addItem(mockProduct, mockVariant, 1);
    });

    const itemId = result.current.items[0].id;

    // Update quantity
    act(() => {
      result.current.updateQuantity(itemId, 5);
    });

    expect(result.current.items[0].quantity).toBe(5);

});

it('calculates subtotal correctly', () => {
const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockProduct, mockVariant, 2);
    });

    expect(result.current.subtotal).toBe(59.98); // 2 * 29.99

});
});

Integration Testing

// pages/Products.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ProductsPage from './Products';
import \* as productsApi from '@/lib/api/hooks/useProducts';

// Mock API
vi.mock('@/lib/api/hooks/useProducts');

const queryClient = new QueryClient({
defaultOptions: {
queries: { retry: false },
},
});

function renderWithProviders(ui: React.ReactElement) {
return render(
<QueryClientProvider client={queryClient}>
<BrowserRouter>
{ui}
</BrowserRouter>
</QueryClientProvider>
);
}

describe('ProductsPage', () => {
it('displays loading state', () => {
vi.spyOn(productsApi, 'useProducts').mockReturnValue({
data: undefined,
isLoading: true,
error: null,
} as any);

    renderWithProviders(<ProductsPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

});

it('displays products when loaded', async () => {
const mockProducts = [
{
_id: 'prod_1',
name: 'Blue Dream',
slug: 'blue-dream',
// ... other fields
},
{
_id: 'prod_2',
name: 'Green Crack',
slug: 'green-crack',
// ... other fields
},
];

    vi.spyOn(productsApi, 'useProducts').mockReturnValue({
      data: { data: mockProducts, pagination: { total: 2 } },
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByText('Blue Dream')).toBeInTheDocument();
      expect(screen.getByText('Green Crack')).toBeInTheDocument();
    });

});

it('displays error state', async () => {
vi.spyOn(productsApi, 'useProducts').mockReturnValue({
data: undefined,
isLoading: false,
error: new Error('Failed to fetch'),
} as any);

    renderWithProviders(<ProductsPage />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();

});
});

---

Build & Deployment

Vite Configuration

// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
plugins: [react()],
resolve: {
alias: {
'@': path.resolve(\_\_dirname, './src'),
},
},
build: {
sourcemap: true,
rollupOptions: {
output: {
manualChunks: {
'react-vendor': ['react', 'react-dom', 'react-router-dom'],
'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
'query-vendor': ['@tanstack/react-query'],
},
},
},
},
server: {
port: 3000,
proxy: {
'/api': {
target: 'http://localhost:5000',
changeOrigin: true,
},
},
},
});

Environment Variables

.env.example
VITE*API_BASE_URL=https://api.cannasaas.com/v1
VITE_STRIPE_PUBLIC_KEY=pk_test*...
VITE_GOOGLE_MAPS_API_KEY=AIza...
VITE_SENTRY_DSN=https://...

Docker Configuration

Dockerfile
Copy package files
Install dependencies
Copy source
Build
Production image
Copy built assets
Copy nginx config
FROM node:20-alpine AS builder

WORKDIR /app

COPY package\*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

CI/CD Pipeline (GitHub Actions)

.github/workflows/deploy.yml
name: Deploy to Production

on:
push:
branches: [main]

jobs:
build-and-deploy:
runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          VITE_STRIPE_PUBLIC_KEY: ${{ secrets.STRIPE_PUBLIC_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

---

Additional Code Examples

Complete Page Example: Products Page

// pages/storefront/Products.tsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@/lib/api/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import ProductCard from '@/components/storefront/ProductCard';
import ProductFilters from '@/components/common/ProductFilters';
import SearchBar from '@/components/common/SearchBar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select';

export default function ProductsPage() {
const [searchParams, setSearchParams] = useSearchParams();
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 500);

// Get filters from URL
const filters = {
category: searchParams.get('category') || undefined,
minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
minThc: searchParams.get('minThc') ? Number(searchParams.get('minThc')) : undefined,
strainType: searchParams.get('strainType') || undefined,
search: debouncedSearch || undefined,
};

const page = Number(searchParams.get('page')) || 1;
const sort = searchParams.get('sort') || 'popularity';

const { data, isLoading, error } = useProducts({ ...filters, sort }, page, 20);

const handleFilterChange = (newFilters: any) => {
const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, String(value));
      }
    });

    setSearchParams(params);

};

const handleSortChange = (value: string) => {
searchParams.set('sort', value);
setSearchParams(searchParams);
};

const handlePageChange = (newPage: number) => {
searchParams.set('page', String(newPage));
setSearchParams(searchParams);
window.scrollTo({ top: 0, behavior: 'smooth' });
};

if (error) {
return (

<div className="container py-8">
<div className="text-center">
<h2 className="text-2xl font-bold text-destructive">Error loading products</h2>
<p className="mt-2 text-muted-foreground">Please try again later</p>
</div>
</div>
);
}

return (

<div className="container py-8">
{/_ Header _/}
<div className="mb-8">
<h1 className="text-3xl font-bold">Shop Products</h1>
<p className="mt-2 text-muted-foreground">
Browse our selection of premium cannabis products
</p>
</div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search products..."
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block">
          <ProductFilters filters={data?.filters || {}} onChange={handleFilterChange} />
        </aside>

        {/* Products Grid */}
        <div>
          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data?.pagination.total || 0} products found
            </p>

            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="name_asc">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          ) : data?.data.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data?.data.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>

              {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show first, last, current, and adjacent pages
                  return (
                    p === 1 ||
                    p === data.pagination.totalPages ||
                    Math.abs(p - page) <= 1
                  );
                })
                .map((p, i, arr) => {
                  // Show ellipsis if there's a gap
                  const prevPage = arr[i - 1];
                  const showEllipsis = prevPage && p - prevPage > 1;

                  return (
                    <div key={p} className="flex gap-2">
                      {showEllipsis && <span className="px-2">...</span>}
                      <Button
                        variant={p === page ? 'default' : 'outline'}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </Button>
                    </div>
                  );
                })}

              <Button
                variant="outline"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === data.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>

);
}

Complete Form Example: Checkout Form

// components/checkout/CheckoutForm.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import \* as z from 'zod';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useCreateOrder } from '@/lib/api/hooks/useOrders';
import toast from 'react-hot-toast';

const checkoutSchema = z.object({
fulfillmentMethod: z.enum(['delivery', 'pickup']),

// Delivery fields
addressId: z.string().optional(),
deliveryInstructions: z.string().optional(),

// Pickup fields
pickupLocationId: z.string().optional(),

// Payment
paymentMethod: z.enum(['card', 'cash']),
savePaymentMethod: z.boolean().default(false),

// Optional
couponCode: z.string().optional(),
usePoints: z.number().min(0).optional(),
notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutForm() {
const stripe = useStripe();
const elements = useElements();
const items = useCartStore((state) => state.items);
const clearCart = useCartStore((state) => state.clearCart);
const user = useAuthStore((state) => state.user);
const { mutate: createOrder, isPending } = useCreateOrder();

const {
register,
handleSubmit,
watch,
control,
formState: { errors },
} = useForm<CheckoutFormData>({
resolver: zodResolver(checkoutSchema),
defaultValues: {
fulfillmentMethod: 'delivery',
paymentMethod: 'card',
savePaymentMethod: false,
usePoints: 0,
},
});

const fulfillmentMethod = watch('fulfillmentMethod');
const paymentMethod = watch('paymentMethod');

const onSubmit = async (data: CheckoutFormData) => {
try {
// Handle Stripe payment if card selected
let paymentMethodId: string | undefined;

      if (data.paymentMethod === 'card') {
        if (!stripe || !elements) {
          toast.error('Payment system not ready');
          return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          toast.error('Card element not found');
          return;
        }

        // Create payment method
        const { error, paymentMethod: pm } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: `${user?.profile.firstName} ${user?.profile.lastName}`,
            email: user?.email,
          },
        });

        if (error) {
          toast.error(error.message || 'Payment failed');
          return;
        }

        paymentMethodId = pm.id;
      }

      // Create order
      createOrder(
        {
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          fulfillment: {
            method: data.fulfillmentMethod,
            addressId: data.addressId,
            deliveryInstructions: data.deliveryInstructions,
            pickupLocationId: data.pickupLocationId,
          },
          payment: {
            method: data.paymentMethod,
            paymentMethodId,
            savePaymentMethod: data.savePaymentMethod,
          },
          couponCodes: data.couponCode ? [data.couponCode] : undefined,
          loyaltyPoints: data.usePoints,
          notes: {
            customer: data.notes,
          },
        },
        {
          onSuccess: (order) => {
            // Handle 3D Secure if needed
            if (order.paymentIntent?.clientSecret) {
              handlePaymentConfirmation(order.paymentIntent.clientSecret);
            } else {
              // Order complete
              clearCart();
              toast.success('Order placed successfully!');
              window.location.href = `/orders/${order.orderNumber}`;
            }
          },
          onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Order failed');
          },
        }
      );
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('An error occurred during checkout');
    }

};

const handlePaymentConfirmation = async (clientSecret: string) => {
if (!stripe) return;

    const { error } = await stripe.confirmCardPayment(clientSecret);

    if (error) {
      toast.error(error.message || 'Payment confirmation failed');
    } else {
      clearCart();
      toast.success('Order placed successfully!');
      window.location.href = '/account/orders';
    }

};

return (

<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
{/_ Fulfillment Method _/}
<div>
<Label className="text-base font-semibold">Fulfillment Method</Label>
<Controller
name="fulfillmentMethod"
control={control}
render={({ field }) => (
<RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-3 grid gap-4 sm:grid-cols-2"
            >
<Label
                htmlFor="delivery"
                className="flex cursor-pointer items-center space-x-3 rounded-lg border p-4"
              >
<RadioGroupItem value="delivery" id="delivery" />
<div>
<div className="font-medium">Delivery</div>
<div className="text-sm text-muted-foreground">
Get it delivered to your door
</div>
</div>
</Label>

              <Label
                htmlFor="pickup"
                className="flex cursor-pointer items-center space-x-3 rounded-lg border p-4"
              >
                <RadioGroupItem value="pickup" id="pickup" />
                <div>
                  <div className="font-medium">Pickup</div>
                  <div className="text-sm text-muted-foreground">
                    Pick up from store
                  </div>
                </div>
              </Label>
            </RadioGroup>
          )}
        />
      </div>

      {/* Delivery Address */}
      {fulfillmentMethod === 'delivery' && (
        <div className="space-y-4">
          <Label htmlFor="addressId">Delivery Address</Label>
          <select
            id="addressId"
            {...register('addressId')}
            className="w-full rounded-md border p-2"
          >
            <option value="">Select address</option>
            {user?.addresses.map((address) => (
              <option key={address._id} value={address._id}>
                {address.label} - {address.street}, {address.city}
              </option>
            ))}
          </select>
          {errors.addressId && (
            <p className="text-sm text-destructive">{errors.addressId.message}</p>
          )}

          <div>
            <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
            <Textarea
              id="deliveryInstructions"
              {...register('deliveryInstructions')}
              placeholder="e.g., Ring doorbell, leave at door"
            />
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div>
        <Label className="text-base font-semibold">Payment Method</Label>
        <Controller
          name="paymentMethod"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="mt-3 space-y-3"
            >
              <Label
                htmlFor="card"
                className="flex cursor-pointer items-center space-x-3 rounded-lg border p-4"
              >
                <RadioGroupItem value="card" id="card" />
                <div className="flex-1">
                  <div className="font-medium">Credit/Debit Card</div>
                </div>
              </Label>

              <Label
                htmlFor="cash"
                className="flex cursor-pointer items-center space-x-3 rounded-lg border p-4"
              >
                <RadioGroupItem value="cash" id="cash" />
                <div>
                  <div className="font-medium">Cash on Delivery</div>
                </div>
              </Label>
            </RadioGroup>
          )}
        />
      </div>

      {/* Card Element */}
      {paymentMethod === 'card' && (
        <div className="rounded-lg border p-4">
          <Label>Card Details</Label>
          <div className="mt-2">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? 'Processing...' : 'Place Order'}
      </Button>
    </form>

);
}

---

Conclusion

This React architecture provides:

· ✅ **Scalable Structure**: Monorepo setup for multiple apps
· ✅ **Type Safety**: Full TypeScript coverage
· ✅ **State Management**: Zustand for client state, TanStack Query for server state
· ✅ **Performance**: Code splitting, lazy loading, memoization
· ✅ **Developer Experience**: Hot reload, TypeScript, ESLint, Prettier
· ✅ **Testing**: Comprehensive testing with Vitest
· ✅ **Production Ready**: Optimized builds, Docker support, CI/CD

The architecture is designed to be:
· **Maintainable**: Clear separation of concerns
· **Testable**: Isolated components and hooks
· **Performant**: Optimized for production
· **Extensible**: Easy to add new features

Next Steps: 14. Set up the monorepo structure 15. Install dependencies 16. Configure Tailwind and shadcn/ui 17. Build out shared component library 18. Implement core pages (Products, Cart, Checkout) 19. Add authentication and routing 20. Integrate with backend API 21. Add testing 22. Deploy to production

This architecture will serve as the foundation for a professional, scalable cannabis e-commerce platform.

--- Project Overview

This document provides a complete implementation guide for building a multi-tenant, white-label cannabis dispensary e-commerce platform. The platform enables cannabis dispensaries to launch their own branded online stores with full e-commerce capabilities, inventory management, compliance tracking, and AI-powered features.

Core Value Proposition

· **For Dispensaries**: Turn-key online ordering with delivery/pickup, inventory management, compliance tools, and marketing automation
· **For Customers**: Easy browsing, secure ordering, loyalty rewards, subscriptions, and educational content
· **For Platform Owner**: Recurring SaaS revenue with scalable multi-tenant architecture

Technology Stack

Frontend
· **Framework**: React 18 with TypeScript
· **State Management**: Zustand
· **Styling**: Tailwind CSS + shadcn/ui
· **Build Tool**: Vite
· **Data Fetching**: TanStack Query

Backend
· **Runtime**: Node.js 20+ LTS
· **Framework**: Express.js with TypeScript
· **Database**: MongoDB Atlas
· **Cache**: Redis Cloud
· **Storage**: AWS S3 / Cloudflare R2
· **Search**: Elasticsearch (optional)

Infrastructure
· **Hosting**: AWS / Railway
· **CDN**: Cloudflare
· **Monitoring**: Sentry + DataDog
· **CI/CD**: GitHub Actions

Third-Party Services
· **Payments**: Stripe, Aeropay
· **Email**: SendGrid / Postmark
· **SMS**: Twilio
· **Maps**: Google Maps API
· **Compliance**: METRC, Veratad
· **AI**: OpenAI GPT-4
Revenue Model

Pricing Tiers

Starter - $199/month
· 1 location
· Up to 500 products
· Up to 100 orders/month
· Basic analytics
· Email support

Professional - $399/month (Most Popular)
· 3 locations
· Unlimited products
· Unlimited orders
· Advanced analytics
· Priority support
· Full AI suite
· Custom branding

Enterprise - $799/month
· Unlimited locations
· White-label
· Dedicated account manager
· Custom integrations
· SLA guarantees

Additional Revenue
· Transaction fees: 1-2% of GMV
· Premium AI features: $99/month
· SMS credits: $0.02 per SMS
· Advanced analytics: $149/month

Market Opportunity

· **Target Market**: Cannabis dispensaries in legal states
· **Market Size**: 10,000+ dispensaries in the US
· **TAM**: $200M+ annually
· **Current Solutions**: Outdated POS systems, limited online ordering
· **Competitive Advantage**: Modern UX, AI features, comprehensive platform

Timeline

· **Prototype**: 3 weeks
· **MVP**: 16 weeks (4 months)
· **Public Launch**: 28 weeks (7 months)
· **Year 1 Goal**: 100+ customers, $35K+ MRR

High-Level Architecture

┌─────────────────────────────────────────────────────────────────────┐
│ CDN Layer (Cloudflare) │
│ Static Assets, Images, Videos, Cache, DDoS │
└─────────────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────────────┐
│ WAF (Web Application Firewall) │
│ Bot Detection, Rate Limiting, SSL │
└─────────────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────────────┐
│ Load Balancer (AWS ALB/NLB) │
│ Health Checks, Auto-scaling, SSL │
└─────────────────────────────────────────────────────────────────────┘
↓
┌───────────────────────────┴───────────────────────────┐
↓ ↓
┌──────────────────┐ ┌──────────────────┐
│ Customer App │ │ Admin Portal │
│ (React/Next.js) │ │ (React/Next.js) │
│ │ │ │
│ - Storefront │ │ - Dashboard │
│ - Cart │ │ - Products │
│ - Checkout │ │ - Orders │
│ - Account │ │ - Customers │
│ - PWA │ │ - Analytics │
└──────────────────┘ └──────────────────┘
│ │
└───────────────────────────┬───────────────────────────┘
↓
┌──────────────────┐
│ API Gateway │
│ (Express.js) │
│ │
│ - Auth │
│ - Validation │
│ - Rate Limit │
│ - Logging │
│ - Monitoring │
└──────────────────┘
↓
┌─────────────────────────────────────────────────────────────────────┐
│ Microservices Layer │
└─────────────────────────────────────────────────────────────────────┘
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
↓ ↓ ↓ ↓ ↓ ↓ ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Auth │ │Product │ │ Order │ │ User │ │Payment │ │Delivery│
│Service │ │Service │ │Service │ │Service │ │Service │ │Service │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
│ │ │ │ │ │ │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
↓
┌─────────────────────────────────────────────────────────────────────┐
│ Data Layer │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────┬─────────────┬─────────────┬─────────────┐
↓ ↓ ↓ ↓ ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│MongoDB │ │ Redis │ │Postgres│ │ S3 │ │Elastic │
│ Atlas │ │ Cache │ │Analytics│ │ Storage│ │ Search │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Background Jobs & Workers │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────┬─────────────┬─────────────┬─────────────┐
↓ ↓ ↓ ↓ ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Email │ │ SMS │ │Inventory│ │Analytics│ │Compliance│
│ Worker │ │ Worker │ │ Monitor │ │ Worker │ │ Reporter │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ AI/ML Services │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────┬─────────────┬─────────────┬─────────────┐
↓ ↓ ↓ ↓ ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│OpenAI │ │Recommend│ │Forecast│ │Chatbot │ │Sentiment│
│GPT-4 │ │ Engine │ │ Model │ │Service │ │Analysis │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ External Integrations │
└─────────────────────────────────────────────────────────────────────┘
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
↓ ↓ ↓ ↓ ↓ ↓ ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Stripe │ │Twilio │ │SendGrid│ │ METRC │ │Veratad │ │ Maps │
│Payment │ │ SMS │ │ Email │ │ State │ │Age Ver │ │Routing │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘

Multi-Tenancy Architecture

Tenant Isolation Strategy

Database Design: Single database with tenant ID on all records

Advantages:
· Simpler deployment and maintenance
· Cost-effective for small to medium scale
· Easier cross-tenant analytics
· Simpler backup and recovery

Implementation:
// Every query must include organizationId
const products = await Product.find({ organizationId: req.organization.\_id });

// Mongoose middleware enforces this
schema.pre(/^find/, function() {
if (!this.getQuery().organizationId) {
throw new Error('organizationId required for tenant isolation');
}
});

Subdomain Routing

// middleware/tenant.js
export const identifyTenant = async (req, res, next) => {
// Extract subdomain or custom domain
const hostname = req.hostname; // e.g., greenleaf.cannasaas.com
const subdomain = hostname.split('.')[0];

const org = await Organization.findOne({
$or: [
{ slug: subdomain },
{ customDomain: hostname }
]
});

if (!org) {
return res.status(404).json({ error: 'Store not found' });
}

req.organizationId = org.\_id;
req.organization = org;
next();
};

Dynamic Branding

Each organization can customize:
· Logo (light/dark variants)
· Colors (primary, secondary, accent)
· Fonts (heading, body)
· Custom CSS
· Custom JavaScript
· Favicon

// Frontend applies branding dynamically
useEffect(() => {
if (organization?.branding) {
document.documentElement.style.setProperty(
'--primary-color',
organization.branding.colors.primary
);

    // Update favicon
    const link = document.querySelector("link[rel='icon']");
    link.href = organization.branding.logo.favicon;

}
}, [organization]);

---

MongoDB Collections

Organizations Collection

{
\_id: ObjectId,
name: "Green Leaf Dispensary",
slug: "green-leaf", // URL identifier
legalName: "Green Leaf LLC",

// Domains
subdomain: "greenleaf", // greenleaf.cannasaas.com
customDomain: "greenleaf.com",
domainVerified: true,

// Branding & Theming
branding: {
logo: {
light: "https://cdn.../logo-light.png",
dark: "https://cdn.../logo-dark.png",
favicon: "https://cdn.../favicon.ico"
},
colors: {
primary: "#10b981",
secondary: "#064e3b",
accent: "#fbbf24",
background: "#ffffff",
text: "#1f2937"
},
fonts: {
heading: "Montserrat",
body: "Inter"
},
customCSS: "/_ Custom styles _/",
customJS: "/_ Custom scripts _/"
},

// Business Information
businessInfo: {
licenseNumber: "C11-0000123-LIC",
licenseType: "adult-use", // adult-use, medical, both
licenseExpiry: ISODate,
taxId: "12-3456789",
email: "contact@greenleaf.com",
phone: "+1234567890",
website: "https://greenleaf.com",

    // Locations (can have multiple)
    locations: [{
      _id: ObjectId,
      name: "Main Store",
      type: "retail", // retail, warehouse, corporate
      isDefault: true,

      address: {
        street: "123 Main St",
        unit: "Suite 100",
        city: "Denver",
        state: "CO",
        zip: "80202",
        country: "US",
        coordinates: {
          lat: 39.7392,
          lng: -104.9903
        }
      },

      contact: {
        phone: "+1234567890",
        email: "store@greenleaf.com"
      },

      hours: {
        monday: { open: "09:00", close: "21:00", closed: false },
        tuesday: { open: "09:00", close: "21:00", closed: false },
        wednesday: { open: "09:00", close: "21:00", closed: false },
        thursday: { open: "09:00", close: "21:00", closed: false },
        friday: { open: "09:00", close: "22:00", closed: false },
        saturday: { open: "10:00", close: "22:00", closed: false },
        sunday: { open: "10:00", close: "20:00", closed: false }
      },

      specialHours: [{
        date: ISODate,
        open: "10:00",
        close: "18:00",
        reason: "New Year's Day"
      }],

      capabilities: {
        delivery: true,
        pickup: true,
        inStore: true,
        curbside: true
      },

      deliveryZones: [{
        name: "Zone 1",
        radius: 5, // miles
        fee: 5.00,
        minimumOrder: 20.00,
        estimatedTime: 30 // minutes
      }]
    }]

},

// Subscription & Billing
subscription: {
plan: "professional", // starter, professional, enterprise
status: "active", // trial, active, past_due, suspended, cancelled
billingCycle: "monthly",
trialEndsAt: ISODate,
currentPeriodStart: ISODate,
currentPeriodEnd: ISODate,
cancelAtPeriodEnd: false,

    stripeCustomerId: "cus_...",
    stripeSubscriptionId: "sub_...",

    limits: {
      locations: 3,
      products: null, // unlimited
      orders: null,
      users: 25,
      storage: 10000, // MB
      apiCalls: 100000
    },

    addons: [{
      type: "advanced_analytics",
      price: 149.00,
      active: true
    }]

},

// Feature Flags
features: {
multiLocation: true,
subscriptionOrders: true,
loyaltyProgram: true,
giftCards: true,
bundles: true,
delivery: true,
pickup: true,
medical: true,
recreational: true,
aiRecommendations: true,
aiChatbot: true,
apiAccess: true
},

// Settings
settings: {
currency: "USD",
timezone: "America/Denver",
locale: "en-US",

    taxRates: [{
      name: "State Cannabis Tax",
      rate: 0.15,
      applyTo: "all"
    }],

    orderSettings: {
      minOrderAmount: 10.00,
      maxOrderAmount: 500.00,
      deliveryFee: 5.00,
      freeDeliveryThreshold: 50.00
    },

    ageVerification: {
      required: true,
      minimumAge: 21,
      provider: "veratad"
    },

    purchaseLimits: {
      dailyLimit: 28.0, // grams
      perTransactionLimit: 28.0
    }

},

// Integrations
integrations: {
stripe: {
enabled: true,
publishableKey: "pk*...",
secretKey: "sk*...", // Encrypted
webhookSecret: "whsec\_..."
},

    sendgrid: {
      enabled: true,
      apiKey: "...", // Encrypted
      fromEmail: "noreply@greenleaf.com"
    },

    twilio: {
      enabled: true,
      accountSid: "...",
      authToken: "...", // Encrypted
      phoneNumber: "+1234567890"
    },

    metrc: {
      enabled: true,
      licenseNumber: "...",
      apiKey: "...", // Encrypted
      state: "CO"
    }

},

// Analytics
analytics: {
totalRevenue: 125000.00,
totalOrders: 4567,
totalCustomers: 1234,
averageOrderValue: 65.50,
lastCalculated: ISODate
},

createdAt: ISODate,
updatedAt: ISODate,
deletedAt: null
}

Users Collection

{
\_id: ObjectId,
organizationId: ObjectId,

// Authentication
email: "user@example.com",
emailVerified: true,
phone: "+1234567890",
phoneVerified: true,
passwordHash: "...", // bcrypt

// Profile
profile: {
firstName: "John",
lastName: "Doe",
displayName: "John D.",
avatar: "https://cdn.../avatar.jpg",
dateOfBirth: ISODate,

    medicalCard: {
      hasCard: true,
      number: "MED-12345",
      state: "CO",
      expirationDate: ISODate,
      verified: true,
      verifiedAt: ISODate,
      documentUrl: "https://secure.../card.pdf"
    }

},

// Role & Permissions
role: "customer", // customer, budtender, manager, admin, owner
permissions: ["view_products", "place_orders", "view_own_orders"],

// Addresses
addresses: [{
_id: ObjectId,
type: "home",
label: "Home",
street: "456 Oak Ave",
city: "Denver",
state: "CO",
zip: "80203",
isDefault: true,
deliveryInstructions: "Ring doorbell"
}],

// Preferences
preferences: {
communicationChannels: {
email: true,
sms: true,
push: false
},

    notifications: {
      orderUpdates: true,
      promotions: true,
      restockAlerts: true
    },

    favoriteProducts: [ObjectId, ObjectId],
    preferredCategories: ["flower", "edibles"]

},

// Loyalty Program
loyalty: {
enrolled: true,
points: 2500,
pointsLifetime: 5000,
tier: "gold", // bronze, silver, gold, platinum
tierSince: ISODate,
lifetimeSpent: 2500.00,
referralCode: "JOHN2024"
},

// Subscriptions
subscriptions: [{
\_id: ObjectId,
status: "active",
frequency: "weekly",
nextDelivery: ISODate,
products: [{
productId: ObjectId,
variantId: ObjectId,
quantity: 2
}]
}],

// Marketing
marketing: {
source: "google_ads",
segment: "vip",
cohort: "2024-01",
tags: ["high_value", "prefers_edibles"]
},

// Security
security: {
lastLogin: ISODate,
lastLoginIP: "192.168.1.1",
failedLoginAttempts: 0,
twoFactorEnabled: false,
ageVerified: true,
ageVerifiedAt: ISODate
},

createdAt: ISODate,
updatedAt: ISODate
}

Products Collection

{
\_id: ObjectId,
organizationId: ObjectId,

// Basic Info
name: "Blue Dream",
slug: "blue-dream",
sku: "BD-001",

description: {
short: "Sativa-dominant hybrid with uplifting effects",
long: "Blue Dream is a sativa-dominant hybrid...",
aiGenerated: "Experience the perfect balance..."
},

// Categorization
category: "flower",
subcategory: "sativa",
tags: ["energetic", "creative", "daytime"],

brand: {
name: "Top Shelf Cultivation",
logo: "https://cdn.../brand-logo.png"
},

// Cannabis-Specific
cannabisInfo: {
strain: {
name: "Blue Dream",
type: "sativa-dominant hybrid",
genetics: "Blueberry × Haze"
},

    cannabinoids: {
      thc: { percentage: 24.5, min: 22.0, max: 27.0 },
      cbd: { percentage: 0.8, min: 0.5, max: 1.2 }
    },

    terpenes: [
      { name: "Myrcene", percentage: 0.6 },
      { name: "Pinene", percentage: 0.4 },
      { name: "Caryophyllene", percentage: 0.3 }
    ],

    effects: {
      primary: ["uplifting", "creative", "energetic"],
      medical: ["stress", "depression", "pain"]
    },

    flavors: ["berry", "sweet", "herbal"],

    labTesting: {
      tested: true,
      labName: "SC Labs",
      batchNumber: "BD20240115",
      testDate: ISODate,
      coaUrl: "https://cdn.../lab-results.pdf"
    }

},

// Variants
variants: [{
\_id: ObjectId,
name: "1/8 oz (3.5g)",
sku: "BD-001-3.5",
weight: 3.5,
unit: "grams",

    pricing: {
      basePrice: 35.00,
      salePrice: 29.99,
      onSale: true,
      costPrice: 18.00,
      msrp: 40.00
    },

    inventory: {
      quantity: 50,
      reserved: 3,
      available: 47,
      lowStockThreshold: 10,
      reorderPoint: 5,
      reorderQuantity: 100
    },

    compliance: {
      metrcId: "1A4060300000000000012345",
      batchNumber: "BD20240115",
      harvestDate: ISODate,
      expirationDate: ISODate
    }

}],

// Media
media: {
images: [{
url: "https://cdn.../product-1.jpg",
alt: "Blue Dream flower",
isPrimary: true
}],
videos: [{
url: "https://cdn.../video.mp4",
thumbnail: "https://cdn.../thumb.jpg"
}]
},

// SEO
seo: {
metaTitle: "Blue Dream Sativa Flower | Green Leaf",
metaDescription: "Premium Blue Dream...",
keywords: ["blue dream", "sativa", "cannabis"]
},

// Reviews
reviews: {
count: 127,
averageRating: 4.7,
distribution: { 5: 85, 4: 30, 3: 8, 2: 3, 1: 1 }
},

// Status
status: "active",
featured: true,

// Analytics
analytics: {
views: 5420,
addToCartCount: 487,
purchaseCount: 312,
conversionRate: 0.0575,
revenueGenerated: 9360.00
},

createdAt: ISODate,
updatedAt: ISODate
}

Orders Collection

{
\_id: ObjectId,
organizationId: ObjectId,

orderNumber: "ORD-20240120-001",
displayId: "#1001",

// Customer
customerId: ObjectId,
customerInfo: {
email: "user@example.com",
phone: "+1234567890",
firstName: "John",
lastName: "Doe",
customerType: "recreational"
},

// Order Type
type: "delivery", // delivery, pickup, curbside
channel: "web",

// Items
items: [{
\_id: ObjectId,
productId: ObjectId,
variantId: ObjectId,

    snapshot: {
      name: "Blue Dream",
      sku: "BD-001-3.5",
      image: "https://cdn.../product.jpg",
      weight: 3.5,
      thcPercentage: 24.5
    },

    quantity: 2,
    pricePerUnit: 29.99,
    subtotal: 59.98,

    discounts: [{
      type: "coupon",
      code: "SUMMER20",
      amount: 6.00
    }],

    totalAfterDiscounts: 53.98,
    taxAmount: 8.10,
    total: 62.08

}],

// Pricing
pricing: {
subtotal: 59.98,
itemDiscounts: 6.00,
subtotalAfterDiscounts: 53.98,
tax: 8.10,
deliveryFee: 5.00,
tip: 5.00,
total: 72.08,

    costOfGoods: 36.00,
    grossProfit: 36.08,
    profitMargin: 0.50

},

// Payment
payment: {
method: "card",
status: "paid",
transactionId: "ch_abc123",
paidAt: ISODate,

    card: {
      brand: "visa",
      last4: "4242"
    }

},

// Fulfillment
fulfillment: {
method: "delivery",
status: "delivered",

    address: {
      street: "456 Oak Ave",
      city: "Denver",
      state: "CO",
      zip: "80203",
      deliveryInstructions: "Ring doorbell"
    },

    delivery: {
      driverId: ObjectId,
      driverName: "Mike Johnson",
      driverPhone: "+1234567890",

      tracking: {
        currentLocation: { lat: 39.7392, lng: -104.9903 },
        eta: ISODate
      },

      proof: {
        signature: "https://cdn.../signature.png",
        photo: "https://cdn.../delivery-photo.jpg",
        idVerified: true
      }
    },

    confirmedAt: ISODate,
    readyAt: ISODate,
    deliveredAt: ISODate

},

// Status History
status: "delivered",
statusHistory: [{
status: "pending",
timestamp: ISODate,
note: "Order placed"
}, {
status: "confirmed",
timestamp: ISODate,
note: "Confirmed by staff"
}, {
status: "delivered",
timestamp: ISODate,
note: "Delivered and signed"
}],

// Compliance
compliance: {
ageVerified: true,
verifiedBy: ObjectId,
verifiedAt: ISODate,
totalCannabisWeight: 7.0,

    metrc: {
      reported: true,
      manifestId: "MF-20240120-001"
    }

},

// Notifications
notifications: {
sent: [{
type: "order_confirmation",
channel: "email",
sentAt: ISODate,
status: "delivered"
}]
},

createdAt: ISODate,
updatedAt: ISODate
}

Coupons Collection

{
\_id: ObjectId,
organizationId: ObjectId,

code: "SUMMER20",
name: "Summer Sale 2024",
description: "Get 20% off all flower products",

discount: {
type: "percentage", // percentage, fixed_amount, free_shipping
value: 20,
maxDiscount: 50.00,
applyTo: "products",
specificCategories: ["flower"]
},

usage: {
maxUsesTotal: 1000,
maxUsesPerCustomer: 1,
currentUses: 247,
minimumPurchase: 50.00
},

validity: {
startDate: ISODate,
endDate: ISODate,
activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"]
},

status: "active",

analytics: {
totalUses: 247,
totalRevenue: 12500.00,
totalDiscount: 2500.00,
averageOrderValue: 50.61
},

createdAt: ISODate
}

Reviews Collection

{
\_id: ObjectId,
organizationId: ObjectId,
productId: ObjectId,
customerId: ObjectId,
orderId: ObjectId,

rating: 5,
title: "Best sativa I've tried!",
review: "This strain is absolutely amazing...",

detailedRatings: {
quality: 5,
value: 4,
effects: 5,
flavor: 5
},

feedback: {
effectsExperienced: ["uplifting", "creative", "focused"],
timeOfDayUsed: "afternoon",
consumptionMethod: "vaporizer"
},

media: [{
type: "image",
url: "https://cdn.../review-photo.jpg"
}],

// AI Analysis
ai: {
sentiment: "positive",
sentimentScore: 0.92,
keyPhrases: ["uplifting effects", "smooth flavor"],
isSpam: false,
authentic: true
},

moderation: {
status: "approved",
autoApproved: true
},

engagement: {
helpful: 24,
notHelpful: 1
},

response: {
responded: true,
responseText: "Thank you for the wonderful review!",
respondedBy: ObjectId,
respondedAt: ISODate
},

verifiedPurchase: true,
createdAt: ISODate
}

Loyalty Programs Collection

{
\_id: ObjectId,
organizationId: ObjectId,

name: "Green Rewards",
description: "Earn points on every purchase",
status: "active",

points: {
earningRules: [{
name: "Purchase Points",
type: "purchase",
pointsPerDollar: 1,

      multiplierTiers: [{
        tier: "gold",
        multiplier: 1.5
      }]
    }, {
      name: "Signup Bonus",
      type: "signup",
      points: 100
    }, {
      name: "Referral Bonus",
      type: "referral",
      points: 500
    }],

    redemptionRules: [{
      name: "Discount Redemption",
      type: "discount",
      pointsPerDollar: 100, // 100 points = $1
      minPoints: 100
    }],

    expiration: {
      enabled: true,
      expiryMonths: 12
    }

},

tiers: {
enabled: true,
levels: [{
name: "Bronze",
level: 1,
requirements: { minPoints: 0 },
benefits: { pointsMultiplier: 1.0 }
}, {
name: "Silver",
level: 2,
requirements: { minPoints: 1000, minSpend: 500.00 },
benefits: { pointsMultiplier: 1.25, earlyAccess: true }
}, {
name: "Gold",
level: 3,
requirements: { minPoints: 2500, minSpend: 1500.00 },
benefits: {
pointsMultiplier: 1.5,
freeShipping: true,
prioritySupport: true
}
}]
},

referral: {
enabled: true,
referrerReward: { type: "points", amount: 500 },
refereeReward: { type: "discount", amount: 10.00 }
},

analytics: {
totalMembers: 5420,
pointsIssued: 1250000,
pointsRedeemed: 450000,
redemptionRate: 0.36
},

createdAt: ISODate
}

Subscriptions Collection

{
\_id: ObjectId,
organizationId: ObjectId,
customerId: ObjectId,

name: "Monthly Essentials",

products: [{
productId: ObjectId,
variantId: ObjectId,
quantity: 2,
allowSubstitution: true
}],

frequency: {
interval: "weekly",
intervalCount: 1,
preferredDay: "friday"
},

schedule: {
startDate: ISODate,
nextDelivery: ISODate,
lastDelivery: ISODate,
deliveriesCompleted: 12
},

delivery: {
method: "delivery",
addressId: ObjectId
},

pricing: {
subtotal: 59.98,
subscriptionDiscount: { value: 10, amount: 6.00 },
total: 62.08
},

payment: {
paymentMethodId: "pm\_...",
autoCharge: true,
chargeBeforeDays: 1
},

status: "active",

analytics: {
totalRevenue: 744.96,
totalOrders: 12,
skipRate: 0.08
},

createdAt: ISODate
}

Analytics Events Collection

{
\_id: ObjectId,
organizationId: ObjectId,

eventType: "product_view",
eventCategory: "ecommerce",

userId: ObjectId,
sessionId: "sess_abc123",

data: {
productId: ObjectId,
productName: "Blue Dream",
category: "flower",
price: 29.99
},

context: {
device: {
type: "mobile",
os: "iOS",
browser: "Safari"
},

    location: {
      city: "Denver",
      state: "CO",
      country: "US"
    },

    page: {
      url: "https://greenleaf.com/products/blue-dream",
      referrer: "https://google.com"
    }

},

timestamp: ISODate
}

Support Tickets Collection

{
\_id: ObjectId,
organizationId: ObjectId,

ticketNumber: "TKT-2024-001234",

customerId: ObjectId,
customerInfo: {
email: "customer@example.com",
name: "John Doe"
},

subject: "Order #1001 - Missing item",
description: "I received my order but one item was missing",

category: "order_issue",
subcategory: "missing_item",
priority: "medium",

relatedOrder: ObjectId,

status: "open",

assignedTo: ObjectId,
assignedToName: "Sarah Johnson",

messages: [{
authorId: ObjectId,
authorType: "customer",
message: "I received my order but one item was missing",
createdAt: ISODate
}, {
authorId: ObjectId,
authorType: "staff",
message: "I'm looking into this right now",
createdAt: ISODate
}],

ai: {
sentiment: "frustrated",
predictedCategory: "order_issue",
suggestedResponses: ["I apologize for the inconvenience..."]
},

resolution: {
resolved: true,
type: "refund",
details: "Issued $29.99 refund",

    satisfactionSurvey: {
      rating: 5,
      feedback: "Sarah was very helpful!"
    }

},

createdAt: ISODate,
resolvedAt: ISODate
}

---

Complete API Specifications

Base Configuration

Base URL: https://api.cannasaas.com/v1
Authentication: Bearer JWT tokens
Rate Limiting: 100 requests/minute
Response Format: JSON

Authentication Endpoints

POST /auth/register
Request:
{
"organizationId": "org_123",
"email": "user@example.com",
"password": "securepass123",
"firstName": "John",
"lastName": "Doe",
"phone": "+1234567890"
}

Response: 200 OK
{
"user": {
"\_id": "user_456",
"email": "user@example.com",
"firstName": "John",
"lastName": "Doe",
"role": "customer"
},
"tokens": {
"accessToken": "eyJhbGc...",
"refreshToken": "eyJhbGc..."
}
}

POST /auth/login
Request:
{
"email": "user@example.com",
"password": "securepass123"
}

Response: 200 OK
{
"user": { /_ User object _/ },
"tokens": {
"accessToken": "eyJhbGc...",
"refreshToken": "eyJhbGc..."
}
}

POST /auth/refresh
Request:
{
"refreshToken": "eyJhbGc..."
}

Response: 200 OK
{
"accessToken": "eyJhbGc...",
"refreshToken": "eyJhbGc..."
}

POST /auth/logout
Headers:
Authorization: Bearer eyJhbGc...

Response: 200 OK
{
"success": true,
"message": "Logged out successfully"
}

POST /auth/forgot-password
Request:
{
"email": "user@example.com",
"organizationId": "org_123"
}

Response: 200 OK
{
"message": "Password reset email sent"
}

POST /auth/reset-password
Request:
{
"token": "reset_token_abc",
"newPassword": "newsecurepass123"
}

Response: 200 OK
{
"message": "Password reset successful"
}

Products Endpoints

GET /products
Query Parameters:

- page: number (default: 1)
- limit: number (default: 20, max: 100)
- category: string
- subcategory: string
- brand: string
- minPrice: number
- maxPrice: number
- minThc: number
- maxThc: number
- strainType: string (sativa, indica, hybrid)
- inStock: boolean
- featured: boolean
- sort: string (price_asc, price_desc, name_asc, popularity, newest)
- search: string

Example Request:
GET /products?category=flower&minThc=20&sort=popularity&page=1&limit=20

Response: 200 OK
{
"data": [
{
"\_id": "prod_123",
"name": "Blue Dream",
"slug": "blue-dream",
"category": "flower",
"cannabisInfo": {
"cannabinoids": {
"thc": { "percentage": 24.5 }
}
},
"variants": [{
"pricing": {
"basePrice": 35.00,
"salePrice": 29.99
},
"inventory": {
"available": 47
}
}],
"media": {
"images": [{
"url": "https://cdn.../image.jpg",
"isPrimary": true
}]
}
}
],
"pagination": {
"page": 1,
"limit": 20,
"total": 156,
"totalPages": 8
},
"filters": {
"categories": [
{ "name": "flower", "count": 45 },
{ "name": "edibles", "count": 32 }
],
"priceRange": { "min": 10.00, "max": 150.00 }
}
}

GET /products/:id
Example Request:
GET /products/prod_123

Response: 200 OK
{
"data": {
"\_id": "prod*123",
"name": "Blue Dream",
"description": { /* ... _/ },
"cannabisInfo": { /_ ... _/ },
"variants": [ /* ... */ ],
"media": { /_ ... \_/ },
"reviews": {
"count": 127,
"averageRating": 4.7
}
},
"related": [ /* Related products */ ],
"recommendations": [ /* AI recommendations */ ]
}

POST /products (Admin only)
Headers:
Authorization: Bearer eyJhbGc...

Request:
{
"name": "Blue Dream",
"description": {
"short": "Sativa-dominant hybrid",
"long": "Blue Dream is..."
},
"category": "flower",
"subcategory": "sativa",
"cannabisInfo": {
"strain": {
"name": "Blue Dream",
"type": "sativa-dominant hybrid"
},
"cannabinoids": {
"thc": { "percentage": 24.5 }
}
},
"variants": [{
"name": "1/8 oz (3.5g)",
"sku": "BD-001-3.5",
"weight": 3.5,
"pricing": {
"basePrice": 35.00
},
"inventory": {
"quantity": 50
}
}]
}

Response: 201 Created
{
"data": { /_ Full product object _/ }
}

PUT /products/:id (Admin only)
Request:
{
"name": "Blue Dream Premium",
"variants": [{
"_id": "var_123",
"pricing": {
"basePrice": 39.99
}
}]
}

Response: 200 OK
{
"data": { /_ Updated product _/ }
}

DELETE /products/:id (Admin only)
Response: 200 OK
{
"success": true,
"message": "Product deleted successfully"
}

Cart Endpoints

GET /cart
Response: 200 OK
{
"data": {
"items": [{
"_id": "item_123",
"productId": "prod_123",
"variantId": "var_456",
"product": {
"name": "Blue Dream",
"image": "https://cdn.../image.jpg"
},
"quantity": 2,
"price": 29.99,
"subtotal": 59.98
}],
"subtotal": 59.98,
"discounts": [{
"code": "SUMMER20",
"amount": 12.00
}],
"tax": 7.20,
"total": 55.18,
"itemCount": 2
}
}

POST /cart/items
Request:
{
"productId": "prod_123",
"variantId": "var_456",
"quantity": 2
}

Response: 200 OK
{
"data": { /_ Updated cart _/ }
}

PUT /cart/items/:itemId
Request:
{
"quantity": 3
}

Response: 200 OK
{
"data": { /_ Updated cart _/ }
}

DELETE /cart/items/:itemId
Response: 200 OK
{
"data": { /_ Updated cart _/ }
}

POST /cart/coupon
Request:
{
"code": "SUMMER20"
}

Response: 200 OK
{
"data": { /_ Updated cart _/ },
"discount": {
"code": "SUMMER20",
"amount": 12.00,
"type": "percentage"
}
}

Error Response: 400 Bad Request
{
"error": "Invalid coupon code"
}

Orders Endpoints

POST /orders
Request:
{
"items": [{
"productId": "prod_123",
"variantId": "var_456",
"quantity": 2
}],
"fulfillment": {
"method": "delivery",
"addressId": "addr_789",
"scheduledFor": "2024-01-21T15:00:00Z",
"deliveryInstructions": "Ring doorbell"
},
"payment": {
"method": "card",
"paymentMethodId": "pm_abc123"
},
"couponCodes": ["SUMMER20"],
"loyaltyPoints": 100,
"notes": {
"customer": "Please include utensils"
}
}

Response: 201 Created
{
"data": {
"orderNumber": "ORD-20240120-001",
"status": "pending",
"total": 72.08,
"fulfillment": {
"estimatedDeliveryTime": "2024-01-20T16:30:00Z"
}
},
"paymentIntent": {
"clientSecret": "pi_abc123_secret_xyz"
}
}

GET /orders
Query Parameters:

- page: number
- limit: number
- status: string
- startDate: ISO date
- endDate: ISO date

Response: 200 OK
{
"data": [
{
"orderNumber": "ORD-20240120-001",
"status": "delivered",
"total": 72.08,
"createdAt": "2024-01-20T10:00:00Z",
"items": [ /* ... */ ]
}
],
"pagination": { /_ ... _/ }
}

GET /orders/:id
Response: 200 OK
{
"data": {
"orderNumber": "ORD-20240120-001",
"status": "delivered",
"items": [ /* ... */ ],
"pricing": { /_ ... _/ },
"fulfillment": { /_ ... _/ },
"statusHistory": [ /* ... */ ]
}
}

GET /orders/:id/track
Response: 200 OK
{
"data": {
"status": "out_for_delivery",
"estimatedDelivery": "2024-01-20T16:30:00Z",
"currentLocation": {
"lat": 39.7392,
"lng": -104.9903
},
"driver": {
"name": "Mike Johnson",
"phone": "+1234567890",
"photo": "https://cdn.../driver.jpg"
},
"statusHistory": [
{
"status": "pending",
"timestamp": "2024-01-20T10:00:00Z"
},
{
"status": "confirmed",
"timestamp": "2024-01-20T10:05:00Z"
}
]
}
}

PUT /orders/:id/cancel
Request:
{
"reason": "changed_mind",
"details": "Ordered wrong item"
}

Response: 200 OK
{
"data": {
"orderNumber": "ORD-20240120-001",
"status": "cancelled",
"cancellation": {
"reason": "changed_mind",
"refundIssued": true
}
}
}

Users Endpoints

GET /users/me
Response: 200 OK
{
"data": {
"\_id": "user_123",
"email": "user@example.com",
"profile": {
"firstName": "John",
"lastName": "Doe"
},
"loyalty": {
"points": 2500,
"tier": "gold"
}
}
}

PUT /users/me
Request:
{
"profile": {
"firstName": "John",
"phone": "+1234567890"
},
"preferences": {
"notifications": {
"promotions": false
}
}
}

Response: 200 OK
{
"data": { /_ Updated user _/ }
}

GET /users/me/addresses
Response: 200 OK
{
"data": [
{
"_id": "addr_123",
"type": "home",
"street": "456 Oak Ave",
"city": "Denver",
"state": "CO",
"isDefault": true
}
]
}

POST /users/me/addresses
Request:
{
"type": "work",
"label": "Office",
"street": "789 Business Blvd",
"city": "Denver",
"state": "CO",
"zip": "80202",
"isDefault": false
}

Response: 201 Created
{
"data": { /_ New address _/ }
}

GET /users/me/loyalty
Response: 200 OK
{
"data": {
"points": 2500,
"pointsLifetime": 5000,
"tier": "gold",
"tierSince": "2023-06-15T00:00:00Z",
"nextTier": "platinum",
"pointsToNextTier": 2500,
"lifetimeSpent": 2500.00,
"rewardsHistory": [ /* ... */ ],
"referralCode": "JOHN2024"
}
}

POST /users/me/loyalty/redeem
Request:
{
"points": 1000
}

Response: 200 OK
{
"data": {
"couponCode": "LOYALTY-ABC123",
"discountAmount": 10.00,
"remainingPoints": 1500
}
}

Reviews Endpoints

GET /products/:id/reviews
Query Parameters:

- page: number
- limit: number
- rating: number (1-5)
- verified: boolean
- sort: string (newest, oldest, highest_rated, most_helpful)

Response: 200 OK
{
"data": [
{
"_id": "review_123",
"rating": 5,
"title": "Best sativa!",
"review": "This strain is amazing...",
"customerInfo": {
"displayName": "John D.",
"verified": true
},
"engagement": {
"helpful": 24,
"notHelpful": 1
},
"createdAt": "2024-01-15T10:00:00Z"
}
],
"summary": {
"averageRating": 4.7,
"totalReviews": 127,
"distribution": {
"5": 85,
"4": 30,
"3": 8,
"2": 3,
"1": 1
}
}
}

POST /products/:id/reviews
Request:
{
"rating": 5,
"title": "Best sativa I've tried!",
"review": "This strain is absolutely amazing...",
"detailedRatings": {
"quality": 5,
"value": 4,
"effects": 5
},
"feedback": {
"effectsExperienced": ["uplifting", "creative"],
"timeOfDayUsed": "afternoon"
}
}

Response: 201 Created
{
"data": { /_ Review object _/ }
}

Analytics Endpoints (Admin)

GET /admin/analytics/overview
Query Parameters:

- startDate: ISO date
- endDate: ISO date
- locationId: string (optional)

Response: 200 OK
{
"data": {
"revenue": {
"total": 125000.00,
"change": 15.5,
"byDay": [
{ "date": "2024-01-15", "amount": 4500.00 },
{ "date": "2024-01-16", "amount": 5200.00 }
]
},
"orders": {
"total": 1456,
"change": 12.3,
"byDay": [ /* ... */ ]
},
"customers": {
"total": 456,
"new": 45,
"returning": 411,
"change": 8.2
},
"avgOrderValue": {
"value": 85.85,
"change": 3.1
},
"topProducts": [
{
"productId": "prod_123",
"name": "Blue Dream",
"revenue": 12500.00,
"quantity": 156
}
]
}
}

GET /admin/analytics/products
Query Parameters:

- startDate: ISO date
- endDate: ISO date
- sort: string (revenue, quantity, views)
- limit: number

Response: 200 OK
{
"data": [
{
"productId": "prod_123",
"name": "Blue Dream",
"category": "flower",
"views": 5420,
"addToCart": 487,
"purchases": 312,
"revenue": 9360.00,
"conversionRate": 5.75
}
]
}

AI Services Endpoints

POST /ai/product-description
Request:
{
"productName": "Blue Dream",
"category": "flower",
"cannabisInfo": {
"thc": 24.5,
"cbd": 0.8,
"strainType": "sativa-dominant hybrid",
"effects": ["uplifting", "creative"],
"flavors": ["berry", "sweet"]
}
}

Response: 200 OK
{
"data": {
"shortDescription": "Sativa-dominant hybrid...",
"longDescription": "Blue Dream is...",
"marketingCopy": "Experience the perfect...",
"seoMetaDescription": "Premium Blue Dream...",
"seoKeywords": ["blue dream", "sativa", "cannabis"]
}
}

POST /ai/recommendations
Request:
{
"customerId": "user_123",
"context": "product_page",
"productId": "prod_123"
}

Response: 200 OK
{
"data": {
"recommendations": [
{
"_id": "prod_456",
"name": "Green Crack",
"reason": "Similar effects and strain type"
}
],
"confidence": 0.85
}
}

POST /ai/chatbot
Request:
{
"message": "What's the difference between indica and sativa?",
"conversationId": "conv_123"
}

Response: 200 OK
{
"data": {
"reply": "Great question! Indica and sativa are...",
"conversationId": "conv_123",
"suggestedActions": [
{
"type": "view_product",
"label": "Browse Sativa Strains",
"data": { "category": "flower", "type": "sativa" }
}
],
"confidence": 0.92
}
}

POST /ai/inventory-forecast
Request:
{
"productId": "prod_123",
"variantId": "var_456",
"days": 30
}

Response: 200 OK
{
"data": {
"forecast": [
{ "date": "2024-01-21", "predictedDemand": 12 },
{ "date": "2024-01-22", "predictedDemand": 8 }
],
"recommendation": {
"shouldReorder": true,
"quantity": 200,
"urgency": "medium",
"reasoning": "Current stock will deplete in 15 days..."
}
}
}

MongoDB Collections

Organizations Collection

{
\_id: ObjectId,
name: "Green Leaf Dispensary",
slug: "green-leaf", // URL identifier
legalName: "Green Leaf LLC",

// Domains
subdomain: "greenleaf", // greenleaf.cannasaas.com
customDomain: "greenleaf.com",
domainVerified: true,

// Branding & Theming
branding: {
logo: {
light: "https://cdn.../logo-light.png",
dark: "https://cdn.../logo-dark.png",
favicon: "https://cdn.../favicon.ico"
},
colors: {
primary: "#10b981",
secondary: "#064e3b",
accent: "#fbbf24",
background: "#ffffff",
text: "#1f2937"
},
fonts: {
heading: "Montserrat",
body: "Inter"
},
customCSS: "/_ Custom styles _/",
customJS: "/_ Custom scripts _/"
},

// Business Information
businessInfo: {
licenseNumber: "C11-0000123-LIC",
licenseType: "adult-use", // adult-use, medical, both
licenseExpiry: ISODate,
taxId: "12-3456789",
email: "contact@greenleaf.com",
phone: "+1234567890",
website: "https://greenleaf.com",

    // Locations (can have multiple)
    locations: [{
      _id: ObjectId,
      name: "Main Store",
      type: "retail", // retail, warehouse, corporate
      isDefault: true,

      address: {
        street: "123 Main St",
        unit: "Suite 100",
        city: "Denver",
        state: "CO",
        zip: "80202",
        country: "US",
        coordinates: {
          lat: 39.7392,
          lng: -104.9903
        }
      },

      contact: {
        phone: "+1234567890",
        email: "store@greenleaf.com"
      },

      hours: {
        monday: { open: "09:00", close: "21:00", closed: false },
        tuesday: { open: "09:00", close: "21:00", closed: false },
        wednesday: { open: "09:00", close: "21:00", closed: false },
        thursday: { open: "09:00", close: "21:00", closed: false },
        friday: { open: "09:00", close: "22:00", closed: false },
        saturday: { open: "10:00", close: "22:00", closed: false },
        sunday: { open: "10:00", close: "20:00", closed: false }
      },

      specialHours: [{
        date: ISODate,
        open: "10:00",
        close: "18:00",
        reason: "New Year's Day"
      }],

      capabilities: {
        delivery: true,
        pickup: true,
        inStore: true,
        curbside: true
      },

      deliveryZones: [{
        name: "Zone 1",
        radius: 5, // miles
        fee: 5.00,
        minimumOrder: 20.00,
        estimatedTime: 30 // minutes
      }]
    }]

},

// Subscription & Billing
subscription: {
plan: "professional", // starter, professional, enterprise
status: "active", // trial, active, past_due, suspended, cancelled
billingCycle: "monthly",
trialEndsAt: ISODate,
currentPeriodStart: ISODate,
currentPeriodEnd: ISODate,
cancelAtPeriodEnd: false,

    stripeCustomerId: "cus_...",
    stripeSubscriptionId: "sub_...",

    limits: {
      locations: 3,
      products: null, // unlimited
      orders: null,
      users: 25,
      storage: 10000, // MB
      apiCalls: 100000
    },

    addons: [{
      type: "advanced_analytics",
      price: 149.00,
      active: true
    }]

},

// Feature Flags
features: {
multiLocation: true,
subscriptionOrders: true,
loyaltyProgram: true,
giftCards: true,
bundles: true,
delivery: true,
pickup: true,
medical: true,
recreational: true,
aiRecommendations: true,
aiChatbot: true,
apiAccess: true
},

// Settings
settings: {
currency: "USD",
timezone: "America/Denver",
locale: "en-US",

    taxRates: [{
      name: "State Cannabis Tax",
      rate: 0.15,
      applyTo: "all"
    }],

    orderSettings: {
      minOrderAmount: 10.00,
      maxOrderAmount: 500.00,
      deliveryFee: 5.00,
      freeDeliveryThreshold: 50.00
    },

    ageVerification: {
      required: true,
      minimumAge: 21,
      provider: "veratad"
    },

    purchaseLimits: {
      dailyLimit: 28.0, // grams
      perTransactionLimit: 28.0
    }

},

// Integrations
integrations: {
stripe: {
enabled: true,
publishableKey: "pk*...",
secretKey: "sk*...", // Encrypted
webhookSecret: "whsec\_..."
},

    sendgrid: {
      enabled: true,
      apiKey: "...", // Encrypted
      fromEmail: "noreply@greenleaf.com"
    },

    twilio: {
      enabled: true,
      accountSid: "...",
      authToken: "...", // Encrypted
      phoneNumber: "+1234567890"
    },

    metrc: {
      enabled: true,
      licenseNumber: "...",
      apiKey: "...", // Encrypted
      state: "CO"
    }

},

// Analytics
analytics: {
totalRevenue: 125000.00,
totalOrders: 4567,
totalCustomers: 1234,
averageOrderValue: 65.50,
lastCalculated: ISODate
},

createdAt: ISODate,
updatedAt: ISODate,
deletedAt: null
}

Users Collection

{
\_id: ObjectId,
organizationId: ObjectId,

// Authentication
email: "user@example.com",
emailVerified: true,
phone: "+1234567890",
phoneVerified: true,
passwordHash: "...", // bcrypt

// Profile
profile: {
firstName: "John",
lastName: "Doe",
displayName: "John D.",
avatar: "https://cdn.../avatar.jpg",
dateOfBirth: ISODate,

    medicalCard: {
      hasCard: true,
      number: "MED-12345",
      state: "CO",
      expirationDate: ISODate,
      verified: true,
      verifiedAt: ISODate,
      documentUrl: "https://secure.../card.pdf"
    }

},

// Role & Permissions
role: "customer", // customer, budtender, manager, admin, owner
permissions: ["view_products", "place_orders", "view_own_orders"],

// Addresses
addresses: [{
_id: ObjectId,
type: "home",
label: "Home",
street: "456 Oak Ave",
city: "Denver",
state: "CO",
zip: "80203",
isDefault: true,
deliveryInstructions: "Ring doorbell"
}],

// Preferences
preferences: {
communicationChannels: {
email: true,
sms: true,
push: false
},

    notifications: {
      orderUpdates: true,
      promotions: true,
      restockAlerts: true
    },

    favoriteProducts: [ObjectId, ObjectId],
    preferredCategories: ["flower", "edibles"]

},

// Loyalty Program
loyalty: {
enrolled: true,
points: 2500,
pointsLifetime: 5000,
tier: "gold", // bronze, silver, gold, platinum
tierSince: ISODate,
lifetimeSpent: 2500.00,
referralCode: "JOHN2024"
},

// Subscriptions
subscriptions: [{
\_id: ObjectId,
status: "active",
frequency: "weekly",
nextDelivery: ISODate,
products: [{
productId: ObjectId,
variantId: ObjectId,
quantity: 2
}]
}],

// Marketing
marketing: {
source: "google_ads",
segment: "vip",
cohort: "2024-01",
tags: ["high_value", "prefers_edibles"]
},

// Security
security: {
lastLogin: ISODate,
lastLoginIP: "192.168.1.1",
failedLoginAttempts: 0,
twoFactorEnabled: false,
ageVerified: true,
ageVerifiedAt: ISODate
},

createdAt: ISODate,
updatedAt: ISODate
}

Products Collection

{
\_id: ObjectId,
organizationId: ObjectId,

// Basic Info
name: "Blue Dream",
slug: "blue-dream",
sku: "BD-001",

description: {
short: "Sativa-dominant hybrid with uplifting effects",
long: "Blue Dream is a sativa-dominant hybrid...",
aiGenerated: "Experience the perfect balance..."
},

// Categorization
category: "flower",
subcategory: "sativa",
tags: ["energetic", "creative", "daytime"],

brand: {
name: "Top Shelf Cultivation",
logo: "https://cdn.../brand-logo.png"
},

// Cannabis-Specific
cannabisInfo: {
strain: {
name: "Blue Dream",
type: "sativa-dominant hybrid",
genetics: "Blueberry × Haze"
},

    cannabinoids: {
      thc: { percentage: 24.5, min: 22.0, max: 27.0 },
      cbd: { percentage: 0.8, min: 0.5, max: 1.2 }
    },

    terpenes: [
      { name: "Myrcene", percentage: 0.6 },
      { name: "Pinene", percentage: 0.4 },
      { name: "Caryophyllene", percentage: 0.3 }
    ],

    effects: {
      primary: ["uplifting", "creative", "energetic"],
      medical: ["stress", "depression", "pain"]
    },

    flavors: ["berry", "sweet", "herbal"],

    labTesting: {
      tested: true,
      labName: "SC Labs",
      batchNumber: "BD20240115",
      testDate: ISODate,
      coaUrl: "https://cdn.../lab-results.pdf"
    }

},

// Variants
variants: [{
\_id: ObjectId,
name: "1/8 oz (3.5g)",
sku: "BD-001-3.5",
weight: 3.5,
unit: "grams",

    pricing: {
      basePrice: 35.00,
      salePrice: 29.99,
      onSale: true,
      costPrice: 18.00,
      msrp: 40.00
    },

    inventory: {
      quantity: 50,
      reserved: 3,
      available: 47,
      lowStockThreshold: 10,
      reorderPoint: 5,
      reorderQuantity: 100
    },

    compliance: {
      metrcId: "1A4060300000000000012345",
      batchNumber: "BD20240115",
      harvestDate: ISODate,
      expirationDate: ISODate
    }

}],

// Media
media: {
images: [{
url: "https://cdn.../product-1.jpg",
alt: "Blue Dream flower",
isPrimary: true
}],
videos: [{
url: "https://cdn.../video.mp4",
thumbnail: "https://cdn.../thumb.jpg"
}]
},

// SEO
seo: {
metaTitle: "Blue Dream Sativa Flower | Green Leaf",
metaDescription: "Premium Blue Dream...",
keywords: ["blue dream", "sativa", "cannabis"]
},

// Reviews
reviews: {
count: 127,
averageRating: 4.7,
distribution: { 5: 85, 4: 30, 3: 8, 2: 3, 1: 1 }
},

// Status
status: "active",
featured: true,

// Analytics
analytics: {
views: 5420,
addToCartCount: 487,
purchaseCount: 312,
conversionRate: 0.0575,
revenueGenerated: 9360.00
},

createdAt: ISODate,
updatedAt: ISODate
}

Orders Collection

{
\_id: ObjectId,
organizationId: ObjectId,

orderNumber: "ORD-20240120-001",
displayId: "#1001",

// Customer
customerId: ObjectId,
customerInfo: {
email: "user@example.com",
phone: "+1234567890",
firstName: "John",
lastName: "Doe",
customerType: "recreational"
},

// Order Type
type: "delivery", // delivery, pickup, curbside
channel: "web",

// Items
items: [{
\_id: ObjectId,
productId: ObjectId,
variantId: ObjectId,

    snapshot: {
      name: "Blue Dream",
      sku: "BD-001-3.5",
      image: "https://cdn.../product.jpg",
      weight: 3.5,
      thcPercentage: 24.5
    },

    quantity: 2,
    pricePerUnit: 29.99,
    subtotal: 59.98,

    discounts: [{
      type: "coupon",
      code: "SUMMER20",
      amount: 6.00
    }],

    totalAfterDiscounts: 53.98,
    taxAmount: 8.10,
    total: 62.08

}],

// Pricing
pricing: {
subtotal: 59.98,
itemDiscounts: 6.00,
subtotalAfterDiscounts: 53.98,
tax: 8.10,
deliveryFee: 5.00,
tip: 5.00,
total: 72.08,

    costOfGoods: 36.00,
    grossProfit: 36.08,
    profitMargin: 0.50

},

// Payment
payment: {
method: "card",
status: "paid",
transactionId: "ch_abc123",
paidAt: ISODate,

    card: {
      brand: "visa",
      last4: "4242"
    }

},

// Fulfillment
fulfillment: {
method: "delivery",
status: "delivered",

    address: {
      street: "456 Oak Ave",
      city: "Denver",
      state: "CO",
      zip: "80203",
      deliveryInstructions: "Ring doorbell"
    },

    delivery: {
      driverId: ObjectId,
      driverName: "Mike Johnson",
      driverPhone: "+1234567890",

      tracking: {
        currentLocation: { lat: 39.7392, lng: -104.9903 },
        eta: ISODate
      },

      proof: {
        signature: "https://cdn.../signature.png",
        photo: "https://cdn.../delivery-photo.jpg",
        idVerified: true
      }
    },

    confirmedAt: ISODate,
    readyAt: ISODate,
    deliveredAt: ISODate

},

// Status History
status: "delivered",
statusHistory: [{
status: "pending",
timestamp: ISODate,
note: "Order placed"
}, {
status: "confirmed",
timestamp: ISODate,
note: "Confirmed by staff"
}, {
status: "delivered",
timestamp: ISODate,
note: "Delivered and signed"
}],

// Compliance
compliance: {
ageVerified: true,
verifiedBy: ObjectId,
verifiedAt: ISODate,
totalCannabisWeight: 7.0,

    metrc: {
      reported: true,
      manifestId: "MF-20240120-001"
    }

},

// Notifications
notifications: {
sent: [{
type: "order_confirmation",
channel: "email",
sentAt: ISODate,
status: "delivered"
}]
},

createdAt: ISODate,
updatedAt: ISODate
}

Coupons Collection

{
\_id: ObjectId,
organizationId: ObjectId,

code: "SUMMER20",
name: "Summer Sale 2024",
description: "Get 20% off all flower products",

discount: {
type: "percentage", // percentage, fixed_amount, free_shipping
value: 20,
maxDiscount: 50.00,
applyTo: "products",
specificCategories: ["flower"]
},

usage: {
maxUsesTotal: 1000,
maxUsesPerCustomer: 1,
currentUses: 247,
minimumPurchase: 50.00
},

validity: {
startDate: ISODate,
endDate: ISODate,
activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday"]
},

status: "active",

analytics: {
totalUses: 247,
totalRevenue: 12500.00,
totalDiscount: 2500.00,
averageOrderValue: 50.61
},

createdAt: ISODate
}

Reviews Collection

{
\_id: ObjectId,
organizationId: ObjectId,
productId: ObjectId,
customerId: ObjectId,
orderId: ObjectId,

rating: 5,
title: "Best sativa I've tried!",
review: "This strain is absolutely amazing...",

detailedRatings: {
quality: 5,
value: 4,
effects: 5,
flavor: 5
},

feedback: {
effectsExperienced: ["uplifting", "creative", "focused"],
timeOfDayUsed: "afternoon",
consumptionMethod: "vaporizer"
},

media: [{
type: "image",
url: "https://cdn.../review-photo.jpg"
}],

// AI Analysis
ai: {
sentiment: "positive",
sentimentScore: 0.92,
keyPhrases: ["uplifting effects", "smooth flavor"],
isSpam: false,
authentic: true
},

moderation: {
status: "approved",
autoApproved: true
},

engagement: {
helpful: 24,
notHelpful: 1
},

response: {
responded: true,
responseText: "Thank you for the wonderful review!",
respondedBy: ObjectId,
respondedAt: ISODate
},

verifiedPurchase: true,
createdAt: ISODate
}

Loyalty Programs Collection

{
\_id: ObjectId,
organizationId: ObjectId,

name: "Green Rewards",
description: "Earn points on every purchase",
status: "active",

points: {
earningRules: [{
name: "Purchase Points",
type: "purchase",
pointsPerDollar: 1,

      multiplierTiers: [{
        tier: "gold",
        multiplier: 1.5
      }]
    }, {
      name: "Signup Bonus",
      type: "signup",
      points: 100
    }, {
      name: "Referral Bonus",
      type: "referral",
      points: 500
    }],

    redemptionRules: [{
      name: "Discount Redemption",
      type: "discount",
      pointsPerDollar: 100, // 100 points = $1
      minPoints: 100
    }],

    expiration: {
      enabled: true,
      expiryMonths: 12
    }

},

tiers: {
enabled: true,
levels: [{
name: "Bronze",
level: 1,
requirements: { minPoints: 0 },
benefits: { pointsMultiplier: 1.0 }
}, {
name: "Silver",
level: 2,
requirements: { minPoints: 1000, minSpend: 500.00 },
benefits: { pointsMultiplier: 1.25, earlyAccess: true }
}, {
name: "Gold",
level: 3,
requirements: { minPoints: 2500, minSpend: 1500.00 },
benefits: {
pointsMultiplier: 1.5,
freeShipping: true,
prioritySupport: true
}
}]
},

referral: {
enabled: true,
referrerReward: { type: "points", amount: 500 },
refereeReward: { type: "discount", amount: 10.00 }
},

analytics: {
totalMembers: 5420,
pointsIssued: 1250000,
pointsRedeemed: 450000,
redemptionRate: 0.36
},

createdAt: ISODate
}

Subscriptions Collection

{
\_id: ObjectId,
organizationId: ObjectId,
customerId: ObjectId,

name: "Monthly Essentials",

products: [{
productId: ObjectId,
variantId: ObjectId,
quantity: 2,
allowSubstitution: true
}],

frequency: {
interval: "weekly",
intervalCount: 1,
preferredDay: "friday"
},

schedule: {
startDate: ISODate,
nextDelivery: ISODate,
lastDelivery: ISODate,
deliveriesCompleted: 12
},

delivery: {
method: "delivery",
addressId: ObjectId
},

pricing: {
subtotal: 59.98,
subscriptionDiscount: { value: 10, amount: 6.00 },
total: 62.08
},

payment: {
paymentMethodId: "pm\_...",
autoCharge: true,
chargeBeforeDays: 1
},

status: "active",

analytics: {
totalRevenue: 744.96,
totalOrders: 12,
skipRate: 0.08
},

createdAt: ISODate
}

Analytics Events Collection

{
\_id: ObjectId,
organizationId: ObjectId,

eventType: "product_view",
eventCategory: "ecommerce",

userId: ObjectId,
sessionId: "sess_abc123",

data: {
productId: ObjectId,
productName: "Blue Dream",
category: "flower",
price: 29.99
},

context: {
device: {
type: "mobile",
os: "iOS",
browser: "Safari"
},

    location: {
      city: "Denver",
      state: "CO",
      country: "US"
    },

    page: {
      url: "https://greenleaf.com/products/blue-dream",
      referrer: "https://google.com"
    }

},

timestamp: ISODate
}

Support Tickets Collection

{
\_id: ObjectId,
organizationId: ObjectId,

ticketNumber: "TKT-2024-001234",

customerId: ObjectId,
customerInfo: {
email: "customer@example.com",
name: "John Doe"
},

subject: "Order #1001 - Missing item",
description: "I received my order but one item was missing",

category: "order_issue",
subcategory: "missing_item",
priority: "medium",

relatedOrder: ObjectId,

status: "open",

assignedTo: ObjectId,
assignedToName: "Sarah Johnson",

messages: [{
authorId: ObjectId,
authorType: "customer",
message: "I received my order but one item was missing",
createdAt: ISODate
}, {
authorId: ObjectId,
authorType: "staff",
message: "I'm looking into this right now",
createdAt: ISODate
}],

ai: {
sentiment: "frustrated",
predictedCategory: "order_issue",
suggestedResponses: ["I apologize for the inconvenience..."]
},

resolution: {
resolved: true,
type: "refund",
details: "Issued $29.99 refund",

    satisfactionSurvey: {
      rating: 5,
      feedback: "Sarah was very helpful!"
    }

},

createdAt: ISODate,
resolvedAt: ISODate
}

---

Complete API Specifications

Base Configuration

Base URL: https://api.cannasaas.com/v1
Authentication: Bearer JWT tokens
Rate Limiting: 100 requests/minute
Response Format: JSON

Authentication Endpoints

POST /auth/register
Request:
{
"organizationId": "org_123",
"email": "user@example.com",
"password": "securepass123",
"firstName": "John",
"lastName": "Doe",
"phone": "+1234567890"
}

Response: 200 OK
{
"user": {
"\_id": "user_456",
"email": "user@example.com",
"firstName": "John",
"lastName": "Doe",
"role": "customer"
},
"tokens": {
"accessToken": "eyJhbGc...",
"refreshToken": "eyJhbGc..."
}
}

POST /auth/login
Request:
{
"email": "user@example.com",
"password": "securepass123"
}

Response: 200 OK
{
"user": { /_ User object _/ },
"tokens": {
"accessToken": "eyJhbGc...",
"refreshToken": "eyJhbGc..."
}
}

POST /auth/refresh
Request:
{
"refreshToken": "eyJhbGc..."
}

Response: 200 OK
{
"accessToken": "eyJhbGc...",
"refreshToken": "eyJhbGc..."
}

POST /auth/logout
Headers:
Authorization: Bearer eyJhbGc...

Response: 200 OK
{
"success": true,
"message": "Logged out successfully"
}

POST /auth/forgot-password
Request:
{
"email": "user@example.com",
"organizationId": "org_123"
}

Response: 200 OK
{
"message": "Password reset email sent"
}

POST /auth/reset-password
Request:
{
"token": "reset_token_abc",
"newPassword": "newsecurepass123"
}

Response: 200 OK
{
"message": "Password reset successful"
}

Products Endpoints

GET /products
Query Parameters:

- page: number (default: 1)
- limit: number (default: 20, max: 100)
- category: string
- subcategory: string
- brand: string
- minPrice: number
- maxPrice: number
- minThc: number
- maxThc: number
- strainType: string (sativa, indica, hybrid)
- inStock: boolean
- featured: boolean
- sort: string (price_asc, price_desc, name_asc, popularity, newest)
- search: string

Example Request:
GET /products?category=flower&minThc=20&sort=popularity&page=1&limit=20

Response: 200 OK
{
"data": [
{
"\_id": "prod_123",
"name": "Blue Dream",
"slug": "blue-dream",
"category": "flower",
"cannabisInfo": {
"cannabinoids": {
"thc": { "percentage": 24.5 }
}
},
"variants": [{
"pricing": {
"basePrice": 35.00,
"salePrice": 29.99
},
"inventory": {
"available": 47
}
}],
"media": {
"images": [{
"url": "https://cdn.../image.jpg",
"isPrimary": true
}]
}
}
],
"pagination": {
"page": 1,
"limit": 20,
"total": 156,
"totalPages": 8
},
"filters": {
"categories": [
{ "name": "flower", "count": 45 },
{ "name": "edibles", "count": 32 }
],
"priceRange": { "min": 10.00, "max": 150.00 }
}
}

GET /products/:id
Example Request:
GET /products/prod_123

Response: 200 OK
{
"data": {
"\_id": "prod*123",
"name": "Blue Dream",
"description": { /* ... _/ },
"cannabisInfo": { /_ ... _/ },
"variants": [ /* ... */ ],
"media": { /_ ... \_/ },
"reviews": {
"count": 127,
"averageRating": 4.7
}
},
"related": [ /* Related products */ ],
"recommendations": [ /* AI recommendations */ ]
}

POST /products (Admin only)
Headers:
Authorization: Bearer eyJhbGc...

Request:
{
"name": "Blue Dream",
"description": {
"short": "Sativa-dominant hybrid",
"long": "Blue Dream is..."
},
"category": "flower",
"subcategory": "sativa",
"cannabisInfo": {
"strain": {
"name": "Blue Dream",
"type": "sativa-dominant hybrid"
},
"cannabinoids": {
"thc": { "percentage": 24.5 }
}
},
"variants": [{
"name": "1/8 oz (3.5g)",
"sku": "BD-001-3.5",
"weight": 3.5,
"pricing": {
"basePrice": 35.00
},
"inventory": {
"quantity": 50
}
}]
}

Response: 201 Created
{
"data": { /_ Full product object _/ }
}

PUT /products/:id (Admin only)
Request:
{
"name": "Blue Dream Premium",
"variants": [{
"_id": "var_123",
"pricing": {
"basePrice": 39.99
}
}]
}

Response: 200 OK
{
"data": { /_ Updated product _/ }
}

DELETE /products/:id (Admin only)
Response: 200 OK
{
"success": true,
"message": "Product deleted successfully"
}

Cart Endpoints

GET /cart
Response: 200 OK
{
"data": {
"items": [{
"_id": "item_123",
"productId": "prod_123",
"variantId": "var_456",
"product": {
"name": "Blue Dream",
"image": "https://cdn.../image.jpg"
},
"quantity": 2,
"price": 29.99,
"subtotal": 59.98
}],
"subtotal": 59.98,
"discounts": [{
"code": "SUMMER20",
"amount": 12.00
}],
"tax": 7.20,
"total": 55.18,
"itemCount": 2
}
}

POST /cart/items
Request:
{
"productId": "prod_123",
"variantId": "var_456",
"quantity": 2
}

Response: 200 OK
{
"data": { /_ Updated cart _/ }
}

PUT /cart/items/:itemId
Request:
{
"quantity": 3
}

Response: 200 OK
{
"data": { /_ Updated cart _/ }
}

DELETE /cart/items/:itemId
Response: 200 OK
{
"data": { /_ Updated cart _/ }
}

POST /cart/coupon
Request:
{
"code": "SUMMER20"
}

Response: 200 OK
{
"data": { /_ Updated cart _/ },
"discount": {
"code": "SUMMER20",
"amount": 12.00,
"type": "percentage"
}
}

Error Response: 400 Bad Request
{
"error": "Invalid coupon code"
}

Orders Endpoints

POST /orders
Request:
{
"items": [{
"productId": "prod_123",
"variantId": "var_456",
"quantity": 2
}],
"fulfillment": {
"method": "delivery",
"addressId": "addr_789",
"scheduledFor": "2024-01-21T15:00:00Z",
"deliveryInstructions": "Ring doorbell"
},
"payment": {
"method": "card",
"paymentMethodId": "pm_abc123"
},
"couponCodes": ["SUMMER20"],
"loyaltyPoints": 100,
"notes": {
"customer": "Please include utensils"
}
}

Response: 201 Created
{
"data": {
"orderNumber": "ORD-20240120-001",
"status": "pending",
"total": 72.08,
"fulfillment": {
"estimatedDeliveryTime": "2024-01-20T16:30:00Z"
}
},
"paymentIntent": {
"clientSecret": "pi_abc123_secret_xyz"
}
}

GET /orders
Query Parameters:

- page: number
- limit: number
- status: string
- startDate: ISO date
- endDate: ISO date

Response: 200 OK
{
"data": [
{
"orderNumber": "ORD-20240120-001",
"status": "delivered",
"total": 72.08,
"createdAt": "2024-01-20T10:00:00Z",
"items": [ /* ... */ ]
}
],
"pagination": { /_ ... _/ }
}

GET /orders/:id
Response: 200 OK
{
"data": {
"orderNumber": "ORD-20240120-001",
"status": "delivered",
"items": [ /* ... */ ],
"pricing": { /_ ... _/ },
"fulfillment": { /_ ... _/ },
"statusHistory": [ /* ... */ ]
}
}

GET /orders/:id/track
Response: 200 OK
{
"data": {
"status": "out_for_delivery",
"estimatedDelivery": "2024-01-20T16:30:00Z",
"currentLocation": {
"lat": 39.7392,
"lng": -104.9903
},
"driver": {
"name": "Mike Johnson",
"phone": "+1234567890",
"photo": "https://cdn.../driver.jpg"
},
"statusHistory": [
{
"status": "pending",
"timestamp": "2024-01-20T10:00:00Z"
},
{
"status": "confirmed",
"timestamp": "2024-01-20T10:05:00Z"
}
]
}
}

PUT /orders/:id/cancel
Request:
{
"reason": "changed_mind",
"details": "Ordered wrong item"
}

Response: 200 OK
{
"data": {
"orderNumber": "ORD-20240120-001",
"status": "cancelled",
"cancellation": {
"reason": "changed_mind",
"refundIssued": true
}
}
}

Users Endpoints

GET /users/me
Response: 200 OK
{
"data": {
"\_id": "user_123",
"email": "user@example.com",
"profile": {
"firstName": "John",
"lastName": "Doe"
},
"loyalty": {
"points": 2500,
"tier": "gold"
}
}
}

PUT /users/me
Request:
{
"profile": {
"firstName": "John",
"phone": "+1234567890"
},
"preferences": {
"notifications": {
"promotions": false
}
}
}

Response: 200 OK
{
"data": { /_ Updated user _/ }
}

GET /users/me/addresses
Response: 200 OK
{
"data": [
{
"_id": "addr_123",
"type": "home",
"street": "456 Oak Ave",
"city": "Denver",
"state": "CO",
"isDefault": true
}
]
}

POST /users/me/addresses
Request:
{
"type": "work",
"label": "Office",
"street": "789 Business Blvd",
"city": "Denver",
"state": "CO",
"zip": "80202",
"isDefault": false
}

Response: 201 Created
{
"data": { /_ New address _/ }
}

GET /users/me/loyalty
Response: 200 OK
{
"data": {
"points": 2500,
"pointsLifetime": 5000,
"tier": "gold",
"tierSince": "2023-06-15T00:00:00Z",
"nextTier": "platinum",
"pointsToNextTier": 2500,
"lifetimeSpent": 2500.00,
"rewardsHistory": [ /* ... */ ],
"referralCode": "JOHN2024"
}
}

POST /users/me/loyalty/redeem
Request:
{
"points": 1000
}

Response: 200 OK
{
"data": {
"couponCode": "LOYALTY-ABC123",
"discountAmount": 10.00,
"remainingPoints": 1500
}
}

Reviews Endpoints

GET /products/:id/reviews
Query Parameters:

- page: number
- limit: number
- rating: number (1-5)
- verified: boolean
- sort: string (newest, oldest, highest_rated, most_helpful)

Response: 200 OK
{
"data": [
{
"_id": "review_123",
"rating": 5,
"title": "Best sativa!",
"review": "This strain is amazing...",
"customerInfo": {
"displayName": "John D.",
"verified": true
},
"engagement": {
"helpful": 24,
"notHelpful": 1
},
"createdAt": "2024-01-15T10:00:00Z"
}
],
"summary": {
"averageRating": 4.7,
"totalReviews": 127,
"distribution": {
"5": 85,
"4": 30,
"3": 8,
"2": 3,
"1": 1
}
}
}

POST /products/:id/reviews
Request:
{
"rating": 5,
"title": "Best sativa I've tried!",
"review": "This strain is absolutely amazing...",
"detailedRatings": {
"quality": 5,
"value": 4,
"effects": 5
},
"feedback": {
"effectsExperienced": ["uplifting", "creative"],
"timeOfDayUsed": "afternoon"
}
}

Response: 201 Created
{
"data": { /_ Review object _/ }
}

Analytics Endpoints (Admin)

GET /admin/analytics/overview
Query Parameters:

- startDate: ISO date
- endDate: ISO date
- locationId: string (optional)

Response: 200 OK
{
"data": {
"revenue": {
"total": 125000.00,
"change": 15.5,
"byDay": [
{ "date": "2024-01-15", "amount": 4500.00 },
{ "date": "2024-01-16", "amount": 5200.00 }
]
},
"orders": {
"total": 1456,
"change": 12.3,
"byDay": [ /* ... */ ]
},
"customers": {
"total": 456,
"new": 45,
"returning": 411,
"change": 8.2
},
"avgOrderValue": {
"value": 85.85,
"change": 3.1
},
"topProducts": [
{
"productId": "prod_123",
"name": "Blue Dream",
"revenue": 12500.00,
"quantity": 156
}
]
}
}

GET /admin/analytics/products
Query Parameters:

- startDate: ISO date
- endDate: ISO date
- sort: string (revenue, quantity, views)
- limit: number

Response: 200 OK
{
"data": [
{
"productId": "prod_123",
"name": "Blue Dream",
"category": "flower",
"views": 5420,
"addToCart": 487,
"purchases": 312,
"revenue": 9360.00,
"conversionRate": 5.75
}
]
}

AI Services Endpoints

POST /ai/product-description
Request:
{
"productName": "Blue Dream",
"category": "flower",
"cannabisInfo": {
"thc": 24.5,
"cbd": 0.8,
"strainType": "sativa-dominant hybrid",
"effects": ["uplifting", "creative"],
"flavors": ["berry", "sweet"]
}
}

Response: 200 OK
{
"data": {
"shortDescription": "Sativa-dominant hybrid...",
"longDescription": "Blue Dream is...",
"marketingCopy": "Experience the perfect...",
"seoMetaDescription": "Premium Blue Dream...",
"seoKeywords": ["blue dream", "sativa", "cannabis"]
}
}

POST /ai/recommendations
Request:
{
"customerId": "user_123",
"context": "product_page",
"productId": "prod_123"
}

Response: 200 OK
{
"data": {
"recommendations": [
{
"_id": "prod_456",
"name": "Green Crack",
"reason": "Similar effects and strain type"
}
],
"confidence": 0.85
}
}

POST /ai/chatbot
Request:
{
"message": "What's the difference between indica and sativa?",
"conversationId": "conv_123"
}

Response: 200 OK
{
"data": {
"reply": "Great question! Indica and sativa are...",
"conversationId": "conv_123",
"suggestedActions": [
{
"type": "view_product",
"label": "Browse Sativa Strains",
"data": { "category": "flower", "type": "sativa" }
}
],
"confidence": 0.92
}
}

POST /ai/inventory-forecast
Request:
{
"productId": "prod_123",
"variantId": "var_456",
"days": 30
}

Response: 200 OK
{
"data": {
"forecast": [
{ "date": "2024-01-21", "predictedDemand": 12 },
{ "date": "2024-01-22", "predictedDemand": 8 }
],
"recommendation": {
"shouldReorder": true,
"quantity": 200,
"urgency": "medium",
"reasoning": "Current stock will deplete in 15 days..."
}
}
}

Product Description Generation

const generateProductDescription = async (product) => {
const prompt = `
You are an expert cannabis product copywriter. Create compelling, accurate product descriptions.

Product Details:

- Name: ${product.name}
- Category: ${product.category}
- Strain Type: ${product.cannabisInfo.strain.type}
- THC: ${product.cannabisInfo.cannabinoids.thc.percentage}%
- CBD: ${product.cannabisInfo.cannabinoids.cbd.percentage}%
- Terpenes: ${product.cannabisInfo.terpenes.map(t => t.name).join(', ')}
- Effects: ${product.cannabisInfo.effects.primary.join(', ')}
- Flavors: ${product.cannabisInfo.flavors.join(', ')}

Generate:

1. Short description (50-75 words): Catchy, benefit-focused
2. Long description (150-200 words): Detailed effects, flavor profile, uses
3. Marketing copy (100-150 words): Compelling, highlights unique points
4. SEO meta description (150-160 characters)
5. SEO keywords (10-15 keywords)

Format as JSON:
{
"shortDescription": "...",
"longDescription": "...",
"marketingCopy": "...",
"seoMetaDescription": "...",
"seoKeywords": ["keyword1", "keyword2", ...]
}

Guidelines:

- Be accurate and compliant (no medical claims)
- Highlight unique characteristics
- Use sensory language for flavors/aromas
- Mention ideal use cases
- Keep tone friendly and informative
  `;

  const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' },
  temperature: 0.7
  });

  return JSON.parse(response.choices[0].message.content);
  };

Product Recommendations

const getAIRecommendations = async (userId, context) => {
const purchaseHistory = await getUserPurchaseHistory(userId);
const browsingHistory = await getUserBrowsingHistory(userId);

const prompt = `
You are an AI recommendation engine for a cannabis dispensary.

User Profile:

- Purchase History: ${JSON.stringify(purchaseHistory.slice(0, 10))}
- Recently Viewed: ${JSON.stringify(browsingHistory.slice(0, 10))}
- Preferences: ${JSON.stringify(await getUserPreferences(userId))}

Context: ${context}

Available Products: ${JSON.stringify(await getAvailableProducts())}

Recommend 5 products based on:

1. Past purchases (favorite strains, effects)
2. Price sensitivity
3. Consumption preferences
4. Similar customer behavior
5. Product availability

Return JSON array:
[
{
"productId": "...",
"reason": "Brief explanation",
"confidence": 0.85
}
]
`;

const response = await openai.chat.completions.create({
model: 'gpt-4-turbo',
messages: [{ role: 'user', content: prompt }],
response_format: { type: 'json_object' },
temperature: 0.3
});

return JSON.parse(response.choices[0].message.content);
};

Inventory Forecasting

const forecastInventoryDemand = async (productId, days = 30) => {
const salesData = await getSalesHistory(productId, 90);
const currentInventory = await getCurrentInventory(productId);

const prompt = `
You are an inventory forecasting AI.

Product ID: ${productId}

Historical Sales (last 90 days):
${JSON.stringify(salesData)}

Current Inventory: ${currentInventory.quantity} units

Forecast demand for the next ${days} days.

Consider:

1. Historical sales patterns
2. Day of week trends
3. Seasonal variations
4. Recent sales velocity
5. Lead time (7 days)

Return JSON:
{
"forecast": [
{ "date": "2024-01-21", "predictedDemand": 12 }
],
"summary": {
"totalPredictedDemand": 180,
"currentStock": 50,
"daysUntilStockout": 15,
"recommendedReorderQuantity": 200,
"urgency": "medium",
"reasoning": "..."
}
}
`;

const response = await openai.chat.completions.create({
model: 'gpt-4-turbo',
messages: [{ role: 'user', content: prompt }],
response_format: { type: 'json_object' },
temperature: 0.2
});

return JSON.parse(response.choices[0].message.content);
};

Customer Service Chatbot

const chatbotResponse = async (message, conversationHistory, context) => {
const systemPrompt = `
You are a helpful customer service assistant for Green Leaf Dispensary.

Capabilities:

- Answer product questions
- Help with order status
- Assist with account issues
- Provide cannabis education

Guidelines:

- Be friendly and professional
- Never make medical claims
- If unsure, offer to connect with human agent
- Keep responses concise

Knowledge:

- Hours: Mon-Sun 9 AM - 9 PM
- Delivery: $5 fee, free over $50
- Age requirement: 21+
  `;

  const messages = [
  { role: 'system', content: systemPrompt },
  ...conversationHistory,
  { role: 'user', content: message }
  ];

  const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo',
  messages: messages,
  temperature: 0.7,
  max_tokens: 500
  });

  return {
  reply: response.choices[0].message.content,
  confidence: 0.9
  };
  };

Review Sentiment Analysis

const analyzeReviewSentiment = async (review) => {
const prompt = `
Analyze this product review for sentiment.

Review: "${review}"

Return JSON:
{
"sentiment": "positive" | "neutral" | "negative" | "mixed",
"sentimentScore": -1 to 1,
"confidence": 0 to 1,
"keyPhrases": ["phrase1", "phrase2"],
"topics": ["quality", "value", "effects"],
"pros": ["positive aspect 1"],
"cons": ["negative aspect 1"],
"isSpam": false,
"isAuthentic": true
}
`;

const response = await openai.chat.completions.create({
model: 'gpt-4-turbo',
messages: [{ role: 'user', content: prompt }],
response_format: { type: 'json_object' },
temperature: 0.3
});

return JSON.parse(response.choices[0].message.content);
};

Dynamic Pricing Optimization

const suggestOptimalPricing = async (productId) => {
const product = await getProduct(productId);
const salesHistory = await getSalesHistory(productId);
const competitorPrices = await getCompetitorPricing(product);

const prompt = `
You are a pricing optimization AI.

Product: ${product.name}
Current Price: $${product.variants[0].pricing.basePrice}
Cost: $${product.variants[0].pricing.costPrice}
Current Inventory: ${product.variants[0].inventory.quantity}

Sales History: ${JSON.stringify(salesHistory)}
Competitor Prices: ${JSON.stringify(competitorPrices)}

Suggest optimal pricing considering:

1. Profit margin (min 30%, target 40-50%)
2. Competitive positioning
3. Sales velocity
4. Inventory levels

Return JSON:
{
"recommendedPrice": 29.99,
"expectedImpact": {
"salesVolumeChange": "+25%",
"revenueChange": "+8%",
"profitMargin": 42
},
"reasoning": "...",
"confidence": 0.85
}
`;

const response = await openai.chat.completions.create({
model: 'gpt-4-turbo',
messages: [{ role: 'user', content: prompt }],
response_format: { type: 'json_object' },
temperature: 0.4
});

return JSON.parse(response.choices[0].message.content);
};

Phase 0: Prototype (Weeks 1-3)

Goal
Validate core concept with minimal working demo

Week 1: Setup & Infrastructure
· Set up development environment (Node.js, MongoDB, Redis, React)
· Initialize Git repository
· Configure project structure (monorepo)
· Configure TypeScript, ESLint, Prettier
· Create basic Express server
· Connect MongoDB Atlas and Redis Cloud
· Create React app with Vite

Deliverable: Running development environment

Week 2: Basic Multi-Tenancy & Auth
· Implement Organization model
· Implement User model (basic)
· JWT authentication (login/register)
· Tenant middleware (subdomain routing)
· Basic admin dashboard UI
· Organization creation flow

Deliverable: Organizations and users, login functional

Week 3: Simple Product & Order Flow
· Product model (simplified)
· Basic product CRUD
· Simple cart (Redis-based)
· Checkout flow (no payment)
· Order creation
· Product listing and detail pages

Deliverable: Browse products, add to cart, create orders

Prototype Success Criteria:
· ✅ 2 test organizations created
· ✅ Products displayed and functional
· ✅ Orders created (without payment)
· ✅ Unique branding per organization
· ✅ Demo-ready for 5 potential customers

---

Phase 1: MVP (Weeks 4-16)

Goal
Launch-ready product with core features

Weeks 4-5: Complete Auth & User Management
· Email verification
· Password reset
· Complete user profiles
· Address management
· Role-based access control
· Session management

Deliverable: Full user account system

Weeks 6-7: Complete Product Management
· Product variants
· Image upload (S3/Cloudflare R2)
· Categories & subcategories
· Cannabis-specific fields
· Basic inventory tracking
· Search & filters

Deliverable: Full product catalog

Weeks 8-9: Cart & Checkout
· Persistent cart (database + Redis)
· Cart validations
· Multi-step checkout
· Basic coupon application
· Tax calculation
· Delivery/pickup selection

Deliverable: Complete checkout flow

Week 10: Payment Integration
· Stripe integration (cards, payment intents, webhooks)
· Cash payment option
· Payment method management
· Receipt generation

Deliverable: Functional payments

Week 11: Order Management
· Order processing workflow
· Order status tracking
· Staff order management UI
· Order history
· Email notifications
· Basic analytics

Deliverable: Complete order fulfillment

Week 12: Compliance Basics
· Age verification (manual)
· Purchase limit tracking
· Terms acceptance
· Privacy policy
· Compliance logs

Deliverable: Basic compliance

Weeks 13-14: Admin Dashboard
· Dashboard overview (sales, orders, customers)
· Product management UI
· Order management UI
· Customer list
· Basic analytics charts
· Settings

Deliverable: Functional admin panel

Weeks 15-16: Polish & Testing
· Bug fixes
· UI/UX improvements
· Mobile responsiveness
· Performance optimization
· Security audit
· Load testing
· Documentation

Deliverable: Production-ready MVP

MVP Success Criteria:
· ✅ 3-5 beta customers operational
· ✅ Customers can browse, order, pay
· ✅ Staff can manage orders/inventory
· ✅ Basic compliance met
· ✅ Mobile-friendly
· ✅ <2 second page loads
· ✅ 99.9% uptime

MVP Launch: Week 16
Target: 5 beta dispensaries

---

Phase 2: Feature Release 1 (Weeks 17-20)

Goal
Enhanced commerce features

Week 17: Product Enhancements
· Product reviews & ratings
· Basic recommendations
· Related products
· Product bundles
· Out-of-stock waitlist

Deliverable: Enhanced product discovery

Week 18: Loyalty Program
· Points earning on purchases
· Points redemption
· Loyalty tiers (Bronze, Silver, Gold)
· Customer loyalty dashboard
· Admin loyalty management

Deliverable: Basic loyalty program

Week 19: Promotions & Coupons
· Advanced coupon system
· Automatic sales
· Flash sales
· Happy hour pricing
· Bulk discounts

Deliverable: Complete promotion engine

Week 20: Marketing Features
· Email marketing integration
· Email templates
· Abandoned cart recovery
· Customer segmentation
· Referral tracking

Deliverable: Basic marketing automation

Release 1 Metrics:
· 15% increase in AOV
· 10% increase in repeat purchases
· 20% email open rate
· 50+ active users

---

Phase 3: Feature Release 2 (Weeks 21-24)

Goal
Streamline operations

Week 21: Inventory Management
· Low stock alerts
· Reorder point automation
· Multi-location inventory
· Inventory transfers
· Batch/lot tracking
· Inventory reports

Deliverable: Professional inventory system

Week 22: Delivery Management
· Driver assignment
· Route optimization
· Real-time tracking
· Delivery zones & fees
· Curbside pickup
· Delivery proof

Deliverable: Complete delivery management

Week 23: Advanced Analytics
· Sales analytics dashboard
· Product performance reports
· Customer insights
· Cohort analysis
· Revenue forecasting
· Export capabilities

Deliverable: Professional analytics

Week 24: Staff Management
· Staff accounts & permissions
· Staff scheduling
· Performance tracking
· Activity logs
· Multi-location support

Deliverable: Staff management system

Release 2 Metrics:
· 30% faster order fulfillment
· 50% reduction in stockouts
· 20% improvement in delivery accuracy
· 10+ paying customers

---

Phase 4: Feature Release 3 (Weeks 25-28)

Goal
AI & automation advantage

Week 25: AI Product Features
· AI product descriptions
· AI-powered search
· Smart recommendations
· Auto-tagging
· Image recognition

Deliverable: AI content generation

Week 26: AI Customer Service
· Customer service chatbot
· FAQ auto-response
· Sentiment analysis
· Ticket auto-categorization
· Suggested staff responses

Deliverable: AI customer support

Week 27: AI Business Intelligence
· Demand forecasting
· Price optimization
· Churn prediction
· Next best action
· Campaign optimization

Deliverable: AI business insights

Week 28: Automation
· Automated reordering
· Automated marketing
· Smart inventory allocation
· Auto-pricing
· Workflow automation

Deliverable: Business automation suite

Release 3 Metrics:
· 40% reduction in manual content creation
· 25% increase in AI-driven conversions
· 30% improvement in inventory turns
· 50+ paying customers

---

Phase 5: Feature Release 4 (Weeks 29-32)

Goal
Recurring revenue & premium features

Week 29: Subscription Orders
· Recurring order setup
· Subscription management
· Payment automation
· Subscription discounts
· Pause/skip/cancel flows

Deliverable: Full subscription system

Week 30: Mobile App
· iOS app (React Native)
· Android app
· Push notifications
· Offline mode
· App-specific features
· App store submissions

Deliverable: Native mobile apps

Week 31: API & Integrations
· Public REST API
· API documentation
· Webhooks
· Third-party integrations (QuickBooks, Square, Mailchimp)
· Zapier integration

Deliverable: Developer platform

Week 32: White Label & Enterprise
· White-label customization
· Custom domains
· Enterprise SSO
· Advanced permissions
· Franchise management
· Multi-currency

Deliverable: Enterprise features

Release 4 Metrics:
· 20% of customers have subscriptions
· 10K+ mobile app downloads
· 5+ API integrations
· 100+ paying customers
· $50K+ MRR

---

Phase 6: Feature Release 5 (Weeks 33-36)

Goal
Full compliance & enterprise scale

Week 33: Advanced Compliance
· METRC integration
· Automated compliance reporting
· ID scanning (Veratad/Jumio)
· Multi-state compliance
· Enhanced audit trails
· Legal document management

Deliverable: Complete compliance suite

Week 34: Advanced CRM
· Customer journey tracking
· Lifecycle automation
· Win-back campaigns
· VIP program
· Customer health scores
· Predictive analytics

Deliverable: Enterprise CRM

Week 35: Gift Cards & Credits
· Digital gift cards
· Physical gift cards
· Store credit system
· Gift card analytics
· Fraud prevention

Deliverable: Gift card system

Week 36: Performance & Scale
· Database optimization
· Caching improvements
· CDN optimization
· Load balancing
· Auto-scaling
· Disaster recovery

Deliverable: Enterprise infrastructure

Release 5 Metrics:
· Full METRC compliance in 5+ states
· 99.99% uptime
· <500ms API response
· 500+ paying customers
· $200K+ MRR

---

Development Team Recommendations

Solo Developer
· **Prototype**: 3 weeks ✅
· **MVP**: 16 weeks (4 months) ⚠️ Aggressive
· **Full Release**: 12-18 months

Focus: MVP first, iterate based on feedback

Small Team (2-3 developers)
· **Prototype**: 2 weeks
· **MVP**: 8-10 weeks (2.5 months)
· **Full Release**: 6-9 months

Roles: 1 frontend, 1 backend, 1 full-stack/DevOps

Full Team (4-6 developers)
· **Prototype**: 1 week
· **MVP**: 6-8 weeks (2 months)
· **Full Release**: 4-6 months

Roles: 2 frontend, 2 backend, 1 DevOps, 1 QA

Beta Launch (Week 16 - MVP)

Target: 5 dispensaries
Pricing: Free (feedback exchange)
Duration: 4 weeks

Goals:
· Validate product-market fit
· Identify bugs
· Gather feature requests
· Generate testimonials

Soft Launch (Week 20 - Release 1)

Target: 25 dispensaries
Pricing: 50% discount ($99/month)
Duration: 8 weeks

Goals:
· Scale infrastructure
· Refine onboarding
· Build case studies
· Iterate on feedback

Public Launch (Week 28 - Release 3)

Target: 100+ dispensaries
Pricing: Full pricing tiers

Marketing:
· Content marketing
· SEO optimization
· Industry events (MJBizCon)
· Strategic partnerships
· Paid advertising

---

Success Metrics by Phase

Phase Customers MRR Churn NPS
MVP 5 $0 N/A N/A
Release 1 15 $2K <10% >40
Release 2 50 $15K <8% >50
Release 3 100 $35K <5% >60
Release 4 250 $85K <5% >70
Release 5 500 $200K <3% >75

Technical Risks

Risk: Database performance degrades
Mitigation: Plan for sharding, implement caching early

Risk: Third-party API outages
Mitigation: Implement retry logic, fallbacks, monitoring

Business Risks

Risk: Legal/compliance changes
Mitigation: Stay updated, flexible architecture, legal counsel

Risk: Competition
Mitigation: Superior UX, AI features, customer service

Resource Risks

Risk: Developer burnout
Mitigation: Hire contractor help, manage scope carefully

Glossary

Multi-Tenancy: Architecture where single instance serves multiple customers
METRC: State cannabis tracking system
JWT: JSON Web Token for authentication
RBAC: Role-Based Access Control
CDN: Content Delivery Network
SaaS: Software as a Service
MRR: Monthly Recurring Revenue
AOV: Average Order Value
CAC: Customer Acquisition Cost
LTV: Lifetime Value
NPS: Net Promoter Score

Additional Resources

· MongoDB Documentation: https://docs.mongodb.com
· Stripe API: https://stripe.com/docs/api
· React Documentation: https://react.dev
· OpenAI API: https://platform.openai.com/docs
· METRC API: https://api-ca.metrc.com/Documentation
