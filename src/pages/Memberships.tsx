import { site } from "../data/site";
import { useTitle } from "../hooks/useTitle";
import { usePageText } from "../hooks/usePageText";
import { useMemberOrganizations } from "../hooks/useLiveData";
import PageHero from "../components/PageHero";
import Reveal from "../components/Reveal";
import OrganizationApplyForm from "../components/OrganizationApplyForm";

/** The organisations of the Samiti's network, as published in the admin panel (Member Organizations), and how to join it. */
export default function Memberships() {
  const c = usePageText();
  useTitle("Memberships", c("memberships.hero.text"));
  const list = useMemberOrganizations();
  return (
    <>
      <PageHero images={["/assets/images/member-id-banner.jpg"]} imgClassName="object-[center_42%]" eyebrow="Membership" title={c("memberships.hero.title")} text={c("memberships.hero.text")} />

      <section className="bg-gradient-to-b from-[#f3f8fe] via-white to-white py-12 md:py-16">
        <div className="container-site">
          <p className="eyebrow">{c("memberships.list.eyebrow")}</p>
          <h2 className="h2 mt-2">{c("memberships.list.title")}</h2>
          <p className="mt-3 max-w-3xl text-ink/70">{c("memberships.list.text")}</p>
          {list.length === 0 ? <p className="mt-8 rounded-2xl border-2 border-dashed border-ink/15 bg-white p-6 text-center text-ink/60">{c("memberships.list.empty")}</p> : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((o, i) => (
                <Reveal key={o.id} delay={(i % 3) * 80}>
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl">
                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand to-sky-400 transition-transform duration-300 group-hover:scale-x-100" />
                    <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 font-serif text-lg font-bold text-brand-dark">{o.name.trim().charAt(0).toUpperCase()}</span>
                    <h3 className="mt-4 font-serif text-xl font-bold leading-snug text-ink">{o.name}</h3>
                    {o.location && (
                      <p className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-brand-dark">
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.1-7-11a7 7 0 0114 0c0 4.9-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                        <span>{o.location}</span>
                      </p>
                    )}
                    {o.description && <p className="mt-3 text-sm leading-relaxed text-ink/70">{o.description}</p>}
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* An organization applies here; it joins the list above once an admin approves it (admin panel -> Member Organizations). */}
      <section id="apply" className="scroll-mt-24 bg-white py-12 md:py-16">
        <div className="container-site grid items-start gap-8 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:gap-12">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow">{c("memberships.apply.eyebrow")}</p>
            <h2 className="h2 mt-2">{c("memberships.apply.title")}</h2>
            <p className="mt-3 text-ink/70">{c("memberships.apply.text")}</p>
            <ol className="mt-6 grid gap-3">
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex gap-3 rounded-2xl bg-brand-light p-4">
                  <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{n}</span>
                  <p className="text-sm leading-snug text-ink/75"><span className="font-semibold text-brand-dark">{c(`memberships.apply.step.${n}.title`)}</span><br />{c(`memberships.apply.step.${n}.text`)}</p>
                </li>
              ))}
            </ol>
          </div>
          <OrganizationApplyForm />
        </div>
      </section>

      <section className="container-site pb-16 md:pb-24">
        <div className="rounded-3xl bg-gradient-to-br from-[#08305f] to-brand p-8 text-center text-white shadow-xl sm:p-12">
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">{c("memberships.join.title")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/85">{c("memberships.join.text")}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a href={`mailto:${site.email}`} className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark shadow transition hover:bg-sky-50"><span>Contact:</span> <span data-no-translate>{site.email}</span></a>
            <a href="#apply" className="rounded-full border-2 border-white/70 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Apply for Membership</a>
          </div>
        </div>
      </section>
    </>
  );
}
