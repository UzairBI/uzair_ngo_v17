import { useEffect, useRef } from "react";

/**
 * Supporter / partner logos. Files live in public/images/partners/.
 * To add one: drop the logo in that folder and add a line here. Order here = order on screen.
 */
const partners = [
  { file: "vani.png", name: "VANI" },
  { file: "sap.png", name: "SAP" },
  { file: "mpvha.png", name: "MPVHA" },
  { file: "jan-abhiyan-parishad.png", name: "Jan Abhiyan Parishad" },
  { file: "kone.png", name: "KONE" },
  { file: "jiv-daya-foundation.png", name: "Jiv Daya Foundation" },
  { file: "impactguru.png", name: "ImpactGuru" },
  { file: "captains.png", name: "Captains" },
  { file: "biomet.png", name: "Biomet" },
  { file: "mp-panchayat-rural-development.png", name: "Panchayat and Rural Development Department, Madhya Pradesh" },
  { file: "ministry-of-culture.png", name: "Ministry of Culture" },
  { file: "national-urban-livelihoods-mission.png", name: "National Urban Livelihoods Mission" },
  { file: "sgsy-rural-development.png", name: "SGSY, Ministry of Rural Development" },
  { file: "rajya-shiksha-kendra.png", name: "Rajya Shiksha Kendra" },
  { file: "partner-15.png", name: "Supporter" }
];

// two copies so the strip is always longer than the screen and loops without a gap
const loop = [...partners, ...partners];
const SPEED = 55; // px per second, right to left

/** Logos glide right-to-left along an arc: highest and largest in the middle, dipping and tilting towards the edges. */
export default function SupportersArc() {
  const box = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let offset = 0, last = performance.now(), paused = false, raf = 0;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused && !still) offset += SPEED * dt;

      const W = el.clientWidth;
      const small = W < 640;
      const gap = small ? 150 : 215;
      const cardW = small ? 124 : 176;
      const depth = Math.max(36, Math.min(96, W * 0.085));
      const total = loop.length * gap;
      el.style.height = `${depth + (small ? 96 : 122)}px`;

      cards.current.forEach((card, n) => {
        if (!card) return;
        const x = ((((n * gap - offset) % total) + total) % total) - gap; // centre of the card
        if (x > W + gap) { card.style.visibility = "hidden"; return; }
        const p = (x - W / 2) / (W / 2); // -1 (left edge) .. 0 (middle) .. 1 (right edge)
        const y = depth * Math.min(1.6, p * p);
        const scale = 1 - 0.16 * Math.min(1, p * p);
        card.style.visibility = "visible";
        card.style.width = `${cardW}px`;
        card.style.opacity = String(Math.max(0, 1.25 - Math.abs(p) * 0.55));
        card.style.transform = `translate3d(${x - cardW / 2}px, ${y}px, 0) rotate(${p * 13}deg) scale(${scale})`;
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const stop = () => { paused = true; };
    const go = () => { paused = false; };
    el.addEventListener("mouseenter", stop);
    el.addEventListener("mouseleave", go);
    return () => { cancelAnimationFrame(raf); el.removeEventListener("mouseenter", stop); el.removeEventListener("mouseleave", go); };
  }, []);

  return (
    <div ref={box} className="relative w-full overflow-hidden pt-3"
      style={{ maskImage: "linear-gradient(to right, transparent, #000 9%, #000 91%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, #000 9%, #000 91%, transparent)" }}>
      {loop.map((p, n) => (
        <div key={n} ref={(node) => { cards.current[n] = node; }} aria-hidden={n >= partners.length}
          className="absolute left-0 top-3 flex h-[72px] items-center justify-center rounded-2xl bg-white px-3 py-2 shadow-[0_10px_30px_-14px_rgba(11,79,156,.45)] ring-1 ring-brand/10 will-change-transform sm:h-[92px] sm:px-4"
          style={{ visibility: "hidden" }}>
          <img src={`/images/partners/${p.file}`} alt={n < partners.length ? p.name : ""} loading="lazy" draggable={false} className="max-h-full max-w-full object-contain" />
        </div>
      ))}
    </div>
  );
}
