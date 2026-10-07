import { getVolunteers, createVolunteer, updateVolunteer, deleteVolunteer, volunteerPhotoUrl, setVolunteerPhoto, removeVolunteerPhoto } from "./data.js";
import { h, fmtDate, field, modal, tag, dataTable, confirmDialog, toast, busy, validate, rules } from "./ui.js";
import teamPane from "./team.js";
import { managerField } from "./orgtree.js";

const STATUSES = ["pending", "active", "inactive"];
const MAX_MB = 5;
/** Null when the file can be used as a volunteer photo, otherwise what is wrong with it. */
const photoProblem = (file) => (!/^image\/(jpeg|png|webp)$/.test(file.type) ? "Please choose a JPG, PNG or WebP photo." : file.size > MAX_MB * 1024 * 1024 ? `The photo is larger than ${MAX_MB} MB.` : null);
/** On the website = active AND ticked "Show on website". */
const onSite = (v) => v.status === "active" && v.show_on_website;

export default async () => {
  const wrap = h("div");
  const save = async (v, data, okText) => {
    try { await updateVolunteer(v.id, data); toast(okText); }
    catch (e) { toast(e.message, "err"); }
    load();
  };
  const setStatus = (v, status) => save(v, { status }, `${v.name || "Volunteer"} is now ${status}.`);
  const setShown = (v, show) => save(v, { show_on_website: show }, show
    ? (v.status === "active" ? `${v.name} is now shown on the website.` : `${v.name} will be shown on the website once active.`)
    : `${v.name} is hidden from the website.`);
  const remove = async (v) => {
    if (!await confirmDialog({ title: "Delete volunteer?", text: `${v.name || "This volunteer"} will be removed permanently.`, ok: "Delete", danger: true })) return false;
    try { await deleteVolunteer(v.id); toast("Volunteer deleted."); load(); return true; } catch (e) { toast(e.message, "err"); return false; }
  };
  const actions = (r, after) => [
    r.status !== "active" && h("button", { class: "sm", onclick: () => { after?.(); setStatus(r, "active"); } }, r.status === "pending" ? "Approve" : "Activate"),
    r.status === "active" && h("button", { class: "ghost sm", onclick: () => { after?.(); setStatus(r, "inactive"); } }, "Deactivate"),
    h("button", { class: "ghost sm", onclick: () => { after?.(); setShown(r, !r.show_on_website); } }, r.show_on_website ? "Hide from website" : "Show on website"),
    h("button", { class: "danger sm", onclick: async () => { if (await remove(r)) after?.(); } }, "Delete")];

  const view = (r) => {
    const kv = (k, v) => h("div", { class: "kv" }, h("span", { class: "mut" }, k), h("span", null, v || "—"));
    // website photo: shown, replaced or removed here
    const photo = h("div", { class: "thumbs" });
    const picker = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", onchange: async () => {
      const file = picker.files[0]; if (!file) return;
      const problem = photoProblem(file);
      if (problem) { picker.value = ""; return toast(problem, "err"); }
      picker.disabled = true;
      try { r = await setVolunteerPhoto(r, file); toast("Photo saved."); drawPhoto(); load(); }
      catch (e) { toast(e.message, "err"); }
      picker.disabled = false; picker.value = "";
    } });
    const drawPhoto = () => photo.replaceChildren(...(r.photo_path
      ? [h("div", null, h("img", { src: volunteerPhotoUrl(r.photo_path), alt: `Photo of ${r.name}` }),
        h("button", { class: "danger sm", type: "button", onclick: async () => {
          try { r = await removeVolunteerPhoto(r); toast("Photo removed."); drawPhoto(); load(); } catch (e) { toast(e.message, "err"); }
        } }, "Remove"))]
      : [h("p", { class: "mut" }, "No photo yet: the website shows the volunteer’s initials instead.")]));

    const close = modal(r.name || "Volunteer", h("div", null,
      h("p", null, tag(r.status), " ", tag(onSite(r) ? "active" : "pending", onSite(r) ? "Shown on website" : r.show_on_website ? "Will show once active" : "Not on website")),
      h("div", { class: "kvs" }, kv("Phone", r.phone), kv("Email", r.email), kv("Area of interest", r.area), kv("Signed up", fmtDate(r.created_at))),
      r.message ? h("div", null, h("h2", null, "Message"), h("p", { class: "pre" }, r.message)) : h("p", { class: "mut" }, "No message."),
      h("h2", null, "Works under"),
      managerField(`volunteer:${r.id}`, r.reports_to, async (key) => {
        try { r = await updateVolunteer(r.id, { reports_to: key }); toast("Saved."); } catch (e) { toast(e.message, "err"); }
      }).el,
      h("h2", null, "Website photo"), photo, field(`Upload a photo (JPG, PNG or WebP, up to ${MAX_MB} MB)`, picker),
      h("p", { class: "mut" }, "Only the name, area of interest and photo are ever shown on the website (About Us → Our Volunteers). Phone, email and message stay private."),
      h("div", { class: "row end" }, actions(r, () => close()))));
    drawPhoto();
  };

  const list = dataTable({
    columns: [
      { label: "Joined", cell: (r) => fmtDate(r.created_at), sort: (r) => r.created_at, firstDir: "desc" },
      { label: "Name", cell: (r) => h("div", { class: "row nowrap" }, r.photo_path ? h("img", { src: volunteerPhotoUrl(r.photo_path), alt: "", width: "32", height: "32", class: "avatar" }) : null, h("b", null, r.name || "—")), sort: (r) => (r.name || "").toLowerCase() },
      { label: "Contact", cell: (r) => [r.phone, r.email].filter(Boolean).join(" · ") || "—" },
      { label: "Interest", cell: (r) => r.area || "—", sort: (r) => (r.area || "").toLowerCase() },
      { label: "Status", cell: (r) => tag(r.status), sort: (r) => STATUSES.indexOf(r.status) },
      { label: "Website", cell: (r) => tag(onSite(r) ? "active" : "inactive", onSite(r) ? "Shown" : "Hidden"), sort: (r) => (onSite(r) ? 0 : 1) },
      { label: "", cls: "actions", cell: (r) => h("span", { class: "row nowrap" }, actions(r)) }],
    search: (r) => [r.name, r.phone, r.email, r.area, r.message].join(" "), searchLabel: "Search name, phone, email",
    filters: [
      { label: "Status", options: [["pending", "Pending approval"], ["active", "Active"], ["inactive", "Inactive"]], test: (r, v) => r.status === v },
      { label: "Website", options: [["shown", "Shown"], ["hidden", "Hidden"]], test: (r, v) => (v === "shown") === !!onSite(r) },
      { label: "Interest", options: (rs) => [...new Set(rs.map((r) => r.area).filter(Boolean))].sort().map((a) => [a, a]), test: (r, v) => r.area === v }],
    date: { label: "Joined", get: (r) => r.created_at }, sort: { i: 0, dir: "desc" }, onRow: view,
    summary: (rows) => h("p", { class: "mut" }, `${rows.length} volunteer(s) · ${rows.filter((r) => r.status === "active").length} active · ${rows.filter((r) => r.status === "pending").length} pending · ${rows.filter(onSite).length} shown on the website`),
    empty: "No volunteers yet. Sign-ups from the website Get Involved form arrive here as “pending”.",
    tools: [h("button", { onclick: () => add() }, "+ Add volunteer")]
  });
  async function load() {
    list.loading();
    try { const rows = await getVolunteers(); list.set(rows); count("volunteers", rows.length); }
    catch (e) { list.error(e.message); }
  }
  const add = () => {
    const saveBtn = h("button", { type: "submit" }, "Add active volunteer");
    const picker = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp" });
    const under = managerField(null, null);
    const f = h("form", { novalidate: true, onsubmit: async (e) => {
      e.preventDefault();
      if (!validate(f, { name: rules.required("Name", 120), phone: rules.phone, email: rules.email, area: rules.max("Area of interest", 80) })) return;
      const file = picker.files[0], problem = file && photoProblem(file);
      if (problem) return toast(problem, "err");
      const b = { name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim() || null, area: f.area.value.trim() || null, status: "active", show_on_website: f.show_on_website.checked };
      if (under.changed()) b.reports_to = under.value();
      try {
        await busy(saveBtn, async () => {
          const created = await createVolunteer(b);
          if (file) { try { await setVolunteerPhoto(created, file); } catch (err) { toast(`Volunteer added, but the photo could not be saved: ${err.message}`, "err"); } }
        });
        close(); toast("Volunteer added."); load();
      } catch (err) { toast(err.message, "err"); }
    } },
      field("Name *", h("input", { name: "name", required: true, maxlength: "120" })), h("div", { class: "grid2" }, field("Phone", h("input", { name: "phone", inputmode: "tel" })), field("Email", h("input", { name: "email", type: "email" }))),
      field("Area of interest", h("input", { name: "area", maxlength: "80" })),
      under.el,
      field(`Photo for the website (optional; JPG, PNG or WebP, up to ${MAX_MB} MB)`, picker),
      h("label", { class: "chk" }, h("input", { type: "checkbox", name: "show_on_website", checked: true }), "Show name and photo on the website (About Us → Our Volunteers)"),
      h("div", { class: "row end" }, h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), saveBtn));
    const close = modal("Add volunteer", f);
  };
  // two tabs: the team (executive committee + management) and the volunteers. "#/volunteers/signups" opens the volunteers.
  const count = (k, n) => (tabs.querySelector(`[data-t=${k}] .count`).textContent = n);
  const panes = {
    team: teamPane((n) => count("team", n)),
    volunteers: h("div", null,
      h("p", { class: "mut" }, "Sign-ups from the website Get Involved form arrive as “pending”; approve them to count them as active. Active volunteers marked “Show on website” appear by name (and photo) on the About Us page under “Our Volunteers”. Click a volunteer to add a photo."),
      list.el)
  };
  const body = h("div");
  const tabs = h("div", { class: "tabs", role: "tablist" }, [["team", "Team"], ["volunteers", "Volunteers"]].map(([k, l]) =>
    h("button", { type: "button", role: "tab", "data-t": k, class: "tab", onclick: () => show(k) }, l, " ", h("span", { class: "count" }, "…"))));
  const show = (k) => { tabs.querySelectorAll(".tab").forEach((t) => { const on = t.dataset.t === k; t.classList.toggle("on", on); t.setAttribute("aria-selected", String(on)); }); body.replaceChildren(panes[k]); };
  wrap.append(h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Team & Volunteers"),
    h("p", { class: "mut" }, "The executive committee, management team and volunteers shown on the website About Us page."))), tabs, body);
  show(/^#\/volunteers\/signups/.test(location.hash) ? "volunteers" : "team");
  await load(); return wrap;
};
