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
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-lg font-bold text-white">{(p.author || "S").trim()[0].toUpperCase()}</span>
          <p className="text-sm leading-snug">
            <span className="block font-semibold text-ink">{p.author || "Sahara Jan Kalyan Samiti"}</span>
            <span className="text-ink/60">{blogDate(p.published_on)} <span aria-hidden="true">·</span> {readMinutes(p.body)} {t("min read")}</span>
          </p>
        </div>

        {cover && <img src={cover} alt="" decoding="async" className="mt-7 aspect-[16/9] w-full rounded-3xl object-cover shadow-[0_24px_50px_-30px_rgba(11,79,156,.6)]" />}
        {p.excerpt && <p className="mt-8 border-l-4 border-sky pl-5 font-quote text-lg italic leading-relaxed text-ink/80 sm:text-xl">{p.excerpt}</p>}

        <div className="mt-8 text-base leading-relaxed text-ink/80 sm:text-lg">
          {blocks.map((b, i) => (
            <div key={i}>
              {b.kind === "h" ? <h2 className="mb-3 mt-10 font-serif text-xl font-bold text-ink sm:text-2xl">{b.text}</h2>
                : b.kind === "quote" ? <blockquote className="my-9 rounded-2xl bg-brand-light px-6 py-7 text-center font-quote text-xl italic leading-relaxed text-brand-dark sm:px-10 sm:text-2xl">“{b.text}”</blockquote>
                : <p className={`mt-5 whitespace-pre-line ${i === firstText ? "first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-6xl first-letter:font-bold first-letter:leading-[.85] first-letter:text-brand" : ""}`}>{b.text}</p>}
              {photo && i === photoAfter && (
                <figure className="my-9">
                  <img src={photo} alt={p.photo_caption || ""} loading="lazy" decoding="async" className="w-full rounded-2xl object-cover shadow-md" />
                  {p.photo_caption && <figcaption className="mt-3 text-center text-sm text-ink/60">{p.photo_caption}</figcaption>}
                </figure>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t pt-6 text-sm">
          <span className="font-semibold">{t("Share")}:</span>
          <a className="rounded-full bg-[#25D366] px-4 py-2 font-semibold text-white" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(p.title + " " + url)}`}>WhatsApp</a>
          <a className="rounded-full bg-[#1877F2] px-4 py-2 font-semibold text-white" target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>Facebook</a>
          <button type="button" onClick={copy} className="rounded-full border px-4 py-2 font-semibold">{copied ? "Copied ✓" : t("Copy link")}</button>
        </div>
        <div className="mt-8 flex flex-wrap gap-3"><DonateButton to="/donate">{t("Donate Now")}</DonateButton><Link to="/blog" className="btn btn-brand">← {t("Back to all posts")}</Link></div>
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
