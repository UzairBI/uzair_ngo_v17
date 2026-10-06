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

export default function TopBar() {
  const { t } = useLang();
  const text = useTicker();
  // longer text scrolls for longer, so the reading speed stays the same however many messages there are
  const seconds = Math.max(30, Math.round(text.length / 5.5));
  return (
    <div className="border-b border-sky-200 bg-gradient-to-r from-[#dff1ff] via-[#eaf6ff] to-[#dff1ff] text-xs text-brand-dark">
      <div className="container-site flex items-center gap-4 py-2">
        <span className="hidden shrink-0 font-semibold uppercase tracking-wider sm:inline">● {t("Live")}</span>
        <div className="relative flex-1 overflow-hidden" aria-label="Live updates">
          <div className="animate-ticker flex w-max whitespace-nowrap" style={{ animationDuration: `${seconds}s` }}>
            <span className="pr-12">{text}</span><span className="pr-12" aria-hidden="true">{text}</span>
          </div>
        </div>
        <span className="hidden shrink-0 text-brand-dark/70 lg:inline">{site.taxNotice}</span>
        <a href={site.phoneHref} className="hidden shrink-0 font-semibold hover:underline md:inline">{site.phone}</a>
        <LanguageToggle />
        <a href={site.whatsappHref} target="_blank" rel="noreferrer" className="shrink-0 rounded-full bg-green-500 px-3 py-1 font-semibold text-white transition hover:scale-105 hover:shadow-lg hover:shadow-green-500/40">WhatsApp</a>
      </div>
    </div>
  );
}
