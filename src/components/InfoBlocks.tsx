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
            <li className="relative h-full rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-ink/5">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-dark to-brand font-bold text-white">{i + 1}</span>
              <h3 className="mt-4 font-serif text-lg font-bold text-brand-dark">{h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{p}</p>
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

/** Accordion FAQ (native <details>, so it works without JavaScript state). */
export function Faq({ title = "Frequently asked questions", items, className = "" }: { title?: string; items: [string, string][]; className?: string }) {
  return (
    <section className={`container-site py-14 md:py-16 ${className}`}>
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">FAQ</p>
          <h2 className="h2 mt-2">{title}</h2>
        </div>
      </Reveal>
      <div className="mx-auto mt-8 max-w-3xl space-y-3">
        {items.map(([q, a]) => (
          <details key={q} className="group rounded-2xl border border-ink/10 bg-white px-5 py-4 open:shadow-md">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
              {q}
              <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
