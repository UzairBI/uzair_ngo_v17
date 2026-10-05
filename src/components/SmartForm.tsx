import { FormEvent, useState } from "react";
import { submitForm } from "../lib/forms";
import { useLang } from "../i18n/LangContext";
import { checkField } from "../lib/validate";

export interface FieldDef { name: string; label: string; type?: "text" | "email" | "tel" | "textarea" | "select"; required?: boolean; options?: string[]; placeholder?: string }
interface Props { kind: string; fields: FieldDef[]; submitLabel: string; hidden?: Record<string, string>; className?: string; table?: string; onDone?: () => void }

/** Reusable form: validates, sends through src/lib/forms.ts, shows success / error. Includes a hidden spam trap. */
export default function SmartForm({ kind, fields, submitLabel, hidden = {}, className = "", table, onDone }: Props) {
  const { t } = useLang();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "mailto" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validate = (f: FieldDef, raw: string) => {
    const v = raw.trim();
    if (f.type === "email" || f.type === "tel") return checkField(f.type, v, f.required);
    if (f.required && !v) return `${f.label} is required`;
    if (f.name === "name" && v && v.length < 2) return "Please enter your full name";
    return "";
  };
  const setErr = (name: string, msg: string) => setErrors((prev) => { const n = { ...prev }; if (msg) n[name] = msg; else delete n[name]; return n; });
  const input = "mt-1 w-full rounded-md border bg-white px-3 py-2.5 focus:border-brand focus:outline-none";
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; // keep a reference: currentTarget is cleared after the first await
    const fd = new FormData(form);
    if (fd.get("website")) return; // bots fill the hidden field
    const data: Record<string, string> = { ...hidden };
    fields.forEach((f) => { data[f.name] = String(fd.get(f.name) ?? ""); });
    const found: Record<string, string> = {};
    fields.forEach((f) => { const m = validate(f, data[f.name]); if (m) found[f.name] = m; });
    setErrors(found);
    if (Object.keys(found).length) { form.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`)?.focus(); return; }
    setState("sending");
    try {
      const r = await submitForm(kind, data, table ? { table } : {});
      setState(r);
      if (r === "sent") { form.reset(); onDone?.(); }
    } catch { setState("error"); }
  };
  return (
    <form onSubmit={submit} noValidate className={`space-y-4 ${className}`}>
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`${kind}-${f.name}`} className="text-sm font-medium">{t(f.label)}{f.required && <span aria-hidden="true"> *</span>}</label>
          {f.type === "textarea" ? <textarea id={`${kind}-${f.name}`} name={f.name} required={f.required} rows={4} maxLength={2000} placeholder={f.placeholder} aria-invalid={!!errors[f.name]} aria-describedby={errors[f.name] ? `${kind}-${f.name}-err` : undefined} onBlur={(e) => setErr(f.name, validate(f, e.target.value))} className={input} />
            : f.type === "select" ? <select id={`${kind}-${f.name}`} name={f.name} required={f.required} className={input}>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
            : <input id={`${kind}-${f.name}`} name={f.name} type={f.type ?? "text"} required={f.required} placeholder={f.placeholder} autoComplete={f.type === "email" ? "email" : f.type === "tel" ? "tel" : undefined} inputMode={f.type === "tel" ? "tel" : undefined} aria-invalid={!!errors[f.name]} aria-describedby={errors[f.name] ? `${kind}-${f.name}-err` : undefined} maxLength={f.type === "email" ? 160 : 120} onBlur={(e) => setErr(f.name, validate(f, e.target.value))} className={input} />}
          {errors[f.name] && <p id={`${kind}-${f.name}-err`} className="mt-1 text-xs text-red-700">{errors[f.name]}</p>}
        </div>
      ))}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <button className="btn btn-brand w-full disabled:opacity-60 sm:w-auto" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : t(submitLabel)}</button>
      <div role="status" aria-live="polite" className="text-sm">
        {state === "sent" && <p className="text-green-700">Thank you! Your message has been sent. We will get back to you soon.</p>}
        {state === "mailto" && <p className="text-green-700">Your email app should open with the message ready. Press Send there to finish.</p>}
        {state === "error" && <p className="text-red-700">Sorry, something went wrong. Please try again or call us.</p>}
      </div>
    </form>
  );
}
