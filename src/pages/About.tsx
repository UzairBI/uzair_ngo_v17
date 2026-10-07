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
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6"><p className="eyebrow">Our Vision</p><h3 className="mt-2 font-serif text-xl font-bold">{c("about.vision.title")}</h3>
              <p className="justified mt-2 text-ink/70">{c("about.vision.text")}</p></div>
            <div className="rounded-2xl bg-white p-6"><p className="eyebrow">Our Mission</p><h3 className="mt-2 font-serif text-xl font-bold">{c("about.mission.cardTitle")}</h3>
              <p className="justified mt-2 text-ink/70">{c("about.mission.text")}</p></div>
          </div>
          <h3 className="mt-10 font-serif text-2xl font-bold">{c("about.values.title")}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(([name], i) => <div key={name} className="rounded-2xl bg-white p-5"><p className="text-xs text-ink/50">0{i + 1}</p><h4 className="font-semibold">{c(`about.values.${i + 1}.title`)}</h4><p className="justified mt-1 text-sm text-ink/70">{c(`about.values.${i + 1}.text`)}</p></div>)}
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
          {thematicAreas.map(([name], i) => <div key={name} className="rounded-2xl border p-5"><h3 className="font-semibold text-brand-dark">{c(`about.focus.${i + 1}.title`)}</h3><p className="justified mt-1 text-sm text-ink/70">{c(`about.focus.${i + 1}.text`)}</p></div>)}
        </div>
      </section>

      <section id="reach" className="bg-brand-light py-16">
        <div className="container-site">
          <p className="eyebrow">{t("Where we work")}</p><h2 className="h2 mt-2">{c("about.reach.title")}</h2>
          <p className="justified mt-2 text-ink/70">{c("about.reach.text")}</p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-ink/60">Madhya Pradesh districts</p>
          <div className="mt-2 flex flex-wrap gap-2">{districts.map((d) => <span key={d} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium shadow-sm">{d}</span>)}</div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-ink/60">Other states</p>
          <div className="mt-2 flex flex-wrap gap-2">{otherAreas.map((d) => <span key={d} className="rounded-full border border-brand bg-white px-4 py-1.5 text-sm font-medium text-brand-dark">{d}</span>)}</div>
        </div>
      </section>

      <section id="committee" className="container-site py-16">
        <p className="eyebrow">Executive Committee</p><h2 className="h2 mt-2">{c("about.committee.title")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.filter((m) => m.team === "committee").map((m, i) => <div key={m.id ?? i} className="rounded-2xl border p-5"><h4 className="font-semibold">{m.name}</h4><p className="text-sm text-brand-dark">{m.post}</p><p className="text-xs text-ink/60">Executive Committee</p></div>)}
        </div>
        {management.length > 0 && <>
          <h3 id="team" className="mt-14 font-serif text-2xl font-bold">{c("about.team.title")}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {management.map((m, i) => <div key={m.id ?? i} className="rounded-2xl border bg-white p-5"><h4 className="font-semibold">{m.name}</h4><p className="text-sm text-brand-dark">{m.post}</p>{m.role && <p className="justified mt-2 text-xs text-ink/70">{m.role}</p>}</div>)}
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
