import { useEffect, useRef, useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import type { LucideProps } from "lucide-react";
import Tip from "./Tip";

export type Tone = "neutral" | "good" | "warn" | "danger" | "brand";
const TONES: Record<Tone, string> = {
  neutral: "text-gray-400 hover:bg-gray-100 hover:text-gray-700",
  good: "text-gray-400 hover:bg-emerald-50 hover:text-emerald-600",
  warn: "text-gray-400 hover:bg-amber-50 hover:text-amber-600",
  danger: "text-gray-400 hover:bg-red-50 hover:text-red-600",
  brand: "text-gray-400 hover:bg-indigo-50 hover:text-[#4338CA]",
};

export function IconAction({
  icon: Icon,
  label,
  tone,
  onClick,
  confirm = false,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  tone: Tone;
  onClick: () => void;
  /** Dangerous actions need a second click within three seconds. */
  confirm?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const press = () => {
    if (!confirm) return onClick();
    if (armed) {
      window.clearTimeout(timer.current);
      setArmed(false);
      onClick();
      return;
    }
    setArmed(true);
    timer.current = window.setTimeout(() => setArmed(false), 3000);
  };

  return (
    <Tip text={armed ? `Click again to ${label.toLowerCase()}` : label}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.88 }}
        animate={armed ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
        onClick={press}
        aria-label={label}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          armed ? "bg-red-500 text-white" : TONES[tone]
        }`}
      >
        <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
      </motion.button>
    </Tip>
  );
}

