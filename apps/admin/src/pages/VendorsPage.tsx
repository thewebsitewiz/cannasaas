import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { Building2, Plus, Phone, Mail, Star, Truck, ChevronDown, ChevronUp } from 'lucide-react';

const VENDORS_Q = `query { vendors { vendor_id name vendor_type license_number license_state phone email payment_terms rating is_active total_pos total_spend contacts } }`;
const STATS_Q = `query { vendorStats { activeVendors totalPOs openPOs totalSpend outstanding } }`;
const POS_Q = `query($id: ID!) { purchaseOrders(dispensaryId: $id) { po_id po_number status vendor_name total payment_status line_items order_date } }`;
const CREATE_VENDOR = `mutation($n:String!,$t:String!,$s:String,$e:String,$p:String,$terms:String,$cn:String,$ct:String) {
  createVendor(name:$n,vendorType:$t,state:$s,email:$e,phone:$p,paymentTerms:$terms,contactName:$cn,contactTitle:$ct) { vendor_id name }
}`;

const DISP = localStorage.getItem('cannasaas-dispensary-id') || 'b406186e-4d6a-425b-b7af-851cde868c5c';
const TYPE_COLORS: Record<string,string> = { cultivator:'bg-green-100 text-green-700', manufacturer:'bg-blue-100 text-blue-700', distributor:'bg-purple-100 text-purple-700', packaging:'bg-amber-100 text-amber-700' };

