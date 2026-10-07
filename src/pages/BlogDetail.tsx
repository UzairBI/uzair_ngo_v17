import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTitle } from "../hooks/useTitle";
import { useBlogPosts } from "../hooks/useBlog";
import { useLang } from "../i18n/LangContext";
import { blogBlocks, blogDate, readMinutes, safeUrl } from "../data/blog";
import PageHero from "../components/PageHero";
import DonateButton from "../components/DonateButton";
import NotFound from "./NotFound";
import { BlogCard } from "./Blog";

/** Thin bar under the top edge of the window that fills as the post is read. */
function ReadingBar() {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const onScroll = () => { const max = document.documentElement.scrollHeight - window.innerHeight; setDone(max > 0 ? Math.min(1, window.scrollY / max) : 0); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-sky to-brand" style={{ transform: `scaleX(${done})` }} />;
}

export default function BlogDetail() {
  const { slug } = useParams();
  const { t } = useLang();
  const posts = useBlogPosts();
  const [copied, setCopied] = useState(false);
  const p = posts?.find((x) => x.slug === slug);
  useTitle(p?.title, p?.excerpt || undefined);
  if (!posts) return <p role="status" className="container-site py-24 text-center text-ink/60">{t("Loading…")}</p>;
  if (!p) return <NotFound />;

  const blocks = blogBlocks(p.body);
  const cover = safeUrl(p.cover_url), photo = safeUrl(p.photo_url);
  // the second photo sits after the first highlighted quote, or half-way down a post that has none
  const quoteAt = blocks.findIndex((b) => b.kind === "quote");
  const photoAfter = quoteAt >= 0 ? quoteAt : Math.max(0, Math.ceil(blocks.length / 2) - 1);
  const firstText = blocks.findIndex((b) => b.kind === "p");
  const more = posts.filter((x) => x.slug !== p.slug).slice(0, 3);
  const url = window.location.href;
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } };

  return (
    <>
      <ReadingBar />
      <PageHero eyebrow={`${t("Blog")} · ${t(p.category)}`} title={p.title} imgClassName="object-[72%_center] md:!left-auto md:!w-auto md:[mask-image:linear-gradient(to_right,transparent,black_38%)]" />

      <article className="container-site max-w-3xl py-10 md:py-14">
        {/* byline */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-5">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-lg font-bold text-white ring-4 ring-brand/10">{(p.author || "S").trim()[0].toUpperCase()}</span>
            <p className="text-sm leading-snug">
              <span className="block font-semibold text-ink">{p.author || "Sahara Jan Kalyan Samiti"}</span>
              <span className="text-ink/55">{blogDate(p.published_on)} <span aria-hidden="true">·</span> {readMinutes(p.body)} {t("min read")}</span>
            </p>
          </div>
          <span className="rounded-full bg-brand/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-dark">{t(p.category)}</span>
        </div>

        {cover && <img src={cover} alt="" decoding="async" className="mt-7 aspect-[16/9] w-full rounded-2xl object-cover shadow-lg" />}
        {p.excerpt && <p className="mt-8 rounded-r-xl border-l-4 border-brand bg-brand-light/60 px-5 py-4 text-left text-lg font-medium leading-relaxed text-ink/85 sm:text-xl">{p.excerpt}</p>}

        <div className="mx-auto mt-8 max-w-[42rem] text-[1.0625rem] leading-[1.85] text-ink/85">
          {blocks.map((b, i) => (
            <div key={i}>
              {b.kind === "h" ? <h2 className="mb-3 mt-12 border-l-4 border-brand pl-4 text-left font-serif text-xl font-bold leading-snug text-ink sm:text-2xl">{b.text}</h2>
                : b.kind === "quote" ? <blockquote className="relative my-10 rounded-2xl border border-brand/15 bg-gradient-to-br from-brand-light to-white px-7 py-8 text-left font-quote text-xl italic leading-relaxed text-brand-dark sm:px-10 sm:text-2xl"><span aria-hidden="true" className="absolute left-5 top-1 font-serif text-6xl leading-none text-brand/25">“</span><span className="relative">{b.text}</span></blockquote>
                : <p className={`mt-6 whitespace-pre-line text-left ${i === firstText ? "first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-6xl first-letter:font-bold first-letter:leading-[.85] first-letter:text-brand" : ""}`}>{b.text}</p>}
              {photo && i === photoAfter && (
                <figure className="my-10">
                  <img src={photo} alt={p.photo_caption || ""} loading="lazy" decoding="async" className="w-full rounded-2xl object-cover shadow-md" />
                  {p.photo_caption && <figcaption className="mt-3 border-l-2 border-brand/40 pl-3 text-left text-sm text-ink/60">{p.photo_caption}</figcaption>}
                </figure>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6 text-sm">
          <span className="font-semibold text-ink/70">{t("Share")}:</span>
          <a className="rounded-full bg-[#25D366] px-4 py-2 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-md" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(p.title + " " + url)}`}>WhatsApp</a>
          <a className="rounded-full bg-[#1877F2] px-4 py-2 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-md" target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>Facebook</a>
          <button type="button" onClick={copy} className="rounded-full border border-ink/15 px-4 py-2 font-semibold transition hover:border-brand hover:text-brand">{copied ? "Copied ✓" : t("Copy link")}</button>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-[#0b2a55] via-[#0d3b7a] to-[#1479d1] p-6 text-center text-white sm:flex-row sm:text-left">
          <p className="max-w-xs font-serif text-lg font-bold leading-snug">Help us reach more families like these.</p>
          <div className="flex flex-wrap justify-center gap-3"><DonateButton to="/donate">{t("Donate Now")}</DonateButton><Link to="/blog" className="btn border border-white/40 bg-white/10 text-white hover:bg-white/20">← {t("Back to all posts")}</Link></div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="bg-gradient-to-b from-[#f3f8fe] to-white py-12 md:py-16">
          <div className="container-site">
            <h2 className="h2">{t("More from the blog")}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{more.map((x) => <BlogCard key={x.slug} post={x} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
