import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from '../lib/api';
import { Plus, ToggleLeft, ToggleRight, X, Calculator, Search } from 'lucide-react';

const Q = `query { platformTaxRules { tax_category_id state code name rate tax_basis statutory_reference is_active } }`;
const ADD = `mutation($s:String!,$c:String!,$n:String!,$r:Float!,$b:String!,$ref:String){addTaxRule(state:$s,code:$c,name:$n,rate:$r,taxBasis:$b,statutoryReference:$ref){tax_category_id}}`;
const UPD = `mutation($id:Int!,$active:Boolean){updateTaxRule(taxCategoryId:$id,isActive:$active){tax_category_id}}`;

const US_STATES = [
  'AK','AL','AR','AZ','CA','CO','CT','DC','DE','FL','GA','HI','IA','ID','IL','IN',
  'KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ',
  'NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA',
  'WI','WV','WY',
];

const BASIS_OPTIONS = [
  { value: 'retail_price', label: 'Retail Price' },
  { value: 'per_mg_thc', label: 'Per mg THC' },
  { value: 'wholesale_price', label: 'Wholesale Price' },
  { value: 'per_unit', label: 'Per Unit' },
];

export function TaxConfigPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [stateFilter, setStateFilter] = useState('');
  const [st, setSt] = useState('NY');
  const [code, setCode] = useState('');
  const [nm, setNm] = useState('');
  const [rate, setRate] = useState('');
  const [basis, setBasis] = useState('retail_price');
  const [ref, setRef] = useState('');

  const { data: rules, isLoading } = useQuery({
    queryKey: ['taxRules'],
    queryFn: () => gql<any>(Q),
    select: (r) => r.platformTaxRules,
  });

  const addMut = useMutation({
    mutationFn: () => gql(ADD, { s: st, c: code, n: nm, r: parseFloat(rate), b: basis, ref: ref || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taxRules'] });
      setShowAdd(false);
      setCode('');
      setNm('');
      setRate('');
      setRef('');
    },
  });

  const toggleMut = useMutation({
    mutationFn: (args: { id: number; active: boolean }) => gql(UPD, { id: args.id, active: args.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taxRules'] }),
  });

  const allRules = rules ?? [];
  const states = [...new Set(allRules.map((r: any) => r.state))].sort();
  const filteredStates = stateFilter
    ? states.filter((s: string) => s.toLowerCase().includes(stateFilter.toLowerCase()))
    : states;

  const activeCount = allRules.filter((r: any) => r.is_active).length;
  const totalCount = allRules.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tax Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalCount} rule{totalCount !== 1 ? 's' : ''} across {states.length} state{states.length !== 1 ? 's' : ''} ({activeCount} active)
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          {showAdd ? <X size={16} /> : <Plus size={16} />}
          {showAdd ? 'Cancel' : 'Add Tax Rule'}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Calculator size={18} /> New Tax Rule
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">State</label>
              <select value={st} onChange={(e) => setSt(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. NY_EXCISE_TAX" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Display Name</label>
              <input value={nm} onChange={(e) => setNm(e.target.value)} placeholder="e.g. NY Cannabis Excise Tax" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Rate</label>
              <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 0.0635" type="number" step="0.0001" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tax Basis</label>
              <select value={basis} onChange={(e) => setBasis(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {BASIS_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Statutory Reference</label>
              <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. NY Cannabis Law x 130" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>
          <button
            onClick={() => addMut.mutate()}
            disabled={!code.trim() || !nm.trim() || !rate.trim() || addMut.isPending}
            className="bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {addMut.isPending ? 'Adding...' : 'Add Rule'}
          </button>
          {addMut.isError && (
            <p className="text-xs text-red-600">Failed to add rule. Please check your inputs.</p>
          )}
        </div>
      )}

      {/* State Filter */}
      {states.length > 3 && (
        <div className="relative max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            placeholder="Filter by state..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      )}

      {/* Tax Rules by State */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">Loading tax rules...</div>
      ) : filteredStates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          {stateFilter ? 'No states match your filter.' : 'No tax rules configured yet. Add your first rule above.'}
        </div>
      ) : (
        filteredStates.map((state: string) => {
          const stateRules = allRules.filter((r: any) => r.state === state);
          const activeInState = stateRules.filter((r: any) => r.is_active).length;
          return (
            <div key={state} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-700">{state} Tax Rules</span>
                <span className="text-xs text-slate-400">{activeInState}/{stateRules.length} active</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-slate-500">Code</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-500">Name</th>
                    <th className="text-right px-4 py-2 font-medium text-slate-500">Rate</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-500">Basis</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-500">Reference</th>
                    <th className="text-center px-4 py-2 font-medium text-slate-500">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stateRules.map((r: any) => (
                    <tr key={r.tax_category_id} className={r.is_active ? '' : 'opacity-50'}>
                      <td className="px-4 py-2.5 font-mono text-xs">{r.code}</td>
                      <td className="px-4 py-2.5">{r.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium">{(r.rate * 100).toFixed(2)}%</td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs">{r.tax_basis.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">{r.statutory_reference ?? '-'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => toggleMut.mutate({ id: r.tax_category_id, active: !r.is_active })}
                          disabled={toggleMut.isPending}
                          className="transition-colors disabled:opacity-50"
                        >
                          {r.is_active
                            ? <ToggleRight size={22} className="text-green-600" />
                            : <ToggleLeft size={22} className="text-slate-400" />
                          }
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
