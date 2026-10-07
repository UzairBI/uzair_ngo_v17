import { Link } from "react-router-dom";
import { ways } from "../data/content";
import { site } from "../data/site";
import { posts } from "../data/news";
import { useTitle } from "../hooks/useTitle";
import { usePageText } from "../hooks/usePageText";
import { useLiveData, todayLocal } from "../hooks/useLiveData";
import { useLang } from "../i18n/LangContext";
import Img from "../components/Img";
import { homeHeroSlides, homeHeroOpening } from "../data/slideshows";
import BackgroundSlideshow from "../components/BackgroundSlideshow";
import RotatingWords from "../components/RotatingWords";
import ProjectSlider from "../components/ProjectSlider";
import Wave from "../components/Wave";
import ImpactCalculator from "../components/ImpactCalculator";
import Reveal from "../components/Reveal";
import { ImpactDashboard, KeyFigures } from "../components/ImpactShowcase";
import Testimonials from "../components/Testimonials";
import CampaignProgress from "../components/CampaignProgress";
import IndiaNetworkMap from "../components/IndiaNetworkMap";
import SupportersStrip from "../components/SupportersStrip";
import { fmtDate } from "./News";
import DonateButton from "../components/DonateButton";
import { useIsMobile } from "../hooks/useIsMobile";

const heroWords = ["Communities", "Education", "Women", "Villages", "Students", "Environment"];
/** Hero heading colour. Applied to each part separately (not to the whole <h1>) so the rotating word renders correctly in Safari. */
const heroInk = "text-white";
const heroAccent = "text-sky-300";
/** Images already shown elsewhere on this page, so Latest Stories never repeats them. */
const usedImages = ["field-3.jpg", "field-6.jpg", "field-9.jpg"];
const heroImages = homeHeroSlides.map((s) => s.src);
const heroFocus = Object.fromEntries([homeHeroOpening, ...homeHeroSlides].map((s) => [s.src, s.focus]));

