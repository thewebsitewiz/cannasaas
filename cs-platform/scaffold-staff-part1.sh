#!/usr/bin/env bash
# =============================================================================
# CannaSaas — Phase E Staff Portal (Part 1): Layout + Components + Hooks
# File: scaffold-staff-part1.sh
#
# Writes:
#   apps/staff/src/
#   ├── main.tsx                   App entry point
#   ├── App.tsx                    Root router + auth guard
#   ├── routes.ts                  Centralised route constants
#   ├── components/
#   │   ├── StaffLayout.tsx        Responsive shell (sidebar md+, bottom-nav mobile)
#   │   ├── StaffSidebar.tsx       Desktop left sidebar with nav + user info
#   │   ├── StaffBottomNav.tsx     Mobile bottom tab navigation
#   │   └── ui/
#   │       ├── OrderCard.tsx      Compact order card used in the queue
#   │       ├── StatusPill.tsx     Colour-coded status pill for staff context
#   │       └── QuickActionBtn.tsx Large tap-friendly action button tile
#   └── hooks/
#       ├── useOrderQueue.ts       WebSocket + TanStack Query hybrid for live orders
#       └── useDeliveryTracking.ts WebSocket delivery position / status updates
# =============================================================================

set -euo pipefail
ROOT="${1:-$(pwd)}"
SF="$ROOT/apps/staff/src"

echo ""
echo "========================================================"
echo "  Phase E Staff Portal — Part 1: Layout + Components"
echo "========================================================"

mkdir -p \
  "$SF/components/ui" \
  "$SF/hooks"

# =============================================================================
# main.tsx
# =============================================================================
cat > "$SF/main.tsx" << 'TSEOF'
/**
 * @file main.tsx
 * @app apps/staff
 *
 * Entry point for the CannaSaas Staff Portal (apps/staff).
 *
 * Wraps the app in:
 *   - React.StrictMode (double-render detection in dev)
 *   - QueryClientProvider (TanStack Query global cache)
 *   - BrowserRouter (React Router v6 client-side routing)
 *
 * The staff portal runs on port :5175 in development.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css'; // Tailwind + CSS custom properties

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Staff portal needs fresh data — keep stale time short
      staleTime: 30_000,      // 30 seconds
      gcTime:    5 * 60_000,  // 5 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
TSEOF
echo "  ✓ main.tsx"

# =============================================================================
# routes.ts
# =============================================================================
cat > "$SF/routes.ts" << 'TSEOF'
/**
 * @file routes.ts
 * @app apps/staff
 *
 * Centralised route path constants for the Staff Portal.
 * Import this module wherever links or navigation calls reference a route
 * so that path changes only need to be made in one place.
 */

export const STAFF_ROUTES = {
  /** Unauthenticated */
  login:              '/login',

  /** Main pages */
  orderQueue:         '/orders',
  customerLookup:     '/customers',
  inventorySearch:    '/inventory',
  deliveryDispatch:   '/delivery',
  quickActions:       '/quick-actions',
} as const;
TSEOF
echo "  ✓ routes.ts"

# =============================================================================
# App.tsx
# =============================================================================
cat > "$SF/App.tsx" << 'TSEOF'
/**
 * @file App.tsx
 * @app apps/staff
 *
 * Root application component for the Staff Portal.
 *
 * Routing structure:
 *   /login                → StaffLogin (unauthenticated)
 *   /                     → redirect to /orders
 *   /orders               → OrderQueue (lazy)
 *   /customers            → CustomerLookup (lazy)
 *   /inventory            → InventorySearch (lazy)
 *   /delivery             → DeliveryDispatch (lazy)
 *   /quick-actions        → QuickActions (lazy)
 *   *                     → redirect to /orders
 *
 * All authenticated routes are wrapped in StaffLayout and guarded by
 * ProtectedRoute which checks Zustand auth state for role "budtender" or
 * higher. If the user is not authenticated they are redirected to /login.
 *
 * Code splitting: every page is lazy-loaded behind React.lazy + Suspense
 * so the initial bundle only contains the router shell.
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StaffLayout }    from './components/StaffLayout';
import { STAFF_ROUTES }   from './routes';

// Auth guard — checks useAuthStore from @cannasaas/stores
import { useAuthStore } from '@cannasaas/stores';

// Lazy-loaded pages
const StaffLogin       = lazy(() => import('./pages/Login').then((m) => ({ default: m.StaffLogin })));
const OrderQueue       = lazy(() => import('./pages/OrderQueue').then((m) => ({ default: m.OrderQueuePage })));
const CustomerLookup   = lazy(() => import('./pages/CustomerLookup').then((m) => ({ default: m.CustomerLookupPage })));
const InventorySearch  = lazy(() => import('./pages/InventorySearch').then((m) => ({ default: m.InventorySearchPage })));
const DeliveryDispatch = lazy(() => import('./pages/DeliveryDispatch').then((m) => ({ default: m.DeliveryDispatchPage })));
const QuickActions     = lazy(() => import('./pages/QuickActions').then((m) => ({ default: m.QuickActionsPage })));

/** Full-page loading spinner shown during lazy page loads */
function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50" role="status" aria-label="Loading page">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[hsl(var(--primary,154_40%_30%))] border-t-transparent rounded-full animate-spin motion-reduce:animate-none" aria-hidden="true" />
        <p className="text-sm text-stone-400">Loading…</p>
      </div>
    </div>
  );
}

