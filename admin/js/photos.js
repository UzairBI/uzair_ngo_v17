import { getGalleryPhotos, createGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto, uploadGalleryPhoto, removeGalleryPhotoFile } from "./data.js";
import { h, fmtDate, field, modal, tag, dataTable, confirmDialog, toast, busy, validate, rules } from "./ui.js";

// Same groups as the filter buttons of the website Photo Gallery (src/pages/Media.tsx). Another group can be typed in.
const CATEGORIES = ["Education", "Health", "Women Empowerment", "Environment", "Social Relief", "Solar Lantern", "Skill Development", "CSR & Volunteering"];
const MAX_MB = 8, MAX_FILES = 12;
const imageProblem = (file) => (!/^image\/(jpeg|png|webp)$/.test(file.type) ? "Please choose JPG, PNG or WebP photos." : file.size > MAX_MB * 1024 * 1024 ? `“${file.name}” is larger than ${MAX_MB} MB.` : null);
// groups in use on the website right now (kept up to date each time the list loads), so a group typed earlier is offered too
let groupsInUse = [];
const NEW_GROUP = "\u0000new";
/**
 * The group of a photo: a drop-down that always lists every group, with "New group…" as its last choice, which opens
 * a box to type a name. The value read by the form is the hidden field "category".
 */
const groupField = (value) => {
  const all = [...new Set([...CATEGORIES, ...groupsInUse, value].filter(Boolean))];
  const chosen = value || CATEGORIES[0];
  const out = h("input", { type: "hidden", name: "category", value: chosen });
  const typed = h("input", { maxlength: "60", placeholder: "Name of the new group", "aria-label": "Name of the new group", hidden: true, oninput: () => { out.value = typed.value; } });
  const pick = h("select", { "aria-label": "Group", onchange: () => {
    const isNew = pick.value === NEW_GROUP;
    typed.hidden = !isNew; out.value = isNew ? typed.value : pick.value;
    if (isNew) typed.focus();
  } }, all.map((c) => h("option", { value: c, selected: c === chosen }, c)), h("option", { value: NEW_GROUP }, "+ New group…"));
  return [h("label", null, "Group * (the filter button it appears under on the website)", pick, typed, out)];
};
const captionField = (value, many) => field(many ? "Caption (optional; shown under every photo you add now; up to 300 characters)" : "Caption (shown under the photo; up to 300 characters)",
  h("textarea", { name: "caption", rows: "2", maxlength: "300", placeholder: "e.g. Children studying together at a Sahara learning centre" }, value || ""));

/** Add one or several photos at once: they share the group and caption typed here (each can be edited afterwards). */
function addForm(reload) {
  const save = h("button", { type: "submit" }, "Add photos");
  const picker = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", multiple: true });
  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    if (!validate(f, { category: rules.required("Group", 60), caption: rules.max("Caption", 300) })) return;
    const files = [...picker.files];
    if (!files.length) return toast("Choose at least one photo.", "err");
    if (files.length > MAX_FILES) return toast(`Add up to ${MAX_FILES} photos at a time.`, "err");
    const problem = files.map(imageProblem).find(Boolean);
    if (problem) return toast(problem, "err");
    const b = { category: f.category.value.trim(), caption: f.caption.value.trim(), published: f.published.checked };
    let done = 0;
    try {
      await busy(save, async () => {
        for (const file of files) {
          const up = await uploadGalleryPhoto(file);
          try { await createGalleryPhoto({ ...b, ...up }); } catch (err) { await removeGalleryPhotoFile(up.storage_path); throw err; } // do not leave an orphan upload behind
          done++;
        }
      }, "Uploading…");
      close(); toast(`${done} photo(s) added. They now show first in the website Photo Gallery.`); reload();
    } catch (err) { toast(done ? `${done} photo(s) added, then: ${err.message}` : err.message, "err"); if (done) reload(); }
  } },
    field(`Photos * (JPG, PNG or WebP, up to ${MAX_MB} MB each; you can choose up to ${MAX_FILES} together)`, picker),
    groupField(), captionField("", true),
    h("label", { class: "chk" }, h("input", { type: "checkbox", name: "published", checked: true }), "Published (visible on the website Photo Gallery)"),
    h("div", { class: "row end" }, h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), save));
  const close = modal("Add photos", f);
}

