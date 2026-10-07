import { documents } from "../data/documents";
import { Link } from "react-router-dom";
import { site } from "../data/site";
import { useLang } from "../i18n/LangContext";
import { useTitle } from "../hooks/useTitle";
import { usePageText } from "../hooks/usePageText";
import PageHero from "../components/PageHero";
import { transparencyImages } from "../data/slideshows";
import DocumentRequestForm from "../components/DocumentRequestForm";

export default function Transparency() {
  const { t } = useLang();
  const c = usePageText();
  useTitle("Transparency & Reports");
  const reports = documents.filter((d) => d.section === "reports");
  const steps = [1, 2, 3].map((n) => [c(`transparency.step.${n}.title`), c(`transparency.step.${n}.text`)]);
  return (
    <>
      <PageHero images={transparencyImages} eyebrow={t("Transparency & Reports")} title={c("transparency.hero.title")}
        text={c("transparency.hero.text")} />

      <section id="annual-reports" className="container-site border-b py-14">
        <p className="eyebrow">{t("Annual Reports")}</p>
        <h2 className="h2 mt-2">{c("transparency.reports.title")}</h2>
        <p className="justified mt-2 text-ink/70">{c("transparency.reports.text")}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {/* each card has its own colour (green = impact, rose red = annual reports) so the two are told apart at a glance.
              Both reports open a page of their own: the impact figures, and the year-by-year annual reports (managed in the admin panel) */}
          {reports.slice(0, 1).map((d) => (
            <article key={d.file} className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm">
              <p className="eyebrow !text-emerald-700">Impact{d.year ? ` · ${d.year}` : ""}</p>
              <h3 className="mt-2 font-serif text-lg font-bold">{d.title}</h3>
              <p className="justified mt-2 flex-1 text-sm text-ink/70">{d.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/transparency/impact-report" className="btn btn-brand !bg-emerald-700 !px-4 !py-2 !shadow-[0_2px_6px_rgb(4_120_87/.3)] hover:!bg-emerald-800">{t("View Impact Report")} <span aria-hidden="true">→</span></Link>
              </div>
            </article>
          ))}
          <article className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm">
            <p className="eyebrow !text-rose-700">Year by year · 2004 - 2025</p>
            <h3 className="mt-2 font-serif text-lg font-bold">{c("transparency.annual.title")}</h3>
            <p className="justified mt-2 flex-1 text-sm text-ink/70">{c("transparency.annual.text")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/transparency/annual-reports" className="btn btn-brand !bg-rose-700 !px-4 !py-2 !shadow-[0_2px_6px_rgb(190_18_60/.3)] hover:!bg-rose-800">{t("View Annual Reports")} <span aria-hidden="true">→</span></Link>
            </div>
          </article>
        </div>
      </section>

      <section id="request" className="bg-slate-50 py-14">
        <div className="container-site grid items-start gap-10 lg:grid-cols-[1fr_1.35fr]">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow">{t("Request documents")}</p>
            <h2 className="h2 mt-2">{c("transparency.request.title")}</h2>
            <p className="justified mt-3 text-ink/70">{c("transparency.request.text")}</p>
            <ol className="mt-6 space-y-4">
              {steps.map(([title, text], i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white">{i + 1}</span>
                  <span><strong className="block">{title}</strong><span className="justified block text-sm text-ink/70">{text}</span></span>
                </li>
              ))}
            </ol>
            <p className="justified mt-6 text-sm text-ink/60">Prefer to talk? Call <a className="font-semibold text-brand" href={site.phoneHref}>{site.phone}</a> or write to <a className="font-semibold text-brand" href={`mailto:${site.email}`}>{site.email}</a>. {c("transparency.request.note")}</p>
          </div>
          <DocumentRequestForm />
        </div>
      </section>
    </>
  );
}
