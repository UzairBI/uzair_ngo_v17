import { useState } from "react";
import { GLOBE, INDIA_BORDER, INDIA_DOTS, WORLD_BORDERS, WORLD_DOTS, project } from "../data/globeData";
import { useLang } from "../i18n/LangContext";

const { cx: GX, cy: GY, r: GR } = GLOBE;
const CX = 320, CY = 300;

/**
 * Locations shown as clickable buttons. To add one: push [name, latitude, longitude].
 * Clicking a button zooms the map onto that dot.
 */
const PLACES: [string, number, number][] = [
  ["Sagar", 23.84, 78.74], ["Harda", 22.34, 77.10], ["Shahdol", 23.30, 81.36], ["Sehore", 23.20, 77.08],
  ["Vidisha", 23.52, 77.81], ["Tikamgarh", 24.74, 78.83], ["Panna", 24.72, 80.19], ["Katni", 23.83, 80.40],
  ["Narsinghpur", 22.95, 79.19], ["Chhatarpur", 24.92, 79.59], ["Betul", 21.91, 77.90], ["Ashoknagar", 24.58, 77.73],
  ["Hyderabad", 17.39, 78.49], ["Mumbai", 19.08, 72.88]
];
const steps = PLACES.map(([label, lat, lon]) => { const [x, y] = project(lon, lat); return { label, zoom: 4, x, y }; });

// Tilt of the latitude rings on the globe.
const TILT = 0.38;
const LATS = [-60, -40, -20, 0, 20, 40, 60, 80];
const LONS = [20, 40, 60, 80, 100, 120, 140, 160];

const SKY = "#38bdf8", GLOW = "#7dd3fc";

