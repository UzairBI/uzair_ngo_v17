// Supabase data layer: common queries for the admin panel.
// All queries use RLS to enforce authorization. Stats/reporting logic mirrors the
// old server/stats.js + server/portfolio.js, computed here client-side instead.

import { createClient } from "@supabase/supabase-js";
import { supabase, supabaseUrl, supabaseKey } from "./supabase.js";

export const monthKey = (d) => String(d || "").slice(0, 7);
export function lastMonths(n) {
  const out = [], d = new Date(); d.setDate(1);
  for (let i = n - 1; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`); }
  return out;
}
export const countBy = (rows, key) => rows.reduce((m, r) => { const k = (typeof key === "function" ? key(r) : r[key]) || "Not set"; m[k] = (m[k] || 0) + 1; return m; }, {});
export const sumBy = (rows, key, val) => rows.reduce((m, r) => { const k = (typeof key === "function" ? key(r) : r[key]) || "Not set"; m[k] = (m[k] || 0) + val(r); return m; }, {});
export const sumAmt = (rows) => rows.reduce((s, d) => s + Number(d.amount), 0);
export const reqStatus = (s) => (["sent", "completed"].includes(s) ? s : "new");
const top = (obj, n = 8) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));

function monthly(all, months) {
  const ok = all.donations.filter((d) => d.status === "success" && d.currency === "INR");
  return months.map((m) => ({
    month: m, raised: sumAmt(ok.filter((d) => monthKey(d.donated_at) === m)), donations: ok.filter((d) => monthKey(d.donated_at) === m).length,
    volunteers: all.volunteers.filter((v) => monthKey(v.created_at) === m).length,
    requests: all.requests.filter((r) => monthKey(r.created_at) === m).length,
    projects: all.projects.filter((p) => monthKey(p.created_at) === m).length
  }));
}
function recentSubmissions(all, limit = 10) {
  const items = [
    ...all.donations.map((d) => ({ type: "donation", at: d.created_at, title: `Donation ₹${Number(d.amount).toLocaleString("en-IN")}`, sub: `${d.donor_name || "Unknown donor"} · ${d.mode}${d.method ? " · " + d.method : ""}`, status: d.status, page: "donations" })),
    ...all.volunteers.map((v) => ({ type: "volunteer", at: v.created_at, title: `Volunteer: ${v.name || "Unnamed"}`, sub: v.area || "Volunteer sign-up", status: v.status, page: "volunteers/signups" })),
    ...all.requests.map((r) => ({ type: "request", at: r.created_at, title: `Request ${r.reference || "#" + r.id}`, sub: [r.name, r.document_type].filter(Boolean).join(" · "), status: reqStatus(r.status), page: "requests" }))
  ];
  return items.sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, limit);
}
const statusOf = (period) => (!period ? "not dated" : /present|ongoing/i.test(period) ? "ongoing" : "completed");
let portfolioCache = null;
export async function getWebsitePortfolio() {
  if (portfolioCache) return portfolioCache;
  const { portfolio } = await import("../../src/data/portfolio.ts");
  return (portfolioCache = portfolio.map((p) => ({ ...p, status: statusOf(p.period) })));
}
async function websiteReach() {
  try { const r = await fetch("/data/live.json"); const j = await r.json(); return Number(j.stats?.[0]?.value) || 0; } catch { return 0; }
}
async function loadAll() {
  const [donRes, projRes, volRes, reqRes, evRes] = await Promise.all([
    supabase.from("donations").select("id, created_at, amount, status, mode, method, currency, donated_at, donor_name, donor_email, purpose"),
    supabase.from("projects").select("id, created_at, name, area, status, beneficiaries, published"),
    supabase.from("volunteers").select("id, created_at, name, area, status"),
    supabase.from("document_requests").select("id, created_at, reference, name, organisation, request_type, document_type, status"),
    supabase.from("events").select("id, created_at, title, event_date, published")
  ]);
  return { donations: donRes.data || [], projects: projRes.data || [], volunteers: volRes.data || [], requests: reqRes.data || [], events: evRes.data || [] };
}

export async function getDashboardData() {
  const all = await loadAll();
  const { donations, projects, volunteers: vols, requests: reqs, events } = all;
  const ok = donations.filter((d) => d.status === "success" && d.currency === "INR");
  const month = new Date().toISOString().slice(0, 7), today = new Date().toISOString().slice(0, 10);
  const site = await getWebsitePortfolio();
  const added = projects.reduce((s, p) => s + (p.beneficiaries || 0), 0);
  const [adminsCount, activity] = await Promise.all([
    supabase.from("admin_profiles").select("id", { count: "exact", head: true }),
    getActivityLog(8)
  ]);
  const tally = (rows, key, keys) => Object.fromEntries(keys.map((k) => [k, rows.filter((r) => (typeof key === "function" ? key(r) : r[key]) === k).length]));
  return {
    funds: { total: sumAmt(ok), online: sumAmt(ok.filter((d) => d.mode === "online")), offline: sumAmt(ok.filter((d) => d.mode === "offline")), thisMonth: sumAmt(ok.filter((d) => (d.donated_at || "").startsWith(month))), pending: donations.filter((d) => d.status === "pending").length },
    ongoingProjects: { website: site.filter((p) => p.status === "ongoing").length, added: projects.filter((p) => p.status === "ongoing").length },
    reach: { website: await websiteReach(), added },
    pendingRequests: reqs.filter((r) => reqStatus(r.status) === "new").length,
    counts: {
      admins: adminsCount.count || 0,
      donations: { records: donations.length, ...tally(donations, "status", ["success", "pending", "failed", "refunded", "cancelled"]) },
      projects: { added: { total: projects.length, ...tally(projects, "status", ["planned", "ongoing", "completed"]) }, website: { total: site.length, ...tally(site, "status", ["ongoing", "completed", "not dated"]) } },
      volunteers: { total: vols.length, ...tally(vols, "status", ["active", "pending", "inactive"]) },
      requests: { total: reqs.length, ...tally(reqs, (r) => reqStatus(r.status), ["new", "sent", "completed"]) },
      events: { total: events.length, upcoming: events.filter((e) => e.event_date >= today).length, published: events.filter((e) => e.published).length }
    },
    months: monthly(all, lastMonths(12)),
    recent: recentSubmissions(all, 8),
    activity,
    mailReady: false
  };
}

export async function getReports(months = 12) {
  const n = Math.min(36, Math.max(3, Number(months) || 12));
  const all = await loadAll(), monthsArr = lastMonths(n), from = monthsArr[0];
  const prevMonths = lastMonths(n * 2).slice(0, n);
  const inRange = (d, list) => list.includes(monthKey(d));
  const ok = all.donations.filter((d) => d.status === "success" && d.currency === "INR");
  const okNow = ok.filter((d) => inRange(d.donated_at, monthsArr)), okPrev = ok.filter((d) => inRange(d.donated_at, prevMonths));
  const donors = new Set(okNow.map((d) => (d.donor_email || d.donor_name || "").toLowerCase()).filter(Boolean));
  const volsNow = all.volunteers.filter((v) => inRange(v.created_at, monthsArr)), reqsNow = all.requests.filter((r) => inRange(r.created_at, monthsArr));
  const site = await getWebsitePortfolio();
  return {
    months: n, from,
    totals: { raised: sumAmt(okNow), raisedPrev: sumAmt(okPrev), donations: okNow.length, donors: donors.size, average: okNow.length ? sumAmt(okNow) / okNow.length : 0,
      volunteers: volsNow.length, volunteersPrev: all.volunteers.filter((v) => inRange(v.created_at, prevMonths)).length, requests: reqsNow.length },
    series: monthly(all, monthsArr),
    donations: { byMode: top(sumBy(okNow, "mode", (d) => Number(d.amount))), byMethod: top(sumBy(okNow, "method", (d) => Number(d.amount))),
      byPurpose: top(sumBy(okNow, "purpose", (d) => Number(d.amount))), byStatus: top(countBy(all.donations.filter((d) => inRange(d.donated_at, monthsArr)), "status")) },
    volunteers: { byStatus: top(countBy(all.volunteers, "status")), byArea: top(countBy(all.volunteers, "area")) },
    requests: { byStatus: top(countBy(all.requests, (r) => ({ new: "pending", sent: "sent", completed: "completed" }[reqStatus(r.status)]))), byType: top(countBy(reqsNow, "document_type")) },
    projects: { byStatus: top(countBy(all.projects, "status")), byArea: top(countBy(all.projects, "area")), website: top(countBy(site, "status")) }
  };
}

export async function getActivityLog(limit = 100) {
  const { data, error } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getAdminsList(me) {
  const [{ data: admins }, log] = await Promise.all([
    supabase.from("admin_profiles").select("*").order("created_at"),
    getActivityLog(1000)
  ]);
  const counts = countBy(log, "admin_id");
  const emailOf = {};
  log.forEach((l) => { if (l.admin_id && l.admin_label && !emailOf[l.admin_id]) emailOf[l.admin_id] = l.admin_label; });
  return (admins || []).map((a) => ({ ...a, email: a.id === me.id ? me.email : (a.email || emailOf[a.id] || a.display_name || a.id.slice(0, 8)), actions: counts[a.id] || 0 }));
}

// ----- Admin users: add (email + password), photo, switch on / off -----
export function adminPhotoUrl(path) { return supabase.storage.from("admin-photos").getPublicUrl(path).data.publicUrl; }
/** A second client that never stores a session, so creating someone else's account does not sign the current admin out. */
let signupClient = null;
const signup = () => (signupClient ||= createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "sjks-admin-signup" } }));
/**
 * Creates the sign-in account (Supabase Auth) and its admin profile. Returns the profile plus `needsConfirmation`:
 * true when the project asks new accounts to click the link in a confirmation email before they can sign in.
 */
export async function createAdmin({ email, password, display_name }) {
  const { data, error } = await signup().auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  const user = data.user;
  // Supabase answers "ok" with an empty identity list when the email already has an account (it does not reveal which)
  if (!user || !(user.identities || []).length) throw new Error("This email already has an account. Use a different email, or ask the person to sign in with their existing password.");
  const { data: row, error: e2 } = await supabase.from("admin_profiles").insert([{ id: user.id, display_name: display_name || email.split("@")[0], role: "admin", is_active: true, email }]).select().single();
  if (e2) throw e2;
  return { ...row, needsConfirmation: !data.session };
}
export async function updateAdmin(id, data) {
  const { data: row, error } = await supabase.from("admin_profiles").update(data).eq("id", id).select().single();
  if (error) throw error;
  return row;
}
/** Uploads the photo, saves its path on the admin and removes the photo it replaces. Returns the updated profile. */
export async function setAdminPhoto(a, file) {
  const path = `${a.id}/${Date.now()}-${file.name.replace(/[^A-Za-z0-9._-]+/g, "-")}`;
  const { error } = await supabase.storage.from("admin-photos").upload(path, file, { contentType: file.type });
  if (error) throw error;
  let saved;
  try { saved = await updateAdmin(a.id, { photo_path: path }); }
  catch (e) { await supabase.storage.from("admin-photos").remove([path]); throw e; }
  if (a.photo_path) await supabase.storage.from("admin-photos").remove([a.photo_path]);
  return saved;
}
export async function removeAdminPhoto(a) {
  const saved = await updateAdmin(a.id, { photo_path: null });
  if (a.photo_path) await supabase.storage.from("admin-photos").remove([a.photo_path]);
  return saved;
}

export async function getDonations(filter = {}) {
  const query = supabase.from("donations").select("*");
  if (filter.status) query.eq("status", filter.status);
  if (filter.mode) query.eq("mode", filter.mode);
  const { data, error } = await query.order("donated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((d) => ({ ...d, receipt_no: `SJKS-${new Date(d.donated_at).getFullYear()}-${String(d.seq).padStart(6, "0")}` }));
}
export async function getDonation(id) {
  const { data, error } = await supabase.from("donations").select("*").eq("id", id).single();
  if (error) throw error;
  return { ...data, receipt_no: `SJKS-${new Date(data.donated_at).getFullYear()}-${String(data.seq).padStart(6, "0")}` };
}
export async function createDonation(data) {
  const { data: result, error } = await supabase.from("donations").insert([data]).select().single();
  if (error) throw error;
  return result;
}
export async function updateDonation(id, data) {
  const { data: result, error } = await supabase.from("donations").update(data).eq("id", id).select().single();
  if (error) throw error;
  return result;
}

export async function getVolunteers(status = null) {
  const query = supabase.from("volunteers").select("*");
  if (status) query.eq("status", status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function createVolunteer(data) {
  const { data: result, error } = await supabase.from("volunteers").insert([data]).select().single();
  if (error) throw error;
  return result;
}
export async function updateVolunteer(id, data) {
  const { data: result, error } = await supabase.from("volunteers").update(data).eq("id", id).select().single();
  if (error) throw error;
  return result;
}
export async function deleteVolunteer(id) {
  const { data: row } = await supabase.from("volunteers").select("photo_path").eq("id", id).maybeSingle();
  if (row?.photo_path) await supabase.storage.from("volunteer-photos").remove([row.photo_path]);
  const { error } = await supabase.from("volunteers").delete().eq("id", id);
  if (error) throw error;
}
// Volunteer photos shown on the website (About Us -> Our Volunteers): "volunteer-photos" storage bucket.
export function volunteerPhotoUrl(path) { return supabase.storage.from("volunteer-photos").getPublicUrl(path).data.publicUrl; }
/** Uploads the photo, saves its path on the volunteer and removes the photo it replaces. Returns the updated volunteer. */
export async function setVolunteerPhoto(v, file) {
  const path = `${v.id}/${Date.now()}-${file.name.replace(/[^A-Za-z0-9._-]+/g, "-")}`;
  const { error } = await supabase.storage.from("volunteer-photos").upload(path, file, { contentType: file.type });
  if (error) throw error;
  let saved;
  try { saved = await updateVolunteer(v.id, { photo_path: path }); }
  catch (e) { await supabase.storage.from("volunteer-photos").remove([path]); throw e; }
  if (v.photo_path) await supabase.storage.from("volunteer-photos").remove([v.photo_path]);
  return saved;
}
export async function removeVolunteerPhoto(v) {
  const saved = await updateVolunteer(v.id, { photo_path: null });
  if (v.photo_path) await supabase.storage.from("volunteer-photos").remove([v.photo_path]);
  return saved;
}

// Team (website About Us -> Our Executive Committee and Management Team). Listed in website order: block, then sort_order.
export async function getTeamMembers() {
  const { data, error } = await supabase.from("team_members").select("*").order("team").order("sort_order").order("id");
  if (error) throw error;
  return data || [];
}
export async function createTeamMember(data) {
  const { data: result, error } = await supabase.from("team_members").insert([data]).select().single();
  if (error) throw error;
  return result;
}
export async function updateTeamMember(id, data) {
  const { data: result, error } = await supabase.from("team_members").update(data).eq("id", id).select().single();
  if (error) throw error;
  return result;
}
export async function deleteTeamMember(id) {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) throw error;
}

// Messages sent through the website Contact Us form (table form_submissions, kind "contact"), newest first.
export async function getContactMessages(limit = 8) {
  const { data, error, count } = await supabase.from("form_submissions").select("id, created_at, name, email, phone, message, status", { count: "exact" })
    .eq("kind", "contact").order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit);
  if (error) throw error;
  return { rows: data || [], total: count || 0 };
}
/** Every contact message (for the Excel export), fetched 1,000 at a time. */
export async function getAllContactMessages() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("form_submissions").select("created_at, name, email, phone, message, status")
      .eq("kind", "contact").order("created_at", { ascending: false }).order("id", { ascending: false }).range(from, from + 999);
    if (error) throw error;
    all.push(...(data || []));
    if (!data || data.length < 1000) return all;
  }
}
export async function deleteContactMessage(id) {
  const { data, error } = await supabase.from("form_submissions").delete().eq("id", id).eq("kind", "contact").select("id");
  if (error) throw error;
  // nothing came back = the database did not let this admin delete it (the delete rule has not been added yet)
  if (!data || !data.length) throw new Error("The message could not be deleted. Run supabase/migrations/20250118000000_contact_messages_delete.sql in the Supabase SQL Editor, then try again.");
}
/** status: "new" (not answered yet), "contacted" or "closed". */
export async function setContactMessageStatus(id, status) {
  const { error } = await supabase.from("form_submissions").update({ status }).eq("id", id).eq("kind", "contact");
  if (error) throw error;
}

// Website page text (Website Pages). One row per text an admin has changed; the originals live in src/data/pageContent.ts.
export async function getPageContent() {
  const { data, error } = await supabase.from("page_content").select("key, value, updated_at");
  if (error) throw error;
  return data || [];
}
/** `changed` = [{ key, value }] to save; `reset` = keys that go back to their original wording. */
export async function savePageContent(changed, reset) {
  if (changed.length) {
    const { error } = await supabase.from("page_content").upsert(changed, { onConflict: "key" });
    if (error) throw error;
  }
  if (reset.length) {
    const { error } = await supabase.from("page_content").delete().in("key", reset);
    if (error) throw error;
  }
}

// Newsletter subscribers: searched, filtered and paged in the database (the list can grow far past one page of rows).
const subscriberQuery = ({ q, status }, cols, opts) => {
  const query = supabase.from("newsletter_subscribers").select(cols, opts);
  if (status) query.eq("status", status);
  if (q) query.ilike("email", `%${q.replace(/[\\%_]/g, "\\$&")}%`);
  return query.order("subscribed_at", { ascending: false }).order("id", { ascending: false });
};
export async function getSubscribers({ q = "", status = "", page = 1, size = 25 } = {}) {
  const { data, error, count } = await subscriberQuery({ q, status }, "id, email, status, source, subscribed_at", { count: "exact" }).range((page - 1) * size, page * size - 1);
  if (error?.code === "PGRST103") return { rows: [], total: 0 }; // asked for a page past the last one
  if (error) throw error;
  return { rows: data || [], total: count || 0 };
}
/** Every subscriber matching the search + filter (for the Excel export), fetched 1,000 at a time. */
export async function getAllSubscribers({ q = "", status = "" } = {}) {
  const out = [], step = 1000;
  for (let from = 0; ; from += step) {
    const { data, error } = await subscriberQuery({ q, status }, "email, status, source, subscribed_at").range(from, from + step - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < step) return out;
  }
}
export async function getSubscriberCounts() {
  const count = () => supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true });
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const res = await Promise.all([count(), count().eq("status", "active"), count().eq("status", "unsubscribed"), count().gte("subscribed_at", since)]);
  const failed = res.find((r) => r.error);
  if (failed) throw failed.error;
  const [total, active, unsubscribed, recent] = res.map((r) => r.count || 0);
  return { total, active, unsubscribed, recent };
}
export async function updateSubscriberStatus(id, status) {
  const { data: result, error } = await supabase.from("newsletter_subscribers").update({ status }).eq("id", id).select("id, status").single();
  if (error) throw error;
  return result;
}

// Video Gallery (website Media page). Oldest first = the order they appear on the website, left to right.
export async function getVideos() {
  const { data, error } = await supabase.from("gallery_videos").select("*").order("created_at").order("id");
  if (error) throw error;
  return data || [];
}
const videoError = (error) => (error.code === "23505" ? new Error("This video is already in the gallery.") : error);
export async function createVideo(data) {
  const { data: result, error } = await supabase.from("gallery_videos").insert([data]).select().single();
  if (error) throw videoError(error);
  return result;
}
export async function updateVideo(id, data) {
  const { data: result, error } = await supabase.from("gallery_videos").update(data).eq("id", id).select().single();
  if (error) throw videoError(error);
  return result;
}
export async function deleteVideo(id) {
  const { error } = await supabase.from("gallery_videos").delete().eq("id", id);
  if (error) throw error;
}

// Annual Reports (website Transparency -> Annual Reports): one row per financial year, PDFs in the "annual-reports" storage bucket.
export async function getAnnualReports() {
  const { data, error } = await supabase.from("annual_reports").select("*").order("fy");
  if (error) throw error;
  return data || [];
}
const reportError = (error) => (error.code === "23505" ? new Error("Another box already has this name. Use a different name.")
  // the database still has the old rule that only accepts names like 2004-05
  : error.code === "23514" && /fy_check/.test(error.message || "") ? new Error("The database still only accepts names like 2004-05. Run supabase/migrations/20250117000000_annual_reports_free_names.sql in the Supabase SQL Editor, then save again.")
  : error);
export async function createAnnualReport(data) {
  const { data: result, error } = await supabase.from("annual_reports").insert([data]).select().single();
  if (error) throw reportError(error);
  return result;
}
export async function updateAnnualReport(id, data) {
  const { data: result, error } = await supabase.from("annual_reports").update(data).eq("id", id).select().single();
  if (error) throw reportError(error);
  return result;
}
export async function deleteAnnualReport(r) {
  if (r.storage_path) await supabase.storage.from("annual-reports").remove([r.storage_path]);
  const { error } = await supabase.from("annual_reports").delete().eq("id", r.id);
  if (error) throw error;
}
/** Uploads a PDF and returns where it is: { file_url, storage_path }. */
export async function uploadAnnualReportFile(fy, file) {
  // the box name is free text, so only its letters, digits, dots and dashes go into the folder name
  const path = `${fy.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "") || "report"}/${Date.now()}-${file.name.replace(/[^A-Za-z0-9._-]+/g, "-")}`;
  const { error } = await supabase.storage.from("annual-reports").upload(path, file, { contentType: "application/pdf" });
  if (error) throw error;
  return { file_url: supabase.storage.from("annual-reports").getPublicUrl(path).data.publicUrl, storage_path: path };
}
export async function removeAnnualReportFile(path) {
  if (path) await supabase.storage.from("annual-reports").remove([path]);
}

// Photo Gallery (website Media & Gallery -> Photo Gallery): photos added in the admin panel, newest first.
export async function getGalleryPhotos() {
  const { data, error } = await supabase.from("gallery_photos").select("*").order("created_at", { ascending: false }).order("id", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function createGalleryPhoto(data) {
  const { data: result, error } = await supabase.from("gallery_photos").insert([data]).select().single();
  if (error) throw error;
  return result;
}
export async function updateGalleryPhoto(id, data) {
  const { data: result, error } = await supabase.from("gallery_photos").update(data).eq("id", id).select().single();
  if (error) throw error;
  return result;
}
export async function deleteGalleryPhoto(r) {
  const { error } = await supabase.from("gallery_photos").delete().eq("id", r.id);
  if (error) throw error;
  if (r.storage_path) await supabase.storage.from("gallery-photos").remove([r.storage_path]);
}
/** Uploads one photo and returns where it is: { image_url, storage_path }. */
export async function uploadGalleryPhoto(file) {
  const path = `${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-60)}`;
  const { error } = await supabase.storage.from("gallery-photos").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return { image_url: supabase.storage.from("gallery-photos").getPublicUrl(path).data.publicUrl, storage_path: path };
}
export async function removeGalleryPhotoFile(path) {
  if (path) await supabase.storage.from("gallery-photos").remove([path]);
}

// Awards & Recognition (website About Us -> Awards & Recognition). Listed in website order: sort_order, then newest first.
export async function getAwards() {
  const { data, error } = await supabase.from("awards").select("*").order("sort_order").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function createAward(data) {
  const { data: result, error } = await supabase.from("awards").insert([data]).select().single();
  if (error) throw error;
  return result;
}
export async function updateAward(id, data) {
  const { data: result, error } = await supabase.from("awards").update(data).eq("id", id).select().single();
  if (error) throw error;
  return result;
}
export async function deleteAward(r) {
  if (r.storage_path) await supabase.storage.from("award-certificates").remove([r.storage_path]);
  const { error } = await supabase.from("awards").delete().eq("id", r.id);
  if (error) throw error;
}
/** Uploads a certificate image and returns where it is: { image_url, storage_path }. */
export async function uploadAwardCertificate(file) {
  const path = `${Date.now()}-${file.name.replace(/[^A-Za-z0-9._-]+/g, "-")}`;
  const { error } = await supabase.storage.from("award-certificates").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return { image_url: supabase.storage.from("award-certificates").getPublicUrl(path).data.publicUrl, storage_path: path };
}
export async function removeAwardCertificate(path) {
  if (path) await supabase.storage.from("award-certificates").remove([path]);
}

// Blog (website Blog -> /blog). Listed as on the website: newest date first.
export async function getBlogPosts() {
  const { data, error } = await supabase.from("blog_posts").select("*").order("published_on", { ascending: false }).order("id", { ascending: false });
  if (error) throw error;
  return data || [];
}
const blogError = (error) => (error.code === "23505" ? new Error("Another post already uses this web address. Change the address (the part after /blog/).") : error);
export async function createBlogPost(data) {
  const { data: result, error } = await supabase.from("blog_posts").insert([data]).select().single();
  if (error) throw blogError(error);
  return result;
}
export async function updateBlogPost(id, data) {
  const { data: result, error } = await supabase.from("blog_posts").update(data).eq("id", id).select().single();
  if (error) throw blogError(error);
  return result;
}
export async function deleteBlogPost(r) {
  const { error } = await supabase.from("blog_posts").delete().eq("id", r.id);
  if (error) throw error;
  await removeBlogImages([r.cover_path, r.photo_path]);
}
/** Uploads one photo of a post and returns where it is: { url, path }. */
export async function uploadBlogImage(file) {
  const path = `${Date.now()}-${file.name.replace(/[^A-Za-z0-9._-]+/g, "-")}`;
  const { error } = await supabase.storage.from("blog-images").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return { url: supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl, path };
}
export async function removeBlogImages(paths) {
  const list = paths.filter(Boolean);
  if (list.length) await supabase.storage.from("blog-images").remove(list);
}

export async function getDocumentRequests(status = null) {
  const query = supabase.from("document_requests").select("*");
  if (status) query.eq("status", status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function getDocumentRequest(id) {
  const { data, error } = await supabase.from("document_requests").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}
export async function updateDocumentRequest(id, data) {
  const { data: result, error } = await supabase.from("document_requests").update(data).eq("id", id).select().single();
  if (error) throw error;
  return result;
}
export async function deleteDocumentRequest(id) {
  const { data: atts } = await supabase.from("request_attachments").select("storage_path").eq("request_id", id);
  if (atts?.length) await supabase.storage.from("request-files").remove(atts.map((a) => a.storage_path));
  const { error } = await supabase.from("document_requests").delete().eq("id", id);
  if (error) throw error;
}
export async function getRequestAttachments(requestId) {
  const { data, error } = await supabase.from("request_attachments").select("*").eq("request_id", requestId).order("uploaded_at");
  if (error) throw error;
  return data || [];
}
export async function uploadRequestAttachment(requestId, file) {
  const path = `${requestId}/${Date.now()}-${file.name}`;
  const { error: upErr } = await supabase.storage.from("request-files").upload(path, file);
  if (upErr) throw upErr;
  const { data, error } = await supabase.from("request_attachments").insert([{ request_id: requestId, filename: file.name, storage_path: path, mime: file.type, size_bytes: file.size }]).select().single();
  if (error) throw error;
  return data;
}
export async function deleteRequestAttachment(att) {
  await supabase.storage.from("request-files").remove([att.storage_path]);
  const { error } = await supabase.from("request_attachments").delete().eq("id", att.id);
  if (error) throw error;
}
export async function getRequestFileUrl(storagePath) {
  const { data, error } = await supabase.storage.from("request-files").createSignedUrl(storagePath, 600);
  if (error) throw error;
  return data.signedUrl;
}

export async function getEvents(published = null) {
  const query = supabase.from("events").select("*, event_images(*)");
  if (published !== null) query.eq("published", published);
  const { data, error } = await query.order("event_date", { ascending: false });
  if (error) throw error;
  return (data || []).map((e) => ({ ...e, images: (e.event_images || []).sort((a, b) => a.position - b.position) }));
}
/**
 * Events written in the website file public/data/live.json (the default sample event lives there), in the same shape as
 * the database rows plus `file: true`. They cannot be edited here; `fileImages` are their photo addresses.
 * An event marked "sample" in the file shows on the development site only and is hidden on the live site.
 */
export async function getFileEvents() {
  try {
    const r = await fetch("/data/live.json", { cache: "no-store" });
    const j = r.ok ? await r.json() : {};
    return (Array.isArray(j.events) ? j.events : []).map((e) => ({
      file: true, id: `file:${e.id}`, title: e.title || "", event_date: e.date || "", event_time: e.time || "", place: e.place || "", description: e.text || "",
      sample: !!e.sample, published: !e.sample, images: [], fileImages: Array.isArray(e.images) ? e.images : []
    }));
  } catch { return []; }
}
export async function getEvent(id) {
  const { data, error } = await supabase.from("events").select("*, event_images(*)").eq("id", id).single();
  if (error) throw error;
  return { ...data, images: (data.event_images || []).sort((a, b) => a.position - b.position) };
}
export async function createEvent(data) {
  const { data: result, error } = await supabase.from("events").insert([data]).select().single();
  if (error) throw error;
  return { ...result, images: [] };
}
export async function updateEvent(id, data) {
  const { data: result, error } = await supabase.from("events").update(data).eq("id", id).select().single();
  if (error) throw error;
  return result;
}
export async function deleteEvent(id) {
  const { data: images } = await supabase.from("event_images").select("storage_path").eq("event_id", id);
  if (images?.length) await supabase.storage.from("event-images").remove(images.map((img) => img.storage_path));
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
export function eventImageUrl(storagePath) { return supabase.storage.from("event-images").getPublicUrl(storagePath).data.publicUrl; }
export async function uploadEventImage(eventId, file) {
  const path = `${eventId}/${Date.now()}-${file.name}`;
  const { error: upErr } = await supabase.storage.from("event-images").upload(path, file);
  if (upErr) throw upErr;
  const { count } = await supabase.from("event_images").select("id", { count: "exact", head: true }).eq("event_id", eventId);
  const { data, error } = await supabase.from("event_images").insert([{ event_id: eventId, storage_path: path, position: count || 0 }]).select().single();
  if (error) throw error;
  return data;
}
export async function deleteEventImage(img) {
  await supabase.storage.from("event-images").remove([img.storage_path]);
  const { error } = await supabase.from("event_images").delete().eq("id", img.id);
  if (error) throw error;
}

export async function getProjects(published = null) {
  const query = supabase.from("projects").select("*");
  if (published !== null) query.eq("published", published);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function getProject(id) {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}
export async function createProject(data) {
  const { data: result, error } = await supabase.from("projects").insert([data]).select().single();
  if (error) throw error;
  return result;
}
export async function updateProject(id, data) {
  const { data: result, error } = await supabase.from("projects").update(data).eq("id", id).select().single();
  if (error) throw error;
  return result;
}
export async function deleteProject(id) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function getSiteStats() {
  const { data, error } = await supabase.from("site_stats").select("*").order("sort_order");
  if (error) throw error;
  return data || [];
}
export async function updateSiteStat(id, data) {
  const { data: result, error } = await supabase.from("site_stats").update(data).eq("id", id).select().single();
  if (error) throw error;
  return result;
}

export async function getBroadcastAudienceCounts() {
  const [volRes, donRes] = await Promise.all([
    supabase.from("volunteers").select("id", { count: "exact", head: true }).eq("status", "active").not("email", "is", null),
    supabase.from("donations").select("donor_email").eq("status", "success").not("donor_email", "is", null)
  ]);
  const donorEmails = new Set((donRes.data || []).map((d) => (d.donor_email || "").toLowerCase()).filter(Boolean));
  return { volunteers: volRes.count || 0, donors: donorEmails.size, all: (volRes.count || 0) + donorEmails.size };
}
// Broadcast: the messages in the scrolling "Live" strip at the top of the website (newest first).
export async function getTickerMessages() {
  const { data, error } = await supabase.from("ticker_messages").select("*").order("created_at", { ascending: false }).order("id", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function createTickerMessage(message) {
  const { data, error } = await supabase.from("ticker_messages").insert([{ message }]).select().single();
  if (error) throw error;
  return data;
}
export async function deleteTickerMessage(id) {
  const { error } = await supabase.from("ticker_messages").delete().eq("id", id);
  if (error) throw error;
}
export async function getBroadcastHistory() {
  const { data, error } = await supabase.from("broadcasts").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}
