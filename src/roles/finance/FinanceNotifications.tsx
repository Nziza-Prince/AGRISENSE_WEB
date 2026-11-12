import FinanceShell from "./FinanceShell";
import { NotificationsInbox } from "@/components/notifications/NotificationsInbox";
import { FINANCE_ACCENT } from "./config";

const FinanceNotifications = () => (
  <FinanceShell
    title="Notifications"
    subtitle="Finance alerts and platform notices."
  >
    <NotificationsInbox accent={FINANCE_ACCENT} />
  </FinanceShell>
);

export default FinanceNotifications;