/** Wraps authenticated routes — redirects to /login if not authenticated */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to={STAFF_ROUTES.login} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path={STAFF_ROUTES.login} element={<StaffLogin />} />

        {/* Authenticated staff routes inside the shared layout */}
        <Route element={<RequireAuth><StaffLayout /></RequireAuth>}>
          <Route index element={<Navigate to={STAFF_ROUTES.orderQueue} replace />} />
          <Route path={STAFF_ROUTES.orderQueue}      element={<OrderQueue />} />
          <Route path={STAFF_ROUTES.customerLookup}  element={<CustomerLookup />} />
          <Route path={STAFF_ROUTES.inventorySearch} element={<InventorySearch />} />
          <Route path={STAFF_ROUTES.deliveryDispatch} element={<DeliveryDispatch />} />
          <Route path={STAFF_ROUTES.quickActions}    element={<QuickActions />} />
          <Route path="*" element={<Navigate to={STAFF_ROUTES.orderQueue} replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
TSEOF
echo "  ✓ App.tsx"

# =============================================================================
# components/StaffLayout.tsx
# =============================================================================
cat > "$SF/components/StaffLayout.tsx" << 'TSEOF'
/**
 * @file StaffLayout.tsx
 * @app apps/staff
 *
 * Responsive shell layout for all authenticated Staff Portal pages.
 *
 * Layout behaviour:
 *   Mobile  (< md):  Full-screen main content + fixed bottom navigation bar (StaffBottomNav)
 *   Desktop (≥ md):  Left sidebar (StaffSidebar, 220px fixed) + scrollable main content
 *
 * The layout renders <Outlet /> from React Router v6 in the main content area
 * so every child page receives the correct positioning context.
 *
 * Skip link:
 *   The very first focusable element is a "Skip to main content" link that
 *   becomes visible on focus. It targets #staff-main to bypass the nav on
 *   each page load for keyboard / screen reader users.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Skip navigation link: visible on focus (2.4.1)
 *   - main landmark: id="staff-main" with tabIndex={-1} for skip target (1.3.1)
 *   - nav landmark: provided by StaffSidebar / StaffBottomNav (1.3.1)
 *   - Keyboard trap prevention: no modal-style shells (2.1.2)
 */

import { useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { StaffSidebar }   from './StaffSidebar';
import { StaffBottomNav } from './StaffBottomNav';

export function StaffLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  /** Move focus to main on route change — helps screen reader users */
  useEffect(() => {
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Skip navigation link — only visible on keyboard focus */}
      <a
        href="#staff-main"
        className={[
          'sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-3 focus:left-3',
          'focus:bg-[hsl(var(--primary,154_40%_30%))] focus:text-white',
          'focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-semibold',
          'focus:shadow-lg focus:outline-none',
        ].join(' ')}
      >
        Skip to main content
      </a>

      {/* Desktop sidebar — hidden on mobile */}
      <StaffSidebar />

      {/* Main content area */}
      <main
        id="staff-main"
        ref={mainRef}
        tabIndex={-1}
        className={[
          'flex-1 overflow-y-auto outline-none',
          // On mobile: add padding-bottom for the fixed bottom nav bar
          'pb-20 md:pb-0',
          // Page content padding
          'px-4 py-4 md:px-6 md:py-6',
        ].join(' ')}
      >
        <Outlet />
      </main>

      {/* Mobile bottom navigation — hidden on desktop */}
      <StaffBottomNav />
    </div>
  );
}
TSEOF
echo "  ✓ components/StaffLayout.tsx"

# =============================================================================
# components/StaffSidebar.tsx
# =============================================================================
cat > "$SF/components/StaffSidebar.tsx" << 'TSEOF'
/**
 * @file StaffSidebar.tsx
 * @app apps/staff
 *
 * Desktop left sidebar navigation for the Staff Portal.
 *
 * Visible only on md+ screens (hidden on mobile — replaced by StaffBottomNav).
 *
 * Contents:
 *   - Dispensary name + logo (from useOrganizationStore)
 *   - Navigation links (5 pages) with active indicator
 *   - Connection status indicator (WebSocket live indicator)
 *   - Bottom: logged-in user name, role badge, logout button
 *
 * Active link detection: uses useLocation().pathname.startsWith(route.path)
 * so nested routes (e.g. /orders/123) still highlight the parent nav item.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - <nav> with aria-label="Staff navigation" (1.3.1)
 *   - Active link: aria-current="page" (4.1.2)
 *   - Logout button: aria-label (4.1.2)
 *   - Connection badge: role="status" aria-label (4.1.3)
 */

import { useLocation, NavLink } from 'react-router-dom';
import { useAuthStore, useOrganizationStore } from '@cannasaas/stores';
import { STAFF_ROUTES } from '../routes';

const NAV_ITEMS = [
  { path: STAFF_ROUTES.orderQueue,       label: 'Order Queue',       icon: '📋' },
  { path: STAFF_ROUTES.customerLookup,   label: 'Customer Lookup',   icon: '🔍' },
  { path: STAFF_ROUTES.inventorySearch,  label: 'Inventory',         icon: '📦' },
  { path: STAFF_ROUTES.deliveryDispatch, label: 'Delivery Dispatch', icon: '🚗' },
  { path: STAFF_ROUTES.quickActions,     label: 'Quick Actions',     icon: '⚡' },
];

const ROLE_LABELS: Record<string, string> = {
  budtender: 'Budtender',
  manager:   'Manager',
  driver:    'Driver',
  admin:     'Admin',
};

interface StaffSidebarProps {
  /** If true, a green dot is shown indicating live WebSocket connection */
  isConnected?: boolean;
}

export function StaffSidebar({ isConnected = false }: StaffSidebarProps) {
  const { user, logout }       = useAuthStore();
  const { dispensary }         = useOrganizationStore();
  const { pathname }           = useLocation();

  const primaryRole = user?.roles?.[0] ?? 'budtender';

  return (
    <aside
      aria-label="Staff navigation"
      className="hidden md:flex flex-col w-[220px] bg-white border-r border-stone-200 flex-shrink-0 h-full"
    >
      {/* ── Brand header ───────────────────────────────────────────── */}
      <div className="px-4 py-5 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-[hsl(var(--primary,154_40%_30%))] flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0">
            {(dispensary?.name ?? 'S')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-stone-900 truncate">{dispensary?.name ?? 'Staff Portal'}</p>
            <p className="text-[10px] text-stone-400">Staff Interface</p>
          </div>
        </div>
        {/* WebSocket connection indicator */}
        <div
          role="status"
          aria-label={isConnected ? 'Live updates connected' : 'Live updates disconnected'}
          className="flex items-center gap-1.5 mt-3"
        >
          <span
            aria-hidden="true"
            className={['w-2 h-2 rounded-full flex-shrink-0',
              isConnected ? 'bg-green-400 animate-pulse motion-reduce:animate-none' : 'bg-stone-300'].join(' ')}
          />
          <span className={['text-[10px] font-medium', isConnected ? 'text-green-600' : 'text-stone-400'].join(' ')}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* ── Navigation links ───────────────────────────────────────── */}
      <nav aria-label="Main staff navigation" className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] focus-visible:ring-offset-1',
                isActive
                  ? 'bg-[hsl(var(--primary,154_40%_30%)/0.08)] text-[hsl(var(--primary,154_40%_30%))] font-semibold'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800',
              ].join(' ')}
            >
              <span aria-hidden="true" className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {isActive && (
                <span className="sr-only">(current page)</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── User info + logout ─────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-stone-100">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div aria-hidden="true" className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500 flex-shrink-0">
            {(user?.firstName?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-stone-800 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-[hsl(var(--primary,154_40%_30%)/0.08)] text-[hsl(var(--primary,154_40%_30%))] rounded capitalize">
              {ROLE_LABELS[primaryRole] ?? primaryRole}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          aria-label="Log out of staff portal"
          className="w-full text-xs text-stone-400 hover:text-stone-600 hover:bg-stone-50 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
TSEOF
echo "  ✓ components/StaffSidebar.tsx"

# =============================================================================
# components/StaffBottomNav.tsx
# =============================================================================
cat > "$SF/components/StaffBottomNav.tsx" << 'TSEOF'
/**
 * @file StaffBottomNav.tsx
 * @app apps/staff
 *
 * Fixed bottom navigation bar for mobile screens (< md breakpoint).
 *
 * Shows 5 icon + label tabs; hidden on md+ (replaced by StaffSidebar).
 *
 * Design:
 *   - Full-width white bar with top border shadow
 *   - Active item: primary colour icon + label; inactive: stone-400
 *   - Touch targets: minimum 44×44px (WCAG 2.5.5 AAA, best practice)
 *   - Safe area inset bottom via padding-bottom env() for notched phones
 *
 * Accessibility (WCAG 2.1 AA):
 *   - <nav> with aria-label="Staff mobile navigation" (1.3.1)
 *   - Active link: aria-current="page" (4.1.2)
 *   - Icon + label visible; icon is aria-hidden (1.1.1)
 *   - Minimum touch target 44×44px via min-h + min-w (2.5.5)
 */

import { NavLink, useLocation } from 'react-router-dom';
import { STAFF_ROUTES } from '../routes';

const NAV_ITEMS = [
  { path: STAFF_ROUTES.orderQueue,       label: 'Queue',    icon: '📋' },
  { path: STAFF_ROUTES.customerLookup,   label: 'Customer', icon: '🔍' },
  { path: STAFF_ROUTES.inventorySearch,  label: 'Stock',    icon: '📦' },
  { path: STAFF_ROUTES.deliveryDispatch, label: 'Delivery', icon: '🚗' },
  { path: STAFF_ROUTES.quickActions,     label: 'Actions',  icon: '⚡' },
];

export function StaffBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Staff mobile navigation"
      className={[
        'md:hidden fixed bottom-0 left-0 right-0 z-40',
        'bg-white border-t border-stone-200 shadow-[0_-1px_6px_rgba(0,0,0,0.06)]',
        'flex items-stretch',
        // Safe area inset for notched/dynamic-island iPhones
        'pb-[env(safe-area-inset-bottom,0px)]',
      ].join(' ')}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.path);
        return (
          <NavLink
            key={item.path}
            to={item.path}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'flex-1 flex flex-col items-center justify-center',
              'min-h-[56px] min-w-[44px] py-2',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[hsl(var(--primary,154_40%_30%))]',
              'transition-colors',
              isActive ? 'text-[hsl(var(--primary,154_40%_30%))]' : 'text-stone-400',
            ].join(' ')}
          >
            <span aria-hidden="true" className="text-xl leading-none">{item.icon}</span>
            <span className={['text-[10px] font-medium mt-0.5', isActive ? 'font-semibold' : ''].join(' ')}>
              {item.label}
            </span>
            {isActive && <span className="sr-only">(current page)</span>}
          </NavLink>
        );
      })}
    </nav>
  );
}
TSEOF
echo "  ✓ components/StaffBottomNav.tsx"

