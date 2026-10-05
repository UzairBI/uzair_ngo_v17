import { site } from "../data/site";
import { API_BASE } from "../hooks/useLiveData";
import { supabase, supabaseConfigured } from "./supabase";

export type SubmitResult = "sent" | "mailto";
interface Opts {
  /** Stores the submission in the local database through the site's own server ("document_requests" or "volunteers"). */
  table?: string;
  /** Called with the server's reply when the row was saved (document requests return the final reference number). */
  onSaved?: (reply: { reference?: string }) => void;
}

const ENDPOINTS: Record<string, string> = { document_requests: "/api/public/document-requests", volunteers: "/api/public/volunteers" };
const KIND_TO_KIND: Record<string, string> = { "Contact message": "contact", "Newsletter subscription": "newsletter", "CSR enquiry": "csr" };

/** Returns the server reply when saved, null when the server is not reachable (so the email fallback can take over). Throws when the server rejects the data. */
async function saveToServer(path: string, data: Record<string, string>): Promise<{ reference?: string } | null> {
  let res: Response;
  try {
    res = await fetch(API_BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  } catch { return null; }
  if (res.ok) return res.json().catch(() => ({}));
  if (res.status === 400 || res.status === 415 || res.status === 429) throw new Error("Rejected");
  return null; // 404 / 5xx: server missing or failing
}

/** Saves straight to Supabase via SECURITY DEFINER RPC functions (see supabase/migrations). Returns null on any failure so the email fallback can take over. */
async function saveToSupabase(kind: string, opts: Opts, data: Record<string, string>): Promise<{ reference?: string } | null> {
  if (!supabaseConfigured || !supabase) return null;
  try {
    if (opts.table === "volunteers") {
      const { error } = await supabase.rpc("submit_volunteer", { p_name: data.name, p_phone: data.phone, p_email: data.email || null, p_area: data.area || null, p_message: data.message || null });
      return error ? null : {};
    }
    if (opts.table === "document_requests") {
      const { data: ref, error } = await supabase.rpc("submit_document_request", {
        p_request_type: data.request_type, p_document_type: data.document_type, p_name: data.name, p_email: data.email, p_phone: data.phone, p_purpose: data.purpose,
        p_financial_year: data.financial_year || null, p_delivery: data.delivery || null, p_delivery_address: data.delivery_address || null,
        p_organisation: data.organisation || null, p_message: data.message || null
      });
      return error ? null : { reference: (ref as unknown as string) || undefined };
    }
    const formKind = KIND_TO_KIND[kind] || (kind.startsWith("Event registration") ? "event_registration" : null);
    if (!formKind) return null;
    const { error } = await supabase.rpc("submit_form", {
      p_kind: formKind, p_name: data.name || null, p_email: data.email || null, p_phone: data.phone || null,
      p_organisation: data.company || data.organisation || null, p_message: data.message || null,
      p_data: data.event || data.date ? { event: data.event, date: data.date } : {}
    });
    return error ? null : {};
  } catch { return null; }
}

export type NewsletterResult = SubmitResult | "already" | "invalid" | "limited";
const isEmail = (v: string) => v.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

/**
 * Footer newsletter sign-up. The email goes to the `subscribe_newsletter` database function (see supabase/migrations),
 * which stores it once in `newsletter_subscribers`: "already" = that email is subscribed, "limited" = too many attempts.
 * Throws when the database fails. Without Supabase (or before that migration is run) it is sent like any other form.
 */
export async function subscribeNewsletter(email: string): Promise<NewsletterResult> {
  const value = email.trim().toLowerCase();
  if (!isEmail(value)) return "invalid";
  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc("subscribe_newsletter", { p_email: value, p_source: "website-footer" });
    if (!error) {
      if (data === "subscribed" || data === "resubscribed") return "sent";
      if (data === "already" || data === "invalid") return data;
      if (data === "rate_limited") return "limited";
      throw new Error("Unexpected reply");
    }
    if (error.code !== "PGRST202") throw new Error("Subscription failed"); // PGRST202 = the function does not exist yet
  }
  return submitForm("Newsletter subscription", { email: value });
}

/**
 * Sends a form. What happens, in order:
 *  1. DATABASE  - the site's own server (POST /api/public/...) if it's running, then Supabase (RPC functions) if configured.
 *  2. EMAIL     - Web3Forms (VITE_WEB3FORMS_KEY) or any JSON endpoint such as Formspree (VITE_FORM_ENDPOINT).
 *                 If the database saved the row, a failed email is ignored; otherwise the email must succeed.
 *  3. FALLBACK  - with nothing configured, the visitor's email app opens, addressed to the Samiti.
 */
export async function submitForm(kind: string, data: Record<string, string>, opts: Opts = {}): Promise<SubmitResult> {
  const key = import.meta.env.VITE_WEB3FORMS_KEY;
  const endpoint = import.meta.env.VITE_FORM_ENDPOINT;
  const subject = `[${site.shortName} website] ${kind}`;
  let saved = false;

  const path = opts.table ? ENDPOINTS[opts.table] : undefined;
  if (path) {
    const reply = await saveToServer(path, data);
    if (reply) { saved = true; opts.onSaved?.(reply); }
  }
  if (!saved) {
    const reply = await saveToSupabase(kind, opts, data);
    if (reply) { saved = true; opts.onSaved?.(reply); }
  }

  const sendEmail = async (): Promise<boolean> => {
    if (key) {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: key, subject, from_name: data.name || site.shortName, ...data })
      });
      if (!res.ok) throw new Error("Form service error");
      return true;
    }
    if (endpoint) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ _subject: subject, form: kind, ...data })
      });
      if (!res.ok) throw new Error("Form service error");
      return true;
    }
    return false;
  };

  if (saved) { try { await sendEmail(); } catch { /* the database already has it */ } return "sent"; }
  if (await sendEmail()) return "sent";

  const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n");
  window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return "mailto";
}
