import { committee, values, thematicAreas, districts, otherAreas, team } from "../data/content";
import { partners } from "../data/portfolio";
import { legalIds, site } from "../data/site";
import { useLang } from "../i18n/LangContext";
import { useTitle } from "../hooks/useTitle";
import { usePageText } from "../hooks/usePageText";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Img from "../components/Img";
import PageHero from "../components/PageHero";
import VolunteerWall from "../components/VolunteerWall";
import { aboutImages } from "../data/slideshows";

function CopyId({ value }: { value: string }) {
  const [ok, setOk] = useState(false);
  return <button className="-ml-2 px-2 py-2 text-xs font-semibold text-brand" onClick={() => { navigator.clipboard?.writeText(value); setOk(true); setTimeout(() => setOk(false), 1500); }}>{ok ? "Copied" : "Copy ID"}</button>;
}

interface TeamMember { id?: number; team: string; name: string; post: string; role?: string }
const defaultTeam: TeamMember[] = [...committee.map((m) => ({ ...m, team: "committee" })), ...team.map((m) => ({ ...m, team: "management" }))];

/** Executive committee + management team from the admin panel (table team_members). Falls back to the lists in src/data/content.ts. */
function useTeam(): TeamMember[] {
  const [list, setList] = useState<TeamMember[]>(defaultTeam);
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    let alive = true;
    supabase.from("team_members").select("id, team, name, post, role").eq("published", true)
      .order("sort_order").order("id")
      .then(({ data, error }) => { if (alive && !error && data) setList(data); });
    return () => { alive = false; };
  }, []);
  return list;
}

