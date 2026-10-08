import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { renderCard, downloadCard } from "../lib/memberCard";

interface Listed { card_id: string; full_name: string; role: string; valid_till: string | null; issued_at: string; photo_path: string | null }

const date = (v: string | null) => {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(+d) ? v : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/** Public list of issued (admin-approved) member cards (name, role, ID and photo only; phone and blood group never leave the database). Click one for its details and to download the card. */
export default function IssuedCards({ refresh }: { refresh: number }) {
  const [rows, setRows] = useState<Listed[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Listed | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [again, setAgain] = useState(0);
  const [saving, setSaving] = useState("");
  // the card as anyone may have it: photo, name, role, ID number and validity, without the phone number and blood group
  const download = async (r: Listed, kind: "jpg" | "pdf") => {
    if (saving) return;
    setSaving(kind);
    try { downloadCard(await renderCard({ name: r.full_name, role: r.role, id: r.card_id, valid: r.valid_till ?? "", phone: "", blood: "", hidePrivate: true, photoPath: r.photo_path }), r.full_name, kind); }
    catch { /* nothing was saved: the buttons stay as they are */ }
    setSaving("");
  };

  useEffect(() => {
    if (!supabase) return;
    let alive = true, retry = 0;
    // one failed request (a slow connection, the database waking up) must not leave the error on screen: it is tried again by itself
    const load = (attempt: number) => {
      supabase!.rpc("list_member_cards", { p_search: q, p_limit: 60 }).then(({ data, error }) => {
        if (!alive) return;
        if (!error) { setRows((data as Listed[]) ?? []); setState("ok"); }
        else if (attempt < 2) retry = window.setTimeout(() => load(attempt + 1), 1500 * (attempt + 1));
        else setState("error");
      });
    };
    const timer = setTimeout(() => load(0), 250);
    // coming back to the tab loads it again, so a list that failed (or is out of date) recovers
    const onShow = () => { if (document.visibilityState === "visible") load(2); };
    document.addEventListener("visibilitychange", onShow);
    return () => { alive = false; clearTimeout(timer); clearTimeout(retry); document.removeEventListener("visibilitychange", onShow); };
  }, [q, refresh, again]);

  if (!supabaseConfigured) return null;
  return (
    <section className="bg-white pb-16 md:pb-24">
      <div className="container-site">
        <div className="rounded-3xl border border-brand/10 bg-[#f7fbff] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><h2 className="text-xl font-bold text-ink sm:text-2xl">Issued ID cards</h2><p className="mt-1 text-sm text-ink/60">Click a name to see the card details and download the card.</p></div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or ID" aria-label="Search issued cards" maxLength={40}
              className="w-full rounded-2xl border border-brand/15 bg-white px-5 py-3 text-[15px] text-ink outline-none placeholder:text-ink/40 focus:border-brand focus:ring-4 focus:ring-brand/15 sm:w-72" />
          </div>
          {open && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-[#08305f] to-brand p-5 text-white shadow-lg">
              <div><p className="text-xs font-semibold uppercase tracking-widest text-sky-200">Verified member</p><p className="mt-1 text-2xl font-bold">{open.full_name}</p><p className="text-sky-100">{open.role}</p></div>
              <dl className="grid grid-cols-3 gap-6 text-sm">
                <div><dt className="text-white/60">ID</dt><dd className="font-semibold">{open.card_id}</dd></div>
                <div><dt className="text-white/60">Valid till</dt><dd className="font-semibold">{date(open.valid_till)}</dd></div>
                <div><dt className="text-white/60">Issued</dt><dd className="font-semibold">{date(open.issued_at)}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => download(open, "jpg")} disabled={!!saving} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-sky-50 disabled:opacity-60">{saving === "jpg" ? "Preparing…" : "Download JPG"}</button>
                <button onClick={() => download(open, "pdf")} disabled={!!saving} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-sky-50 disabled:opacity-60">{saving === "pdf" ? "Preparing…" : "Download PDF"}</button>
                <button onClick={() => setOpen(null)} className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25">Close</button>
              </div>
            </div>
          )}
          {state === "error" && (
            <p className="mt-6 flex flex-wrap items-center gap-3 text-sm text-rose-700">The list could not be loaded.
              <button type="button" onClick={() => { setState("loading"); setAgain((n) => n + 1); }} className="rounded-full border border-rose-300 bg-white px-4 py-1.5 font-semibold text-rose-700 hover:bg-rose-50">Try again</button>
            </p>
          )}
          {state === "loading" && <p className="mt-6 text-sm text-ink/60">Loading…</p>}
          {state === "ok" && rows.length === 0 && <p className="mt-6 text-sm text-ink/60">{q ? "No card matches your search." : "No cards have been issued yet."}</p>}
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <li key={r.card_id}>
                <button onClick={() => setOpen(r)} className={`w-full rounded-2xl border bg-white px-4 py-3 text-left transition hover:border-brand hover:shadow-md ${open?.card_id === r.card_id ? "border-brand ring-2 ring-brand/20" : "border-brand/10"}`}>
                  <span className="block truncate font-semibold text-ink">{r.full_name}</span>
                  <span className="block truncate text-sm text-ink/60">{r.role}</span>
                  <span className="mt-1 block text-xs font-semibold text-brand-dark">{r.card_id}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
