import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Bell,
} from "lucide-react";
import type { RoleNavLink } from "../RoleLayout";

export const SUPPLIER_ACCENT = "#0F766E"; // teal

export const supplierLinks: RoleNavLink[] = [
  { title: "Overview", to: "/supplier", icon: LayoutDashboard, end: true },
  { title: "Products", to: "/supplier/products", icon: Package },
  { title: "Orders", to: "/supplier/orders", icon: ShoppingCart },
  { title: "Notifications", to: "/supplier/notifications", icon: Bell },
];