/** Icon + colour for each thematic area, in the same order as thematicAreas (Education, Health, WASH, Women, Tribal, Environment, Youth, Maternal). */
const AREA_LOOK: { tone: string; icon: JSX.Element }[] = [
  { tone: "from-indigo-500 to-blue-600", icon: <><path d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5z" /><path d="M6.5 11.5V16c1.5 1.4 3.4 2 5.5 2s4-.6 5.5-2v-4.5" /></> },
  { tone: "from-rose-500 to-pink-600", icon: <><path d="M12 20s-7-4.4-7-9.6A4 4 0 0112 8a4 4 0 017 2.4C19 15.6 12 20 12 20z" /><path d="M12 10.500v4M10 12.500h4" /></> },
  { tone: "from-cyan-500 to-sky-600", icon: <path d="M12 3s6 6.500 6 11a6 6 0 01-12 0c0-4.500 6-11 6-11z" /> },
  { tone: "from-amber-500 to-orange-600", icon: <><circle cx="12" cy="7" r="3" /><path d="M12 10v6M8.500 13h7M9 21l3-5 3 5" /></> },
  { tone: "from-teal-500 to-emerald-600", icon: <><path d="M3 20l5-9 4 6 3-4 6 7H3z" /><circle cx="17" cy="6" r="2" /></> },
  { tone: "from-emerald-500 to-green-600", icon: <><path d="M12 21v-7" /><path d="M12 14c-4 0-6-3-6-6 4 0 6 2 6 6zM12 12c0-4 2-7 6-7 0 4-2 7-6 7z" /></> },
  { tone: "from-violet-500 to-purple-600", icon: <><path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" /></> },
  { tone: "from-fuchsia-500 to-pink-600", icon: <><circle cx="12" cy="6" r="2.500" /><path d="M8 21v-5a4 4 0 118 0v5" /><circle cx="12" cy="14.500" r="1.500" /></> }
];

export default function About() {
  const { t } = useLang();
  const c = usePageText();
  const people = useTeam();
  const management = people.filter((m) => m.team === "management");
  useTitle("About Us - Founder, Mission & Committee");
  return (
    <>
      <PageHero images={aboutImages} eyebrow={`About ${site.name}`} title={c("about.hero.title")} text={c("about.hero.text")} />
      {/* Founder: same look as the Chairman's message on the Home page (message left, portrait card right over a blue shape and a faded field photo) */}
      <section id="founder" className="relative isolate overflow-hidden bg-gradient-to-br from-[#f3f8fe] via-white to-[#eef5fd] py-12 md:py-16">
        <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 hidden w-[46%] [mask-image:linear-gradient(to_right,transparent,black_55%)] lg:block">
          <img src="/assets/images/field-9.jpg" alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#dbeafe]/75 to-[#bfdbfe]/55" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#eef5fd] to-transparent" />
        </div>
        <div className="container-site grid items-center gap-12 lg:grid-cols-[1.2fr_.8fr] lg:gap-10">
          <div className="space-y-4 text-ink/80">
            <p className="eyebrow flex items-center gap-4 tracking-[.2em]">Leadership Profile<span aria-hidden="true" className="h-px w-12 bg-brand/50" /></p>
            <h2 className="font-[Merriweather,Georgia,serif] text-[1.7rem] font-bold leading-[1.25] text-ink sm:text-4xl lg:text-[2.5rem] lg:leading-[1.22]">{c("about.founder.title")}</h2>
            <p className="justified leading-relaxed"><strong>{c("about.founder.lead")}</strong> {c("about.founder.intro")}</p>
            <p className="justified font-quote text-[1.05rem] italic leading-relaxed">{c("about.founder.quote1")}</p>
            <p className="justified font-quote text-[1.05rem] italic leading-relaxed">{c("about.founder.quote2")}</p>
            <p className="justified font-quote text-[1.05rem] italic leading-relaxed">{c("about.founder.quote3")}</p>
            <p className="font-semibold text-ink">{site.chairman}<span className="block text-sm font-normal text-ink/70">{c("about.founder.role")}, {site.name}</span></p>
          </div>

          <div className="max-lg:order-first">
            <div className="relative mx-auto w-full max-w-[300px] pb-16 sm:max-w-[340px] lg:ml-auto lg:mr-6 lg:max-w-[380px]">
              <div aria-hidden="true" className="absolute -left-[26%] top-[14%] -z-10 h-[78%] w-[120%] rounded-[46%_54%_52%_48%/55%_45%_55%_45%] bg-gradient-to-br from-[#93c5fd] via-[#60a5fa] to-[#3b82f6] opacity-80" />
              <Img file="founder-chairman.jpeg" alt="Founder Chairman" className="aspect-[4/5] w-full rounded-[28px] border-[5px] border-white shadow-[0_24px_50px_-20px_rgba(11,61,122,.45)]" />
              <div className="absolute bottom-0 left-[-8%] right-[12%] rounded-2xl bg-white px-6 py-5 shadow-[0_18px_40px_-18px_rgba(11,61,122,.4)] max-sm:left-0 max-sm:right-[6%]">
                <h3 className="font-[Merriweather,Georgia,serif] text-xl font-bold text-ink">{site.chairman}</h3>
                <p className="mt-0.5 font-medium text-brand">{c("about.founder.role")}</p>
                <span aria-hidden="true" className="mt-3 block h-px w-6 bg-ink/25" />
                <p className="mt-3 text-sm leading-snug text-ink/65">{c("about.founder.card")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="mission" className="bg-brand-light py-16">
        <div className="container-site">
          <p className="eyebrow">Mission & Vision</p><h2 className="h2 mt-2">{c("about.mission.title")}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2a55] via-[#0d3b7a] to-[#1479d1] p-7 text-white shadow-xl sm:p-8">
              <span aria-hidden="true" className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <span aria-hidden="true" className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
              </span>
              <p className="relative mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Our Vision</p>
              <h3 className="relative mt-2 font-serif text-xl font-bold leading-snug sm:text-2xl">{c("about.vision.title")}</h3>
              <p className="relative mt-3 text-left leading-relaxed text-white/80">{c("about.vision.text")}</p>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-brand/10 bg-white p-7 shadow-sm sm:p-8">
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand to-sky-400" />
              <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.200" /></svg>
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-brand">Our Mission</p>
              <h3 className="mt-2 font-serif text-xl font-bold leading-snug text-ink sm:text-2xl">{c("about.mission.cardTitle")}</h3>
              <p className="mt-3 text-left leading-relaxed text-ink/70">{c("about.mission.text")}</p>
            </div>
          </div>
          <div className="mt-12 flex items-center gap-4">
            <h3 className="font-serif text-2xl font-bold">{c("about.values.title")}</h3>
            <span aria-hidden="true" className="h-px flex-1 bg-brand/20" />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(([name], i) => (
              <div key={name} className="group relative overflow-hidden rounded-2xl border border-ink/5 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg">
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand to-sky-400 transition-transform duration-300 group-hover:scale-x-100" />
                <span className="font-serif text-3xl font-bold text-brand/25 transition-colors group-hover:text-brand">{String(i + 1).padStart(2, "0")}</span>
                <h4 className="mt-2 text-lg font-semibold text-ink">{c(`about.values.${i + 1}.title`)}</h4>
                <span aria-hidden="true" className="mt-2 block h-px w-8 bg-brand/40 transition-all duration-300 group-hover:w-14" />
                <p className="mt-3 text-left text-sm leading-relaxed text-ink/65">{c(`about.values.${i + 1}.text`)}</p>
              </div>
            ))}
          </div>
          <div id="philosophy" className="mt-10 grid items-center gap-6 rounded-2xl bg-white p-6 md:grid-cols-[180px_1fr]">
            <Img file="team-spirit.png" alt="Team Spirit emblem: golden clasped hands inside a ring of people" className="mx-auto h-40 w-40 !object-contain" />
            <div>
              <p className="eyebrow">Our Philosophy: The Tree</p>
              <blockquote className="mt-2 font-serif text-xl italic text-brand-dark">“{c("about.philosophy.quote")}”</blockquote>
              <p className="justified mt-2 text-sm text-ink/70">{c("about.philosophy.text")}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="focus" className="container-site py-16">
        <p className="eyebrow">{t("What We Do")}</p><h2 className="h2 mt-2">{c("about.focus.title")}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {thematicAreas.map(([name], i) => {
            const look = AREA_LOOK[i % AREA_LOOK.length];
            return (
              <div key={name} className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl">
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r ${look.tone} transition-transform duration-300 group-hover:scale-x-100`} />
                <span aria-hidden="true" className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${look.tone} opacity-[.08] transition duration-500 group-hover:scale-150 group-hover:opacity-[.15]`} />
                <span aria-hidden="true" className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${look.tone} text-white shadow-md transition duration-300 group-hover:-rotate-6 group-hover:scale-110`}>
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{look.icon}</svg>
                </span>
                <h3 className="relative mt-4 text-lg font-semibold leading-snug text-ink">{c(`about.focus.${i + 1}.title`)}</h3>
                <span aria-hidden="true" className="relative mt-2 block h-px w-8 bg-brand/40 transition-all duration-300 group-hover:w-14" />
                <p className="relative mt-3 text-left text-sm leading-relaxed text-ink/65">{c(`about.focus.${i + 1}.text`)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="reach" className="bg-brand-light py-16">
        <div className="container-site">
          <p className="eyebrow">{t("Where we work")}</p><h2 className="h2 mt-2">{c("about.reach.title")}</h2>
          <p className="mt-3 max-w-3xl text-left text-ink/70">{c("about.reach.text")}</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-sm sm:p-7 lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">Madhya Pradesh districts</p>
                <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">{districts.length}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {districts.map((d) => <span key={d} className="group inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-slate-50 px-3.5 py-1.5 text-sm font-medium text-ink transition duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:bg-brand hover:text-white hover:shadow-md"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-brand group-hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.200-7-11a7 7 0 0114 0c0 4.800-7 11-7 11z" /><circle cx="12" cy="10" r="2.500" /></svg>{d}</span>)}
              </div>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-[#0b2a55] via-[#0d3b7a] to-[#1479d1] p-6 text-white shadow-xl sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">Other states</p>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-white/30">{otherAreas.length}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {otherAreas.map((d) => <span key={d} className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-brand-dark"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.200-7-11a7 7 0 0114 0c0 4.800-7 11-7 11z" /><circle cx="12" cy="10" r="2.500" /></svg>{d}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="committee" className="container-site py-16">
        <p className="eyebrow">Executive Committee</p><h2 className="h2 mt-2">{c("about.committee.title")}</h2>
        {(() => {
          const committee = people.filter((m) => m.team === "committee");
          const lead = /chairman|president/i.test(committee[0]?.post ?? "") && !/vice/i.test(committee[0]?.post ?? "") ? committee[0] : undefined;
          const rest = lead ? committee.slice(1) : committee;
          const initial = (n: string) => n.replace(/^(dr|mr|mrs|ms|smt|shri|sri)\.?\s+/i, "").trim().charAt(0).toUpperCase();
          return (
            <div className="mt-8">
              {lead && (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2a55] via-[#0d3b7a] to-[#1479d1] p-7 text-white shadow-xl sm:p-9">
                  <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                  <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                    <span aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/15 font-serif text-3xl font-bold ring-2 ring-white/40">{initial(lead.name)}</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">{lead.post}</p>
                      <h4 className="mt-1 font-serif text-2xl font-bold sm:text-3xl">{lead.name}</h4>
                      <p className="mt-1 text-sm text-white/70">{site.name}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((m, i) => (
                  <div key={m.id ?? i} className="group rounded-2xl border border-ink/10 bg-white p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg">
                    <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 font-serif text-xl font-bold text-brand-dark transition group-hover:bg-brand group-hover:text-white">{initial(m.name)}</span>
                    <h4 className="mt-4 font-semibold leading-snug text-ink">{m.name}</h4>
                    <span aria-hidden="true" className="mx-auto mt-3 block h-px w-10 bg-brand/40" />
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-brand-dark">{m.post}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        {management.length > 0 && <>
          <h3 id="team" className="mt-14 font-serif text-2xl font-bold">{c("about.team.title")}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {management.map((m, i) => (
              <div key={m.id ?? i} className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg">
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand to-sky-400 transition-transform duration-300 group-hover:scale-x-100" />
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 font-serif text-lg font-bold text-brand-dark transition group-hover:bg-brand group-hover:text-white">{m.name.replace(/^(dr|mr|mrs|ms|smt|shri|sri)\.?\s+/i, "").trim().charAt(0).toUpperCase()}</span>
                  <div className="min-w-0 text-left">
                    <h4 className="font-semibold leading-snug text-ink">{m.name}</h4>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-dark">{m.post}</p>
                  </div>
                </div>
                {m.role && <><span aria-hidden="true" className="my-4 block h-px w-full bg-ink/10" /><p className="text-left text-sm leading-relaxed text-ink/70">{m.role}</p></>}
              </div>
            ))}
          </div>
        </>}
        <VolunteerWall />
      </section>

      <section id="partners" className="bg-slate-50 py-16">
        <div className="container-site">
          <p className="eyebrow">{t("Partners & Supporters")}</p><h2 className="h2 mt-2">{c("about.partners.title")}</h2>
          <p className="justified mt-2 text-ink/70">{c("about.partners.text")}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((x) => <div key={x.name} className="rounded-2xl border bg-white p-5"><h3 className="font-semibold">{x.name}</h3><p className="justified mt-1 text-sm text-ink/70">{x.role}</p></div>)}
          </div>
        </div>
      </section>

      <section id="legal" className="bg-slate-50 py-16">
        <div className="container-site">
          <p className="eyebrow">Legal & Governance Compliance</p><h2 className="h2 mt-2">{c("about.legal.title")}</h2>
          <p className="justified mt-2 text-ink/70">{c("about.legal.text")}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {legalIds.map((l) => (
              <div key={l.title} className="rounded-2xl border bg-white p-5">
                <h3 className="font-semibold">{l.title}</h3>
                <p className="mt-1 break-all font-mono text-brand-dark">{l.value}</p>
                {l.validity && <p className="mt-1 text-xs font-semibold text-ink/70">Valid: {l.validity}</p>}
                <p className="justified mt-1 text-sm text-ink/70">{l.note}</p>
                <p className="mt-2 text-xs text-ink/60">Authority: {l.authority}</p>
                <div className="mt-1"><CopyId value={l.value} /></div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-brand-dark p-6 text-white">
            <h4 className="font-semibold">{c("about.legal.cta.title")}</h4>
            <p className="justified mt-1 text-sm text-white/85">{c("about.legal.cta.text")}</p>
            <div className="mt-3 flex flex-wrap gap-3"><Link to="/transparency?request=certificate#request" className="btn btn-primary">Visit Transparency Center →</Link><a href="/documents/SJKS-Organisation-Profile.pdf" target="_blank" rel="noreferrer" className="btn btn-outline">Organisation Profile (PDF)</a></div>
          </div>
        </div>
      </section>
    </>
  );
}
