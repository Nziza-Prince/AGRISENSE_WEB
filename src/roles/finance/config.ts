import {
  LayoutDashboard,
  ArrowLeftRight,
  HandCoins,
  Tags,
  FileBarChart,
  ScrollText,
  Bell,
} from "lucide-react";
import type { RoleNavLink } from "../RoleLayout";

export const FINANCE_ACCENT = "#164E63";

export const financeLinks: RoleNavLink[] = [
  { title: "Overview", to: "/finance", icon: LayoutDashboard, end: true },
  { title: "Money in & out", to: "/finance/transactions", icon: ArrowLeftRight },
  { title: "Farmer payments", to: "/finance/farmer-payments", icon: HandCoins },
  { title: "Categories", to: "/finance/categories", icon: Tags },
  { title: "Reports", to: "/finance/reports", icon: FileBarChart },
  { title: "Audit", to: "/finance/audit", icon: ScrollText },
  { title: "Notifications", to: "/finance/notifications", icon: Bell },
];
