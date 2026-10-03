import { getAdminsList, getActivityLog } from "./data.js";
import { h, fmtDateTime, timeAgo, tag, panel, dataTable, statCard } from "./ui.js";

const ACTION = { created: "Created", updated: "Updated", deleted: "Deleted" };
const tone = (a) => ({ created: "active", updated: "new", deleted: "cancelled" }[a] || "");

export default async ({ me }) => {
  const [admins, log] = await Promise.all([getAdminsList(me), getActivityLog(1000)]);
  const people = dataTable({
    columns: [
      { label: "Admin", cell: (a) => h("b", null, a.email, a.id === me.id ? h("span", { class: "mut" }, " (you)") : null), sort: (a) => a.email },
      { label: "Role", cell: (a) => tag(a.role), sort: (a) => a.role },
      { label: "Created", cell: (a) => fmtDateTime(a.created_at), sort: (a) => a.created_at },
      { label: "Last sign-in", cell: (a) => (a.last_login_at ? `${fmtDateTime(a.last_login_at)} · ${timeAgo(a.last_login_at)}` : "Never"), sort: (a) => a.last_login_at || "", firstDir: "desc" },
      { label: "Logged actions", cell: (a) => a.actions, sort: (a) => a.actions, cls: "num", firstDir: "desc" }],
    rows: admins, sort: { i: 0, dir: "asc" }, pageSize: 10, empty: "No admins found."
  });
  const activity = dataTable({
    columns: [
      { label: "When", cell: (r) => h("span", { title: fmtDateTime(r.created_at) }, fmtDateTime(r.created_at)), sort: (r) => r.created_at + String(r.id).padStart(9, "0"), firstDir: "desc" },
      { label: "Admin", cell: (r) => r.admin_label || "—", sort: (r) => r.admin_label || "" },
      { label: "Action", cell: (r) => tag(tone(r.action), ACTION[r.action] || r.action), sort: (r) => r.action },
      { label: "What happened", cell: (r) => r.summary }],
    rows: log, search: (r) => [r.summary, r.admin_label, r.entity].join(" "), searchLabel: "Search activity",
    filters: [
      { label: "Admin", options: (rs) => [...new Set(rs.map((r) => r.admin_label).filter(Boolean))].sort().map((a) => [a, a]), test: (r, v) => r.admin_label === v },
      { label: "Section", options: (rs) => [...new Set(rs.map((r) => r.entity).filter(Boolean))].sort().map((e) => [e, e]), test: (r, v) => r.entity === v },
      { label: "Action", options: Object.entries(ACTION), test: (r, v) => r.action === v }],
    date: { label: "Date", get: (r) => r.created_at }, sort: { i: 0, dir: "desc" }, pageSize: 25,
    empty: "No admin activity recorded yet. Changes made in this admin panel are logged here from now on."
  });
  return h("div", null,
    h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Admins & activity"), h("p", { class: "mut" }, "Who can sign in, and every change made in this admin panel."))),
    h("div", { class: "cards" },
      statCard("Signed in as", me.email, me.role === "admin" ? "Administrator" : me.role === "editor" ? "Editor" : "Viewer"),
      statCard("Admin users", admins.length, "Accounts that can open this panel"),
      statCard("Email sending", "Off", "Requires a backend (SMTP) — not available on this deployment", { tone: "attn" })),
    panel("Admin users", people.el, h("p", { class: "mut" }, "To add an admin: Supabase Dashboard → Authentication → Add user, then insert a row into admin_profiles with that user's id and role.")),
    h("h2", { class: "sec" }, "Activity log"), activity.el);
};
