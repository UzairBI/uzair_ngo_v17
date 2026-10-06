import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTitle } from "../hooks/useTitle";
import { useLang } from "../i18n/LangContext";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { defaultAnnualReports, type AnnualReport } from "../data/annualReports";
import PageHero from "../components/PageHero";
import Reveal from "../components/Reveal";

/** Box colours, in turn (by year, so a box keeps its colour whichever way the list is sorted). */
const tones = [
  "from-[#1493e6] to-[#4fc3f7] shadow-[#1493e6]/40",
  "from-[#22b866] to-[#4ade80] shadow-[#22b866]/40",
  "from-[#a05cf0] to-[#c084fc] shadow-[#a05cf0]/40",
  "from-[#f5822a] to-[#fb9d4b] shadow-[#f5822a]/40"
];
const startYear = (fy: string) => Number(fy.slice(0, 4)) || 0;
/** Only a file of this website or an https link is ever opened. */
const safeUrl = (u?: string | null) => (u && /^(\/(?!\/)|https:\/\/)/.test(u) ? u : null);
/** Download link: files in the storage bucket need "?download" to be saved instead of opened. */
const downloadUrl = (u: string) => (u.startsWith("https://") ? `${u}${u.includes("?") ? "&" : "?"}download=` : u);

/** Years from the admin panel (table annual_reports). Falls back to the list in src/data/annualReports.ts. */
function useAnnualReports(): AnnualReport[] {
  const [list, setList] = useState<AnnualReport[]>(defaultAnnualReports);
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    let alive = true;
    supabase.from("annual_reports").select("fy, title, description, file_url").eq("published", true)
      .then(({ data, error }) => { if (alive && !error && data && data.length) setList(data); });
    return () => { alive = false; };
  }, []);
  return list;
}

function YearBox({ r }: { r: AnnualReport }) {
  const { t } = useLang();
  const url = safeUrl(r.file_url);
  const tone = tones[startYear(r.fy) % tones.length];
  const pill = "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
  return (
    <article className={`group relative flex h-full flex-col items-center overflow-hidden rounded-3xl px-5 py-7 text-center transition duration-300 hover:-translate-y-1.5 ${url
      ? `bg-gradient-to-br text-white shadow-lg hover:shadow-2xl ${tone}`
      : "border-2 border-dashed border-ink/15 bg-white/70 text-ink/60 hover:border-brand/40"}`}>
      {url && <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 transition duration-500 group-hover:scale-150" />}
      <p className={`font-serif text-[1.7rem] font-extrabold leading-none tracking-tight ${url ? "" : "text-ink/45"}`}>{r.fy}</p>
      {r.title && <h3 className={`mt-2 text-sm font-semibold leading-snug ${url ? "text-white/95" : "text-ink/60"}`}>{r.title}</h3>}
      {r.description && <p className={`mt-1.5 text-xs leading-relaxed ${url ? "text-white/85" : "text-ink/55"}`}>{r.description}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-center gap-2 pt-5">
        {url ? (
          <>
            <a href={url} target="_blank" rel="noreferrer" className={pill} aria-label={`${t("View")} ${r.title || r.fy}`}>{t("View")}</a>
            <a href={downloadUrl(url)} download className={pill} aria-label={`${t("Download")} ${r.title || r.fy}`}>{t("Download")}</a>
          </>
        ) : (
          <span className="rounded-full bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink/55">{t("Report not uploaded yet")}</span>
        )}
      </div>
    </article>
  );
}

export default function AnnualReports() {
  const { t } = useLang();
  useTitle("Annual Reports");
  const all = useAnnualReports();
  const [newestFirst, setNewestFirst] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const available = all.filter((r) => safeUrl(r.file_url)).length;
  const list = useMemo(() => all.filter((r) => !onlyAvailable || safeUrl(r.file_url))
    .sort((a, b) => (startYear(a.fy) - startYear(b.fy)) * (newestFirst ? -1 : 1)), [all, newestFirst, onlyAvailable]);
  const first = all.reduce((m, r) => Math.min(m, startYear(r.fy)), 9999), last = all.reduce((m, r) => Math.max(m, startYear(r.fy)), 0);
  const chip = (on: boolean) => `rounded-full px-4 py-2 text-sm font-semibold transition ${on ? "bg-brand text-white shadow" : "bg-white text-ink ring-1 ring-ink/10 hover:ring-brand/50"}`;

  return (
    <>
      <PageHero eyebrow={t("Transparency & Reports")} title={t("Annual Reports")} text={t("Two decades of work, accounted for year by year.")} />

      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#f3f8fe] via-white to-[#eef5fd] py-12 md:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 -z-10 h-80 w-80 rounded-full bg-sky/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-10 -z-10 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">{t("Annual Reports")}</p>
              <h2 className="h2 mt-2">{t("Transparent reporting of our work and impact")}</h2>
              <p className="mt-2 text-ink/70">
                {all.length} {t("financial years")}{first < 9999 ? `, ${first} – ${last + 1}` : ""} · <strong className="text-brand-dark">{available}</strong> {t("reports online")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Show and sort">
              <button type="button" className={chip(!onlyAvailable)} aria-pressed={!onlyAvailable} onClick={() => setOnlyAvailable(false)}>{t("All years")}</button>
              <button type="button" className={chip(onlyAvailable)} aria-pressed={onlyAvailable} onClick={() => setOnlyAvailable(true)}>{t("Available reports")}</button>
              <button type="button" className={chip(false)} onClick={() => setNewestFirst((v) => !v)}>
                <span aria-hidden="true">{newestFirst ? "↓" : "↑"}</span> {newestFirst ? t("Newest first") : t("Oldest first")}
              </button>
            </div>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((r, i) => <Reveal key={r.fy} delay={Math.min(i, 8) * 60} className="h-full"><YearBox r={r} /></Reveal>)}
          </div>

          <p className="mt-10 rounded-2xl bg-white p-5 text-sm text-ink/70 shadow-sm ring-1 ring-ink/5">
            {t("Need a report that is not online yet, an audit report or a registration certificate?")}{" "}
            <Link to="/transparency#request" className="font-semibold text-brand hover:underline">{t("Request documents")} →</Link>
          </p>
        </div>
      </section>
    </>
  );
}