export default function Home() {
  useTitle(undefined, "Community health, education, women empowerment, tree plantation and disaster relief.");
  const { t } = useLang();
  const c = usePageText();
  const isMobile = useIsMobile();
  const { campaigns, events } = useLiveData();
  const today = todayLocal();
  const nextEvents = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);

  return (
    <>
      {/* Hero (light sky-blue) */}
      {/* Photo slideshow (src/data/slideshows.ts). Phones: a big photo at the top that runs down behind the badge and the first
          two headline lines, fading into the dark blue. --hero-pad = where the text starts on the photo: the screen height left over
          after the headline and both buttons (the 500px), so they all show without scrolling; the intro text moves under the buttons.
          From md up: the photos fill the whole hero behind the text. */}
      <section className="relative isolate overflow-hidden bg-[#061a36] pb-20 text-white [--hero-pad:clamp(110px,calc(100svh_-_500px),62vw)] md:flex md:min-h-[540px] md:items-center md:pb-24">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-20 h-[calc(var(--hero-pad)_+_150px)] md:inset-0 md:h-auto">
          {/* The opening photo is shown first, then shifts out to the first slide; it is not part of the loop. */}
          <BackgroundSlideshow images={heroImages} imgClassNames={heroFocus} fallback={homeHeroOpening.src} startDelay={4000} effect="shift" interval={5000} duration={1100} />

          <div className="absolute inset-x-0 bottom-0 z-10 h-[70%] bg-gradient-to-t from-[#061a36] via-[#061a36]/75 to-transparent md:hidden" />
        </div>
        <div aria-hidden="true" className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-[#04132b]/95 via-[#06244d]/45 to-transparent md:block" />

        <div className="container-site pb-10 pt-[calc(var(--hero-pad)_-_6svh)] font-hero md:py-14"><div className="max-w-[720px] max-md:mx-auto max-md:flex max-md:flex-col max-md:items-center max-md:text-center">
          {isMobile && <DonateButton to="/donate" size="sm" className="mb-3">{t("Donate")}</DonateButton>}
          <p className="badge-live inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-dark shadow-sm backdrop-blur sm:text-sm">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" />
              <path d="m7 20 1.6 1.4c.3.4.8.6 1.4.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
              <path d="m2 15 6 6" />
              <path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z" />
            </svg>
            {t("Registered NGO")}
          </p>
          <h1 className="mt-2.5 md:mt-5 text-[clamp(1.9rem,10.4vw,2.6rem)] font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-[3.25rem]">
            <span className="block"><span className={`hero-ink ${heroInk}`}>{t("Empowering Lives,")}</span></span>
            <span className="block"><span className={`hero-ink hero-gap ${heroInk}`}>{t("Empowering")}</span>{" "}<RotatingWords words={heroWords.map(t)} className={heroAccent} /></span>
            <span className="block"><span className={`hero-ink ${heroInk}`}>{t("in Rural India")}</span></span>
          </h1>
          <p className="mt-5 max-w-[620px] text-base font-medium leading-relaxed text-white/90 max-md:order-last max-md:mt-6 max-md:pb-16 md:text-lg">
            {site.name} {t("is dedicated to sustainable grassroots upliftment providing quality education to children, health camps, women's skill training, and emergency relief across India.")}
          </p>
          <div className="mt-8 flex max-w-xs flex-col gap-3 max-md:mx-auto max-md:mt-5 max-md:w-full max-md:max-w-sm min-[480px]:max-w-none min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:gap-4 sm:mt-9">
            <DonateButton to="/donate" size="lg" full={isMobile} className="min-[480px]:order-first">{t("Support Our Cause")}</DonateButton>
            <Link to="/projects" className={`btn-light btn-light-lg ${isMobile ? "w-full" : ""}`}>
              {t("Explore Program")} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div></div>
        {!isMobile && (
          <a href="#impact" aria-label="Scroll to impact numbers" className="bounce-slow absolute bottom-24 left-1/2 hidden h-10 w-6 -translate-x-1/2 items-start justify-center rounded-full border-2 border-white/60 pt-2 md:flex">
            <span className="h-2 w-1 rounded-full bg-white/90" />
          </a>
        )}
        <Wave fill="#e6f3fd" />
      </section>

      {/* Impact dashboard */}
      <section id="impact" className="bg-brand-light py-12 md:py-14">
        <ImpactDashboard />
      </section>

      {/* Founder: message on the left, portrait card on the right (over a soft blue shape and a faded field photo), key figures underneath */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#f3f8fe] via-white to-[#eef5fd] py-14 md:py-20">
        <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 hidden w-[46%] [mask-image:linear-gradient(to_right,transparent,black_55%)] lg:block">
          <img src="/assets/images/field-9.jpg" alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#dbeafe]/75 to-[#bfdbfe]/55" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#eef5fd] to-transparent" />
        </div>

        <div className="container-site">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_.8fr] lg:gap-10">
            <Reveal>
              <p className="eyebrow flex items-center gap-4 tracking-[.2em]">{t("Chairman's Message")}<span aria-hidden="true" className="h-px w-12 bg-brand/50" /></p>
              <blockquote className="mt-5 font-[Merriweather,Georgia,serif] text-[1.7rem] font-bold leading-[1.25] text-ink sm:text-4xl lg:text-[2.7rem] lg:leading-[1.22]">“Selfless service and inclusive education pave the path to true social empowerment.”</blockquote>
              <p className="mt-6 leading-relaxed text-ink/70 md:text-lg">Welcome to {site.name}. Established with a deep commitment to social justice, our mission is to ensure no child is deprived of learning and no family is left without accessible healthcare. Through transparent governance and relentless field activity, we bridge the gap between resources and grassroots need.</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5">
                <Link to="/about#founder" className="btn btn-brand !rounded-xl !px-7 !py-3.5">{t("Read Founder Message")} <span aria-hidden="true">→</span></Link>
              </div>
            </Reveal>

            <Reveal delay={120} className="max-lg:order-first">
              <div className="relative mx-auto w-full max-w-[300px] pb-16 sm:max-w-[340px] lg:ml-auto lg:mr-6 lg:max-w-[380px]">
                <div aria-hidden="true" className="absolute -left-[26%] top-[14%] -z-10 h-[78%] w-[120%] rounded-[46%_54%_52%_48%/55%_45%_55%_45%] bg-gradient-to-br from-[#93c5fd] via-[#60a5fa] to-[#3b82f6] opacity-80" />
                <Img file="founder-chairman.jpeg" alt="Founder Chairman & CEO" className="aspect-[4/5] w-full rounded-[28px] border-[5px] border-white shadow-[0_24px_50px_-20px_rgba(11,61,122,.45)]" />
                <div className="absolute bottom-0 left-[-8%] right-[12%] rounded-2xl bg-white px-6 py-5 shadow-[0_18px_40px_-18px_rgba(11,61,122,.4)] max-sm:left-0 max-sm:right-[6%]">
                  <h3 className="font-[Merriweather,Georgia,serif] text-xl font-bold text-ink">{site.chairman}</h3>
                  <p className="mt-0.5 font-medium text-brand">{t("Founder Chairman & CEO")}</p>
                  <span aria-hidden="true" className="mt-3 block h-px w-6 bg-ink/25" />
                  <p className="mt-3 text-sm leading-snug text-ink/65">25+ years in social development and community empowerment</p>
                </div>
              </div>
            </Reveal>
          </div>

          <KeyFigures />
        </div>
      </section>

      {/* Focus areas */}
      <section className="bg-slate-50 py-16">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">{t("Our Core Focus Areas")}</p>
            <h2 className="h2 mt-2">{t("Grassroots Initiatives in")} {site.location}</h2>
            <p className="mb-8 mt-2 text-ink/70">{t("Comprehensive interventions designed for long-term community resilience.")}</p>
          </Reveal>
          <ProjectSlider />
        </div>
      </section>

      {/* Campaign progress (hidden until real campaigns exist) */}
      {campaigns.length > 0 && (
        <section className="py-16">
          <div className="container-site">
            <Reveal><p className="eyebrow">{t("Campaigns")}</p><h2 className="h2 mt-2">{t("Our Active Campaigns")}</h2></Reveal>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {campaigns.map((c, i) => <Reveal key={c.id} delay={i * 100}><CampaignProgress c={c} /></Reveal>)}
            </div>
          </div>
        </section>
      )}

      {/* Calculator */}
      <section className="bg-brand-dark py-16 text-white">
        <div className="container-site text-center">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">{t("Interactive Impact Calculator")}</p>
            <h2 className="h2 mt-2">{t("See How Your Contribution Changes Lives")}</h2>
            <p className="mx-auto mb-8 mt-3 max-w-2xl text-white/85">Use the slider to see an illustrative impact outcome. Actual programme results and any tax benefit depend on verified records and applicable rules.</p>
          </Reveal>
          <ImpactCalculator />
        </div>
      </section>

      {/* Testimonials (Bravio-style section, see components/Testimonials.tsx) */}
      <Testimonials />

      {/* Featured initiative */}
      <section className="bg-brand-light py-16">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2">
          <Reveal><Img file="field-9.jpg" alt="Child Education Programme" className="aspect-[4/3] w-full rounded-3xl" /></Reveal>
          <Reveal delay={120}>
            <p className="eyebrow">{t("Featured Initiative")}</p>
            <h2 className="h2 mt-2">Shiksha Sahara: Bringing Dignity & Knowledge to Every Child</h2>
            <p className="mt-4 text-ink/70">In rural clusters and slum settlements, children facing poverty often miss out on foundational reading, writing, and school supplies. Our evening Shiksha Kendras provide free tutoring, school kits, and uniforms.</p>
            <blockquote className="mt-4 border-l-4 border-brand pl-4 font-quote text-sm italic">"Learning support is strongest when families and communities become part of the journey. Getting my school bag and books gave me confidence to dream big." <br />Parent of a Beneficiary Student</blockquote>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/projects/child-education" className="btn btn-brand">{t("Learn More About Shiksha Sahara")}</Link>
              <DonateButton to="/donate?amount=6000&cause=Child%20Education">Sponsor a Child (₹6,000/yr)</DonateButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Ways to help */}
      <section className="py-16">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">{t("Ways to Help")}</p>
            <h2 className="h2 mt-2">{t("Four Ways You Can Make a Difference")}</h2>
            <p className="mt-2 text-ink/70">Whether you donate, give time as a volunteer, partner via corporate CSR, or sponsor a cause, your involvement reaches lives directly.</p>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ways.map((w, i) => (
              <Reveal key={w.title} delay={i * 90} className="h-full">
                <Link to={w.href} className="flex h-full flex-col rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-lg">
                  <h3 className="font-serif text-lg font-bold text-brand-dark">{c(`involved.way.${i + 1}.title`)}</h3>
                  <p className="mt-2 text-sm text-ink/70">{c(`involved.way.${i + 1}.text`)}</p>
                  <span className="mt-auto inline-block pt-4 text-sm font-semibold text-brand">{w.cta} →</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* News & events */}
      <section className="bg-slate-50 py-16">
        <div className="container-site">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="eyebrow">{t("News & Events")}</p><h2 className="h2 mt-2">{t("Latest Field Updates & Upcoming Drives")}</h2>
                <p className="mt-2 text-ink/70">Follow the people, programmes and community work happening across our field network.</p></div>
              <Link to="/media" className="text-sm font-semibold text-brand">{t("View All Media & Events →")}</Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div className="rounded-2xl bg-brand-dark p-6 text-white">
              <p className="text-xs uppercase tracking-widest text-white/70">{nextEvents.length ? t("Upcoming events") : "Field updates"}</p>
              {nextEvents.length ? (
                <ul className="mt-3 space-y-4">
                  {nextEvents.map((e) => (
                    <li key={e.id}>
                      <p className="font-serif text-lg font-bold">{e.title}</p>
                      <p className="text-sm text-white/80">{fmtDate(e.date)} · {e.place}</p>
                      {e.images && e.images.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {e.images.slice(0, 2).map((src) => (
                            <img key={src} src={src} alt={`${e.title} thumbnail`} loading="lazy" className="h-12 w-12 rounded object-cover" />
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <h3 className="mt-2 font-serif text-xl font-bold">Real work. Real people. Real change.</h3>
                  <p className="mt-2 text-sm text-white/85">Upcoming verified drives will appear here as soon as their dates are confirmed. Until then, explore our latest field stories.</p>
                </>
              )}
              <Link to={nextEvents.length ? "/events" : "/media"} className="btn btn-primary mt-4">{nextEvents.length ? t("Events Calendar") : t("Explore the gallery")}</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[["field-3.jpg", "Women Empowerment", "Community outreach with women and children"],
                ["field-6.jpg", "Social Relief", "Community nutrition and family support"]].map(([f, c, tt]) => (
                <Link to="/media" key={f} className="group relative block overflow-hidden rounded-2xl">
                  <Img file={f} alt={tt} className="aspect-[4/3] w-full transition group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-3 text-xs text-white"><b className="block">{c}</b>{tt}</span>
                </Link>
              ))}
            </div>
          </div>

          <Reveal><h3 className="mt-14 font-serif text-2xl font-bold">{t("Latest Stories")}</h3></Reveal>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.filter((p) => !usedImages.includes(p.image)).slice(0, 3).map((p, i) => (
              <Reveal key={p.slug} delay={i * 90}>
                <Link to={`/news/${p.slug}`} className="group block h-full overflow-hidden rounded-2xl border bg-white transition hover:shadow-lg">
                  <Img file={p.image} alt={p.title} className="aspect-[16/10] w-full transition duration-500 group-hover:scale-105" />
                  <div className="p-4"><p className="eyebrow">{p.category}</p><h4 className="mt-1 font-serif font-bold">{p.title}</h4><span className="mt-2 inline-block text-sm font-semibold text-brand">{t("Read more")} →</span></div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Where we work */}
      <section className="py-16">
        <div className="container-site">
          <Reveal><p className="eyebrow">{t("Where we work")}</p><h2 className="h2 mb-6 mt-2">{t("Our Field Presence")}</h2></Reveal>
          <IndiaNetworkMap />
        </div>
      </section>

      {/* Supporters & partners */}
      <section className="bg-brand-light pb-6 pt-10 md:pb-8 md:pt-12">
        <div className="container-site text-center">
          <Reveal>
            <h2 className="h2 text-brand-dark">{t("Our Supporters & Partners")}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-ink/70">{t("We are grateful to our valuable supporters and partners who help us make a difference in society.")}</p>
          </Reveal>
        </div>
        <div className="mt-6"><SupportersStrip /></div>
      </section>

      {/* CTA */}
      <section className="mt-10 bg-gradient-to-br from-brand-dark to-brand py-16 text-center text-white md:mt-16">
        <div className="container-site">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">{t("Take Action Today")}</p>
            <h2 className="h2 mx-auto mt-2 max-w-3xl">{t("Together, we can create stronger and more self-reliant communities.")}</h2>
            <div className="mx-auto mt-6 flex max-w-xs flex-col justify-center gap-3 min-[480px]:max-w-none min-[480px]:flex-row min-[480px]:flex-wrap">
              <DonateButton to="/donate" size="lg">{t("Support Us (Donate)")}</DonateButton>
              <Link to="/get-involved" className="btn-light btn-light-lg">{t("Get Involved")}</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