export function VendorsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showPOs, setShowPOs] = useState(false);
  const [form, setForm] = useState({ name:'', vendorType:'cultivator', state:'NY', email:'', phone:'', paymentTerms:'net_30', contactName:'', contactTitle:'' });

  const { data: vendors } = useQuery({ queryKey: ['vendors'], queryFn: () => gqlRequest<any>(VENDORS_Q), select: d => d.vendors });
  const { data: stats } = useQuery({ queryKey: ['vendorStats'], queryFn: () => gqlRequest<any>(STATS_Q), select: d => d.vendorStats });
  const { data: pos } = useQuery({ queryKey: ['purchaseOrders'], queryFn: () => gqlRequest<any>(POS_Q, { id: DISP }), select: d => d.purchaseOrders, enabled: showPOs });

  const createMut = useMutation({
    mutationFn: () => gqlRequest(CREATE_VENDOR, { n:form.name, t:form.vendorType, s:form.state, e:form.email, p:form.phone, terms:form.paymentTerms, cn:form.contactName, ct:form.contactTitle }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); setShowCreate(false); setForm({ name:'', vendorType:'cultivator', state:'NY', email:'', phone:'', paymentTerms:'net_30', contactName:'', contactTitle:'' }); },
  });

  const kpis = stats ? [
    { label: 'Active Vendors', value: stats.activeVendors },
    { label: 'Total POs', value: stats.totalPOs },
    { label: 'Open POs', value: stats.openPOs },
    { label: 'Total Spend', value: '$' + stats.totalSpend.toLocaleString() },
    { label: 'Outstanding', value: '$' + stats.outstanding.toLocaleString() },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-txt">Vendor Management</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowPOs(!showPOs)} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
            <Truck size={16} /> {showPOs ? 'Hide' : 'Show'} POs
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 bg-brand-600 text-txt-inverse px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
            <Plus size={16} /> New Vendor
          </button>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-5 gap-3">
          {kpis.map(k => (
            <div key={k.label} className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-xl font-bold text-txt">{k.value}</p>
              <p className="text-xs text-txt-secondary">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-surface rounded-xl border border-border p-6 space-y-3">
          <h2 className="font-semibold">New Vendor</h2>
          <div className="grid grid-cols-4 gap-3">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Vendor name *" className="px-3 py-2 border border-border rounded-lg text-sm" />
            <select value={form.vendorType} onChange={e => setForm({...form, vendorType: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm">
              <option value="cultivator">Cultivator</option><option value="manufacturer">Manufacturer</option><option value="distributor">Distributor</option><option value="packaging">Packaging</option>
            </select>
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="px-3 py-2 border border-border rounded-lg text-sm" />
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" className="px-3 py-2 border border-border rounded-lg text-sm" />
            <select value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm">
              <option value="AK">AK</option><option value="AL">AL</option><option value="AZ">AZ</option><option value="AR">AR</option>
              <option value="CA">CA</option><option value="CO">CO</option><option value="CT">CT</option><option value="DE">DE</option>
              <option value="FL">FL</option><option value="HI">HI</option><option value="IL">IL</option><option value="KY">KY</option>
              <option value="LA">LA</option><option value="MA">MA</option><option value="MD">MD</option><option value="ME">ME</option>
              <option value="MI">MI</option><option value="MN">MN</option><option value="MO">MO</option><option value="MT">MT</option>
              <option value="NE">NE</option><option value="NV">NV</option><option value="NH">NH</option><option value="NJ">NJ</option>
              <option value="NM">NM</option><option value="NY">NY</option><option value="NC">NC</option><option value="ND">ND</option>
              <option value="OH">OH</option><option value="OK">OK</option><option value="OR">OR</option><option value="PA">PA</option>
              <option value="RI">RI</option><option value="SD">SD</option><option value="UT">UT</option><option value="VT">VT</option>
              <option value="VA">VA</option><option value="WA">WA</option><option value="WV">WV</option>
            </select>
            <select value={form.paymentTerms} onChange={e => setForm({...form, paymentTerms: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm">
              <option value="net_15">Net 15</option><option value="net_30">Net 30</option><option value="net_45">Net 45</option>
            </select>
            <input value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} placeholder="Primary contact name" className="px-3 py-2 border border-border rounded-lg text-sm" />
            <input value={form.contactTitle} onChange={e => setForm({...form, contactTitle: e.target.value})} placeholder="Contact title" className="px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <button onClick={() => createMut.mutate()} disabled={!form.name} className="bg-brand-600 text-txt-inverse px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">Create Vendor</button>
        </div>
      )}

      {/* Vendor table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-alt border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-txt-secondary">Vendor</th>
              <th className="text-center px-4 py-3 font-medium text-txt-secondary">Type</th>
              <th className="text-left px-4 py-3 font-medium text-txt-secondary">License</th>
              <th className="text-left px-4 py-3 font-medium text-txt-secondary">Contact</th>
              <th className="text-center px-4 py-3 font-medium text-txt-secondary">Terms</th>
              <th className="text-center px-4 py-3 font-medium text-txt-secondary">Rating</th>
              <th className="text-right px-4 py-3 font-medium text-txt-secondary">POs</th>
              <th className="text-right px-4 py-3 font-medium text-txt-secondary">Total Spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(vendors ?? []).map((v: any) => {
              const primary = v.contacts ? (Array.isArray(v.contacts) ? v.contacts : JSON.parse(v.contacts || '[]')).find((c: any) => c.isPrimary) : null;
              return (
                <tr key={v.vendor_id} className="hover:bg-bg-alt">
                  <td className="px-4 py-3"><p className="font-medium text-txt">{v.name}</p></td>
                  <td className="px-4 py-3 text-center"><span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (TYPE_COLORS[v.vendor_type] || 'bg-gray-100 text-gray-700')}>{v.vendor_type}</span></td>
                  <td className="px-4 py-3 text-xs text-txt-secondary">{v.license_number || '—'}</td>
                  <td className="px-4 py-3">
                    {primary ? <p className="text-xs">{primary.name}</p> : null}
                    <div className="flex gap-2 mt-0.5">
                      {v.email && <span className="text-xs text-txt-muted flex items-center gap-0.5"><Mail size={10} /> {v.email}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs">{v.payment_terms?.replace('_',' ')}</td>
                  <td className="px-4 py-3 text-center">{v.rating ? <span className="flex items-center justify-center gap-0.5 text-xs"><Star size={12} className="text-amber-400 fill-amber-400" /> {parseFloat(v.rating).toFixed(1)}</span> : '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{v.total_pos || 0}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">${parseFloat(v.total_spend || 0).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Purchase Orders */}
      {showPOs && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-bg-alt border-b font-semibold text-gray-700">Purchase Orders</div>
          <table className="w-full text-sm">
            <thead><tr>
              <th className="text-left px-4 py-2 text-txt-secondary">PO #</th>
              <th className="text-left px-4 py-2 text-txt-secondary">Vendor</th>
              <th className="text-center px-4 py-2 text-txt-secondary">Status</th>
              <th className="text-right px-4 py-2 text-txt-secondary">Total</th>
              <th className="text-center px-4 py-2 text-txt-secondary">Payment</th>
              <th className="text-right px-4 py-2 text-txt-secondary">Items</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {(pos ?? []).map((po: any) => (
                <tr key={po.po_id}>
                  <td className="px-4 py-2 font-mono text-xs">{po.po_number}</td>
                  <td className="px-4 py-2">{po.vendor_name}</td>
                  <td className="px-4 py-2 text-center"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{po.status}</span></td>
                  <td className="px-4 py-2 text-right tabular-nums">${parseFloat(po.total).toFixed(2)}</td>
                  <td className="px-4 py-2 text-center"><span className={'text-xs ' + (po.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600')}>{po.payment_status}</span></td>
                  <td className="px-4 py-2 text-right">{po.line_items}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!pos || pos.length === 0) && <div className="p-6 text-center text-txt-muted">No purchase orders yet</div>}
        </div>
      )}
    </div>
  );
}
