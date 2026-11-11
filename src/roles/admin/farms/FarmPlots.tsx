import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { AdminFarm } from "@/api";
import { formatArea, sizeM2, soilColor, treemap } from "./shared";

const W = 640;
const H = 300;

/** Every farm drawn as a plot whose area is proportional to its size, coloured by soil. */
export default function FarmPlots({ farms, onOpen }: { farms: AdminFarm[]; onOpen: (farm: AdminFarm) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const sized = useMemo(
    () => farms.filter((f) => sizeM2(f) > 0).sort((a, b) => sizeM2(b) - sizeM2(a)).map((f) => ({ item: f, value: sizeM2(f) })),
    [farms],
  );
  const missing = farms.filter((f) => sizeM2(f) === 0).length;
  const tiles = useMemo(() => treemap(sized, 0, 0, W, H), [sized]);
  const soils = [...new Set(sized.map((s) => s.item.soilType.toLowerCase()))];
  const hovered = farms.find((f) => f.id === hover);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-xl bg-gray-50" role="img" aria-label="Farms drawn by size">
        {tiles.map((t, i) => {
          const f = t.item;
          const big = t.w > 90 && t.h > 46;
          return (
            <motion.g
              key={f.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 220, damping: 20 }}
              style={{ transformOrigin: `${t.x + t.w / 2}px ${t.y + t.h / 2}px`, cursor: "pointer" }}
              onMouseEnter={() => setHover(f.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onOpen(f)}
            >
              <rect
                x={t.x + 1.5}
                y={t.y + 1.5}
                width={Math.max(t.w - 3, 0)}
                height={Math.max(t.h - 3, 0)}
                rx={8}
                fill={soilColor(f.soilType)}
                opacity={hover && hover !== f.id ? 0.45 : 0.92}
              />
              {big && (
                <>
                  <text x={t.x + 12} y={t.y + 22} fontSize={12} fontWeight={700} fill="#fff">
                    {f.name.replace(/ farm.*| plot.*| garden.*/i, "").slice(0, Math.floor(t.w / 7.5))}
                  </text>
                  <text x={t.x + 12} y={t.y + 38} fontSize={10} fill="#fff" opacity={0.85}>
                    {formatArea(sizeM2(f))}
                  </text>
                </>
              )}
            </motion.g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
        {soils.map((s) => (
          <span key={s} className="flex items-center gap-1.5 capitalize">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: soilColor(s) }} />
            {s}
          </span>
        ))}
        {missing > 0 && <span className="text-amber-700">{missing} farm{missing === 1 ? "" : "s"} without a recorded size are not drawn</span>}
      </div>
      <p className="mt-1 min-h-[18px] text-xs text-gray-600">
        {hovered ? `${hovered.name} · ${hovered.ownerName} · ${formatArea(sizeM2(hovered))}` : "Area is to scale. Click a plot to open the farm."}
      </p>
    </div>
  );
}
