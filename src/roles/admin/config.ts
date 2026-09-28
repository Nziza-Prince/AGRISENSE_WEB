import {
  LayoutDashboard,
  Users,
  Store,
  ShieldCheck,
  BarChart3,
  Settings,
  Mail,
  Bell,
  CreditCard,
  Landmark,
} from "lucide-react";
import type { RoleNavLink } from "../RoleLayout";

export const ADMIN_ACCENT = "#4338CA"; // indigo

export const adminLinks: RoleNavLink[] = [
  { title: "Overview", to: "/admin", icon: LayoutDashboard, end: true },
  { title: "Users", to: "/admin/users", icon: Users },
  { title: "Suppliers", to: "/admin/suppliers", icon: Store },
  { title: "Waitlist", to: "/admin/waitlist", icon: Mail },
  { title: "Billing", to: "/admin/billing", icon: CreditCard },
  { title: "Finance", to: "/finance", icon: Landmark },
  { title: "Moderation", to: "/admin/moderation", icon: ShieldCheck },
  { title: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  { title: "Notifications", to: "/admin/notifications", icon: Bell },
  { title: "Settings", to: "/admin/settings", icon: Settings },
];
