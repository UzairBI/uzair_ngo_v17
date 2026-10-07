import { useCallback, useEffect, useRef, useState } from "react";
import Img from "./Img";
import { useLang } from "../i18n/LangContext";

export interface Photo { /** a file in /assets/images/, or a full address starting with / or https:// (photos listed in the admin panel) */ file: string; alt: string; cat: string }
const isFull = (file: string) => /^(https:\/\/|\/)/.test(file);
/** Address of a photo: a full address is used as it is, anything else is a file in /assets/images/. */
const photoSrc = (file: string) => (isFull(file) ? file : `/assets/images/${file}`);
/** One photo of the grid: a full address is shown as it is, a file name goes through Img (which shows a placeholder when the file is missing). */
const Pic = ({ file, alt, className }: { file: string; alt: string; className: string }) => (isFull(file)
  ? <img src={file} alt={alt} loading="lazy" decoding="async" className={`object-cover ${className}`} />
  : <Img file={file} alt={alt} className={className} />);

/** Filterable bento photo grid with a full-screen lightbox (arrows, Esc, arrow keys, thumbnail strip, and left / right swipe on touch screens). */
export default function Gallery({ photos }: { photos: Photo[] }) {
  const { t } = useLang();
  const cats = ["All", ...Array.from(new Set(photos.map((p) => p.cat)))];
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<number | null>(null);
  const list = cat === "All" ? photos : photos.filter((p) => p.cat === cat);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + list.length) % list.length)), [list.length]);

  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); };
    document.addEventListener("keydown", key);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = prev; };
  }, [open, step]);

  const touchX = useRef<number | null>(null);
  const cur = open !== null ? list[open] : null;
  return (
    <>
      <div className="mt-4 flex flex-col gap-4">
        <p className="max-w-xl text-ink/65 max-md:text-center">Moments from our field work: classrooms, health camps, villages and the people we serve.</p>
      </div>

      <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2 md:w-auto md:flex-wrap">
          {cats.map((c) => (
            <button key={c} type="button" onClick={() => { setCat(c); setOpen(null); }} aria-pressed={c === cat}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${c === cat ? "border-transparent bg-gradient-to-r from-brand-dark to-brand text-white shadow-lg shadow-brand/30" : "border-ink/10 bg-white text-ink/75 hover:border-brand/40 hover:bg-brand-light hover:text-brand-dark"}`}>
              {c === "All" ? t("All") : c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid auto-rows-[150px] grid-flow-dense grid-cols-2 gap-3 sm:auto-rows-[190px] md:grid-cols-3 md:gap-4 lg:auto-rows-[220px] lg:grid-cols-4">
        {list.map((p, i) => {
          const bento = cat === "All" && list.length >= 8;
          const big = bento && i % 7 === 0;
          const wide = bento && i % 7 === 4;
          return (
            <button key={p.file} type="button" onClick={() => setOpen(i)} aria-label={`Open photo: ${p.alt}`}
              className={`group relative block overflow-hidden rounded-2xl bg-brand-light shadow-sm ring-1 ring-ink/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/20 ${big ? "col-span-2 row-span-2" : ""} ${wide ? "md:col-span-2" : ""}`}>
              <Pic file={p.file} alt={p.alt} className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-110" />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#061a36]/85 via-[#061a36]/10 to-transparent opacity-70 transition group-hover:opacity-100" />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-dark backdrop-blur">{p.cat}</span>
              <span aria-hidden="true" className="absolute right-3 top-3 flex h-8 w-8 scale-75 items-center justify-center rounded-full bg-white/90 text-brand-dark opacity-0 transition group-hover:scale-100 group-hover:opacity-100">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="6" /><path d="m20 20-4-4M11 8v6M8 11h6" /></svg>
              </span>
              <span className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-left text-xs font-medium leading-snug text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100 max-md:line-clamp-2 sm:text-sm">{p.alt}</span>
            </button>
          );
        })}
      </div>

      {cur && (
        <div role="dialog" aria-modal="true" aria-label={cur.alt} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030d1e]/95 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const dx = touchX.current === null ? 0 : e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          }}>
          <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="absolute right-4 top-4 z-10 h-11 w-11 rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25">×</button>
          <button type="button" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25 sm:block">‹</button>
          <figure className="flex max-h-full max-w-5xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img src={photoSrc(cur.file)} alt={cur.alt} className="max-h-[62vh] w-auto rounded-2xl object-contain shadow-2xl ring-1 ring-white/15 sm:max-h-[70vh]" />
            <figcaption className="mt-4 text-center text-white">
              <span className="inline-block rounded-full bg-brand/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">{cur.cat}</span>
              <p className="mt-2 text-sm text-white/90 sm:text-base">{cur.alt}</p>
              <p className="mt-1 text-xs text-white/50">{(open ?? 0) + 1} / {list.length}</p>
            </figcaption>
          </figure>
          <div className="mt-3 flex max-w-full gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
            {list.map((p, i) => (
              <button key={p.file} type="button" aria-label={`Show photo ${i + 1}`} onClick={() => setOpen(i)}
                className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg transition ${i === open ? "opacity-100 ring-2 ring-sky-300" : "opacity-50 hover:opacity-90"}`}>
                <Pic file={p.file} alt="" className="h-full w-full" />
              </button>
            ))}
          </div>
          <button type="button" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25 sm:block">›</button>
        </div>
      )}
    </>
  );
}
