import { Link } from 'react-router-dom';
import { AlertTriangle, PackageX, Radio } from 'lucide-react';

import { useStockAlerts, type StockAlert } from '../../hooks/useStockAlerts';

interface SeedItem {
  variantId: string;
  productName: string;
  variantName?: string;
  quantityAvailable: number;
}

interface Props {
  /** Initial low-stock items from the dashboard query — used as the seed. */
  seed?: SeedItem[];
  /** Max rows to render. */
  limit?: number;
}

interface DisplayRow {
  key: string;
  productName: string;
  variantName?: string;
  quantity: number;
  type: 'low_stock' | 'out_of_stock';
  live: boolean;
  variantId?: string;
}

function mergeRows(
  seed: SeedItem[],
  live: StockAlert[],
  limit: number,
): DisplayRow[] {
  const liveNames = new Set(live.map((a) => a.productName));
  const rows: DisplayRow[] = live.map((a) => ({
    key: 'live:' + a.productName + ':' + a.timestamp,
    productName: a.productName,
    quantity: a.quantity,
    type: a.type,
    live: true,
  }));
  for (const item of seed) {
    if (liveNames.has(item.productName)) continue;
    rows.push({
      key: 'seed:' + item.variantId,
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantityAvailable,
      type: item.quantityAvailable <= 0 ? 'out_of_stock' : 'low_stock',
      live: false,
      variantId: item.variantId,
    });
  }
  return rows.slice(0, limit);
}

export function LowStockWidget({ seed = [], limit = 8 }: Props) {
  const live = useStockAlerts();
  const rows = mergeRows(seed, live, limit);

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-txt flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" /> Low Stock
          Alerts
        </h2>
        <span className="flex items-center gap-1 text-xs text-txt-muted">
          <Radio size={12} className="text-emerald-500 animate-pulse" /> live
        </span>
      </header>

      {rows.length === 0 ? (
        <p className="text-txt-muted text-sm py-8 text-center">
          Stock levels look healthy — no alerts.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li
              key={row.key}
              className="py-2 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                {row.type === 'out_of_stock' ? (
                  <PackageX size={16} className="text-red-500 shrink-0" />
                ) : (
                  <AlertTriangle
                    size={16}
                    className="text-amber-500 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-txt truncate">
                    {row.productName}
                  </p>
                  {row.variantName && (
                    <p className="text-xs text-txt-muted truncate">
                      {row.variantName}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={
                  row.type === 'out_of_stock'
                    ? 'text-sm font-semibold text-red-600 tabular-nums'
                    : 'text-sm font-semibold text-amber-600 tabular-nums'
                }
              >
                {row.type === 'out_of_stock' ? 'Out' : row.quantity + ' left'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/inventory"
        className="block mt-4 text-sm text-brand-600 hover:text-brand-700"
      >
        View all inventory →
      </Link>
    </div>
  );
}
