import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import type { AdminUserSummary } from "@/api";
import { ROLE_META, ROLE_ORDER, STATUS_META, STATUS_ORDER, joinedOf, nameOf, roleOf, statusOf } from "./shared";

const SIZE = 380;
const C = SIZE / 2;

interface Dot {
  user: AdminUserSummary;
  x: number;
  y: number;
  ring: number;
  index: number;
}

/**
 * The community as an orbit: every person is a dot on the ring of their role (staff inside, farmers
 * outside), coloured by account status. Rings drift slowly; pointing at one pauses them.
 */
export default function UserOrbit({
  users,
  statusCounts,
  activeStatus,
  onPick,
  onStatus,
}: {
  users: AdminUserSummary[];
  statusCounts: Record<string, number>;
  activeStatus: string | null;
  onPick: (user: AdminUserSummary) => void;
  onStatus: (status: string | null) => void;
}) {
  const [hovered, setHovered] = useState<AdminUserSummary | null>(null);

  const rings = useMemo(() => {
    const present = ROLE_ORDER.filter((r) => users.some((u) => roleOf(u) === r));
    const inner = 58;
    const outer = C - 24;
    return present.map((role, i) => {
      const radius = present.length === 1 ? outer : inner + ((outer - inner) * i) / (present.length - 1);
      const members = users.filter((u) => roleOf(u) === role);
      const dots: Dot[] = members.map((user, index) => {
        const angle = (index / members.length) * Math.PI * 2 + i * 0.9 - Math.PI / 2;
        return { user, x: C + radius * Math.cos(angle), y: C + radius * Math.sin(angle), ring: i, index };
      });
      return { role, radius, dots, duration: 70 + i * 28, reverse: i % 2 === 1 };
    });
  }, [users]);

  const total = users.length;

  return (
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <style>{`
        @keyframes orbit-spin { to { transform: rotate(360deg); } }
        @keyframes orbit-ping { 0% { opacity: .55; transform: scale(1); } 100% { opacity: 0; transform: scale(2.6); } }
        .orbit-wrap:hover .orbit-spin, .orbit-wrap:hover .orbit-ping { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .orbit-spin, .orbit-ping { animation: none !important; } }
      `}</style>

      <div className="orbit-wrap relative mx-auto w-full max-w-[380px]">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full" role="img" aria-label="Every account placed on the ring of its role">
          <defs>
            <radialGradient id="orbit-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4338CA" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#4338CA" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={C} cy={C} r={C - 4} fill="url(#orbit-core)" />
          {rings.map((ring, i) => (
            <motion.circle
              key={ring.role}
              cx={C}
              cy={C}
              fill="none"
              stroke="#C7D2FE"
              strokeWidth={1}
              strokeDasharray="2 6"
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: ring.radius, opacity: 1 }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
            />
          ))}

          {rings.map((ring) => (
            <g
              key={ring.role}
              className="orbit-spin"
              style={{
                transformOrigin: `${C}px ${C}px`,
                animation: `orbit-spin ${ring.duration}s linear infinite ${ring.reverse ? "reverse" : "normal"}`,
              }}
            >
              {ring.dots.map((dot) => {
                const status = statusOf(dot.user);
                const color = STATUS_META[status]?.dot ?? "#9CA3AF";
                const isHot = hovered?.id === dot.user.id;
                const dimmed = activeStatus && activeStatus !== status;
                return (
                  <g key={dot.user.id} opacity={dimmed ? 0.18 : 1} style={{ transition: "opacity .3s" }}>
                    {status === "PENDING" && (
                      <circle
                        className="orbit-ping"
                        cx={dot.x}
                        cy={dot.y}
                        r={6}
                        fill={color}
                        style={{ transformOrigin: `${dot.x}px ${dot.y}px`, animation: "orbit-ping 2.2s ease-out infinite" }}
                      />
                    )}
                    <motion.circle
                      cx={dot.x}
                      cy={dot.y}
                      fill={color}
                      stroke="#fff"
                      strokeWidth={2}
                      initial={{ r: 0 }}
                      animate={{ r: isHot ? 10 : 7 }}
                      transition={{ type: "spring", stiffness: 380, damping: 16, delay: isHot ? 0 : 0.5 + dot.index * 0.04 }}
                      className="cursor-pointer"
                      tabIndex={0}
                      role="button"
                      aria-label={`${nameOf(dot.user)}, ${ROLE_META[ring.role].label}, ${STATUS_META[status]?.label ?? status}`}
                      onMouseEnter={() => setHovered(dot.user)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(dot.user)}
                      onBlur={() => setHovered(null)}
                      onClick={() => onPick(dot.user)}
                      onKeyDown={(e) => e.key === "Enter" && onPick(dot.user)}
                    />
                  </g>
                );
              })}
            </g>
          ))}

          {rings.map((ring) => (
            <text
              key={`label-${ring.role}`}
              x={C}
              y={C - ring.radius - 8}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill="#6366F1"
              stroke="#fff"
              strokeWidth={3}
              paintOrder="stroke"
              pointerEvents="none"
              style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              {ROLE_META[ring.role].label}
            </text>
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-bold text-gray-900">
            <CountUp end={total} duration={1.2} />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400">people</span>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {STATUS_ORDER.map((key, i) => {
            const meta = STATUS_META[key];
            const active = activeStatus === key;
            return (
              <motion.button
                key={key}
                type="button"
                onClick={() => onStatus(active ? null : key)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                  active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-100 bg-gray-50 hover:bg-white"
                }`}
              >
                <span className="flex items-center gap-2 text-xs font-medium">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.dot }} />
                  <span className={active ? "text-gray-300" : "text-gray-500"}>{meta.label}</span>
                </span>
                <span className="mt-1 block text-2xl font-bold">
                  <CountUp end={statusCounts[key] ?? 0} duration={1} />
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4 min-h-[84px] rounded-2xl border border-dashed border-gray-200 p-4 text-sm">
          {hovered ? (
            <motion.div key={hovered.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              <p className="font-semibold text-gray-900">{nameOf(hovered)}</p>
              <p className="text-gray-500">{hovered.email || "No email"}</p>
              <p className="mt-1 text-xs text-gray-400">
                {ROLE_META[roleOf(hovered)]?.label ?? roleOf(hovered)} · {STATUS_META[statusOf(hovered)]?.label ?? statusOf(hovered)} ·
                joined {joinedOf(hovered)}
              </p>
            </motion.div>
          ) : (
            <p className="text-gray-400">
              Each dot is a person. Rings are roles (staff inside, farmers outside); colour is account status. Point at a dot for
              details, click it to find them in the table, or click a status above to spotlight it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
