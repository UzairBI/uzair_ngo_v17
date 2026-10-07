import { useState } from "react";
import { impactTiers } from "../data/content";
import DonateButton from "./DonateButton";
const fmt = (n: number) => n.toLocaleString("en-IN");
const MIN = 500, MAX = 25000;
const QUICK = [500, 1000, 2500, 5000, 10000, 25000];
export default function ImpactCalculator() {
  const [amount, setAmount] = useState(2500);
  const outcome = [...impactTiers].reverse().find((t) => amount >= t.min) ?? impactTiers[0];
  const pct = ((amount - MIN) / (MAX - MIN)) * 100;
  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-white text-ink shadow-xl">
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/55">Select contribution</p>
          <span className="rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-dark">INR only</span>
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3 border-b border-ink/10 pb-4">
          <p className="text-sm font-medium text-ink/60">Contribution amount</p>
          <p key={amount} className="ic-pop text-3xl font-bold tabular-nums text-brand-dark">₹{fmt(amount)}</p>
        </div>

        <div className="mt-5">
          <input type="range" min={MIN} max={MAX} step={500} value={amount} onChange={(e) => setAmount(Number(e.target.value))}
            aria-label="Contribution amount in rupees" className="ic-range w-full" style={{ ["--p" as string]: `${pct}%` }} />
          <div className="mt-2 flex justify-between text-xs font-medium text-ink/50"><span>₹ 500</span><span>₹ 12,500</span><span>₹ 25,000</span></div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
          {QUICK.map((q) => (
            <button key={q} type="button" aria-pressed={amount === q} onClick={() => setAmount(q)}
              className={`!min-h-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${amount === q ? "border-brand bg-brand text-white" : "border-ink/15 bg-white text-ink/70 hover:border-brand/50 hover:bg-brand-light hover:text-brand-dark"}`}>₹{fmt(q)}</button>
          ))}
        </div>

        <div className="relative mt-5 overflow-hidden rounded-xl border border-brand/15 bg-brand-light/60 p-4" aria-live="polite">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-brand to-sky-400" />
          <div className="flex items-start gap-3 pl-2">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.4-7-9.6A4 4 0 0112 8a4 4 0 017 2.4C19 15.6 12 20 12 20z" /></svg>
            </span>
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-dark">Direct impact outcome</p>
              <h4 key={outcome.text} className="ic-pop mt-0.5 text-sm font-semibold leading-snug sm:text-base">{outcome.text}</h4>
            </div>
          </div>
        </div>

        <DonateButton to={`/donate?amount=${amount}`} full size="lg" className="mt-5">Donate ₹{fmt(amount)} Now</DonateButton>
      </div>
      <style>{`
        .ic-range{-webkit-appearance:none;appearance:none;height:6px !important;min-height:0 !important;padding:0 !important;border:0 !important;border-radius:999px;outline:none;cursor:pointer;
          background:linear-gradient(to right,#1479d1 0,#38bdf8 var(--p),#e5ecf5 var(--p),#e5ecf5 100%)}
        .ic-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;height:20px;width:20px;border-radius:50%;background:#fff;border:3px solid #1479d1;box-shadow:0 2px 8px rgba(20,121,209,.4);transition:transform .15s}
        .ic-range::-moz-range-thumb{height:14px;width:14px;border-radius:50%;background:#fff;border:3px solid #1479d1;box-shadow:0 2px 8px rgba(20,121,209,.4)}
        .ic-range:hover::-webkit-slider-thumb,.ic-range:active::-webkit-slider-thumb{transform:scale(1.15)}
        .ic-range:focus-visible{outline:3px solid rgba(20,121,209,.35);outline-offset:6px}
        .ic-pop{animation:icPop .35s ease both}
        @keyframes icPop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){.ic-pop{animation:none}}
      `}</style>
    </div>
  );
}
