import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { useTitle } from "../hooks/useTitle";
import { usePageText } from "../hooks/usePageText";
import { useLang } from "../i18n/LangContext";
import { site } from "../data/site";
import { posts } from "../data/news";
import Gallery, { type Photo } from "../components/Gallery";
import PageHero from "../components/PageHero";
import { mediaImages } from "../data/slideshows";
import { fmtDate } from "./News";
/** The photos that ship with the website. The live list is managed in the admin panel (it started as a copy of this one,
 *  see supabase/migrations/20250120000000_gallery_photos_builtin.sql); this is what shows when the database cannot be reached. */
const photos: Photo[] = [
  { file: "field-1.jpg", alt: "Winter blanket and cloth drive", cat: "Social Relief" },
  { file: "field-3.jpg", alt: "Tailoring centre", cat: "Women Empowerment" },
  { file: "field-6.jpg", alt: "Health camp", cat: "Health" },
  { file: "field-9.jpg", alt: "Learning centre", cat: "Education" },
  { file: "plantation-campaign.webp", alt: "Tree plantation campaign", cat: "Environment" },
  { file: "solar-lantern-forest-edge.jpg", alt: "Solar lantern and charging panel handed to a family at the forest edge, Sagar district", cat: "Solar Lantern" },
  { file: "solar-lantern-rahli.jpg", alt: "Solar lantern distribution in a Rahli-block settlement with no electricity connection", cat: "Solar Lantern" },
  { file: "solar-lantern-hamlet.jpg", alt: "A woman receives a solar lantern in a low-lying, flood-prone hamlet", cat: "Solar Lantern" },
  // solar-lantern-mother-child.jpg is left out here so the Solar Lantern tab shows a full row of 3; it still appears on the Solar Lantern project page.
  // public/assets/images/gallery/education/ - Education
  { file: "gallery/education/classroom-students-uniform.jpg", alt: "Students in school uniform attending a classroom session", cat: "Education" },
  { file: "gallery/education/children-with-books-banner.jpg", alt: "Children holding books after a learning session at a community centre", cat: "Education" },
  { file: "gallery/education/children-learning-kits.jpg", alt: "Children seated with school bags and learning material at a village centre", cat: "Education" },
  { file: "gallery/education/learning-centre-session.jpg", alt: "A learning-centre session for children in a village", cat: "Education" },
  { file: "gallery/education/children-studying-centre.jpg", alt: "Children studying together at a Sahara learning centre", cat: "Education" },
  { file: "gallery/education/preschool-children-yellow-uniform.jpg", alt: "Pre-school children in yellow uniforms at a Sahara education and nutrition centre", cat: "Education" },
  // public/assets/images/gallery/health-nutrition/ - Health & nutrition
  { file: "gallery/health-nutrition/mother-infant-outreach.jpg", alt: "A mother holding her infant during a community outreach visit", cat: "Health" },
  { file: "gallery/health-nutrition/mother-infant-nutrition-centre.jpg", alt: "A mother with her infant at a community nutrition centre", cat: "Health" },
  { file: "gallery/health-nutrition/supplies-handover-centre.jpg", alt: "Supplies being handed over to children and mothers at a Sahara community centre", cat: "Health" },
  { file: "gallery/health-nutrition/women-children-awareness-session.jpg", alt: "Women and children gathered for a community awareness session", cat: "Women Empowerment" },
  { file: "gallery/health-nutrition/community-distribution-banner.jpg", alt: "Community gathering with supplies distributed under a Sahara banner", cat: "Health" },
  { file: "gallery/health-nutrition/child-nutrition-kit-handover.jpg", alt: "A nutrition kit handed to a mother at the pre-school education and child-nutrition programme", cat: "Health" },
  { file: "gallery/health-nutrition/child-nutrition-support.jpg", alt: "Supplementary nutrition handed to a child at the pre-school education and nutrition programme", cat: "Health" },
  { file: "gallery/health-nutrition/mothers-children-centre.jpg", alt: "Mothers and young children at a Sahara centre", cat: "Health" },
  { file: "gallery/health-nutrition/women-session-centre.jpg", alt: "Women attending a health and nutrition awareness session at a Sahara centre", cat: "Women Empowerment" },
  { file: "gallery/health-nutrition/health-checkup-bp.jpg", alt: "Blood-pressure check at a community health camp", cat: "Health" },
  { file: "gallery/health-nutrition/menstrual-hygiene-inauguration.jpg", alt: "A student addressing the inauguration of the menstrual-hygiene programme with KONE", cat: "Health" },
  { file: "gallery/health-nutrition/sanitary-vending-machine-school-1.jpg", alt: "A student using a sanitary pad vending machine installed in her school", cat: "Health" },
  { file: "gallery/health-nutrition/sanitary-vending-machine-school-2.jpg", alt: "Sanitary pad vending machine at a government school, part of the KONE partnership", cat: "Health" },
  // public/assets/images/gallery/environment/ - Environment. Replace these two green-setting photos with real plantation photos when you have them.
  { file: "gallery/environment/women-in-green-village-forest.jpg", alt: "Women of the community standing together among the trees of a green village", cat: "Environment" },
  { file: "gallery/environment/girls-cycling-forest-road.jpg", alt: "Girls cycling to school along a tree-lined forest road", cat: "Environment" },
  // public/assets/images/gallery/social-relief/ - Social relief
  { file: "gallery/social-relief/ration-kits-distribution.jpg", alt: "Ration kits laid out for distribution to families, with children seated in front", cat: "Social Relief" },
  { file: "gallery/social-relief/ration-clothes-tribal-women.jpg", alt: "Ration and clothes distribution for tribal women", cat: "Social Relief" },
  // public/assets/images/gallery/skill-development/ - Skill development (Project Kaushal)
  { file: "gallery/skill-development/kaushal-workshop-group.jpg", alt: "Project Kaushal: students and trainers after a job-readiness workshop", cat: "Skill Development" },
  { file: "gallery/skill-development/kaushal-training-hall.jpg", alt: "Project Kaushal: participants standing for a group activity in a training hall", cat: "Skill Development" },
  { file: "gallery/skill-development/kaushal-college-group-photo.jpg", alt: "Project Kaushal: college batch group photo", cat: "Skill Development" },
  { file: "gallery/skill-development/kaushal-batch-courtyard.jpg", alt: "Project Kaushal: batch photo with trainers on a college campus", cat: "Skill Development" },
  { file: "gallery/skill-development/kaushal-group-activity.jpg", alt: "Project Kaushal: group activity during a training session", cat: "Skill Development" },
  { file: "gallery/skill-development/kaushal-circle-activity.jpg", alt: "Project Kaushal: students taking part in a circle activity", cat: "Skill Development" },
  { file: "gallery/skill-development/kaushal-team-after-session.jpg", alt: "Project Kaushal: trainers and volunteers together after a session", cat: "Skill Development" },
  { file: "gallery/skill-development/kaushal-trainer-speaking.jpg", alt: "Project Kaushal: a trainer addressing students", cat: "Skill Development" },
  { file: "gallery/skill-development/kaushal-student-presentation.jpg", alt: "Project Kaushal: students presenting during a session", cat: "Skill Development" },
  { file: "gallery/skill-development/kaushal-campus-batch.jpg", alt: "Project Kaushal: training batch assembled in a college courtyard", cat: "Skill Development" },
  { file: "gallery/skill-development/kaushal-hall-group-photo.jpg", alt: "Project Kaushal: participants and faculty group photo in a hall", cat: "Skill Development" },
  // public/assets/images/gallery/csr-volunteering/ - CSR & volunteering
  { file: "gallery/csr-volunteering/sap-volunteers-group.jpg", alt: "SAP Labs volunteer team at a community volunteering session", cat: "CSR & Volunteering" },
  { file: "gallery/csr-volunteering/sap-volunteer-with-students.jpg", alt: "A SAP Labs volunteer with school children holding craft items", cat: "CSR & Volunteering" },
  { file: "gallery/csr-volunteering/sap-volunteering-activity.jpg", alt: "SAP Labs volunteers on a hands-on activity with children", cat: "CSR & Volunteering" },
  { file: "gallery/csr-volunteering/sap-volunteers-workshop.jpg", alt: "SAP Labs volunteers running a hands-on workshop", cat: "CSR & Volunteering" }
];
/** Published photos from the admin panel (table gallery_photos): uploads first (newest first), then the photos that came with the website.
 *  Empty while loading, or when Supabase is not set up / not reachable. */
