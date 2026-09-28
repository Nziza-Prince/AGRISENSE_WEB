import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import RoleLayout from "../RoleLayout";
import { Badge, Panel } from "../ui";
import { FINANCE_ACCENT, financeLinks } from "./config";
import { accountTypeLabel, formatRwf } from "./format";
import {
  ApiError,
  financeService,
  type FinanceAccount,
  type FinanceAccountType,
  type FinanceCategory,
  type FinanceCategoryKind,
} from "@/api";

const ACCOUNT_TYPES: FinanceAccountType[] = [
  "BANK",
  "CASH",
  "MOBILE_MONEY",
  "PAYMENT_PLATFORM",
  "OTHER",
];

const FinanceAccounts = () => {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({
    name: "",
    type: "BANK" as FinanceAccountType,
    institution: "",
    accountNumber: "",
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    kind: "EXPENSE" as FinanceCategoryKind,
  });

  useEffect(() => {
    document.title = "Accounts | Finance | AGRISENSE";
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accountsRes, categoriesRes] = await Promise.all([
        financeService.listAccounts(),
        financeService.listCategories(),
      ]);
      setAccounts(accountsRes.accounts || []);
      setCategories(categoriesRes.categories || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createAccount = async () => {
    if (!accountForm.name.trim()) return;
    setError(null);
    try {
      await financeService.createAccount({
        name: accountForm.name.trim(),
        type: accountForm.type,
        institution: accountForm.institution.trim() || undefined,
        accountNumber: accountForm.accountNumber.trim() || undefined,
      });
      setAccountForm({ name: "", type: "BANK", institution: "", accountNumber: "" });
      setInfo("Account created. Balance starts at 0 RWF until transactions post.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create account.");
    }
  };

  const createCategory = async () => {
    if (!categoryForm.name.trim()) return;
    setError(null);
    try {
      await financeService.createCategory({
        name: categoryForm.name.trim(),
        kind: categoryForm.kind,
      });
      setCategoryForm({ name: "", kind: "EXPENSE" });
      setInfo("Category created.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create category.");
    }
  };

  return (
    <RoleLayout
      links={financeLinks}
      roleLabel="CFO Portal"
      accent={FINANCE_ACCENT}
      title="Accounts & categories"
      subtitle="Balances are derived from approved transactions, not stored as a separate number."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {info && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{info}</div>
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-sm text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-5">
          <Panel title="Accounts" className="xl:col-span-3">
            <div className="mb-4 grid gap-2 sm:grid-cols-4">
              <input
                value={accountForm.name}
                onChange={(e) => setAccountForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Account name"
                className="h-10 rounded-lg border px-3 text-sm sm:col-span-2"
              />
              <select
                value={accountForm.type}
                onChange={(e) =>
                  setAccountForm((prev) => ({ ...prev, type: e.target.value as FinanceAccountType }))
                }
                className="h-10 rounded-lg border px-3 text-sm"
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {accountTypeLabel(type)}
                  </option>
                ))}
              </select>
              <button
                onClick={createAccount}
                className="rounded-lg px-3 text-sm font-semibold text-white"
                style={{ backgroundColor: FINANCE_ACCENT }}
              >
                Add
              </button>
              <input
                value={accountForm.institution}
                onChange={(e) => setAccountForm((prev) => ({ ...prev, institution: e.target.value }))}
                placeholder="Institution"
                className="h-10 rounded-lg border px-3 text-sm sm:col-span-2"
              />
              <input
                value={accountForm.accountNumber}
                onChange={(e) => setAccountForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="Account / wallet number"
                className="h-10 rounded-lg border px-3 text-sm sm:col-span-2"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[11px] uppercase tracking-wide text-gray-400">
                    <th className="pb-2 font-medium">Account</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Balance</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-gray-800">{account.name}</p>
                        <p className="text-xs text-gray-400">
                          {account.institution || account.accountNumber || "—"}
                        </p>
                      </td>
                      <td className="py-3 text-gray-600">{accountTypeLabel(account.type)}</td>
                      <td className="py-3">
                        <Badge color={account.isActive === false ? "gray" : "green"}>
                          {account.isActive === false ? "Archived" : "Active"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-semibold">{formatRwf(account.balance)}</td>
                      <td className="py-3">
                        <button
                          onClick={async () => {
                            await financeService.updateAccount(account.id, {
                              isActive: account.isActive === false,
                            });
                            await load();
                          }}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                        >
                          {account.isActive === false ? "Restore" : "Archive"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Categories" className="xl:col-span-2">
            <div className="mb-4 grid gap-2">
              <input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Category name"
                className="h-10 rounded-lg border px-3 text-sm"
              />
              <div className="flex gap-2">
                <select
                  value={categoryForm.kind}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({ ...prev, kind: e.target.value as FinanceCategoryKind }))
                  }
                  className="h-10 flex-1 rounded-lg border px-3 text-sm"
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
                <button
                  onClick={createCategory}
                  className="rounded-lg px-4 text-sm font-semibold text-white"
                  style={{ backgroundColor: FINANCE_ACCENT }}
                >
                  Add
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{category.name}</p>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">{category.kind}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await financeService.updateCategory(category.id, {
                        isActive: category.isActive === false,
                      });
                      await load();
                    }}
                    className="text-xs font-semibold text-gray-500"
                  >
                    {category.isActive === false ? "Restore" : "Archive"}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </RoleLayout>
  );
};

export default FinanceAccounts;
