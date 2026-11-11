import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Small tooltip drawn on top of everything, so table scrolling never clips it. */
export default function Tip({ text, children }: { text: string; children: ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  return (
    <span
      className="inline-flex"
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: r.left + r.width / 2, y: r.top });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos &&
        createPortal(
          <span
            role="tooltip"
            className="pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg"
            style={{ left: pos.x, top: pos.y - 6 }}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