function useGalleryPhotos(): Photo[] {
  const [list, setList] = useState<Photo[]>([]);
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    let alive = true;
    supabase.from("gallery_photos").select("image_url, caption, category").eq("published", true).order("created_at", { ascending: false }).order("id", { ascending: false })
      .then(({ data, error }) => { if (alive && !error && data) setList(data.map((p) => ({ file: p.image_url, alt: p.caption || p.category, cat: p.category }))); });
    return () => { alive = false; };
  }, []);
  return list;
}
interface Video { youtube_id: string; title: string; description?: string; /** chosen in the admin panel as the large tile */ featured?: boolean }
const videoFrame = "aspect-video overflow-hidden rounded-2xl border bg-black shadow";

/** Published videos from the admin panel (table gallery_videos). Empty while loading, or when Supabase is not set up / not reachable. */
function useGalleryVideos(): Video[] {
  const [videos, setVideos] = useState<Video[]>([]);
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    let alive = true;
    // "*" rather than a column list, so the gallery keeps working if the description column has not been added yet
    supabase.from("gallery_videos").select("*").eq("published", true).order("created_at").order("id")
      // the video chosen as the large tile goes first; the rest stay oldest first
      .then(({ data, error }) => { if (alive && !error && data) setVideos([...(data as Video[])].sort((a, b) => Number(!!b.featured) - Number(!!a.featured))); });
    return () => { alive = false; };
  }, []);
  return videos;
}