/** Animated map of India with a clickable button for each field location. */
export default function IndiaNetworkMap() {
  const { t } = useLang();
  const [i, setI] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  // clicking a place zooms onto it; clicking the place you are already on zooms back out
  const pick = (n: number) => { setZoomed(!(zoomed && n === i)); setI(n); };

  const s = steps[i];
  const z = zoomed ? 4 : 1;
  const k = 1 / z; // keeps markers a constant on-screen size while the camera zooms
  const camFix = zoomed ? `translate(${CX - z * s.x}px, ${CY - z * s.y}px) scale(${z})` : `translate(0px, 0px) scale(1)`;

  const dot = Math.pow(k, 0.5);

  return (
    <div className="relative flow-root">
      {/* the box itself (background only) */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-3xl bg-gradient-to-br from-[#000000] via-[#001a33] to-[#003366] shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0099ff]/20 pointer-events-none" />
        <div aria-hidden="true" className="ngo-aurora pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-sky-400/25 blur-3xl" />
        <div aria-hidden="true" className="ngo-aurora pointer-events-none absolute -bottom-28 right-0 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl [animation-delay:-6s]" />
      </div>

      {/* the map is not clipped to the box: it fills it and fades out a little way past its edges */}
      <div className="ngo-stage pointer-events-none relative -m-2.5 p-2.5 text-white md:-m-10 md:p-10">
        <div className="pointer-events-auto relative grid items-center gap-3 p-4 sm:gap-4 sm:p-5 md:grid-cols-2 md:p-10">
          <div className="ngo-float">
            <svg viewBox="-100 -90 840 780" role="img" aria-label="Map of India with our field locations"
              className="mx-auto max-h-[44vh] w-full overflow-visible sm:max-h-[56vh] md:max-h-[70vh]">
              <defs>
                <radialGradient id="ngoGlow"><stop offset="0" stopColor={SKY} stopOpacity=".95" /><stop offset="1" stopColor={SKY} stopOpacity="0" /></radialGradient>
                <filter id="neonGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="globeBody" cx="40%" cy="42%" r="70%">
                  <stop offset="0" stopColor="#031a3d" /><stop offset=".75" stopColor="#020c1f" /><stop offset="1" stopColor="#01060f" />
                </radialGradient>
                <linearGradient id="globeRim" x1="0.15" y1="0.9" x2="0.85" y2="0.1">
                  <stop offset="0" stopColor="#0a4fff" stopOpacity=".25" /><stop offset=".6" stopColor="#2f8bff" stopOpacity=".8" /><stop offset="1" stopColor="#8fd0ff" />
                </linearGradient>
                <filter id="rimGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
                <clipPath id="globeClip"><circle cx={GX} cy={GY} r={GR} /></clipPath>
              </defs>

              <g style={{ transform: camFix, transformOrigin: "0 0", transition: "transform 1.4s cubic-bezier(.65,0,.25,1)" }}>

                {/* holographic globe: glowing rim + dotted latitude / longitude grid */}
                <circle cx={GX} cy={GY} r={GR + 6} fill="none" stroke="url(#globeRim)" strokeWidth={26} filter="url(#rimGlow)" />
                <circle cx={GX} cy={GY} r={GR} fill="url(#globeBody)" style={{ opacity: zoomed ? 0 : 1, transition: "opacity 1s ease" }} />
                <g clipPath="url(#globeClip)" fill="none" stroke="#2f8bff" strokeWidth={1} strokeOpacity=".55" strokeDasharray="1 3.5" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                  {LATS.map((lat) => {
                    const a = (lat * Math.PI) / 180, rx = GR * Math.cos(a);
                    return <ellipse key={`lat${lat}`} cx={GX} cy={GY - GR * Math.sin(a) * TILT * 2.2} rx={rx} ry={rx * TILT} vectorEffect="non-scaling-stroke" />;
                  })}
                  {LONS.map((lon) => (
                    <ellipse key={`lon${lon}`} cx={GX} cy={GY} rx={Math.abs(GR * Math.cos((lon * Math.PI) / 180))} ry={GR} vectorEffect="non-scaling-stroke" />
                  ))}
                  <line x1={GX} y1={GY - GR} x2={GX} y2={GY + GR} vectorEffect="non-scaling-stroke" />
                </g>
                <circle cx={GX} cy={GY} r={GR} fill="none" stroke="url(#globeRim)" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
                {/* other countries: borders + land dots */}
                <path d={WORLD_BORDERS} fill="none" stroke="#2f8bff" strokeOpacity=".45" strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
                <path d={WORLD_DOTS} fill="none" stroke="#4db0ff" strokeOpacity="1" strokeWidth={2.3 * dot} strokeLinecap="round" />

                {/* India: dotted land, bright border */}
                <path d={INDIA_DOTS} fill="none" stroke="#00ffff" strokeWidth={2.2 * dot} strokeLinecap="round" className="ngo-node" filter="url(#neonGlow)" />
                <path d={INDIA_BORDER} fill="none" stroke="#5fe8ff" strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" filter="url(#neonGlow)" />

                {/* radar rings from the selected place (overview only) */}
                {!zoomed && [0, 1, 2].map((n) => (
                  <circle key={n} cx={s.x} cy={s.y} r={10} fill="none" stroke={SKY} strokeWidth={1.5} vectorEffect="non-scaling-stroke"
                    className="ngo-ring" style={{ animationDelay: `${n * 1.2}s` }} />
                ))}

                {/* every location (clickable dots) */}
                {steps.map((p, n) => n !== i && (
                  <g key={p.label} transform={`translate(${p.x} ${p.y})`} onClick={() => pick(n)} style={{ cursor: "pointer" }}>
                    <circle r={10 * k} fill="transparent" />
                    <circle r={4 * k} fill={SKY} fillOpacity=".85" />
                    <circle r={8 * k} fill="none" stroke={SKY} strokeOpacity=".35" strokeWidth={1 * k} />
                    {zoomed && <text y={-12 * k} textAnchor="middle" fontSize={11 * k} fill="#e0f2fe" opacity=".9">{p.label}</text>}
                  </g>
                ))}

                {/* active marker */}
                <g transform={`translate(${s.x} ${s.y})`}>
                  <circle r={110 * k} fill="url(#ngoGlow)" className="ngo-breathe" />
                  {[0, 1, 2].map((n) => (
                    <circle key={n} r={12 * k} fill="none" stroke={GLOW} strokeWidth={2 * k} className="ngo-pulse" style={{ animationDelay: `${n * 0.6}s` }} />
                  ))}
                  <circle r={9 * k} fill={SKY} />
                  <circle r={3.6 * k} fill="#fff" />
                  <text y={-24 * k} textAnchor="middle" fontSize={15 * k} fontWeight="700" fill="#fff">{s.label}</text>
                </g>
              </g>
            </svg>
          </div>

          <div className="ngo-copy relative z-10 min-w-0 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-300">{t("Where we work")}</p>
            <h3 key={s.label} className="ngo-fade mt-1 font-serif text-xl font-bold sm:mt-2 sm:text-2xl md:text-3xl">{t(s.label)}</h3>
            <p className="mx-auto mt-1 text-sm text-white/60 md:mx-0">{t("Tap a place to see it on the map")}</p>

            <div className="ngo-chips mt-4 flex flex-wrap justify-center gap-2 md:justify-start" role="tablist" aria-label="Locations">
              {steps.map((p, n) => (
                <button key={p.label} type="button" role="tab" aria-selected={zoomed && n === i} onClick={() => pick(n)}
                  className={`btn-light btn-light-sm shrink-0 ${zoomed && n === i ? "is-active" : ""}`}>{t(p.label)}</button>
              ))}
            </div>

            {zoomed && (
              <button type="button" onClick={() => setZoomed(false)} className="btn-light btn-light-sm mt-3">{t("View all of India")}</button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .ngo-node{opacity:.8;fill:#00ffff}
        .ngo-stage{--spill:10px;-webkit-mask-image:linear-gradient(to right,transparent,#000 var(--spill),#000 calc(100% - var(--spill)),transparent),linear-gradient(to bottom,transparent,#000 var(--spill),#000 calc(100% - var(--spill)),transparent);-webkit-mask-composite:source-in;mask-image:linear-gradient(to right,transparent,#000 var(--spill),#000 calc(100% - var(--spill)),transparent),linear-gradient(to bottom,transparent,#000 var(--spill),#000 calc(100% - var(--spill)),transparent);mask-composite:intersect}
        @media (min-width:768px){.ngo-stage{--spill:40px}}
        .ngo-chips .btn-light{margin:0 !important}
        @media (max-width:767px){
          .ngo-chips{display:grid;grid-template-columns:repeat(6,1fr);gap:.5rem}
          .ngo-chips .btn-light{grid-column:span 2;width:100%;min-width:0;padding:.5rem .25rem;font-size:.8rem;justify-content:center;text-align:center;white-space:nowrap}
          .ngo-chips .btn-light:nth-child(3n+1):nth-last-child(2){grid-column:2 / span 2}
          .ngo-chips .btn-light:last-child:nth-child(3n+2){grid-column:4 / span 2}
        }
        .ngo-copy h3,.ngo-copy p{text-shadow:0 1px 10px rgba(0,10,30,.95),0 0 3px rgba(0,10,30,.9)}
        .ngo-pulse{transform-box:fill-box;transform-origin:center;animation:ngoPulse 2.2s ease-out infinite}
        .ngo-ring{transform-box:fill-box;transform-origin:center;animation:ngoRing 3.6s ease-out infinite;opacity:0}
        .ngo-breathe{transform-box:fill-box;transform-origin:center;animation:ngoBreathe 2.4s ease-in-out infinite}
        .ngo-fade{animation:ngoFade .5s ease both}
        @media (prefers-reduced-motion:no-preference){
          .ngo-node{animation:ngoNeon 3s ease-in-out infinite}
          .ngo-float{animation:ngoFloat 9s ease-in-out infinite}
          .ngo-aurora{animation:ngoAurora 16s ease-in-out infinite}
        }
        @media (prefers-reduced-motion:reduce){.ngo-pulse,.ngo-ring,.ngo-breathe,.ngo-fade{animation:none}}
        @keyframes ngoNeon{0%,100%{opacity:.6;fill:#00ffff}50%{opacity:.95;fill:#00ffff}}
        @keyframes ngoPulse{0%{transform:scale(1);opacity:.9}100%{transform:scale(7);opacity:0}}
        @keyframes ngoRing{0%{transform:scale(1);opacity:.8}100%{transform:scale(22);opacity:0}}
        @keyframes ngoBreathe{0%,100%{transform:scale(.85);opacity:.7}50%{transform:scale(1.15);opacity:1}}
        @keyframes ngoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes ngoAurora{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,40px)}}
        @keyframes ngoFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      `}</style>
    </div>
  );
}
