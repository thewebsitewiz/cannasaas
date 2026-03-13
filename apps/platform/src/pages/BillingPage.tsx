import { useQuery } from '@tanstack/react-query';
import { gql } from '../lib/api';
import { CreditCard } from 'lucide-react';

const Q = `query { platformInvoices { invoice_id amount total status org_name created_at } }`;

export function BillingPage() {
  const { data: invoices } = useQuery({ queryKey: ['invoices'], queryFn: () => gql<any>(Q), select: r => r.platformInvoices });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Billing & Invoices</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Tenant</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Amount</th>
              <th className="text-center px-4 py-3 font-medium text-slate-500">Status</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(invoices ?? []).map((inv: any) => (
              <tr key={inv.invoice_id}>
                <td className="px-4 py-3 font-medium text-slate-900">{inv.org_name}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">${parseFloat(inv.total).toFixed(2)}</td>
                <td className="px-4 py-3 text-center"><span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{inv.status}</span></td>
                <td className="px-4 py-3 text-right text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!invoices || invoices.length === 0) && <div className="p-8 text-center text-slate-400">No invoices yet</div>}
      </div>
    </div>
  );
}
