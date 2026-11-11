import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import FinanceShell from "./FinanceShell";
import { useFinanceAccess } from "./useFinanceAccess";
import { Panel } from "../ui";
import { FINANCE_ACCENT } from "./config";
import {
  ApiError,
  financeService,
  type FinanceCategory,
  type FinanceCategoryKind,
} from "@/api";

const KIND_BLOCKS: Array<{ kind: FinanceCategoryKind; title: string; hint: string }> = [
  { kind: "INCOME", title: "Money in", hint: "Where money comes from" },
  { kind: "EXPENSE", title: "Money out", hint: "What money is spent on" },
];

const FinanceCategories = () => {
  const { readOnly } = useFinanceAccess();
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    kind: "EXPENSE" as FinanceCategoryKind,
    description: "",
  });

  useEffect(() => {
    document.title = "Categories | Finance | AGRISENSE";
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await financeService.listCategories();
      setCategories(res.categories || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    setError(null);
    setInfo(null);
    try {
      await financeService.createCategory({
        name: form.name.trim(),
        kind: form.kind,
        description: form.description.trim() || undefined,
      });
      setForm((prev) => ({ ...prev, name: "", description: "" }));
      setInfo("Category added. You can use it when recording money.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create category.");
    }
  };

  const toggle = async (category: FinanceCategory) => {
    setError(null);
    try {
      await financeService.updateCategory(category.id, { isActive: category.isActive === false });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update category.");
    }
  };

  return (
    <FinanceShell
      title="Categories"
      subtitle={
        readOnly
          ? "How money in and money out is grouped. View only."
          : "Group money in and money out so reports show where money comes from and where it goes."
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {info && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{info}</div>
      )}

      {!readOnly && (
        <Panel title="Add a category" className="mb-5">
          <div className="grid gap-2 md:grid-cols-[1fr_180px_1.4fr_auto]">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Category name, for example Transport"
              className="h-10 rounded-lg border px-3 text-sm"
            />
            <select
              value={form.kind}
              onChange={(e) => setForm((prev) => ({ ...prev, kind: e.target.value as FinanceCategoryKind }))}
              className="h-10 rounded-lg border px-3 text-sm"
            >
              <option value="INCOME">Money in</option>
              <option value="EXPENSE">Money out</option>
            </select>
            <input
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="What belongs here (optional)"
              className="h-10 rounded-lg border px-3 text-sm"
            />
            <button
              onClick={create}
              className="h-10 rounded-lg px-5 text-sm font-semibold text-white"
              style={{ backgroundColor: FINANCE_ACCENT }}
            >
              Add
            </button>
          </div>
        </Panel>
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-sm text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {KIND_BLOCKS.map((block) => (
            <Panel key={block.kind} title={block.title}>
              <p className="-mt-1 mb-3 text-xs text-gray-400">{block.hint}</p>
              <div className="space-y-2">
                {categories
                  .filter((category) => category.kind === block.kind)
                  .map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5 ${
                        category.isActive === false ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: category.color || "#94a3b8" }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">{category.name}</p>
                          {category.description && (
                            <p className="truncate text-xs text-gray-400">{category.description}</p>
                          )}
                        </div>
                      </div>
                      {!readOnly && (
                        <button onClick={() => toggle(category)} className="text-xs font-semibold text-gray-500 hover:text-gray-800">
                          {category.isActive === false ? "Restore" : "Archive"}
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </FinanceShell>
  );
};

export default FinanceCategories;
