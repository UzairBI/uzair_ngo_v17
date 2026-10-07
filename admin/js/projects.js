import { getProjects, createProject, updateProject, deleteProject, getWebsitePortfolio, uploadProjectPhoto, removeProjectPhoto } from "./data.js";
import { h, field, modal, tag, fmtDate, dataTable, confirmDialog, toast, busy, validate, rules } from "./ui.js";

const STATUSES = ["planned", "ongoing", "completed"];
const statusTag = (s) => tag(s === "ongoing" ? "active" : s === "completed" ? "completed" : "pending", s);
const AREA_NAMES = { "child-education": "Child education", "health-nutrition": "Health & nutrition", "women-empowerment": "Women empowerment", environment: "Environment", "social-welfare": "Social welfare" };
const MAX_MB = 8;
const imageProblem = (file) => (!/^image\/(jpeg|png|webp)$/.test(file.type) ? "Please choose a JPG, PNG or WebP photo." : file.size > MAX_MB * 1024 * 1024 ? `The photo is larger than ${MAX_MB} MB.` : null);
const distinct = (rows, key) => [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort().map((v) => [v, AREA_NAMES[v] || v]);

/** Add / edit form (also used by the dashboard quick action). `done` runs after a successful save or delete. */
export function openProjectForm(p, done) {
  p = p || {};
  const save = h("button", { type: "submit" }, p.id ? "Save changes" : "Add project");
  const picker = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp" });
  const current = h("div", { class: "thumbs" });
  let cleared = false; // "Remove" pressed: saved without a photo
  const showCurrent = () => current.replaceChildren(...(p.image_url && !cleared
    ? [h("div", null, h("a", { href: p.image_url, target: "_blank", rel: "noopener" }, h("img", { src: p.image_url, alt: "Current photo" })),
      h("button", { type: "button", class: "danger sm", onclick: () => { cleared = true; picker.value = ""; showCurrent(); } }, "Remove"))]
    : [h("p", { class: "mut" }, cleared ? "The photo will be removed when you save." : "No photo yet.")]));
  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    if (!validate(f, { name: rules.required("Project name", 160), area: rules.max("Area", 80), location: rules.max("Location", 120),
      beneficiaries: rules.wholeNumber("Beneficiaries"), description: rules.max("Description", 2000) })) return;
    const file = picker.files[0], problem = file && imageProblem(file);
    if (problem) return toast(problem, "err");
    const b = Object.fromEntries(new FormData(f)); b.published = f.published.checked; b.beneficiaries = Number(b.beneficiaries) || 0;
    try {
      const saved = await busy(save, async () => {
        let stale = null; // an uploaded file that is no longer used after this save
        if (file) { Object.assign(b, await uploadProjectPhoto(file)); stale = p.storage_path; }
        else if (cleared) { b.image_url = null; b.storage_path = null; stale = p.storage_path; }
        let row;
        try { row = await (p.id ? updateProject(p.id, b) : createProject(b)); }
        catch (err) { if (file) await removeProjectPhoto(b.storage_path); throw err; } // do not leave an orphan upload behind
        if (stale && stale !== b.storage_path) await removeProjectPhoto(stale);
        return row;
      }, file ? "Uploading…" : "Saving…");
      close(); toast(p.id ? "Project saved." : "Project added."); done?.(saved);
    } catch (e) { toast(e.message, "err"); }
  } },
    h("div", { class: "grid2" },
      field("Project name *", h("input", { name: "name", required: true, maxlength: "160", value: p.name || "" })),
      field("Area / category (e.g. Child education)", h("input", { name: "area", maxlength: "80", list: "proj-areas", value: p.area || "" })),
      field("Location", h("input", { name: "location", maxlength: "120", value: p.location || "" })),
      field("Beneficiaries reached", h("input", { name: "beneficiaries", type: "number", min: "0", step: "1", inputmode: "numeric", value: p.beneficiaries ?? 0 })),
      field("Status", h("select", { name: "status" }, STATUSES.map((s) => h("option", { value: s, selected: s === (p.status || "ongoing") }, s))))),
    field("Description", h("textarea", { name: "description", rows: "4", maxlength: "2000" }, p.description || "")),
    h("h2", null, "Photo"), current,
    field(`Upload a photo for the project card on the website (JPG, PNG or WebP, up to ${MAX_MB} MB)${p.image_url ? ": replaces the current one" : ""}`, picker),
    h("label", { class: "chk" }, h("input", { type: "checkbox", name: "published", checked: p.published !== false }), "Show on the website Projects page"),
    h("datalist", { id: "proj-areas" }, Object.values(AREA_NAMES).map((a) => h("option", { value: a }))),
    h("div", { class: "row end" }, h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), save));
  const close = modal(p.id ? "Edit project" : "Add project", f); showCurrent();
}

