import { Link } from "react-router-dom";
import { posts } from "../data/news";
import { useTitle } from "../hooks/useTitle";
import { usePageText } from "../hooks/usePageText";
import { useLang } from "../i18n/LangContext";
import Img from "../components/Img";
import PageHero from "../components/PageHero";
import Reveal from "../components/Reveal";
export const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function News() {
  const { t } = useLang();
  const c = usePageText();
  useTitle("News & Updates");
  return (
    <>
      <PageHero eyebrow={t("News & Updates")} title={c("news.hero.title")} text={c("news.hero.text")} />
      <section className="container-site grid gap-6 py-16 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p, i) => (
          <Reveal key={p.slug} delay={i * 80}>
            <Link to={`/news/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <Img file={p.image} alt={p.title} className="aspect-[16/10] w-full shrink-0 transition duration-500 group-hover:scale-105" />
              <div className="flex flex-1 flex-col p-5">
                <p className="eyebrow">{p.category} · {fmtDate(p.date)}</p>
                <h2 className="mt-2 font-serif text-lg font-bold">{p.title}</h2>
                <p className="justified mt-2 text-sm text-ink/70">{p.excerpt}</p>
                <span className="mt-auto inline-block pt-3 text-sm font-semibold text-brand">{t("Read more")} →</span>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>
    </>
  );
}
