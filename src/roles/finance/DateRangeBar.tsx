import type { FinanceRangePreset } from "@/api";
import { RANGE_PRESETS, toDateInput } from "./format";
import { FINANCE_ACCENT } from "./config";

export function DateRangeBar({
  preset,
  from,
  to,
  onPreset,
  onCustom,
}: {
  preset: FinanceRangePreset;
  from: string;
  to: string;
  onPreset: (preset: FinanceRangePreset) => void;
  onCustom: (from: string, to: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-1.5">
        {RANGE_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPreset(item.id)}
            className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
            style={
              preset === item.id
                ? { backgroundColor: FINANCE_ACCENT, color: "#fff", borderColor: FINANCE_ACCENT }
                : { color: "#4b5563" }
            }
          >
            {item.label}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <input
            type="date"
            value={from || toDateInput()}
            onChange={(e) => onCustom(e.target.value, to)}
            className="h-9 rounded-lg border border-gray-200 px-2 text-sm text-gray-700"
          />
          <span>to</span>
          <input
            type="date"
            value={to || toDateInput()}
            onChange={(e) => onCustom(from, e.target.value)}
            className="h-9 rounded-lg border border-gray-200 px-2 text-sm text-gray-700"
          />
        </div>
      )}
    </div>
  );
}