async function remove(p, done) {
  if (!await confirmDialog({ title: "Delete project?", text: `“${p.name}” will be removed from the admin and from the website. This cannot be undone.`, ok: "Delete project", danger: true })) return false;
  try { await deleteProject(p.id); await removeProjectPhoto(p.storage_path); toast("Project deleted."); done?.(); return true; }
  catch (e) { toast(e.message, "err"); return false; }
}
async function setStatus(p, status, done) {
  try { await updateProject(p.id, { status }); toast(`Status changed to ${status}.`); done?.(); }
  catch (e) { toast(e.message, "err"); done?.(); }
}

function view(p, reload) {
  const kv = (k, v) => h("div", { class: "kv" }, h("span", { class: "mut" }, k), h("span", null, v || "—"));
  const el = h("div", null,
    h("p", null, statusTag(p.status), " ", tag(p.published ? "active" : "pending", p.published ? "Shown on website" : "Hidden from website")),
    h("div", { class: "kvs" }, kv("Area", p.area), kv("Location", p.location), kv("Beneficiaries", Number(p.beneficiaries).toLocaleString("en-IN")), kv("Added", fmtDate(p.created_at))),
    p.description ? h("p", { class: "pre" }, p.description) : h("p", { class: "mut" }, "No description."),
    p.image_url && h("div", { class: "thumbs" }, h("div", null, h("a", { href: p.image_url, target: "_blank", rel: "noopener" }, h("img", { src: p.image_url, alt: "Project photo" })))),
    h("div", { class: "row" }, "Change status:", STATUSES.filter((s) => s !== p.status).map((s) => h("button", { class: "ghost sm", onclick: async () => { close(); await setStatus(p, s, reload); } }, s))),
    h("div", { class: "row end" },
      h("button", { class: "danger", onclick: async () => { if (await remove(p, reload)) close(); } }, "Delete"),
      h("button", { onclick: () => { close(); openProjectForm(p, reload); } }, "Edit")));
  const close = modal(p.name, el);
}

function portfolioView(p) {
  const kv = (k, v) => h("div", { class: "kv" }, h("span", { class: "mut" }, k), h("span", null, v || "—"));
  modal(p.name, h("div", null, h("p", null, statusTag(p.status === "not dated" ? "planned" : p.status), " ", h("span", { class: "mut" }, `Portfolio no. ${p.no}`)),
    h("div", { class: "kvs" }, kv("Area", AREA_NAMES[p.area] || p.area), kv("Period", p.period), kv("Location", p.location), kv("Beneficiaries", p.beneficiaries), kv("Budget", p.budget), kv("Funding", p.funding)),
    h("p", { class: "pre" }, p.summary || ""), h("p", { class: "msg info" }, "Website portfolio projects are edited in src/data/portfolio.ts (then rebuild the site).")));
}

