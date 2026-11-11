import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useFinanceAccess } from "./useFinanceAccess";
import RoleLayout from "../RoleLayout";
import { ADMIN_ACCENT, adminLinks } from "../admin/config";
import { FINANCE_ACCENT, financeLinks } from "./config";

interface FinanceShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const FinanceShell = ({ title, subtitle, actions, children }: FinanceShellProps) => {
  const { isAdmin } = useFinanceAccess();
  return (
    <RoleLayout
      links={isAdmin ? adminLinks : financeLinks}
      roleLabel={isAdmin ? "Admin Console" : "CFO Portal"}
      accent={isAdmin ? ADMIN_ACCENT : FINANCE_ACCENT}
      title={title}
      subtitle={subtitle}
      actions={actions}
    >
      {isAdmin && (
        <nav className="mb-5 flex flex-wrap gap-2">
          {financeLinks
            .filter((link) => !link.to.endsWith("/notifications"))
            .map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className="rounded-full border px-3.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                style={({ isActive }) =>
                  isActive ? { backgroundColor: ADMIN_ACCENT, borderColor: ADMIN_ACCENT, color: "#fff" } : undefined
                }
              >
                {link.title}
              </NavLink>
            ))}
        </nav>
      )}
      {children}
    </RoleLayout>
  );
};

export default FinanceShell;
