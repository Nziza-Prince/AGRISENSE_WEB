import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Loader2 } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Panel, Badge } from "../ui";
import { SUPPLIER_ACCENT, supplierLinks } from "./config";
import {
  ApiError,
  supplierService,
  formatRwf,
  buyerName,
  type SupplierOrder,
  type SupplierOrderStatus,
} from "@/api";

const statusColor: Record<SupplierOrderStatus, "green" | "amber" | "red" | "blue"> = {
  PENDING: "amber",
  CONFIRMED: "blue",
  SHIPPED: "blue",
  DELIVERED: "green",
  CANCELLED: "red",
};

const STATUSES: SupplierOrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

const SupplierOrders = () => {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Orders | Supplier | AGRISENSE";
  }, []);

  useEffect(() => {
    let active = true;
    supplierService
      .getOrders()
      .then((rows) => {
        if (active) setOrders(rows);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Could not load your orders.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const changeStatus = async (order: SupplierOrder, status: SupplierOrderStatus) => {
    if (status === order.status) return;
    setUpdatingId(order.id);
    setError(null);
    try {
      await supplierService.updateOrderStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <RoleLayout
      links={supplierLinks}
      roleLabel="Supplier Portal"
      accent={SUPPLIER_ACCENT}
      title="Orders"
      subtitle="Review and fulfil incoming buyer orders."
    >
      <Panel>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
          </div>
        ) : orders.length === 0 ? (
          error ? (
            <p className="py-10 text-center text-sm text-red-600">{error}</p>
          ) : (
            <EmptyState art="box" title="Your orders will appear here" text="When a farmer buys from you, the order shows up here to confirm and ship." compact />
          )
        ) : (
          <>
            {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-gray-400">
                    <th className="pb-2 font-medium">Order</th>
                    <th className="pb-2 font-medium">Buyer</th>
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium">Qty</th>
                    <th className="pb-2 font-medium">Total</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-3 font-mono text-xs text-gray-800">{o.id.slice(0, 8).toUpperCase()}</td>
                      <td className="py-3 text-gray-700">{buyerName(o)}</td>
                      <td className="py-3 text-gray-500">{o.product?.name ?? "—"}</td>
                      <td className="py-3 text-gray-600">{o.quantity}</td>
                      <td className="py-3 font-semibold text-gray-800">{formatRwf(o.totalPrice)}</td>
                      <td className="py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Badge color={statusColor[o.status]}>{o.status.toLowerCase()}</Badge>
                          <select
                            aria-label={`Change status of order ${o.id}`}
                            className="rounded border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-600"
                            value={o.status}
                            disabled={updatingId === o.id}
                            onChange={(e) => changeStatus(o, e.target.value as SupplierOrderStatus)}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.toLowerCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>
    </RoleLayout>
  );
};

export default SupplierOrders;
