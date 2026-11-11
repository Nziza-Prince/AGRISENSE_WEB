import DashboardLayout from "./DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ApiError, marketplaceService, type MarketplaceOrder } from "@/api";

function getOrders(data: unknown): MarketplaceOrder[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const items = record.orders ?? record.items ?? record.data;
  return Array.isArray(items) ? (items as MarketplaceOrder[]) : [];
}

export default function Orders() {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "My Orders | AGRISENSE";
    let active = true;
    (async () => {
      try {
        const res = await marketplaceService.getOrders();
        if (active) setOrders(getOrders(res));
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Failed to load order history.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B6E4F]">Order History</h1>
          <p className="text-sm text-gray-500">Track your marketplace purchases and statuses.</p>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#2C6E49]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border bg-white">
            <EmptyState art="box" title="Your orders will appear here" text="Buy seeds, fertiliser or tools from the marketplace and track them here." />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="px-4 py-3">{order.product?.name || "Product order"}</td>
                    <td className="px-4 py-3">{order.quantity || 1}</td>
                    <td className="px-4 py-3">{order.status || "Pending"}</td>
                    <td className="px-4 py-3">
                      {typeof order.totalAmount === "number"
                        ? `${order.totalAmount.toLocaleString()} RWF`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
