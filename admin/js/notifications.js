import { supabase } from "./supabase.js";
import { h, inr, fmtDate, timeAgo } from "./ui.js";

// Notifications (the bell in the top bar). Nothing is stored for them in the database: the list is worked out from what
// is already there - what visitors sent through the website, what is waiting for an admin, reminders and what other
// admins changed. Which ones were read is remembered on this device, per admin.

const DAY = 864e5;
const localDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const clip = (s, n = 90) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…" : s; };
/** A source that fails (a table not set up yet, no permission) just adds nothing: the other notifications still show. */
const rows = async (query) => { try { const { data, error } = await query; return error ? [] : data || []; } catch { return []; } };

// [group shown as the coloured dot, page the notification opens]
const KINDS = {
  message: ["new", "messages"], volunteer: ["new", "volunteers/signups"], request: ["new", "requests"], donationPending: ["warn", "donations"],
  donation: ["ok", "donations"], subscriber: ["ok", "subscribers"], eventSoon: ["info", "events"], eventDraft: ["warn", "events"],
  blogDraft: ["warn", "blog"], activity: ["info", "admins"]
};

/** Every notification for this admin, newest first: [{ id, kind, title, sub, at, when }]. */
export async function getNotifications(me) {
  const now = new Date(), today = localDay(now), week = localDay(new Date(now.getTime() + 7 * DAY));
  const since = new Date(now.getTime() - 14 * DAY).toISOString();
  const [messages, volunteers, requests, pending, donations, subscribers, soon, eventDrafts, blogDrafts, activity] = await Promise.all([
    // sent through the website and not answered yet
    rows(supabase.from("form_submissions").select("id, created_at, name, email, message").eq("kind", "contact").eq("status", "new").order("created_at", { ascending: false }).limit(20)),
    rows(supabase.from("volunteers").select("id, created_at, name, area").eq("status", "pending").order("created_at", { ascending: false }).limit(20)),
    rows(supabase.from("document_requests").select("id, created_at, reference, name, document_type").eq("status", "new").order("created_at", { ascending: false }).limit(20)),
    rows(supabase.from("donations").select("id, created_at, amount, donor_name").eq("status", "pending").order("created_at", { ascending: false }).limit(20)),
    // good news from the last two weeks
    rows(supabase.from("donations").select("id, created_at, amount, donor_name, mode").eq("status", "success").gte("created_at", since).order("created_at", { ascending: false }).limit(15)),
    rows(supabase.from("newsletter_subscribers").select("id, email, subscribed_at").eq("status", "active").gte("subscribed_at", since).order("subscribed_at", { ascending: false }).limit(15)),
    // reminders
    rows(supabase.from("events").select("id, title, event_date, place").eq("published", true).gte("event_date", today).lte("event_date", week).order("event_date")),
    rows(supabase.from("events").select("id, title, event_date, updated_at").eq("published", false).gte("event_date", today).order("event_date").limit(15)),
    rows(supabase.from("blog_posts").select("id, title, updated_at").eq("published", false).order("updated_at", { ascending: false }).limit(15)),
    // what the other admins did (what visitors send is logged without an admin, and is already listed above)
    me?.id ? rows(supabase.from("activity_log").select("id, created_at, admin_label, summary").not("admin_id", "is", null).neq("admin_id", me.id).gte("created_at", since).order("created_at", { ascending: false }).limit(15)) : []
  ]);
  const tomorrow = localDay(new Date(now.getTime() + DAY));
  const list = [
    ...messages.map((m) => ({ id: `message:${m.id}`, kind: "message", title: "New contact message", sub: [m.name || m.email, clip(m.message, 70)].filter(Boolean).join(" · "), at: m.created_at })),
    ...volunteers.map((v) => ({ id: `volunteer:${v.id}`, kind: "volunteer", title: "Volunteer sign-up awaiting approval", sub: [v.name, v.area].filter(Boolean).join(" · "), at: v.created_at })),
    ...requests.map((r) => ({ id: `request:${r.id}`, kind: "request", title: "New document request", sub: [r.reference, r.name, r.document_type].filter(Boolean).join(" · "), at: r.created_at })),
    ...pending.map((d) => ({ id: `donation-pending:${d.id}`, kind: "donationPending", title: "Donation waiting for confirmation", sub: [inr(d.amount), d.donor_name].filter(Boolean).join(" · "), at: d.created_at })),
    ...donations.map((d) => ({ id: `donation:${d.id}`, kind: "donation", title: "Donation received", sub: [inr(d.amount), d.donor_name, d.mode].filter(Boolean).join(" · "), at: d.created_at })),
    ...subscribers.map((s) => ({ id: `subscriber:${s.id}`, kind: "subscriber", title: "New newsletter subscriber", sub: s.email, at: s.subscribed_at })),
    // a reminder comes back as the day gets nearer: this week -> tomorrow -> today
    ...soon.map((e) => { const step = e.event_date === today ? "today" : e.event_date === tomorrow ? "tomorrow" : "week";
      return { id: `event-${step}:${e.id}`, kind: "eventSoon", title: step === "today" ? "Event today" : step === "tomorrow" ? "Event tomorrow" : "Event this week", sub: [e.title, fmtDate(e.event_date), e.place].filter(Boolean).join(" · "), at: now.toISOString(), when: fmtDate(e.event_date) }; }),
    ...eventDrafts.map((e) => ({ id: `event-draft:${e.id}`, kind: "eventDraft", title: "Draft event not published yet", sub: [e.title, fmtDate(e.event_date)].filter(Boolean).join(" · "), at: e.updated_at })),
    ...blogDrafts.map((p) => ({ id: `blog-draft:${p.id}`, kind: "blogDraft", title: "Draft post not published yet", sub: p.title, at: p.updated_at })),
    ...activity.map((a) => ({ id: `activity:${a.id}`, kind: "activity", title: "Change by another admin", sub: [a.admin_label, clip(a.summary, 110)].filter(Boolean).join(" · "), at: a.created_at }))
  ];
  return list.filter((n) => n.at).sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

/** Which notifications this admin has read, remembered on this device. */
function readStore(me) {
  const key = `admin-notif-read:${me?.id || "admin"}`;
  let ids = [];
  try { const saved = JSON.parse(localStorage.getItem(key) || "[]"); if (Array.isArray(saved)) ids = saved.map(String); } catch { /* storage blocked: nothing is remembered */ }
  const set = new Set(ids);
  return { has: (id) => set.has(id), add: (list) => {
    list.forEach((id) => set.add(id));
    try { localStorage.setItem(key, JSON.stringify([...set].slice(-800))); } catch { /* not remembered */ }
  } };
}

const bellIcon = () => {
  const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
  Object.entries({ viewBox: "0 0 24 24", width: "20", height: "20", fill: "none", stroke: "currentColor", "stroke-width": "1.9", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }).forEach(([k, v]) => svg.setAttribute(k, v));
  ["M6 9a6 6 0 0112 0c0 5 2 6.5 2 6.5H4S6 14 6 9z", "M10 19.5a2.2 2.2 0 004 0"].forEach((d) => { const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); svg.append(p); });
  return svg;
};

