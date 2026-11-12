import type { ReactNode } from "react";

/** One headline figure: a quiet label, one number, and a short line of context. Pages show at most three. */
export function Figure({ label, value, children, tone = "text-gray-900" }: { label: string; value: string; children?: ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${tone}`}>{value}</p>
      {children && <div className="mt-3 space-y-1 text-sm text-gray-500">{children}</div>}
    </div>
  );
}

export function Figures({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid gap-4 md:grid-cols-3">{children}</div>;
}