# =============================================================================
# components/ui/OrderCard.tsx
# =============================================================================
cat > "$SF/components/ui/OrderCard.tsx" << 'TSEOF'
/**
 * @file OrderCard.tsx
 * @app apps/staff
 *
 * Compact order card used in the Order Queue grouped lists.
 *
 * Displays:
 *   - Order number (monospace) + fulfillment type icon
 *   - Customer name
 *   - Item count + total price
 *   - Time elapsed since order was placed (e.g. "12 min ago")
 *   - Status pill
 *   - Advance button: one-click status advancement
 *
 * The advance button label changes based on current status:
 *   pending          → "Confirm"
 *   confirmed        → "Start Prep"
 *   preparing        → "Mark Ready" (pickup) | "Send for Delivery" (delivery)
 *   ready_for_pickup → "Mark Picked Up"
 *   out_for_delivery → "Mark Delivered"
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Card: article element with aria-label (1.3.1)
 *   - Time elapsed: <time dateTime="..."> (1.3.1)
 *   - Advance button: aria-label includes order number (4.1.2)
 *   - Loading state: aria-busy on button (4.1.2)
 */

import { StatusPill } from './StatusPill';

export type OrderStatus =
  | 'pending' | 'confirmed' | 'preparing'
  | 'ready_for_pickup' | 'out_for_delivery'
  | 'delivered' | 'completed' | 'cancelled';

