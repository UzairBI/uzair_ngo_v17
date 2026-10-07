import { statFromText, type Stat } from "../data/content";
import { keyFigureDefaults } from "../data/pageContent";
import { useLiveData } from "../hooks/useLiveData";
import { useSavedPageText } from "../hooks/usePageText";
import { useLang } from "../i18n/LangContext";
import Reveal from "./Reveal";
import CountUp from "./CountUp";

/**
 * The two impact blocks shared by the Home page and the Impact Report page, so both always show the same numbers.
 */

/** Icon + colour for a figure, picked from its label. */
const statLook = (label: string) => {
  const l = label.toLowerCase();
  const svg = (c: JSX.Element) => c;
  if (/direct|benefic/.test(l)) return { tone: "from-sky-500 to-blue-600", icon: svg(<><circle cx="9" cy="8" r="3" /><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" /><path d="M16 5.2a3 3 0 010 5.6M17.5 14.3c2 .6 3.5 2.3 3.5 4.7" /></>) };
  if (/child|educat/.test(l)) return { tone: "from-indigo-500 to-blue-600", icon: svg(<><path d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5z" /><path d="M6.5 11.5V16c1.5 1.4 3.4 2 5.5 2s4-.6 5.5-2v-4.5" /></>) };
  if (/patient|health/.test(l)) return { tone: "from-rose-500 to-pink-600", icon: svg(<path d="M12 20s-7-4.4-7-9.6A4 4 0 0112 8a4 4 0 017 2.4C19 15.6 12 20 12 20z" />) };
  if (/women|shg|livelihood/.test(l)) return { tone: "from-amber-500 to-orange-600", icon: svg(<><circle cx="12" cy="7" r="3" /><path d="M12 10v6M8.5 13h7M9 21l3-5 3 5" /></>) };
  if (/environ|tree|green/.test(l)) return { tone: "from-emerald-500 to-green-600", icon: svg(<><path d="M12 21v-7" /><path d="M12 14c-4 0-6-3-6-6 4 0 6 2 6 6zM12 12c0-4 2-7 6-7 0 4-2 7-6 7z" /></>) };
  return { tone: "from-teal-500 to-cyan-600", icon: svg(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>) };
};

function StatCard({ s, i, n }: { s: Stat; i: number; n: number }) {
  const { t } = useLang();
  const saved = useSavedPageText();
  // icon and colour follow the original label, so rewording a box in the admin panel keeps its icon
  const { tone, icon } = statLook(s.label);
  const label = saved[`home.impact.${i + 1}.label`] ?? t(s.label);
  // "+ patients" -> keep the "+" with the number and show the word as a small unit beside it
  const m = (s.suffix ?? "").match(/^(\+?)\s*(.*)$/);
  const unit = m?.[2] ?? "";
  const num: Stat = unit ? { ...s, suffix: m?.[1] ?? "" } : s;
  return (
    <div className="impact-card group relative flex h-full cursor-pointer flex-col items-center" tabIndex={0}>
      {/* the chain: a rail through every node (desktop), starting and ending at the first / last node */}
      <span aria-hidden="true" className="absolute top-6 hidden h-0.5 bg-gradient-to-r from-brand/60 to-sky-400/60 lg:block" style={{ left: i === 0 ? "50%" : 0, right: i === n - 1 ? "50%" : 0 }} />
      <span aria-hidden="true" className="relative z-10 flex h-12 w-12 items-center justify-center">
        <span className={`absolute inset-0 rounded-full bg-gradient-to-br ${tone} opacity-30 animate-ping [animation-duration:2.8s]`} style={{ animationDelay: `${i * 0.35}s` }} />
        <span className={`relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${tone} text-white shadow-lg ring-4 ring-white transition duration-300 group-hover:scale-110`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
        </span>
      </span>
      <span aria-hidden="true" className="h-4 w-px bg-brand/30" />
      <div className="relative w-full flex-1 rounded-xl border lg:w-[calc(100%-1rem)] border-ink/10 bg-white px-3 py-4 text-center shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-focus-visible:-translate-y-1 group-focus-visible:shadow-lg">
        <p className="flex flex-wrap items-baseline justify-center gap-x-1 font-bold tabular-nums leading-none text-ink">
          <span className="text-2xl sm:text-[1.7rem]"><CountUp stat={num} /></span>
          {unit && <span className="text-xs font-semibold text-brand-dark">{t(unit)}</span>}
        </p>
        <p className="mt-2 text-[13px] leading-snug text-ink/60">{label}</p>
      </div>
    </div>
  );
}

/** Live impact dashboard: heading + one card per figure in public/data/live.json. Goes inside a section of its own. */
export function ImpactDashboard() {
  const { t } = useLang();
  const { stats } = useLiveData();
  return (
    <div className="container-site">
      <Reveal>
        <p className="eyebrow">{t("Live impact dashboard")}</p>
        <h2 className="h2 mt-2 max-w-2xl">{t("A quick view of the people, communities and green spaces moving forward.")}</h2>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
          <span aria-hidden="true" className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          {t("Field reports active")}
        </p>
      </Reveal>
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-6 lg:gap-x-0 lg:px-0">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 90}>
            <StatCard s={s} i={i} n={stats.length} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/** Icon and colour of each key figure, in the order of keyFigureDefaults() in src/data/pageContent.ts. */
const figureLook = [
  { tone: "bg-[#e8f1fd] text-[#1d4ed8]", icon: <><circle cx="9" cy="8" r="3" /><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" /><path d="M16 5.2a3 3 0 010 5.6M17.5 14.3c2 .6 3.5 2.3 3.5 4.7" /></> },
  { tone: "bg-[#e3f6ee] text-[#059669]", icon: <><path d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5z" /><path d="M6.5 11.5V16c1.5 1.4 3.4 2 5.5 2s4-.6 5.5-2v-4.5" /><path d="M21.5 9.5V14" /></> },
  { tone: "bg-[#fdf3dc] text-[#d97706]", icon: <><path d="M4 21V10l8-5 8 5v11" /><path d="M2.5 21h19" /><path d="M9 21v-5h6v5M9 12h1.5M13.5 12H15" /></> },
  { tone: "bg-[#fde8ec] text-[#e11d48]", icon: <path d="M12 20s-7-4.4-7-9.6A4 4 0 0112 8a4 4 0 017 2.4C19 15.6 12 20 12 20z" /> }
];

/**
 * White card with four key figures. Each number and its wording can be changed in the admin panel
 * (Website Pages -> Home: Impact Numbers). Until then they come from the site's own data; "Children Supported"
 * follows the children figure of the impact dashboard.
 */
export function KeyFigures() {
  const { t } = useLang();
  const saved = useSavedPageText();
  const { stats } = useLiveData();
  const children = stats.find((x) => /children/i.test(x.label));
  const founderFigures = keyFigureDefaults().map(([label, original], i) => {
    const text = saved[`home.figures.${i + 1}.value`] ?? (i === 1 && children?.value !== undefined ? `${children.value.toLocaleString("en-IN")}+` : original);
    return { ...figureLook[i], key: label, label: saved[`home.figures.${i + 1}.label`] ?? t(label), stat: statFromText(text, { label }) };
  });
  return (
    <Reveal delay={160}>
      <dl className="mt-12 grid grid-cols-2 gap-y-8 rounded-3xl bg-white px-4 py-7 shadow-[0_20px_50px_-28px_rgba(11,61,122,.35)] ring-1 ring-ink/5 sm:px-8 lg:mt-14 lg:grid-cols-4 lg:py-9">
        {founderFigures.map((f, i) => (
          <div key={f.key} className={`flex items-center gap-4 px-2 sm:px-6 lg:justify-center ${i % 2 ? "border-l border-ink/10" : ""} ${i === 2 ? "lg:border-l lg:border-ink/10" : ""}`}>
            <span aria-hidden="true" className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full sm:h-[72px] sm:w-[72px] ${f.tone}`}>
              <svg viewBox="0 0 24 24" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
            </span>
            <div className="flex flex-col-reverse">
              <dt className="max-w-[9rem] text-sm leading-snug text-ink/60 sm:text-base">{f.label}</dt>
              {/* counts up from 0 when the card scrolls into view; tabular figures keep the width steady while it runs */}
              <dd className="font-[Merriweather,Georgia,serif] text-2xl font-bold tabular-nums text-ink sm:text-[1.9rem]"><CountUp stat={f.stat} /></dd>
            </div>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}
