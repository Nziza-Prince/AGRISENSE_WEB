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
  stockStatus,
  type SupplierProduct,
} from "@/api";

const statusMap: Record<string, { color: "green" | "amber" | "red"; label: string }> = {
  in_stock: { color: "green", label: "In stock" },
  low_stock: { color: "amber", label: "Low stock" },
  out_of_stock: { color: "red", label: "Out of stock" },
};

const SupplierProducts = () => {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Products | Supplier | AGRISENSE";
  }, []);

  useEffect(() => {
    let active = true;
    supplierService
      .getProducts()
      .then((rows) => {
        if (active) setProducts(rows.filter((p) => !p.isArchived));
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Could not load your products.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <RoleLayout
      links={supplierLinks}
      roleLabel="Supplier Portal"
      accent={SUPPLIER_ACCENT}
      title="Products"
      subtitle="Your catalogue and stock levels."
    >
      <Panel>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading products…
          </div>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-600">{error}</p>
        ) : products.length === 0 ? (
          <EmptyState art="box" title="Your products will appear here" text="Add your first product to start selling to farmers." compact />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-400">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Price</th>
                  <th className="pb-2 font-medium">Stock</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const status = statusMap[stockStatus(p)];
                  return (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="py-3 capitalize text-gray-500">{p.category.toLowerCase()}</td>
                      <td className="py-3 font-semibold text-gray-800">
                        {formatRwf(p.price)}
                        {p.unit ? <span className="font-normal text-gray-400"> / {p.unit}</span> : null}
                      </td>
                      <td className="py-3 text-gray-600">
                        {p.stock}
                        {p.unit ? ` ${p.unit}` : ""}
                      </td>
                      <td className="py-3">
                        <Badge color={status.color}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </RoleLayout>
  );
};

export default SupplierProducts;