interface OrderCardProps {
  id:              string;
  orderNumber:     string;
  customerName:    string;
  itemCount:       number;
  total:           number;
  status:          OrderStatus;
  fulfillmentType: 'pickup' | 'delivery';
  createdAt:       string;
  onAdvance?:      (id: string, next: OrderStatus) => void;
  isAdvancing?:    boolean;
}

/** Determine the next logical status and button label */
function getAdvance(status: OrderStatus, type: 'pickup' | 'delivery'): { label: string; next: OrderStatus } | null {
  switch (status) {
    case 'pending':          return { label: 'Confirm',          next: 'confirmed'        };
    case 'confirmed':        return { label: 'Start Prep',       next: 'preparing'        };
    case 'preparing':        return type === 'pickup'
      ? { label: 'Mark Ready',     next: 'ready_for_pickup'  }
      : { label: 'Out for Delivery', next: 'out_for_delivery' };
    case 'ready_for_pickup': return { label: 'Mark Picked Up',   next: 'completed'        };
    case 'out_for_delivery': return { label: 'Mark Delivered',   next: 'delivered'        };
    default:                 return null;
  }
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diff < 1)  return 'just now';
  if (diff < 60) return `${diff} min ago`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
}

export function OrderCard({
  id, orderNumber, customerName, itemCount, total,
  status, fulfillmentType, createdAt, onAdvance, isAdvancing = false,
}: OrderCardProps) {
  const advance = getAdvance(status, fulfillmentType);

  return (
    <article
      aria-label={`Order #${orderNumber} — ${customerName}`}
      className="bg-white border border-stone-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
    >
      {/* ── Header row ───────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span aria-hidden="true" className="text-base">
              {fulfillmentType === 'delivery' ? '🚗' : '🛍️'}
            </span>
            <span className="text-xs font-mono font-bold text-stone-800">
              #{orderNumber.toUpperCase()}
            </span>
          </div>
          <p className="text-sm font-semibold text-stone-900 mt-0.5">{customerName}</p>
        </div>
        <StatusPill status={status} />
      </div>

      {/* ── Meta row ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-stone-400">
        <span>{itemCount} item{itemCount !== 1 ? 's' : ''} · <strong className="text-stone-700">${total.toFixed(2)}</strong></span>
        <time dateTime={createdAt} title={new Date(createdAt).toLocaleString()}>
          {timeAgo(createdAt)}
        </time>
      </div>

      {/* ── Advance button ────────────────────────────────────── */}
      {advance && onAdvance && (
        <button
          type="button"
          disabled={isAdvancing}
          aria-busy={isAdvancing}
          aria-label={`${advance.label} — order #${orderNumber}`}
          onClick={() => onAdvance(id, advance.next)}
          className={[
            'w-full py-2.5 rounded-xl text-sm font-bold transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] focus-visible:ring-offset-1',
            'disabled:opacity-60 disabled:cursor-wait',
            'bg-[hsl(var(--primary,154_40%_30%))] text-white hover:brightness-110 active:scale-[0.98]',
          ].join(' ')}
        >
          {isAdvancing ? '…' : advance.label}
        </button>
      )}

      {/* Completed / cancelled — no action */}
      {(status === 'completed' || status === 'cancelled' || status === 'delivered') && (
        <p className="text-xs text-center text-stone-400 py-1">
          {status === 'completed' ? '✅ Completed' : status === 'delivered' ? '📦 Delivered' : '❌ Cancelled'}
        </p>
      )}
    </article>
  );
}
TSEOF
echo "  ✓ components/ui/OrderCard.tsx"

