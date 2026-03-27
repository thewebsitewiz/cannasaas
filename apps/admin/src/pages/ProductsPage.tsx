import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { Package, Search, Plus, Pencil, Trash2, X, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const PRODUCTS_QUERY = `
  query($dispensaryId: ID!, $limit: Int) {
    products(dispensaryId: $dispensaryId, limit: $limit) {
      id name description strainType strainName thcPercent cbdPercent isActive isApproved
      variants { variantId name sku quantityPerUnit retailPrice stockQuantity stockStatus }
    }
  }
`;

const CREATE_PRODUCT = `mutation($input: CreateProductInput!) { createProduct(input: $input) { id name } }`;
const UPDATE_PRODUCT = `mutation($input: UpdateProductInput!) { updateProduct(input: $input) { id name } }`;
const UPDATE_PRICE = `mutation($input: UpdateVariantPriceInput!) { updateVariantPrice(input: $input) }`;
const DELETE_PRODUCT = `mutation($productId: ID!, $dispensaryId: ID!) { deleteProduct(productId: $productId, dispensaryId: $dispensaryId) }`;

const STRAIN_BADGE: Record<string, string> = {
  sativa: 'bg-orange-50 text-orange-700',
  indica: 'bg-purple-50 text-purple-700',
  hybrid: 'bg-green-50 text-green-700',
};

const STOCK_BADGE: Record<string, { label: string; cls: string }> = {
  in_stock: { label: 'In Stock', cls: 'bg-green-50 text-green-700' },
  low_stock: { label: 'Low Stock', cls: 'bg-amber-50 text-amber-700' },
  out_of_stock: { label: 'Sold Out', cls: 'bg-red-50 text-red-700' },
};

interface ProductForm {
  name: string;
  description: string;
  strainType: string;
  strainName: string;
  thcPercent: string;
  cbdPercent: string;
  isActive: boolean;
  variantName: string;
  variantQuantityG: string;
  retailPrice: string;
}

const emptyForm: ProductForm = {
  name: '', description: '', strainType: 'hybrid', strainName: '',
  thcPercent: '', cbdPercent: '', isActive: true,
  variantName: '3.5g Jar', variantQuantityG: '3.5', retailPrice: '',
};

export function ProductsPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId) || 'c0000000-0000-0000-0000-000000000001';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [priceEdit, setPriceEdit] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['adminProducts', dispensaryId],
    queryFn: () => gqlRequest<{ products: any[] }>(PRODUCTS_QUERY, { dispensaryId, limit: 100 }),
    enabled: !!dispensaryId,
  });

  const products = data?.products ?? [];
  const filtered = search
    ? products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMut = useMutation({
    mutationFn: (input: any) => gqlRequest(CREATE_PRODUCT, { input }),
    onSuccess: () => { invalidate(); setCreating(false); setForm(emptyForm); },
  });

  const updateMut = useMutation({
    mutationFn: (input: any) => gqlRequest(UPDATE_PRODUCT, { input }),
    onSuccess: () => { invalidate(); setEditing(false); setSelected(null); },
  });

  const priceMut = useMutation({
    mutationFn: (input: any) => gqlRequest(UPDATE_PRICE, { input }),
    onSuccess: () => { invalidate(); setPriceEdit(''); },
  });

  const deleteMut = useMutation({
    mutationFn: (vars: any) => gqlRequest(DELETE_PRODUCT, vars),
    onSuccess: () => { invalidate(); setSelected(null); setConfirmDelete(false); },
  });

  const openEdit = (p: any) => {
    setSelected(p);
    setEditing(true);
    setCreating(false);
    setConfirmDelete(false);
    const v = p.variants?.[0];
    setForm({
      name: p.name || '',
      description: p.description || '',
      strainType: p.strainType || 'hybrid',
      strainName: p.strainName || '',
      thcPercent: p.thcPercent?.toString() || '',
      cbdPercent: p.cbdPercent?.toString() || '',
      isActive: p.isActive ?? true,
      variantName: v?.name || '',
      variantQuantityG: v?.quantityPerUnit?.toString() || '',
      retailPrice: v?.retailPrice?.toString() || '',
    });
    setPriceEdit(v?.retailPrice?.toString() || '');
  };

  const openCreate = () => {
    setSelected(null);
    setEditing(false);
    setCreating(true);
    setConfirmDelete(false);
    setForm(emptyForm);
  };

  const openDetail = (p: any) => {
    if (editing || creating) return;
    setSelected(p);
    setEditing(false);
    setCreating(false);
    setConfirmDelete(false);
    setPriceEdit(p.variants?.[0]?.retailPrice?.toString() || '');
  };

  const handleSaveNew = () => {
    createMut.mutate({
      dispensaryId,
      name: form.name,
      description: form.description || undefined,
      strainType: form.strainType || undefined,
      strainName: form.strainName || undefined,
      thcPercent: form.thcPercent ? parseFloat(form.thcPercent) : undefined,
      cbdPercent: form.cbdPercent ? parseFloat(form.cbdPercent) : undefined,
      isActive: form.isActive,
      variantName: form.variantName || undefined,
      variantQuantityG: form.variantQuantityG ? parseFloat(form.variantQuantityG) : undefined,
      retailPrice: form.retailPrice ? parseFloat(form.retailPrice) : undefined,
    });
  };

  const handleSaveEdit = () => {
    updateMut.mutate({
      productId: selected.id,
      dispensaryId,
      name: form.name,
      description: form.description,
      strainType: form.strainType,
      strainName: form.strainName,
      thcPercent: form.thcPercent ? parseFloat(form.thcPercent) : undefined,
      cbdPercent: form.cbdPercent ? parseFloat(form.cbdPercent) : undefined,
      isActive: form.isActive,
    });
  };

  const handlePriceSave = () => {
    const v = selected?.variants?.[0];
    if (!v || !priceEdit) return;
    priceMut.mutate({ variantId: v.variantId, dispensaryId, price: parseFloat(priceEdit) });
  };

  const closePanel = () => {
    setSelected(null);
    setEditing(false);
    setCreating(false);
    setConfirmDelete(false);
  };

  const showPanel = selected || creating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-txt">Products ({filtered.length})</h1>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
        <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" />
      </div>

      <div className={`grid ${showPanel ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'} gap-6`}>
        {/* Table */}
        <div className={`${showPanel ? 'md:col-span-2' : ''} bg-surface rounded-xl border border-border overflow-hidden`}>
          {isLoading ? (
            <div className="p-12 text-center text-txt-muted">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-bg-alt border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-txt-secondary">Product</th>
                  <th className="text-left px-5 py-3 font-medium text-txt-secondary">Strain</th>
                  <th className="text-right px-5 py-3 font-medium text-txt-secondary">Price</th>
                  <th className="text-center px-5 py-3 font-medium text-txt-secondary">Stock</th>
                  <th className="text-center px-5 py-3 font-medium text-txt-secondary">Status</th>
                  <th className="text-center px-5 py-3 font-medium text-txt-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p: any) => {
                  const v = p.variants?.[0];
                  const stock = STOCK_BADGE[v?.stockStatus] ?? STOCK_BADGE.in_stock;
                  return (
                    <tr key={p.id}
                      onClick={() => openDetail(p)}
                      className={`transition-colors cursor-pointer ${selected?.id === p.id ? 'bg-brand-50' : 'hover:bg-bg-alt'}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-50 rounded-lg"><Package size={16} className="text-brand-600" /></div>
                          <div>
                            <p className="font-medium text-txt">{p.name}</p>
                            <p className="text-xs text-txt-muted">{v?.name} · {v?.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {p.strainType && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STRAIN_BADGE[p.strainType] ?? STRAIN_BADGE.hybrid}`}>
                            {p.strainType}
                          </span>
                        )}
                        {p.thcPercent && <span className="text-xs text-txt-muted ml-2">THC {p.thcPercent}%</span>}
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums font-semibold text-txt">
                        {v?.retailPrice ? `$${Number(v.retailPrice).toFixed(2)}` : '-'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${stock.cls}`}>{stock.label}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {p.isActive ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">Active</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Inactive</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                          className="text-brand-600 hover:text-brand-700 p-1">
                          <Pencil size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Side Panel */}
        {showPanel && (
          <div className="bg-surface rounded-xl border border-border p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-txt">
                {creating ? 'New Product' : editing ? 'Edit Product' : 'Product Details'}
              </h3>
              <button onClick={closePanel} className="text-txt-muted hover:text-txt"><X size={18} /></button>
            </div>

            {(creating || editing) ? (
              /* ── Edit / Create Form ── */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-brand-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-txt-secondary mb-1">Strain Type</label>
                    <select value={form.strainType} onChange={(e) => setForm({ ...form, strainType: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-brand-500">
                      <option value="hybrid">Hybrid</option>
                      <option value="sativa">Sativa</option>
                      <option value="indica">Indica</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-txt-secondary mb-1">Strain Name</label>
                    <input value={form.strainName} onChange={(e) => setForm({ ...form, strainName: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-brand-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-txt-secondary mb-1">THC %</label>
                    <input type="number" step="0.1" value={form.thcPercent} onChange={(e) => setForm({ ...form, thcPercent: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-txt-secondary mb-1">CBD %</label>
                    <input type="number" step="0.1" value={form.cbdPercent} onChange={(e) => setForm({ ...form, cbdPercent: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-brand-500" />
                  </div>
                </div>

                {creating && (
                  <>
                    <div className="border-t border-border pt-4">
                      <p className="text-xs font-semibold text-txt-secondary mb-3">Default Variant</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-txt-secondary mb-1">Variant Name</label>
                          <input value={form.variantName} onChange={(e) => setForm({ ...form, variantName: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-brand-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-txt-secondary mb-1">Weight (g)</label>
                          <input type="number" step="0.5" value={form.variantQuantityG} onChange={(e) => setForm({ ...form, variantQuantityG: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-brand-500" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-txt-secondary mb-1">Retail Price ($)</label>
                      <input type="number" step="0.01" value={form.retailPrice} onChange={(e) => setForm({ ...form, retailPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-brand-500" />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded border-border" />
                  <span className="text-sm text-txt-secondary">Active (visible on storefront)</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={creating ? handleSaveNew : handleSaveEdit}
                    disabled={!form.name || createMut.isPending || updateMut.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
                    {(createMut.isPending || updateMut.isPending) ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {creating ? 'Create Product' : 'Save Changes'}
                  </button>
                  <button onClick={closePanel}
                    className="px-4 py-2 border border-border rounded-lg text-sm text-txt-secondary hover:bg-bg-alt">
                    Cancel
                  </button>
                </div>

                {(createMut.isError || updateMut.isError) && (
                  <p className="text-xs text-red-600">{((createMut.error || updateMut.error) as Error)?.message}</p>
                )}
              </div>
            ) : selected ? (
              /* ── Read-only Detail ── */
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-50 rounded-xl"><Package size={24} className="text-brand-600" /></div>
                  <div>
                    <p className="text-lg font-semibold text-txt">{selected.name}</p>
                    {selected.strainType && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STRAIN_BADGE[selected.strainType] ?? ''}`}>
                        {selected.strainType}
                      </span>
                    )}
                  </div>
                </div>

                {selected.description && (
                  <p className="text-sm text-txt-secondary">{selected.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selected.thcPercent != null && (
                    <div className="bg-bg-alt rounded-lg p-3">
                      <p className="text-xs text-txt-muted">THC</p>
                      <p className="font-bold text-txt">{selected.thcPercent}%</p>
                    </div>
                  )}
                  {selected.cbdPercent != null && (
                    <div className="bg-bg-alt rounded-lg p-3">
                      <p className="text-xs text-txt-muted">CBD</p>
                      <p className="font-bold text-txt">{selected.cbdPercent}%</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 text-sm">
                  {selected.isActive ? (
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Active</span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-500"><AlertCircle size={14} /> Inactive</span>
                  )}
                  {selected.isApproved && (
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Approved</span>
                  )}
                </div>

                {/* Variant & Pricing */}
                {selected.variants?.map((v: any) => (
                  <div key={v.variantId} className="border-t border-border pt-4">
                    <p className="text-xs font-semibold text-txt-secondary mb-2">Variant: {v.name}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-txt-secondary">SKU</span><span className="font-mono text-xs">{v.sku}</span></div>
                      <div className="flex justify-between"><span className="text-txt-secondary">Weight</span><span>{v.quantityPerUnit}g</span></div>
                      <div className="flex justify-between"><span className="text-txt-secondary">Stock</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(STOCK_BADGE[v.stockStatus] ?? STOCK_BADGE.in_stock).cls}`}>
                          {v.stockQuantity ?? 0} ({(STOCK_BADGE[v.stockStatus] ?? STOCK_BADGE.in_stock).label})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-txt-secondary">Price</span>
                        <div className="flex items-center gap-2">
                          <input type="number" step="0.01" value={priceEdit}
                            onChange={(e) => setPriceEdit(e.target.value)}
                            className="w-24 px-2 py-1 border border-border rounded text-sm text-right tabular-nums outline-none focus:border-brand-500" />
                          {priceEdit !== (v.retailPrice?.toString() ?? '') && (
                            <button onClick={handlePriceSave} disabled={priceMut.isPending}
                              className="text-brand-600 hover:text-brand-700 text-xs font-medium">
                              {priceMut.isPending ? '...' : 'Save'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Action buttons */}
                <div className="flex gap-2 pt-3 border-t border-border">
                  <button onClick={() => openEdit(selected)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-brand-700">
                    <Pencil size={14} /> Edit
                  </button>
                  {!confirmDelete ? (
                    <button onClick={() => setConfirmDelete(true)}
                      className="flex items-center justify-center gap-1.5 text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-lg text-xs font-medium">
                      <Trash2 size={14} /> Delete
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => deleteMut.mutate({ productId: selected.id, dispensaryId })}
                        disabled={deleteMut.isPending}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50">
                        {deleteMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Confirm
                      </button>
                      <button onClick={() => setConfirmDelete(false)}
                        className="px-2 py-2 border border-border rounded-lg text-xs text-txt-secondary hover:bg-bg-alt">
                        No
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
