import { useParams } from "react-router-dom";
import {
  useOrder,
  useUpdateOrderStatus,
  useCancelOrder,
  type OrderStatus,
} from "@cannasaas/api-client";

const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "completed",
];

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id!);
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();

  if (isLoading) return <p className="p-4 text-gray-500">Loading...</p>;
  if (!order) return <p className="p-4 text-red-600">Order not found.</p>;

  const currentIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIdx + 1]
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-sm capitalize text-gray-500">
            {order.status.replace("_", " ")} •{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          {nextStatus && (
            <button
              onClick={() =>
                updateStatus.mutate({ id: order.id, status: nextStatus })
              }
              disabled={updateStatus.isPending}
              className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              Move to {nextStatus.replace("_", " ")}
            </button>
          )}
          {order.status !== "cancelled" && order.status !== "completed" && (
            <button
              onClick={() => {
                if (window.confirm("Cancel this order?")) {
                  cancelOrder.mutate(order.id);
                }
              }}
              disabled={cancelOrder.isPending}
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <table className="w-full text-left text-sm">
        <thead className="border-b text-gray-500">
          <tr>
            <th className="py-2">Product</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Unit Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">{item.productName}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">${item.unitPrice.toFixed(2)}</td>
              <td className="py-2 text-right">${item.totalPrice.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1 text-right text-sm">
        <p className="text-gray-500">Subtotal: ${order.subtotal.toFixed(2)}</p>
        {order.discount > 0 && (
          <p className="text-green-600">Discount: -${order.discount.toFixed(2)}</p>
        )}
        <p className="text-gray-500">Tax: ${order.tax.toFixed(2)}</p>
        <p className="text-lg font-bold">Total: ${order.total.toFixed(2)}</p>
      </div>
    </div>
  );
}
