import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { ROLE_META, ROLE_ORDER, STATUS_META, STATUS_ORDER } from "./shared";

interface Props {
  query: string;
  role: string | null;
  status: string | null;
  roleCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  onQuery: (value: string) => void;
  onRole: (value: string | null) => void;
  onStatus: (value: string | null) => void;
}

/**
 * One box does everything: type to search names, emails and phones, or pick a role or status
 * from the suggestions and it becomes a removable tag inside the box.
 */
export default function UserSmartFilter({
  query,
  role,
  status,
  roleCounts,
  statusCounts,
  onQuery,
  onRole,
  onStatus,
}: Props) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: Array<{ kind: "role" | "status"; key: string; label: string; count: number; dot?: string }> = [];
    if (!role) {
      for (const key of ROLE_ORDER) {
        const label = ROLE_META[key].label;
        if (!q || label.toLowerCase().includes(q) || key.toLowerCase().includes(q))
          items.push({ kind: "role", key, label, count: roleCounts[key] ?? 0 });
      }
    }
    if (!status) {
      for (const key of STATUS_ORDER) {
        const label = STATUS_META[key].label;
        if (!q || label.toLowerCase().includes(q))
          items.push({ kind: "status", key, label, count: statusCounts[key] ?? 0, dot: STATUS_META[key].dot });
      }
    }
    return items.filter((i) => i.count > 0 || !q);
  }, [query, role, status, roleCounts, statusCounts]);

  const pick = (item: (typeof suggestions)[number]) => {
    if (item.kind === "role") onRole(item.key);
    else onStatus(item.key);
    onQuery("");
    inputRef.current?.focus();
  };

  const hasAny = Boolean(role || status || query);

  return (
    <div className="relative">
      <div
        onClick={() => inputRef.current?.focus()}
        className={`flex min-h-[48px] flex-wrap items-center gap-2 rounded-2xl border bg-white px-3 py-1.5 shadow-sm transition ${
          open ? "border-[#4338CA] ring-4 ring-[#4338CA]/10" : "border-gray-200"
        }`}
      >
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <AnimatePresence initial={false}>
          {role && (
            <motion.span
              key="role"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: ROLE_META[role].tint, color: ROLE_META[role].text }}
            >
              {ROLE_META[role].label}
              <button type="button" aria-label="Remove role filter" onClick={() => onRole(null)}>
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          )}
          {status && (
            <motion.span
              key="status"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS_META[status].pill}`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_META[status].dot }} />
              {STATUS_META[status].label}
              <button type="button" aria-label="Remove status filter" onClick={() => onStatus(null)}>
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          )}
        </AnimatePresence>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") inputRef.current?.blur();
            if (e.key === "Backspace" && !query) {
              if (status) onStatus(null);
              else if (role) onRole(null);
            }
            if (e.key === "Enter" && suggestions.length && query.trim()) pick(suggestions[0]);
          }}
          placeholder={role || status ? "Add a name or email…" : "Search people, or filter by role and status…"}
          className="h-9 min-w-[180px] flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
        />
        {hasAny && (
          <button
            type="button"
            onClick={() => {
              onQuery("");
              onRole(null);
              onStatus(null);
            }}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Clear everything"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-100 bg-white p-2 shadow-xl"
          >
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((item) => (
                <button
                  key={`${item.kind}-${item.key}`}
                  type="button"
                  onClick={() => pick(item)}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#4338CA] hover:bg-indigo-50 hover:text-[#4338CA]"
                >
                  {item.dot && <span className="h-2 w-2 rounded-full" style={{ background: item.dot }} />}
                  <span className="text-[10px] font-medium uppercase text-gray-400">{item.kind}</span>
                  {item.label}
                  <span className="rounded-full bg-gray-100 px-1.5 text-[10px] text-gray-500">{item.count}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
