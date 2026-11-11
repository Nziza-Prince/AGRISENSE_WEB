import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { CheckCircle2, Clock, HandCoins, Loader2, XCircle } from "lucide-react";
import FinanceShell from "./FinanceShell";
import { Badge, PaginationControls, Panel, StatCard } from "../ui";
import { FINANCE_ACCENT } from "./config";
import {
  formatCompactDate,
  formatRwf,
  seasonPassStatusColor,
  seasonPassStatusLabel,
} from "./format";
import {
  ApiError,
  financeService,
  type FarmerPayment,
  type FarmerPaymentSummary,
} from "@/api";

const PAGE_SIZE = 20;

const FILTERS = [
  { id: "", label: "All" },
  { id: "paid", label: "Paid" },
  { id: "submitted", label: "Awaiting confirmation" },
  { id: "awaiting_payment", label: "Not yet paid" },
  { id: "rejected", label: "Rejected" },
];

const FinanceFarmerPayments = () => {
  const [items, setItems] = useState<FarmerPayment[]>([]);
  const [summary, setSummary] = useState<FarmerPaymentSummary | null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Farmer payments | Finance | AGRISENSE";
  }, []);

  const load = async (nextPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await financeService.listFarmerPayments({
        status: status || undefined,
        search: search.trim() || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      });
      setItems(res.items || []);
      setSummary(res.summary);
      setPage(res.page || nextPage);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load farmer payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <FinanceShell
      title="Farmer payments"
      subtitle="Every season pass a farmer has requested or paid. Confirmed payments are added to your books automatically."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Collected from farmers"
          value={formatRwf(summary?.paid.amount)}
          delta={`${summary?.paid.count ?? 0} confirmed payment${summary?.paid.count === 1 ? "" : "s"}`}
          deltaPositive
          accent="#15803D"
        />
        <StatCard
          icon={Clock}
          label="Awaiting confirmation"
          value={formatRwf(summary?.submitted.amount)}
          delta={`${summary?.submitted.count ?? 0} farmer${summary?.submitted.count === 1 ? "" : "s"} say they paid`}
          deltaPositive={false}
          accent="#B45309"
        />
        <StatCard
          icon={HandCoins}
          label="Requested, not yet paid"
          value={formatRwf(summary?.awaitingPayment.amount)}
          delta={`${summary?.awaitingPayment.count ?? 0} open requests`}
          accent={FINANCE_ACCENT}
        />
        <StatCard
          icon={XCircle}
          label="Rejected"
          value={formatRwf(summary?.rejected.amount)}
          delta={`${summary?.rejected.count ?? 0} payments`}
          deltaPositive={false}
          accent="#BE123C"
        />
      </div>

      <Panel>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                onClick={() => setStatus(item.id)}
                className="rounded-full border px-3 py-1 text-xs font-semibold"
                style={status === item.id ? { backgroundColor: FINANCE_ACCENT, color: "#fff", borderColor: FINANCE_ACCENT } : undefined}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex flex-1 gap-2 lg:justify-end">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load(1);
              }}
              placeholder="Search farmer, farm, phone, reference, transaction ID"
              className="h-10 w-full max-w-md rounded-lg border border-gray-200 px-3 text-sm outline-none"
            />
            <button onClick={() => load(1)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700">
              Search
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="pb-2 font-medium">Farmer</th>
                <th className="pb-2 font-medium">Farm and season</th>
                <th className="pb-2 font-medium">Payment</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Loading payments…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState art="coins" title="Farmer payments will appear here" text="Season passes paid by farmers show up the moment they are submitted or confirmed." compact />
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3">
                      <p className="font-medium text-gray-800">{item.farmer.name || item.farmer.email}</p>
                      <p className="text-xs text-gray-400">{item.farmer.phone || item.payerPhone || item.farmer.email}</p>
                    </td>
                    <td className="py-3">
                      <p className="text-gray-800">{item.farmName}</p>
                      <p className="text-xs text-gray-400">
                        Season {item.season} {item.seasonYear}
                      </p>
                    </td>
                    <td className="py-3">
                      <p className="font-mono text-xs text-gray-700">{item.reference}</p>
                      <p className="text-xs text-gray-400">
                        {item.momoTransactionId ? `MoMo ${item.momoTransactionId}` : "No transaction ID"}
                        {item.paidAt ? ` · paid ${formatCompactDate(item.paidAt)}` : item.submittedAt ? ` · sent ${formatCompactDate(item.submittedAt)}` : ""}
                      </p>
                      {item.adminNote && <p className="text-xs text-gray-500">Note: {item.adminNote}</p>}
                    </td>
                    <td className="py-3">
                      <Badge color={seasonPassStatusColor(item.status)}>{seasonPassStatusLabel(item.status)}</Badge>
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-800">{formatRwf(item.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={page}
          totalPages={totalPages}
          total={total}
          limit={PAGE_SIZE}
          disabled={loading}
          onPageChange={(next) => load(next)}
        />
      </Panel>

      <p className="mt-4 text-xs text-gray-500">
        Payments are confirmed by an admin after checking the mobile money message or cash received. The moment a payment is
        confirmed it appears under Money in as a Season passes record. Farmers who paid before this system, or paid in another
        way, can be added with Record money in.
      </p>
    </FinanceShell>
  );
};

export default FinanceFarmerPayments;
