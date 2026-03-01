#!/usr/bin/env zsh
# ================================================================
# CannaSaas — Section 9: Staff Portal Scaffold
#
# Writes all 12 source files for apps/staff into your monorepo.
# Safe to re-run — existing files are overwritten.
#
# Usage:
#   chmod +x setup-section9-staff.zsh
#   ./setup-section9-staff.zsh                   # ~/cannasaas-platform
#   ./setup-section9-staff.zsh /path/to/repo     # custom root
# ================================================================

set -euo pipefail

PLATFORM_ROOT="${1:-$HOME/cannasaas-platform}"

print -P "%F{green}▶  CannaSaas Staff Portal — Section 9%f"
print -P "%F{cyan}   Target root: ${PLATFORM_ROOT}%f"
echo ""

# ── 1. Directories ────────────────────────────────────────────────
mkdir -p "${PLATFORM_ROOT}/apps/staff/src/layouts"
mkdir -p "${PLATFORM_ROOT}/apps/staff/src/pages/CustomerLookup"
mkdir -p "${PLATFORM_ROOT}/apps/staff/src/pages/CustomerLookup/components"
mkdir -p "${PLATFORM_ROOT}/apps/staff/src/pages/Delivery"
mkdir -p "${PLATFORM_ROOT}/apps/staff/src/pages/Delivery/components"
mkdir -p "${PLATFORM_ROOT}/apps/staff/src/pages/InventorySearch"
mkdir -p "${PLATFORM_ROOT}/apps/staff/src/pages/InventorySearch/components"
mkdir -p "${PLATFORM_ROOT}/apps/staff/src/pages/OrderQueue"
mkdir -p "${PLATFORM_ROOT}/apps/staff/src/pages/OrderQueue/components"

print -P "%F{green}✓  Directories ready%f"
echo ""

# ── 2. Source files ───────────────────────────────────────────────

# [01/12] layouts/StaffLayout.tsx
print -P "%F{cyan}  [01/12] layouts/StaffLayout.tsx%f"
cat > "${PLATFORM_ROOT}/apps/staff/src/layouts/StaffLayout.tsx" << 'FILE_EOF'
// apps/staff/src/layouts/StaffLayout.tsx
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ShoppingBag, Users, Search, Truck, LogOut } from 'lucide-react';
import { useAuthStore, useCurrentUser } from '@cannasaas/stores';
import { useNavigate } from 'react-router-dom';
import { cn } from '@cannasaas/utils';

const TAB_NAV = [
  { label: 'Orders',    href: '/queue',     icon: ShoppingBag },
  { label: 'Customers', href: '/customers', icon: Users        },
  { label: 'Inventory', href: '/inventory', icon: Search       },
  { label: 'Delivery',  href: '/delivery',  icon: Truck        },
];

/**
 * StaffLayout — Persistent shell for the staff/budtender portal.
 *
 * Top header: dispensary name + logout.
 * Bottom tab bar: primary navigation for four staff pages.
 *
 * WCAG 2.4.1: Skip link targets <main id="main-content"> to bypass
 *             the repeated header and tab bar on every page.
 * WCAG 4.1.3: Status messages announced via aria-live on the header.
 */
export function StaffLayout() {
  const user = useCurrentUser();
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/auth/login');
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-secondary)] overflow-hidden">
      {/* Skip link — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className={[
          'sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50',
          'focus:px-4 focus:py-2 focus:bg-[var(--color-brand)] focus:text-white',
          'focus:rounded-[var(--p-radius-md)] focus:outline-none focus:ring-2',
          'focus:ring-white focus:shadow-[var(--p-shadow-md)]',
        ].join(' ')}
      >
        Skip to main content
      </a>

      {/* Top header */}
      <header className="h-14 flex-shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {/* Dispensary logo — resolved via ThemeProvider */}
          <div
            className="w-7 h-7 rounded-full bg-[var(--color-brand)] flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-white text-[var(--p-text-xs)] font-black">CS</span>
          </div>
          <div>
            <p className="text-[var(--p-text-sm)] font-bold text-[var(--color-text)] leading-tight">
              Staff Portal
            </p>
            <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out of staff portal"
          className={[
            'flex items-center gap-2 px-3 py-1.5 rounded-[var(--p-radius-md)]',
            'text-[var(--p-text-sm)] text-[var(--color-text-secondary)]',
            'hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
            'transition-colors duration-[var(--p-dur-fast)]',
          ].join(' ')}
        >
          <LogOut size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </header>

      {/* Main content area */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 overflow-y-auto outline-none"
      >
        <Outlet />
      </main>

      {/* Bottom tab bar — primary navigation */}
      <nav
        aria-label="Staff navigation"
        className="flex-shrink-0 h-16 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex"
      >
        {TAB_NAV.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-1',
                'text-[var(--p-text-xs)] font-semibold',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-focus-ring)]',
                'transition-colors duration-[var(--p-dur-fast)]',
                // WCAG 1.4.1: active state uses both color and underline indicator
                isActive
                  ? 'text-[var(--color-brand)] border-t-2 border-t-[var(--color-brand)] -mt-px'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
              )
            }
            aria-label={label}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
FILE_EOF

# [02/12] pages/OrderQueue/OrderQueuePage.tsx
print -P "%F{cyan}  [02/12] pages/OrderQueue/OrderQueuePage.tsx%f"
cat > "${PLATFORM_ROOT}/apps/staff/src/pages/OrderQueue/OrderQueuePage.tsx" << 'FILE_EOF'
// apps/staff/src/pages/OrderQueue/OrderQueuePage.tsx
import React, { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useOrders, useUpdateOrderStatus } from '@cannasaas/api-client';
import { OrderQueueCard } from './components/OrderQueueCard';
import { useAccessToken } from '@cannasaas/stores';

/**
 * OrderQueuePage — Real-time order queue for budtenders
 *
 * Uses polling (every 30s) as a resilient fallback for WebSocket.
 * Orders are grouped by status: Pending → Confirmed → Preparing → Ready
 */
