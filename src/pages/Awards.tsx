import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTitle } from "../hooks/useTitle";
import { useLang } from "../i18n/LangContext";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { awardCategories, defaultAwards, type Award } from "../data/awards";
import PageHero from "../components/PageHero";
import Reveal from "../components/Reveal";

/** Only a file of this website or an https link is ever shown. */
const safeUrl = (u?: string | null) => (u && /^(\/(?!\/)|https:\/\/)/.test(u) ? u : null);
/** Badge colour per group (anything else gets the first one). */
const tones: Record<string, string> = {
  "Award / Recognition": "bg-amber-100 text-amber-800",
  Appreciation: "bg-rose-100 text-rose-700",
  "Recommendation Letter": "bg-sky-100 text-sky-800",
  "Government Reference": "bg-emerald-100 text-emerald-800",
  "Training Certificate": "bg-violet-100 text-violet-800"
};

/** Entries from the admin panel (table awards). Falls back to the list in src/data/awards.ts. */
function useAwards(): Award[] {
  const [list, setList] = useState<Award[]>(defaultAwards);
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    let alive = true;
    supabase.from("awards").select("id, category, title, description, image_url").eq("published", true)
      .order("sort_order").order("created_at", { ascending: false })
      .then(({ data, error }) => { if (alive && !error && data && data.length) setList(data); });
    return () => { alive = false; };
  }, []);
  return list;
}

/** Full-screen view of one certificate. Closes on the button, a click outside the picture, or Escape. */
function Lightbox({ award, onClose }: { award: Award; onClose: () => void }) {
  const url = safeUrl(award.image_url);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose]);
  if (!url) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={award.title} onClick={onClose}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-[#061a36]/90 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-4xl items-start justify-between gap-4 text-white">
        <p className="font-semibold leading-snug">{award.title}</p>
        <button type="button" autoFocus onClick={onClose} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl transition hover:bg-white/30">✕</button>
      </div>
      <img src={url} alt={`Certificate: ${award.title}`} onClick={(e) => e.stopPropagation()} className="max-h-[78vh] w-auto max-w-full rounded-xl bg-white object-contain shadow-2xl" />
      <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-sm font-semibold text-white underline-offset-4 hover:underline">Open full size ↗</a>
    </div>
  );
}

export default function Awards() {
  const { t } = useLang();
  useTitle("Awards & Recognition");
  const all = useAwards();
  const [group, setGroup] = useState("all");
  const [open, setOpen] = useState<Award | null>(null);
  // filter buttons: the known groups that are in use, then any other group typed in the admin panel
  const groups = useMemo(() => {
    const used = [...new Set(all.map((a) => a.category))];
    return [...awardCategories.filter((c) => used.includes(c)), ...used.filter((c) => !awardCategories.includes(c))];
  }, [all]);
  const list = group === "all" ? all : all.filter((a) => a.category === group);
  const chip = (on: boolean) => `rounded-full px-4 py-2 text-sm font-semibold transition ${on ? "bg-brand text-white shadow" : "bg-white text-ink ring-1 ring-ink/10 hover:ring-brand/50"}`;

  return (
    <>
      <PageHero eyebrow={t("About Us")} title={t("Awards & Recognition")} text={t("Trusted by the hospitals, government departments, colleges and banks we work with.")} />

      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#f3f8fe] via-white to-[#eef5fd] py-12 md:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 -z-10 h-80 w-80 rounded-full bg-sky/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-10 -z-10 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
        <div className="container-site">
          <p className="eyebrow">{t("Awards & Recognition")}</p>
          <h2 className="h2 mt-2">{t("Awards, Recognition & Recommendation Letters")}</h2>
          <p className="mt-2 max-w-3xl text-ink/70">Sahara Jan Kalyan Samiti has been recognized and recommended by government departments, educational institutions, hospitals, financial institutions, and community organizations for its contribution to healthcare, education, women empowerment, community development, and social welfare initiatives.</p>

          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Show">
            <button type="button" className={chip(group === "all")} aria-pressed={group === "all"} onClick={() => setGroup("all")}>{t("All")} <span className="opacity-70">({all.length})</span></button>
            {groups.map((g) => (
              <button key={g} type="button" className={chip(group === g)} aria-pressed={group === g} onClick={() => setGroup(g)}>{t(g)} <span className="opacity-70">({all.filter((a) => a.category === g).length})</span></button>
            ))}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a, i) => {
              const url = safeUrl(a.image_url);
              return (
                <Reveal key={a.id ?? a.title} delay={Math.min(i, 5) * 70} className="h-full">
                  <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_20px_40px_-22px_rgba(11,79,156,.5)]">
                    {url ? (
                      <button type="button" onClick={() => setOpen(a)} aria-label={`${t("View Certificate")}: ${a.title}`} className="relative block h-52 w-full overflow-hidden bg-slate-100">
                        <img src={url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105" />
                        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-[#061a36]/0 text-sm font-semibold text-white opacity-0 transition duration-300 group-hover:bg-[#061a36]/45 group-hover:opacity-100">{t("View Certificate")}</span>
                      </button>
                    ) : (
                      <div aria-hidden="true" className="flex h-52 w-full items-center justify-center bg-gradient-to-br from-brand-light to-white text-5xl">🏅</div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <p><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[a.category] ?? tones["Award / Recognition"]}`}>{t(a.category)}</span></p>
                      <h3 className="mt-3 font-serif text-lg font-bold leading-snug">{a.title}</h3>
                      {a.description && <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70">{a.description}</p>}
                      {url && <p className="mt-4"><button type="button" onClick={() => setOpen(a)} className="btn btn-brand !px-4 !py-2">{t("View Certificate")}</button></p>}
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>

          <p className="mt-10 rounded-2xl bg-white p-5 text-sm text-ink/70 shadow-sm ring-1 ring-ink/5">
            {t("Need a certified copy of a registration certificate or an audit report?")}{" "}
            <Link to="/transparency#request" className="font-semibold text-brand hover:underline">{t("Request documents")} →</Link>
          </p>
        </div>
      </section>

      {open && <Lightbox award={open} onClose={() => setOpen(null)} />}
    </>
  );
}
