import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { BarChart3, Receipt, Users, Warehouse, Download, Calendar, TrendingUp, DollarSign } from 'lucide-react';

const SALES_REPORT = `query($id: ID!, $s: String!, $e: String!) { salesReport(dispensaryId: $id, startDate: $s, endDate: $e) {
  totalOrders completedOrders cancelledOrders grossSales totalDiscounts totalTax netRevenue avgOrderValue deliveryOrders pickupOrders cashOrders cardOrders totalCashDiscounts
}}`;

const TAX_REPORT = `query($id: ID!, $s: String!, $e: String!) { taxReport(dispensaryId: $id, startDate: $s, endDate: $e) {
  dispensaryName state licenseNumber taxableSales totalDiscounts netTaxable totalTaxCollected transactionCount
  taxBreakdown { taxName taxCode rate taxBasis statutoryReference estimatedTax }
}}`;

const LABOR_REPORT = `query($id: ID!, $s: String!, $e: String!) { laborCostReport(dispensaryId: $id, startDate: $s, endDate: $e) {
  employeeCount totalHours totalLaborCost totalRevenue laborCostPercent
}}`;

const SHRINKAGE_REPORT = `query($id: ID!, $s: String!, $e: String!) { shrinkageReport(dispensaryId: $id, startDate: $s, endDate: $e) {
  totalAdjustments totalUnitsLost estimatedValueLost byReason { reason reasonCode count units estimatedValue }
}}`;

type Tab = 'sales' | 'tax' | 'staff' | 'inventory';

