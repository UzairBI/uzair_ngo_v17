import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { nav } from "../data/navigation";
import { site } from "../data/site";
import { useLang } from "../i18n/LangContext";
import DonateButton from "./DonateButton";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<string | null>(null);
  const { pathname } = useLocation();
  const { t } = useLang();
  useEffect(() => { setOpen(false); }, [pathname]);
  // the full-page menu always opens with its sections closed, and the page behind it must not scroll
  useEffect(() => {
    if (!open) { setSub(null); return; }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_6px_24px_-12px_rgba(11,79,156,.35)]">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        {/* full-width white bar behind everything: logo badge on the left, links in the middle, Donate on the right */}
        <div className="flex h-16 items-center justify-between sm:h-[72px]">
          <Link to="/" aria-label={`${site.name} home`} className="flex h-12 shrink-0 items-center sm:h-14 xl:h-[60px]">
            <img src="/assets/images/logo.png" alt={`${site.name} logo`} className="h-11 w-auto max-w-[190px] object-contain sm:h-12 sm:max-w-[220px] xl:h-14 xl:max-w-[260px]" />
          </Link>

          <nav aria-label="Main" className="hidden min-w-0 flex-1 items-center justify-between gap-3 pl-3 lg:flex xl:pl-8">
            <div className="flex flex-1 items-center justify-center gap-0.5 xl:gap-1.5">
              {nav.map((item) => (
                <div key={item.label} className="group relative">
                  <NavLink to={item.href} end={item.href === "/"} className={({ isActive }) =>
                    `block whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium transition-colors xl:px-4 xl:text-[15px] ${isActive ? "bg-brand text-white" : "text-ink hover:bg-brand-light hover:text-brand-dark"}`}>
                    {t(item.label)}{item.children && <span aria-hidden="true"> ▾</span>}
                  </NavLink>
                  {item.children && (
                    <div className="invisible absolute left-1/2 top-full min-w-[230px] -translate-x-1/2 pt-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      <div className="rounded-2xl border bg-white py-3 shadow-xl">
                        {item.children.map((c) => (
                          <Link key={c.href} to={c.href} onClick={() => setSub(null)} className="block px-5 py-2 text-center text-sm text-ink transition hover:bg-brand-light hover:text-brand-dark">{t(c.label)}</Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <DonateButton to="/donate" size="sm" className="shrink-0">{t("Donate")}</DonateButton>
          </nav>

          {/* phones / tablets: Donate sits right next to the menu button */}
          <div className="flex shrink-0 items-center gap-1 lg:hidden">
            <DonateButton to="/donate" size="sm" className="shrink-0">{t("Donate")}</DonateButton>
            <button className="flex h-11 w-11 items-center justify-center rounded-full text-ink" aria-label="Toggle menu" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
              <span className="block text-2xl leading-none">{open ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>

        {/* Phones / tablets: the menu is a full page. The arrow on a section opens its options underneath it, like the dropdowns on desktop. */}
        {open && (
          <nav id="mobile-nav" aria-label="Mobile" className="fixed inset-0 z-50 flex flex-col bg-white text-ink lg:hidden">
            <div className="flex h-16 shrink-0 items-center justify-between border-b px-3 sm:h-[72px] sm:px-6">
              <Link to="/" onClick={() => setOpen(false)} aria-label={`${site.name} home`} className="flex h-12 items-center sm:h-14">
                <img src="/assets/images/logo.png" alt={`${site.name} logo`} className="h-11 w-auto max-w-[190px] object-contain sm:h-12 sm:max-w-[220px] xl:h-14 xl:max-w-[260px]" />
              </Link>
              <button className="flex h-11 w-11 items-center justify-center rounded-full text-ink" aria-label="Close menu" onClick={() => setOpen(false)}>
                <span className="block text-2xl leading-none">✕</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3 sm:px-8">
              {nav.map((item) => (
                <div key={item.label} className="border-b border-ink/10">
                  <div className="flex min-h-[3.5rem] items-center justify-between gap-3">
                    <Link to={item.href} onClick={() => setOpen(false)} className="flex-1 py-3 text-lg font-semibold">{t(item.label)}</Link>
                    {item.children && (
                      <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand-dark" aria-label={`${sub === item.label ? "Hide" : "Show"} ${item.label} options`} aria-expanded={sub === item.label}
                        onClick={() => setSub(sub === item.label ? null : item.label)}>
                        <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-5 w-5 transition-transform duration-200 ${sub === item.label ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                      </button>
                    )}
                  </div>
                  {item.children && sub === item.label && (
                    <div className="mb-3 rounded-2xl bg-brand-light py-2">
                      {item.children.map((c) => <Link key={c.href} to={c.href} onClick={() => setOpen(false)} className="block px-5 py-3 text-[15px] font-medium">{t(c.label)}</Link>)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t px-4 py-3"><DonateButton to="/donate" full>{t("Donate")}</DonateButton></div>
          </nav>
        )}
      </div>
    </header>
  );
}