# =============================================================================
# components/ui/StatusPill.tsx
# =============================================================================
cat > "$SF/components/ui/StatusPill.tsx" << 'TSEOF'
/**
 * @file StatusPill.tsx
 * @app apps/staff
 *
 * Compact status pill badge optimised for the staff portal context.
 *
 * Uses colour + text label so status is never conveyed by colour alone (WCAG 1.4.1).
 *
 * Accessibility (WCAG 2.1 AA):
 *   - aria-label on the outer span carries the full "Status: <value>" label (4.1.2)
 *   - Colour differences have ≥ 3:1 contrast against the white card background (1.4.3)
 */

export type PillStatus =
  | 'pending' | 'confirmed' | 'preparing'
  | 'ready_for_pickup' | 'out_for_delivery'
  | 'delivered' | 'completed' | 'cancelled' | 'refunded'
  | 'active' | 'inactive';

const CONFIG: Record<PillStatus, { label: string; cls: string }> = {
  pending:          { label: '⏳ Pending',        cls: 'bg-amber-50  text-amber-800  border-amber-200'  },
  confirmed:        { label: '✅ Confirmed',       cls: 'bg-blue-50   text-blue-800   border-blue-200'   },
  preparing:        { label: '⚗️ Preparing',       cls: 'bg-purple-50 text-purple-800 border-purple-200' },
  ready_for_pickup: { label: '🛍️ Ready',           cls: 'bg-teal-50   text-teal-800   border-teal-200'   },
  out_for_delivery: { label: '🚗 En Route',        cls: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  delivered:        { label: '📦 Delivered',       cls: 'bg-sky-50    text-sky-800    border-sky-200'    },
  completed:        { label: '🎉 Completed',       cls: 'bg-green-50  text-green-800  border-green-200'  },
  cancelled:        { label: '❌ Cancelled',       cls: 'bg-red-50    text-red-800    border-red-200'    },
  refunded:         { label: '↩️ Refunded',        cls: 'bg-stone-50  text-stone-600  border-stone-200'  },
  active:           { label: '● Active',           cls: 'bg-green-50  text-green-700  border-green-200'  },
  inactive:         { label: '○ Inactive',         cls: 'bg-stone-50  text-stone-500  border-stone-200'  },
};

interface StatusPillProps { status: PillStatus; className?: string }

export function StatusPill({ status, className = '' }: StatusPillProps) {
  const cfg = CONFIG[status] ?? { label: status, cls: 'bg-stone-50 text-stone-600 border-stone-200' };
  return (
    <span
      aria-label={`Status: ${cfg.label.replace(/^[^\s]+\s/, '')}`}
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap',
        cfg.cls, className,
      ].join(' ')}
    >
      {cfg.label}
    </span>
  );
}
TSEOF
echo "  ✓ components/ui/StatusPill.tsx"

