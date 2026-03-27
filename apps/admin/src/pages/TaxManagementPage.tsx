import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { Plus, Pencil, X, Check, CircleDot, CircleOff, Search } from 'lucide-react';

// ── GraphQL ────────────────────────────────────────────────────────────

const GET_TAX_RULES = `query { platformTaxRules { tax_category_id state code name rate tax_basis statutory_reference is_active } }`;

const ADD_TAX_RULE = `mutation($state: String!, $code: String!, $name: String!, $rate: Float!, $taxBasis: String!, $statutoryReference: String) {
  addTaxRule(state: $state, code: $code, name: $name, rate: $rate, taxBasis: $taxBasis, statutoryReference: $statutoryReference) {
    tax_category_id state code name rate tax_basis statutory_reference is_active
  }
}`;

const UPDATE_TAX_RULE = `mutation($taxCategoryId: Int!, $rate: Float, $isActive: Boolean, $name: String) {
  updateTaxRule(taxCategoryId: $taxCategoryId, rate: $rate, isActive: $isActive, name: $name) {
    tax_category_id state code name rate tax_basis statutory_reference is_active
  }
}`;

// ── Types ──────────────────────────────────────────────────────────────

interface TaxRule {
  tax_category_id: number;
  state: string;
  code: string;
  name: string;
  rate: number;
  tax_basis: string;
  statutory_reference: string | null;
  is_active: boolean;
}

interface NewRuleForm {
  state: string;
  code: string;
  name: string;
  rate: string;
  taxBasis: string;
  statutoryReference: string;
}

const EMPTY_FORM: NewRuleForm = { state: '', code: '', name: '', rate: '', taxBasis: 'retail_price', statutoryReference: '' };

const TAX_BASIS_OPTIONS = [
  { value: 'retail_price', label: 'Retail Price (%)' },
  { value: 'per_mg_thc', label: 'Per mg THC ($)' },
  { value: 'wholesale_price', label: 'Wholesale Price (%)' },
];

function formatRate(rule: TaxRule): string {
  if (rule.tax_basis === 'per_mg_thc') return `$${rule.rate}/mg`;
  return `${(rule.rate * 100).toFixed(rule.rate * 100 % 1 === 0 ? 0 : 3)}%`;
}

function basisLabel(basis: string): string {
  return TAX_BASIS_OPTIONS.find(o => o.value === basis)?.label ?? basis;
}

// ── Component ──────────────────────────────────────────────────────────

