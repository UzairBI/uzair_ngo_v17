/**
 * Supporter / partner logos. Files live in public/images/partners/.
 * To add one: drop the logo in that folder and add a line here. Order here = order on screen.
 * `url` = the website the logo opens (leave it out for a logo that should not be a link).
 * Use an .svg, or a .png at least 400px tall, so the logo stays sharp on large / high-density screens.
 */
const partners: { file: string; name: string; url?: string }[] = [
  { file: "vani.png", name: "VANI", url: "https://www.vaniindia.org/" },
  { file: "sap.svg", name: "SAP", url: "https://www.sap.com/" },
  { file: "mpvha.png", name: "MPVHA", url: "https://www.mpvha.org/" },
  { file: "jan-abhiyan-parishad.png", name: "Jan Abhiyan Parishad" },
  { file: "kone.svg", name: "KONE", url: "https://www.kone.in/" },
  { file: "jiv-daya-foundation.png", name: "Jiv Daya Foundation", url: "https://www.jivdayafound.org/" },
  { file: "impactguru.png", name: "ImpactGuru", url: "https://www.impactguru.com/" },
  { file: "captains.png", name: "Captains" },
  { file: "biomet.png", name: "Biomet" },
  { file: "mp-panchayat-rural-development.png", name: "Panchayat and Rural Development Department, Madhya Pradesh", url: "https://prd.mp.gov.in/" },
  { file: "ministry-of-culture.svg", name: "Ministry of Culture", url: "https://culture.gov.in/" },
  { file: "national-urban-livelihoods-mission.png", name: "National Urban Livelihoods Mission", url: "https://nulm.gov.in/" },
  { file: "sgsy-rural-development.png", name: "SGSY, Ministry of Rural Development", url: "https://www.rural.gov.in/" },
  { file: "rajya-shiksha-kendra.png", name: "Rajya Shiksha Kendra", url: "https://www.rskmp.in/" },
  { file: "partner-15.png", name: "Supporter" }
];

// two copies so the strip is always longer than the screen and loops without a gap
const loop = [...partners, ...partners];
// card width is a share of the strip's width (cqw): 2 logos on screen at a time on phones, 4 from sm up
const card = "mr-4 flex aspect-[5/2] w-[calc(50cqw-1rem)] shrink-0 items-center justify-center rounded-2xl bg-white px-5 py-4 shadow-[0_10px_30px_-14px_rgba(11,79,156,.45)] ring-1 ring-brand/10 sm:mr-7 sm:w-[calc(25cqw-1.75rem)] sm:px-8 sm:py-6";

/** Logos glide right-to-left in one straight line; the strip pauses while the pointer is on it. Each logo opens the partner's website. */
export default function SupportersStrip() {
  return (
    <div className="h-marquee-box w-full overflow-hidden py-4"
      style={{ containerType: "inline-size", maskImage: "linear-gradient(to right, transparent, #000 9%, #000 91%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, #000 9%, #000 91%, transparent)" }}>
      <div className="h-marquee flex w-max" style={{ ["--n" as string]: partners.length }}>
        {loop.map((p, n) => {
          const copy = n >= partners.length;
          const img = <img src={`/images/partners/${p.file}`} alt={copy ? "" : p.name} loading="lazy" draggable={false} className="h-full w-full object-contain" />;
          return p.url
            ? <a key={n} href={p.url} target="_blank" rel="noopener noreferrer" title={p.name} aria-hidden={copy} tabIndex={copy ? -1 : undefined}
                className={`${card} transition hover:-translate-y-1 hover:ring-brand/40`}>{img}</a>
            : <div key={n} title={p.name} aria-hidden={copy} className={card}>{img}</div>;
        })}
      </div>
    </div>
  );
}
