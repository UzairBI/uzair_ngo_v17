import { projects } from "../data/content";
import { portfolio } from "../data/portfolio";
import { useLiveData } from "../hooks/useLiveData";
import { useLang } from "../i18n/LangContext";
import Reveal from "./Reveal";
import CountUp from "./CountUp";

/**
 * The two impact blocks shared by the Home page and the Impact Report page, so both always show the same numbers.
 */

/** Live impact dashboard: heading + one card per figure in public/data/live.json. Goes inside a section of its own. */
export function ImpactDashboard() {
  const { t } = useLang();
  const { stats } = useLiveData();
  return (
    <div className="container-site">
      <Reveal>
        <p className="eyebrow">{t("Live impact dashboard")}</p>
        <h2 className="h2 mt-2 max-w-2xl">{t("A quick view of the people, communities and green spaces moving forward.")}</h2>
        <p className="mt-2 text-xs font-semibold text-brand-dark">● {t("Field reports active")}</p>
      </Reveal>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 90}>
            <div tabIndex={0} className="impact-card group relative h-full cursor-pointer rounded-2xl bg-white p-4 shadow-sm ring-1 ring-transparent sm:p-5">
              <p className="text-xs text-ink/50 transition-colors group-hover:text-brand">0{i + 1}</p>
              <p className="mt-1 text-lg font-bold leading-snug text-brand-dark sm:text-xl"><CountUp stat={s} /></p>
              <p className="mt-0.5 text-left text-[13px] leading-snug text-ink/70 sm:text-sm">{t(s.label)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/** White card with four key figures. All taken from the site's own data (nothing typed in by hand here). */
export function KeyFigures() {
  const { t } = useLang();
  const { stats } = useLiveData();
  const children = stats.find((x) => /children/i.test(x.label));
  const years = new Date().getFullYear() - 2004; // registered 19 October 2004 (site.regDate)
  const founderFigures = [
    { value: Math.floor(years / 5) * 5, suffix: "+", label: "Years of Service", tone: "bg-[#e8f1fd] text-[#1d4ed8]", icon: <><circle cx="9" cy="8" r="3" /><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" /><path d="M16 5.2a3 3 0 010 5.6M17.5 14.3c2 .6 3.5 2.3 3.5 4.7" /></> },
    { value: children?.value, suffix: "+", label: "Children Supported", tone: "bg-[#e3f6ee] text-[#059669]", icon: <><path d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5z" /><path d="M6.5 11.5V16c1.5 1.4 3.4 2 5.5 2s4-.6 5.5-2v-4.5" /><path d="M21.5 9.5V14" /></> },
    { value: portfolio.length, suffix: "", label: "Projects Delivered", tone: "bg-[#fdf3dc] text-[#d97706]", icon: <><path d="M4 21V10l8-5 8 5v11" /><path d="M2.5 21h19" /><path d="M9 21v-5h6v5M9 12h1.5M13.5 12H15" /></> },
    { value: projects.filter((p) => !p.featured).length, suffix: "", label: "Core Programmes", tone: "bg-[#fde8ec] text-[#e11d48]", icon: <path d="M12 20s-7-4.4-7-9.6A4 4 0 0112 8a4 4 0 017 2.4C19 15.6 12 20 12 20z" /> }
  ];
  return (
    <Reveal delay={160}>
      <dl className="mt-12 grid grid-cols-2 gap-y-8 rounded-3xl bg-white px-4 py-7 shadow-[0_20px_50px_-28px_rgba(11,61,122,.35)] ring-1 ring-ink/5 sm:px-8 lg:mt-14 lg:grid-cols-4 lg:py-9">
        {founderFigures.map((f, i) => (
          <div key={f.label} className={`flex items-center gap-4 px-2 sm:px-6 lg:justify-center ${i % 2 ? "border-l border-ink/10" : ""} ${i === 2 ? "lg:border-l lg:border-ink/10" : ""}`}>
            <span aria-hidden="true" className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full sm:h-[72px] sm:w-[72px] ${f.tone}`}>
              <svg viewBox="0 0 24 24" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
            </span>
            <div className="flex flex-col-reverse">
              <dt className="max-w-[9rem] text-sm leading-snug text-ink/60 sm:text-base">{t(f.label)}</dt>
              {/* counts up from 0 when the card scrolls into view; tabular figures keep the width steady while it runs */}
              <dd className="font-[Merriweather,Georgia,serif] text-2xl font-bold tabular-nums text-ink sm:text-[1.9rem]">{f.value ? <CountUp stat={{ label: f.label, value: f.value, suffix: f.suffix }} /> : "—"}</dd>
            </div>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}