export function TaxManagementPage() {
  const queryClient = useQueryClient();
  const [stateFilter, setStateFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState<NewRuleForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; rate: string }>({ name: '', rate: '' });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const { data, isLoading } = useQuery({
    queryKey: ['taxRules'],
    queryFn: () => gqlRequest<{ platformTaxRules: TaxRule[] }>(GET_TAX_RULES),
    select: (d) => d.platformTaxRules,
  });

  const addMutation = useMutation({
    mutationFn: (input: NewRuleForm) =>
      gqlRequest(ADD_TAX_RULE, {
        state: input.state.toUpperCase(),
        code: input.code.toUpperCase(),
        name: input.name,
        rate: parseFloat(input.rate),
        taxBasis: input.taxBasis,
        statutoryReference: input.statutoryReference || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRules'] });
      setNewRule(EMPTY_FORM);
      setShowAddForm(false);
      showToast('Tax rule added');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: { taxCategoryId: number; rate?: number; isActive?: boolean; name?: string }) =>
      gqlRequest(UPDATE_TAX_RULE, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxRules'] });
      setEditingId(null);
      showToast('Tax rule updated');
    },
  });

  const rules = data ?? [];
  const filtered = stateFilter ? rules.filter(r => r.state === stateFilter) : rules;
  const states = [...new Set(rules.map(r => r.state))].sort();

  // Group by state
  const grouped = filtered.reduce<Record<string, TaxRule[]>>((acc, rule) => {
    (acc[rule.state] ??= []).push(rule);
    return acc;
  }, {});

  const startEdit = (rule: TaxRule) => {
    setEditingId(rule.tax_category_id);
    setEditForm({ name: rule.name, rate: String(rule.rate) });
  };

  const saveEdit = (rule: TaxRule) => {
    const rate = parseFloat(editForm.rate);
    if (isNaN(rate) || rate < 0) return;
    updateMutation.mutate({
      taxCategoryId: rule.tax_category_id,
      rate: rate !== rule.rate ? rate : undefined,
      name: editForm.name !== rule.name ? editForm.name : undefined,
    });
  };

  const toggleActive = (rule: TaxRule) => {
    updateMutation.mutate({ taxCategoryId: rule.tax_category_id, isActive: !rule.is_active });
  };

  if (isLoading) return <div className="text-txt-muted">Loading tax rules...</div>;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 bg-brand-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt">Tax Management</h1>
          <p className="text-sm text-txt-muted mt-1">
            {rules.length} rules across {states.length} states
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'Cancel' : 'Add Tax Rule'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-surface rounded-xl border border-bdr p-6 space-y-4">
          <h2 className="text-lg font-semibold text-txt">New Tax Rule</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-txt-muted mb-1">State Code</label>
              <input
                value={newRule.state}
                onChange={e => setNewRule({ ...newRule, state: e.target.value })}
                placeholder="e.g. NY, CA, IL"
                maxLength={2}
                className="w-full px-3 py-2 bg-surface-alt border border-bdr rounded-lg text-sm text-txt uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-muted mb-1">Code</label>
              <input
                value={newRule.code}
                onChange={e => setNewRule({ ...newRule, code: e.target.value })}
                placeholder="e.g. NY_RETAIL_EXCISE"
                className="w-full px-3 py-2 bg-surface-alt border border-bdr rounded-lg text-sm text-txt uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-muted mb-1">Tax Basis</label>
              <select
                value={newRule.taxBasis}
                onChange={e => setNewRule({ ...newRule, taxBasis: e.target.value })}
                className="w-full px-3 py-2 bg-surface-alt border border-bdr rounded-lg text-sm text-txt"
              >
                {TAX_BASIS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-txt-muted mb-1">Display Name</label>
              <input
                value={newRule.name}
                onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="e.g. NY Retail Cannabis Excise (9%)"
                className="w-full px-3 py-2 bg-surface-alt border border-bdr rounded-lg text-sm text-txt"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-muted mb-1">
                Rate {newRule.taxBasis === 'per_mg_thc' ? '($/mg)' : '(decimal, e.g. 0.09 = 9%)'}
              </label>
              <input
                type="number"
                step="any"
                value={newRule.rate}
                onChange={e => setNewRule({ ...newRule, rate: e.target.value })}
                placeholder={newRule.taxBasis === 'per_mg_thc' ? '0.005' : '0.09'}
                className="w-full px-3 py-2 bg-surface-alt border border-bdr rounded-lg text-sm text-txt"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-txt-muted mb-1">Statutory Reference (optional)</label>
              <input
                value={newRule.statutoryReference}
                onChange={e => setNewRule({ ...newRule, statutoryReference: e.target.value })}
                placeholder="e.g. NY Cannabis Law § 130(2)"
                className="w-full px-3 py-2 bg-surface-alt border border-bdr rounded-lg text-sm text-txt"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => addMutation.mutate(newRule)}
              disabled={!newRule.state || !newRule.code || !newRule.name || !newRule.rate || addMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addMutation.isPending ? 'Saving...' : 'Save Rule'}
            </button>
          </div>
          {addMutation.isError && (
            <p className="text-sm text-red-500">Error: {(addMutation.error as Error).message}</p>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            className="pl-9 pr-4 py-2 bg-surface border border-bdr rounded-lg text-sm text-txt appearance-none cursor-pointer"
          >
            <option value="">All States ({rules.length})</option>
            {states.map(s => (
              <option key={s} value={s}>{s} ({rules.filter(r => r.state === s).length})</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          {stateFilter && (
            <button
              onClick={() => setStateFilter('')}
              className="px-3 py-1.5 text-xs bg-surface-alt border border-bdr rounded-full text-txt-muted hover:text-txt transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Rules by State */}
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([state, stateRules]) => (
        <div key={state} className="bg-surface rounded-xl border border-bdr overflow-hidden">
          <div className="px-6 py-4 border-b border-bdr bg-surface-alt flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-txt">{state}</h2>
              <p className="text-xs text-txt-muted">{stateRules.length} tax {stateRules.length === 1 ? 'rule' : 'rules'}</p>
            </div>
            <span className="text-xs text-txt-muted font-mono">
              Combined: {stateRules.filter(r => r.is_active && r.tax_basis !== 'per_mg_thc')
                .reduce((sum, r) => sum + r.rate * 100, 0).toFixed(2)}% + THC excise
            </span>
          </div>
          <div className="divide-y divide-bdr">
            {stateRules.map(rule => (
              <div
                key={rule.tax_category_id}
                className={`px-6 py-4 flex items-center justify-between gap-4 ${!rule.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  {editingId === rule.tax_category_id ? (
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-2 py-1 bg-surface-alt border border-bdr rounded text-sm text-txt"
                    />
                  ) : (
                    <div className="text-sm font-medium text-txt">{rule.name}</div>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-mono text-txt-muted">{rule.code}</span>
                    <span className="text-xs text-txt-muted">·</span>
                    <span className="text-xs text-txt-muted">{basisLabel(rule.tax_basis)}</span>
                    {rule.statutory_reference && (
                      <>
                        <span className="text-xs text-txt-muted">·</span>
                        <span className="text-xs text-txt-muted italic">{rule.statutory_reference}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {editingId === rule.tax_category_id ? (
                    <>
                      <input
                        type="number"
                        step="any"
                        value={editForm.rate}
                        onChange={e => setEditForm({ ...editForm, rate: e.target.value })}
                        className="w-24 px-2 py-1 bg-surface-alt border border-bdr rounded text-sm text-txt text-right"
                      />
                      <button onClick={() => saveEdit(rule)} className="p-1.5 text-brand-500 hover:bg-brand-50 rounded transition-colors">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-txt-muted hover:bg-surface-alt rounded transition-colors">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-txt tabular-nums w-20 text-right">
                        {formatRate(rule)}
                      </span>
                      <button onClick={() => startEdit(rule)} className="p-1.5 text-txt-muted hover:text-txt hover:bg-surface-alt rounded transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => toggleActive(rule)}
                        className={`p-1.5 rounded transition-colors ${rule.is_active ? 'text-brand-500 hover:bg-brand-50' : 'text-txt-muted hover:bg-surface-alt'}`}
                        title={rule.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {rule.is_active ? <CircleDot size={14} /> : <CircleOff size={14} />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-txt-muted">
          No tax rules found{stateFilter ? ` for ${stateFilter}` : ''}.
        </div>
      )}
    </div>
  );
}
