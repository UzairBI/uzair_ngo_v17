import { useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { site } from "../data/site";

/** Same choices as the database accepts (supabase/migrations/20250130000000_member_organization_applications.sql) and the admin panel shows. */
export const ORG_TYPES = ["Trust", "Society", "Section 8 Company", "Other"];
export const FOCUS_AREAS = ["Healthcare", "Education", "Women Empowerment", "Child Welfare", "Community Development", "Environment", "Other"];

type Field = "name" | "type" | "reg" | "year" | "location" | "website" | "focus" | "description" | "contact" | "phone" | "email";
const FIELDS: Field[] = ["name", "type", "reg", "year", "location", "website", "focus", "description", "contact", "phone", "email"];
const EMPTY = { name: "", type: "", reg: "", year: "", location: "", website: "", description: "", contact: "", phone: "", email: "" };
type Form = typeof EMPTY;

/** "example.org" -> "https://example.org"; "" stays "". */
const fullUrl = (v: string) => { const s = v.trim(); return !s || /^https?:\/\//i.test(s) ? s : `https://${s}`; };

/** What is wrong with one field ("" = fine). The same checks run as the visitor leaves a field and again on submit. */
function check(field: Field, f: Form, focus: string[]): string {
  const v = field === "focus" ? "" : f[field].trim();
  switch (field) {
    case "name": return !v ? "Please enter the organization's name." : v.length < 2 ? "The name is too short." : "";
    case "type": return ORG_TYPES.includes(v) ? "" : "Please choose the type of organization.";
    case "reg": return !v ? "Please enter the registration number." : v.length < 2 ? "The registration number is too short." : "";
    case "year": {
      if (!v) return "";
      const y = Number(v);
      return /^\d{4}$/.test(v) && y >= 1800 && y <= new Date().getFullYear() ? "" : "Please enter a valid year, for example 2012.";
    }
    case "location": return !v ? "Please enter the city and state." : v.length < 2 ? "The location is too short." : "";
    case "website": return !v || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(fullUrl(v)) ? "" : "Please enter a valid website address, for example www.example.org.";
    case "focus": return focus.length ? "" : "Please tick at least one area of work.";
    case "description": return !v ? "Please describe what the organization does." : v.length < 20 ? "Please write at least 20 characters." : "";
    case "contact": return !v ? "Please enter the contact person's name." : v.length < 2 || !/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(v) ? "The name can contain only letters, spaces, dots and hyphens." : "";
    case "phone": {
      if (!v) return "Please enter a phone number.";
      const d = v.replace(/\D/g, "");
      return /^\+?[\d\s-]+$/.test(v) && d.length >= 10 && d.length <= 13 ? "" : "Please enter a valid phone number with at least 10 digits.";
    }
    case "email": return !v ? "Please enter an email address." : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? "" : "Please enter a valid email address.";
  }
}

const input = "w-full rounded-2xl border border-brand/15 bg-white px-5 py-3.5 text-[15px] text-ink outline-none transition placeholder:text-ink/40 focus:border-brand focus:ring-4 focus:ring-brand/15";
const label = "mb-1.5 block text-sm font-semibold text-ink";

/**
 * An organisation applies for membership. The application is saved as "pending"; it is listed on the page only after
 * an admin approves it (admin panel -> Member Organizations). Contact and registration details stay with the admins.
 */
export default function OrganizationApplyForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [focus, setFocus] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<"" | "ok" | "duplicate">("");

  // a field that is showing a problem is checked again as it is corrected
  const set = (k: keyof Form) => (e: { target: { value: string } }) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    if (errors[k]) setErrors((x) => ({ ...x, [k]: check(k, next, focus) }));
  };
  const blur = (k: Field) => () => setErrors((x) => ({ ...x, [k]: check(k, form, focus) }));
  const toggle = (a: string) => {
    const next = focus.includes(a) ? focus.filter((x) => x !== a) : [...focus, a];
    setFocus(next);
    if (errors.focus) setErrors((x) => ({ ...x, focus: check("focus", form, next) }));
  };
  const cls = (k: Field) => `${input}${errors[k] ? " !border-rose-500 focus:!ring-rose-500/15" : ""}`;
  const problem = (k: Field) => errors[k] ? <p id={`org-${k}-err`} role="alert" className="mt-1.5 text-xs font-medium text-rose-700">{errors[k]}</p> : null;
  const aria = (k: Field) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `org-${k}-err` : undefined });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const found = Object.fromEntries(FIELDS.map((k) => [k, check(k, form, focus)])) as Record<Field, string>;
    setErrors(found);
    const first = FIELDS.find((k) => found[k]);
    if (first) { setErr("Please correct the highlighted fields."); document.getElementById(`org-${first}`)?.focus(); return; }
    setErr("");
    if (!supabase) return setErr(`Applications cannot be sent from here right now. Please write to ${site.email}.`);
    setBusy(true);
    const { data, error } = await supabase.rpc("submit_member_organization", {
      p_name: form.name.trim(), p_location: form.location.trim(), p_description: form.description.trim(), p_org_type: form.type, p_registration_no: form.reg.trim(),
      p_contact_name: form.contact.trim(), p_contact_phone: form.phone.trim(), p_contact_email: form.email.trim(),
      p_focus_areas: focus, p_website: fullUrl(form.website) || null, p_year_founded: form.year.trim() ? Number(form.year) : null
    });
    setBusy(false);
    const status = (data as { status?: string } | null)?.status;
    if (error || !status) return setErr("The application could not be sent. Please check your connection and try again.");
    if (status === "rate_limited") return setErr("Too many applications were sent just now. Please try again in a few minutes.");
    if (status === "invalid") return setErr("Please check your details and try again.");
    setSent(status === "duplicate" ? "duplicate" : "ok"); setForm(EMPTY); setFocus([]); setErrors({});
  };

  if (sent) return (
    <div role="status" className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
      <p className="font-serif text-2xl font-bold text-emerald-900">{sent === "ok" ? "Application received" : "We already have your application"}</p>
      <p className="mx-auto mt-3 max-w-xl text-emerald-900/80">{sent === "ok"
        ? "Thank you. Our team will review your organization's details. Once approved, it is listed on this page among our member organizations."
        : "An application from this organization with the same email is already waiting for review. Our team will be in touch."}</p>
      <button type="button" onClick={() => setSent("")} className="mt-5 rounded-full border border-emerald-300 bg-white px-5 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100">Send another application</button>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="rounded-3xl border border-brand/10 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(11,79,156,.45)] sm:p-8">
      <h3 className="text-lg font-bold text-ink">About the organization</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={label} htmlFor="org-name">Organization name *</label><input id="org-name" className={cls("name")} maxLength={160} value={form.name} onChange={set("name")} onBlur={blur("name")} {...aria("name")} autoComplete="organization" />{problem("name")}</div>
        <div><label className={label} htmlFor="org-type">Type of organization *</label>
          <select id="org-type" className={cls("type")} value={form.type} onChange={set("type")} onBlur={blur("type")} {...aria("type")}><option value="">Select</option>{ORG_TYPES.map((x) => <option key={x}>{x}</option>)}</select>{problem("type")}</div>
        <div><label className={label} htmlFor="org-reg">Registration number *</label><input id="org-reg" className={cls("reg")} maxLength={60} value={form.reg} onChange={set("reg")} onBlur={blur("reg")} {...aria("reg")} />{problem("reg")}</div>
        <div><label className={label} htmlFor="org-location">City and state *</label><input id="org-location" className={cls("location")} maxLength={120} value={form.location} onChange={set("location")} onBlur={blur("location")} {...aria("location")} placeholder="e.g. Sagar, Madhya Pradesh" />{problem("location")}</div>
        <div><label className={label} htmlFor="org-year">Year founded</label><input id="org-year" className={cls("year")} inputMode="numeric" maxLength={4} value={form.year} onChange={set("year")} onBlur={blur("year")} {...aria("year")} placeholder="e.g. 2012" />{problem("year")}</div>
        <div className="sm:col-span-2"><label className={label} htmlFor="org-website">Website</label><input id="org-website" className={cls("website")} inputMode="url" maxLength={190} value={form.website} onChange={set("website")} onBlur={blur("website")} {...aria("website")} placeholder="www.example.org" autoComplete="url" />{problem("website")}</div>
        <fieldset className="sm:col-span-2" {...aria("focus")}>
          <legend className={label}>Areas of work * <span className="font-normal text-ink/55">(tick all that apply)</span></legend>
          <div className="flex flex-wrap gap-2">
            {FOCUS_AREAS.map((a, i) => (
              <label key={a} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition ${focus.includes(a) ? "border-brand bg-brand text-white" : "border-ink/15 bg-white text-ink/75 hover:border-brand/50 hover:bg-brand-light"}`}>
                <input id={i === 0 ? "org-focus" : undefined} type="checkbox" className="sr-only" checked={focus.includes(a)} onChange={() => toggle(a)} />{a}
              </label>
            ))}
          </div>
          {problem("focus")}
        </fieldset>
        <div className="sm:col-span-2"><label className={label} htmlFor="org-description">What the organization does *</label>
          <textarea id="org-description" rows={4} className={cls("description")} maxLength={600} value={form.description} onChange={set("description")} onBlur={blur("description")} {...aria("description")} placeholder="One or two lines. This is shown on your card once you are approved." />
          <p className="mt-1 text-right text-xs text-ink/45">{form.description.length} / 600</p>{problem("description")}</div>
      </div>

      <h3 className="mt-8 text-lg font-bold text-ink">Contact person</h3>
      <p className="mt-1 text-xs text-ink/55">Used by our team to reach you. These details and the registration number are never shown on the website.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={label} htmlFor="org-contact">Full name *</label><input id="org-contact" className={cls("contact")} maxLength={80} value={form.contact} onChange={set("contact")} onBlur={blur("contact")} {...aria("contact")} autoComplete="name" />{problem("contact")}</div>
        <div><label className={label} htmlFor="org-phone">Phone *</label><input id="org-phone" type="tel" inputMode="tel" className={cls("phone")} maxLength={18} value={form.phone} onChange={set("phone")} onBlur={blur("phone")} {...aria("phone")} placeholder="+91 98765 43210" autoComplete="tel" />{problem("phone")}</div>
        <div><label className={label} htmlFor="org-email">Email *</label><input id="org-email" type="email" inputMode="email" className={cls("email")} maxLength={120} value={form.email} onChange={set("email")} onBlur={blur("email")} {...aria("email")} placeholder="name@example.org" autoComplete="email" />{problem("email")}</div>
      </div>

      {err && (err !== "Please correct the highlighted fields." || FIELDS.some((k) => errors[k])) && <p role="alert" className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{err}</p>}
      {!supabaseConfigured && <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Applications cannot be sent from this copy of the website. Please write to {site.email}.</p>}
      <button type="submit" disabled={busy} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-dark to-brand px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/30 transition hover:brightness-110 disabled:opacity-70">{busy ? "Sending…" : "Apply for Membership"}</button>
    </form>
  );
}
