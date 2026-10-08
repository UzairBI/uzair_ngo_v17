import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { site, reg80G, reg12A, fcraReg } from "../data/site";
import { useTitle } from "../hooks/useTitle";
import { usePageText } from "../hooks/usePageText";
import { useLang } from "../i18n/LangContext";
import { Highlights, Faq } from "../components/InfoBlocks";
import { demoReceipt, downloadReceipt, renderReceipt, type Receipt } from "../lib/receipt";

/**
 * Donate page, fundraiser style: banner with the organisation badge, "About" text on the left, donation card on the right.
 * DEMO MODE: "Donate Now" does not take any money. It only shows how the donor receipt looks and lets the donor download it
 * (JPG / PDF), stamped DEMO / NOT A VALID RECEIPT. Real donations still go through the Razorpay link under the card (site.razorpayMe).
 */
const presets = [500, 1000, 2500, 5000];
const G = "/assets/images/gallery";
/** Photo + one line for each cause a gift supports (used in the card and the photo strip). */
const causes = [
  { title: "Education", text: "Learning kits and study support", img: G + "/education/children-learning-kits.jpg" },
  { title: "Health & Nutrition", text: "Health camps and nutrition kits", img: G + "/health-nutrition/child-nutrition-kit-handover.jpg" },
  { title: "Livelihoods", text: "Skill training for women", img: G + "/skill-development/kaushal-batch-courtyard.jpg" },
  { title: "Environment", text: "Tree plantation drives", img: G + "/environment/women-in-green-village-forest.jpg" },
  { title: "Relief", text: "Ration and clothing support", img: G + "/social-relief/ration-kits-distribution.jpg" }
];
const input = "w-full rounded-xl border border-brand/20 bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink/40 focus:border-brand focus:ring-4 focus:ring-brand/15";
const label = "mb-1 block text-sm font-semibold text-ink";

