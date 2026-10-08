import { useEffect, useRef } from "react";

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const ease = (p: number) => p * p * (3 - 2 * p); // gentle at both ends, so the ribbon follows the scroll evenly

/**
 * Two white ribbons across the corners of a section (top left and bottom right), drawn as the visitor scrolls through it:
 * the top-left one runs downwards from the top edge, the bottom-right one runs upwards from the bottom edge.
 * Put it first inside a section that is `relative overflow-hidden`; the section's content needs `relative` to stay above it.
 */
export default function CornerRibbons() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ref.current, section = box?.parentElement;
    if (!box || !section) return;
    const draw = (group: string, p: number) => box.querySelectorAll<SVGPathElement>(`[data-ribbon="${group}"]`).forEach((path) => { path.style.strokeDashoffset = String(1 - p); });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { draw("top", 1); draw("bottom", 1); return; }
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = section.getBoundingClientRect();
      // 0 when the section's top edge enters the screen, 1 just before the section is centred on it
      const p = clamp((window.innerHeight - r.top) / (r.height * 0.85));
      draw("top", ease(clamp(p / 0.85)));
      draw("bottom", ease(clamp((p - 0.45) / 0.55))); // the bottom corner comes into view later
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  // each ribbon: a soft shadow, the white band, and a thin sky-blue line running beside it
  const ribbon = (group: string, d: string, line: string) => (
    <>
      <path data-ribbon={group} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1} fill="none" stroke="#061a36" strokeOpacity=".22" strokeWidth="52" transform="translate(0 8)" />
      <path data-ribbon={group} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1} fill="none" stroke="#fff" strokeWidth="46" />
      <path data-ribbon={group} d={line} pathLength={1} strokeDasharray={1} strokeDashoffset={1} fill="none" stroke="#7dd3fc" strokeOpacity=".75" strokeWidth="4" />
    </>
  );
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 300 260" className="absolute left-0 top-0 w-[clamp(96px,21vw,330px)]">
        {ribbon("top", "M 300 -40 C 215 35, 105 105, -40 215", "M 356 -40 C 271 35, 161 105, 16 215")}
      </svg>
      <svg viewBox="0 0 360 420" className="absolute bottom-0 right-0 w-[clamp(110px,24vw,380px)]">
        {ribbon("bottom", "M 20 470 C 95 320, 220 160, 400 40", "M -34 470 C 41 320, 166 160, 346 40")}
      </svg>
    </div>
  );
}
