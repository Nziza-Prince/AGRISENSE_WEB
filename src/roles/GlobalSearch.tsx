import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search, Sprout, Users } from "lucide-react";
import { adminService, farmRecordsService, type AdminFarm, type AdminUserSummary } from "@/api";
import { getUserDisplayName } from "@/lib/user";
import type { RoleNavLink } from "./RoleLayout";

interface Hit {
  key: string;
  group: "Pages" | "People" | "Farms";
  title: string;
  hint?: string;
  to: string;
  icon: RoleNavLink["icon"];
}

/** Header search that jumps to any page of the console and, for admins, to a person or a farm. */
export default function GlobalSearch({ links, accent, isAdmin }: { links: RoleNavLink[]; accent: string; isAdmin: boolean }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<AdminUserSummary[]>([]);
  const [farms, setFarms] = useState<AdminFarm[]>([]);
  const [cursor, setCursor] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const farmCache = useRef<AdminFarm[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (!isAdmin || term.length < 2) {
      setPeople([]);
      setFarms([]);
      return;
    }
    let live = true;
    const timer = window.setTimeout(async () => {
      try {
        const res = (await adminService.getUsers({ page: 1, limit: 5, search: term })) as { users?: AdminUserSummary[]; items?: AdminUserSummary[] };
        if (live) setPeople(res.users ?? res.items ?? []);
        if (!farmCache.current) farmCache.current = (await farmRecordsService.listFarms()).farms;
        const lower = term.toLowerCase();
        if (live)
          setFarms(
            farmCache.current.filter((f) => [f.name, f.ownerName, f.farmCode, f.village].join(" ").toLowerCase().includes(lower)).slice(0, 4),
          );
      } catch {
        // Search is a shortcut; the pages themselves report errors.
      }
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [q, isAdmin]);

  const hits: Hit[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    const pages = links
      .filter((l) => !term || l.title.toLowerCase().includes(term))
      .slice(0, term ? 5 : 6)
      .map<Hit>((l) => ({ key: `p-${l.to}`, group: "Pages", title: l.title, hint: "Go to page", to: l.to, icon: l.icon }));
    const folks = people.map<Hit>((u) => ({
      key: `u-${u.id}`,
      group: "People",
      title: getUserDisplayName(u),
      hint: u.email || String(u.role || ""),
      to: `/admin/users?search=${encodeURIComponent(u.email || getUserDisplayName(u))}`,
      icon: Users,
    }));
    const fields = farms.map<Hit>((f) => ({
      key: `f-${f.id}`,
      group: "Farms",
      title: `${f.farmCode ? `${f.farmCode} · ` : ""}${f.name}`,
      hint: f.ownerName,
      to: `/admin/farms?farm=${f.id}`,
      icon: Sprout,
    }));
    return [...pages, ...folks, ...fields];
  }, [q, links, people, farms]);

  useEffect(() => setCursor(0), [q]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const go = (hit: Hit) => {
    setOpen(false);
    setQ("");
    input.current?.blur();
    navigate(hit.to);
  };

  return (
    <div ref={box} className="relative hidden max-w-md flex-1 sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        ref={input}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setCursor((c) => Math.min(c + 1, hits.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor((c) => Math.max(c - 1, 0));
          } else if (e.key === "Enter" && hits[cursor]) {
            go(hits[cursor]);
          } else if (e.key === "Escape") {
            setOpen(false);
            input.current?.blur();
          }
        }}
        type="text"
        placeholder={isAdmin ? "Search pages, people, farms…" : "Search pages…"}
        aria-label="Search"
        className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-14 text-sm focus:outline-none focus:ring-2"
        style={{ ["--tw-ring-color" as string]: accent }}
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-400">Ctrl K</kbd>

      <AnimatePresence>
        {open && hits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border bg-white p-2 shadow-xl"
          >
            {(["Pages", "People", "Farms"] as const).map((group) => {
              const items = hits.filter((h) => h.group === group);
              if (!items.length) return null;
              return (
                <div key={group} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">{group}</p>
                  {items.map((h) => {
                    const active = hits[cursor]?.key === h.key;
                    return (
                      <button
                        key={h.key}
                        type="button"
                        onMouseEnter={() => setCursor(hits.indexOf(h))}
                        onClick={() => go(h)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${active ? "bg-gray-100" : ""}`}
                      >
                        <h.icon className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-gray-900">{h.title}</span>
                          {h.hint && <span className="block truncate text-xs text-gray-500">{h.hint}</span>}
                        </span>
                        {active && <CornerDownLeft className="h-3.5 w-3.5 text-gray-400" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
