import { site } from "../data/site";
import { useTitle } from "../hooks/useTitle";
import { usePageText } from "../hooks/usePageText";
import { useLang } from "../i18n/LangContext";
import PageHero from "../components/PageHero";
import { contactImages } from "../data/slideshows";
import SmartForm from "../components/SmartForm";
import WorkMap from "../components/WorkMap";
import Reveal from "../components/Reveal";
import type { ReactNode } from "react";

const card = "group h-full rounded-2xl border border-ink/10 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-[0_14px_30px_-16px_rgba(11,79,156,.45)]";
const tile = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand transition duration-200 group-hover:scale-110 group-hover:bg-brand group-hover:text-white";
const chip = "rounded-full bg-brand-light px-3 py-1 text-sm font-semibold text-brand-dark transition hover:bg-brand hover:text-white";
const svg = (d: ReactNode) => <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
/** Is the office open right now? Hours as in site.officeHours: Monday to Saturday, 9:00 AM - 6:00 PM, India time. */
function officeOpen() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return now.getDay() !== 0 && now.getHours() >= 9 && now.getHours() < 18;
}
export default function Contact() {
  const { t } = useLang();
  const c = usePageText();
  useTitle("Contact Us");
  const open = officeOpen();
  return (
    <>
      <PageHero compact images={contactImages} eyebrow={t("Contact Us")} title={c("contact.hero.title")} />
      <section className="container-site py-12 md:py-16 lg:pt-4">
        <Reveal><h2 className="h2">{c("contact.title")}</h2></Reveal>
        {/* the form box starts level with the office cards and, on large screens, ends level with the office hours card */}
        <div className="mt-5 grid gap-10 md:grid-cols-2">
        <div className="min-w-0">
          {/* the two offices */}
          <div className="grid gap-3 sm:grid-cols-2">
            {[{ label: "Head office", text: site.address, icon: <><path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></> },
              { label: "Registered office", text: site.registeredOffice, icon: <><path d="M4 21V9l8-5 8 5v12" /><path d="M2.5 21h19M9.5 21v-5h5v5" /></> }].map((o, i) => (
              <Reveal key={o.label} delay={80 + i * 80}>
                <div className={card}>
                  <span aria-hidden="true" className={tile}>{svg(o.icon)}</span>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-ink/60">{o.label}</p>
                  <p className="mt-1 text-sm leading-relaxed">{o.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* phone, email, hours */}
          <div className="mt-3 space-y-3">
            <Reveal delay={240}>
              <div className={`${card} flex items-start gap-4`}>
                <span aria-hidden="true" className={tile}>{svg(<path d="M6.5 3h3l1.5 4.5-2 1.5a12 12 0 006 6l1.5-2 4.5 1.5v3a2 2 0 01-2 2A16 16 0 014.5 5a2 2 0 012-2z" />)}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink/60">Phone</p>
                  <p className="mt-2 flex flex-wrap gap-2">
                    <a className={chip} href={site.phoneHref}>{site.phone}</a>
                    {site.altPhones.map((p) => <a key={p.href} className={chip} href={p.href}>{p.label}</a>)}
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className={`${card} flex items-start gap-4`}>
                <span aria-hidden="true" className={tile}>{svg(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3.5 7.5l8.5 6 8.5-6" /></>)}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink/60">Email</p>
                  <p className="mt-1"><a className="break-all font-semibold text-brand hover:text-brand-dark hover:underline" href={`mailto:${site.email}`}>{site.email}</a></p>
                  <p className="mt-0.5 text-sm text-ink/70">Alternate: {site.altEmails.map((e, i) => <span key={e}>{i > 0 && " · "}<a className="break-all text-brand hover:underline" href={`mailto:${e}`}>{e}</a></span>)}</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={400}>
              <div className={`${card} flex items-start gap-4`}>
                <span aria-hidden="true" className={tile}>{svg(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>)}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-widest text-ink/60">Office Hours
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] normal-case tracking-normal ${open ? "bg-green-100 text-green-800" : "bg-slate-100 text-ink/70"}`}>
                      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${open ? "bg-green-500 motion-safe:animate-pulse" : "bg-slate-400"}`} />{open ? "Open now" : "Closed now"}
                    </span>
                  </p>
                  <p className="mt-1">{site.officeHours}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
        <SmartForm dense kind="Contact message" submitLabel="Send Message" className="rounded-2xl border p-5 sm:p-6 md:self-start lg:grid-rows-[auto_auto_1fr_auto] lg:self-stretch lg:p-4"
          fields={[{ name: "name", label: "Name", required: true, placeholder: "Your full name" }, { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
            { name: "phone", label: "Phone", type: "tel", placeholder: "98765 43210 (optional)" }, { name: "message", label: "Message", type: "textarea", required: true, placeholder: "How can we help you?" }]} />
        </div>
      </section>
      <section className="container-site pb-16"><WorkMap /></section>
    </>
  );
}