/**
 * The bell for the top bar. `el` goes into the page; `refresh()` reloads the list (called on every page change, so the
 * number follows what was just answered, approved or published). The list also reloads by itself every minute.
 */
export function notificationBell(me) {
  const read = readStore(me);
  let items = [], open = false, onlyUnread = false, loaded = false;
  const count = h("span", { class: "notif-count", hidden: true });
  const btn = h("button", { type: "button", class: "notif-btn ghost", "aria-haspopup": "true", "aria-expanded": "false", "aria-label": "Notifications", title: "Notifications", onclick: () => toggle() }, bellIcon(), count);
  const list = h("ul", { class: "notif-list" });
  const markAll = h("button", { type: "button", class: "ghost sm", onclick: () => { read.add(items.map((n) => n.id)); draw(); } }, "Mark all as read");
  const filter = h("button", { type: "button", class: "ghost sm", "aria-pressed": "false", onclick: () => { onlyUnread = !onlyUnread; filter.setAttribute("aria-pressed", String(onlyUnread)); draw(); } }, "Unread only");
  const panel = h("div", { class: "notif-panel", role: "dialog", "aria-label": "Notifications", hidden: true },
    h("div", { class: "notif-head" }, h("b", { class: "grow" }, "Notifications"), filter, markAll), list,
    h("p", { class: "notif-foot mut" }, "New messages, sign-ups, requests and donations, reminders for events and drafts, and changes by other admins."));
  const el = h("div", { class: "notif" }, btn, panel);

  function draw() {
    const unread = items.filter((n) => !read.has(n.id)).length;
    count.hidden = !unread; count.textContent = unread > 99 ? "99+" : String(unread || "");
    btn.setAttribute("aria-label", unread ? `Notifications (${unread} unread)` : "Notifications");
    markAll.disabled = !unread;
    const shown = onlyUnread ? items.filter((n) => !read.has(n.id)) : items;
    list.replaceChildren(...(!loaded ? [h("li", { class: "notif-empty mut" }, "Loading…")]
      : !shown.length ? [h("li", { class: "notif-empty mut" }, items.length ? "No unread notifications." : "You are all caught up. Nothing needs your attention.")]
      : shown.map((n) => h("li", null, h("a", { href: "#/" + KINDS[n.kind][1], class: read.has(n.id) ? "" : "unread", onclick: () => { read.add([n.id]); toggle(false); draw(); } },
        h("span", { class: `notif-dot ${KINDS[n.kind][0]}`, "aria-hidden": "true" }),
        h("span", { class: "notif-text" }, h("b", null, n.title), n.sub ? h("span", { "data-no-translate": "" }, n.sub) : null, h("small", null, n.when || timeAgo(n.at))))))));
  }
  async function refresh() {
    try { items = await getNotifications(me); loaded = true; draw(); } catch { /* the bell is optional: the pages still work */ }
  }
  function toggle(to = !open) {
    open = to; panel.hidden = !open; btn.setAttribute("aria-expanded", String(open));
    if (open) refresh();
  }
  // closes on a click outside it and on Escape; stops listening once the bell is gone (signed out)
  const outside = (e) => { if (!el.isConnected) return stop(); if (open && !el.contains(e.target)) toggle(false); };
  const esc = (e) => { if (open && e.key === "Escape") { toggle(false); btn.focus(); } };
  const timer = setInterval(() => (el.isConnected ? document.hidden || refresh() : stop()), 60000);
  function stop() { clearInterval(timer); document.removeEventListener("click", outside); document.removeEventListener("keydown", esc); }
  document.addEventListener("click", outside); document.addEventListener("keydown", esc);
  draw();
  return { el, refresh };
}
