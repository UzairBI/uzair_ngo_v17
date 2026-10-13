import { useInView } from "../hooks/useInView";
import type { Campaign } from "../hooks/useLiveData";
import { useLang } from "../i18n/LangContext";
import DonateButton from "./DonateButton";
const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

/** Icon and colour of a campaign, picked from its cause or title. */
const look = (c: Campaign) => {
  const l = `${c.cause ?? ""} ${c.title}`.toLowerCase();
  if (/educat|school|child/.test(l)) return { tone: "from-indigo-500 to-blue-600", bar: "from-indigo-500 to-sky-400", chip: "bg-indigo-50 text-indigo-700", icon: <><path d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5z" /><path d="M6.5 11.5V16c1.5 1.4 3.4 2 5.5 2s4-.6 5.5-2v-4.5" /></> };
  if (/health|medical|patient|nutrition/.test(l)) return { tone: "from-rose-500 to-pink-600", bar: "from-rose-500 to-orange-400", chip: "bg-rose-50 text-rose-700", icon: <path d="M12 20s-7-4.4-7-9.6A4 4 0 0112 8a4 4 0 017 2.4C19 15.6 12 20 12 20z" /> };
  if (/tree|environ|plant|green/.test(l)) return { tone: "from-emerald-500 to-green-600", bar: "from-emerald-500 to-lime-400", chip: "bg-emerald-50 text-emerald-700", icon: <><path d="M12 21v-7" /><path d="M12 14c-4 0-6-3-6-6 4 0 6 2 6 6zM12 12c0-4 2-7 6-7 0 4-2 7-6 7z" /></> };
  if (/women|shg|livelihood/.test(l)) return { tone: "from-amber-500 to-orange-600", bar: "from-amber-500 to-yellow-400", chip: "bg-amber-50 text-amber-700", icon: <><circle cx="12" cy="7" r="3" /><path d="M12 10v6M8.5 13h7M9 21l3-5 3 5" /></> };
  // relief / default: a home icon
  return { tone: "from-sky-500 to-cyan-600", bar: "from-sky-500 to-cyan-300", chip: "bg-sky-50 text-sky-700", icon: <><path d="M4 21V10l8-5 8 5v11" /><path d="M9 21v-5h6v5" /></> };
};

export default function CampaignProgress({ c }: { c: Campaign }) {
  const { t } = useLang();
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const pct = Math.max(0, Math.min(100, Math.round((c.raised / c.goal) * 100)));
  const left = Math.max(0, c.goal - c.raised);
  const { tone, bar, chip, icon } = look(c);
  return (
    <article className="group relative h-full overflow-hidden rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_18px_40px_-26px_rgba(11,61,122,.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_50px_-24px_rgba(11,61,122,.5)] sm:p-7">
      {/* soft coloured corner */}
      <span aria-hidden="true" className={`pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-gradient-to-br ${tone} opacity-10 transition duration-500 group-hover:scale-125`} />
      <div className="relative flex items-start gap-4">
        <span aria-hidden="true" className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg ring-4 ring-white`}>
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
        </span>
        <div className="min-w-0 flex-1">
          {c.cause && <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${chip}`}>{t(c.cause)}</span>}
          <h3 className="mt-1.5 font-serif text-xl font-bold leading-snug text-brand-dark">{c.title}</h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="num-gradient text-3xl font-extrabold tabular-nums leading-none">{pct}%</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink/50">{t("funded")}</p>
        </div>
      </div>
      <p className="relative mt-4 text-sm leading-relaxed text-ink/70">{c.text}</p>

      {/* progress track with quarter marks */}
      <div ref={ref} className="relative mt-6">
        <div className="h-3.5 overflow-hidden rounded-full bg-brand-light shadow-inner" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.title} progress`}>
          <div className={`h-full rounded-full bg-gradient-to-r ${bar} transition-[width] duration-[1400ms] ease-out`} style={{ width: seen ? `${pct}%` : "0%" }} />
        </div>
        {[25, 50, 75].map((m) => <span key={m} aria-hidden="true" className="absolute top-0 h-3.5 w-px bg-white/80" style={{ left: `${m}%` }} />)}
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-brand-light/60 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/50">{t("Raised")}</p>
          <p className="mt-0.5 text-base font-bold tabular-nums text-brand-dark">{fmt(c.raised)}</p>
        </div>
        <div className="rounded-xl bg-ink/[.04] px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/50">{t("Still needed")}</p>
          <p className="mt-0.5 text-base font-bold tabular-nums text-ink">{fmt(left)}</p>
        </div>
      </div>
      <p className="relative mt-3 text-xs text-ink/50">{t("Goal")} {fmt(c.goal)}</p>

      <DonateButton to={`/donate?cause=${encodeURIComponent(c.cause ?? "")}`} size="sm" className="relative mt-5">{t("Give to this cause")}</DonateButton>
    </article>
  );
}
