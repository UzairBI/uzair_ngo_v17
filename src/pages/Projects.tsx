import { useState } from "react";
import { Link } from "react-router-dom";
import { projects } from "../data/content";
import { portfolio, type Area } from "../data/portfolio";
import { useTitle } from "../hooks/useTitle";
import { usePageText } from "../hooks/usePageText";
import { useAdminProjects } from "../hooks/useLiveData";
import { useLang } from "../i18n/LangContext";
import Img from "../components/Img";
import PageHero from "../components/PageHero";
import { projectsImages } from "../data/slideshows";
import DonateButton from "../components/DonateButton";

const core = projects.filter((p) => !p.featured);
const featured = projects.filter((p) => p.featured);
const areaLabel = (a: Area) => projects.find((p) => p.slug === a)?.category ?? a;
/** Colour and line icon of each programme area, used by the portfolio filter and cards. */
const areaLook: Record<Area, { tone: string; chip: string; bar: string; icon: JSX.Element }> = {
  "child-education": { tone: "from-indigo-500 to-blue-600", chip: "bg-indigo-50 text-indigo-700", bar: "from-indigo-500 to-sky-400", icon: <><path d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5z" /><path d="M6.5 11.5V16c1.5 1.4 3.4 2 5.5 2s4-.6 5.5-2v-4.5" /></> },
  "health-nutrition": { tone: "from-rose-500 to-pink-600", chip: "bg-rose-50 text-rose-700", bar: "from-rose-500 to-orange-400", icon: <path d="M12 20s-7-4.4-7-9.6A4 4 0 0112 8a4 4 0 017 2.4C19 15.6 12 20 12 20z" /> },
  "women-empowerment": { tone: "from-amber-500 to-orange-600", chip: "bg-amber-50 text-amber-700", bar: "from-amber-500 to-yellow-400", icon: <><circle cx="12" cy="7" r="3" /><path d="M12 10v6M8.5 13h7M9 21l3-5 3 5" /></> },
  environment: { tone: "from-emerald-500 to-green-600", chip: "bg-emerald-50 text-emerald-700", bar: "from-emerald-500 to-lime-400", icon: <><path d="M12 21v-7" /><path d="M12 14c-4 0-6-3-6-6 4 0 6 2 6 6zM12 12c0-4 2-7 6-7 0 4-2 7-6 7z" /></> },
  "social-welfare": { tone: "from-sky-500 to-cyan-600", chip: "bg-sky-50 text-sky-700", bar: "from-sky-500 to-cyan-300", icon: <><path d="M4 21V10l8-5 8 5v11" /><path d="M9 21v-5h6v5" /></> }
};
/** Projects added in the admin panel: how each status is worded and coloured, and the order they are listed in. */
const statusLabel: Record<string, string> = { planned: "Upcoming", ongoing: "Ongoing", completed: "Completed" };
const statusTone: Record<string, string> = { planned: "bg-amber-100 text-amber-800", ongoing: "bg-green-100 text-green-800", completed: "bg-slate-200 text-slate-700" };
const order = (status: string) => ["planned", "ongoing", "completed"].indexOf(status);

export default function Projects() {
  const { t } = useLang();
  const c = usePageText();
  useTitle("Our Projects");
  const [area, setArea] = useState<Area | "all">("all");
  const latest = useAdminProjects();
  const list = area === "all" ? portfolio : portfolio.filter((p) => p.area === area);
  return (
    <>
      <PageHero images={projectsImages} eyebrow="Our Projects" title={c("projects.hero.title")} text={c("projects.hero.text")} />
      <section className="container-site grid gap-6 py-12 sm:grid-cols-2 md:py-16 lg:grid-cols-3">
        {core.map((p, i) => (
          <article key={p.slug} className="flex flex-col overflow-hidden rounded-2xl border shadow-sm">
            <Img file={p.image} alt={c(`project.${p.slug}.title`)} className="h-52 w-full shrink-0" />
            <div className="flex flex-1 flex-col p-5"><p className="eyebrow">0{i + 1} · {p.category}</p>
              <h2 className="mt-2 font-serif text-xl font-bold">{c(`project.${p.slug}.title`)}</h2><p className="justified mt-2 text-sm text-ink/70">{c(`project.${p.slug}.text`)}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4"><Link to={`/projects/${p.slug}`} className="btn btn-brand !px-4 !py-2">Learn Details</Link>
                <DonateButton to="/donate" variant="outline" size="sm">Sponsor</DonateButton></div></div>
          </article>
        ))}
      </section>

      {/* Projects added in the admin panel (Projects -> "+ Add project"), planned ones first. The "Upcoming Projects" menu item jumps here. */}
      <section id="upcoming" className="scroll-mt-24 bg-slate-50 py-14">
        <div className="container-site">
          <p className="eyebrow">{t("Upcoming Projects")}</p>
          <h2 className="h2 mt-2">{c("projects.upcoming.title")}</h2>
          <p className="justified mt-2 text-ink/70">{c("projects.upcoming.text")}</p>
          {latest.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...latest].sort((x, y) => order(x.status) - order(y.status)).map((p) => (
                <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                  {p.image_url && <img src={p.image_url} alt="" loading="lazy" decoding="async" className="-mx-5 -mt-5 mb-4 aspect-[16/10] w-[calc(100%+2.5rem)] max-w-none object-cover" />}
                  <p className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[p.status] ?? statusTone.ongoing}`}>{t(statusLabel[p.status] ?? p.status)}</span>
                    {p.area && <span className="eyebrow">{p.area}</span>}
                  </p>
                  <h3 className="mt-2 font-serif text-lg font-bold">{p.name}</h3>
                  {p.description && <p className="justified mt-2 flex-1 whitespace-pre-line text-sm text-ink/70">{p.description}</p>}
                  <p className="mt-3 text-xs text-ink/60">{[p.location, p.beneficiaries ? `${p.beneficiaries.toLocaleString("en-IN")} beneficiaries` : ""].filter(Boolean).join(" · ")}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border-2 border-dashed border-ink/15 bg-white p-6 text-center text-ink/60">{c("projects.upcoming.empty")}</p>
          )}
        </div>
      </section>

      {featured.map((p) => (
        <section key={p.slug} id="featured" className="bg-brand-light py-14">
          <div className="container-site grid items-center gap-8 lg:grid-cols-2">
            <Img file={p.image} alt={c(`project.${p.slug}.title`)} className="aspect-[4/3] w-full rounded-3xl" />
            <div>
              <p className="eyebrow">{t("Featured Programme")} · {p.category}</p>
              <h2 className="h2 mt-2">{c(`project.${p.slug}.title`)}</h2>
              {p.detail?.tagline && <p className="mt-1 font-serif italic text-brand-dark">“{p.detail.tagline}”</p>}
              <p className="justified mt-3 text-ink/75">{c(`project.${p.slug}.text`)}</p>
              {p.detail?.stats && (
                <dl className="mt-5 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                  {p.detail.stats.map((s) => <div key={s.label} className="rounded-xl bg-white p-3"><dt className="text-lg font-bold text-brand-dark">{s.value}</dt><dd className="text-[11px] text-ink/60">{s.label}</dd></div>)}
                </dl>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={`/projects/${p.slug}`} className="btn btn-brand">Learn Details</Link>
                <DonateButton to={`/donate?cause=${encodeURIComponent(p.detail?.donateCause ?? "")}`}>Fund a lantern</DonateButton>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section id="portfolio" className="relative overflow-hidden bg-gradient-to-b from-white via-[#f1f8ff] to-white py-20">
        {/* themed background: dotted field + soft colour glows, same family as the campaigns block */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(20,121,209,.14)_1.2px,transparent_1.2px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]" />
        <span aria-hidden="true" className="pointer-events-none absolute -left-28 top-24 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -right-28 bottom-20 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="container-site relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{t("Project Portfolio")}</p>
          <h2 className="h2 mx-auto mt-3">{c("projects.portfolio.title")}</h2>
          <p className="mt-4 text-ink/70">{c("projects.portfolio.text")} <Link to="/transparency#annual-reports" className="font-semibold text-brand underline-offset-4 hover:underline">Comprehensive Impact Report</Link>.</p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {(["all", ...core.map((c) => c.slug)] as (Area | "all")[]).map((a) => {
            const on = a === area;
            return (
              <button key={a} type="button" aria-pressed={on} onClick={() => setArea(a)}
                className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 ${on ? "border-transparent bg-gradient-to-r from-brand to-sky-500 text-white shadow-lg shadow-brand/30" : "border-ink/10 bg-white text-ink/75 shadow-sm hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand-dark hover:shadow-md"}`}>
                {a !== "all" && (
                  <span aria-hidden="true" className={`flex h-6 w-6 items-center justify-center rounded-full ${on ? "bg-white/25 text-white" : `bg-gradient-to-br ${areaLook[a].tone} text-white`}`}>
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{areaLook[a].icon}</svg>
                  </span>
                )}
                {a === "all" ? t("All") : areaLabel(a)}
              </button>
            );
          })}
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {list.map((p) => {
            const facts: [string, string][] = [["Location", p.location], ["Reach", p.beneficiaries], ["Budget", p.budget], ["Funding", p.funding]];
            return (
              <article key={p.no} className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl md:[&:last-child:nth-child(odd)]:col-span-2 md:[&:last-child:nth-child(odd)]:w-[calc(50%-0.625rem)] md:[&:last-child:nth-child(odd)]:justify-self-center">
                <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${areaLook[p.area].bar}`} />
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${areaLook[p.area].tone} text-white shadow-md`}>
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{areaLook[p.area].icon}</svg>
                    </span>
                    <span className="text-sm font-extrabold tabular-nums text-ink/35">{String(p.no).padStart(2, "0")}</span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${areaLook[p.area].chip}`}>{areaLabel(p.area)}</span>
                    {p.period && <span className="ml-auto rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-semibold text-ink/60">{p.period}</span>}
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-bold leading-snug text-ink sm:text-xl">{p.name}</h3>
                  <p className="mt-2 text-left text-sm leading-relaxed text-ink/70">{p.summary}</p>
                </div>
                <dl className="mt-auto grid grid-cols-2 gap-px border-t border-ink/10 bg-ink/10 text-xs">
                  {facts.map(([k, v]) => (
                    <div key={k} className="bg-slate-50/80 px-5 py-3 transition-colors group-hover:bg-white sm:px-6">
                      <dt className="text-[10px] font-semibold uppercase tracking-widest text-ink/45">{k}</dt>
                      <dd className="mt-0.5 text-left text-[13px] font-semibold leading-snug text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
        </div>
        </div>
      </section>
    </>
  );
}