export default async () => {
  const wrap = h("div");
  const load = async () => {
    added.loading();
    try { const rows = await getProjects(); added.set(rows); tabs.querySelector("[data-t=added] .count").textContent = rows.length; }
    catch (e) { added.error(e.message); }
  };
  const statusSel = (r) => h("select", { class: "inline-sel", "aria-label": `Status of ${r.name}`, onchange: (e) => setStatus(r, e.target.value, load) }, STATUSES.map((s) => h("option", { value: s, selected: s === r.status }, s)));
  const added = dataTable({
    columns: [
      { label: "Photo", cell: (r) => (r.image_url ? h("div", { class: "thumbs" }, h("div", null, h("img", { src: r.image_url, alt: "" }))) : h("span", { class: "mut" }, "None")) },
      { label: "Project", cell: (r) => h("div", null, h("b", null, r.name), r.area ? h("div", { class: "mut" }, r.area) : null), sort: (r) => r.name.toLowerCase() },
      { label: "Location", cell: (r) => r.location || "—", sort: (r) => (r.location || "").toLowerCase() },
      { label: "Beneficiaries", cell: (r) => Number(r.beneficiaries).toLocaleString("en-IN"), sort: (r) => r.beneficiaries, cls: "num", firstDir: "desc" },
      { label: "Status", cell: statusSel, sort: (r) => STATUSES.indexOf(r.status) },
      { label: "Website", cell: (r) => tag(r.published ? "active" : "pending", r.published ? "Shown" : "Hidden"), sort: (r) => (r.published ? 0 : 1) },
      { label: "Added", cell: (r) => fmtDate(r.created_at), sort: (r) => r.created_at, firstDir: "desc" },
      { label: "", cls: "actions", cell: (r) => h("span", { class: "row nowrap" },
        h("button", { class: "ghost sm", onclick: () => view(r, load) }, "View"), h("button", { class: "ghost sm", onclick: () => openProjectForm(r, load) }, "Edit"),
        h("button", { class: "danger sm", onclick: () => remove(r, load) }, "Delete")) }],
    search: (r) => [r.name, r.area, r.location, r.description].join(" "), searchLabel: "Search projects",
    filters: [
      { label: "Status", options: STATUSES.map((s) => [s, s]), test: (r, v) => r.status === v },
      { label: "Area", options: (rs) => distinct(rs, "area"), test: (r, v) => r.area === v },
      { label: "Website", options: [["shown", "Shown"], ["hidden", "Hidden"]], test: (r, v) => (v === "shown") === !!r.published }],
    date: { label: "Added", get: (r) => r.created_at }, sort: { i: 6, dir: "desc" }, onRow: (r) => view(r, load),
    empty: "No projects added yet. Use “+ Add project” — they appear on the website Projects page under “Upcoming & New Projects”.",
    tools: [h("button", { onclick: () => openProjectForm(null, load) }, "+ Add project")]
  });

  const site = dataTable({
    columns: [
      { label: "No.", cell: (r) => r.no, sort: (r) => r.no, cls: "num" },
      { label: "Project", cell: (r) => h("b", null, r.name), sort: (r) => r.name.toLowerCase() },
      { label: "Area", cell: (r) => AREA_NAMES[r.area] || r.area, sort: (r) => r.area },
      { label: "Period", cell: (r) => r.period || "—" },
      { label: "Status", cell: (r) => statusTag(r.status === "not dated" ? "planned" : r.status), sort: (r) => r.status },
      { label: "Beneficiaries", cell: (r) => r.beneficiaries || "—" }],
    search: (r) => [r.name, r.area, r.location, r.summary, r.funding].join(" "), searchLabel: "Search portfolio",
    filters: [{ label: "Status", options: [["ongoing", "Ongoing"], ["completed", "Completed"], ["not dated", "Not dated"]], test: (r, v) => r.status === v },
      { label: "Area", options: (rs) => distinct(rs, "area"), test: (r, v) => r.area === v }],
    sort: { i: 0, dir: "asc" }, onRow: portfolioView, empty: "The website portfolio could not be read."
  });

  const panes = { added: added.el, site: h("div", null, h("p", { class: "msg info" }, "Read-only: these programmes come from the website file src/data/portfolio.ts."), site.el) };
  const body = h("div");
  const tabs = h("div", { class: "tabs", role: "tablist" }, [["added", "Added in admin"], ["site", "Website portfolio"]].map(([k, l]) =>
    h("button", { type: "button", role: "tab", "data-t": k, class: "tab", onclick: () => show(k) }, l, " ", h("span", { class: "count" }, "…"))));
  const show = (k) => { tabs.querySelectorAll(".tab").forEach((t) => { const on = t.dataset.t === k; t.classList.toggle("on", on); t.setAttribute("aria-selected", String(on)); }); body.replaceChildren(panes[k]); };

  wrap.append(h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Projects"),
    h("p", { class: "mut" }, "Projects added here appear on the website Projects page under “Upcoming & New Projects” (menu: Our Projects → Upcoming Projects), unless hidden. Status “planned” is shown as “Upcoming”."))), tabs, body);
  show("added");
  getWebsitePortfolio().then((p) => { site.set(p); tabs.querySelector("[data-t=site] .count").textContent = p.length; }).catch((e) => site.error(e.message));
  await load();
  return wrap;
};
