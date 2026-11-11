import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";

export interface TagOption {
  value: string;
  label: string;
  count: number;
  dot?: string;
}
export interface TagGroup {
  key: string;
  label: string;
  options: TagOption[];
}

/** One search box: type to search, or pick a suggestion and it becomes a removable tag. One tag per group. */
export default function TagSearch({
  query,
  onQuery,
  groups,
  selected,
  onSelect,
  placeholder,
}: {
  query: string;
  onQuery: (v: string) => void;
  groups: TagGroup[];
  selected: Record<string, string | null>;
  onSelect: (group: string, value: string | null) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const chosen = groups.flatMap((g) =>
    selected[g.key] ? [{ group: g, option: g.options.find((o) => o.value === selected[g.key]) }] : [],
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.flatMap((g) =>
      selected[g.key]
        ? []
        : g.options
            .filter((o) => !q || o.label.toLowerCase().includes(q))
            .map((o) => ({ group: g, option: o })),
    );
  }, [groups, selected, query]);

  const hasAny = chosen.length > 0 || query;

  return (
    <div className="relative">
      <div
        onClick={() => ref.current?.focus()}
        className={`flex min-h-[48px] flex-wrap items-center gap-2 rounded-2xl border bg-white px-3 py-1.5 shadow-sm transition ${
          open ? "border-[#4338CA] ring-4 ring-[#4338CA]/10" : "border-gray-200"
        }`}
      >
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <AnimatePresence initial={false}>
          {chosen.map(({ group, option }) => (
            <motion.span
              key={group.key}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-[#4338CA]"
            >
              {option?.dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: option.dot }} />}
              {option?.label ?? selected[group.key]}
              <button type="button" aria-label={`Remove ${group.label}`} onClick={() => onSelect(group.key, null)}>
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          ref={ref}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") ref.current?.blur();
            if (e.key === "Backspace" && !query && chosen.length) onSelect(chosen[chosen.length - 1].group.key, null);
            if (e.key === "Enter" && query.trim() && suggestions.length) {
              onSelect(suggestions[0].group.key, suggestions[0].option.value);
              onQuery("");
            }
          }}
          placeholder={chosen.length ? "Add a name…" : placeholder}
          className="h-9 min-w-[180px] flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
        />
        {hasAny && (
          <button
            type="button"
            aria-label="Clear everything"
            onClick={() => {
              onQuery("");
              groups.forEach((g) => onSelect(g.key, null));
            }}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
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
              {suggestions.map(({ group, option }) => (
                <button
                  key={`${group.key}-${option.value}`}
                  type="button"
                  onClick={() => {
                    onSelect(group.key, option.value);
                    onQuery("");
                    ref.current?.focus();
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#4338CA] hover:bg-indigo-50 hover:text-[#4338CA]"
                >
                  {option.dot && <span className="h-2 w-2 rounded-full" style={{ background: option.dot }} />}
                  <span className="text-[10px] font-medium uppercase text-gray-400">{group.label}</span>
                  {option.label}
                  <span className="rounded-full bg-gray-100 px-1.5 text-[10px] text-gray-500">{option.count}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
