import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTitle } from "../hooks/useTitle";
import { useBlogPosts } from "../hooks/useBlog";
import { useLang } from "../i18n/LangContext";
import { blogDate, readMinutes, safeUrl, type BlogPost } from "../data/blog";
import PageHero from "../components/PageHero";
import Reveal from "../components/Reveal";

/** Cover photo of a post, or a soft blue panel with its first letter when it has none. */
export function BlogCover({ post, className = "" }: { post: BlogPost; className?: string }) {
  const url = safeUrl(post.cover_url);
  return url
    ? <img src={url} alt="" loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} />
    : <div aria-hidden="true" className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-brand to-brand-dark font-serif text-6xl font-bold text-white/80 ${className}`}>{post.title.trim()[0]}</div>;
}
/** "6 October 2026 · 3 min read" */
export function BlogMeta({ post, className = "" }: { post: BlogPost; className?: string }) {
  const { t } = useLang();
  return <p className={`text-xs font-medium text-ink/60 ${className}`}>{blogDate(post.published_on)} <span aria-hidden="true">·</span> {readMinutes(post.body)} {t("min read")}</p>;
}
export const blogBadge = "inline-flex rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand-dark";

export function BlogCard({ post }: { post: BlogPost }) {
  const { t } = useLang();
  return (
    <Link to={`/blog/${post.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_20px_40px_-22px_rgba(11,79,156,.5)]">
      <div className="aspect-[16/10] w-full shrink-0 overflow-hidden"><BlogCover post={post} className="transition duration-500 group-hover:scale-105" /></div>
      <div className="flex flex-1 flex-col p-5">
        <p><span className={blogBadge}>{t(post.category)}</span></p>
        <h3 className="mt-3 font-serif text-lg font-bold leading-snug">{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/70">{post.excerpt}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <BlogMeta post={post} />
          <span className="shrink-0 text-sm font-semibold text-brand">{t("Read more")} <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">→</span></span>
        </div>
      </div>
    </Link>
  );
}

export default function Blog() {
  const { t } = useLang();
  useTitle("Blog", "Stories, voices and lessons from the communities Sahara Jan Kalyan Samiti works with.");
  const posts = useBlogPosts();
  const [group, setGroup] = useState("all");
  const groups = useMemo(() => [...new Set((posts ?? []).map((p) => p.category))], [posts]);
  const list = !posts ? [] : group === "all" ? posts : posts.filter((p) => p.category === group);
  const [lead, ...rest] = list;
  const chip = (on: boolean) => `rounded-full px-4 py-2 text-sm font-semibold transition ${on ? "bg-brand text-white shadow" : "bg-white text-ink ring-1 ring-ink/10 hover:ring-brand/50"}`;

  return (
    <>
      <PageHero eyebrow={t("Blog")} title={t("Stories from the Field")} text={t("Voices, lessons and small victories from the communities we work with.")} imgClassName="object-[72%_center] md:!left-auto md:!w-auto md:[mask-image:linear-gradient(to_right,transparent,black_38%)]" />

      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#f3f8fe] via-white to-[#eef5fd] py-12 md:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 -z-10 h-80 w-80 rounded-full bg-sky/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-10 -z-10 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
        <div className="container-site">
          {!posts && <p role="status" className="py-16 text-center text-ink/60">{t("Loading…")}</p>}
          {posts && !posts.length && <p className="rounded-2xl bg-white p-8 text-center text-ink/70 shadow-sm ring-1 ring-ink/5">{t("Our first stories are being written. Please check back soon.")}</p>}

          {groups.length > 1 && (
            <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Show">
              <button type="button" className={chip(group === "all")} aria-pressed={group === "all"} onClick={() => setGroup("all")}>{t("All")} <span className="opacity-70">({posts!.length})</span></button>
              {groups.map((g) => (
                <button key={g} type="button" className={chip(group === g)} aria-pressed={group === g} onClick={() => setGroup(g)}>{t(g)} <span className="opacity-70">({posts!.filter((p) => p.category === g).length})</span></button>
              ))}
            </div>
          )}

          {lead && (
            <Reveal>
              <Link to={`/blog/${lead.slug}`} className="group grid overflow-hidden rounded-3xl border bg-white shadow-[0_24px_50px_-30px_rgba(11,79,156,.55)] transition duration-300 hover:border-brand/40 lg:grid-cols-2">
                <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[400px]">
                  <BlogCover post={lead} className="absolute inset-0 transition duration-700 group-hover:scale-105" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-dark shadow">{t("Latest story")}</span>
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
                  <p><span className={blogBadge}>{t(lead.category)}</span></p>
                  <h2 className="mt-4 font-serif text-2xl font-bold leading-tight sm:text-3xl lg:text-[2.1rem]">{lead.title}</h2>
                  {lead.excerpt && <p className="mt-4 leading-relaxed text-ink/70 sm:text-lg">{lead.excerpt}</p>}
                  <BlogMeta post={lead} className="mt-5" />
                  <p className="mt-6"><span className="btn btn-brand">{t("Read the story")} <span aria-hidden="true">→</span></span></p>
                </div>
              </Link>
            </Reveal>
          )}

          {rest.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p, i) => <Reveal key={p.slug} delay={Math.min(i, 5) * 70} className="h-full"><BlogCard post={p} /></Reveal>)}
            </div>
          )}

          {posts && posts.length > 0 && (
            <p className="mt-10 rounded-2xl bg-white p-5 text-sm text-ink/70 shadow-sm ring-1 ring-ink/5">
              {t("Have a story from the field you would like us to tell?")}{" "}
              <Link to="/contact" className="font-semibold text-brand hover:underline">{t("Write to us")} →</Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
