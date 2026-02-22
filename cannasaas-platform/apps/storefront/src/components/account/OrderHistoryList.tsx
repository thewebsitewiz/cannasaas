/**
 * @file OrderHistoryList.tsx
 * @app apps/storefront
 *
 * Paginated order history list for the account page.
 * Uses OrderStatusBadge from scaffold-components.sh.
 * Calls useOrders() from @cannasaas/api-client.
 *
 * Shows: order number, date, status badge, item count, total
 * Each row links to the order detail page.
 *
 * Accessibility:
 *   - Table with <caption> (WCAG 1.3.1)
 *   - Column headers: <th scope="col"> (WCAG 1.3.1)
 *   - Empty state: role="status" (WCAG 4.1.3)
 */

import { Link } from 'react-router-dom';
import { useOrders } from '@cannasaas/api-client';
import { OrderStatusBadge } from '../order/OrderStatusBadge';
import { ROUTES } from '../../routes';

export function OrderHistoryList() {
  const { data, isLoading } = useOrders({});
  const orders = data?.data ?? [];

  if (isLoading) {
    return (
      <div aria-busy="true" className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-stone-100 rounded-xl animate-pulse motion-reduce:animate-none" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div role="status" className="text-center py-12">
        <p className="text-3xl mb-3" aria-hidden="true">📦</p>
        <h3 className="text-base font-semibold text-stone-800 mb-1">No orders yet</h3>
        <p className="text-sm text-stone-500 mb-4">Your order history will appear here.</p>
        <Link to={ROUTES.products} className="text-sm text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:underline">
          Start Shopping →
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Your order history</caption>
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-100">
            <th scope="col" className="pb-3 pr-4 font-semibold">Order</th>
            <th scope="col" className="pb-3 pr-4 font-semibold">Date</th>
            <th scope="col" className="pb-3 pr-4 font-semibold">Status</th>
            <th scope="col" className="pb-3 pr-4 font-semibold">Items</th>
            <th scope="col" className="pb-3 font-semibold text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {orders.map((order: any) => (
            <tr key={order.id} className="hover:bg-stone-50 transition-colors group">
              <td className="py-3.5 pr-4">
                <Link
                  to={ROUTES.accountOrderDetail(order.id)}
                  className={[
                    'font-mono text-xs text-[hsl(var(--primary))]',
                    'group-hover:underline',
                    'focus-visible:outline-none focus-visible:underline',
                    // Extend click area to full row via pseudo-element on the link
                    'after:absolute after:inset-0',
                  ].join(' ')}
                >
                  #{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
                </Link>
              </td>
              <td className="py-3.5 pr-4 text-stone-600">
                <time dateTime={order.createdAt}>
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </time>
              </td>
              <td className="py-3.5 pr-4 relative">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="py-3.5 pr-4 text-stone-600">
                {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
              </td>
              <td className="py-3.5 text-right font-semibold text-stone-900">
                ${order.total?.toFixed(2) ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
