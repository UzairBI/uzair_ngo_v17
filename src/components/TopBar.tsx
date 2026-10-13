import { useEffect, useState } from "react";
import { site } from "../data/site";
import { ticker } from "../data/content";
import { supabase, supabaseConfigured } from "../lib/supabase";
import LanguageToggle from "./LanguageToggle";
import { useLang } from "../i18n/LangContext";

/**
 * The scrolling strip text. The messages are managed in the admin panel (Broadcast) and read from the database
 * (table ticker_messages, newest first); until they load, or if the database cannot be reached, the built-in text is shown.
 */
function useTicker(): string {
  const [text, setText] = useState(ticker);
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    let alive = true;
    const load = () => supabase!.from("ticker_messages").select("message").eq("published", true).order("created_at", { ascending: false }).order("id", { ascending: false })
      .then(({ data, error }) => { if (alive && !error && data && data.length) setText(data.map((m) => m.message.trim()).filter(Boolean).join(" · ")); });
    load();
    // pick up a new broadcast without a reload: when the tab is looked at again, and every minute
    const onShow = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onShow);
    const timer = window.setInterval(onShow, 60_000);
    return () => { alive = false; document.removeEventListener("visibilitychange", onShow); window.clearInterval(timer); };
  }, []);
  return text;
}

/** Small line icon for a ticker message, picked from its wording (so messages edited in the admin panel keep an icon). */
const tickerIcon = (msg: string) => {
  const l = msg.toLowerCase();
  if (/child|educat|school|student/.test(l)) return { c: "bg-indigo-500", d: <><path d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5z" /><path d="M6.5 11.5V16c1.5 1.4 3.4 2 5.5 2s4-.6 5.5-2v-4.5" /></> };
  if (/patient|health|medical|nutrition/.test(l)) return { c: "bg-rose-500", d: <path d="M12 20s-7-4.4-7-9.6A4 4 0 0112 8a4 4 0 017 2.4C19 15.6 12 20 12 20z" /> };
  if (/women|shg|livelihood|girl/.test(l)) return { c: "bg-amber-500", d: <><circle cx="12" cy="7" r="3" /><path d="M12 10v6M8.5 13h7M9 21l3-5 3 5" /></> };
  if (/solar|lantern|light/.test(l)) return { c: "bg-orange-500", d: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" /></> };
  if (/tree|plant|environ|green/.test(l)) return { c: "bg-emerald-500", d: <><path d="M12 21v-7" /><path d="M12 14c-4 0-6-3-6-6 4 0 6 2 6 6zM12 12c0-4 2-7 6-7 0 4-2 7-6 7z" /></> };
  return { c: "bg-sky-500", d: <path d="M5 12.5l4.5 4.5L19 7.5" /> };
};

/** One ticker message: round icon, the leading figure in bold, then the wording. Any emoji typed in the admin panel is dropped. */
function TickerItem({ msg }: { msg: string }) {
  const clean = msg.replace(/[\p{Extended_Pictographic}️‍]/gu, "").replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const m = clean.match(/^([\d.,]+\+?)\s+(.*)$/);
  const { c, d } = tickerIcon(clean);
  return (
    <span className="mr-10 inline-flex items-center gap-2">
      <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${c}`}>
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
      </span>
      {m ? <><strong className="font-bold text-ink">{m[1]}</strong><span>{m[2]}</span></> : <span>{clean}</span>}
    </span>
  );
}

export default function TopBar() {
  const { t } = useLang();
  const text = useTicker();
  const items = text.split(/\s*·\s*/).filter(Boolean);
  // longer text scrolls for longer, so the reading speed stays the same however many messages there are
  const seconds = Math.max(30, Math.round(text.length / 5.5));
  return (
    <div className="border-b border-sky-200 bg-gradient-to-r from-[#dff1ff] via-[#eaf6ff] to-[#dff1ff] text-xs font-medium text-brand-dark">
      <div className="container-site flex items-center gap-3 py-2.5 lg:gap-5">
        <span className="hidden shrink-0 items-center gap-2 rounded-full bg-brand-dark px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white sm:inline-flex">
          <span aria-hidden="true" className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          {t("Live")}
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_28px,black_calc(100%-28px),transparent)]" aria-label="Live updates">
          <div className="animate-ticker flex w-max whitespace-nowrap" style={{ animationDuration: `${seconds}s` }}>
            <span className="flex items-center pr-8">{items.map((m, i) => <TickerItem key={i} msg={m} />)}</span>
            <span className="flex items-center pr-8" aria-hidden="true">{items.map((m, i) => <TickerItem key={i} msg={m} />)}</span>
          </div>
        </div>
        <span className="hidden shrink-0 rounded-full border border-brand/20 bg-white/60 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand-dark 2xl:inline">{site.taxNotice}</span>
        <span aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-brand-dark/20 lg:block" />
        <a href={site.phoneHref} className="hidden shrink-0 font-semibold hover:underline lg:inline">{site.phone}</a>
        <span aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-brand-dark/20 lg:block" />
        <LanguageToggle />
        <a href={site.whatsappHref} target="_blank" rel="noreferrer" className="shrink-0 rounded-full bg-green-500 px-3 py-1 font-semibold text-white transition hover:scale-105 hover:shadow-lg hover:shadow-green-500/40">WhatsApp</a>
      </div>
    </div>
  );
}
