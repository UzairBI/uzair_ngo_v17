import { useRef } from "react";
import { Link } from "react-router-dom";
import { projects } from "../data/content";
import { usePageText } from "../hooks/usePageText";
import Img from "./Img";
import DonateButton from "./DonateButton";
export default function ProjectSlider() {
  const c = usePageText();
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 340, behavior: "smooth" });
  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-xs text-ink/60">
        <span>Swipe through active programs</span><span>01 / {String(projects.length).padStart(2, "0")}</span>
      </div>
      <div className="relative">
        <div ref={ref} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4" tabIndex={0} aria-label="Projects carousel">
          {projects.map((p, i) => (
            <article key={p.slug} className="w-[min(300px,84vw)] flex shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-white shadow-sm md:w-[330px]">
              <Img file={p.image} alt={`${c(`project.${p.slug}.title`)} project activity`} className="h-48 w-full shrink-0" />
              <div className="flex flex-1 flex-col p-5">
                <p className="eyebrow">0{i + 1} · {p.category}</p>
                <h3 className="mt-2 font-serif text-lg font-bold">{c(`project.${p.slug}.title`)}</h3>
                <p className="mt-2 text-sm text-ink/70">{c(`project.${p.slug}.text`)}</p>
                <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                  <Link to={`/projects/${p.slug}`} className="btn btn-brand justify-center whitespace-nowrap !px-3 !py-2">Learn Details</Link>
                  <DonateButton to={`/donate${p.detail?.donateCause ? `?cause=${encodeURIComponent(p.detail.donateCause)}` : ""}`} variant="outline" size="sm" className="justify-center">Sponsor</DonateButton>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button aria-label="Previous" onClick={() => scroll(-1)} className="h-11 w-11 rounded-full border">←</button>
          <button aria-label="Next" onClick={() => scroll(1)} className="h-11 w-11 rounded-full border">→</button>
        </div>
      </div>
    </div>
  );
}
