import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from "./data.js";
import { h, field, modal, tag, dataTable, confirmDialog, toast, busy, validate, rules } from "./ui.js";
import { managerField } from "./orgtree.js";

// The two blocks of the website About Us page a person can be listed in.
const TEAMS = [["committee", "Executive Committee"], ["management", "Management Team"]];
const teamLabel = (k) => (TEAMS.find(([v]) => v === k) || [k, k])[1];

function form(r, rows, reload) {
  r = r || {};
  const save = h("button", { type: "submit" }, r.id ? "Save changes" : "Add team member");
  const under = managerField(r.id ? `team:${r.id}` : null, r.reports_to);
  // a new person goes to the end of the chosen block
  const nextOrder = (team) => Math.max(0, ...rows.filter((x) => x.team === team).map((x) => x.sort_order)) + 10;
  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    if (!validate(f, { name: rules.required("Name", 120), post: rules.required("Post", 120), role: rules.max("Description", 400), sort_order: rules.wholeNumber("Position") })) return;
    const b = { team: f.team.value, name: f.name.value.trim(), post: f.post.value.trim(), role: f.role.value.trim(), published: f.published.checked,
      sort_order: f.sort_order.value.trim() === "" ? nextOrder(f.team.value) : Number(f.sort_order.value) };
    if (under.changed()) b.reports_to = under.value(); // only sent when it changes
    try {
      await busy(save, () => (r.id ? updateTeamMember(r.id, b) : createTeamMember(b)));
      close(); toast(r.id ? "Saved." : `${b.name} added to the ${teamLabel(b.team)}.`); reload();
    } catch (err) { toast(err.message, "err"); }
  } },
    field("Shown under *", h("select", { name: "team" }, TEAMS.map(([v, l]) => h("option", { value: v, selected: v === (r.team || "committee") }, l)))),
    field("Name *", h("input", { name: "name", required: true, maxlength: "120", placeholder: "e.g. Smt. Sunita Jain", value: r.name || "" })),
    field("Post *", h("input", { name: "post", required: true, maxlength: "120", placeholder: "e.g. Vice President", value: r.post || "" })),
    field("Description (optional; shown on Management Team cards; up to 400 characters)", h("textarea", { name: "role", rows: "3", maxlength: "400" }, r.role || "")),
    field("Position in the list (lower numbers come first; leave empty to add at the end)", h("input", { name: "sort_order", inputmode: "numeric", value: r.id ? r.sort_order : "" })),
    under.el,
    h("label", { class: "chk" }, h("input", { type: "checkbox", name: "published", checked: r.id ? !!r.published : true }), "Published (visible on the website)"),
    h("div", { class: "row end" },
      r.id && h("button", { class: "danger", type: "button", onclick: async () => {
        if (!await confirmDialog({ title: "Remove team member?", text: `${r.name} will be removed from the website. This cannot be undone.`, ok: "Remove", danger: true })) return;
        try { await deleteTeamMember(r.id); close(); toast("Team member removed."); reload(); } catch (err) { toast(err.message, "err"); }
      } }, "Remove team member"),
      h("div", { class: "grow" }), h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), save));
  const close = modal(r.id ? "Edit team member" : "Add team member", f);
}

/** The "Team" tab of the Team & Volunteers page. `onCount(n)` is told how many people there are. */
export default function teamPane(onCount) {
  const list = dataTable({
    columns: [
      { label: "Order", cell: (r) => r.n, sort: (r) => r.n, cls: "num" },
      { label: "Name", cell: (r) => h("div", null, h("b", null, r.name), r.role ? h("div", { class: "mut" }, r.role.length > 120 ? r.role.slice(0, 120) + "…" : r.role) : null), sort: (r) => (r.name || "").toLowerCase() },
      { label: "Post", cell: (r) => r.post, sort: (r) => (r.post || "").toLowerCase() },
      { label: "Shown under", cell: (r) => teamLabel(r.team), sort: (r) => r.team },
      { label: "Status", cell: (r) => tag(r.published ? "active" : "pending", r.published ? "Published" : "Hidden"), sort: (r) => (r.published ? 0 : 1) }],
    search: (r) => [r.name, r.post, r.role].join(" "), searchLabel: "Search name or post",
    filters: [
      { label: "Shown under", options: TEAMS, test: (r, x) => r.team === x },
      { label: "Status", options: [["published", "Published"], ["hidden", "Hidden"]], test: (r, x) => (x === "published") === !!r.published }],
    sort: { i: 0, dir: "asc" }, pageSize: 25, onRow: (r) => form(r, all, load),
    summary: (rows) => h("p", { class: "mut" }, TEAMS.map(([v, l]) => `${rows.filter((r) => r.team === v).length} in ${l}`).join(" · ")),
    empty: "No team members yet. Add one and it appears on the website under About Us → Our Executive Committee.",
    tools: [h("button", { onclick: () => form(null, all, load) }, "+ Add team member")]
  });
  let all = [];
  async function load() {
    list.loading();
    try { all = await getTeamMembers(); list.set(all.map((r, i) => ({ ...r, n: i + 1 }))); onCount?.(all.length); }
    catch (e) { list.error(e.code === "PGRST205" ? "The team table does not exist yet. Run supabase/migrations/20250115000000_team_members.sql in the Supabase SQL Editor." : e.message); }
  }
  load();
  return h("div", null,
    h("p", { class: "mut" }, "The people shown on the website About Us page under “Our Executive Committee” and “Management Team”, in this order. Click a row to edit or remove it."),
    list.el);
}
