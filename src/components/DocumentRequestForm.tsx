import { checkField } from "../lib/validate";
import { FormEvent, useState } from "react";
import { legalIds } from "../data/site";
import { submitForm } from "../lib/forms";
import { useLang } from "../i18n/LangContext";

/** Options for "Certificate type". Built from the registrations listed in src/data/site.ts, plus two extras. */
const certificateTypes = [
  ...legalIds.map((l) => l.title),
  "Organisation profile (all registrations & tax details)",
  "Other certificate (describe in the message)"
];
const purposes = ["Donor due diligence", "CSR partner verification", "Government / regulatory requirement", "Bank / KYC", "Research / media", "Other"];
const deliveries = ["PDF by email", "Certified hard copy by post / courier"];

const field = "mt-1 w-full rounded-md border bg-white px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-sky/40";
const makeRef = () => `REQ-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export default function DocumentRequestForm() {
  const { t } = useLang();
  const [docType, setDocType] = useState(certificateTypes[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [delivery, setDelivery] = useState(deliveries[0]);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "mailto" | "error">("idle");
  const [ref, setRef] = useState("");
  const options = certificateTypes;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (fd.get("website")) return; // spam trap
    const reference = makeRef();
    const g = (k: string) => String(fd.get(k) ?? "").trim();
    const data: Record<string, string> = {
      reference, request_type: "Certificate", document_type: docType,
      delivery, delivery_address: delivery === deliveries[0] ? "" : g("delivery_address"),
      name: g("name"), organisation: g("organisation"), email: g("email"), phone: g("phone"), purpose: g("purpose"), message: g("message")
    };
    const found: Record<string, string> = {};
    const em = checkField("email", data.email, true), ph = checkField("tel", data.phone, true);
    if (em) found.email = em;
    if (ph) found.phone = ph;
    setErrors(found);
    if (em || ph) { form.querySelector<HTMLElement>(em ? "#dr-email" : "#dr-phone")?.focus(); return; }
    setState("sending");
    try {
      let finalRef = reference; // the server may issue a different number if this one is already taken
      const r = await submitForm(`Document request: ${data.request_type}`, data, { table: "document_requests", onSaved: (reply) => { if (reply.reference) finalRef = reply.reference; } });
      setRef(finalRef); setState(r);
      if (r === "sent") form.reset();
    } catch { setState("error"); }
  };

  if (state === "sent" || state === "mailto") {
    return (
      <div role="status" className="rounded-2xl border-2 border-brand bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl text-white">✓</div>
        <h3 className="mt-4 font-serif text-2xl font-bold text-brand-dark">{state === "sent" ? "Request submitted" : "Almost done"}</h3>
        <p className="mt-2 text-ink/75">{state === "sent"
          ? "Thank you. Our team will review your request and reply on the email or phone number you gave."
          : "Your email app should have opened with the request ready. Press Send there to finish."}</p>
        <p className="mt-4 text-sm text-ink/60">Your reference number</p>
        <p className="font-mono text-xl font-bold text-brand-dark">{ref}</p>
        <p className="mt-1 text-xs text-ink/60">Please quote it if you contact us about this request.</p>
        <button type="button" className="btn btn-brand mt-6" onClick={() => setState("idle")}>Make another request</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-6 md:p-8">
      <div>
        <label htmlFor="dr-doc" className="text-sm font-medium">{t("Certificate type")} *</label>
        <select id="dr-doc" value={docType} onChange={(e) => setDocType(e.target.value)} required className={field}>{options.map((o) => <option key={o}>{o}</option>)}</select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="dr-name" className="text-sm font-medium">{t("Full name")} *</label><input id="dr-name" name="name" required autoComplete="name" className={field} /></div>
        <div><label htmlFor="dr-org" className="text-sm font-medium">{t("Organisation")}</label><input id="dr-org" name="organisation" autoComplete="organization" className={field} placeholder="Company / foundation / bank (optional)" /></div>
        <div><label htmlFor="dr-email" className="text-sm font-medium">{t("Email")} *</label><input id="dr-email" name="email" type="email" required autoComplete="email" aria-invalid={!!errors.email} className={field} />{errors.email && <p className="mt-1 text-xs text-red-700">{errors.email}</p>}</div>
        <div><label htmlFor="dr-phone" className="text-sm font-medium">{t("Phone")} *</label><input id="dr-phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" aria-invalid={!!errors.phone} className={field} />{errors.phone && <p className="mt-1 text-xs text-red-700">{errors.phone}</p>}</div>
        <div><label htmlFor="dr-purpose" className="text-sm font-medium">{t("Purpose of request")} *</label><select id="dr-purpose" name="purpose" required className={field}>{purposes.map((p) => <option key={p}>{p}</option>)}</select></div>
        <div><label htmlFor="dr-delivery" className="text-sm font-medium">{t("Preferred delivery")}</label><select id="dr-delivery" value={delivery} onChange={(e) => setDelivery(e.target.value)} className={field}>{deliveries.map((d) => <option key={d}>{d}</option>)}</select></div>
      </div>
      {delivery !== deliveries[0] && (
        <div><label htmlFor="dr-addr" className="text-sm font-medium">{t("Postal address")} *</label><textarea id="dr-addr" name="delivery_address" required rows={2} className={field} /></div>
      )}
      <div><label htmlFor="dr-msg" className="text-sm font-medium">{t("Message")}</label><textarea id="dr-msg" name="message" rows={3} className={field} placeholder="Anything we should know, for example the exact document or deadline" /></div>

      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex items-start gap-2 text-xs text-ink/70">
        <input type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0" />
        <span>I agree that my details may be used only to process this request, as described in the DPDP Compliance Notice.</span>
      </label>
      <button className="btn btn-primary w-full !py-3.5 text-base disabled:opacity-60" type="submit" disabled={state === "sending"}>{state === "sending" ? "Submitting…" : t("Submit Request")}</button>
      <div role="status" aria-live="polite" className="text-sm">{state === "error" && <p className="text-red-700">Sorry, the request could not be sent. Please try again or write to us by email.</p>}</div>
    </form>
  );
}
