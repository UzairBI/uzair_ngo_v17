import { useState } from "react";
import { useLiveData, todayLocal, type EventItem } from "../hooks/useLiveData";
import { useTitle } from "../hooks/useTitle";
import { useLang } from "../i18n/LangContext";
import PageHero from "../components/PageHero";
import SmartForm from "../components/SmartForm";
import { fmtDate } from "./News";
import { site } from "../data/site";
import { useIsMobile } from "../hooks/useIsMobile";

const ics = (e: EventItem) => {
  const d = e.date.replace(/-/g, "");
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `UID:${e.id}@${site.shortName}`, `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${e.title}`, `LOCATION:${e.place}`, `DESCRIPTION:${e.text}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(body);
};

function Card({ e, past }: { e: EventItem; past?: boolean }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const d = new Date(e.date + "T00:00:00");
  const isMobile = useIsMobile();
  const hasImages = Boolean(e.images?.length);
  return (
    <article className={`rounded-2xl border bg-white shadow-sm ${hasImages ? "overflow-hidden sm:flex" : "flex flex-col gap-4 p-5 sm:gap-5"}`}>
      {hasImages && e.images && (
        <div className="relative order-first h-40 w-full flex-shrink-0 sm:order-none sm:h-auto sm:w-64">
          <img src={e.images[0]} alt={`${e.title} photo`} loading="lazy" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-4 p-5 sm:gap-5 sm:flex-1">
        <div className="flex gap-4 sm:flex-col">
          <div className="flex shrink-0 items-baseline gap-2 self-start rounded-xl bg-brand px-4 py-2 text-white sm:h-20 sm:w-20 sm:flex-col sm:items-center sm:justify-center sm:gap-0 sm:self-auto sm:p-0">
            <span className="text-2xl font-bold leading-none">{d.getDate()}</span>
            <span className="text-xs uppercase">{d.toLocaleDateString("en-IN", { month: "short" })} {d.getFullYear()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg font-bold">{e.title}</h3>
            <p className="mt-1 text-sm text-ink/60">{fmtDate(e.date)}{e.time ? ` · ${e.time}` : ""} · {e.place}</p>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-line text-sm text-ink/80">{e.text}</p>
          {hasImages && !isMobile && e.images && e.images.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">{e.images.slice(1).map((src) => <img key={src} src={src} alt={`${e.title} photo`} loading="lazy" className="h-24 w-[calc(50%-0.25rem)] rounded-lg object-cover sm:h-28 sm:w-32" />)}</div>
          )}
          {!past && (
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" className="btn btn-brand !px-4 !py-2" onClick={() => setOpen(!open)} aria-expanded={open}>{t("Register")}</button>
              <a className="btn border-2 border-brand !px-4 !py-2 text-brand" href={ics(e)} download={`${e.id}.ics`}>{t("Add to calendar")}</a>
            </div>
          )}
          {open && <SmartForm kind={`Event registration: ${e.title}`} hidden={{ event: e.title, date: e.date }} submitLabel="Register" className="mt-4"
            fields={[{ name: "name", label: "Full name", required: true, placeholder: "Your full name" }, { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "98765 43210" }, { name: "email", label: "Email", type: "email", placeholder: "you@example.com (optional)" }]} />}
        </div>
      </div>
    </article>
  );
}

export default function Events() {
  const { t } = useLang();
  const { events, loaded } = useLiveData();
  useTitle("Events Calendar");
  const today = todayLocal();
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter((e) => e.date >= today);
  const past = sorted.filter((e) => e.date < today).reverse();
  return (
    <>
      <PageHero eyebrow={t("Events")} title={t("Events Calendar")} text="Health camps, plantation drives, learning centre days and more." />
      <section className="container-site max-w-5xl py-16">
        <h2 className="h2">{t("Upcoming events")}</h2>
        <div className="mt-6 space-y-4">
          {upcoming.map((e) => <Card key={e.id} e={e} />)}
          {loaded && upcoming.length === 0 && <p className="rounded-2xl bg-brand-light p-6 text-ink/80">{t("No upcoming events yet. Verified drives will be listed here as soon as the dates are confirmed.")}</p>}
        </div>
        {past.length > 0 && (<><h2 className="h2 mt-14">{t("Past events")}</h2><div className="mt-6 space-y-4 opacity-80">{past.map((e) => <Card key={e.id} e={e} past />)}</div></>)}
      </section>
    </>
  );
}
