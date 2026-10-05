/** Shared email / phone validation for every form on the site. */
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export function isValidEmail(v: string): boolean {
  const s = v.trim();
  return s.length <= 160 && !s.includes("..") && EMAIL_RE.test(s);
}

/** Indian mobile (10 digits starting 6-9, optional +91 / 91 / 0 prefix) or international number written with a leading + (8-15 digits). */
export function isValidPhone(v: string): boolean {
  const s = v.trim();
  if (!/^\+?[\d\s().-]+$/.test(s)) return false;
  const digits = s.replace(/\D/g, "");
  if (s.startsWith("+") && !s.startsWith("+91")) return digits.length >= 8 && digits.length <= 15;
  const national = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits.startsWith("0") && digits.length === 11 ? digits.slice(1) : digits;
  return /^[6-9]\d{9}$/.test(national);
}

export const EMAIL_MSG = "Enter a valid email address, e.g. name@example.com";
export const PHONE_MSG = "Enter a valid 10-digit mobile number (e.g. 98765 43210) or an international number starting with +";

/** Returns an error message, or "" when the value is fine. An empty optional value is fine. */
export function checkField(type: "email" | "tel", value: string, required?: boolean): string {
  const v = value.trim();
  if (!v) return required ? (type === "email" ? "Email is required" : "Phone number is required") : "";
  if (type === "email") return isValidEmail(v) ? "" : EMAIL_MSG;
  return isValidPhone(v) ? "" : PHONE_MSG;
}
