import { useEffect, useMemo, useState } from "react";
import { Package, ShoppingCart, Wallet, Users, AlertTriangle, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import RoleLayout from "../RoleLayout";
import { StatCard, Panel, Badge } from "../ui";
import { SUPPLIER_ACCENT, supplierLinks } from "./config";
import {
  ApiError,
  supplierService,
  formatRwf,
  buyerName,
  stockStatus,
  toNumber,
  type SupplierOrder,
  type SupplierOrderStatus,
  type SupplierProduct,
  type SupplierSalesReport,
} from "@/api";

const statusColor: Record<SupplierOrderStatus, "green" | "amber" | "red" | "blue"> = {
  PENDING: "amber",
  CONFIRMED: "blue",
  SHIPPED: "blue",
  DELIVERED: "green",
  CANCELLED: "red",
};

const PIE_COLORS = ["#0F766E", "#14B8A6", "#F59E0B", "#6366F1", "#EF4444", "#84CC16", "#0EA5E9"];

const SupplierDashboard = () => {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [report, setReport] = useState<SupplierSalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Supplier Dashboard | AGRISENSE";
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      supplierService.getProducts(),
      supplierService.getOrders(),
      supplierService.getSalesReport(),
    ])
      .then(([p, o, r]) => {
        if (!active) return;
        setProducts(p.filter((x) => !x.isArchived));
        setOrders(o);
        setReport(r);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Could not load your dashboard.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const liveOrders = useMemo(() => orders.filter((o) => o.status !== "CANCELLED"), [orders]);

  const activeBuyers = useMemo(
    () => new Set(liveOrders.map((o) => o.buyer?.id).filter(Boolean)).size,
    [liveOrders],
  );

  const monthlyRevenue = useMemo(() => {
    const byMonth = new Map<string, { sort: number; revenue: number }>();
    liveOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const entry = byMonth.get(key) ?? { sort: d.getFullYear() * 12 + d.getMonth(), revenue: 0 };
      entry.revenue += toNumber(o.totalPrice);
      byMonth.set(key, entry);
    });
    return [...byMonth.entries()]
      .sort((a, b) => a[1].sort - b[1].sort)
      .map(([month, v]) => ({ month, revenue: v.revenue }));
  }, [liveOrders]);

  const salesByCategory = useMemo(() => {
    const byCat = new Map<string, number>();
    liveOrders.forEach((o) => {
      const cat = (o.product?.category ?? "OTHER").toLowerCase();
      byCat.set(cat, (byCat.get(cat) ?? 0) + toNumber(o.totalPrice));
    });
    return [...byCat.entries()].map(([name, value], i) => ({
      name,
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [liveOrders]);

  const stockAlerts = products.filter((p) => stockStatus(p) !== "in_stock");
  const recentOrders = orders.slice(0, 6);

  return (
    <RoleLayout
      links={supplierLinks}
      roleLabel="Supplier Portal"
      accent={SUPPLIER_ACCENT}
      title="Supplier Overview"
      subtitle="Track your products, orders and revenue at a glance."
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your dashboard…
        </div>
      ) : error ? (
        <p className="py-20 text-center text-sm text-red-600">{error}</p>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Package} label="Total Products" value={products.length} accent={SUPPLIER_ACCENT} />
            <StatCard icon={ShoppingCart} label="Total Orders" value={report?.totalOrders ?? 0} accent={SUPPLIER_ACCENT} />
            <StatCard icon={Wallet} label="Revenue" value={formatRwf(report?.totalRevenue)} accent={SUPPLIER_ACCENT} />
            <StatCard icon={Users} label="Active Buyers" value={activeBuyers} accent={SUPPLIER_ACCENT} />
          </div>

          {/* Charts */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel title="Revenue by Month" className="lg:col-span-2">
              {monthlyRevenue.length === 0 ? (
                <p className="py-16 text-center text-sm text-gray-500">No sales recorded yet.</p>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="supRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={SUPPLIER_ACCENT} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={SUPPLIER_ACCENT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => formatRwf(v as number)} />
                      <Area type="monotone" dataKey="revenue" stroke={SUPPLIER_ACCENT} strokeWidth={2} fill="url(#supRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel title="Sales by Category">
              {salesByCategory.length === 0 ? (
                <p className="py-16 text-center text-sm text-gray-500">No sales recorded yet.</p>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={salesByCategory} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                        {salesByCategory.map((e) => (
                          <Cell key={e.name} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatRwf(v as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>

          {/* Recent orders + stock alerts */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel title="Recent Orders" className="lg:col-span-2">
              {recentOrders.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">No orders yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-gray-400">
                        <th className="pb-2 font-medium">Order</th>
                        <th className="pb-2 font-medium">Buyer</th>
                        <th className="pb-2 font-medium">Product</th>
                        <th className="pb-2 font-medium">Total</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o) => (
                        <tr key={o.id} className="border-b last:border-0">
                          <td className="py-3 font-mono text-xs text-gray-800">{o.id.slice(0, 8).toUpperCase()}</td>
                          <td className="py-3 text-gray-600">{buyerName(o)}</td>
                          <td className="py-3 text-gray-600">{o.product?.name ?? "—"}</td>
                          <td className="py-3 font-semibold text-gray-800">{formatRwf(o.totalPrice)}</td>
                          <td className="py-3">
                            <Badge color={statusColor[o.status]}>{o.status.toLowerCase()}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel title="Inventory Alerts">
              {stockAlerts.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">All products are well stocked.</p>
              ) : (
                <ul className="space-y-3">
                  {stockAlerts.map((p) => (
                    <li key={p.id} className="flex items-start gap-3 rounded-lg bg-amber-50 p-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {stockStatus(p) === "out_of_stock"
                            ? "Out of stock"
                            : `Only ${p.stock}${p.unit ? ` ${p.unit}` : ""} left`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </RoleLayout>
  );
};

export default SupplierDashboard;
