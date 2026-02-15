import { Building2, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies');
      setCompanies(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : generateSlug(name),
    }));
  };

  const handleCreate = async () => {
    try {
      await api.post('/companies', formData);
      setShowForm(false);
      setFormData({ name: '', slug: '', description: '' });
      fetchCompanies();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create company');
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await api.put(`/companies/${editingId}`, formData);
      setEditingId(null);
      setFormData({ name: '', slug: '', description: '' });
      fetchCompanies();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update company');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete company "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/companies/${id}`);
      fetchCompanies();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete company');
    }
  };

  const startEdit = (company: Company) => {
    setEditingId(company.id);
    setFormData({
      name: company.name,
      slug: company.slug,
      description: company.description || '',
    });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({ name: '', slug: '', description: '' });
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
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-500 mt-1">
            Manage operating companies within your organization.
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            cancelEdit();
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Company
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

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Company</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="company-slug"
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
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate}>Create</Button>
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Companies Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Name
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Slug
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Status
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Created
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-400"
                >
                  No companies found. Create one to get started.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  {editingId === company.id ? (
                    <>
                      <td className="px-6 py-4">
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="h-8"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData({ ...formData, slug: e.target.value })
                          }
                          className="h-8"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="h-8"
                          placeholder="Description"
                        />
                      </td>
                      <td className="px-6 py-4" />
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={handleUpdate}
                          className="text-green-600 hover:text-green-800 mr-3"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">
                            {company.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm font-mono">
                        {company.slug}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            company.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => startEdit(company)}
                          className="text-gray-400 hover:text-blue-600 mr-3"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id, company.name)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
