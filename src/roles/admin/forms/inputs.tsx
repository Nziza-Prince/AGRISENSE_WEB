import { useState, type ReactNode } from "react";
import { Check, Copy, Eye, EyeOff, Wand2 } from "lucide-react";
import { generatePassword, passwordStrength } from "./password";

const base =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#4338CA] focus:ring-4 focus:ring-[#4338CA]/10 disabled:bg-gray-50";

export function Field({ label, hint, optional, children }: { label: string; hint?: string; optional?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-600">
        {label}
        {optional && <span className="font-normal text-gray-400">optional</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function SelectInput({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${base} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239CA3AF%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9 ${props.className ?? ""}`}>
      {children}
    </select>
  );
}

/** Password with a show/hide eye, a one-click strong password, a copy button and a strength meter. */
export function PasswordField({ value, onChange, label = "Temporary password", hint }: { value: string; onChange: (v: string) => void; label?: string; hint?: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const strength = passwordStrength(value);
  const colors = ["#E5E7EB", "#EF4444", "#F59E0B", "#84CC16", "#10B981"];

  const generate = () => {
    onChange(generatePassword());
    setShow(true);
  };
  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the password is visible to copy by hand.
    }
  };

  const iconBtn = "flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-[#4338CA]";

  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          placeholder="Type one, or generate a strong password"
          className={`${base} pr-[116px] ${show ? "font-mono" : ""}`}
        />
        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center">
          <button type="button" onClick={generate} aria-label="Generate a strong password" title="Generate a strong password" className={iconBtn}>
            <Wand2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={copy} aria-label="Copy password" title="Copy password" className={iconBtn}>
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} title={show ? "Hide" : "Show"} className={iconBtn}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {value && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: strength.score >= n ? colors[strength.score] : "#E5E7EB" }} />
            ))}
          </div>
          <span className="w-14 text-right text-[11px] font-semibold text-gray-500">{strength.label}</span>
        </div>
      )}
    </Field>
  );
}

export function ChipGroup<T extends string>({ value, onChange, options }: { value: T | ""; onChange: (v: T) => void; options: Array<{ value: T; label: string; color?: string }> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${on ? "border-[#4338CA] bg-indigo-50 text-[#4338CA]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {o.color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: o.color }} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
