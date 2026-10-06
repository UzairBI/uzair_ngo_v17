import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTitle } from "../hooks/useTitle";
import { useInView } from "../hooks/useInView";
import { useLang } from "../i18n/LangContext";
import PageHero from "../components/PageHero";
import DonateButton from "../components/DonateButton";

/** Banner photo for this page and for the closing section. */
const banner = "/images/journey/journey-banner.jpg";

const icon = (d: ReactNode) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
/** The story, in order. Edit the text here. */
const milestones: { when: string; title: string; text: string; icon: ReactNode }[] = [
  { when: "2004", title: "The Beginning", icon: icon(<><path d="M12 21v-9" /><path d="M12 12c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6z" /><path d="M12 14c0-3 2.2-5 5.5-5 0 3-2.2 5-5.5 5z" /></>),
    text: "Sahara Jan Kalyan Samiti was established in Sagar, Madhya Pradesh, with a vision to support underserved communities through education, healthcare and social development." },
  { when: "2008–2012", title: "Growing Our Reach", icon: icon(<><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7" opacity=".6" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /></>),
    text: "Sahara expanded its grassroots work beyond Sagar, strengthening its efforts in education, healthcare, women empowerment and community development." },
  { when: "2012–2018", title: "Building Stronger Communities", icon: icon(<><path d="M4 21V10l8-5 8 5v11" /><path d="M2.5 21h19" /><path d="M9 21v-6h6v6" /></>),
    text: "With new programmes, partnerships and stronger systems, Sahara expanded its reach and focused increasingly on long-term community empowerment." },
  { when: "2019–2022", title: "Standing Together in Difficult Times", icon: icon(<path d="M12 20s-7-4.4-7-9.6A4 4 0 0112 8a4 4 0 017 2.4C19 15.6 12 20 12 20z" />),
    text: "During COVID-19, Sahara supported families and communities with food, essential supplies, awareness campaigns and continued healthcare and education initiatives." },
  { when: "2023–2025", title: "Scaling Impact", icon: icon(<><path d="M3 20h18" /><path d="M6 20v-6M12 20V9M18 20V4" /></>),
    text: "Sahara strengthened partnerships and expanded its work across healthcare, education, women empowerment, nutrition and environmental sustainability." },
  { when: "2026", title: "Two Decades of Service", icon: icon(<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z" />),
    text: "Today, Sahara continues its journey of creating opportunities, empowering communities and bringing meaningful change to people’s lives." }
];

function Milestone({ m, i }: { m: (typeof milestones)[number]; i: number }) {
  const { t } = useLang();
  const [ref, seen] = useInView<HTMLLIElement>(0.35);
  const left = i % 2 === 0; // desktop: cards alternate left / right of the line
  return (
    <li ref={ref} className="relative pl-14 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
      {/* dot on the line: lights up when the card arrives */}
      <span aria-hidden="true" className={`absolute left-0 top-1 z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white shadow-md transition-all duration-700 md:left-1/2 md:top-6 md:-ml-5 ${seen ? "scale-100 bg-brand text-white shadow-brand/40" : "scale-75 bg-slate-200 text-slate-400"}`}>
        <span className="h-2.5 w-2.5 rounded-full bg-current" />
        {seen && <span className="absolute inset-0 rounded-full bg-brand/40 motion-safe:animate-ping" style={{ animationIterationCount: 2 }} />}
      </span>
      <div className={`transition-all duration-700 ease-out ${left ? "md:col-start-1 md:text-right" : "md:col-start-2"} ${seen ? "translate-x-0 opacity-100" : `opacity-0 ${left ? "md:-translate-x-12" : "md:translate-x-12"} max-md:translate-x-8`}`}>
        <article className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_18px_44px_-26px_rgba(11,61,122,.45)] ring-1 ring-ink/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(11,79,156,.55)] sm:p-7">
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand to-sky transition-transform duration-500 group-hover:scale-x-100" />
          <div className={`flex items-center gap-3 ${left ? "md:flex-row-reverse" : ""}`}>
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-brand transition duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-brand group-hover:text-white">{m.icon}</span>
            <p className="bg-gradient-to-r from-brand-dark to-sky bg-clip-text font-[Merriweather,Georgia,serif] text-3xl font-bold leading-none text-transparent sm:text-[2rem]">{m.when}</p>
          </div>
          <h3 className="mt-4 font-serif text-xl font-bold text-ink">{t(m.title)}</h3>
          <p className="mt-2 leading-relaxed text-ink/70">{t(m.text)}</p>
        </article>
      </div>
    </li>
  );
}

export default function Journey() {
  const { t } = useLang();
  useTitle("Our Journey");
  const wrap = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0);

  // the blue line fills down as the visitor scrolls through the story
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrap.current; if (!el) return;
      const r = el.getBoundingClientRect();
      setProgress(Math.min(1, Math.max(0, (window.innerHeight * 0.6 - r.top) / r.height)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      {/* The photo is mirrored so the people stand on the right, clear of the title, and placed low enough that every face sits above the wave. */}
      <PageHero images={[banner]} imgClassName="-scale-x-100 object-[22%_72%]" eyebrow={t("Our Journey")} title="From a Small Beginning to a Growing Movement of Change" />

      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#f3f8fe] via-white to-[#eef5fd] py-14 md:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-24 -z-10 h-80 w-80 rounded-full bg-sky/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-[55%] -z-10 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
        <div className="container-site max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{t("Our Journey")}</p>
            <h2 className="h2 mt-2">{t("Two decades of standing with communities")}</h2>
            <p className="mt-3 text-ink/70">{t("Scroll through the story, from the first day in Sagar to the work we carry on today.")}</p>
          </div>

          <ol ref={wrap} className="relative mt-12 space-y-8 md:mt-16 md:space-y-10">
            {/* the line: grey track + blue fill that follows the scroll */}
            <span aria-hidden="true" className="absolute bottom-0 left-5 top-0 -ml-px w-0.5 rounded-full bg-slate-200 md:left-1/2" />
            <span aria-hidden="true" className="absolute left-5 top-0 -ml-px w-0.5 origin-top rounded-full bg-gradient-to-b from-sky to-brand md:left-1/2" style={{ height: `${progress * 100}%` }} />
            {milestones.map((m, i) => <Milestone key={m.when} m={m} i={i} />)}
          </ol>
        </div>
      </section>

      {/* closing: the same photo, fixed behind the text so it drifts as you scroll */}
      <section className="relative isolate overflow-hidden py-20 text-center text-white md:py-28">
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat md:bg-fixed" style={{ backgroundImage: `url(${banner})` }} />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-[#061a36]/85 via-[#0b3d7a]/70 to-[#061a36]/90" />
        <div className="container-site max-w-3xl">
          <p className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur">{t("The Journey Continues")}</p>
          <h2 className="mt-5 font-[Merriweather,Georgia,serif] text-3xl font-bold leading-tight sm:text-4xl md:text-[2.6rem]">{t("The Journey Continues")}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/90">{t("2004 was the beginning. Two decades later, the mission remains the same — to stand with communities, empower lives and build a better future.")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <DonateButton to="/donate" size="lg">{t("Support Our Cause")}</DonateButton>
            <Link to="/get-involved" className="btn-light btn-light-lg">{t("Volunteer & CSR Partnerships")} <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </>
  );
}
