import type { ReactNode } from "react";

export type EmptyArt = "waitlist" | "calm" | "seedling" | "bell" | "coins" | "search";

/** A small animated picture and a short line, for places where there is nothing to show yet. */
export function EmptyState({ art, title, text, children, compact = false }: { art: EmptyArt; title: string; text?: string; children?: ReactNode; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "py-4" : "py-8"}`}>
      <img src={`/assets/empty/${art}.gif`} alt="" width={compact ? 170 : 220} height={compact ? 131 : 169} className="select-none" draggable={false} />
      <p className="mt-1 text-base font-semibold text-gray-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-gray-500">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
