import { useState } from "react";
import { Link } from "react-router-dom";
import { site } from "../data/site";
import Reveal from "./Reveal";

/** Numbered "how it works" cards. */
export function Steps({ eyebrow, title, intro, steps }: { eyebrow: string; title: string; intro?: string; steps: [string, string][] }) {
  return (
    <section className="container-site py-14 md:py-16">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="h2 mt-2">{title}</h2>
          {intro && <p className="mt-3 text-ink/70">{intro}</p>}
        </div>
      </Reveal>
      <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(([h, p], i) => (
          <Reveal key={h} delay={i * 80}>
            <li className="group relative h-full rounded-2xl border border-ink/10 bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg">
              {i < steps.length - 1 && <span aria-hidden="true" className="absolute -right-5 top-[3.4rem] hidden h-px w-5 border-t border-dashed border-brand/40 lg:block" />}
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 font-serif text-lg font-bold text-brand-dark ring-4 ring-brand/5 transition duration-300 group-hover:bg-brand group-hover:text-white">{i + 1}</span>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/40">Step {String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-1 font-serif text-lg font-bold text-ink">{h}</h3>
              <span aria-hidden="true" className="mx-auto mt-3 block h-px w-8 bg-brand/40 transition-all duration-300 group-hover:w-14" />
              <p className="mt-3 text-sm leading-relaxed text-ink/65">{p}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

/** Icon-less highlight tiles (title + sentence). */
export function Highlights({ eyebrow, title, items }: { eyebrow: string; title: string; items: [string, string][] }) {
  return (
    <section className="bg-brand-light py-14 md:py-16">
      <div className="container-site">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="h2 mt-2">{title}</h2>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(([h, p], i) => (
            <Reveal key={h} delay={i * 70}>
              <div className="h-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/5">
                <h3 className="font-semibold text-brand-dark">{h}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Accordion FAQ: centred heading and a single column of question cards (one open at a time). */
export function Faq({ title = "Frequently asked questions", items, className = "" }: { title?: string; items: [string, string][]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className={`relative overflow-hidden bg-gradient-to-b from-white via-[#f1f8ff] to-white py-16 md:py-20 ${className}`}>
      {/* themed background: dotted field and soft glows */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(20,121,209,.14)_1.2px,transparent_1.2px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]" />
      <span aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-sky-300/25 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="container-site relative">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">FAQ</p>
            <h2 className="h2 mx-auto mt-3">{title}</h2>
            <p className="mt-4 text-ink/70">Quick answers to the questions we hear most.</p>
          </div>
        </Reveal>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {items.map(([q, a], i) => {
            const on = open === i;
            return (
              <Reveal key={q} delay={i * 70}>
                <div className={`overflow-hidden rounded-2xl border bg-white transition duration-300 ${on ? "border-brand/40 shadow-[0_18px_40px_-26px_rgba(20,121,209,.55)]" : "border-ink/10 shadow-sm hover:border-brand/30"}`}>
                  <h3>
                    <button type="button" aria-expanded={on} aria-controls={`faq-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(on ? null : i)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5">
                      <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold tabular-nums transition duration-300 ${on ? "bg-gradient-to-br from-brand to-sky-500 text-white shadow-md" : "bg-brand-light text-brand-dark"}`}>{String(i + 1).padStart(2, "0")}</span>
                      <span className={`flex-1 text-base font-semibold leading-snug sm:text-[17px] ${on ? "text-brand-dark" : "text-ink"}`}>{q}</span>
                      <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition duration-300 ${on ? "rotate-180 bg-brand text-white" : "bg-brand-light text-brand"}`}>
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                      </span>
                    </button>
                  </h3>
                  {/* the grid-rows trick animates the height without measuring it */}
                  <div id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className={`grid transition-[grid-template-rows] duration-300 ease-out ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <p className="border-t border-ink/5 px-5 pb-5 pt-4 text-sm leading-relaxed text-ink/70 sm:pl-[4.75rem] sm:pr-6">{a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
          <p className="pt-4 text-center text-sm text-ink/60">
            Still have a question? <Link to="/contact" className="font-semibold text-brand underline-offset-4 hover:underline">Contact us</Link> or call <a href={site.phoneHref} className="font-semibold text-brand-dark hover:underline">{site.phone}</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
