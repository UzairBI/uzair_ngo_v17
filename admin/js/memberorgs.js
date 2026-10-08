import { getMemberOrganizations, createMemberOrganization, updateMemberOrganization, deleteMemberOrganization } from "./data.js";
import { h, fmtDate, fmtDateTime, field, modal, tag, dataTable, confirmDialog, toast, busy, validate, rules } from "./ui.js";

// Same choices as the application form on the website (src/components/OrganizationApplyForm.tsx).
const ORG_TYPES = ["Trust", "Society", "Section 8 Company", "Other"];
const FOCUS_AREAS = ["Healthcare", "Education", "Women Empowerment", "Child Welfare", "Community Development", "Environment", "Other"];
const STATUSES = [["pending", "Waiting for approval"], ["approved", "Approved"], ["rejected", "Rejected"]];
const statusTag = (s) => tag(s === "approved" ? "active" : s === "rejected" ? "failed" : "pending", (STATUSES.find(([v]) => v === s) || STATUSES[1])[1]);
const order = (s) => STATUSES.findIndex(([v]) => v === s);

/** Approve (the organization is then listed on the website) or reject an application. */
async function decide(r, status, reload) {
  const approve = status === "approved";
  if (!await confirmDialog(approve
    ? { title: "Approve this organization?", text: `“${r.name}” becomes a member organization and is listed on the website (Membership → Memberships).`, ok: "Approve" }
    : { title: "Reject this application?", text: `“${r.name}” is not listed on the website. You can approve it later.`, ok: "Reject", danger: true })) return false;
  try { await updateMemberOrganization(r.id, { status }); toast(approve ? "Approved. It now shows on the website." : "Application rejected."); reload(); return true; }
  catch (e) { toast(e.message, "err"); return false; }
}

function form(r, reload, next) {
  r = r || {};
  const save = h("button", { type: "submit" }, r.id ? "Save changes" : "Add organization");
  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    if (!validate(f, { name: rules.required("Name", 160), location: rules.max("Location", 120), description: rules.max("Description", 600), sort_order: rules.wholeNumber("Order"),
      registration_no: rules.max("Registration number", 60), year_founded: (v) => (v && !(/^\d{4}$/.test(v) && +v >= 1800 && +v <= 2100) ? "Enter a year, for example 2012" : null),
      website: (v) => (v && !/^https?:\/\/\S+\.\S+$/i.test(v) ? "Enter the full address, starting with https://" : v.length > 200 ? "Website must be 200 characters or fewer" : null),
      contact_name: rules.max("Contact person", 80), contact_phone: rules.max("Phone", 20), contact_email: (v) => rules.email(v) || rules.max("Email", 120)(v), admin_note: rules.max("Note", 400) })) return;
    const b = { name: f.name.value.trim(), location: f.location.value.trim(), description: f.description.value.trim(), sort_order: Number(f.sort_order.value) || 0, published: f.published.checked,
      org_type: f.org_type.value, registration_no: f.registration_no.value.trim(), year_founded: f.year_founded.value ? Number(f.year_founded.value) : null, website: f.website.value.trim(),
      focus_areas: [...f.querySelectorAll("input[name=focus]:checked")].map((x) => x.value),
      contact_name: f.contact_name.value.trim(), contact_phone: f.contact_phone.value.trim(), contact_email: f.contact_email.value.trim(), admin_note: f.admin_note.value.trim() };
    try {
      await busy(save, () => (r.id ? updateMemberOrganization(r.id, b) : createMemberOrganization(b)));
      close(); toast(r.id ? "Saved." : "Organization added. It now shows on the website."); reload();
    } catch (err) { toast(err.message, "err"); }
  } },
    r.id && h("p", null, statusTag(r.status), " ", h("span", { class: "mut" }, `Received ${fmtDateTime(r.created_at)}`)),
    h("h2", null, "On the website card"),
    field("Organization name *", h("input", { name: "name", required: true, maxlength: "160", value: r.name || "" })),
    h("div", { class: "grid2" },
      field("Location", h("input", { name: "location", maxlength: "120", placeholder: "e.g. Sagar, Madhya Pradesh", value: r.location || "" })),
      field("Order on the page (lower comes first)", h("input", { name: "sort_order", type: "number", min: "0", step: "1", inputmode: "numeric", value: r.sort_order ?? next }))),
    field("What the organization does (up to 600 characters)", h("textarea", { name: "description", rows: "3", maxlength: "600" }, r.description || "")),
    h("h2", null, "Details for our records (never shown on the website)"),
    h("div", { class: "grid2" },
      field("Type of organization", h("select", { name: "org_type" }, h("option", { value: "" }, "Not given"), ORG_TYPES.map((t) => h("option", { value: t, selected: t === r.org_type }, t)))),
      field("Registration number", h("input", { name: "registration_no", maxlength: "60", value: r.registration_no || "" })),
      field("Year founded", h("input", { name: "year_founded", inputmode: "numeric", maxlength: "4", value: r.year_founded ?? "" })),
      field("Website", h("input", { name: "website", maxlength: "200", placeholder: "https://", value: r.website || "" }))),
    h("div", null, h("span", { class: "mut" }, "Areas of work"),
      h("div", { class: "row" }, FOCUS_AREAS.map((a) => h("label", { class: "chk" }, h("input", { type: "checkbox", name: "focus", value: a, checked: (r.focus_areas || []).includes(a) }), a)))),
    h("div", { class: "grid2" },
      field("Contact person", h("input", { name: "contact_name", maxlength: "80", value: r.contact_name || "" })),
      field("Phone", h("input", { name: "contact_phone", maxlength: "20", value: r.contact_phone || "" })),
      field("Email", h("input", { name: "contact_email", type: "email", maxlength: "120", value: r.contact_email || "" }))),
    field("Note for admins", h("textarea", { name: "admin_note", rows: "2", maxlength: "400" }, r.admin_note || "")),
    h("label", { class: "chk" }, h("input", { type: "checkbox", name: "published", checked: r.id ? !!r.published : true }), "Published (an approved organization is visible on the website)"),
    h("div", { class: "row end" },
      r.id && h("button", { class: "danger", type: "button", onclick: async () => {
        if (!await confirmDialog({ title: "Remove organization?", text: `“${r.name}” will be removed for good. This cannot be undone.`, ok: "Remove", danger: true })) return;
        try { await deleteMemberOrganization(r.id); close(); toast("Organization removed."); reload(); } catch (err) { toast(err.message, "err"); }
      } }, "Remove organization"),
      h("div", { class: "grow" }),
      r.id && r.status !== "rejected" && h("button", { type: "button", class: "ghost", onclick: async () => { if (await decide(r, "rejected", reload)) close(); } }, "Reject"),
      r.id && r.status !== "approved" && h("button", { type: "button", class: "ghost", onclick: async () => { if (await decide(r, "approved", reload)) close(); } }, "Approve"),
      h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), save));
  const close = modal(r.id ? r.name : "Add organization", f);
}

