import { getMemberCards, updateMemberCard, deleteMemberCard, memberPhotoUrl } from "./data.js";
import { renderCard, downloadCard } from "../../src/lib/memberCard.ts";
import { h, fmtDate, fmtDateTime, field, modal, tag, dataTable, confirmDialog, toast, busy, validate, rules } from "./ui.js";

const STATUSES = [["pending", "Waiting for approval"], ["approved", "Approved"], ["rejected", "Rejected"]];
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const statusTag = (s) => tag(s === "approved" ? "active" : s === "rejected" ? "failed" : "pending", (STATUSES.find(([v]) => v === s) || STATUSES[0])[1]);
const order = (s) => STATUSES.findIndex(([v]) => v === s);

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const yearFromNow = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return dayKey(d); };

/**
 * Approving: the admin sets how long the card is valid (applicants cannot choose it), then the card gets its number
 * (assigned by the database). Resolves true once approved, false if the box was closed without approving.
 */
function approve(r, reload) {
  return new Promise((resolve) => {
    let done = false;
    const ok = h("button", { type: "submit" }, "Approve");
    const f = h("form", { novalidate: true, onsubmit: async (ev) => {
      ev.preventDefault();
      if (!validate(f, { valid_till: (v) => (!v ? "Choose the date the card is valid till" : v <= dayKey(new Date()) ? "The date must be in the future" : null) })) return;
      try {
        const saved = await busy(ok, () => updateMemberCard(r.id, { status: "approved", valid_till: f.valid_till.value }));
        done = true; close(); toast(`Approved. Card number ${saved.card_id}, valid till ${fmtDate(saved.valid_till)}.`); reload(); resolve(true);
      } catch (e) { toast(e.message, "err"); }
    } },
      h("p", null, `${r.full_name} (${r.role}) gets a member ID number and can generate and download the card on the website.`),
      field("Card valid till *", h("input", { name: "valid_till", type: "date", required: true, min: dayKey(new Date(Date.now() + 86400000)), value: r.valid_till && r.valid_till > dayKey(new Date()) ? r.valid_till : yearFromNow() })),
      h("div", { class: "row end" }, h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), ok));
    const shut = modal("Approve this application?", f);
    const close = () => { shut(); if (!done) resolve(false); };
    // closing the box any other way (Close button, Escape, a click outside) also counts as "not approved"
    new MutationObserver((_, o) => { if (!f.isConnected) { o.disconnect(); if (!done) resolve(false); } }).observe(document.body, { childList: true });
  });
}

/** Approve or reject straight from the list. */
async function decide(r, status, reload) {
  if (status === "approved") return approve(r, reload);
  if (!await confirmDialog({ title: "Reject this application?", text: `${r.full_name} will be told on the website that the application was not approved. You can approve it later.`, ok: "Reject", danger: true })) return false;
  try {
    await updateMemberCard(r.id, { status });
    toast("Application rejected."); reload(); return true;
  } catch (e) { toast(e.message, "err"); return false; }
}

/** The finished card with every detail (phone and blood group included), as a JPG or a PDF. */
async function download(r, kind, btn) {
  try {
    await busy(btn, async () => downloadCard(await renderCard({ name: r.full_name, role: r.role, phone: r.phone, blood: r.blood_group || "", valid: r.valid_till || "", id: r.card_id, photoPath: r.photo_path }), r.full_name, kind), "Preparing…");
  } catch (e) { toast(e.message, "err"); }
}
const photo = (r, cls) => (r.photo_path
  ? h("a", { href: memberPhotoUrl(r.photo_path), target: "_blank", rel: "noopener" }, h("img", { src: memberPhotoUrl(r.photo_path), alt: `Photo of ${r.full_name}`, class: cls || "" }))
  : h("span", { class: "mut" }, "No photo"));