export function ReportsPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const token = useAuthStore((s) => s.token);
  const [tab, setTab] = useState<Tab>('sales');

  const today = new Date();
  const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30);
  const [startDate, setStartDate] = useState(monthAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const { data: sales } = useQuery({
    queryKey: ['salesReport', dispensaryId, startDate, endDate],
    queryFn: () => gqlRequest<any>(SALES_REPORT, { id: dispensaryId, s: startDate, e: endDate }),
    select: (d) => d.salesReport,
    enabled: !!dispensaryId && tab === 'sales',
  });

  const { data: tax } = useQuery({
    queryKey: ['taxReport', dispensaryId, startDate, endDate],
    queryFn: () => gqlRequest<any>(TAX_REPORT, { id: dispensaryId, s: startDate, e: endDate }),
    select: (d) => d.taxReport,
    enabled: !!dispensaryId && tab === 'tax',
  });

  const { data: labor } = useQuery({
    queryKey: ['laborReport', dispensaryId, startDate, endDate],
    queryFn: () => gqlRequest<any>(LABOR_REPORT, { id: dispensaryId, s: startDate, e: endDate }),
    select: (d) => d.laborCostReport,
    enabled: !!dispensaryId && tab === 'staff',
  });

  const { data: shrinkage } = useQuery({
    queryKey: ['shrinkageReport', dispensaryId, startDate, endDate],
    queryFn: () => gqlRequest<any>(SHRINKAGE_REPORT, { id: dispensaryId, s: startDate, e: endDate }),
    select: (d) => d.shrinkageReport,
    enabled: !!dispensaryId && tab === 'inventory',
  });

  const downloadCsv = (type: string) => {
    const base = type === 'inventory'
      ? `/v1/reports/${type}/csv?dispensaryId=${dispensaryId}`
      : `/v1/reports/${type}/csv?dispensaryId=${dispensaryId}&startDate=${startDate}&endDate=${endDate}`;
    fetch(base, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-dispensary-id': dispensaryId ?? '',
        'x-organization-id': useAuthStore.getState().user?.organizationId ?? '',
      },
    }).then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const fmt = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'sales', label: 'Sales', icon: BarChart3 },
    { key: 'tax', label: 'Tax', icon: Receipt },
    { key: 'staff', label: 'Staff', icon: Users },
    { key: 'inventory', label: 'Inventory', icon: Warehouse },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Date Range + Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-gray-400" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
          <span className="text-gray-400">to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
          <button onClick={() => downloadCsv(tab)} className="flex items-center gap-1 bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* SALES TAB */}
      {tab === 'sales' && sales && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold">{sales.completedOrders}</p><p className="text-xs text-gray-500">Orders</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold text-brand-700">{fmt(sales.netRevenue)}</p><p className="text-xs text-gray-500">Net Revenue</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold">{fmt(sales.avgOrderValue)}</p><p className="text-xs text-gray-500">Avg Order</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold">{fmt(sales.totalTax)}</p><p className="text-xs text-gray-500">Tax Collected</p></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-lg font-bold">{fmt(sales.grossSales)}</p><p className="text-xs text-gray-500">Gross Sales</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-lg font-bold text-red-600">-{fmt(sales.totalDiscounts)}</p><p className="text-xs text-gray-500">Discounts</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-lg font-bold">{sales.pickupOrders} / {sales.deliveryOrders}</p><p className="text-xs text-gray-500">Pickup / Delivery</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-lg font-bold">{sales.cashOrders} / {sales.cardOrders}</p><p className="text-xs text-gray-500">Cash / Card</p>
              {sales.totalCashDiscounts > 0 && <p className="text-xs text-green-600 mt-0.5">Cash discounts: {fmt(sales.totalCashDiscounts)}</p>}
            </div>
          </div>
        </div>
      )}

      {/* TAX TAB */}
      {tab === 'tax' && tax && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold">{fmt(tax.taxableSales)}</p><p className="text-xs text-gray-500">Taxable Sales</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold">{fmt(tax.netTaxable)}</p><p className="text-xs text-gray-500">Net Taxable</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold text-brand-700">{fmt(tax.totalTaxCollected)}</p><p className="text-xs text-gray-500">Tax Collected</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold">{tax.transactionCount}</p><p className="text-xs text-gray-500">Transactions</p></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold mb-3">Tax Breakdown — {tax.state}</h3>
            <p className="text-xs text-gray-400 mb-3">License: {tax.licenseNumber}</p>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="text-left px-3 py-2 font-medium text-gray-500">Tax</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500">Rate</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500">Basis</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500">Reference</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500">Amount</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {tax.taxBreakdown.map((t: any, i: number) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium">{t.taxName}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{(t.rate * 100).toFixed(2)}%</td>
                    <td className="px-3 py-2 text-gray-500">{t.taxBasis}</td>
                    <td className="px-3 py-2 text-xs text-gray-400">{t.statutoryReference}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmt(t.estimatedTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAFF TAB */}
      {tab === 'staff' && labor && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold">{labor.employeeCount}</p><p className="text-xs text-gray-500">Employees</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold tabular-nums">{labor.totalHours.toFixed(1)}</p><p className="text-xs text-gray-500">Total Hours</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold">{fmt(labor.totalLaborCost)}</p><p className="text-xs text-gray-500">Labor Cost</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold">{fmt(labor.totalRevenue)}</p><p className="text-xs text-gray-500">Revenue</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className={`text-2xl font-bold ${labor.laborCostPercent > 30 ? 'text-red-600' : labor.laborCostPercent > 20 ? 'text-amber-600' : 'text-green-600'}`}>
                {labor.laborCostPercent}%
              </p>
              <p className="text-xs text-gray-500">Labor %</p>
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {tab === 'inventory' && shrinkage && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold">{shrinkage.totalAdjustments}</p><p className="text-xs text-gray-500">Adjustments</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold text-red-600">{shrinkage.totalUnitsLost}</p><p className="text-xs text-gray-500">Units Lost</p></div>
            <div className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-2xl font-bold text-red-600">{fmt(shrinkage.estimatedValueLost)}</p><p className="text-xs text-gray-500">Est. Value Lost</p></div>
          </div>
          {shrinkage.byReason.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold mb-3">Shrinkage by Reason</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Reason</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Adjustments</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Units</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Est. Value</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {shrinkage.byReason.map((r: any, i: number) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium">{r.reason}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.count}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.units}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-red-600">{fmt(r.estimatedValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
