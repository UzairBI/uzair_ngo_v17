// Supabase data layer: common queries for the admin panel.
// All queries use RLS to enforce authorization.

import { supabase } from "./supabase.js";

export async function getDashboardData() {
  try {
    // Get counts for stats cards
    const [donations, volunteers, requests, events, projects, admins] = await Promise.all([
      supabase.from("donations").select("id, amount, status, donated_at", { count: "exact" }),
      supabase.from("volunteers").select("id, status", { count: "exact" }),
      supabase.from("document_requests").select("id, status", { count: "exact" }),
      supabase.from("events").select("id, published, event_date", { count: "exact" }),
      supabase.from("projects").select("id, published, beneficiaries", { count: "exact" }),
      supabase.from("admin_profiles").select("id", { count: "exact" })
    ]);

    const donationList = donations.data || [];
    const volunteerList = volunteers.data || [];
    const requestList = requests.data || [];
    const eventList = events.data || [];
    const projectList = projects.data || [];

    const today = new Date().toISOString().split("T")[0];
    const thisMonth = new Date();
    thisMonth.setDate(1);

    return {
      counts: {
        donations: { total: donations.count, success: 0, pending: 0, failed: 0 },
        volunteers: { total: volunteers.count, pending: 0, active: 0, inactive: 0 },
        requests: { total: requests.count },
        events: { total: events.count, published: 0, upcoming: 0 },
        projects: { total: projects.count },
        admins: admins.count
      },
      funds: {
        total: donationList.filter(d => d.status === "success").reduce((sum, d) => sum + parseFloat(d.amount || 0), 0),
        thisMonth: donationList.filter(d => d.status === "success" && new Date(d.donated_at) >= thisMonth).reduce((sum, d) => sum + parseFloat(d.amount || 0), 0),
        pending: donationList.filter(d => d.status === "pending").length
      },
      pendingRequests: requestList.filter(r => r.status === "new").length,
      pendingVolunteers: volunteerList.filter(v => v.status === "pending").length,
      reach: { website: 0, added: 0 },
      ongoingProjects: { website: 0, added: projectList.length },
      recent: [],
      activity: [],
      months: []
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
}

export async function getDonations(filter = {}) {
  const query = supabase.from("donations").select("*");

  if (filter.status) query.eq("status", filter.status);
  if (filter.mode) query.eq("mode", filter.mode);

  const { data, error } = await query.order("donated_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(d => ({
    ...d,
    receipt_no: `SJKS-${new Date(d.donated_at).getFullYear()}-${String(d.seq).padStart(6, "0")}`
  }));
}

export async function getDonation(id) {
  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return {
    ...data,
    receipt_no: `SJKS-${new Date(data.donated_at).getFullYear()}-${String(data.seq).padStart(6, "0")}`,
    tax: { ok: true, reason: null }
  };
}

export async function createDonation(data) {
  const { data: result, error } = await supabase
    .from("donations")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateDonation(id, data) {
  const { data: result, error } = await supabase
    .from("donations")
    .update(data)
    .eq("id", id)
    .select()
    .single();

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
  const { data: result, error } = await supabase
    .from("volunteers")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateVolunteer(id, data) {
  const { data: result, error } = await supabase
    .from("volunteers")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getDocumentRequests(status = null) {
  const query = supabase.from("document_requests").select("*");
  if (status) query.eq("status", status);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateDocumentRequest(id, data) {
  const { data: result, error } = await supabase
    .from("document_requests")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getEvents(published = null) {
  const query = supabase.from("events").select("*, event_images(*)");
  if (published !== null) query.eq("published", published);

  const { data, error } = await query.order("event_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getEvent(id) {
  const { data, error } = await supabase
    .from("events")
    .select("*, event_images(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createEvent(data) {
  const { data: result, error } = await supabase
    .from("events")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateEvent(id, data) {
  const { data: result, error } = await supabase
    .from("events")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteEvent(id) {
  const { error } = await supabase.from("events").delete().eq("id", id);
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
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProject(data) {
  const { data: result, error } = await supabase
    .from("projects")
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateProject(id, data) {
  const { data: result, error } = await supabase
    .from("projects")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteProject(id) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function getActivityLog(limit = 100) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getSiteStats() {
  const { data, error } = await supabase.from("site_stats").select("*").order("sort_order");
  if (error) throw error;
  return data || [];
}

export async function updateSiteStat(id, data) {
  const { data: result, error } = await supabase
    .from("site_stats")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
