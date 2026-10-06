import { useTitle } from "../hooks/useTitle";
import { usePageText } from "../hooks/usePageText";
import { useLang } from "../i18n/LangContext";
import PageHero from "../components/PageHero";
import SmartForm from "../components/SmartForm";
export default function GetInvolved() {
  const { t } = useLang();
  const c = usePageText();
  useTitle("Get Involved");
  return (
    <>
      <PageHero eyebrow={t("Get Involved")} title={c("involved.hero.title")} text={c("involved.hero.text")} />
      <section className="container-site grid gap-8 py-16 lg:grid-cols-2">
        <div id="volunteer" className="rounded-2xl border p-6">
          <h2 className="font-serif text-2xl font-bold">{c("involved.volunteer.title")}</h2>
          <p className="justified mb-4 mt-1 text-sm text-ink/70">{c("involved.volunteer.text")}</p>
          <SmartForm kind="Volunteer sign-up" submitLabel="Volunteer with us" table="volunteers"
            fields={[{ name: "name", label: "Full name", required: true, placeholder: "Your full name" }, { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "98765 43210" }, { name: "email", label: "Email", type: "email", placeholder: "you@example.com (optional)" },
              { name: "area", label: "Area of interest", type: "select", options: ["Child education", "Health camps", "Women empowerment", "Tree plantation", "Relief drives", "Anywhere needed"] },
              { name: "message", label: "Message", type: "textarea", placeholder: "Tell us about your skills or availability (optional)" }]} />
        </div>
        <div id="csr" className="rounded-2xl border p-6">
          <h2 className="font-serif text-2xl font-bold">{c("involved.enquiry.title")}</h2>
          <p className="justified mb-4 mt-1 text-sm text-ink/70">{c("involved.enquiry.text")}</p>
          <SmartForm kind="CSR enquiry" submitLabel="Send enquiry"
            fields={[{ name: "company", label: "Company name", required: true, placeholder: "Your company or foundation" }, { name: "name", label: "Contact person", required: true, placeholder: "Full name" }, { name: "email", label: "Email", type: "email", required: true, placeholder: "name@company.com" },
              { name: "phone", label: "Phone", type: "tel", placeholder: "98765 43210 (optional)" }, { name: "message", label: "How would you like to partner?", type: "textarea", placeholder: "Tell us about your CSR focus area or budget (optional)" }]} />
        </div>
      </section>
    </>
  );
}