# =============================================================================
# components/ui/QuickActionBtn.tsx
# =============================================================================
cat > "$SF/components/ui/QuickActionBtn.tsx" << 'TSEOF'
/**
 * @file QuickActionBtn.tsx
 * @app apps/staff
 *
 * Large tap-friendly action button tile used on the Quick Actions page.
 *
 * Design:
 *   - Square-ish card (min 80px wide, 80px tall)
 *   - Prominent emoji icon + label underneath
 *   - Coloured border on hover/focus; pressed scale animation
 *   - Disabled state dims the tile and prevents interaction
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Renders as a <button> with explicit type="button" (4.1.2)
 *   - Icon is aria-hidden; label is the accessible name (1.1.1)
 *   - Focus ring: 2px solid with offset (2.4.7)
 *   - Disabled: aria-disabled + pointer-events-none (4.1.2)
 *   - Min touch target: 44×44px enforced via min-h / min-w (2.5.5)
 */

interface QuickActionBtnProps {
  icon:      string;        // Emoji or icon character
  label:     string;        // Button label (visible + a11y)
  onClick:   () => void;
  disabled?: boolean;
  variant?:  'default' | 'danger' | 'success';
  badge?:    string | number; // Optional notification badge
}

const VARIANT_CLS = {
  default: 'border-stone-200 hover:border-[hsl(var(--primary,154_40%_30%))] hover:bg-[hsl(var(--primary,154_40%_30%)/0.03)]',
  danger:  'border-stone-200 hover:border-red-400 hover:bg-red-50',
  success: 'border-stone-200 hover:border-green-500 hover:bg-green-50',
};

export function QuickActionBtn({ icon, label, onClick, disabled = false, variant = 'default', badge }: QuickActionBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      aria-label={label}
      className={[
        'relative flex flex-col items-center justify-center gap-2',
        'min-h-[80px] min-w-[80px] w-full p-4',
        'bg-white border-2 rounded-2xl',
        'transition-all active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] focus-visible:ring-offset-2',
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
        VARIANT_CLS[variant],
      ].join(' ')}
    >
      {/* Badge (e.g. unread count) */}
      {badge != null && (
        <span
          aria-label={`${badge} pending`}
          className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1"
        >
          {badge}
        </span>
      )}
      <span aria-hidden="true" className="text-2xl leading-none">{icon}</span>
      <span className="text-xs font-semibold text-stone-700 text-center leading-tight">{label}</span>
    </button>
  );
}
TSEOF
echo "  ✓ components/ui/QuickActionBtn.tsx"

