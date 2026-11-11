import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import GlobalSearch from "./GlobalSearch";
import { ProfileMenu } from "@/components/ProfileMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getDefaultRouteForRole, routes } from "@/lib/routes";

export interface RoleNavLink {
  title: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

interface RoleLayoutProps {
  links: RoleNavLink[];
  roleLabel: string;
  accent: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

function notificationsPathForRole(role?: string | null): string {
  switch ((role || "").toUpperCase()) {
    case "ADMIN":
      return routes.admin.notifications;
    case "CFO":
      return routes.finance.notifications;
    case "SUPPLIER":
      return routes.supplier.notifications;
    case "NGO":
      return routes.ngo.notifications;
    default:
      return routes.app.notifications;
  }
}

const RoleLayout = ({
  links,
  roleLabel,
  accent,
  title,
  subtitle,
  actions,
  children,
}: RoleLayoutProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const inboxHref = notificationsPathForRole(user?.role);

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login", { replace: true });
  };

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col border-r bg-white p-5">
      <div className="mb-8 flex items-center gap-2">
        <img
          src="/assets/logo.png"
          alt="AgriSense"
          className="h-11 w-auto cursor-pointer"
          onClick={() => navigate(getDefaultRouteForRole(user?.role))}
        />
        <div>
          <h1 className="text-lg font-bold leading-none">
            <span style={{ color: accent }}>AGRI</span>SENSE
          </h1>
          <span
            className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: `${accent}14`, color: accent }}
          >
            {roleLabel}
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={() => setMobileOpen(false)}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            style={({ isActive }) =>
              isActive ? { backgroundColor: `${accent}14`, color: accent } : undefined
            }
          >
            <link.icon className="h-[18px] w-[18px]" />
            {link.title}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-[18px] w-[18px]" />
        Logout
      </button>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden md:block">{Sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">{Sidebar}</div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-4 border-b bg-white px-4 py-3 sm:px-6">
          <button
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <GlobalSearch links={links} accent={accent} isAdmin={(user?.role || "").toUpperCase() === "ADMIN"} />

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <NotificationBell inboxHref={inboxHref} accent={accent} />
            <ProfileMenu accent={accent} inboxHref={inboxHref} />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: accent }}>
                {title}
              </h1>
              {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
};

export default RoleLayout;
