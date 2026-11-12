import RoleLayout from "../RoleLayout";
import { NotificationsInbox } from "@/components/notifications/NotificationsInbox";
import { ADMIN_ACCENT, adminLinks } from "./config";

const AdminNotifications = () => (
  <RoleLayout
    links={adminLinks}
    roleLabel="Admin Console"
    accent={ADMIN_ACCENT}
    title="Notifications"
    subtitle="Platform alerts, approvals, and system updates."
  >
    <NotificationsInbox
      accent={ADMIN_ACCENT}
      linkFor={(item) => {
        const text = `${item.type ?? ""} ${item.title ?? ""}`.toLowerCase();
        if (/payment|season/.test(text)) return { to: "/admin/payments", label: "Review payment" };
        if (/supplier|ngo|approv/.test(text)) return { to: "/admin/suppliers", label: "Review organisations" };
        if (/report|moderat/.test(text)) return { to: "/admin/moderation", label: "Open moderation" };
        return null;
      }}
    />
  </RoleLayout>
);

export default AdminNotifications;
