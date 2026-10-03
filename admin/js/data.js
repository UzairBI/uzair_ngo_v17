// Supabase data layer: common queries for the admin panel.
// All queries use RLS to enforce authorization. Stats/reporting logic mirrors the
// old server/stats.js + server/portfolio.js, computed here client-side instead.

import { supabase } from "./supabase.js";

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
    ...all.volunteers.map((v) => ({ type: "volunteer", at: v.created_at, title: `Volunteer: ${v.name || "Unnamed"}`, sub: v.area || "Volunteer sign-up", status: v.status, page: "volunteers" })),
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
    supabase.from("admin_profiles").select("id, display_name, role, is_active, created_at, last_login_at").order("created_at"),
    getActivityLog(1000)
  ]);
  const counts = countBy(log, "admin_id");
  const emailOf = {};
  log.forEach((l) => { if (l.admin_id && l.admin_label && !emailOf[l.admin_id]) emailOf[l.admin_id] = l.admin_label; });
  return (admins || []).map((a) => ({ ...a, email: a.id === me.id ? me.email : (emailOf[a.id] || a.display_name || a.id.slice(0, 8)), actions: counts[a.id] || 0 }));
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
  const { error } = await supabase.from("volunteers").delete().eq("id", id);
  if (error) throw error;
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
export async function getBroadcastHistory() {
  const { data, error } = await supabase.from("broadcasts").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}
