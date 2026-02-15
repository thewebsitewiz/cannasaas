import {
  AlertTriangle,
  Check,
  Package,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  category: string | null;
  productType: string;
  strainType: string | null;
  thcContent: number | null;
  cbdContent: number | null;
  manufacturer: string | null;
  isActive: boolean;
  createdAt: string;
}

const PRODUCT_TYPES = [
  'flower',
  'edible',
  'concentrate',
  'topical',
  'accessory',
  'pre_roll',
  'vape',
  'tincture',
];

const STRAIN_TYPES = ['sativa', 'indica', 'hybrid', 'cbd'];

const EMPTY_FORM = {
  name: '',
  description: '',
  sku: '',
  price: '',
  category: '',
  productType: 'flower',
  strainType: 'hybrid',
  thcContent: '',
  cbdContent: '',
  manufacturer: '',
};

const productTypeColors: Record<string, string> = {
  flower: 'bg-green-100 text-green-800',
  edible: 'bg-yellow-100 text-yellow-800',
  concentrate: 'bg-amber-100 text-amber-800',
  topical: 'bg-blue-100 text-blue-800',
  accessory: 'bg-gray-100 text-gray-800',
  pre_roll: 'bg-lime-100 text-lime-800',
  vape: 'bg-purple-100 text-purple-800',
  tincture: 'bg-teal-100 text-teal-800',
};

const strainTypeColors: Record<string, string> = {
  sativa: 'bg-orange-100 text-orange-800',
  indica: 'bg-indigo-100 text-indigo-800',
  hybrid: 'bg-emerald-100 text-emerald-800',
  cbd: 'bg-cyan-100 text-cyan-800',
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStrain, setFilterStrain] = useState('');

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        api.get('/products'),
        api.get('/products/categories'),
      ]);
      if (prodRes.status === 'fulfilled') {
        setProducts(
          Array.isArray(prodRes.value.data) ? prodRes.value.data : [],
        );
      }
      if (catRes.status === 'fulfilled') {
        setCategories(
          Array.isArray(catRes.value.data) ? catRes.value.data : [],
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Category Management ---

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await api.post('/products/categories', { name: newCategoryName.trim() });
      setNewCategoryName('');
      setShowCategoryForm(false);
      const catRes = await api.get('/products/categories');
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create category');
    }
  };

  // --- Product CRUD ---

  const handleCreate = async () => {
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        thcContent: formData.thcContent
          ? parseFloat(formData.thcContent)
          : null,
        cbdContent: formData.cbdContent
          ? parseFloat(formData.cbdContent)
          : null,
      };
      await api.post('/products', payload);
      setShowForm(false);
      setFormData({ ...EMPTY_FORM });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create product');
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        thcContent: formData.thcContent
          ? parseFloat(formData.thcContent)
          : null,
        cbdContent: formData.cbdContent
          ? parseFloat(formData.cbdContent)
          : null,
      };
      await api.put(`/products/${editingId}`, payload);
      setEditingId(null);
      setFormData({ ...EMPTY_FORM });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete product "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      description: p.description || '',
      sku: p.sku,
      price: p.price?.toString() || '',
      category: p.category || '',
      productType: p.productType,
      strainType: p.strainType || 'hybrid',
      thcContent: p.thcContent?.toString() || '',
      cbdContent: p.cbdContent?.toString() || '',
      manufacturer: p.manufacturer || '',
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({ ...EMPTY_FORM });
  };

  // --- Filtering ---

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.manufacturer || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || p.productType === filterType;
    const matchesStrain = !filterStrain || p.strainType === filterStrain;
    return matchesSearch && matchesType && matchesStrain;
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);

  const formatLabel = (value: string) =>
    value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} in
            catalog
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="flex items-center gap-2"
          >
            <Tag className="w-4 h-4" /> Categories ({categories.length})
          </Button>
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ ...EMPTY_FORM });
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="float-right">
            &times;
          </button>
        </div>
      )}

      {/* Category Manager */}
      {showCategoryForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Manage Categories</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No categories yet. Create one below.
              </p>
            ) : (
              categories.map((cat) => (
                <span
                  key={cat.id}
                  className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                >
                  {cat.name}
                </span>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="max-w-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
            />
            <Button onClick={handleCreateCategory}>Add Category</Button>
          </div>
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Product' : 'New Product'}
          </h2>

          {/* Row 1: Name, SKU, Price */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Product name"
              />
            </div>
            <div>
              <Label>SKU</Label>
              <Input
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                placeholder="SKU-001"
              />
            </div>
            <div>
              <Label>Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Row 2: Type, Strain, Category, Manufacturer */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>Product Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.productType}
                onChange={(e) =>
                  setFormData({ ...formData, productType: e.target.value })
                }
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {formatLabel(t)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Strain Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.strainType}
                onChange={(e) =>
                  setFormData({ ...formData, strainType: e.target.value })
                }
              >
                {STRAIN_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {formatLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Category</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Manufacturer</Label>
              <Input
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
                placeholder="Brand name"
              />
            </div>
          </div>

          {/* Row 3: THC, CBD, Description */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>THC %</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.thcContent}
                onChange={(e) =>
                  setFormData({ ...formData, thcContent: e.target.value })
                }
                placeholder="0.0"
              />
            </div>
            <div>
              <Label>CBD %</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.cbdContent}
                onChange={(e) =>
                  setFormData({ ...formData, cbdContent: e.target.value })
                }
                placeholder="0.0"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Product description"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={editingId ? handleUpdate : handleCreate}>
              {editingId ? 'Save Changes' : 'Create Product'}
            </Button>
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, SKU, or manufacturer..."
              className="pl-10"
            />
          </div>
          <div>
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {formatLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filterStrain}
              onChange={(e) => setFilterStrain(e.target.value)}
            >
              <option value="">All Strains</option>
              {STRAIN_TYPES.map((s) => (
                <option key={s} value={s}>
                  {formatLabel(s)}
                </option>
              ))}
            </select>
          </div>
          {(searchTerm || filterType || filterStrain) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('');
                setFilterStrain('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Product
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                SKU
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Type
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Strain
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Price
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                THC%
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Status
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-gray-400"
                >
                  {products.length === 0
                    ? 'No products yet. Add your first product to get started.'
                    : 'No products match your filters.'}
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">
                          {p.name}
                        </span>
                        {p.manufacturer && (
                          <p className="text-xs text-gray-400">
                            {p.manufacturer}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {p.sku}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${productTypeColors[p.productType] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {formatLabel(p.productType)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {p.strainType ? (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${strainTypeColors[p.strainType] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {formatLabel(p.strainType)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {formatPrice(p.price)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">
                    {p.thcContent != null ? `${p.thcContent}%` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        p.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-gray-400 hover:text-blue-600 mr-3"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Table footer with count */}
        {filteredProducts.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-xs text-gray-500">
            Showing {filteredProducts.length} of {products.length} product
            {products.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
