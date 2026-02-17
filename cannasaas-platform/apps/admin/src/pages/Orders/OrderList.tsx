import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrders, type OrderFilters } from "@cannasaas/api-client";

export default function OrderList() {
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 25,
  });
  const { data, isLoading } = useOrders(filters);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>

      {/* Status filter */}
      <div className="flex gap-2">
        {[undefined, "pending", "confirmed", "preparing", "ready_for_pickup", "completed", "cancelled"].map(
          (status) => (
            <button
              key={status ?? "all"}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  status: status as OrderFilters["status"],
                  page: 1,
                }))
              }
              className={`rounded-full px-3 py-1 text-xs capitalize ${
                filters.status === status
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status ? status.replace("_", " ") : "All"}
            </button>
          ),
        )}
      </div>

      {isLoading && <p className="text-gray-500">Loading...</p>}

      {data && (
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="py-2">Order</th>
              <th className="py-2">Date</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Items</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="py-2">
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-green-600 hover:underline"
                  >
                    #{order.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="py-2">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2">
                  <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">
                    {order.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-2 text-right">{order.items.length}</td>
                <td className="py-2 text-right font-medium">
                  ${order.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
