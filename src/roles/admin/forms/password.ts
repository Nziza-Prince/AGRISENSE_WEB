const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGIT = "23456789";
// The API only accepts these special characters.
const SPECIAL = "@$!%*?&";

const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];

/** A strong password that always passes the API rule: upper, lower, digit and one of @$!%*?&. */
export function generatePassword(length = 14): string {
  const chars = [pick(UPPER), pick(LOWER), pick(DIGIT), pick(SPECIAL)];
  const all = UPPER + LOWER + DIGIT + SPECIAL;
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export function passwordStrength(value: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!value) return { score: 0, label: "" };
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[@$!%*?&]/.test(value) && value.length >= 12) score++;
  const s = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  return { score: s, label: ["Too weak", "Weak", "Okay", "Good", "Strong"][s] };
}
