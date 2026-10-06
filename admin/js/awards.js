import { getAwards, createAward, updateAward, deleteAward, uploadAwardCertificate, removeAwardCertificate } from "./data.js";
import { h, fmtDate, field, modal, tag, dataTable, confirmDialog, toast, busy, validate, rules } from "./ui.js";

// Same groups as the filter buttons on the website page (src/data/awards.ts). Another group can be typed in.
const CATEGORIES = ["Award / Recognition", "Appreciation", "Recommendation Letter", "Government Reference", "Training Certificate"];
const MAX_MB = 8;
const imageProblem = (file) => (!/^image\/(jpeg|png|webp)$/.test(file.type) ? "Please choose a JPG, PNG or WebP image of the certificate." : file.size > MAX_MB * 1024 * 1024 ? `The image is larger than ${MAX_MB} MB.` : null);

function form(r, reload) {
  r = r || {};
  const save = h("button", { type: "submit" }, r.id ? "Save changes" : "Add achievement");
  const picker = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp" });
  const current = h("div", { class: "thumbs" });
  let cleared = false; // "Remove certificate" pressed: saved without a certificate
  const showCurrent = () => current.replaceChildren(...(r.image_url && !cleared
    ? [h("div", null, h("a", { href: r.image_url, target: "_blank", rel: "noopener" }, h("img", { src: r.image_url, alt: "Current certificate" })),
      h("button", { type: "button", class: "danger sm", onclick: () => { cleared = true; picker.value = ""; showCurrent(); } }, "Remove"))]
    : [h("p", { class: "mut" }, cleared ? "The certificate will be removed when you save." : "No certificate image yet.")]));

  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    if (!validate(f, { title: rules.required("Title", 200), category: rules.required("Type", 60), description: rules.max("Description", 600) })) return;
    const file = picker.files[0], problem = file && imageProblem(file);
    if (problem) return toast(problem, "err");
    const b = { title: f.title.value.trim(), category: f.category.value.trim(), description: f.description.value.trim(), published: f.published.checked };
    try {
      await busy(save, async () => {
        let stale = null; // an uploaded file that is no longer used after this save
        if (file) { Object.assign(b, await uploadAwardCertificate(file)); stale = r.storage_path; }
        else if (cleared) { b.image_url = null; b.storage_path = null; stale = r.storage_path; }
        try { r.id ? await updateAward(r.id, b) : await createAward(b); }
        catch (err) { if (file) await removeAwardCertificate(b.storage_path); throw err; } // do not leave an orphan upload behind
        if (stale && stale !== b.storage_path) await removeAwardCertificate(stale);
      }, file ? "Uploading…" : "Saving…");
      close(); toast(r.id ? "Saved." : "Achievement added. It now shows first on the website."); reload();
    } catch (err) { toast(err.message, "err"); }
  } },
    field("Title *", h("input", { name: "title", required: true, maxlength: "200", placeholder: "e.g. Certificate of Excellence – Municipal General Hospital, Mumbai", value: r.title || "" })),
    field("Type * (choose one, or type your own)", h("input", { name: "category", required: true, maxlength: "60", list: "award-cats", value: r.category || CATEGORIES[0] })),
    h("datalist", { id: "award-cats" }, CATEGORIES.map((c) => h("option", { value: c }))),
    field("Description (shown under the title; up to 600 characters)", h("textarea", { name: "description", rows: "4", maxlength: "600" }, r.description || "")),
    h("h2", null, "Certificate"), current,
    field(`Upload the certificate image (JPG, PNG or WebP, up to ${MAX_MB} MB)${r.image_url ? ": replaces the current one" : ""}`, picker),
    h("label", { class: "chk" }, h("input", { type: "checkbox", name: "published", checked: r.id ? !!r.published : true }), "Published (visible on the website)"),
    h("div", { class: "row end" },
      r.id && h("button", { class: "danger", type: "button", onclick: async () => {
        if (!await confirmDialog({ title: "Remove achievement?", text: `“${r.title}” and its certificate will be removed from the website. This cannot be undone.`, ok: "Remove", danger: true })) return;
        try { await deleteAward(r); close(); toast("Achievement removed."); reload(); } catch (err) { toast(err.message, "err"); }
      } }, "Remove achievement"),
      h("div", { class: "grow" }), h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), save));
  const close = modal(r.id ? "Edit achievement" : "Add achievement", f); showCurrent();
}

export default async () => {
  const wrap = h("div");
  const list = dataTable({
    columns: [
      { label: "Order", cell: (r) => r.n, sort: (r) => r.n, cls: "num" },
      { label: "Certificate", cell: (r) => (r.image_url ? h("div", { class: "thumbs" }, h("div", null, h("img", { src: r.image_url, alt: "" }))) : h("span", { class: "mut" }, "None")) },
      { label: "Achievement", cell: (r) => h("div", null, h("b", null, r.title), r.description ? h("div", { class: "mut" }, r.description.length > 120 ? r.description.slice(0, 120) + "…" : r.description) : null), sort: (r) => (r.title || "").toLowerCase() },
      { label: "Type", cell: (r) => r.category, sort: (r) => r.category },
      { label: "Added", cell: (r) => fmtDate(r.created_at), sort: (r) => r.created_at },
      { label: "Status", cell: (r) => tag(r.published ? "active" : "pending", r.published ? "Published" : "Hidden"), sort: (r) => (r.published ? 0 : 1) }],
    search: (r) => [r.title, r.description, r.category].join(" "), searchLabel: "Search achievements",
    filters: [
      { label: "Type", options: (rs) => [...new Set(rs.map((r) => r.category).filter(Boolean))].sort().map((c) => [c, c]), test: (r, x) => r.category === x },
      { label: "Status", options: [["published", "Published"], ["hidden", "Hidden"]], test: (r, x) => (x === "published") === !!r.published }],
    sort: { i: 0, dir: "asc" }, pageSize: 25, onRow: (r) => form(r, load),
    summary: (rows) => h("p", { class: "mut" }, `${rows.length} achievement(s) · ${rows.filter((r) => r.image_url).length} with a certificate`),
    empty: "No achievements yet. Add one and it appears on the website under About Us → Awards & Recognition.",
    tools: [h("button", { onclick: () => form(null, load) }, "+ Add achievement")]
  });
  async function load() {
    list.loading();
    try { list.set((await getAwards()).map((r, i) => ({ ...r, n: i + 1 }))); }
    catch (e) { list.error(e.code === "PGRST205" ? "The awards table does not exist yet. Run supabase/migrations/20250114000000_awards.sql in the Supabase SQL Editor." : e.message); }
  }
  wrap.append(h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Awards & Recognition"),
    h("p", { class: "mut" }, "Awards, appreciation and recommendation letters shown on the website (About Us → Awards & Recognition), in this order. A new one goes first. Click a row to edit it, replace its certificate or remove it."))), list.el);
  await load(); return wrap;
};
