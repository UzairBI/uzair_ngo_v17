import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { site, societyReg, darpanId, reg12A, reg80G, fcraReg } from "../data/site";
import { subscribeNewsletter, type NewsletterResult } from "../lib/forms";
import { useLang } from "../i18n/LangContext";
import { quickNav } from "../data/navigation";
import { API_BASE } from "../hooks/useLiveData";
import { checkField } from "../lib/validate";
import SocialIcons from "./SocialIcons";

export default function Footer() {
  const [email, setEmail] = useState("");
  const { t } = useLang();
  const [emailErr, setEmailErr] = useState("");
  const [state, setState] = useState<"idle" | "sending" | NewsletterResult | "error">("idle");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const m = checkField("email", email, true);
    setEmailErr(m);
    if (m) return;
    setState("sending");
    try { const r = await subscribeNewsletter(email); setState(r); if (r === "sent") setEmail(""); } catch { setState("error"); }
  };
  return (
    <footer className="bg-ink text-sm text-white/80">
      {/* on large screens all four columns are the same height and the last item of each (Donate Now, the social icons, the fax line, Subscribe) sits on the same line */}
      <div className="container-site grid gap-10 py-12 sm:grid-cols-2 md:py-14 lg:grid-cols-4">
        <div className="flex flex-col">
          <Link to="/" aria-label={`${site.name} home`} className="inline-block self-start rounded-2xl bg-white px-4 py-3 shadow-lg shadow-black/20 transition hover:scale-[1.03]">
            <img src="/assets/images/logo.png" alt={`${site.name} logo`} className="h-14 w-auto max-w-[230px] object-contain" />
          </Link>
          <p className="mt-3 text-xs">{site.name} · {site.location} · {site.regLine}</p>
          <p className="mt-4 text-xs">Society Reg: {societyReg}</p>
          <p className="text-xs">Darpan ID: {darpanId}</p>
          <p className="text-xs">12A: {reg12A.value} · 80G: {reg80G.value}</p>
          <p className="text-xs">FCRA: {fcraReg.value}</p>
          <p className="text-xs"><Link to="/transparency?request=certificate#request" className="underline hover:text-white">Request registration certificates</Link></p>
          <SocialIcons className="mt-5 lg:mt-auto lg:pt-5" />
        </div>
        <div className="flex flex-col">
          <h3 className="mb-3 font-semibold text-white">{t("Quick Navigation")}</h3>
          <ul className="space-y-2 lg:flex lg:flex-1 lg:flex-col lg:justify-between">{quickNav.map((l) => <li key={l.href}><Link to={l.href} className="hover:text-white">{t(l.label)}</Link></li>)}</ul>
        </div>
        <div className="flex flex-col">
          <h3 className="mb-3 font-semibold text-white">{t("Field Office & Contact")}</h3>
          {/* the spare height is shared equally between the four blocks, so the last one still ends on the bottom line */}
          <div className="flex flex-1 flex-col gap-2 lg:justify-between">
            <p>{site.address}</p>
            <div>
              <p><a href={site.phoneHref} className="hover:text-white">Phone: {site.phone}</a></p>
              <p><a href={`mailto:${site.email}`} className="hover:text-white">Email: {site.email}</a></p>
            </div>
            <p>Office Hours: {site.officeHours}</p>
            <p>Chairman: {site.chairman} · Fax: {site.fax}</p>
          </div>
        </div>
        <div className="flex flex-col">
          <h3 className="mb-3 font-semibold text-white">{t("Field Updates Newsletter")}</h3>
          <p>Receive monthly impact reports, field stories, and upcoming drive announcements.</p>
          <form onSubmit={submit} noValidate className="mt-3 flex flex-1 flex-col gap-2">
            <label htmlFor="nl-email" className="text-xs">Email</label>
            <input id="nl-email" type="email" required value={email} onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(""); }} aria-invalid={!!emailErr || state === "invalid"} aria-describedby={emailErr ? "nl-email-err" : undefined} autoComplete="email" placeholder="you@example.com"
              className="w-full rounded-md bg-white/10 px-3 py-2.5 text-white placeholder-white/50" />
            {emailErr && <p id="nl-email-err" className="text-xs text-red-300">{emailErr}</p>}
            <button className="btn btn-primary w-full disabled:opacity-60 lg:mt-auto" type="submit" disabled={state === "sending"}>{state === "sending" ? "Subscribing..." : t("Subscribe to Updates")}</button>
            <div role="status" aria-live="polite" className="text-xs empty:hidden">
              {state === "sent" && <p className="text-green-300">Thank you for subscribing to our updates!</p>}
              {state === "already" && <p className="text-green-300">You are already subscribed to our updates.</p>}
              {state === "mailto" && <p className="text-green-300">Your email app should open. Press Send to finish.</p>}
              {state === "invalid" && <p className="text-red-300">Please enter a valid email address.</p>}
              {state === "limited" && <p className="text-red-300">Too many attempts. Please try again in a few minutes.</p>}
              {state === "error" && <p className="text-red-300">Something went wrong. Please try again.</p>}
            </div>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-3 pb-24 pt-4 text-center text-xs md:flex-row md:pb-4 md:pr-24 md:text-left 2xl:pr-6">
          <a href={site.googleBusiness} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-brand-dark shadow transition hover:bg-brand-light md:order-last">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-red-500" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
            Find us on Google
          </a>
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms of Use</Link>
            <Link to="/dpdp" className="hover:text-white">DPDP Compliance Notice</Link>
            <a href={`${API_BASE}/admin`} rel="nofollow" className="hover:text-white">Admin</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
