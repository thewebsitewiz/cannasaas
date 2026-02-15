import { Check, Pencil, Plus, Store, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

interface Company {
  id: string;
  name: string;
}

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

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  companyId: '',
  streetAddress: '',
  city: '',
  state: '',
  zipCode: '',
  phoneNumber: '',
  email: '',
};

export function DispensariesPage() {
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const fetchData = async () => {
    try {
      const [dispRes, compRes] = await Promise.all([
        api.get('/dispensaries'),
        api.get('/companies'),
      ]);
      setDispensaries(Array.isArray(dispRes.data) ? dispRes.data : []);
      setCompanies(Array.isArray(compRes.data) ? compRes.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : generateSlug(name),
    }));
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company?.name || 'Unknown';
  };

  const handleCreate = async () => {
    try {
      await api.post('/dispensaries', formData);
      setShowForm(false);
      setFormData({ ...EMPTY_FORM });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create dispensary');
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await api.put(`/dispensaries/${editingId}`, formData);
      setEditingId(null);
      setFormData({ ...EMPTY_FORM });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update dispensary');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete dispensary "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/dispensaries/${id}`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete dispensary');
    }
  };

  const startEdit = (d: Dispensary) => {
    setEditingId(d.id);
    setFormData({
      name: d.name,
      slug: d.slug,
      description: d.description || '',
      companyId: d.companyId,
      streetAddress: d.streetAddress,
      city: d.city,
      state: d.state,
      zipCode: d.zipCode,
      phoneNumber: d.phoneNumber || '',
      email: d.email || '',
    });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({ ...EMPTY_FORM });
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
          <h1 className="text-2xl font-bold text-gray-900">Dispensaries</h1>
          <p className="text-gray-500 mt-1">
            Manage all dispensary locations across your companies.
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            cancelEdit();
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Dispensary
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="float-right">
            &times;
          </button>
        </div>
      )}

      {/* Create / Edit Form */}
      {(showForm || editingId) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Dispensary' : 'New Dispensary'}
          </h2>

          {/* Row 1: Name, Slug, Company */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Dispensary name"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="dispensary-slug"
              />
            </div>
            <div>
              <Label>Company</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.companyId}
                onChange={(e) =>
                  setFormData({ ...formData, companyId: e.target.value })
                }
              >
                <option value="">Select company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Address */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <Label>Street Address</Label>
              <Input
                value={formData.streetAddress}
                onChange={(e) =>
                  setFormData({ ...formData, streetAddress: e.target.value })
                }
                placeholder="123 Main St"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="Denver"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state: e.target.value.toUpperCase().slice(0, 2),
                    })
                  }
                  placeholder="CO"
                  maxLength={2}
                />
              </div>
              <div>
                <Label>Zip</Label>
                <Input
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                  placeholder="80202"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Contact + Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="303-555-0100"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="info@dispensary.com"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={editingId ? handleUpdate : handleCreate}>
              {editingId ? 'Save Changes' : 'Create'}
            </Button>
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Dispensaries Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Name
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Company
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Location
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Phone
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
            {dispensaries.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-400"
                >
                  No dispensaries found. Create one to get started.
                </td>
              </tr>
            ) : (
              dispensaries.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Store className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">
                          {d.name}
                        </span>
                        <p className="text-xs text-gray-400 font-mono">
                          {d.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {getCompanyName(d.companyId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {d.city}, {d.state} {d.zipCode}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {d.phoneNumber || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        d.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {d.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => startEdit(d)}
                      className="text-gray-400 hover:text-blue-600 mr-3"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id, d.name)}
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
      </div>
    </div>
  );
}
