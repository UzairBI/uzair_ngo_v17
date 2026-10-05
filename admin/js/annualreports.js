import { getAnnualReports, createAnnualReport, updateAnnualReport, deleteAnnualReport, uploadAnnualReportFile, removeAnnualReportFile } from "./data.js";
import { h, fmtDate, field, modal, tag, dataTable, confirmDialog, toast, busy, validate, rules } from "./ui.js";

const MAX_MB = 20;
const fyRule = (v) => (!v ? "Financial year is required" : /^\d{4}-\d{2}$/.test(v) ? null : "Write it like 2026-27");
const linkRule = (v) => (v && !/^(\/(?!\/)|https:\/\/)/.test(v) ? "Use a link starting with https:// (or a file of this website starting with /)" : v.length > 600 ? "Link is too long" : null);

function form(r, reload) {
  r = r || {};
  const save = h("button", { type: "submit" }, r.id ? "Save changes" : "Add year");
  const picker = h("input", { type: "file", accept: "application/pdf,.pdf" });
  const link = h("input", { name: "file_url", placeholder: "https://… (only if the PDF is hosted somewhere else)", value: r.storage_path ? "" : r.file_url || "" });
  const current = h("p", { class: "mut" });
  let cleared = false; // "Remove PDF" pressed: the box goes back to "not uploaded yet" on save
  const showCurrent = () => current.replaceChildren(...(r.file_url && !cleared
    ? ["Current PDF: ", h("a", { href: r.file_url, target: "_blank", rel: "noopener" }, r.storage_path ? "uploaded file ↗" : r.file_url + " ↗"), " ",
      h("button", { type: "button", class: "danger sm", onclick: () => { cleared = true; link.value = ""; picker.value = ""; showCurrent(); } }, "Remove PDF")]
    : [cleared ? "The PDF will be removed when you save." : "No PDF yet: the box shows “Report not uploaded yet” on the website."]));

  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    if (!validate(f, { fy: fyRule, title: rules.max("Title", 160), description: rules.max("Description", 400), file_url: linkRule })) return;
    const file = picker.files[0];
    if (file && !/\.pdf$/i.test(file.name)) return toast("Please choose a PDF file.", "err");
    if (file && file.size > MAX_MB * 1024 * 1024) return toast(`The PDF is larger than ${MAX_MB} MB.`, "err");
    const fy = f.fy.value.trim();
    const b = { fy, title: f.title.value.trim(), description: f.description.value.trim(), published: f.published.checked };
    try {
      await busy(save, async () => {
        let stale = null; // an uploaded file that is no longer used after this save
        if (file) { Object.assign(b, await uploadAnnualReportFile(fy, file)); stale = r.storage_path; }
        else if (link.value.trim()) { if (link.value.trim() !== r.file_url) { b.file_url = link.value.trim(); b.storage_path = null; stale = r.storage_path; } }
        else if (cleared || !r.storage_path) { b.file_url = null; b.storage_path = null; stale = r.storage_path; }
        try { r.id ? await updateAnnualReport(r.id, b) : await createAnnualReport(b); }
        catch (err) { if (file) await removeAnnualReportFile(b.storage_path); throw err; } // do not leave an orphan upload behind
        if (stale && stale !== b.storage_path) await removeAnnualReportFile(stale);
      }, file ? "Uploading…" : "Saving…");
      close(); toast(r.id ? "Saved." : "Year added."); reload();
    } catch (err) { toast(err.message, "err"); }
  } },
    h("div", { class: "grid2" },
      field("Financial year (e.g. 2026-27)", h("input", { name: "fy", required: true, maxlength: "7", placeholder: "2026-27", value: r.fy || "" })),
      field("Title on the box", h("input", { name: "title", maxlength: "160", placeholder: "Annual Report 2026-27", value: r.title || "" }))),
    field("Short description (optional, shown under the title)", h("textarea", { name: "description", rows: "2", maxlength: "400" }, r.description || "")),
    h("h2", null, "Report PDF"), current,
    field(`Upload a PDF (up to ${MAX_MB} MB)${r.file_url ? ": replaces the current one" : ""}`, picker),
    field("…or paste a link to the PDF", link),
    h("label", { class: "chk" }, h("input", { type: "checkbox", name: "published", checked: r.id ? !!r.published : true }), "Published (the box is visible on the website)"),
    h("div", { class: "row end" },
      r.id && h("button", { class: "danger", type: "button", onclick: async () => {
        if (!await confirmDialog({ title: `Delete ${r.fy}?`, text: "The box for this year and its uploaded PDF will be deleted from the website. This cannot be undone.", ok: "Delete year", danger: true })) return;
        try { await deleteAnnualReport(r); close(); toast("Year deleted."); reload(); } catch (err) { toast(err.message, "err"); }
      } }, "Delete year"),
      h("div", { class: "grow" }), h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), save));
  const close = modal(r.id ? `Edit ${r.fy}` : "Add a year", f); showCurrent();
}

export default async () => {
  const wrap = h("div");
  const list = dataTable({
    columns: [
      { label: "Year", cell: (r) => h("b", null, r.fy), sort: (r) => r.fy, firstDir: "desc" },
      { label: "Title", cell: (r) => h("div", null, r.title || "—", r.description ? h("div", { class: "mut" }, r.description.length > 110 ? r.description.slice(0, 110) + "…" : r.description) : null), sort: (r) => (r.title || "").toLowerCase() },
      { label: "PDF", cell: (r) => (r.file_url ? h("a", { href: r.file_url, target: "_blank", rel: "noopener" }, "Open PDF ↗") : h("span", { class: "mut" }, "Not uploaded")), sort: (r) => (r.file_url ? 0 : 1) },
      { label: "Updated", cell: (r) => fmtDate(r.updated_at), sort: (r) => r.updated_at },
      { label: "Status", cell: (r) => tag(!r.published ? "pending" : r.file_url ? "active" : "new", !r.published ? "Hidden" : r.file_url ? "Online" : "Empty box"), sort: (r) => (!r.published ? 2 : r.file_url ? 0 : 1) }],
    search: (r) => [r.fy, r.title, r.description].join(" "), searchLabel: "Search years",
    filters: [{ label: "PDF", options: [["yes", "Uploaded"], ["no", "Not uploaded"]], test: (r, x) => (x === "yes") === !!r.file_url }],
    sort: { i: 0, dir: "asc" }, pageSize: 25, onRow: (r) => form(r, load),
    summary: (rows) => h("p", { class: "mut" }, `${rows.length} year(s) · ${rows.filter((r) => r.file_url).length} with a PDF`),
    empty: "No years yet. Add a financial year and it appears as a box on the website.",
    tools: [h("button", { onclick: () => form(null, load) }, "+ Add year")]
  });
  async function load() {
    list.loading();
    try { list.set(await getAnnualReports()); }
    catch (e) { list.error(e.code === "PGRST205" ? "The annual reports table does not exist yet. Run supabase/migrations/20250108000000_annual_reports.sql in the Supabase SQL Editor." : e.message); }
  }
  wrap.append(h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Annual Reports"),
    h("p", { class: "mut" }, "One box per financial year on the website (Transparency & Reports → Annual Reports). Click a year to change its title or description, or to upload its PDF. A year without a PDF shows as “Report not uploaded yet”."))), list.el);
  await load(); return wrap;
};
