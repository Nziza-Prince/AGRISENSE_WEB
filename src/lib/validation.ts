// Client-side input validation & sanitization helpers.
//
// NOTE: client-side validation is a UX / defense-in-depth layer only. The
// backend remains the source of truth and must re-validate everything.

export type ValidationResult = { valid: boolean; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Allow letters, numbers, dot, underscore, dash. 3-30 chars.
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,30}$/;
// International-ish phone: optional +, 7-15 digits.
const PHONE_RE = /^\+?[0-9]{7,15}$/;
const RWANDA_NATIONAL_ID_RE = /^[0-9]{16}$/;

/**
 * Trim and strip control characters / angle brackets to reduce the chance of
 * accidental HTML/script injection making it into stored content. React already
 * escapes rendered text, so this is defense-in-depth, not the only line.
 */
export function sanitizeText(value: string): string {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, "") // control chars
    .replace(/[<>]/g, "") // strip angle brackets
    .trim();
}

/** Collapse internal whitespace and trim – good for names / single-line fields. */
export function sanitizeSingleLine(value: string): string {
  return sanitizeText(value).replace(/\s+/g, " ");
}

export function validateEmail(email: string): ValidationResult {
  const value = email.trim();
  if (!value) return { valid: false, message: "Email is required." };
  if (value.length > 254) return { valid: false, message: "Email is too long." };
  if (!EMAIL_RE.test(value)) return { valid: false, message: "Enter a valid email address." };
  return { valid: true };
}

export function validateUsername(username: string): ValidationResult {
  const value = username.trim();
  if (!value) return { valid: false, message: "Username is required." };
  if (value.length < 3) return { valid: false, message: "Username must be at least 3 characters." };
  if (value.length > 30) return { valid: false, message: "Username must be under 30 characters." };
  if (!USERNAME_RE.test(value)) {
    return { valid: false, message: "Use only letters, numbers, dots, dashes or underscores." };
  }
  return { valid: true };
}

export function validatePassword(password: string, min = 8): ValidationResult {
  if (!password) return { valid: false, message: "Password is required." };
  if (password.length < min) {
    return { valid: false, message: `Password must be at least ${min} characters.` };
  }
  if (password.length > 128) return { valid: false, message: "Password is too long." };
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Include at least one lowercase letter." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Include at least one uppercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Include at least one number." };
  }
  return { valid: true };
}

export function validateName(value: string, label: string): ValidationResult {
  const cleaned = sanitizeSingleLine(value);
  if (!cleaned) return { valid: false, message: `${label} is required.` };
  if (cleaned.length < 2) return { valid: false, message: `${label} must be at least 2 characters.` };
  if (cleaned.length > 60) return { valid: false, message: `${label} is too long.` };
  return { valid: true };
}

export function validatePhone(phone: string): ValidationResult {
  const value = phone.trim();
  if (!value) return { valid: true }; // phone is optional
  if (!PHONE_RE.test(value)) {
    return { valid: false, message: "Enter a valid phone number (e.g. +250788123456)." };
  }
  return { valid: true };
}

export function validateRequiredPhone(phone: string): ValidationResult {
  const value = phone.trim();
  if (!value) return { valid: false, message: "Phone number is required." };
  return validatePhone(value);
}

export function validateNationalId(value: string): ValidationResult {
  const cleaned = value.replace(/\s+/g, "");
  if (!cleaned) return { valid: false, message: "National ID is required." };
  if (!RWANDA_NATIONAL_ID_RE.test(cleaned)) {
    return { valid: false, message: "Enter a valid 16-digit national ID." };
  }
  return { valid: true };
}

export function validateLoginIdentifier(value: string): ValidationResult {
  const cleaned = value.trim();
  if (!cleaned) {
    return { valid: false, message: "Email or phone number is required." };
  }
  return cleaned.includes("@") ? validateEmail(cleaned) : validatePhone(cleaned);
}

export function validateOtp(otp: string): ValidationResult {
  if (!/^[0-9]{6}$/.test(otp)) {
    return { valid: false, message: "Enter the 6-digit code." };
  }
  return { valid: true };
}

export function validateRequired(value: string, label: string): ValidationResult {
  if (!value.trim()) return { valid: false, message: `${label} is required.` };
  return { valid: true };
}

/**
 * Only allow safe http(s) URLs. Blocks javascript:, data:, vbscript: etc. that
 * could be abused for XSS if ever rendered as a link/image src.
 */
export function isSafeUrl(url: string): boolean {
  const value = url.trim();
  if (!value) return true; // empty is allowed (optional fields)
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateImageUrl(url: string): ValidationResult {
  if (!url.trim()) return { valid: true };
  if (!isSafeUrl(url)) {
    return { valid: false, message: "Enter a valid http(s) image URL." };
  }
  return { valid: true };
}

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very weak" | "Weak" | "Fair" | "Good" | "Strong";
  color: string;
};

/** Lightweight password-strength heuristic for the UI meter. */
export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const map: Record<number, Omit<PasswordStrength, "score">> = {
    0: { label: "Very weak", color: "#dc2626" },
    1: { label: "Weak", color: "#ef4444" },
    2: { label: "Fair", color: "#f59e0b" },
    3: { label: "Good", color: "#3b82f6" },
    4: { label: "Strong", color: "#16a34a" },
  };
  return { score: clamped, ...map[clamped] };
}
