import { getMedicalFundings, createMedicalFunding, updateMedicalFunding, deleteMedicalFunding, sumAmt } from "./data.js";
import { h, inr, fmtDate, field, modal, tag, dataTable, confirmDialog, toast, busy, validate, rules } from "./ui.js";

// The two lists on the website page (src/components/MedicalFunding.tsx).
const KINDS = [["hospital", "Hospital funding"], ["facility", "NGO medical facility"]];
const kindName = (k) => (KINDS.find(([v]) => v === k) || KINDS[0])[1];

function form(r, reload) {
  r = r || {};
  const save = h("button", { type: "submit" }, r.id ? "Save changes" : "Add entry");
  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    if (!validate(f, { name: rules.required("Name", 160), location: rules.max("Location", 120), amount: rules.wholeNumber("Amount"),
      period: rules.max("Year", 40), purpose: rules.max("Purpose", 600) })) return;
    const b = { kind: f.kind.value, name: f.name.value.trim(), location: f.location.value.trim(), amount: Number(f.amount.value) || 0,
      period: f.period.value.trim(), purpose: f.purpose.value.trim(), published: f.published.checked };
    try {
      await busy(save, () => (r.id ? updateMedicalFunding(r.id, b) : createMedicalFunding(b)));
      close(); toast(r.id ? "Saved." : "Entry added. It now shows on the website."); reload();
    } catch (err) { toast(err.message, "err"); }
  } },
    h("div", { class: "grid2" },
      field("List *", h("select", { name: "kind" }, KINDS.map(([v, l]) => h("option", { value: v, selected: v === (r.kind || "hospital") }, l)))),
      field("Hospital / facility name *", h("input", { name: "name", required: true, maxlength: "160", value: r.name || "" })),
      field("Location", h("input", { name: "location", maxlength: "120", placeholder: "e.g. Sagar, Madhya Pradesh", value: r.location || "" })),
      field("Amount donated in ₹ (0 = no amount shown)", h("input", { name: "amount", type: "number", min: "0", step: "1", inputmode: "numeric", value: Math.round(Number(r.amount) || 0) })),
      field("Year or period (as it should read)", h("input", { name: "period", maxlength: "40", placeholder: "e.g. 2024 or 2023-24", value: r.period || "" }))),
    field("What the money was for (shown under the name; up to 600 characters)", h("textarea", { name: "purpose", rows: "3", maxlength: "600" }, r.purpose || "")),
    h("label", { class: "chk" }, h("input", { type: "checkbox", name: "published", checked: r.id ? !!r.published : true }), "Published (visible on the website)"),
    h("div", { class: "row end" },
      r.id && h("button", { class: "danger", type: "button", onclick: async () => {
        if (!await confirmDialog({ title: "Remove entry?", text: `“${r.name}” will be removed from the website. This cannot be undone.`, ok: "Remove", danger: true })) return;
        try { await deleteMedicalFunding(r.id); close(); toast("Entry removed."); reload(); } catch (err) { toast(err.message, "err"); }
      } }, "Remove entry"),
      h("div", { class: "grow" }), h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), save));
  const close = modal(r.id ? "Edit entry" : "Add entry", f);
}

export default async () => {
  const wrap = h("div");
  const list = dataTable({
    columns: [
      { label: "Hospital / facility", cell: (r) => h("div", null, h("b", null, r.name), r.purpose ? h("div", { class: "mut" }, r.purpose.length > 120 ? r.purpose.slice(0, 120) + "…" : r.purpose) : null), sort: (r) => (r.name || "").toLowerCase() },
      { label: "List", cell: (r) => kindName(r.kind), sort: (r) => r.kind },
      { label: "Location", cell: (r) => r.location || "—", sort: (r) => (r.location || "").toLowerCase() },
      { label: "Year", cell: (r) => r.period || "—", sort: (r) => r.period },
      { label: "Amount donated", cell: (r) => (Number(r.amount) ? inr(r.amount) : h("span", { class: "mut" }, "Not shown")), sort: (r) => Number(r.amount), cls: "num", firstDir: "desc" },
      { label: "Added", cell: (r) => fmtDate(r.created_at), sort: (r) => r.created_at, firstDir: "desc" },
      { label: "Status", cell: (r) => tag(r.published ? "active" : "pending", r.published ? "Published" : "Hidden"), sort: (r) => (r.published ? 0 : 1) }],
    search: (r) => [r.name, r.location, r.purpose, r.period].join(" "), searchLabel: "Search funding",
    filters: [
      { label: "List", options: KINDS, test: (r, x) => r.kind === x },
      { label: "Status", options: [["published", "Published"], ["hidden", "Hidden"]], test: (r, x) => (x === "published") === !!r.published }],
    pageSize: 25, onRow: (r) => form(r, load),
    summary: (rows) => h("p", { class: "mut" }, `${rows.length} entr${rows.length === 1 ? "y" : "ies"} · ${inr(sumAmt(rows.filter((r) => r.published)))} published as donated`),
    empty: "No funding entries yet. Add one and it appears on the website under Our Projects → Medical Facilities.",
    tools: [h("button", { onclick: () => form(null, load) }, "+ Add entry")]
  });
  async function load() {
    list.loading();
    try { list.set(await getMedicalFundings()); }
    catch (e) { list.error(e.code === "PGRST205" ? "The medical funding table does not exist yet. Run supabase/migrations/20250125000000_medical_fundings.sql in the Supabase SQL Editor." : e.message); }
  }
  wrap.append(h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Medical Funding"),
    h("p", { class: "mut" }, "Hospitals and medical facilities funded by the Samiti, with the amount donated to each, as shown on the website (Our Projects → Medical Facilities). The totals on the page add up by themselves. Click a row to edit or remove it."))), list.el);
  await load(); return wrap;
};
