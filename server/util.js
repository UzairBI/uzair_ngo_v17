import { httpError } from "./http.js";
export const num = (v) => { const n = Number(v); if (!Number.isFinite(n)) throw httpError(400, "Invalid number"); return n; };
export const str = (v, max = 500) => { const s = String(v ?? "").trim(); return s ? s.slice(0, max) : null; };
export const need = (v, label, max) => { const s = str(v, max); if (!s) throw httpError(400, `${label} is required`); return s; };
export const oneOf = (v, list, label) => { if (!list.includes(v)) throw httpError(400, `Invalid ${label}`); return v; };
export const isDate = (v, label = "Date") => { if (!/^\d{4}-\d{2}-\d{2}$/.test(v || "") || isNaN(Date.parse(v))) throw httpError(400, `${label} must be YYYY-MM-DD`); return v; };
export const isEmail = (v) => !v || (v.length <= 160 && !v.includes("..") && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/.test(v));
export const id = (v) => { if (!/^\d+$/.test(String(v))) throw httpError(400, "Bad id"); return String(v); };
/** Indian mobile (optional +91 / 91 / 0 prefix) or international number with a leading + (8-15 digits). */
export const isPhone = (v) => {
  const s = String(v || "").trim();
  if (!/^\+?[\d\s().-]+$/.test(s)) return false;
  const d = s.replace(/\D/g, "");
  if (s.startsWith("+") && !s.startsWith("+91")) return d.length >= 8 && d.length <= 15;
  const n = d.startsWith("91") && d.length === 12 ? d.slice(2) : d.startsWith("0") && d.length === 11 ? d.slice(1) : d;
  return /^[6-9]\d{9}$/.test(n);
};