export default function Donate() {
  const { t } = useLang();
  const c = usePageText();
  useTitle("Donate");
  // amount picked in the impact calculator (/donate?amount=2500); anything that is not a sensible whole rupee amount is ignored
  const picked = Number(useSearchParams()[0].get("amount"));
  const [amount, setAmount] = useState(Number.isInteger(picked) && picked >= 1 && picked <= 10000000 ? String(picked) : "1000");
  const [form, setForm] = useState({ name: "", email: "", pan: "" });
  const [err, setErr] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!receipt) { setPreview(""); return; }
    let alive = true;
    renderReceipt(receipt).then((cv) => { if (alive) setPreview(cv.toDataURL("image/jpeg", 0.85)); });
    return () => { alive = false; };
  }, [receipt]);

  const donate = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount), pan = form.pan.trim().toUpperCase();
    if (!Number.isInteger(n) || n < 1 || n > 10000000) return setErr("Please enter a whole rupee amount between 1 and 1,00,00,000.");
    if (!form.name.trim()) return setErr("Please enter your full name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return setErr("Please enter a valid email address.");
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return setErr("PAN must look like ABCDE1234F, or be left empty.");
    setErr(""); setReceipt(demoReceipt({ name: form.name.trim(), pan, email: form.email.trim(), amount: n }));
  };
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      {/* banner: light-blue pattern, round organisation badge, title */}
      <section className="relative isolate overflow-hidden bg-[#b9d8f5] pb-10 pt-10 md:pb-14 md:pt-14" aria-labelledby="donate-title">
        <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-70" style={{ backgroundImage: "linear-gradient(135deg,#9cc8f0 25%,transparent 25%),linear-gradient(225deg,#d2e6f9 25%,transparent 25%),linear-gradient(45deg,#cfe3f8 25%,transparent 25%),linear-gradient(315deg,#a9d0f3 25%,#bcdaf6 25%)", backgroundSize: "120px 120px" }} />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-10 bg-gradient-to-r from-brand-dark via-brand to-sky" />
        <div className="container-site flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full bg-white p-4 shadow-xl sm:h-44 sm:w-44"><img src={site.logo} alt={`${site.name} logo`} className="max-h-full max-w-full object-contain" /></div>
          <div>
            <h1 id="donate-title" className="text-3xl font-extrabold uppercase leading-tight tracking-tight text-ink sm:text-4xl md:text-5xl">{site.name}</h1>
            <p className="mt-2 text-lg font-medium uppercase tracking-widest text-ink/80">{t("Fundraiser")}</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 md:py-16">
        <div className="container-site grid items-start gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <h2 className="text-4xl font-extrabold uppercase tracking-tight text-ink md:text-5xl">{t("About Us")}</h2>
            <div className="mt-6 space-y-5 text-[17px] leading-relaxed text-ink/85">
              <p className="font-medium">{site.name}</p>
              <p>{c("donate.text")}</p>
              <p>{site.tagline}</p>
              <p>{c("donate.footnote")}</p>
              <p>{t("Registered under the M.P. Societies Registration Act, 1973. Donations are eligible for deduction under Section 80G, subject to applicable rules.")}</p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {causes.slice(0, 3).map((x) => (
                <figure key={x.title} className="overflow-hidden rounded-2xl ring-1 ring-brand/10">
                  <img src={x.img} alt={x.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  <figcaption className="bg-brand-light px-3 py-2 text-center text-sm font-semibold text-brand-dark">{t(x.title)}</figcaption>
                </figure>
              ))}
            </div>

            {/* fills the left column down to the height of the donation cards */}
            <figure className="mt-10 overflow-hidden rounded-3xl ring-1 ring-brand/10">
              <img src={G + "/csr-volunteering/sap-volunteers-group.jpg"} alt="Our volunteers" loading="lazy" className="aspect-[16/9] w-full object-cover" />
            </figure>
            <h3 className="mt-10 text-2xl font-extrabold uppercase tracking-tight text-ink">{t("How your gift reaches people")}</h3>
            <ol className="mt-5 space-y-4">
              {[["Choose an amount", "Pick a preset or enter any amount you like."], ["Add your details", "Your name and email go on the receipt. PAN is optional and is needed for the 80G deduction."], ["Download your receipt", "Save it as a PDF or JPG as soon as you donate."]].map(([h, d], i) => (
                <li key={h} className="flex gap-4 rounded-2xl bg-brand-light/60 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">{i + 1}</span>
                  <span className="leading-snug"><strong className="block font-semibold text-ink">{t(h)}</strong><span className="text-sm text-ink/70">{t(d)}</span></span>
                </li>
              ))}
            </ol>
            <h3 className="mt-10 text-2xl font-extrabold uppercase tracking-tight text-ink">{t("Registrations")}</h3>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {[["80G Approval", reg80G.value], ["12A Registration", reg12A.value], ["FCRA", fcraReg.value], ["Society Reg. No.", site.regLine.replace("Reg. No. ", "")]].map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-brand/15 bg-white px-4 py-3"><dt className="text-xs font-semibold uppercase tracking-widest text-ink/55">{t(k)}</dt><dd className="mt-1 break-all font-semibold text-ink">{v}</dd></div>
              ))}
            </dl>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28">
            <div className="rounded-3xl bg-white p-6 shadow-[0_10px_40px_-12px_rgba(11,79,156,.35)] ring-1 ring-brand/10 sm:p-7">
              {!receipt ? (
                <form onSubmit={donate} noValidate>
                  <h2 className="text-2xl font-extrabold uppercase tracking-tight text-ink">{c("donate.title")}</h2>
                  <div className="mt-4">
                    <label className={label} htmlFor="d-amount">{t("Amount (₹)")}</label>
                    <div className="flex flex-wrap gap-2">
                      {presets.map((p) => (
                        <button key={p} type="button" onClick={() => setAmount(String(p))} className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${Number(amount) === p ? "border-brand bg-brand text-white" : "border-brand/25 text-brand-dark hover:bg-brand-light"}`}>₹{p.toLocaleString("en-IN")}</button>
                      ))}
                    </div>
                    <input id="d-amount" className={`${input} mt-3`} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Other amount" />
                  </div>
                  <div className="mt-4 space-y-3">
                    <div><label className={label} htmlFor="d-name">{t("Full Name")} *</label><input id="d-name" className={input} maxLength={80} value={form.name} onChange={set("name")} autoComplete="name" /></div>
                    <div><label className={label} htmlFor="d-email">{t("Email")} *</label><input id="d-email" type="email" className={input} maxLength={120} value={form.email} onChange={set("email")} autoComplete="email" /></div>
                    <div><label className={label} htmlFor="d-pan">{t("PAN (for 80G, optional)")}</label><input id="d-pan" className={`${input} uppercase`} maxLength={10} value={form.pan} onChange={set("pan")} placeholder="ABCDE1234F" /></div>
                  </div>
                  {err && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{t(err)}</p>}
                  <button type="submit" className="mt-5 w-full rounded-full bg-gradient-to-r from-brand-dark to-brand px-6 py-3.5 text-base font-bold uppercase tracking-wide text-white shadow-lg shadow-brand/30 transition hover:brightness-110">{t("Donate Now")}</button>
                  <p className="mt-3 text-center text-xs text-ink/60">{t("Demo: no payment is taken. You will see how your receipt looks.")}</p>
                </form>
              ) : (
                <div>
                  <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{t("Thank you")}, {receipt.name}! {t("Your demo donation of")} ₹{receipt.amount.toLocaleString("en-IN")} {t("was recorded.")}</p>
                  {preview && <img src={preview} alt="Donation receipt preview" className="mt-4 w-full rounded-lg border border-ink/10" />}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button onClick={() => downloadReceipt(receipt, "pdf")} className="rounded-full bg-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-ink/90">{t("Download PDF")}</button>
                    <button onClick={() => downloadReceipt(receipt, "jpg")} className="rounded-full bg-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-ink/90">{t("Download JPG")}</button>
                  </div>
                  <button onClick={() => setReceipt(null)} className="mt-3 w-full text-center text-sm font-semibold text-brand-dark underline underline-offset-4">{t("Make another donation")}</button>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-[0_10px_40px_-12px_rgba(11,79,156,.25)] ring-1 ring-brand/10 sm:p-7">
              <h2 className="text-2xl font-extrabold uppercase tracking-tight text-ink">{t("Your gift supports")}</h2>
              <ul className="mt-4 divide-y divide-ink/10">
                {causes.map((x) => (
                  <li key={x.title} className="flex h-[84px] items-center gap-4 first:h-[72px] first:pb-3 last:h-[72px] last:pt-3">
                    <img src={x.img} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    <span className="min-w-0 flex-1 leading-snug"><strong className="block truncate text-[15px] font-semibold text-ink">{t(x.title)}</strong><span className="block truncate text-sm text-ink/65">{t(x.text)}</span></span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-ink/10 pt-4 text-sm font-semibold">
                <a href={site.razorpayMe} target="_blank" rel="noopener noreferrer" className="text-brand-dark underline underline-offset-4">{t("Pay on our secure Razorpay page")}</a>
                {site.razorpayMonthly && <a href={site.razorpayMonthly} target="_blank" rel="noopener noreferrer" className="text-brand-dark underline underline-offset-4">{t("Donate Monthly")}</a>}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Highlights eyebrow="Why give" title="Your gift, put to work"
        items={[["Education", "Learning kits, books and support for children in our education programmes."], ["Health", "Health camps, check-ups and support for patients in need."], ["Livelihoods", "Skill training and self-help group support for women."], ["Environment", "Tree plantation and care drives with local communities."], ["Relief", "Help for families affected by emergencies and hardship."], ["Accountability", "12A, 80G, FCRA and CSR-1 registered, with published reports."]]} />
      <Faq title="Donation FAQ" items={[["Is my donation tax-deductible?", "The Samiti holds 80G approval, so eligible donations qualify for deduction under Section 80G, subject to applicable rules."], ["Which payment methods can I use?", "The secure payment page lists the available options, such as UPI, cards and net banking."], ["Will I get a receipt?", "Add your email on the payment page, and contact us if you need a receipt or an 80G certificate."], ["Can I donate to a specific cause?", "Yes. Use the sponsor links on the Projects page or write to us to direct your gift."], ["Can I donate from abroad?", "We hold FCRA registration. Please contact us for foreign contribution details."]]} />
    </>
  );
}