export default function OrderQueuePage() {
  const accessToken = useAccessToken();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data, isLoading, refetch } = useOrders({
    status: ['pending', 'confirmed', 'preparing', 'ready_for_pickup'],
    limit: 100,
    sort: 'createdAt_asc',
    // Poll every 30 seconds
    refetchInterval: 1000 * 30,
  });

  const { mutate: updateStatus } = useUpdateOrderStatus();

  const orders = data?.data ?? [];
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const activeOrders = orders.filter((o) =>
    ['confirmed', 'preparing'].includes(o.status),
  );
  const readyOrders = orders.filter((o) => o.status === 'ready_for_pickup');

  // Play a soft audio chime when a new pending order arrives
  useEffect(() => {
    if (pendingOrders.length > 0 && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Browser may block autoplay; gracefully ignore
      });
    }
  }, [pendingOrders.length]);

  const LANE_CONFIG = [
    {
      id: 'pending',
      label: 'New Orders',
      orders: pendingOrders,
      colorClass: 'border-t-4 border-t-amber-400',
      nextStatus: 'confirmed' as const,
      actionLabel: 'Confirm',
    },
    {
      id: 'active',
      label: 'In Progress',
      orders: activeOrders,
      colorClass: 'border-t-4 border-t-[var(--color-brand)]',
      nextStatus: 'ready_for_pickup' as const,
      actionLabel: 'Mark Ready',
    },
    {
      id: 'ready',
      label: 'Ready for Pickup',
      orders: readyOrders,
      colorClass: 'border-t-4 border-t-[var(--color-success)]',
      nextStatus: 'completed' as const,
      actionLabel: 'Complete',
    },
  ] as const;

  return (
    <>
      <Helmet>
        <title>Order Queue | CannaSaas Staff</title>
      </Helmet>

      {/* Hidden audio element for new order notification */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)]">
            Order Queue
          </h1>

          {/* Live status indicator */}
          <div
            className="flex items-center gap-2"
            aria-live="polite"
            aria-atomic="true"
          >
            <span
              className="w-2.5 h-2.5 bg-[var(--color-success)] rounded-full animate-pulse"
              aria-hidden="true"
            />
            <span className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
              Live — {orders.length} active order
              {orders.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Kanban-style lane layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-9rem)] overflow-hidden">
          {LANE_CONFIG.map((lane) => (
            <section
              key={lane.id}
              aria-labelledby={`lane-${lane.id}`}
              className={[
                'flex flex-col bg-[var(--color-surface)]',
                'rounded-[var(--p-radius-lg)] border border-[var(--color-border)]',
                lane.colorClass,
                'overflow-hidden',
              ].join(' ')}
            >
              {/* Lane header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                <h2
                  id={`lane-${lane.id}`}
                  className="font-bold text-[var(--color-text)]"
                >
                  {lane.label}
                </h2>
                <span
                  className="text-[var(--p-text-sm)] font-bold bg-[var(--color-bg-tertiary)] px-2.5 py-0.5 rounded-full"
                  aria-label={`${lane.orders.length} orders in ${lane.label}`}
                >
                  {lane.orders.length}
                </span>
              </div>

              {/* Scrollable order list */}
              <div
                className="flex-1 overflow-y-auto p-3 space-y-3"
                role="list"
                aria-label={`${lane.label} orders`}
              >
                {isLoading ? (
                  <p className="text-center text-[var(--color-text-secondary)] text-sm py-8">
                    Loading orders...
                  </p>
                ) : lane.orders.length === 0 ? (
                  <p className="text-center text-[var(--color-text-secondary)] text-sm py-8">
                    No orders in this lane
                  </p>
                ) : (
                  lane.orders.map((order) => (
                    <div key={order.id} role="listitem">
                      <OrderQueueCard
                        order={order}
                        actionLabel={
                          lane.nextStatus === 'confirmed'
                            ? 'Confirm'
                            : lane.nextStatus === 'ready_for_pickup'
                              ? 'Mark Ready'
                              : 'Complete'
                        }
                        onAction={() =>
                          updateStatus({
                            orderId: order.id,
                            status: lane.nextStatus,
                          })
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
FILE_EOF

# [03/12] pages/OrderQueue/components/OrderQueueCard.tsx
print -P "%F{cyan}  [03/12] pages/OrderQueue/components/OrderQueueCard.tsx%f"
cat > "${PLATFORM_ROOT}/apps/staff/src/pages/OrderQueue/components/OrderQueueCard.tsx" << 'FILE_EOF'
// apps/staff/src/pages/OrderQueue/components/OrderQueueCard.tsx
import React, { useEffect, useState } from 'react';
import { Clock, Package } from 'lucide-react';
import { formatCurrency } from '@cannasaas/utils';
import type { Order, OrderStatus } from '@cannasaas/types';

interface OrderQueueCardProps {
  order: Order;
  actionLabel: string;
  onAction: () => void;
}

/**
 * OrderQueueCard — Single order card in the kanban queue.
 *
 * Elapsed timer re-renders every 60s using a local interval so the
 * budtender can see how long an order has been waiting without
 * any additional API calls.
 *
 * WCAG 2.5.5: Action button has explicit min-height of 48px (touch target).
 * WCAG 1.3.1: Order details use <dl> so screen readers read label/value pairs.
 * WCAG 4.1.3: Order number is the accessible name of the card region.
 */
export function OrderQueueCard({ order, actionLabel, onAction }: OrderQueueCardProps) {
  const [elapsed, setElapsed] = useState('');

  // Update elapsed time every 60 seconds
  useEffect(() => {
    function tick() {
      const diff = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
      if (diff < 60) setElapsed(`${diff}s ago`);
      else if (diff < 3600) setElapsed(`${Math.floor(diff / 60)}m ago`);
      else setElapsed(`${Math.floor(diff / 3600)}h ago`);
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [order.createdAt]);

  // Orders waiting more than 15 minutes get a visual urgency indicator
  const minutesElapsed = Math.floor(
    (Date.now() - new Date(order.createdAt).getTime()) / 60_000,
  );
  const isUrgent = minutesElapsed >= 15;

  return (
    <article
      aria-labelledby={`order-${order.id}-num`}
      className={[
        'bg-[var(--color-bg)] rounded-[var(--p-radius-md)]',
        'border transition-colors duration-[var(--p-dur-fast)]',
        isUrgent
          ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]'
          : 'border-[var(--color-border)]',
      ].join(' ')}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
        <h3
          id={`order-${order.id}-num`}
          className="font-bold text-[var(--color-text)] text-[var(--p-text-sm)]"
        >
          #{order.orderNumber}
        </h3>

        <div
          className="flex items-center gap-1.5"
          title={`Order placed ${elapsed}`}
        >
          <Clock
            size={12}
            className={isUrgent ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'}
            aria-hidden="true"
          />
          <span
            className={[
              'text-[var(--p-text-xs)] font-semibold',
              isUrgent ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]',
            ].join(' ')}
            aria-label={`Waiting ${elapsed}`}
          >
            {elapsed}
          </span>
        </div>
      </div>

      {/* Customer name */}
      <p className="px-3.5 text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] truncate">
        {order.customerName ?? 'Guest'}
      </p>

      {/* Order details */}
      <dl className="px-3.5 pt-2 pb-3 space-y-1">
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            Items
          </dt>
          <dd className="text-[var(--p-text-xs)] font-medium text-[var(--color-text)] flex items-center gap-1">
            <Package size={11} aria-hidden="true" />
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </dd>
        </div>

        <div className="flex justify-between gap-2">
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            Total
          </dt>
          <dd className="text-[var(--p-text-xs)] font-bold text-[var(--color-text)]">
            {formatCurrency(order.total)}
          </dd>
        </div>

        <div className="flex justify-between gap-2">
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            Type
          </dt>
          <dd className="text-[var(--p-text-xs)] font-medium text-[var(--color-text)] capitalize">
            {order.fulfillmentType}
          </dd>
        </div>
      </dl>

      {/* Compact item list */}
      <ul
        aria-label={`Items in order ${order.orderNumber}`}
        className="mx-3.5 mb-3 space-y-0.5"
      >
        {order.items.slice(0, 3).map((item) => (
          <li
            key={item.id}
            className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] truncate"
          >
            {item.quantity}× {item.productName} — {item.variantName}
          </li>
        ))}
        {order.items.length > 3 && (
          <li className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] italic">
            +{order.items.length - 3} more
          </li>
        )}
      </ul>

      {/* Action button — large touch target per WCAG 2.5.5 */}
      <div className="px-3.5 pb-3.5">
        <button
          type="button"
          onClick={onAction}
          aria-label={`${actionLabel} order ${order.orderNumber}`}
          className={[
            'w-full min-h-[48px] rounded-[var(--p-radius-md)]',
            'bg-[var(--color-brand)] text-white font-bold text-[var(--p-text-sm)]',
            'hover:bg-[var(--color-brand-hover)] active:scale-[0.98]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2',
            'transition-all duration-[var(--p-dur-fast)]',
          ].join(' ')}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}
FILE_EOF

# [04/12] pages/CustomerLookup/CustomerLookupPage.tsx
print -P "%F{cyan}  [04/12] pages/CustomerLookup/CustomerLookupPage.tsx%f"
cat > "${PLATFORM_ROOT}/apps/staff/src/pages/CustomerLookup/CustomerLookupPage.tsx" << 'FILE_EOF'
// apps/staff/src/pages/CustomerLookup/CustomerLookupPage.tsx
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, UserCheck, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useSearchUsers, useCompliancePurchaseLimit } from '@cannasaas/api-client';
import { useDebounce } from '@cannasaas/utils';
import { PurchaseLimitMeter } from '@cannasaas/ui';
import type { User } from '@cannasaas/types';
import { CustomerProfileCard } from './components/CustomerProfileCard';
import { IDVerifyModal }       from './components/IDVerifyModal';

/**
 * CustomerLookupPage — Staff tool for quick customer profile access.
 *
 * Search is debounced at 300ms and queries GET /users?q=...&role=customer
 * which filters by name, email, or phone. Results are limited to 10.
 * Selecting a result fetches the full profile + purchase limit check.
 *
 * WCAG 2.1.1: Full keyboard navigation — search → results → profile →
 *             verify button, all reachable without a mouse.
 * WCAG 4.1.3: Purchase limit violations announced via aria-live="assertive".
 * WCAG 3.3.2: Search input has a visible label, not just a placeholder.
 */
export default function CustomerLookupPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // GET /users?q=...&role=customer — Manager+ only
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(
    { q: debouncedQuery, role: 'customer', limit: 10 },
    { enabled: debouncedQuery.length >= 2 },
  );

  // GET /compliance/purchase-limit?customerId=... for selected customer
  const { data: limitCheck } = useCompliancePurchaseLimit(
    selectedCustomer?.id ?? '',
    { enabled: !!selectedCustomer },
  );

  function handleSelect(customer: User) {
    setSelectedCustomer(customer);
    setQuery(customer.firstName + ' ' + customer.lastName);
    inputRef.current?.blur();
  }

  function handleClear() {
    setQuery('');
    setSelectedCustomer(null);
    inputRef.current?.focus();
  }

  const showDropdown =
    debouncedQuery.length >= 2 && !selectedCustomer && searchResults?.data.length;

  return (
    <>
      <Helmet>
        <title>Customer Lookup | CannaSaas Staff</title>
      </Helmet>

      <div className="p-4 md:p-6 space-y-5">
        <h1 className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)]">
          Customer Lookup
        </h1>

        {/* Search surface */}
        <div className="relative">
          <label
            htmlFor="customer-search"
            className="block text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] mb-1.5"
          >
            Search by name, email, or phone
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="customer-search"
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={!!showDropdown}
              aria-controls="customer-results"
              aria-autocomplete="list"
              aria-label="Search customers"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedCustomer) setSelectedCustomer(null);
              }}
              placeholder="Jane Smith · jane@example.com · (555) 000-0000"
              className={[
                'w-full h-12 pl-10 pr-10 rounded-[var(--p-radius-md)]',
                'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
                'text-[var(--color-text)] text-[var(--p-text-sm)]',
                'placeholder:text-[var(--color-text-secondary)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
              ].join(' ')}
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] rounded-full"
              >
                ×
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {showDropdown ? (
            <ul
              id="customer-results"
              role="listbox"
              aria-label="Customer search results"
              className={[
                'absolute z-10 mt-1 w-full',
                'bg-[var(--color-surface)] border border-[var(--color-border)]',
                'rounded-[var(--p-radius-md)] shadow-[var(--p-shadow-lg)]',
                'overflow-hidden max-h-64 overflow-y-auto',
              ].join(' ')}
            >
              {isSearching ? (
                <li className="px-4 py-3 text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
                  Searching…
                </li>
              ) : (
                searchResults?.data.map((customer) => (
                  <li key={customer.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => handleSelect(customer)}
                      className={[
                        'w-full text-left px-4 py-3 flex flex-col gap-0.5',
                        'hover:bg-[var(--color-bg-secondary)]',
                        'focus:outline-none focus:bg-[var(--color-bg-secondary)]',
                        'transition-colors duration-[var(--p-dur-fast)]',
                      ].join(' ')}
                    >
                      <span className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
                        {customer.firstName} {customer.lastName}
                      </span>
                      <span className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
                        {customer.email}
                        {customer.phone ? ` · ${customer.phone}` : ''}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>

        {/* Customer profile — shown after selection */}
        {selectedCustomer ? (
          <div className="space-y-4">
            <CustomerProfileCard
              customer={selectedCustomer}
              onVerifyId={() => setShowVerifyModal(true)}
            />

            {/* Purchase limit meter — from @cannasaas/ui (Section 10.2) */}
            {limitCheck && (
              <section aria-labelledby="limit-heading">
                <h2
                  id="limit-heading"
                  className="text-[var(--p-text-sm)] font-bold text-[var(--color-text)] mb-2"
                >
                  Today's Purchase Capacity
                </h2>
                <PurchaseLimitMeter limitCheck={limitCheck} />
              </section>
            )}
          </div>
        ) : (
          // Empty state
          debouncedQuery.length < 2 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search
                size={40}
                className="text-[var(--color-text-secondary)] mb-3"
                aria-hidden="true"
              />
              <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
                Search for a customer to view their profile, verification status,
                and remaining daily purchase limits.
              </p>
            </div>
          )
        )}
      </div>

      {/* ID verification modal */}
      {showVerifyModal && selectedCustomer && (
        <IDVerifyModal
          customer={selectedCustomer}
          onClose={() => setShowVerifyModal(false)}
        />
      )}
    </>
  );
}
FILE_EOF

# [05/12] pages/CustomerLookup/components/CustomerProfileCard.tsx
print -P "%F{cyan}  [05/12] pages/CustomerLookup/components/CustomerProfileCard.tsx%f"
cat > "${PLATFORM_ROOT}/apps/staff/src/pages/CustomerLookup/components/CustomerProfileCard.tsx" << 'FILE_EOF'
// apps/staff/src/pages/CustomerLookup/components/CustomerProfileCard.tsx
import React from 'react';
import { UserCheck, UserX, ShieldCheck, Clock } from 'lucide-react';
import { formatDate } from '@cannasaas/utils';
import type { User } from '@cannasaas/types';

interface CustomerProfileCardProps {
  customer: User;
  onVerifyId: () => void;
}

/**
 * CustomerProfileCard — Compact customer summary card for the staff lookup page.
 *
 * Shows: name, verification status, DOB, membership date, last order date.
 * The "Verify ID" button is the primary call-to-action for compliance workflows.
 *
 * WCAG 1.3.1: Verification status uses icon + text, never icon alone.
 * WCAG 1.4.3: Status badge colours all pass 4.5:1 contrast against the surface.
 */
export function CustomerProfileCard({ customer, onVerifyId }: CustomerProfileCardProps) {
  const isVerified = customer.idVerified === true;

  return (
    <div
      className={[
        'bg-[var(--color-surface)] border rounded-[var(--p-radius-lg)] p-5',
        isVerified
          ? 'border-[var(--color-success)]'
          : 'border-[var(--color-warning)]',
      ].join(' ')}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[var(--p-text-xl)] font-bold text-[var(--color-text)]">
            {customer.firstName} {customer.lastName}
          </h2>
          <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
            {customer.email}
          </p>
          {customer.phone && (
            <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
              {customer.phone}
            </p>
          )}
        </div>

        {/* Verification status badge */}
        <div
          className={[
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[var(--p-text-xs)] font-bold',
            isVerified
              ? 'bg-green-50 dark:bg-green-950/20 text-[var(--color-success)]'
              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400',
          ].join(' ')}
          // WCAG 1.3.1: status communicated via text, not colour alone
          aria-label={isVerified ? 'Identity verified' : 'Identity not verified'}
        >
          {isVerified ? (
            <UserCheck size={13} aria-hidden="true" />
          ) : (
            <UserX size={13} aria-hidden="true" />
          )}
          {isVerified ? 'Verified' : 'Unverified'}
        </div>
      </div>

      {/* Details grid */}
      <dl className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">Date of Birth</dt>
          <dd className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
            {customer.dateOfBirth ? formatDate(customer.dateOfBirth) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">Member Since</dt>
          <dd className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
            {formatDate(customer.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">Last Verified</dt>
          <dd className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
            {customer.lastVerifiedAt ? formatDate(customer.lastVerifiedAt) : 'Never'}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">Total Orders</dt>
          <dd className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
            {customer.orderCount ?? 0}
          </dd>
        </div>
      </dl>

      {/* Verify ID action */}
      <button
        type="button"
        onClick={onVerifyId}
        className={[
          'w-full min-h-[48px] flex items-center justify-center gap-2',
          'rounded-[var(--p-radius-md)] font-bold text-[var(--p-text-sm)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2',
          'transition-all duration-[var(--p-dur-fast)]',
          isVerified
            ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'
            : 'bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]',
        ].join(' ')}
        aria-label={`Verify identity for ${customer.firstName} ${customer.lastName}`}
      >
        <ShieldCheck size={18} aria-hidden="true" />
        {isVerified ? 'Re-verify ID' : 'Verify ID Now'}
      </button>
    </div>
  );
}
FILE_EOF

# [06/12] pages/CustomerLookup/components/IDVerifyModal.tsx
print -P "%F{cyan}  [06/12] pages/CustomerLookup/components/IDVerifyModal.tsx%f"
cat > "${PLATFORM_ROOT}/apps/staff/src/pages/CustomerLookup/components/IDVerifyModal.tsx" << 'FILE_EOF'
// apps/staff/src/pages/CustomerLookup/components/IDVerifyModal.tsx
import React, { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, X } from 'lucide-react';
import { useVerifyCustomerID } from '@cannasaas/api-client';
import { useCurrentUser } from '@cannasaas/stores';
import { Button } from '@cannasaas/ui';
import type { User } from '@cannasaas/types';

// Minimum birth year for 21+ check — calculated at runtime
function getMax21DOB(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 21);
  return d.toISOString().slice(0, 10);
}

const schema = z.object({
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((dob) => dob <= getMax21DOB(), {
      message: 'Customer must be 21 or older',
    }),
  idExpirationDate: z
    .string()
    .min(1, 'ID expiration date is required')
    .refine((exp) => exp >= new Date().toISOString().slice(0, 10), {
      message: 'ID is expired — sale cannot proceed',
    }),
  idType: z.enum(['drivers_license', 'state_id', 'passport', 'military_id'], {
    errorMap: () => ({ message: 'Select an ID type' }),
  }),
  confirmed: z
    .boolean()
    .refine((v) => v === true, { message: 'You must confirm the ID check was completed' }),
});

type FormValues = z.infer<typeof schema>;

interface IDVerifyModalProps {
  customer: User;
  onClose: () => void;
}

/**
 * IDVerifyModal — In-person ID verification flow for pickup and delivery orders.
 *
 * On submit: POST /age-verification/verify → creates ComplianceLog entry:
 *   { eventType: 'id_verification', details: { customerId, verificationType: 'manual',
 *     verifiedBy: staffUserId, idType, ageAtVerification, verified: true } }
 *
 * WCAG 3.3.4: Confirmation checkbox prevents accidental verification of an
 *             unexamined ID (WCAG error prevention for legal consequences).
 * WCAG 2.1.1: Focus trapped inside the modal while open.
 * WCAG 3.3.1: Each invalid field gets an associated error message via aria-describedby.
 */
export function IDVerifyModal({ customer, onClose }: IDVerifyModalProps) {
  const user = useCurrentUser();
  const firstFocusRef = useRef<HTMLHeadingElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dateOfBirth: customer.dateOfBirth ?? '',
      confirmed: false,
    },
  });

  const { mutate: verifyID, isPending, isSuccess } = useVerifyCustomerID();

  // Move focus into modal on open — WCAG 2.4.3
  useEffect(() => {
    firstFocusRef.current?.focus();
  }, []);

  // Trap focus inside modal — WCAG 2.1.1
  useEffect(() => {
    const modal = document.getElementById('id-verify-modal');
    if (!modal) return;

    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(
      modal.querySelectorAll<HTMLElement>(focusableSelectors),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function onSubmit(values: FormValues) {
    verifyID({
      customerId: customer.id,
      verifiedBy: user!.id,
      dateOfBirth: values.dateOfBirth,
      idType: values.idType,
      idExpirationDate: values.idExpirationDate,
      verificationType: 'manual',
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        id="id-verify-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-modal-title"
        className={[
          'fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto',
          'bg-[var(--color-surface)] rounded-[var(--p-radius-xl)]',
          'border border-[var(--color-border)] shadow-[var(--p-shadow-xl)]',
          'overflow-hidden',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-[var(--color-brand)]" aria-hidden="true" />
            <h2
              id="verify-modal-title"
              ref={firstFocusRef}
              tabIndex={-1}
              className="font-bold text-[var(--color-text)] text-[var(--p-text-lg)] outline-none"
            >
              Verify ID
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close ID verification"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] rounded-md"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {isSuccess ? (
          // Success state
          <div className="px-6 py-8 text-center">
            <Shield size={40} className="text-[var(--color-success)] mx-auto mb-3" aria-hidden="true" />
            <p className="font-bold text-[var(--color-text)] text-[var(--p-text-lg)] mb-1">
              ID Verified
            </p>
            <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] mb-5">
              Verification logged for {customer.firstName} {customer.lastName}.
            </p>
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="px-6 py-5 space-y-5"
          >
            <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
              Physically examine the customer's ID and complete the fields below.
              This creates a compliance log entry under your account.
            </p>

            {/* ID type */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="idType"
                className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]"
              >
                ID Type <span aria-hidden="true" className="text-[var(--color-error)]">*</span>
              </label>
              <select
                id="idType"
                aria-required="true"
                aria-invalid={!!errors.idType}
                aria-describedby={errors.idType ? 'idType-error' : undefined}
                className={[
                  'h-10 px-3 rounded-[var(--p-radius-md)] bg-[var(--color-bg)]',
                  'border text-[var(--p-text-sm)] text-[var(--color-text)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                  errors.idType
                    ? 'border-[var(--color-error)]'
                    : 'border-[var(--color-border-strong)]',
                ].join(' ')}
                {...register('idType')}
              >
                <option value="">Select ID type…</option>
                <option value="drivers_license">Driver's License</option>
                <option value="state_id">State ID</option>
                <option value="passport">Passport</option>
                <option value="military_id">Military ID</option>
              </select>
              {errors.idType && (
                <p id="idType-error" role="alert" className="text-[var(--p-text-xs)] text-[var(--color-error)]">
                  {errors.idType.message}
                </p>
              )}
            </div>

            {/* Date of birth from ID */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="dateOfBirth"
                className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]"
              >
                Date of Birth on ID <span aria-hidden="true" className="text-[var(--color-error)]">*</span>
              </label>
              <input
                id="dateOfBirth"
                type="date"
                aria-required="true"
                aria-invalid={!!errors.dateOfBirth}
                aria-describedby={errors.dateOfBirth ? 'dob-error' : 'dob-hint'}
                max={getMax21DOB()}
                className={[
                  'h-10 px-3 rounded-[var(--p-radius-md)] bg-[var(--color-bg)]',
                  'border text-[var(--p-text-sm)] text-[var(--color-text)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                  errors.dateOfBirth
                    ? 'border-[var(--color-error)]'
                    : 'border-[var(--color-border-strong)]',
                ].join(' ')}
                {...register('dateOfBirth')}
              />
              <p id="dob-hint" className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
                Customer must be 21 or older. Enter exactly as shown on the ID.
              </p>
              {errors.dateOfBirth && (
                <p id="dob-error" role="alert" className="text-[var(--p-text-xs)] text-[var(--color-error)]">
                  ⚠ {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            {/* ID expiration date */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="idExpirationDate"
                className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]"
              >
                ID Expiration Date <span aria-hidden="true" className="text-[var(--color-error)]">*</span>
              </label>
              <input
                id="idExpirationDate"
                type="date"
                aria-required="true"
                aria-invalid={!!errors.idExpirationDate}
                aria-describedby={errors.idExpirationDate ? 'exp-error' : undefined}
                min={new Date().toISOString().slice(0, 10)}
                className={[
                  'h-10 px-3 rounded-[var(--p-radius-md)] bg-[var(--color-bg)]',
                  'border text-[var(--p-text-sm)] text-[var(--color-text)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                  errors.idExpirationDate
                    ? 'border-[var(--color-error)]'
                    : 'border-[var(--color-border-strong)]',
                ].join(' ')}
                {...register('idExpirationDate')}
              />
              {errors.idExpirationDate && (
                <p id="exp-error" role="alert" className="text-[var(--p-text-xs)] text-[var(--color-error)]">
                  ⚠ {errors.idExpirationDate.message}
                </p>
              )}
            </div>

            {/* Confirmation checkbox — WCAG 3.3.4 error prevention */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                aria-required="true"
                aria-invalid={!!errors.confirmed}
                aria-describedby={errors.confirmed ? 'confirm-error' : undefined}
                className="mt-0.5 h-4 w-4 rounded text-[var(--color-brand)] focus:ring-[var(--color-focus-ring)]"
                {...register('confirmed')}
              />
              <span className="text-[var(--p-text-sm)] text-[var(--color-text)]">
                I have physically examined this customer's photo ID and confirmed
                they are 21 years of age or older.
              </span>
            </label>
            {errors.confirmed && (
              <p id="confirm-error" role="alert" className="text-[var(--p-text-xs)] text-[var(--color-error)]">
                ⚠ {errors.confirmed.message}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
                loadingText="Logging…"
                className="flex-1"
              >
                Log Verification
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
FILE_EOF

# [07/12] pages/InventorySearch/InventorySearchPage.tsx
print -P "%F{cyan}  [07/12] pages/InventorySearch/InventorySearchPage.tsx%f"
cat > "${PLATFORM_ROOT}/apps/staff/src/pages/InventorySearch/InventorySearchPage.tsx" << 'FILE_EOF'
// apps/staff/src/pages/InventorySearch/InventorySearchPage.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Barcode, X } from 'lucide-react';
import { useProducts } from '@cannasaas/api-client';
import { useDebounce } from '@cannasaas/utils';
import { StrainTypeBadge } from '@cannasaas/ui';
import type { Product } from '@cannasaas/types';
import { InventoryResultCard } from './components/InventoryResultCard';

/**
 * InventorySearchPage — Fast product + stock lookup for in-counter budtender use.
 *
 * Calls GET /products?q=...&limit=20 (full-text search via Elasticsearch,
 * Sprint 9). The same endpoint supports SKU lookup — entering a SKU like
 * "BD-125" returns an exact match first. Autocomplete triggers after 1 character
 * so the budtender can start typing a strain name and see results immediately.
 *
 * Barcode mode: a USB barcode scanner emits keystrokes ending in Enter.
 * When the input receives an Enter key, the query is treated as a SKU and
 * submitted immediately without waiting for debounce.
 *
 * WCAG 2.1.1: Keyboard-only navigable. Results are a list; arrow keys move
 *             focus between result cards when the combobox is expanded.
 * WCAG 3.3.2: Label is always visible above the input, not replaced by placeholder.
 */
export default function InventorySearchPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [committed, setCommitted] = useState('');

  const debouncedQuery = useDebounce(query, 250);

  // Use committed (barcode scan Enter) if set, otherwise debounced typing
  const effectiveQuery = committed || debouncedQuery;

  const { data, isLoading, isFetching } = useProducts(
    { q: effectiveQuery, limit: 20, includeOutOfStock: true },
    { enabled: effectiveQuery.length >= 1 },
  );

  const products = data?.data ?? [];

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      // Barcode scanner or deliberate Enter → commit immediately
      setCommitted(query);
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  }

  function handleClear() {
    setQuery('');
    setCommitted('');
    inputRef.current?.focus();
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setCommitted(''); // Clear any prior barcode commit on new typing
  }, []);

  const showResults = effectiveQuery.length >= 1;
  const isSearchBusy = isLoading || isFetching;

  return (
    <>
      <Helmet>
        <title>Inventory Search | CannaSaas Staff</title>
      </Helmet>

      <div className="p-4 md:p-6 space-y-5">
        <h1 className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)]">
          Inventory Search
        </h1>

        {/* Search bar */}
        <div>
          <label
            htmlFor="inventory-search"
            className="block text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] mb-1.5"
          >
            Search by product name, strain, SKU, or scan barcode
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="inventory-search"
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={showResults && products.length > 0}
              aria-controls="inventory-results"
              aria-autocomplete="list"
              aria-busy={isSearchBusy}
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Blue Dream · BD-125 · scan barcode…"
              autoFocus
              className={[
                'w-full h-12 pl-10 pr-14 rounded-[var(--p-radius-md)]',
                'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
                'text-[var(--color-text)] text-[var(--p-text-sm)]',
                'placeholder:text-[var(--color-text-secondary)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
              ].join(' ')}
            />

            {/* Barcode icon indicator */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              <Barcode size={16} aria-hidden="true" />
            </div>

            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear inventory search"
                className={[
                  'absolute right-3.5 top-1/2 -translate-y-1/2',
                  'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] rounded-full',
                ].join(' ')}
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Busy indicator — announced to screen readers */}
          {isSearchBusy && effectiveQuery && (
            <p
              role="status"
              aria-live="polite"
              className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] mt-1.5"
            >
              Searching inventory…
            </p>
          )}
        </div>

        {/* Results */}
        {showResults ? (
          <div>
            {/* Result count — WCAG 4.1.3 status message */}
            <p
              role="status"
              aria-live="polite"
              className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] mb-3"
            >
              {isSearchBusy
                ? ''
                : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
            </p>

            <ul
              id="inventory-results"
              role="listbox"
              aria-label="Inventory search results"
              className="space-y-3"
            >
              {products.length === 0 && !isSearchBusy ? (
                <li className="text-center py-12 text-[var(--color-text-secondary)] text-[var(--p-text-sm)]">
                  No products found for &ldquo;{effectiveQuery}&rdquo;
                </li>
              ) : (
                products.map((product) => (
                  <li key={product.id} role="option" aria-selected={false}>
                    <InventoryResultCard product={product} />
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Barcode
              size={48}
              className="text-[var(--color-text-secondary)] mb-3"
              aria-hidden="true"
            />
            <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] max-w-xs">
              Type a product name or SKU, or scan a product barcode to check stock levels instantly.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
FILE_EOF

# [08/12] pages/InventorySearch/components/InventoryResultCard.tsx
print -P "%F{cyan}  [08/12] pages/InventorySearch/components/InventoryResultCard.tsx%f"
cat > "${PLATFORM_ROOT}/apps/staff/src/pages/InventorySearch/components/InventoryResultCard.tsx" << 'FILE_EOF'
// apps/staff/src/pages/InventorySearch/components/InventoryResultCard.tsx
import React from 'react';
import type { Product, ProductVariant } from '@cannasaas/types';
import { StrainTypeBadge } from '@cannasaas/ui';
import { formatCurrency } from '@cannasaas/utils';
import { cn } from '@cannasaas/utils';

// Stock thresholds — mirrors the low-stock threshold used in the admin portal
const LOW_STOCK_THRESHOLD = 5;

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

function getStockStatus(qty: number): StockStatus {
  if (qty === 0)               return 'out_of_stock';
  if (qty <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'in_stock';
}

const STOCK_CONFIG: Record<StockStatus, { label: string; dot: string; text: string }> = {
  in_stock:     { label: 'In Stock',     dot: 'bg-[var(--color-success)]',  text: 'text-[var(--color-success)]'  },
  low_stock:    { label: 'Low Stock',    dot: 'bg-[var(--color-warning)]',   text: 'text-amber-600 dark:text-amber-400' },
  out_of_stock: { label: 'Out of Stock', dot: 'bg-[var(--color-text-disabled)]', text: 'text-[var(--color-text-secondary)]' },
};

interface InventoryResultCardProps {
  product: Product;
}

/**
 * InventoryResultCard — Single product result with per-variant stock indicators.
 *
 * Renders all variants in a compact table so the budtender can compare
 * sizes and prices at a glance without navigating to a detail page.
 *
 * WCAG 1.4.1: Stock status communicated via text label + dot, never colour alone.
 * WCAG 1.3.1: Variant table uses <th scope="col"> for correct semantics.
 */
export function InventoryResultCard({ product }: InventoryResultCardProps) {
  return (
    <article
      aria-labelledby={`product-${product.id}-name`}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] overflow-hidden"
    >
      {/* Product header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3
              id={`product-${product.id}-name`}
              className="font-bold text-[var(--color-text)] text-[var(--p-text-base)] truncate"
            >
              {product.name}
            </h3>
            {product.strainType && (
              <StrainTypeBadge strainType={product.strainType} size="sm" />
            )}
          </div>
          <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            {product.brand}
            {product.thcContent && ` · THC ${product.thcContent}%`}
            {product.cbdContent && product.cbdContent > 0 && ` · CBD ${product.cbdContent}%`}
          </p>
        </div>

        <span className="flex-shrink-0 text-[var(--p-text-xs)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
          {product.category}
        </span>
      </div>

      {/* Variant table */}
      <div
        className="overflow-x-auto"
        role="region"
        aria-label={`${product.name} variants`}
        tabIndex={0} // WCAG 2.1.1: scrollable region is keyboard focusable
      >
        <table className="w-full text-[var(--p-text-sm)]">
          <caption className="sr-only">
            {product.name} — available sizes and current stock levels
          </caption>
          <thead>
            <tr className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <th scope="col" className="text-left px-4 py-2 font-semibold text-[var(--color-text-secondary)] text-[var(--p-text-xs)]">
                Size
              </th>
              <th scope="col" className="text-left px-4 py-2 font-semibold text-[var(--color-text-secondary)] text-[var(--p-text-xs)]">
                SKU
              </th>
              <th scope="col" className="text-right px-4 py-2 font-semibold text-[var(--color-text-secondary)] text-[var(--p-text-xs)]">
                Price
              </th>
              <th scope="col" className="text-right px-4 py-2 font-semibold text-[var(--color-text-secondary)] text-[var(--p-text-xs)]">
                Stock
              </th>
            </tr>
          </thead>
          <tbody>
            {product.variants.map((variant) => {
              const status = getStockStatus(variant.quantity);
              const cfg = STOCK_CONFIG[status];

              return (
                <tr
                  key={variant.id}
                  className={cn(
                    'border-t border-[var(--color-border)]',
                    status === 'out_of_stock' && 'opacity-50',
                  )}
                >
                  <td className="px-4 py-2.5 font-medium text-[var(--color-text)]">
                    {variant.name}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
                    {variant.sku}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-[var(--color-text)]">
                    {formatCurrency(variant.price)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      {/* WCAG 1.4.1: dot supplements text, never replaces it */}
                      <span
                        className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)}
                        aria-hidden="true"
                      />
                      <span className={cn('text-[var(--p-text-xs)] font-semibold', cfg.text)}>
                        {status === 'in_stock' ? `${variant.quantity} units` : cfg.label}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
FILE_EOF

# [09/12] pages/Delivery/DeliveryDispatchPage.tsx
print -P "%F{cyan}  [09/12] pages/Delivery/DeliveryDispatchPage.tsx%f"
cat > "${PLATFORM_ROOT}/apps/staff/src/pages/Delivery/DeliveryDispatchPage.tsx" << 'FILE_EOF'
// apps/staff/src/pages/Delivery/DeliveryDispatchPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Truck, MapPin, UserCheck } from 'lucide-react';
import {
  useOrders,
  useDeliveryDrivers,
  useAssignDriver,
  useUpdateOrderStatus,
} from '@cannasaas/api-client';
import { useAccessToken, useCurrentUser } from '@cannasaas/stores';
import { wsManager } from '@cannasaas/api-client';
import { cn } from '@cannasaas/utils';
import type { Order } from '@cannasaas/types';
import { DriverAssignSelect }   from './components/DriverAssignSelect';
import { DeliveryOrderRow }     from './components/DeliveryOrderRow';
import { DeliveryStatusBadge }  from './components/DeliveryStatusBadge';

/**
 * DeliveryDispatchPage — Real-time delivery order management for managers and drivers.
 *
 * Connects to WS /delivery/tracking on mount. The wsManager singleton
 * (packages/api-client/src/services/WebSocketManager.ts, Section 11)
 * handles reconnection with exponential backoff so a brief network blip
 * doesn't lose the driver's position stream.
 *
 * Roles:
 *   - Manager/Admin: sees all delivery orders, can assign/reassign drivers.
 *   - Driver: sees only their own assigned orders; can mark delivered.
 *
 * WCAG 2.4.2: Page title updates dynamically via <Helmet>.
 * WCAG 4.1.3: New orders announced via aria-live="polite" in the status bar.
 * WCAG 1.3.1: Delivery status badge uses text + icon, never icon alone.
 */
export default function DeliveryDispatchPage() {
  const user = useCurrentUser();
  const accessToken = useAccessToken();
  const isDriver = user?.roles.includes('driver') ?? false;

  const [wsConnected, setWsConnected] = useState(false);
  const [liveStatuses, setLiveStatuses] = useState<Record<string, string>>({});

  // ── Data hooks ───────────────────────────────────────────────────────────
  // Drivers: drivers see only their orders, managers see all delivery orders
  const { data: ordersData, refetch: refetchOrders } = useOrders({
    fulfillmentType: 'delivery',
    status: ['pending', 'confirmed', 'out_for_delivery', 'delivered'],
    ...(isDriver ? { driverId: user?.id } : {}),
    limit: 50,
    sort: 'createdAt_asc',
    refetchInterval: 60_000, // polling fallback
  });

  const { data: driversData } = useDeliveryDrivers(
    { available: true },
    { enabled: !isDriver }, // managers only
  );

  const { mutate: assignDriver } = useAssignDriver();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();

  const orders = ordersData?.data ?? [];
  const drivers = driversData?.data ?? [];

  // Unassigned delivery orders (managers only)
  const unassigned = orders.filter(
    (o) => o.status === 'pending' && o.fulfillmentType === 'delivery' && !o.driverId,
  );
  const inFlight = orders.filter((o) => o.status === 'out_for_delivery');
  const delivered = orders.filter((o) => o.status === 'delivered');

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;

    const wsUrl = `${import.meta.env.VITE_WS_URL}/delivery/tracking`;
    wsManager.connect(wsUrl, accessToken);
    setWsConnected(true);

    // Listen for live status updates from the delivery module
    const unsubStatus = wsManager.on<{ orderId: string; status: string }>(
      'status_update',
      (payload) => {
        setLiveStatuses((prev) => ({ ...prev, [payload.orderId]: payload.status }));
        // Refresh order list so data stays in sync with live events
        refetchOrders();
      },
    );

    return () => {
      unsubStatus();
      wsManager.disconnect();
      setWsConnected(false);
    };
  }, [accessToken, refetchOrders]);

  function handleAssign(orderId: string, driverId: string) {
    assignDriver({ orderId, driverId }, { onSuccess: () => refetchOrders() });
  }

  function handleStatusUpdate(orderId: string, status: 'out_for_delivery' | 'delivered' | 'completed') {
    updateStatus({ orderId, status }, { onSuccess: () => refetchOrders() });
  }

  return (
    <>
      <Helmet>
        <title>
          {isDriver ? 'My Deliveries' : `Dispatch (${inFlight.length} active)`} | CannaSaas Staff
        </title>
      </Helmet>

      <div className="p-4 md:p-6 space-y-6">
        {/* Page header + WS status */}
        <div className="flex items-center justify-between">
          <h1 className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)] flex items-center gap-2">
            <Truck size={24} aria-hidden="true" className="text-[var(--color-brand)]" />
            {isDriver ? 'My Deliveries' : 'Delivery Dispatch'}
          </h1>

          {/* Live connection indicator */}
          <div
            className="flex items-center gap-2"
            aria-live="polite"
            aria-atomic="true"
            aria-label={wsConnected ? 'Live updates connected' : 'Live updates disconnected'}
          >
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full',
                wsConnected
                  ? 'bg-[var(--color-success)] animate-pulse'
                  : 'bg-[var(--color-error)]',
              )}
              aria-hidden="true"
            />
            <span className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
              {wsConnected ? 'Live' : 'Reconnecting…'}
            </span>
          </div>
        </div>

        {/* MANAGERS ONLY: Unassigned orders */}
        {!isDriver && unassigned.length > 0 && (
          <section aria-labelledby="unassigned-heading">
            <h2
              id="unassigned-heading"
              className="text-[var(--p-text-base)] font-bold text-[var(--color-text)] mb-3 flex items-center gap-2"
            >
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-white text-[var(--p-text-xs)] font-black"
                aria-label={`${unassigned.length} unassigned`}
              >
                {unassigned.length}
              </span>
              Needs Driver Assignment
            </h2>
            <ul
              role="list"
              aria-label="Unassigned delivery orders"
              className="space-y-2"
            >
              {unassigned.map((order) => (
                <li key={order.id} role="listitem">
                  <DeliveryOrderRow
                    order={order}
                    liveStatus={liveStatuses[order.id]}
                    action={
                      <DriverAssignSelect
                        drivers={drivers}
                        onAssign={(driverId) => handleAssign(order.id, driverId)}
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* In-flight deliveries */}
        <section aria-labelledby="inflight-heading">
          <h2
            id="inflight-heading"
            className="text-[var(--p-text-base)] font-bold text-[var(--color-text)] mb-3"
          >
            Out for Delivery
            <span className="ml-2 text-[var(--color-text-secondary)] font-normal text-[var(--p-text-sm)]">
              ({inFlight.length})
            </span>
          </h2>
          {inFlight.length === 0 ? (
            <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] py-4">
              No active deliveries.
            </p>
          ) : (
            <ul role="list" aria-label="Active deliveries" className="space-y-2">
              {inFlight.map((order) => (
                <li key={order.id} role="listitem">
                  <DeliveryOrderRow
                    order={order}
                    liveStatus={liveStatuses[order.id]}
                    action={
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(order.id, 'delivered')}
                        aria-label={`Mark order ${order.orderNumber} as delivered`}
                        className={[
                          'min-h-[44px] px-4 rounded-[var(--p-radius-md)]',
                          'bg-[var(--color-success)] text-white font-bold text-[var(--p-text-sm)]',
                          'hover:opacity-90 disabled:opacity-50',
                          'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                          'transition-opacity duration-[var(--p-dur-fast)]',
                        ].join(' ')}
                      >
                        Mark Delivered
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Delivered — awaiting completion */}
        {delivered.length > 0 && (
          <section aria-labelledby="delivered-heading">
            <h2
              id="delivered-heading"
              className="text-[var(--p-text-base)] font-bold text-[var(--color-text)] mb-3"
            >
              Delivered — Pending Completion
              <span className="ml-2 text-[var(--color-text-secondary)] font-normal text-[var(--p-text-sm)]">
                ({delivered.length})
              </span>
            </h2>
            <ul role="list" aria-label="Delivered orders awaiting completion" className="space-y-2">
              {delivered.map((order) => (
                <li key={order.id} role="listitem">
                  <DeliveryOrderRow
                    order={order}
                    liveStatus={liveStatuses[order.id]}
                    action={
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(order.id, 'completed')}
                        aria-label={`Complete order ${order.orderNumber}`}
                        className={[
                          'min-h-[44px] px-4 rounded-[var(--p-radius-md)]',
                          'bg-[var(--color-bg-tertiary)] text-[var(--color-text)] font-bold text-[var(--p-text-sm)]',
                          'hover:bg-[var(--color-bg-secondary)] disabled:opacity-50',
                          'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                          'transition-colors duration-[var(--p-dur-fast)]',
                        ].join(' ')}
                      >
                        Complete
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
FILE_EOF

# [10/12] pages/Delivery/components/DeliveryOrderRow.tsx
print -P "%F{cyan}  [10/12] pages/Delivery/components/DeliveryOrderRow.tsx%f"
cat > "${PLATFORM_ROOT}/apps/staff/src/pages/Delivery/components/DeliveryOrderRow.tsx" << 'FILE_EOF'
// apps/staff/src/pages/Delivery/components/DeliveryOrderRow.tsx
import React from 'react';
import { MapPin, User, Package } from 'lucide-react';
import { formatCurrency, formatTime } from '@cannasaas/utils';
import type { Order } from '@cannasaas/types';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';

interface DeliveryOrderRowProps {
  order: Order;
  liveStatus?: string;       // Real-time override from WebSocket
  action: React.ReactNode;   // Varies by context: assign select vs status button
}

/**
 * DeliveryOrderRow — Single row in the dispatch list.
 *
 * Accepts a `liveStatus` override so WebSocket updates are reflected
 * immediately without waiting for the polling refetch.
 *
 * WCAG 1.3.1: Address and driver details are in a <dl> so screen readers
 *             expose the label/value relationship correctly.
 */
export function DeliveryOrderRow({ order, liveStatus, action }: DeliveryOrderRowProps) {
  const effectiveStatus = liveStatus ?? order.status;

  return (
    <article
      aria-labelledby={`dispatch-${order.id}-num`}
      className={[
        'flex flex-col sm:flex-row sm:items-center gap-4 p-4',
        'bg-[var(--color-surface)] border border-[var(--color-border)]',
        'rounded-[var(--p-radius-lg)]',
        'transition-colors duration-[var(--p-dur-fast)]',
      ].join(' ')}
    >
      {/* Left: order info */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Order number + status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            id={`dispatch-${order.id}-num`}
            className="font-bold text-[var(--color-text)] text-[var(--p-text-sm)]"
          >
            #{order.orderNumber}
          </span>
          <DeliveryStatusBadge status={effectiveStatus as any} />
          <span className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            {formatTime(order.createdAt)}
          </span>
        </div>

        {/* Delivery details */}
        <dl className="space-y-1">
          <div className="flex items-start gap-1.5">
            <dt className="sr-only">Delivery address</dt>
            <MapPin size={13} className="text-[var(--color-text-secondary)] mt-0.5 flex-shrink-0" aria-hidden="true" />
            <dd className="text-[var(--p-text-sm)] text-[var(--color-text)] leading-snug">
              {order.deliveryAddress
                ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`
                : 'Address not set'}
            </dd>
          </div>

          {order.driverName && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Assigned driver</dt>
              <User size={13} className="text-[var(--color-text-secondary)] flex-shrink-0" aria-hidden="true" />
              <dd className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
                {order.driverName}
              </dd>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Order contents</dt>
            <Package size={13} className="text-[var(--color-text-secondary)] flex-shrink-0" aria-hidden="true" />
            <dd className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {formatCurrency(order.total)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Right: action slot */}
      <div className="flex-shrink-0">
        {action}
      </div>
    </article>
  );
}
FILE_EOF

# [11/12] pages/Delivery/components/DeliveryStatusBadge.tsx
print -P "%F{cyan}  [11/12] pages/Delivery/components/DeliveryStatusBadge.tsx%f"
cat > "${PLATFORM_ROOT}/apps/staff/src/pages/Delivery/components/DeliveryStatusBadge.tsx" << 'FILE_EOF'
// apps/staff/src/pages/Delivery/components/DeliveryStatusBadge.tsx
import React from 'react';
import type { OrderStatus } from '@cannasaas/types';

const STATUS_CONFIG: Partial<Record<OrderStatus, { label: string; classes: string }>> = {
  pending:          { label: 'Pending',      classes: 'bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300' },
  confirmed:        { label: 'Confirmed',    classes: 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300' },
  out_for_delivery: { label: 'En Route',     classes: 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]' },
  delivered:        { label: 'Delivered',    classes: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300' },
  completed:        { label: 'Completed',    classes: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]' },
  cancelled:        { label: 'Cancelled',    classes: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400' },
};

interface DeliveryStatusBadgeProps {
  status: OrderStatus;
}

/**
 * DeliveryStatusBadge — Delivery-context status labels.
 *
 * Uses "En Route" in place of the raw "out_for_delivery" API value
 * for clearer driver-facing language.
 *
 * WCAG 1.4.1: Status communicated by text, colour is supplementary.
 */
export function DeliveryStatusBadge({ status }: DeliveryStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full',
        'text-[var(--p-text-xs)] font-semibold',
        config.classes,
      ].join(' ')}
      // WCAG 1.3.1: aria-label exposes full status to screen readers
      aria-label={`Delivery status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
FILE_EOF

# [12/12] pages/Delivery/components/DriverAssignSelect.tsx
print -P "%F{cyan}  [12/12] pages/Delivery/components/DriverAssignSelect.tsx%f"
cat > "${PLATFORM_ROOT}/apps/staff/src/pages/Delivery/components/DriverAssignSelect.tsx" << 'FILE_EOF'
// apps/staff/src/pages/Delivery/components/DriverAssignSelect.tsx
import React, { useState } from 'react';
import type { Driver } from '@cannasaas/types';

interface DriverAssignSelectProps {
  drivers: Driver[];
  onAssign: (driverId: string) => void;
}

/**
 * DriverAssignSelect — Inline driver assignment control for unassigned orders.
 *
 * On selection the <select> calls onAssign immediately — no separate submit
 * button needed because the action is easily reversible (reassign).
 * A "Not assigned" placeholder prevents an accidental assignment on first render.
 *
 * WCAG 3.3.2: Label is programmatically associated even though it is sr-only
 *             (the card context makes the visual label redundant).
 */
export function DriverAssignSelect({ drivers, onAssign }: DriverAssignSelectProps) {
  const [selected, setSelected] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const driverId = e.target.value;
    if (!driverId) return;
    setSelected(driverId);
    onAssign(driverId);
  }

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="driver-assign"
        className="sr-only"
      >
        Assign driver
      </label>
      <select
        id="driver-assign"
        value={selected}
        onChange={handleChange}
        className={[
          'h-10 pl-3 pr-8 rounded-[var(--p-radius-md)]',
          'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
          'text-[var(--p-text-sm)] text-[var(--color-text)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
          'cursor-pointer min-w-[160px]',
        ].join(' ')}
        aria-label="Assign driver to this order"
      >
        <option value="">Assign driver…</option>
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.firstName} {driver.lastName}
          </option>
        ))}
      </select>
      {drivers.length === 0 && (
        <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
          No available drivers
        </p>
      )}
    </div>
  );
}
FILE_EOF

# ── 3. Summary ────────────────────────────────────────────────────
echo ""
print -P "%F{green}✓  Done — 12 files written to ${PLATFORM_ROOT}/apps/staff/src%f"
echo ""
print -P "%F{cyan}Directory tree:%f"
if command -v tree &>/dev/null; then
  tree "${PLATFORM_ROOT}/apps/staff/src"
else
  find "${PLATFORM_ROOT}/apps/staff/src" -type f | sort | \
    sed "s|${PLATFORM_ROOT}/||"
fi

