import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Farm } from "@/api";
import { KIND_META, PROVINCES, provinceKey, type Org } from "./shared";

const W = 640;
const ROW = 46;

/**
 * Who reaches whom: organisations on the left, provinces on the right, a curve for every province an
 * organisation serves. Province dots grow with the number of farms there. Point at an organisation to follow its reach.
 */
export default function OrgReachNetwork({ orgs, farms }: { orgs: Org[]; farms: Farm[] }) {
  const [focus, setFocus] = useState<string | null>(null);
  const live = useMemo(() => orgs.filter((o) => o.status !== "REJECTED"), [orgs]);
  const rowsH = Math.max(live.length * ROW, PROVINCES.length * 58) + 30;
  const maxFarms = Math.max(1, ...PROVINCES.map((p) => farms.filter((f) => provinceKey(f.province || "") === provinceKey(p)).length));

  const orgY = (i: number) => 24 + i * ((rowsH - 48) / Math.max(live.length - 1, 1));
  const provY = (i: number) => 24 + i * ((rowsH - 48) / (PROVINCES.length - 1));
  const orgCentered = live.length === 1;

  return (
    <svg viewBox={`0 0 ${W} ${rowsH}`} className="mx-auto h-auto w-full max-w-[720px]" role="img" aria-label="Which provinces each organisation serves">
      {live.flatMap((o, i) =>
        PROVINCES.filter((p) => o.regions.some((r) => provinceKey(r) === provinceKey(p))).map((p, k) => {
          const y1 = orgCentered ? rowsH / 2 : orgY(i);
          const y2 = provY(PROVINCES.indexOf(p));
          const dim = focus && focus !== o.id;
          return (
            <motion.path
              key={`${o.id}-${p}`}
              d={`M 190 ${y1} C 340 ${y1}, 340 ${y2}, 470 ${y2}`}
              fill="none"
              stroke={o.status === "PENDING" ? "#F59E0B" : KIND_META[o.kind].color}
              strokeWidth={focus === o.id ? 4 : 2.5}
              strokeLinecap="round"
              strokeDasharray={o.status === "PENDING" ? "5 5" : undefined}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: dim ? 0.12 : 0.7 }}
              transition={{ pathLength: { duration: 0.9, delay: 0.2 + (i + k) * 0.08 }, opacity: { duration: 0.3 } }}
            />
          );
        }),
      )}

      {live.map((o, i) => {
        const y = orgCentered ? rowsH / 2 : orgY(i);
        return (
          <motion.g
            key={o.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onMouseEnter={() => setFocus(o.id)}
            onMouseLeave={() => setFocus(null)}
            style={{ cursor: "pointer" }}
          >
            <circle cx={190} cy={y} r={8} fill={o.status === "PENDING" ? "#F59E0B" : KIND_META[o.kind].color} stroke="#fff" strokeWidth={2.5} />
            <text x={176} y={y - 2} textAnchor="end" fontSize={12} fontWeight={700} fill="#111827">
              {o.name.length > 26 ? `${o.name.slice(0, 25)}…` : o.name}
            </text>
            <text x={176} y={y + 12} textAnchor="end" fontSize={10} fill="#6B7280">
              {KIND_META[o.kind].label}
              {o.status === "PENDING" ? " · pending" : ""}
            </text>
          </motion.g>
        );
      })}

      {PROVINCES.map((p, i) => {
        const farmCount = farms.filter((f) => provinceKey(f.province || "") === provinceKey(p)).length;
        const r = 7 + (farmCount / maxFarms) * 11;
        return (
          <motion.g key={p} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}>
            <circle cx={470} cy={provY(i)} r={r} fill="#0F766E" opacity={farmCount ? 0.85 : 0.25} stroke="#fff" strokeWidth={2.5} />
            <text x={470 + r + 10} y={provY(i) - 1} fontSize={12} fontWeight={700} fill="#111827">
              {p.replace(" Province", "")}
            </text>
            <text x={470 + r + 10} y={provY(i) + 12} fontSize={10} fill="#6B7280">
              {farmCount} farm{farmCount === 1 ? "" : "s"}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}
