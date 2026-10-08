import { useMedicalFundings } from "../hooks/useLiveData";
import { usePageText } from "../hooks/usePageText";
import type { MedicalFunding as Funding } from "../data/medicalFunding";

const rupees = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const sum = (rows: Funding[]) => rows.reduce((s, r) => s + r.amount, 0);

function Group({ title, empty, rows }: { title: string; empty: string; rows: Funding[] }) {
  const total = sum(rows);
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-xl font-bold sm:text-2xl">{title}</h3>
        {total > 0 && <p className="text-sm font-semibold text-brand-dark"><span>Total</span> {rupees(total)}</p>}
      </div>
      {rows.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed p-5 text-sm text-ink/60">{empty}</p> : (
        <ul className="mt-4 divide-y divide-ink/10 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{r.name}</p>
                {(r.location || r.period) && <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-ink/45">{[r.location, r.period].filter(Boolean).join(" · ")}</p>}
                {r.purpose && <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{r.purpose}</p>}
              </div>
              {r.amount > 0 && (
                <p className="shrink-0 sm:text-right">
                  <span className="block font-serif text-xl font-bold text-brand-dark sm:text-2xl">{rupees(r.amount)}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/45">Donated</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The hospitals and medical facilities the Samiti has funded, with the amounts, as published in the admin panel (Medical Funding). */
export default function MedicalFunding() {
  const c = usePageText();
  const all = useMedicalFundings();
  const hospitals = all.filter((r) => r.kind === "hospital"), facilities = all.filter((r) => r.kind === "facility");
  const total = sum(all);
  const tiles: [string, string][] = [...(total > 0 ? [[rupees(total), "Total funds donated"] as [string, string]] : []),
    [String(hospitals.length), "Hospitals funded"], [String(facilities.length), "Medical facilities"]];
  return (
    <section id="funding" className="bg-slate-50 py-16">
      <div className="container-site">
        <p className="eyebrow">{c("medical.funding.eyebrow")}</p>
        <h2 className="h2 mt-2">{c("medical.funding.title")}</h2>
        <p className="mt-3 max-w-3xl text-ink/70">{c("medical.funding.text")}</p>
        <dl className={`mt-8 grid gap-3 text-center sm:gap-4 ${tiles.length === 3 ? "sm:grid-cols-3" : "grid-cols-2"}`}>
          {tiles.map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink/5 sm:p-5">
              <dt className="font-serif text-2xl font-bold text-brand-dark sm:text-3xl">{value}</dt>
              <dd className="text-sm text-ink/70">{label}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 grid gap-10">
          <Group title={c("medical.hospitals.title")} empty={c("medical.hospitals.empty")} rows={hospitals} />
          <Group title={c("medical.facilities.title")} empty={c("medical.facilities.empty")} rows={facilities} />
        </div>
      </div>
    </section>
  );
}