export default async ({ badges }) => {
  const wrap = h("div");
  let rows = [];
  const reload = () => { load(); badges?.(); };
  // a new one goes to the end of the page
  const next = () => (rows.length ? Math.max(...rows.map((r) => r.sort_order || 0)) + 10 : 10);
  const list = dataTable({
    columns: [
      { label: "Order", cell: (r) => r.sort_order, sort: (r) => r.sort_order, cls: "num" },
      { label: "Organization", cell: (r) => h("div", null, h("b", null, r.name), h("div", { class: "mut" }, [r.org_type, r.location].filter(Boolean).join(" · ") || "—")), sort: (r) => (r.name || "").toLowerCase() },
      { label: "Contact", cell: (r) => (r.contact_name || r.contact_phone ? h("div", null, r.contact_name || "—", h("div", { class: "mut" }, [r.contact_phone, r.contact_email].filter(Boolean).join(" · "))) : h("span", { class: "mut" }, "—")) },
      { label: "Received", cell: (r) => fmtDate(r.created_at), sort: (r) => r.created_at, firstDir: "desc" },
      { label: "Status", cell: (r) => h("span", null, statusTag(r.status), r.status === "approved" && !r.published ? [" ", tag("pending", "Hidden")] : null), sort: (r) => order(r.status) },
      { label: "", cls: "actions", cell: (r) => h("span", { class: "row nowrap" },
        r.status !== "approved" && h("button", { class: "sm", onclick: () => decide(r, "approved", reload) }, "Approve"),
        r.status === "pending" && h("button", { class: "danger sm", onclick: () => decide(r, "rejected", reload) }, "Reject"),
        h("button", { class: "ghost sm", onclick: () => form(r, reload, next()) }, "View")) }],
    search: (r) => [r.name, r.location, r.description, r.contact_name, r.contact_email, r.contact_phone, r.registration_no].join(" "), searchLabel: "Search organizations",
    filters: [{ label: "Status", options: STATUSES, test: (r, x) => r.status === x }],
    sort: { i: 4, dir: "asc" }, pageSize: 25, onRow: (r) => form(r, reload, next()),
    summary: (rs) => h("p", { class: "mut" }, `${rs.filter((r) => r.status === "pending").length} waiting for approval · ${rs.filter((r) => r.status === "approved").length} approved · ${rs.filter((r) => r.status === "rejected").length} rejected`),
    empty: "No member organizations yet. Organizations apply on the website (Membership → Memberships), or add one yourself.",
    tools: [h("button", { onclick: () => form(null, reload, next()) }, "+ Add organization")]
  });
  async function load() {
    list.loading();
    try { rows = await getMemberOrganizations(); list.set(rows); }
    catch (e) { list.error(e.code === "PGRST205" ? "The member organizations table does not exist yet. Run supabase/migrations/20250129000000_member_organizations.sql in the Supabase SQL Editor." : e.message); }
  }
  wrap.append(h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Member Organizations"),
    h("p", { class: "mut" }, "Organizations apply for membership on the website (Membership → Memberships). Check the details and approve: only then is the organization listed there. Click a row to see or correct everything. The headings and paragraphs of that page are under Website Pages → Memberships."))), list.el);
  await load(); return wrap;
};
