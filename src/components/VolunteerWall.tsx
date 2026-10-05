import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { useLang } from "../i18n/LangContext";
import Reveal from "./Reveal";

interface Volunteer { id: number; name: string; area: string | null; photo_path: string | null }

/** Avatar colours for volunteers without a photo (picked by name, so a person keeps their colour). */
const tones = ["from-[#1493e6] to-[#4fc3f7]", "from-[#22b866] to-[#4ade80]", "from-[#a05cf0] to-[#c084fc]", "from-[#f5822a] to-[#fb9d4b]", "from-[#e11d74] to-[#fb7185]"];
const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "V";
const toneFor = (name: string) => tones[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % tones.length];
const photoUrl = (path: string) => supabase!.storage.from("volunteer-photos").getPublicUrl(path).data.publicUrl;

/** Active volunteers ticked "Show on website" in the admin panel (view v_public_volunteers: name, area and photo only). */
function useVolunteers(): Volunteer[] {
  const [list, setList] = useState<Volunteer[]>([]);
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    let alive = true;
    supabase.from("v_public_volunteers").select("id, name, area, photo_path")
      .then(({ data, error }) => { if (alive && !error && data) setList(data); });
    return () => { alive = false; };
  }, []);
  return list;
}

/** "Our Volunteers" block for the About page: a photo (or initials) and the name of each volunteer, plus an invitation to join. */
export default function VolunteerWall() {
  const { t } = useLang();
  const list = useVolunteers();
  return (
    <>
      <h3 id="volunteers" className="mt-14 scroll-mt-24 font-serif text-2xl font-bold">{t("Our Volunteers")}</h3>
      <p className="mt-1 text-sm text-ink/70">{t("The people who give their time at our field camps, learning centres and drives.")}</p>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {list.map((v, i) => (
          <Reveal key={v.id} delay={Math.min(i, 9) * 60} className="h-full">
            <div className="group flex h-full flex-col items-center rounded-2xl border bg-white p-5 text-center transition duration-300 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_18px_36px_-20px_rgba(11,79,156,.5)]">
              <span className="relative block h-20 w-20 overflow-hidden rounded-full ring-4 ring-brand-light transition duration-300 group-hover:scale-105 group-hover:ring-brand/40 sm:h-24 sm:w-24">
                {v.photo_path
                  ? <img src={photoUrl(v.photo_path)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  : <span aria-hidden="true" className={`flex h-full w-full items-center justify-center bg-gradient-to-br text-2xl font-bold text-white ${toneFor(v.name)}`}>{initials(v.name)}</span>}
              </span>
              <h4 className="mt-3 font-semibold leading-snug">{v.name}</h4>
              <p className="mt-0.5 text-xs text-brand-dark">{v.area || t("Volunteer")}</p>
            </div>
          </Reveal>
        ))}
        <Reveal delay={Math.min(list.length, 9) * 60} className="h-full">
          <Link to="/get-involved" className="group flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand/40 bg-brand-light/50 p-5 text-center transition duration-300 hover:-translate-y-1.5 hover:border-brand hover:bg-brand-light">
            <span aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-light text-brand shadow-sm transition duration-300 group-hover:rotate-90 group-hover:bg-brand group-hover:text-white sm:h-24 sm:w-24">+</span>
            <span className="mt-3 font-semibold text-brand-dark">{t("Become a volunteer")}</span>
            <span className="mt-0.5 text-xs text-ink/60">{t("Join the team")} →</span>
          </Link>
        </Reveal>
      </div>
    </>
  );
}
