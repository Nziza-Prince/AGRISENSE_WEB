import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  /** Profile image URL from the backend. Empty / null → default icon. */
  src?: string | null;
  alt?: string;
  className?: string;
  /** Pixel size classes for the outer circle (default matches navbar). */
  sizeClassName?: string;
  iconClassName?: string;
  /** Portal colour. When set, the placeholder takes it instead of the default farmer green. */
  accent?: string;
  /** Full name; the placeholder then shows initials instead of a generic icon. */
  name?: string;
}

function initialsOf(name?: string) {
  const words = (name || "").trim().split(/\s+/).filter((w) => /^\p{L}/u.test(w));
  if (!words.length) return "";
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

/**
 * Shows the user's uploaded photo when available; otherwise a neutral
 * profile icon (never the old stock profile.png photo).
 */
export function UserAvatar({
  src,
  alt = "User",
  className,
  sizeClassName = "h-9 w-9",
  iconClassName = "h-5 w-5",
  accent,
  name,
}: UserAvatarProps) {
  const photo = typeof src === "string" ? src.trim() : "";

  if (photo) {
    return (
      <img
        src={photo}
        alt={alt}
        className={cn(
          "rounded-full bg-gray-100 object-cover",
          sizeClassName,
          className,
        )}
      />
    );
  }

  const initials = initialsOf(name);

  return (
    <span
      role="img"
      aria-label={alt}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        !accent && "bg-[#e8f0eb] text-[#2C6E49]",
        sizeClassName,
        className,
      )}
      style={accent ? { backgroundColor: `${accent}1A`, color: accent } : undefined}
    >
      {initials && accent ? initials : <User className={iconClassName} strokeWidth={2} />}
    </span>
  );
}
