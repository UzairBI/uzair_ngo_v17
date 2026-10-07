import { Link } from "react-router-dom";
import { ways, csrReadiness } from "../data/content";
import { reg12A, reg80G, fcraReg, darpanId, legalIds } from "../data/site";
import { useTitle } from "../hooks/useTitle";
import { usePageText } from "../hooks/usePageText";
import { useLang } from "../i18n/LangContext";
import PageHero from "../components/PageHero";
import SmartForm from "../components/SmartForm";
import { Steps, Highlights, Faq } from "../components/InfoBlocks";
export default function GetInvolved() {
  const { t } = useLang();
  const c = usePageText();
  useTitle("Get Involved");
  return (
    <>
      <PageHero eyebrow={t("Get Involved")} title="Volunteer & CSR Partnerships" text="Whether you donate, volunteer, partner via corporate CSR, or sponsor a cause, your involvement reaches lives directly." />
      <section className="container-site grid gap-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {ways.map((w) => (
          <Link key={w.title} to={w.href} className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand to-sky-400 transition-transform duration-300 group-hover:scale-x-100" />
            <h2 className="font-serif text-lg font-bold text-ink">{w.title}</h2>
            <span aria-hidden="true" className="mt-3 block h-px w-8 bg-brand/40 transition-all duration-300 group-hover:w-14" />
            <p className="mt-3 text-left text-sm leading-relaxed text-ink/65">{w.text}</p>
            <span className="mt-auto flex items-center justify-between pt-5 text-sm font-semibold text-brand">
              {w.cta}
              <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 transition duration-300 group-hover:translate-x-1 group-hover:bg-brand group-hover:text-white">→</span>
            </span>
          </Link>
        ))}
      </section>
      <Steps eyebrow="How it works" title="From first hello to your first field day" intro="Getting involved is simple. Here is what to expect once you reach out."
        steps={[["Reach out", "Fill in the volunteer or CSR form below, or call or WhatsApp our team."], ["We connect", "A team member contacts you to understand your interests, skills and availability."], ["Get matched", "You are matched to a programme: education, health camps, women's livelihoods, environment or relief."], ["Make a difference", "Join field activity with our team and see the work first-hand."]]} />
      <section id="csr-readiness" className="bg-brand-light py-14">
        <div className="container-site">
          <p className="eyebrow">{t("CSR & Donor Readiness")}</p>
          <h2 className="h2 mt-2">Compliance-ready for corporate, foundation and international partners</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[["12A", reg12A.value], ["80G", reg80G.value], ["FCRA", fcraReg.value], ["CSR-1", legalIds.find((l) => l.title.startsWith("CSR"))!.value], ["NGO Darpan", darpanId], ["UEI (SAM.gov)", legalIds.find((l) => l.title.startsWith("Unique"))!.value]].map(([k, v]) => (
              <div key={k} className="group flex items-center gap-4 rounded-xl border border-ink/5 bg-white px-4 py-3.5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand-dark transition-colors group-hover:bg-brand group-hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.500-3 8-7 10-4-2-7-5.500-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/50">{k}</p>
                  <p className="break-all font-mono text-sm font-semibold text-brand-dark">{v}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-10 text-xs font-semibold uppercase tracking-widest text-ink/50">Where we can partner</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {csrReadiness.map(([k, v], i) => (
              <div key={k} className="group relative overflow-hidden rounded-2xl border border-ink/5 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand to-sky-400 transition-transform duration-300 group-hover:scale-x-100" />
                <span className="font-serif text-2xl font-bold text-brand/25 transition-colors group-hover:text-brand">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-semibold leading-snug text-ink">{k}</h3>
                <p className="mt-1.5 text-left text-sm leading-relaxed text-ink/65">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/transparency?request=certificate#request" className="btn btn-brand">View registrations &amp; certificates</Link>
            <a href="/documents/SJKS-Impact-Report-2004-2025.pdf" target="_blank" rel="noreferrer" className="btn border-2 border-brand text-brand">Impact Report 2004–2025 (PDF)</a>
          </div>
        </div>
      </section>
      {/* section 1: volunteer registration */}
      <section id="volunteer" className="container-site scroll-mt-24 py-16 md:py-20">
        <div className="grid items-start gap-8 lg:grid-cols-5 lg:gap-12">
          <div className="lg:col-span-2 lg:sticky lg:top-28">
            <p className="eyebrow">Volunteer registration</p>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-ink md:text-4xl">{c("involved.volunteer.title")}</h2>
            <p className="mt-3 text-left text-base leading-relaxed text-ink/70">{c("involved.volunteer.text")}</p>
            <ul className="mt-6 space-y-3 text-sm text-ink/80">
              {["Education, health camps, women's livelihoods, plantation and relief", "Students and young professionals welcome, no experience needed", "Our team contacts you within a few working days"].map((x) => (
                <li key={x} className="flex gap-3"><span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">✓</span>{x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_20px_50px_-28px_rgba(11,61,122,.35)] sm:p-8 lg:col-span-3">
            <SmartForm strictPhone kind="Volunteer sign-up" submitLabel="Volunteer with us" table="volunteers"
              fields={[{ name: "name", label: "Full name", required: true, placeholder: "Your full name" }, { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "98765 43210" }, { name: "email", label: "Email", type: "email", placeholder: "you@example.com (optional)" },
                { name: "area", label: "Area of interest", type: "select", options: ["Child education", "Health camps", "Women empowerment", "Tree plantation", "Relief drives", "Anywhere needed"] },
                { name: "message", label: "Message", type: "textarea", placeholder: "Tell us about your skills or availability (optional)" }]} />
          </div>
        </div>
      </section>

      {/* section 2: corporate CSR enquiry */}
      <section id="csr" className="scroll-mt-24 bg-brand-light py-16 md:py-20">
        <div className="container-site grid items-start gap-8 lg:grid-cols-5 lg:gap-12">
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_20px_50px_-28px_rgba(11,61,122,.35)] sm:p-8 lg:col-span-3 lg:order-1 order-2">
            <SmartForm strictPhone kind="CSR enquiry" submitLabel="Send enquiry"
              fields={[{ name: "company", label: "Company name", required: true, placeholder: "Your company or foundation" }, { name: "name", label: "Contact person", required: true, placeholder: "Full name" }, { name: "email", label: "Email", type: "email", required: true, placeholder: "name@company.com" },
                { name: "phone", label: "Phone", type: "tel", placeholder: "98765 43210 (optional)" }, { name: "message", label: "How would you like to partner?", type: "textarea", placeholder: "Tell us about your CSR focus area or budget (optional)" }]} />
          </div>
          <div className="order-1 lg:order-2 lg:col-span-2 lg:sticky lg:top-28">
            <p className="eyebrow">Corporate partnership</p>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-ink md:text-4xl">{c("involved.enquiry.title")}</h2>
            <p className="mt-3 text-left text-base leading-relaxed text-ink/70">{c("involved.enquiry.text")}</p>
            <ul className="mt-6 space-y-3 text-sm text-ink/80">
              {["CSR-1, 12A, 80G and FCRA registered", "Defined goals, field reporting and documentation", "Certificates and reports shared on request"].map((x) => (
                <li key={x} className="flex gap-3"><span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">✓</span>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Highlights eyebrow="Ways to contribute" title="There is a role for everyone"
        items={[["Give your time", "Support learning centres, health camps, plantation drives and relief distribution."], ["Share a skill", "Teaching, medical help, design, photography, accounts or digital support are all welcome."], ["Partner as a company", "Co-create a CSR project with defined goals, field reporting and documentation."], ["Sponsor a cause", "Sponsor a child's education, a tree drive or a family kit."], ["Spread the word", "Follow us on social media and share our stories with your network."], ["Support from anywhere", "Donations and skill-based help do not need you to be in Sagar."]]} />
      <Faq items={[["Do I need prior experience to volunteer?", "No. Most field activities need willingness and time. Our team guides you on the day."], ["Can students volunteer?", "Yes. Students and young professionals are welcome. Contact us with your availability."], ["Is the Samiti eligible for CSR funding?", "Yes. We hold CSR-1 registration along with 12A, 80G and FCRA, listed above. Certificates are shared on request."], ["How soon will someone contact me?", "We aim to reply within a few working days. For something urgent, call or WhatsApp us."]]} />
    </>
  );
}
