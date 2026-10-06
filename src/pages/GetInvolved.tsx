import { Link } from "react-router-dom";
import { ways, csrReadiness } from "../data/content";
import { reg12A, reg80G, fcraReg, darpanId, legalIds } from "../data/site";
import { useTitle } from "../hooks/useTitle";
import { useLang } from "../i18n/LangContext";
import PageHero from "../components/PageHero";
import SmartForm from "../components/SmartForm";
import { Steps, Highlights, Faq } from "../components/InfoBlocks";
export default function GetInvolved() {
  const { t } = useLang();
  useTitle("Get Involved");
  return (
    <>
      <PageHero eyebrow={t("Get Involved")} title="Volunteer & CSR Partnerships" text="Whether you donate, volunteer, partner via corporate CSR, or sponsor a cause, your involvement reaches lives directly." />
      <section className="container-site grid gap-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {ways.map((w) => <Link key={w.title} to={w.href} className="flex flex-col rounded-2xl border p-6 hover:shadow-lg"><h2 className="font-serif text-lg font-bold text-brand-dark">{w.title}</h2><p className="mt-2 text-sm text-ink/70">{w.text}</p><span className="mt-auto inline-block pt-3 text-sm font-semibold text-brand">{w.cta} →</span></Link>)}
      </section>
      <Steps eyebrow="How it works" title="From first hello to your first field day" intro="Getting involved is simple. Here is what to expect once you reach out."
        steps={[["Reach out", "Fill in the volunteer or CSR form below, or call or WhatsApp our team."], ["We connect", "A team member contacts you to understand your interests, skills and availability."], ["Get matched", "You are matched to a programme: education, health camps, women's livelihoods, environment or relief."], ["Make a difference", "Join field activity with our team and see the work first-hand."]]} />
      <section id="csr-readiness" className="bg-brand-light py-14">
        <div className="container-site">
          <p className="eyebrow">{t("CSR & Donor Readiness")}</p>
          <h2 className="h2 mt-2">Compliance-ready for corporate, foundation and international partners</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[["12A", reg12A.value], ["80G", reg80G.value], ["FCRA", fcraReg.value], ["CSR-1", legalIds.find((l) => l.title.startsWith("CSR"))!.value], ["NGO Darpan", darpanId], ["UEI (SAM.gov)", legalIds.find((l) => l.title.startsWith("Unique"))!.value]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white px-4 py-3"><p className="text-xs text-ink/60">{k}</p><p className="break-all font-mono text-sm font-semibold text-brand-dark">{v}</p></div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {csrReadiness.map(([k, v]) => <div key={k} className="rounded-2xl bg-white p-5"><h3 className="font-semibold">{k}</h3><p className="mt-1 text-sm text-ink/70">{v}</p></div>)}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/transparency?request=certificate#request" className="btn btn-brand">View registrations &amp; certificates</Link>
            <a href="/documents/SJKS-Impact-Report-2004-2025.pdf" target="_blank" rel="noreferrer" className="btn border-2 border-brand text-brand">Impact Report 2004–2025 (PDF)</a>
          </div>
        </div>
      </section>
      <section className="container-site grid gap-8 py-16 lg:grid-cols-2">
        <div id="volunteer" className="rounded-2xl border p-6">
          <h2 className="font-serif text-2xl font-bold">{t("Volunteer with us")}</h2>
          <p className="mb-4 mt-1 text-sm text-ink/70">Tell us how you would like to help and our team will contact you.</p>
          <SmartForm kind="Volunteer sign-up" submitLabel="Volunteer with us" table="volunteers"
            fields={[{ name: "name", label: "Full name", required: true, placeholder: "Your full name" }, { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "98765 43210" }, { name: "email", label: "Email", type: "email", placeholder: "you@example.com (optional)" },
              { name: "area", label: "Area of interest", type: "select", options: ["Child education", "Health camps", "Women empowerment", "Tree plantation", "Relief drives", "Anywhere needed"] },
              { name: "message", label: "Message", type: "textarea", placeholder: "Tell us about your skills or availability (optional)" }]} />
        </div>
        <div id="csr" className="rounded-2xl border p-6">
          <h2 className="font-serif text-2xl font-bold">Corporate CSR enquiry</h2>
          <p className="mb-4 mt-1 text-sm text-ink/70">Partner with us for verified, reportable impact.</p>
          <SmartForm kind="CSR enquiry" submitLabel="Send enquiry"
            fields={[{ name: "company", label: "Company name", required: true, placeholder: "Your company or foundation" }, { name: "name", label: "Contact person", required: true, placeholder: "Full name" }, { name: "email", label: "Email", type: "email", required: true, placeholder: "name@company.com" },
              { name: "phone", label: "Phone", type: "tel", placeholder: "98765 43210 (optional)" }, { name: "message", label: "How would you like to partner?", type: "textarea", placeholder: "Tell us about your CSR focus area or budget (optional)" }]} />
        </div>
      </section>
      <Highlights eyebrow="Ways to contribute" title="There is a role for everyone"
        items={[["Give your time", "Support learning centres, health camps, plantation drives and relief distribution."], ["Share a skill", "Teaching, medical help, design, photography, accounts or digital support are all welcome."], ["Partner as a company", "Co-create a CSR project with defined goals, field reporting and documentation."], ["Sponsor a cause", "Sponsor a child's education, a tree drive or a family kit."], ["Spread the word", "Follow us on social media and share our stories with your network."], ["Support from anywhere", "Donations and skill-based help do not need you to be in Sagar."]]} />
      <Faq items={[["Do I need prior experience to volunteer?", "No. Most field activities need willingness and time. Our team guides you on the day."], ["Can students volunteer?", "Yes. Students and young professionals are welcome. Contact us with your availability."], ["Is the Samiti eligible for CSR funding?", "Yes. We hold CSR-1 registration along with 12A, 80G and FCRA, listed above. Certificates are shared on request."], ["How soon will someone contact me?", "We aim to reply within a few working days. For something urgent, call or WhatsApp us."]]} />
    </>
  );
}
