/**
 * ═══════════════════════════════════════════════════════════════════
 * ProductList.tsx — Products Management DataTable
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/admin/src/pages/Products/ProductList.tsx
 *
 * Features:
 *  - DataTable with sortable columns: image, name, category, THC%, price, stock, status
 *  - Search + filter by category, status, stock
 *  - Bulk actions: activate, deactivate, delete
 *  - Create/Edit navigation
 *  - Pagination
 *
 * API:
 *  GET  /products               (Sprint 4)
 *  PUT  /products/:id           (Sprint 4 - status toggle)
 *  DELETE /products/:id         (Sprint 4)
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Plus, Search, Filter, MoreHorizontal, Edit, Trash2,
  ToggleLeft, ToggleRight, Package, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle2, XCircle, ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@cannasaas/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  strainType: string;
  thcContent: number | null;
  cbdContent: number | null;
  isActive: boolean;
  images: { url: string; isPrimary: boolean; altText?: string }[];
  variants: { id: string; name: string; price: number; salePrice?: number; quantity: number; sku: string }[];
  metrcId?: string;
}

interface ProductsResponse {
  data: Product[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

// ─── Category Config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  'all', 'flower', 'pre-roll', 'vape', 'concentrate', 'edible', 'tincture', 'topical', 'accessory',
] as const;

// ─── Stock Status Helper ──────────────────────────────────────────────────────

function getStockStatus(variants: Product['variants']) {
  const totalStock = variants.reduce((sum, v) => sum + v.quantity, 0);
  if (totalStock === 0) return { label: 'Out of Stock', color: 'text-red-400', bgColor: 'bg-red-900/20 border-red-800/30', icon: XCircle };
  if (totalStock <= 5) return { label: 'Low', color: 'text-amber-400', bgColor: 'bg-amber-900/20 border-amber-800/30', icon: AlertTriangle };
  return { label: `${totalStock}`, color: 'text-emerald-400', bgColor: 'bg-emerald-900/20 border-emerald-800/30', icon: CheckCircle2 };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── State ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // ── URL Params → Filters ──
  const page = parseInt(searchParams.get('page') ?? '1');
  const search = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? 'all';
  const statusFilter = searchParams.get('status') ?? 'all';
  const stockFilter = searchParams.get('filter') ?? '';

  const updateParam = (key: string, val: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val && val !== 'all') next.set(key, val); else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });
  };

  // ── Query ──
  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: ['products', { page, search, category, statusFilter, stockFilter, sortField, sortDir }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sort: `${sortField}_${sortDir}`,
        ...(search && { q: search }),
        ...(category !== 'all' && { category }),
        ...(statusFilter !== 'all' && { isActive: statusFilter === 'active' ? 'true' : 'false' }),
        ...(stockFilter === 'low-stock' && { lowStock: 'true' }),
      });
      return apiClient.get(`/products?${params}`).then(r => r.data);
    },
  });

  // ── Mutations ──
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.put(`/products/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product status updated' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteTarget(null);
      setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteTarget!); return n; });
      toast({ title: 'Product deleted' });
    },
  });

  // ── Bulk Actions ──
  const handleBulkAction = useCallback(async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);

    if (bulkAction === 'delete') {
      await Promise.all(ids.map(id => apiClient.delete(`/products/${id}`)));
      toast({ title: `Deleted ${ids.length} products` });
    } else if (bulkAction === 'activate' || bulkAction === 'deactivate') {
      await Promise.all(ids.map(id =>
        apiClient.put(`/products/${id}`, { isActive: bulkAction === 'activate' })
      ));
      toast({ title: `${bulkAction === 'activate' ? 'Activated' : 'Deactivated'} ${ids.length} products` });
    }

    queryClient.invalidateQueries({ queryKey: ['products'] });
    setSelectedIds(new Set());
    setBulkAction('');
  }, [bulkAction, selectedIds, queryClient, toast]);

  // ── Selection helpers ──
  const allIds = data?.data.map(p => p.id) ?? [];
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  const someSelected = allIds.some(id => selectedIds.has(id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 lg:p-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
            <p className="text-slate-400 text-sm">
              {pagination?.total ?? 0} total products
            </p>
          </div>
        </div>
        <Link to="/products/new">
          <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => updateParam('q', e.target.value)}
            className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-amber-500/50 h-9"
          />
        </div>
        {/* Category filter */}
        <Select value={category} onValueChange={v => updateParam('category', v)}>
          <SelectTrigger className="w-[160px] bg-slate-900 border-slate-800 text-white h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c} className="text-white capitalize focus:bg-slate-800">
                {c === 'all' ? 'All Categories' : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Status filter */}
        <Select value={statusFilter} onValueChange={v => updateParam('status', v)}>
          <SelectTrigger className="w-[140px] bg-slate-900 border-slate-800 text-white h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-white focus:bg-slate-800">All Status</SelectItem>
            <SelectItem value="active" className="text-white focus:bg-slate-800">Active</SelectItem>
            <SelectItem value="inactive" className="text-white focus:bg-slate-800">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Bulk Actions Bar ── */}
      {someSelected && (
        <div className="flex items-center gap-3 p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg mb-4">
          <span className="text-sm text-amber-300 font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-[160px] bg-slate-900 border-slate-700 text-white h-8 text-sm">
              <SelectValue placeholder="Bulk action…" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="activate" className="text-white focus:bg-slate-800">Activate</SelectItem>
              <SelectItem value="deactivate" className="text-white focus:bg-slate-800">Deactivate</SelectItem>
              <SelectItem value="delete" className="text-red-400 focus:bg-slate-800">Delete</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!bulkAction}
            onClick={handleBulkAction}
            className="h-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm"
          >
            Apply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
            className="h-8 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Clear
          </Button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                {/* Checkbox */}
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    ref={el => { if (el) (el as any).indeterminate = someSelected && !allSelected; }}
                    onCheckedChange={toggleAll}
                    className="border-slate-600"
                  />
                </th>
                <th className="px-3 py-3 text-left w-16 text-slate-400 font-medium text-xs uppercase tracking-wider">Image</th>
                <th className="px-3 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-white transition-colors">
                    Name <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Category</th>
                <th className="px-3 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">
                  <button onClick={() => toggleSort('thcContent')} className="flex items-center gap-1 hover:text-white transition-colors">
                    THC% <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">
                  <button onClick={() => toggleSort('price')} className="flex items-center gap-1 hover:text-white transition-colors">
                    Price <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Stock</th>
                <th className="px-3 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="bg-slate-950 divide-y divide-slate-900">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <Skeleton className="h-5 bg-slate-800 rounded" style={{ width: j === 2 ? '120px' : '60px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Package className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400">No products found</p>
                    <Link to="/products/new" className="mt-2 inline-block">
                      <Button size="sm" className="mt-3 bg-amber-500 hover:bg-amber-400 text-slate-950">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add your first product
                      </Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const primaryImage = product.images.find(i => i.isPrimary) ?? product.images[0];
                  const lowestPrice = Math.min(...product.variants.map(v => v.price));
                  const stockStatus = getStockStatus(product.variants);
                  const StockIcon = stockStatus.icon;
                  const isChecked = selectedIds.has(product.id);

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${isChecked ? 'bg-amber-900/10' : 'hover:bg-slate-900/50'}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleOne(product.id)}
                          className="border-slate-600"
                        />
                      </td>
                      {/* Thumbnail */}
                      <td className="px-3 py-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                          {primaryImage ? (
                            <img
                              src={primaryImage.url}
                              alt={primaryImage.altText ?? product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-slate-600" />
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Name */}
                      <td className="px-3 py-3">
                        <Link to={`/products/${product.id}/edit`} className="hover:text-amber-400 transition-colors">
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.brand}</p>
                        </Link>
                      </td>
                      {/* Category */}
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-xs capitalize">
                          {product.category}
                        </span>
                      </td>
                      {/* THC% */}
                      <td className="px-3 py-3">
                        <span className="font-mono text-amber-400 text-sm">
                          {product.thcContent != null ? `${product.thcContent}%` : '—'}
                        </span>
                      </td>
                      {/* Price */}
                      <td className="px-3 py-3">
                        <span className="font-mono text-white text-sm">
                          {formatCurrency(lowestPrice)}
                          {product.variants.length > 1 && <span className="text-slate-500 text-xs ml-1">+</span>}
                        </span>
                      </td>
                      {/* Stock */}
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${stockStatus.bgColor} ${stockStatus.color}`}>
                          <StockIcon className="h-3 w-3" />
                          {stockStatus.label}
                        </span>
                      </td>
                      {/* Active */}
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleStatusMutation.mutate({ id: product.id, isActive: !product.isActive })}
                          className="flex items-center gap-1.5 group"
                        >
                          {product.isActive ? (
                            <>
                              <span className="h-2 w-2 rounded-full bg-emerald-400" />
                              <span className="text-emerald-400 text-xs group-hover:text-emerald-300">Active</span>
                            </>
                          ) : (
                            <>
                              <span className="h-2 w-2 rounded-full bg-slate-600" />
                              <span className="text-slate-500 text-xs group-hover:text-slate-400">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      {/* Actions menu */}
                      <td className="px-3 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white hover:bg-slate-800">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-white">
                            <DropdownMenuItem
                              onClick={() => navigate(`/products/${product.id}/edit`)}
                              className="focus:bg-slate-800 cursor-pointer gap-2"
                            >
                              <Edit className="h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleStatusMutation.mutate({ id: product.id, isActive: !product.isActive })}
                              className="focus:bg-slate-800 cursor-pointer gap-2"
                            >
                              {product.isActive
                                ? <><ToggleLeft className="h-3.5 w-3.5" /> Deactivate</>
                                : <><ToggleRight className="h-3.5 w-3.5" /> Activate</>
                              }
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-800" />
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(product.id)}
                              className="text-red-400 focus:bg-red-900/30 focus:text-red-300 cursor-pointer gap-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              Showing {((page - 1) * pagination.pageSize) + 1}–{Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
                className="h-7 w-7 p-0 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-slate-400 font-mono">{page} / {pagination.totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => updateParam('page', String(page + 1))}
                className="h-7 w-7 p-0 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Product?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. The product will be permanently removed from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
