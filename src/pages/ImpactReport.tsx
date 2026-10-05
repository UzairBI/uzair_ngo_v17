import { documents } from "../data/documents";
import { useTitle } from "../hooks/useTitle";
import { useLang } from "../i18n/LangContext";
import PageHero from "../components/PageHero";
import Reveal from "../components/Reveal";
import { ImpactDashboard, KeyFigures } from "../components/ImpactShowcase";

/** The full report (PDF) that "View more" opens: the first "reports" entry in src/data/documents.ts. */
const report = documents.find((d) => d.section === "reports");

/** Impact Report page: the same two impact blocks as the Home page, then the full report. */
export default function ImpactReport() {
  const { t } = useLang();
  useTitle("Impact Report");
  return (
    <>
      <PageHero eyebrow={t("Transparency & Reports")} title={t("Impact Report")} text={t("Two decades of service, measured in the lives it reached.")} />

      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#f3f8fe] via-white to-[#eef5fd] pb-14 md:pb-16">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 -z-10 h-80 w-80 rounded-full bg-sky/20 blur-3xl" />
        <div className="container-site"><KeyFigures /></div>
      </section>

      <section className="bg-brand-light py-12 md:py-14">
        <ImpactDashboard />
      </section>

      {report && (
        <section className="container-site py-14 md:py-16">
          <Reveal>
            <div className="mx-auto max-w-3xl rounded-3xl bg-white p-7 text-center shadow-[0_20px_50px_-28px_rgba(11,61,122,.35)] ring-1 ring-ink/5 sm:p-10">
              <p className="eyebrow">PDF{report.pages ? ` · ${report.pages} pages` : ""} · {report.size}{report.year ? ` · ${report.year}` : ""}</p>
              <h2 className="h2 mt-2">{report.title}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-ink/70">{report.description}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a href={report.file} target="_blank" rel="noreferrer" className="btn btn-brand">{t("View more")} <span aria-hidden="true">→</span></a>
                <a href={report.file} download className="btn border-2 border-brand text-brand">{t("Download")}</a>
              </div>
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}
