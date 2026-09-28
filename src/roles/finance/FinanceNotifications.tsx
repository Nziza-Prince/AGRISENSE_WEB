import RoleLayout from "../RoleLayout";
import { NotificationsInbox } from "@/components/notifications/NotificationsInbox";
import { FINANCE_ACCENT, financeLinks } from "./config";

const FinanceNotifications = () => (
  <RoleLayout
    links={financeLinks}
    roleLabel="CFO Portal"
    accent={FINANCE_ACCENT}
    title="Notifications"
    subtitle="Finance alerts and platform notices."
  >
    <NotificationsInbox accent={FINANCE_ACCENT} />
  </RoleLayout>
);

export default FinanceNotifications;
