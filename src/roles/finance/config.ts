import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  FileBarChart,
  ScrollText,
  Bell,
} from "lucide-react";
import type { RoleNavLink } from "../RoleLayout";

export const FINANCE_ACCENT = "#164E63";

export const financeLinks: RoleNavLink[] = [
  { title: "Overview", to: "/finance", icon: LayoutDashboard, end: true },
  { title: "Transactions", to: "/finance/transactions", icon: ArrowLeftRight },
  { title: "Accounts", to: "/finance/accounts", icon: Landmark },
  { title: "Reports", to: "/finance/reports", icon: FileBarChart },
  { title: "Audit", to: "/finance/audit", icon: ScrollText },
  { title: "Notifications", to: "/finance/notifications", icon: Bell },
];
