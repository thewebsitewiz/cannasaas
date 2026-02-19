/**
 * @file CustomersPage.tsx
 * @path apps/admin/src/pages/Customers/CustomersPage.tsx
 *
 * Customer management page. DataTable with search/filter controls.
 * Clicking a row navigates to the CustomerDetailPage.
 * Managers can approve/reject age or medical card verification requests.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type ColumnDef, type SortState } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { Customer, CustomerFilters } from '../../types/admin.types';
import styles from './CustomersPage.module.css';

// ─── Column Definitions ───────────────────────────────────────────────────────

const COLUMNS: ColumnDef<Customer>[] = [
  {
    key: 'displayName',
    label: 'Customer',
    sortable: true,
    render: (row) => (
      <div className={styles.nameCell}>
        <div className={styles.avatar} aria-hidden="true">
          {row.displayName.charAt(0).toUpperCase()}
        </div>
        <div className={styles.nameInfo}>
          <span className={styles.name}>{row.displayName}</span>
          <span className={styles.email}>{row.email}</span>
        </div>
      </div>
    ),
  },
  {
    key: 'verificationStatus',
    label: 'Verification',
    sortable: true,
    render: (row) => <StatusBadge type="verification" value={row.verificationStatus} />,
  },
  {
    key: 'isMedical',
    label: 'Medical',
    align: 'center',
    render: (row) => (
      <span aria-label={row.isMedical ? 'Medical patient' : 'Recreational'}>
        {row.isMedical ? '✓' : '—'}
      </span>
    ),
  },
  {
    key: 'totalOrders',
    label: 'Orders',
    sortable: true,
    align: 'right',
    render: (row) => <span className={styles.mono}>{row.totalOrders}</span>,
  },
  {
    key: 'lifetimeValueCents',
    label: 'LTV',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className={styles.mono}>${(row.lifetimeValueCents / 100).toFixed(0)}</span>
    ),
  },
  {
    key: 'loyaltyPoints',
    label: 'Points',
    sortable: true,
    align: 'right',
    render: (row) => (
      <span className={styles.mono}>{row.loyaltyPoints.toLocaleString()}</span>
    ),
  },
  {
    key: 'joinedAt',
    label: 'Joined',
    sortable: true,
    render: (row) => (
      <span className={styles.date}>
        {new Date(row.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortState>({ column: 'joinedAt', direction: 'desc' });
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '', verificationStatus: '', isMedical: null, hasOrders: null,
  });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sort: `${sort.column}:${sort.direction}`,
        ...(filters.search && { search: filters.search }),
        ...(filters.verificationStatus && { verificationStatus: filters.verificationStatus }),
        ...(filters.isMedical !== null && { isMedical: String(filters.isMedical) }),
      });
      const res = await fetch(`/api/admin/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.items ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sort, filters]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const stableCols = useMemo(() => COLUMNS, []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Customers"
        subtitle="Manage customer accounts and verification requests."
        breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Customers' }]}
      />

      {/* ── Filter Bar ───────────────────────────────────────────── */}
      <div className={styles.filterBar} role="search" aria-label="Filter customers">
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search name or email…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          aria-label="Search customers"
        />
        <select
          className={styles.filterSelect}
          value={filters.verificationStatus}
          onChange={(e) => setFilters((f) => ({ ...f, verificationStatus: e.target.value as CustomerFilters['verificationStatus'] }))}
          aria-label="Filter by verification status"
        >
          <option value="">All Verification</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending Review</option>
          <option value="unverified">Unverified</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filters.isMedical === null ? '' : String(filters.isMedical)}
          onChange={(e) => setFilters((f) => ({
            ...f,
            isMedical: e.target.value === '' ? null : e.target.value === 'true',
          }))}
          aria-label="Filter by medical status"
        >
          <option value="">All Types</option>
          <option value="true">Medical Only</option>
          <option value="false">Recreational Only</option>
        </select>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className={styles.tableWrapper}>
        <DataTable<Customer>
          caption="Customers list"
          columns={stableCols}
          rows={customers}
          sort={sort}
          onSortChange={setSort}
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/admin/customers/${row.id}`)}
          emptyState={<p className={styles.emptyText}>No customers match your filters.</p>}
        />
      </div>
    </div>
  );
}