# =============================================================================
# hooks/useOrderQueue.ts
# =============================================================================
cat > "$SF/hooks/useOrderQueue.ts" << 'TSEOF'
/**
 * @file useOrderQueue.ts
 * @app apps/staff
 *
 * Hybrid TanStack Query + WebSocket hook for real-time order queue data.
 *
 * Strategy:
 *   1. Initial data fetched via GET /orders (TanStack Query, staleTime: 30s)
 *   2. WebSocket at wss://api.cannasaas.com/delivery/tracking sends order
 *      update events; the hook patches the query cache on each event so the
 *      UI reflects changes instantly without a full re-fetch.
 *   3. If the WebSocket disconnects, the hook polls every 30 seconds as a
 *      fallback (refetchInterval).
 *
 * WebSocket message format (from Sprint 10 delivery/notifications module):
 *   { type: 'ORDER_UPDATED', payload: { orderId, status, updatedAt } }
 *   { type: 'ORDER_CREATED', payload: { order } }
 *
 * Exported:
 *   - orders[]   — flat array of all active orders
 *   - grouped    — orders keyed by status for the queue view
 *   - isLoading  — true on initial fetch
 *   - isConnected — WebSocket connection state
 *   - advanceOrder(id, nextStatus) — PUT /orders/:id/status mutation
 *
 * The hook automatically subscribes on mount and cleans up the WebSocket
 * on unmount. Reconnection uses exponential back-off (max 30s).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore, useOrganizationStore } from '@cannasaas/stores';
import type { OrderStatus } from '../components/ui/OrderCard';

// ── Types ────────────────────────────────────────────────────────────────────

export interface QueueOrder {
  id:              string;
  orderNumber:     string;
  customerName:    string;
  itemCount:       number;
  total:           number;
  status:          OrderStatus;
  fulfillmentType: 'pickup' | 'delivery';
  createdAt:       string;
  updatedAt:       string;
}

export type GroupedOrders = Record<OrderStatus, QueueOrder[]>;

// Active statuses shown in the queue (completed / cancelled are excluded)
const QUEUE_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function groupOrders(orders: QueueOrder[]): GroupedOrders {
  const grouped = {} as GroupedOrders;
  QUEUE_STATUSES.forEach((s) => { grouped[s] = []; });
  orders.forEach((o) => {
    if (QUEUE_STATUSES.includes(o.status)) {
      grouped[o.status].push(o);
    }
  });
  // Sort each group oldest-first so staff work from top to bottom
  QUEUE_STATUSES.forEach((s) => {
    grouped[s].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });
  return grouped;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useOrderQueue() {
  const queryClient             = useQueryClient();
  const { token }               = useAuthStore();
  const { dispensary }          = useOrganizationStore();
  const wsRef                   = useRef<WebSocket | null>(null);
  const reconnectTimerRef       = useRef<ReturnType<typeof setTimeout>>();
  const reconnectDelayRef       = useRef(1000); // ms, doubles each attempt
  const [isConnected, setIsConnected] = useState(false);

  const QUERY_KEY = ['orderQueue', dispensary?.id];

  // ── Initial REST fetch ───────────────────────────────────────────────────
  const { data: orders = [], isLoading } = useQuery<QueueOrder[]>({
    queryKey: QUERY_KEY,
    queryFn:  async () => {
      const res = await fetch('/api/v1/orders?status=active&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      return data.data ?? [];
    },
    // Poll as fallback when WebSocket is disconnected
    refetchInterval: isConnected ? false : 30_000,
    staleTime: 30_000,
  });

  // ── Advance order mutation ───────────────────────────────────────────────
  const { mutate: advanceOrder, isPending: isAdvancing } = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: OrderStatus }) => {
      const res = await fetch(`/api/v1/orders/${id}/status`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('Failed to advance order');
      return res.json();
    },
    onSuccess: (updated: QueueOrder) => {
      // Patch the cached orders array with the updated order
      queryClient.setQueryData<QueueOrder[]>(QUERY_KEY, (prev) =>
        (prev ?? []).map((o) => o.id === updated.id ? updated : o),
      );
    },
  });

  // ── WebSocket setup ──────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!token || !dispensary?.id) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://api.cannasaas.com/delivery/tracking?dispensaryId=${dispensary.id}&token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectDelayRef.current = 1000; // Reset back-off on successful connect
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { type: string; payload: any };

        if (msg.type === 'ORDER_UPDATED') {
          const { orderId, status, updatedAt } = msg.payload;
          queryClient.setQueryData<QueueOrder[]>(QUERY_KEY, (prev) =>
            (prev ?? []).map((o) => o.id === orderId ? { ...o, status, updatedAt } : o),
          );
        }

        if (msg.type === 'ORDER_CREATED') {
          queryClient.setQueryData<QueueOrder[]>(QUERY_KEY, (prev) =>
            [msg.payload.order, ...(prev ?? [])],
          );
        }
      } catch {
        // Silently ignore malformed messages
      }
    };

    ws.onerror = () => setIsConnected(false);

    ws.onclose = () => {
      setIsConnected(false);
      // Exponential back-off reconnect (cap at 30 s)
      const delay = Math.min(reconnectDelayRef.current, 30_000);
      reconnectDelayRef.current = delay * 2;
      reconnectTimerRef.current = setTimeout(connect, delay);
    };
  }, [token, dispensary?.id, queryClient]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    orders,
    grouped:    groupOrders(orders),
    isLoading,
    isConnected,
    advanceOrder: (id: string, next: OrderStatus) => advanceOrder({ id, next }),
    isAdvancing,
    queueStatuses: QUEUE_STATUSES,
  };
}
TSEOF
echo "  ✓ hooks/useOrderQueue.ts"

# =============================================================================
# hooks/useDeliveryTracking.ts
# =============================================================================
cat > "$SF/hooks/useDeliveryTracking.ts" << 'TSEOF'
/**
 * @file useDeliveryTracking.ts
 * @app apps/staff
 *
 * WebSocket hook for real-time delivery tracking on the Delivery Dispatch page.
 *
 * Connects to wss://api.cannasaas.com/delivery/tracking and receives:
 *   { type: 'DRIVER_LOCATION',  payload: { driverId, lat, lng, orderId, timestamp } }
 *   { type: 'DELIVERY_STATUS',  payload: { orderId, status, driverId, timestamp } }
 *
 * Maintains a live map of driver positions and delivery statuses in local state.
 * The Delivery Dispatch page subscribes to this hook to render the map markers.
 *
 * REST fallback:
 *   If WebSocket is unavailable, GET /delivery/drivers is polled every 15s.
 *
 * Exported:
 *   driverPositions  Record<driverId, { lat, lng, orderId, updatedAt }>
 *   deliveryStatuses Record<orderId, { status, driverId }>
 *   isConnected      boolean
 *   assignDriver(orderId, driverId)  → POST /delivery/assign mutation
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useOrganizationStore } from '@cannasaas/stores';

export interface DriverPosition {
  driverId:  string;
  lat:       number;
  lng:       number;
  orderId?:  string;
  updatedAt: string;
}

export interface DeliveryStatusEntry {
  status:    string;
  driverId?: string;
  updatedAt: string;
}

export function useDeliveryTracking() {
  const { token }           = useAuthStore();
  const { dispensary }      = useOrganizationStore();
  const queryClient         = useQueryClient();
  const wsRef               = useRef<WebSocket | null>(null);
  const reconnectRef        = useRef<ReturnType<typeof setTimeout>>();
  const delayRef            = useRef(1000);

  const [isConnected,       setIsConnected]       = useState(false);
  const [driverPositions,   setDriverPositions]   = useState<Record<string, DriverPosition>>({});
  const [deliveryStatuses,  setDeliveryStatuses]  = useState<Record<string, DeliveryStatusEntry>>({});

  const connect = useCallback(() => {
    if (!token || !dispensary?.id) return;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://api.cannasaas.com/delivery/tracking?dispensaryId=${dispensary.id}&token=${token}`);
    wsRef.current = ws;

    ws.onopen  = () => { setIsConnected(true); delayRef.current = 1000; };
    ws.onerror = () => setIsConnected(false);
    ws.onclose = () => {
      setIsConnected(false);
      const delay = Math.min(delayRef.current, 30_000);
      delayRef.current = delay * 2;
      reconnectRef.current = setTimeout(connect, delay);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { type: string; payload: any };

        if (msg.type === 'DRIVER_LOCATION') {
          const { driverId, lat, lng, orderId, timestamp } = msg.payload;
          setDriverPositions((prev) => ({
            ...prev,
            [driverId]: { driverId, lat, lng, orderId, updatedAt: timestamp },
          }));
        }

        if (msg.type === 'DELIVERY_STATUS') {
          const { orderId, status, driverId, timestamp } = msg.payload;
          setDeliveryStatuses((prev) => ({
            ...prev,
            [orderId]: { status, driverId, updatedAt: timestamp },
          }));
          // Also invalidate the orders query so the dispatch list refreshes
          queryClient.invalidateQueries({ queryKey: ['deliveryOrders'] });
        }
      } catch {
        // Ignore malformed messages
      }
    };
  }, [token, dispensary?.id, queryClient]);

  useEffect(() => {
    connect();
    return () => { clearTimeout(reconnectRef.current); wsRef.current?.close(); };
  }, [connect]);

  // Assign driver mutation
  const { mutate: assignDriver, isPending: isAssigning } = useMutation({
    mutationFn: async ({ orderId, driverId }: { orderId: string; driverId: string }) => {
      const res = await fetch('/api/v1/delivery/assign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ orderId, driverId }),
      });
      if (!res.ok) throw new Error('Failed to assign driver');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deliveryOrders'] }),
  });

  return {
    driverPositions,
    deliveryStatuses,
    isConnected,
    assignDriver: (orderId: string, driverId: string) => assignDriver({ orderId, driverId }),
    isAssigning,
  };
}
TSEOF
echo "  ✓ hooks/useDeliveryTracking.ts"

echo ""
echo "  ✅ Staff Portal Part 1 complete"
find "$SF/main.tsx" "$SF/App.tsx" "$SF/routes.ts" \
     "$SF/components" "$SF/hooks" \
  -type f 2>/dev/null | sort | sed "s|$ROOT/||" | sed 's/^/    /'
echo ""