/** The applicant's details. An admin can correct what goes on the card before (or after) approving. */
function view(r, reload) {
  const kv = (k, v) => h("div", { class: "kv" }, h("span", { class: "mut" }, k), h("span", null, v || "—"));
  const save = h("button", { type: "submit" }, "Save changes");
  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    if (!validate(f, { full_name: rules.required("Name", 60), role: rules.required("Role", 40), admin_note: rules.max("Note", 400) })) return;
    const b = { full_name: f.full_name.value.trim(), role: f.role.value.trim(), blood_group: f.blood_group.value || null, valid_till: f.valid_till.value || null, admin_note: f.admin_note.value.trim() };
    try { await busy(save, () => updateMemberCard(r.id, b)); close(); toast("Saved."); reload(); }
    catch (err) { toast(err.message, "err"); }
  } },
    h("p", null, statusTag(r.status), r.card_id ? [" ", h("b", null, r.card_id)] : null),
    h("div", { class: "thumbs" }, h("div", null, photo(r))),
    h("div", { class: "kvs" }, kv("Phone", h("a", { href: `tel:${r.phone}` }, r.phone)), kv("Date of application", fmtDateTime(r.created_at)), kv("Card issued", r.issued_at ? fmtDateTime(r.issued_at) : "Not yet")),
    h("h2", null, "On the card"),
    h("div", { class: "grid2" },
      field("Full name *", h("input", { name: "full_name", required: true, maxlength: "60", value: r.full_name || "" })),
      field("Role *", h("input", { name: "role", required: true, maxlength: "40", value: r.role || "" })),
      field("Blood group", h("select", { name: "blood_group" }, h("option", { value: "" }, "Not given"), BLOOD.map((b) => h("option", { value: b, selected: b === r.blood_group }, b)))),
      field("Valid till (set by you; applicants cannot choose it)", h("input", { name: "valid_till", type: "date", value: r.valid_till || "" }))),
    field("Note for admins (never shown on the website)", h("textarea", { name: "admin_note", rows: "2", maxlength: "400" }, r.admin_note || "")),
    r.status === "approved" && h("div", { class: "row" }, "Download the card:",
      h("button", { type: "button", class: "ghost sm", onclick: (e) => download(r, "jpg", e.currentTarget) }, "JPG"),
      h("button", { type: "button", class: "ghost sm", onclick: (e) => download(r, "pdf", e.currentTarget) }, "PDF")),
    h("div", { class: "row end" },
      h("button", { class: "danger", type: "button", onclick: async () => {
        if (!await confirmDialog({ title: "Delete this application?", text: `“${r.full_name}” is removed for good${r.card_id ? ` and card ${r.card_id} disappears from the website` : ""}. This cannot be undone.`, ok: "Delete", danger: true })) return;
        try { await deleteMemberCard(r); close(); toast("Application deleted."); reload(); } catch (err) { toast(err.message, "err"); }
      } }, "Delete"),
      h("div", { class: "grow" }),
      r.status !== "rejected" && h("button", { type: "button", class: "ghost", onclick: async () => { if (await decide(r, "rejected", reload)) close(); } }, "Reject"),
      r.status !== "approved" && h("button", { type: "button", class: "ghost", onclick: async () => { if (await decide(r, "approved", reload)) close(); } }, "Approve"),
      save));
  const close = modal(r.full_name, f);
}

export default async ({ badges }) => {
  const wrap = h("div");
  const reload = () => { load(); badges?.(); };
  const list = dataTable({
    columns: [
      { label: "Photo", cell: (r) => (r.photo_path ? h("div", { class: "thumbs" }, h("div", null, h("img", { src: memberPhotoUrl(r.photo_path), alt: "" }))) : h("span", { class: "mut" }, "None")) },
      { label: "Applicant", cell: (r) => h("div", null, h("b", null, r.full_name), h("div", { class: "mut" }, r.role)), sort: (r) => (r.full_name || "").toLowerCase() },
      { label: "Phone", cell: (r) => r.phone },
      { label: "Blood group", cell: (r) => r.blood_group || "—", sort: (r) => r.blood_group || "" },
      { label: "Valid till", cell: (r) => (r.valid_till ? fmtDate(r.valid_till) : "—"), sort: (r) => r.valid_till || "" },
      { label: "Applied", cell: (r) => fmtDate(r.created_at), sort: (r) => r.created_at, firstDir: "desc" },
      { label: "Status", cell: (r) => statusTag(r.status), sort: (r) => order(r.status) },
      { label: "Card number", cell: (r) => r.card_id || h("span", { class: "mut" }, "None yet"), sort: (r) => r.card_id || "" },
      { label: "", cls: "actions", cell: (r) => h("span", { class: "row nowrap" },
        r.status !== "approved" && h("button", { class: "sm", onclick: () => decide(r, "approved", reload) }, "Approve"),
        r.status === "pending" && h("button", { class: "danger sm", onclick: () => decide(r, "rejected", reload) }, "Reject"),
        r.status === "approved" && h("button", { class: "ghost sm", onclick: (e) => download(r, "pdf", e.currentTarget) }, "Download"),
        h("button", { class: "ghost sm", onclick: () => view(r, reload) }, "View")) }],
    search: (r) => [r.full_name, r.role, r.phone, r.card_id, r.admin_note].join(" "), searchLabel: "Search applications",
    filters: [{ label: "Status", options: STATUSES, test: (r, x) => r.status === x }],
    date: { label: "Applied", get: (r) => r.created_at }, sort: { i: 6, dir: "asc" }, pageSize: 25, onRow: (r) => view(r, reload),
    summary: (rows) => h("p", { class: "mut" }, `${rows.filter((r) => r.status === "pending").length} waiting for approval · ${rows.filter((r) => r.status === "approved").length} approved · ${rows.filter((r) => r.status === "rejected").length} rejected`),
    empty: "No applications yet. People apply on the website page Member ID Card; each application appears here for your approval."
  });
  async function load() {
    list.loading();
    try { list.set(await getMemberCards()); }
    catch (e) { list.error(e.code === "PGRST205" ? "The member cards table does not exist yet. Run supabase/migrations/20250126000000_member_cards.sql in the Supabase SQL Editor." : e.message); }
  }
  wrap.append(h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Member ID Cards"),
    h("p", { class: "mut" }, "Applications sent from the website (Member ID Card). Check the applicant's details and photo and approve: only then do they get a member ID number and can generate and download their card. Click a row to see or correct the details."))), list.el);
  await load(); return wrap;
};
