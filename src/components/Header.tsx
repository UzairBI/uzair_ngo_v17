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
  useEffect(() => { setOpen(false); setSub(null); }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_6px_24px_-12px_rgba(11,79,156,.35)]">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        {/* full-width white bar behind everything: logo badge on the left, links in the middle, Donate on the right */}
        <div className="flex h-16 items-center justify-between sm:h-[72px]">
          <Link to="/" aria-label={`${site.name} home`} className="flex h-11 shrink-0 items-center sm:h-[52px]">
            <img src="/assets/images/logo.png" alt={`${site.name} logo`} className="h-8 w-auto max-w-[150px] object-contain sm:h-10 sm:max-w-[190px]" />
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

          <button className="flex h-11 w-11 items-center justify-center rounded-full text-ink lg:hidden" aria-label="Toggle menu" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
            <span className="block text-2xl leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>

        {open && (
          <nav id="mobile-nav" aria-label="Mobile" className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-t py-3 text-center text-ink shadow-xl lg:hidden">
            {nav.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-center">
                  <Link to={item.href} onClick={() => setOpen(false)} className="px-5 py-3 text-[15px] font-medium">{t(item.label)}</Link>
                  {item.children && (
                    <button className="h-10 w-10 text-xl" aria-label={`Expand ${item.label}`} aria-expanded={sub === item.label}
                      onClick={() => setSub(sub === item.label ? null : item.label)}>{sub === item.label ? "−" : "+"}</button>
                  )}
                </div>
                {item.children && sub === item.label && (
                  <div className="mx-4 rounded-2xl bg-brand-light py-1">
                    {item.children.map((c) => <Link key={c.href} to={c.href} onClick={() => setOpen(false)} className="block px-6 py-2.5 text-sm">{t(c.label)}</Link>)}
                  </div>
                )}
              </div>
            ))}
            <div className="px-4 pb-1 pt-3"><DonateButton to="/donate" full>{t("Donate")}</DonateButton></div>
          </nav>
        )}
      </div>
    </header>
  );
}