function editForm(r, reload) {
  const save = h("button", { type: "submit" }, "Save changes");
  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    if (!validate(f, { category: rules.required("Group", 60), caption: rules.max("Caption", 300) })) return;
    try {
      await busy(save, () => updateGalleryPhoto(r.id, { category: f.category.value.trim(), caption: f.caption.value.trim(), published: f.published.checked }));
      close(); toast("Photo saved."); reload();
    } catch (err) { toast(err.message, "err"); }
  } },
    h("div", { class: "photo-preview" }, h("a", { href: r.image_url, target: "_blank", rel: "noopener" }, h("img", { src: r.image_url, alt: "" }))),
    groupField(r.category), captionField(r.caption),
    h("label", { class: "chk" }, h("input", { type: "checkbox", name: "published", checked: !!r.published }), "Published (visible on the website Photo Gallery)"),
    h("div", { class: "row end" },
      h("button", { class: "danger", type: "button", onclick: async () => {
        if (!await confirmDialog({ title: "Remove photo?", text: "This photo will be removed from the website Photo Gallery. This cannot be undone.", ok: "Remove photo", danger: true })) return;
        try { await deleteGalleryPhoto(r); close(); toast("Photo removed."); reload(); } catch (err) { toast(err.message, "err"); }
      } }, "Remove photo"),
      h("div", { class: "grow" }), h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), save));
  const close = modal("Edit photo", f);
}

/** The "Photos" tab of the Media & Gallery page. `onCount(n)` is told how many photos there are. */
export default function photosPane(onCount) {
  const list = dataTable({
    columns: [
      { label: "Photo", cell: (r) => h("div", { class: "thumbs" }, h("div", null, h("img", { src: r.image_url, alt: "", loading: "lazy" }))) },
      { label: "Caption", cell: (r) => (r.caption ? (r.caption.length > 120 ? r.caption.slice(0, 120) + "…" : r.caption) : h("span", { class: "mut" }, "No caption")), sort: (r) => (r.caption || "").toLowerCase() },
      { label: "Group", cell: (r) => r.category, sort: (r) => r.category },
      { label: "Added", cell: (r) => (r.storage_path ? fmtDate(r.created_at) : h("span", { class: "mut" }, "Came with the website")), sort: (r) => r.created_at },
      { label: "Status", cell: (r) => tag(r.published ? "active" : "pending", r.published ? "Published" : "Hidden"), sort: (r) => (r.published ? 0 : 1) }],
    search: (r) => [r.caption, r.category].join(" "), searchLabel: "Search photos",
    filters: [
      { label: "Group", options: (rs) => [...new Set(rs.map((r) => r.category).filter(Boolean))].sort().map((c) => [c, c]), test: (r, x) => r.category === x },
      { label: "Status", options: [["published", "Published"], ["hidden", "Hidden"]], test: (r, x) => (x === "published") === !!r.published }],
    // group by group, as on the website; inside a group the newest comes first
    sort: { i: 2, dir: "asc" }, pageSize: 50, onRow: (r) => editForm(r, load),
    summary: (rows) => h("p", { class: "mut" }, `${rows.length} photo(s): `, [...new Set(rows.map((r) => r.category))].sort().map((c) => `${c} ${rows.filter((r) => r.category === c).length}`).join(" · ")),
    empty: "No photos added yet. Add photos and they appear first in the website Photo Gallery.",
    tools: [h("button", { onclick: () => addForm(load) }, "+ Add photos")]
  });
  async function load() {
    list.loading();
    try { const rows = await getGalleryPhotos(); groupsInUse = [...new Set(rows.map((r) => r.category).filter(Boolean))].sort(); list.set(rows); onCount?.(rows.length); }
    catch (e) { list.error(e.code === "PGRST205" ? "The photo table does not exist yet. Run supabase/migrations/20250119000000_gallery_photos.sql in the Supabase SQL Editor." : e.message); }
  }
  load();
  return h("div", null,
    h("p", { class: "mut" }, "Every photo of the website Photo Gallery (Media & Gallery), group by group. Photos you add show first on the website, newest first, before the ones that came with it. Click a photo to change its caption or group, hide it or remove it."),
    list.el);
}
