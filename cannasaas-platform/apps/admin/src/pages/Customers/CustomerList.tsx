/**
 * ═══════════════════════════════════════════════════════════════════
 * CustomerList.tsx — Customer Management
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/admin/src/pages/Customers/CustomerList.tsx
 *
 * Features:
 *  - Searchable, filterable customer list
 *  - Verification status badges (age-verified, medical card)
 *  - Lifetime value, loyalty points, order count
 *  - Navigate to customer detail
 *
 * API: GET /users (Sprint 2 — role=customer)
 */

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users, Search, ChevronLeft, ChevronRight, ShieldCheck,
  ShieldAlert, Star, Eye, ArrowUpDown, UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@cannasaas/utils';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isVerified: boolean;
  isMedicalPatient: boolean;
  orderCount: number;
  lifetimeValue: number;
  loyaltyPoints: number;
  lastOrderAt: string | null;
  createdAt: string;
}

interface CustomersResponse {
  data: Customer[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export default function CustomerList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') ?? '1');
  const search = searchParams.get('q') ?? '';
  const verifiedFilter = searchParams.get('verified') ?? 'all';
  const sortField = searchParams.get('sort') ?? 'createdAt';
  const sortDir = (searchParams.get('dir') ?? 'desc') as 'asc' | 'desc';

  const updateParam = (key: string, val: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val && val !== 'all') next.set(key, val); else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });
  };

  const toggleSort = (field: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (prev.get('sort') === field) {
        next.set('dir', prev.get('dir') === 'asc' ? 'desc' : 'asc');
      } else {
        next.set('sort', field);
        next.set('dir', 'desc');
      }
      return next;
    });
  };

  const { data, isLoading } = useQuery<CustomersResponse>({
    queryKey: ['customers', { page, search, verifiedFilter, sortField, sortDir }],
    queryFn: () => {
      const p = new URLSearchParams({
        page: String(page), limit: '25',
        role: 'customer',
        sort: `${sortField}_${sortDir}`,
        ...(search && { q: search }),
        ...(verifiedFilter !== 'all' && { isVerified: verifiedFilter }),
      });
      return apiClient.get(`/users?${p}`).then(r => r.data);
    },
  });

  const customers = data?.data ?? [];
  const pagination = data?.pagination;

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 lg:p-8">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
            <p className="text-slate-400 text-sm">{pagination?.total ?? '—'} total customers</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => updateParam('q', e.target.value)}
            className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500/50 h-9"
          />
        </div>
        <Select value={verifiedFilter} onValueChange={v => updateParam('verified', v)}>
          <SelectTrigger className="w-[160px] bg-slate-900 border-slate-800 text-white h-9">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-white focus:bg-slate-800">All Customers</SelectItem>
            <SelectItem value="true" className="text-white focus:bg-slate-800">Verified Only</SelectItem>
            <SelectItem value="false" className="text-white focus:bg-slate-800">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Verification</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">
                  <button onClick={() => toggleSort('orderCount')} className="flex items-center gap-1 hover:text-white">
                    Orders <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">
                  <button onClick={() => toggleSort('lifetimeValue')} className="flex items-center gap-1 hover:text-white">
                    Lifetime Value <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Loyalty Pts</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Last Order</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">
                  <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 hover:text-white">
                    Joined <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="bg-slate-950 divide-y divide-slate-900">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-5 bg-slate-800 rounded" style={{ width: j === 0 ? '150px' : '70px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Users className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400">No customers found</p>
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 shrink-0">
                          {customer.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{customer.firstName} {customer.lastName}</p>
                          <p className="text-xs text-slate-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {customer.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-900/20 border border-emerald-800/30 text-emerald-300 text-xs rounded-full">
                            <ShieldCheck className="h-3 w-3" /> ID Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-full">
                            <ShieldAlert className="h-3 w-3" /> Unverified
                          </span>
                        )}
                        {customer.isMedicalPatient && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-900/20 border border-blue-800/30 text-blue-300 text-xs rounded-full">
                            Medical
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-white">{customer.orderCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-amber-400 font-medium">{formatCurrency(customer.lifetimeValue)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-sm text-slate-300">
                        <Star className="h-3 w-3 text-amber-400" />
                        {customer.loyaltyPoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-xs">{formatDate(customer.lastOrderAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-xs">{formatDate(customer.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/customers/${customer.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white hover:bg-slate-800">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              {((page - 1) * pagination.pageSize) + 1}–{Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
                className="h-7 w-7 p-0 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-30">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-slate-400 font-mono">{page} / {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages}
                onClick={() => updateParam('page', String(page + 1))}
                className="h-7 w-7 p-0 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-30">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
