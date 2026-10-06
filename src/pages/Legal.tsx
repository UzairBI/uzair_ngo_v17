import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { legalDocs, type LegalKind } from "../data/legal";
import { useTitle } from "../hooks/useTitle";
import { usePageText } from "../hooks/usePageText";
import PageHero from "../components/PageHero";

const kinds: [LegalKind, string][] = [["privacy", "/privacy"], ["terms", "/terms"], ["dpdp", "/dpdp"]];

/** Privacy Policy, Terms of Use and DPDP Compliance Notice. The wording comes from the admin panel (Website Pages), or src/data/legal.ts. */
export default function Legal({ kind }: { kind: LegalKind }) {
  const c = usePageText();
  const doc = legalDocs[kind];
  const title = c(`legal.${kind}.title`);
  useTitle(title);

  // the headline button of the section being read is filled in: the last section whose heading has passed under the site header
  const [active, setActive] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      let now = 0;
      doc.sections.forEach((_, i) => { const el = document.getElementById(`section-${i + 1}`); if (el && el.getBoundingClientRect().top <= 180) now = i; });
      // at the very end of the page the last section counts as the one being read, even if it cannot reach the top
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) now = doc.sections.length - 1;
      setActive(now);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [doc]);
  const go = (i: number) => document.getElementById(`section-${i + 1}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });

  return (<><PageHero eyebrow="Legal" title={title} />
    <section className="container-site py-16 text-ink/80">
      {/* one button per section headline: jumps to that section. On large screens the row stays in view under the site header. */}
      <nav aria-label={title} className="flex flex-wrap gap-2 bg-white py-3 lg:sticky lg:top-[72px] lg:z-10">
        {doc.sections.map((_, i) => (
          <button key={i} type="button" aria-current={i === active ? "true" : undefined} onClick={() => go(i)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:py-1.5 ${i === active ? "border-brand bg-brand text-white" : "bg-white text-ink hover:border-brand hover:bg-brand-light"}`}>
            {c(`legal.${kind}.s${i + 1}.title`)}
          </button>
        ))}
      </nav>
      {doc.intro && <p className="justified mt-5">{c(`legal.${kind}.intro`)}</p>}
      {doc.sections.map((s, i) => (
        <div key={i} id={`section-${i + 1}`} className="mt-8 first-of-type:mt-5 scroll-mt-28 lg:scroll-mt-40">
          {/* the section headline is a button too: numbered, filled in while its section is being read, and it brings the section to the top */}
          <h2>
            <button type="button" onClick={() => go(i)}
              className={`group inline-flex items-center gap-3 rounded-full border py-1.5 pl-1.5 pr-5 text-left font-serif text-lg font-bold shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${i === active ? "border-brand bg-brand text-white" : "border-brand/25 bg-brand-light text-brand-dark hover:border-brand"}`}>
              <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sans text-sm transition duration-200 group-hover:scale-110 ${i === active ? "bg-white text-brand" : "bg-brand text-white"}`}>{i + 1}</span>
              {c(`legal.${kind}.s${i + 1}.title`)}
            </button>
          </h2>
          {s.p.map((_, j) => <p key={j} className="justified mt-3">{c(`legal.${kind}.s${i + 1}.p${j + 1}`)}</p>)}
        </div>
      ))}
      <p className="mt-10 text-sm text-ink/60">Last updated: {c(`legal.${kind}.updated`)}.</p>
      <p className="mt-4 flex flex-wrap gap-3">
        {kinds.filter(([k]) => k !== kind).map(([k, to]) => <Link key={k} to={to} className="btn border-2 border-brand !px-4 !py-2 text-brand">{c(`legal.${k}.title`)} <span aria-hidden="true">→</span></Link>)}
      </p>
    </section></>);
}