/** One small video: its YouTube thumbnail with a play button; the player itself only loads when it is clicked. */
function VideoCard({ v }: { v: Video }) {
  const [playing, setPlaying] = useState(false);
  const label = v.title || "Sahara Jan Kalyan Samiti video";
  return (
    <figure>
      <div className={`group relative ${videoFrame} transition duration-300 hover:-translate-y-1 hover:shadow-xl`}>
        {playing
          ? <iframe title={label} src={`https://www.youtube-nocookie.com/embed/${v.youtube_id}?autoplay=1&rel=0`} allowFullScreen className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          : (
            <button type="button" onClick={() => setPlaying(true)} aria-label={`Play video: ${label}`} className="block h-full w-full">
              <img src={`https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              <span aria-hidden="true" className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ff0000] text-white shadow-lg transition duration-300 group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </button>
          )}
      </div>
      {(v.title || v.description) && (
        <figcaption className="mt-2.5">
          {v.title && <span className="block font-semibold leading-snug text-ink">{v.title}</span>}
          {v.description && <span className="justified mt-1 block whitespace-pre-line text-sm leading-relaxed text-ink/70">{v.description}</span>}
        </figcaption>
      )}
    </figure>
  );
}

/** YouTube thumbnail: the large one when the video has it, otherwise the standard one (YouTube answers a missing large one with a tiny grey picture). */
function VideoThumb({ id, className }: { id: string; className: string }) {
  const [small, setSmall] = useState(false);
  return <img src={`https://i.ytimg.com/vi/${id}/${small ? "hqdefault" : "maxresdefault"}.jpg`} alt="" loading="lazy" decoding="async" className={className}
    onLoad={(e) => { if (!small && e.currentTarget.naturalWidth <= 120) setSmall(true); }} onError={() => setSmall(true)} />;
}

/** Two or more videos: the same bento grid as the photo gallery (first tile large, every 7th after it too). A tile opens the video in a full-screen player. */
function VideoGrid({ videos }: { videos: Video[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + videos.length) % videos.length)), [videos.length]);
  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); };
    document.addEventListener("keydown", key);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = prev; };
  }, [open, step]);
  const cur = open !== null ? videos[open] : null;
  const name = (v: Video) => v.title || "Sahara Jan Kalyan Samiti video";
  return (
    <>
      <div className="mt-6 grid auto-rows-[150px] grid-flow-dense grid-cols-2 gap-3 sm:auto-rows-[190px] md:grid-cols-3 md:gap-4 lg:auto-rows-[220px] lg:grid-cols-4">
        {videos.map((v, i) => {
          const big = i % 7 === 0;
          const wide = videos.length >= 8 && i % 7 === 4;
          return (
            <button key={v.youtube_id} type="button" onClick={() => setOpen(i)} aria-label={`Play video: ${name(v)}`}
              className={`group relative block overflow-hidden rounded-2xl bg-black shadow-sm ring-1 ring-ink/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/20 ${big ? "col-span-2 row-span-2" : ""} ${wide ? "md:col-span-2" : ""}`}>
              <VideoThumb id={v.youtube_id} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#061a36]/90 via-[#061a36]/15 to-transparent" />
              <span aria-hidden="true" className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ff0000] text-white shadow-lg transition duration-300 group-hover:scale-110 ${big ? "h-16 w-16" : "h-11 w-11"}`}>
                <svg viewBox="0 0 24 24" className={`ml-0.5 ${big ? "h-7 w-7" : "h-5 w-5"}`} fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </span>
              {v.title && <span className={`absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-left font-semibold leading-snug text-white ${big ? "text-base sm:p-4 sm:text-lg" : "text-xs sm:text-sm"}`}>{v.title}</span>}
            </button>
          );
        })}
      </div>

      {cur && (
        <div role="dialog" aria-modal="true" aria-label={name(cur)} className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#030d1e]/95 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="absolute right-4 top-4 z-10 h-11 w-11 rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25">×</button>
          <button type="button" aria-label="Previous video" onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25 sm:block">‹</button>
          <figure className="my-auto w-full max-w-4xl sm:px-14" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/15">
              <iframe key={cur.youtube_id} title={name(cur)} src={`https://www.youtube-nocookie.com/embed/${cur.youtube_id}?autoplay=1&rel=0`} allowFullScreen className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
            <figcaption className="mt-4 text-center text-white">
              {cur.title && <p className="font-semibold sm:text-lg">{cur.title}</p>}
              {cur.description && <p className="mx-auto mt-2 max-h-28 max-w-2xl overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-white/80">{cur.description}</p>}
              <p className="mt-2 text-xs text-white/50">{(open ?? 0) + 1} / {videos.length}</p>
            </figcaption>
          </figure>
          <button type="button" aria-label="Next video" onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25 sm:block">›</button>
        </div>
      )}
    </>
  );
}

