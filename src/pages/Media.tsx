import { useEffect, useState } from "react";
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
const photos: Photo[] = [
  { file: "field-1.jpg", alt: "Winter blanket and cloth drive", cat: "Social Relief" },
  { file: "field-3.jpg", alt: "Tailoring centre", cat: "Women Empowerment" },
  { file: "field-6.jpg", alt: "Health camp", cat: "Health" },
  { file: "field-9.jpg", alt: "Learning centre", cat: "Education" },
  { file: "plantation-campaign.webp", alt: "Tree plantation campaign", cat: "Environment" },
  { file: "solar-lantern-forest-edge.jpg", alt: "Solar lantern and charging panel handed to a family at the forest edge, Sagar district", cat: "Solar Lantern" },
  { file: "solar-lantern-rahli.jpg", alt: "Solar lantern distribution in a Rahli-block settlement with no electricity connection", cat: "Solar Lantern" },
  { file: "solar-lantern-hamlet.jpg", alt: "A woman receives a solar lantern in a low-lying, flood-prone hamlet", cat: "Solar Lantern" },
  { file: "solar-lantern-mother-child.jpg", alt: "A mother holding her young child receives her family's solar lantern", cat: "Solar Lantern" },
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
  { file: "gallery/health-nutrition/women-children-awareness-session.jpg", alt: "Women and children gathered for a community awareness session", cat: "Health" },
  { file: "gallery/health-nutrition/community-distribution-banner.jpg", alt: "Community gathering with supplies distributed under a Sahara banner", cat: "Health" },
  { file: "gallery/health-nutrition/child-nutrition-kit-handover.jpg", alt: "A nutrition kit handed to a mother at the pre-school education and child-nutrition programme", cat: "Health" },
  { file: "gallery/health-nutrition/child-nutrition-support.jpg", alt: "Supplementary nutrition handed to a child at the pre-school education and nutrition programme", cat: "Health" },
  { file: "gallery/health-nutrition/mothers-children-centre.jpg", alt: "Mothers and young children at a Sahara centre", cat: "Health" },
  { file: "gallery/health-nutrition/women-session-centre.jpg", alt: "Women attending a health and nutrition awareness session at a Sahara centre", cat: "Health" },
  { file: "gallery/health-nutrition/health-checkup-bp.jpg", alt: "Blood-pressure check at a community health camp", cat: "Health" },
  { file: "gallery/health-nutrition/menstrual-hygiene-inauguration.jpg", alt: "A student addressing the inauguration of the menstrual-hygiene programme with KONE", cat: "Health" },
  { file: "gallery/health-nutrition/sanitary-vending-machine-school-1.jpg", alt: "A student using a sanitary pad vending machine installed in her school", cat: "Health" },
  { file: "gallery/health-nutrition/sanitary-vending-machine-school-2.jpg", alt: "Sanitary pad vending machine at a government school, part of the KONE partnership", cat: "Health" },
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
/** Published photos from the admin panel (table gallery_photos), newest first. Empty while loading, or when Supabase is not set up / not reachable. */
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
interface Video { youtube_id: string; title: string; description?: string }
const videoFrame = "aspect-video overflow-hidden rounded-2xl border bg-black shadow";

/** Published videos from the admin panel (table gallery_videos). Empty while loading, or when Supabase is not set up / not reachable. */
function useGalleryVideos(): Video[] {
  const [videos, setVideos] = useState<Video[]>([]);
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    let alive = true;
    // "*" rather than a column list, so the gallery keeps working if the description column has not been added yet
    supabase.from("gallery_videos").select("*").eq("published", true).order("created_at").order("id")
      .then(({ data, error }) => { if (alive && !error && data) setVideos(data as Video[]); });
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
        {/* photos added in the admin panel (Media & Gallery -> Photos) first, then the ones that ship with the website */}
        <Gallery photos={[...added, ...photos]} />
      </section>
      <section id="video-gallery" className="bg-slate-50 py-16">
        <div className="container-site">
          <h2 className="h2">{c("media.videos.title")}</h2>
          {/* Videos added in the admin panel (Video Gallery), oldest first, so a new one lands to the right of the earlier ones.
              Until any are added (or if the database cannot be reached) the channel's latest uploads are shown in one small player. */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.length > 0
              ? videos.map((v) => <VideoCard key={v.youtube_id} v={v} />)
              : (
                <div className={videoFrame}>
                  <iframe title="Sahara Jan Kalyan Samiti YouTube videos" src={uploads} loading="lazy" allowFullScreen className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              )}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a className="btn btn-brand" href={site.social.youtube} target="_blank" rel="noreferrer">▶ {t("Watch on YouTube")}</a>
          </div>
        </div>
      </section>
      <section id="press-news" className="container-site py-16">
        <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="h2">{c("media.press.title")}</h2><Link to="/news" className="text-sm font-semibold text-brand">{t("Latest News")} →</Link></div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {posts.map((p) => <Link key={p.slug} to={`/news/${p.slug}`} className="rounded-2xl border p-5 transition hover:shadow-lg"><p className="eyebrow">{fmtDate(p.date)}</p><h3 className="mt-2 font-serif font-bold">{p.title}</h3><p className="justified mt-2 text-sm text-ink/70">{p.excerpt}</p></Link>)}
        </div>
      </section>
    </>
  );
}
