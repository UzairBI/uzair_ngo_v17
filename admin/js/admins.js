import { getAdminsList, getActivityLog, createAdmin, updateAdmin, adminPhotoUrl, setAdminPhoto, removeAdminPhoto } from "./data.js";
import { h, fmtDateTime, timeAgo, tag, panel, dataTable, statCard, field, modal, toast, busy, validate, rules } from "./ui.js";

const MAX_MB = 5;
/** Null when the file can be used as a profile photo, otherwise what is wrong with it. */
const photoProblem = (file) => (!/^image\/(jpeg|png|webp)$/.test(file.type) ? "Please choose a JPG, PNG or WebP photo." : file.size > MAX_MB * 1024 * 1024 ? `The photo is larger than ${MAX_MB} MB.` : null);
const face = (a) => (a.photo_path ? h("img", { class: "avatar", alt: "", src: adminPhotoUrl(a.photo_path) }) : h("span", { class: "avatar", "aria-hidden": "true" }, (a.email || "A")[0].toUpperCase()));

const ACTION = { created: "Created", updated: "Updated", deleted: "Deleted" };
const tone = (a) => ({ created: "active", updated: "new", deleted: "cancelled" }[a] || "");

export default async ({ me }) => {
  const [admins, log] = await Promise.all([getAdminsList(me), getActivityLog(1000)]);
  const reloadPeople = async () => { try { people.set(await getAdminsList(me)); } catch (e) { toast(e.message, "err"); } };

  // Add an admin: just an email, a password and (optionally) a photo.
  const add = () => {
    const save = h("button", { type: "submit" }, "Add admin");
    const picker = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp" });
    const f = h("form", { novalidate: true, autocomplete: "off", onsubmit: async (e) => {
      e.preventDefault();
      if (!validate(f, { email: (v) => (!v ? "Email is required" : rules.email(v)), password: (v) => (v.length < 8 ? "Use at least 8 characters" : v.length > 72 ? "Use 72 characters or fewer" : null), display_name: rules.max("Name", 80) })) return;
      const file = picker.files[0], problem = file && photoProblem(file);
      if (problem) return toast(problem, "err");
      try {
        const created = await busy(save, async () => {
          const a = await createAdmin({ email: f.email.value.trim().toLowerCase(), password: f.password.value, display_name: f.display_name.value.trim() });
          if (file) { try { await setAdminPhoto(a, file); } catch (err) { toast(`Admin added, but the photo could not be saved: ${err.message}`, "err"); } }
          return a;
        }, "Adding…");
        close();
        toast(created.needsConfirmation ? `Admin added. ${created.email} must click the confirmation link sent to that email before signing in.` : `Admin added. ${created.email} can sign in now.`);
        reloadPeople();
      } catch (err) { toast(err.message, "err"); }
    } },
      field("Email (e.g. name@gmail.com) *", h("input", { name: "email", type: "email", required: true, autocomplete: "off", maxlength: "160" })),
      field("Password * (at least 8 characters; tell it to the new admin yourself)", h("input", { name: "password", type: "password", required: true, autocomplete: "new-password", maxlength: "72" })),
      field("Name (optional)", h("input", { name: "display_name", maxlength: "80" })),
      field(`Photo (optional; JPG, PNG or WebP, up to ${MAX_MB} MB)`, picker),
      h("p", { class: "mut" }, "The new admin signs in on this page with that email and password, and can do everything you can."),
      h("div", { class: "row end" }, h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), save));
    const close = modal("Add admin", f);
  };

  // Click an admin: change the photo, or switch the account off / on.
  const edit = (a) => {
    const photo = h("div", { class: "thumbs" });
    const changed = () => { if (a.id === me.id) location.reload(); else reloadPeople(); }; // your own photo is also in the top bar
    const picker = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", onchange: async () => {
      const file = picker.files[0]; if (!file) return;
      const problem = photoProblem(file);
      if (problem) { picker.value = ""; return toast(problem, "err"); }
      picker.disabled = true;
      try { a = { ...a, ...(await setAdminPhoto(a, file)) }; toast("Photo saved."); draw(); changed(); }
      catch (e) { toast(e.message, "err"); }
      picker.disabled = false; picker.value = "";
    } });
    const draw = () => photo.replaceChildren(...(a.photo_path
      ? [h("div", null, h("img", { src: adminPhotoUrl(a.photo_path), alt: `Photo of ${a.email}` }),
        h("button", { class: "danger sm", type: "button", onclick: async () => { try { a = { ...a, ...(await removeAdminPhoto(a)) }; toast("Photo removed."); draw(); changed(); } catch (e) { toast(e.message, "err"); } } }, "Remove"))]
      : [h("p", { class: "mut" }, "No photo yet: the first letter of the email is shown instead.")]));
    const toggle = a.id !== me.id && h("button", { type: "button", class: a.is_active ? "danger" : "", onclick: async () => {
      try { await updateAdmin(a.id, { is_active: !a.is_active }); toast(a.is_active ? `${a.email} can no longer sign in to this panel.` : `${a.email} can sign in again.`); close(); reloadPeople(); }
      catch (e) { toast(e.message, "err"); }
    } }, a.is_active ? "Switch off this admin" : "Switch this admin back on");
    const close = modal(a.email, h("div", null,
      h("p", null, tag(a.is_active ? "active" : "inactive", a.is_active ? "Active" : "Switched off"), a.id === me.id ? h("span", { class: "mut" }, " This is you.") : null),
      h("h2", null, "Photo"), photo, field(`Upload a photo (JPG, PNG or WebP, up to ${MAX_MB} MB)`, picker),
      h("div", { class: "row end" }, toggle, h("button", { type: "button", class: "ghost", onclick: () => close() }, "Close"))));
    draw();
  };

  const people = dataTable({
    columns: [
      { label: "Admin", cell: (a) => h("div", { class: "row nowrap" }, face(a), h("b", null, a.email, a.id === me.id ? h("span", { class: "mut" }, " (you)") : null)), sort: (a) => a.email },
      { label: "Status", cell: (a) => tag(a.is_active ? "active" : "inactive", a.is_active ? "Active" : "Switched off"), sort: (a) => (a.is_active ? 0 : 1) },
      { label: "Role", cell: (a) => tag(a.role), sort: (a) => a.role },
      { label: "Created", cell: (a) => fmtDateTime(a.created_at), sort: (a) => a.created_at },
      { label: "Last sign-in", cell: (a) => (a.last_login_at ? `${fmtDateTime(a.last_login_at)} · ${timeAgo(a.last_login_at)}` : "Never"), sort: (a) => a.last_login_at || "", firstDir: "desc" },
      { label: "Logged actions", cell: (a) => a.actions, sort: (a) => a.actions, cls: "num", firstDir: "desc" }],
    rows: admins, sort: { i: 0, dir: "asc" }, pageSize: 10, empty: "No admins found.", onRow: edit,
    tools: [h("button", { type: "button", onclick: add }, "+ Add admin")]
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
    panel("Admin users", people.el, h("p", { class: "mut" }, "Use “+ Add admin” to give someone access with an email and a password. Click an admin to change their photo or switch their access off.")),
    h("h2", { class: "sec" }, "Activity log"), activity.el);
};