export default function Media() {
  const { t } = useLang();
  const c = usePageText();
  useTitle("Media & Gallery");
  const videos = useGalleryVideos();
  const added = useGalleryPhotos();
  const uploads = `https://www.youtube.com/embed/videoseries?list=${site.youtubeChannelId.replace(/^UC/, "UU")}`;
  return (
    <>
      <PageHero images={mediaImages} eyebrow={t("Media & Gallery")} title={c("media.hero.title")} text={c("media.hero.text")} />
      <section id="photo-gallery" className="container-site py-16">
        <h2 className="h2">{c("media.photos.title")}</h2>
        {/* the list kept in the admin panel (Media & Gallery -> Photos); the built-in list below is only used until that has loaded or if it cannot be reached */}
        <Gallery photos={added.length ? added : photos} />
      </section>
      <section id="video-gallery" className="bg-slate-50 py-16">
        <div className="container-site">
          <h2 className="h2">{c("media.videos.title")}</h2>
          <p className="mt-2 max-w-2xl text-ink/70">Watch our work in the field: stories, events and messages from the communities we serve.</p>
          {/* Videos added in the admin panel (Media & Gallery -> Videos), oldest first. Two or more: a bento grid like the photo gallery,
              the first one large. Exactly one: a single card with its description. Until any are added (or if the database cannot be
              reached) the channel's latest uploads are shown in one small player. */}
          {videos.length > 1 ? <VideoGrid videos={videos} /> : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {videos.length === 1
                ? <VideoCard v={videos[0]} />
                : (
                  <div className={videoFrame}>
                    <iframe title="Sahara Jan Kalyan Samiti YouTube videos" src={uploads} loading="lazy" allowFullScreen className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  </div>
                )}
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <a className="btn btn-brand" href={site.social.youtube} target="_blank" rel="noreferrer">▶ {t("Watch on YouTube")}</a>
          </div>
        </div>
      </section>
      <section id="press-news" className="container-site py-16">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink/10 pb-4">
          <h2 className="h2">{c("media.press.title")}</h2>
          <Link to="/news" className="group inline-flex items-center gap-1.5 rounded-full border border-brand/30 px-4 py-1.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white">{t("Latest News")} <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.slug} to={`/news/${p.slug}`} className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl">
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand to-sky-400 transition-transform duration-300 group-hover:scale-x-100" />
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-dark">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>
                {fmtDate(p.date)}
              </span>
              <h3 className="mt-4 font-serif text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand-dark">{p.title}</h3>
              <p className="mb-5 mt-2 line-clamp-3 text-left text-sm leading-relaxed text-ink/65">{p.excerpt}</p>
              <span className="mt-auto flex items-center gap-1.5 border-t border-ink/10 pt-4 text-sm font-semibold text-brand">
                Read story <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
