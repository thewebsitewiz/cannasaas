import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from '../lib/api';
import { Calculator, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

const Q = `query { platformTaxRules { tax_category_id state code name rate tax_basis statutory_reference is_active } }`;
const ADD = `mutation($s:String!,$c:String!,$n:String!,$r:Float!,$b:String!,$ref:String){addTaxRule(state:$s,code:$c,name:$n,rate:$r,taxBasis:$b,statutoryReference:$ref){tax_category_id}}`;
const UPD = `mutation($id:Int!,$active:Boolean){updateTaxRule(taxCategoryId:$id,isActive:$active){tax_category_id}}`;

export function TaxConfigPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [st, setSt] = useState('NY'); const [code, setCode] = useState(''); const [nm, setNm] = useState('');
  const [rate, setRate] = useState(''); const [basis, setBasis] = useState('retail_price'); const [ref, setRef] = useState('');

  const { data: rules } = useQuery({ queryKey: ['taxRules'], queryFn: () => gql<any>(Q), select: r => r.platformTaxRules });

  const addMut = useMutation({ mutationFn: () => gql(ADD, { s: st, c: code, n: nm, r: parseFloat(rate), b: basis, ref: ref || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['taxRules'] }); setShowAdd(false); setCode(''); setNm(''); setRate(''); } });

  const toggleMut = useMutation({ mutationFn: (args: { id: number; active: boolean }) => gql(UPD, { id: args.id, active: args.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taxRules'] }) });

  const states = [...new Set((rules ?? []).map((r: any) => r.state))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Tax Configuration</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
          <Plus size={16} /> Add Tax Rule
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h2 className="font-semibold">New Tax Rule</h2>
          <div className="grid grid-cols-3 gap-3">
            <select value={st} onChange={e=>setSt(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="NY">NY</option><option value="NJ">NJ</option><option value="CT">CT</option><option value="MA">MA</option><option value="MI">MI</option>
            </select>
            <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Code (e.g. NY_NEW_TAX)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input value={nm} onChange={e=>setNm(e.target.value)} placeholder="Display name" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input value={rate} onChange={e=>setRate(e.target.value)} placeholder="Rate (e.g. 0.0635)" type="number" step="0.0001" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <select value={basis} onChange={e=>setBasis(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="retail_price">Retail Price</option><option value="per_mg_thc">Per mg THC</option><option value="wholesale_price">Wholesale Price</option>
            </select>
            <input value={ref} onChange={e=>setRef(e.target.value)} placeholder="Statutory reference" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <button onClick={() => addMut.mutate()} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Add Rule</button>
        </div>
      )}

      {states.map(state => (
        <div key={state} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">{state} Tax Rules</div>
          <table className="w-full text-sm">
            <thead><tr>
              <th className="text-left px-4 py-2 font-medium text-slate-500">Code</th>
              <th className="text-left px-4 py-2 font-medium text-slate-500">Name</th>
              <th className="text-right px-4 py-2 font-medium text-slate-500">Rate</th>
              <th className="text-left px-4 py-2 font-medium text-slate-500">Basis</th>
              <th className="text-left px-4 py-2 font-medium text-slate-500">Reference</th>
              <th className="text-center px-4 py-2 font-medium text-slate-500">Active</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {(rules ?? []).filter((r: any) => r.state === state).map((r: any) => (
                <tr key={r.tax_category_id}>
                  <td className="px-4 py-2 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">{(r.rate * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-slate-500">{r.tax_basis}</td>
                  <td className="px-4 py-2 text-xs text-slate-400">{r.statutory_reference}</td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => toggleMut.mutate({ id: r.tax_category_id, active: !r.is_active })}>
                      {r.is_active ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-slate-400" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
