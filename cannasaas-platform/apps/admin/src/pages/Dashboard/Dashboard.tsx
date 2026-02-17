import { useMemo } from "react";
import {
  useAnalyticsOverview,
  type AnalyticsDateRange,
} from "@cannasaas/api-client";
import { useAuth } from "../../providers/AuthProvider";

export default function Dashboard() {
  const { user } = useAuth();

  // Default to last 30 days
  const range = useMemo<AnalyticsDateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, []);

  // TODO: replace with actual dispensary ID from context/selector
  const dispensaryId = "DISPENSARY_ID";
  const { data: overview, isLoading } = useAnalyticsOverview(
    dispensaryId,
    range,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Dashboard{user ? ` — ${user.firstName}` : ""}
      </h1>

      {isLoading && <p className="text-gray-500">Loading analytics...</p>}

      {overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Revenue"
            value={`$${overview.revenue.total.toLocaleString()}`}
            change={overview.revenue.change}
          />
          <StatCard
            label="Orders"
            value={overview.orders.total.toLocaleString()}
            change={overview.orders.change}
          />
          <StatCard
            label="Customers"
            value={overview.customers.total.toLocaleString()}
            change={overview.customers.change}
          />
          <StatCard
            label="Avg Order"
            value={`$${overview.avgOrderValue.value.toFixed(2)}`}
            change={overview.avgOrderValue.change}
          />
        </div>
      )}

      {overview?.topProducts && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Top Products</h2>
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="py-2">Product</th>
                <th className="py-2 text-right">Revenue</th>
                <th className="py-2 text-right">Sold</th>
              </tr>
            </thead>
            <tbody>
              {overview.topProducts.map((p) => (
                <tr key={p.productId} className="border-b">
                  <td className="py-2">{p.name}</td>
                  <td className="py-2 text-right">
                    ${p.revenue.toLocaleString()}
                  </td>
                  <td className="py-2 text-right">{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: number;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p
        className={`mt-1 text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}
      >
        {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
      </p>
    </div>
  );
}
