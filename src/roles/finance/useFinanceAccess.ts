import { useAuth } from "@/context/useAuth";

/** Admins look at finance with their own sidebar and cannot change any record; only the CFO can. */
export function useFinanceAccess() {
  const { user } = useAuth();
  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN";
  return { isAdmin, readOnly: isAdmin };
}
