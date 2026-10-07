import { useEffect, useState } from "react";
import { pageTextDefaults } from "../data/pageContent";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { useLang } from "../i18n/LangContext";

/** Texts changed in the admin panel (Website Pages), by key. Loaded once and shared by every page. */
let saved: Record<string, string> = {};
let asked = false;
const listeners = new Set<() => void>();

function load() {
  if (asked || !supabaseConfigured || !supabase) return;
  asked = true;
  supabase.from("page_content").select("key, value").then(({ data, error }) => {
    if (error || !data) return; // table missing or database not reachable: the original wording stays
    saved = Object.fromEntries(data.filter((r) => r.value.trim()).map((r) => [r.key, r.value]));
    listeners.forEach((fn) => fn());
  });
}

/**
 * const c = usePageText(); then c("about.hero.title").
 * Gives the wording saved in the admin panel, or the original from src/data/pageContent.ts (in Hindi when a translation exists).
 */
/** Only what an admin has changed, by key (no originals). Redraws the component when the saved texts arrive. */
export function useSavedPageText(): Readonly<Record<string, string>> {
  const [, redraw] = useState(0);
  useEffect(() => {
    const fn = () => redraw((n) => n + 1);
    listeners.add(fn);
    load();
    return () => { listeners.delete(fn); };
  }, []);
  return saved;
}

export function usePageText() {
  const { t } = useLang();
  useSavedPageText();
  return (key: string) => {
    if (import.meta.env.DEV && !(key in pageTextDefaults)) console.warn(`usePageText: unknown key "${key}" (add it to src/data/pageContent.ts)`);
    return saved[key] ?? t(pageTextDefaults[key] ?? "");
  };
}
