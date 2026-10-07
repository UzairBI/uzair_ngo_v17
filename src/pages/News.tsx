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
            <Link to={`/news/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-xl">
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-brand-light">
                <Img file={p.image} alt={p.title} className="h-full w-full transition duration-700 group-hover:scale-105" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-dark shadow-sm backdrop-blur">{p.category}</span>
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <p className="flex items-center gap-1.5 text-xs font-medium text-ink/50">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>
                  {fmtDate(p.date)}
                </p>
                <h2 className="mt-2 font-serif text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand-dark sm:text-xl">{p.title}</h2>
                <p className="mb-5 mt-2 line-clamp-3 text-left text-sm leading-relaxed text-ink/65">{p.excerpt}</p>
                <span className="mt-auto flex items-center justify-between border-t border-ink/10 pt-4 text-sm font-semibold text-brand">
                  {t("Read more")}
                  <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 transition duration-300 group-hover:translate-x-1 group-hover:bg-brand group-hover:text-white">→</span>
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>
    </>
  );
}
