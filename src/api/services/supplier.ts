import { api } from "../client";

export type SupplierOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface SupplierProduct {
  id: string;
  name: string;
  description?: string | null;
  // Postgres decimals are serialised as strings by the API.
  price: number | string;
  unit?: string | null;
  category: string;
  imageUrl?: string | null;
  stock: number;
  isActive: boolean;
  isArchived: boolean;
  createdAt?: string;
}

export interface SupplierOrder {
  id: string;
  quantity: number;
  totalPrice: number | string;
  status: SupplierOrderStatus;
  notes?: string | null;
  createdAt: string;
  product?: Pick<SupplierProduct, "id" | "name" | "category" | "unit">;
  buyer?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  };
}

export interface SupplierSalesReport {
  totalRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
}

export const supplierService = {
  getProducts: () => api.get<SupplierProduct[]>("/supplier/products"),
  getOrders: () => api.get<SupplierOrder[]>("/supplier/orders"),
  getSalesReport: () => api.get<SupplierSalesReport>("/supplier/sales-report"),
  updateOrderStatus: (id: string, status: SupplierOrderStatus) =>
    api.put<{ message: string }>(`/supplier/orders/${id}/status`, { status }),
};

export const LOW_STOCK_THRESHOLD = 10;

export function toNumber(value: number | string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function formatRwf(value: number | string | null | undefined): string {
  return `RWF ${toNumber(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function buyerName(order: SupplierOrder): string {
  const b = order.buyer;
  if (!b) return "Unknown buyer";
  const full = [b.firstName, b.lastName].filter(Boolean).join(" ").trim();
  return full || b.email || "Unknown buyer";
}

export function stockStatus(p: Pick<SupplierProduct, "stock">): "in_stock" | "low_stock" | "out_of_stock" {
  if (p.stock <= 0) return "out_of_stock";
  if (p.stock <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}
