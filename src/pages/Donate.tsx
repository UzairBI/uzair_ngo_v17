import { useState, type ReactNode } from "react";
import { site } from "../data/site";
import { useTitle } from "../hooks/useTitle";
import { usePageText } from "../hooks/usePageText";
import { useLang } from "../i18n/LangContext";
import Wave from "../components/Wave";
import BackgroundSlideshow from "../components/BackgroundSlideshow";
import { donationImages } from "../data/slideshows";
import DonateButton from "../components/DonateButton";
import { Highlights, Faq } from "../components/InfoBlocks";

/**
 * Donate page. Layout: full-height photo on the left, light-blue panel on the right with one white card.
 * The "Donate Now" button opens the organisation's payment page (site.razorpayMe in src/data/site.ts),
 * where donors pick UPI, bank account / net banking, cards or wallets.
 * The exact amount is entered on the payment page.
 */
/** Donation photos only. Safety net: anything from the featured set is never shown here. */
const donationSlides = donationImages.filter((src) => !src.includes("/featured/"));
/** Which part of each photo stays in view when it is cropped to the panel (faces sit in the upper-middle). */
const donationFocus: Record<string, string> = Object.fromEntries(donationSlides.filter((s) => s.includes("donate-slide-")).map((s) => [s, "object-[center_38%]"]));

