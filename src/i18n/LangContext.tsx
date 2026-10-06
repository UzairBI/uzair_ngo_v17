import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { hi } from "./hi";
import { startDomTranslate, type DomTranslator } from "./domTranslate";

export type Lang = "en" | "hi";
interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (en: string) => string }
const LangCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (s) => s });

/**
 * Use t("English text"). If a Hindi entry exists in src/i18n/hi.ts it is shown, otherwise the English text.
 * Text that is not written with t() (data files, admin content) is translated on screen by src/i18n/domTranslate.ts
 * from the same dictionary plus src/i18n/hi.site.ts and hi.messages.ts, which are only downloaded when a visitor switches to Hindi.
 */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return localStorage.getItem("lang") === "hi" ? "hi" : "en"; } catch { return "en"; }
  });
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem("lang", l); } catch { /* ignore */ } };
  const langRef = useRef(lang); langRef.current = lang;
  const dom = useRef<DomTranslator | null>(null);
  const loaded = useRef(false);
  useEffect(() => {
    document.documentElement.lang = lang;
    if (!dom.current) dom.current = startDomTranslate(() => langRef.current === "hi", hi);
    dom.current.refresh();
    if (lang === "hi" && !loaded.current) {
      loaded.current = true;
      Promise.all([import("./hi.site"), import("./hi.messages")])
        .then(([a, b]) => dom.current?.add({ ...a.hiSite, ...b.hiMessages })).catch(() => { loaded.current = false; });
    }
  }, [lang]);
  const t = (en: string) => (lang === "hi" ? hi[en] ?? en : en);
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}
export const useLang = () => useContext(LangCtx);
