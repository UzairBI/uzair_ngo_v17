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

/**
 * The stricter rule of the Get Involved forms: a number written with a leading + must have exactly 12 digits
 * (country code and number together, e.g. +91 98765 43210); any other number must have exactly 10 digits.
 * Spaces, dashes, dots and brackets between the digits are allowed.
 */
export function isValidPhoneStrict(v: string): boolean {
  const s = v.trim();
  if (!/^\+?[\d\s().-]+$/.test(s)) return false;
  return s.replace(/\D/g, "").length === (s.startsWith("+") ? 12 : 10);
}
export const PHONE_STRICT_MSG = "Enter a 10-digit mobile number (e.g. 98765 43210), or 12 digits with the country code if it starts with + (e.g. +91 98765 43210)";

export const EMAIL_MSG = "Enter a valid email address, e.g. name@example.com";
export const PHONE_MSG = "Enter a valid 10-digit mobile number (e.g. 98765 43210) or an international number starting with +";

/** Returns an error message, or "" when the value is fine. An empty optional value is fine. `strictPhone` = the 10 / 12 digit rule above. */
export function checkField(type: "email" | "tel", value: string, required?: boolean, strictPhone?: boolean): string {
  const v = value.trim();
  if (!v) return required ? (type === "email" ? "Email is required" : "Phone number is required") : "";
  if (type === "email") return isValidEmail(v) ? "" : EMAIL_MSG;
  if (strictPhone) return isValidPhoneStrict(v) ? "" : PHONE_STRICT_MSG;
  return isValidPhone(v) ? "" : PHONE_MSG;
}