const icon = (d: ReactNode) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const methods: { label: string; sub: string; svg: ReactNode }[] = [
  { label: "UPI", sub: "Any UPI app", svg: icon(<><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /><path d="M10 8l2-2 2 2M12 6v6" /></>) },
  { label: "Bank account", sub: "Net banking", svg: icon(<><path d="M3 9.5L12 4l9 5.5" /><path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7" /><path d="M3 20h18" /></>) },
  { label: "Cards", sub: "Debit & credit", svg: icon(<><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19M6 15h4" /></>) },
  { label: "Wallets", sub: "Popular wallets", svg: icon(<><path d="M4 7.5A2.5 2.5 0 016.5 5H18a2 2 0 012 2v1" /><rect x="3" y="7.5" width="18" height="12" rx="2.5" /><circle cx="16.5" cy="13.5" r="1.2" /></>) }
];

export default function Donate() {
  const { t } = useLang();
  const c = usePageText();
  useTitle("Donate");
  const [monthly, setMonthly] = useState(false);

  return (
    <>
    <section className="grid lg:grid-cols-2" aria-labelledby="donate-title">
      {/* photo: full height of the page on large screens; on phones a banner BELOW the donation card, so the form is visible straight away */}
      <div className="relative order-1 h-72 bg-ink sm:h-96 lg:order-1 lg:h-auto">
        <div className="relative h-full w-full overflow-hidden lg:sticky lg:top-[85px] lg:h-[calc(100vh-85px)]">
          {/* one photo = it stays still; two or more = each slides in from the right while the last slides out to the left, in a loop.
              The first photo is the fallback (already on screen), so the loop starts with the second one and ends on the first. */}
          <BackgroundSlideshow images={donationSlides.length > 1 ? [...donationSlides.slice(1), donationSlides[0]] : donationSlides} fallback={donationSlides.length > 1 ? donationSlides[0] : undefined}
            imgClassNames={donationFocus} effect="shift" startDelay={5000} interval={5000} duration={1100} />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent lg:from-ink/70 lg:via-transparent" />
          <p className="absolute bottom-14 left-4 right-4 max-w-sm max-lg:mx-auto max-lg:text-center font-serif text-lg font-bold leading-snug text-white sm:left-6 sm:right-6 sm:text-xl md:bottom-24 md:left-10 md:text-2xl lg:bottom-28">
            {c("donate.photo.quote")}
          </p>
          <div className="hidden lg:block"><Wave fill="#eef8ff" /></div>
        </div>
      </div>

      {/* light-blue panel with the donation card */}
      <div className="relative isolate z-10 order-2 max-lg:-mt-8 max-lg:rounded-t-[2rem] flex items-center justify-center overflow-hidden bg-[#eef8ff] px-4 pb-10 pt-8 sm:pb-12 sm:pt-10 md:px-10 lg:order-2 lg:items-stretch lg:pb-12 lg:pt-4">
        <svg aria-hidden="true" viewBox="0 0 160 220" className="pointer-events-none absolute -top-4 left-0 -z-10 hidden h-56 w-40 text-brand sm:block" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0 210C40 150 80 110 110 0" opacity=".55" /><path d="M24 214C64 154 104 114 134 4" opacity=".4" /><path d="M48 218C88 158 128 118 158 8" opacity=".25" />
        </svg>
        <svg aria-hidden="true" viewBox="0 0 300 340" className="pointer-events-none absolute -bottom-32 -right-36 -z-10 h-80 w-72 text-brand" fill="currentColor">
          <path d="M210 10C270 40 310 120 290 200C270 280 190 340 110 330C30 320-10 250 10 180C30 110 60 60 110 30C150 6 180-4 210 10Z" opacity=".9" />
        </svg>

        {/* on large screens the card stretches down the panel, ending about level with the middle of the blue shape */}
        <div className="flex w-full max-w-xl flex-col">
          <div className="flex flex-col rounded-2xl bg-white p-5 shadow-xl shadow-brand-dark/10 sm:p-6 md:p-10 lg:flex-1 lg:p-8">
            <h1 id="donate-title" className="font-serif text-3xl font-bold leading-tight text-ink sm:text-4xl">{c("donate.title")}</h1>
            <p className="justified mt-3 text-sm text-ink/70">{c("donate.text")}</p>

            <div className="mt-7 lg:mt-5">
              <p className="text-sm font-semibold text-ink">{c("donate.methods.title")}</p>
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {methods.map((m) => (
                  <li key={m.label} className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-2.5 py-2.5 sm:gap-3 sm:px-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand sm:h-9 sm:w-9">{m.svg}</span>
                    <span className="min-w-0 leading-tight"><strong className="block text-[13px] font-semibold text-ink sm:text-sm">{t(m.label)}</strong><span className="text-[11px] text-ink/60 sm:text-xs">{t(m.sub)}</span></span>
                  </li>
                ))}
              </ul>
            </div>

            {/* monthly giving: switches the button to the monthly link (site.razorpayMonthly) */}
            <label className="mb-0 mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-ink/10 bg-brand-light/40 px-3 py-3 sm:px-4">
              <span className="min-w-0 leading-tight">
                <strong className="block text-sm font-semibold text-ink">{c("donate.monthly.title")}</strong>
                <span className="text-xs text-ink/60">{c("donate.monthly.text")}</span>
              </span>
              <input type="checkbox" role="switch" checked={monthly} onChange={(e) => setMonthly(e.target.checked)} className="peer sr-only" />
              <span aria-hidden="true" className={`relative block h-7 w-12 shrink-0 rounded-full transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 ${monthly ? "bg-brand" : "bg-ink/20"}`}>
                <span className={`absolute left-1 top-1 block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${monthly ? "translate-x-5" : ""}`} />
              </span>
            </label>

            {/* stays at the bottom of the card when the card is stretched */}
            <div className="mt-8 lg:mt-auto lg:pt-6">
            <DonateButton href={monthly && site.razorpayMonthly ? site.razorpayMonthly : site.razorpayMe} full size="lg">{t(monthly ? "Donate Monthly" : "Donate Now")}</DonateButton>
            <p className="mt-3 flex items-start justify-center gap-2 text-center text-xs text-ink/60">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" className="mt-px shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
              {c("donate.note")}
            </p>
            </div>
          </div>
          <p className="justified mt-5 px-1 text-xs text-ink/65 max-lg:text-center">{c("donate.footnote")}</p>
        </div>
      </div>
    </section>
    <Highlights eyebrow="Why give" title="Your gift, put to work"
      items={[["Education", "Learning kits, books and support for children in our education programmes."], ["Health", "Health camps, check-ups and support for patients in need."], ["Livelihoods", "Skill training and self-help group support for women."], ["Environment", "Tree plantation and care drives with local communities."], ["Relief", "Help for families affected by emergencies and hardship."], ["Accountability", "12A, 80G, FCRA and CSR-1 registered, with published reports."]]} />
    <Faq title="Donation FAQ" items={[["Is my donation tax-deductible?", "The Samiti holds 80G approval, so eligible donations qualify for deduction under Section 80G, subject to applicable rules."], ["Which payment methods can I use?", "The secure payment page that opens next lists the available options, such as UPI, cards and net banking."], ["Will I get a receipt?", "Add your email on the payment page, and contact us if you need a receipt or an 80G certificate."], ["Can I donate to a specific cause?", "Yes. Use the sponsor links on the Projects page or write to us to direct your gift."], ["Can I donate from abroad?", "We hold FCRA registration. Please contact us for foreign contribution details."]]} />
    </>
  );
}
