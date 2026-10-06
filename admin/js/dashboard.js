import { getDashboardData, getContactMessages, getAllContactMessages, setContactMessageStatus, deleteContactMessage } from "./data.js";
import { h, inr, tag, timeAgo, fmtDateTime, monthLabel, barChart, statBars, statCard, panel, emptyState, modal, toast, msg, busy, confirmDialog } from "./ui.js";
import { openDonationForm } from "./donations.js";
import { openProjectForm } from "./projects.js";

const n = (v) => Number(v || 0).toLocaleString("en-IN");
const TYPE = { donation: "Donation", volunteer: "Volunteer", request: "Request" };

const greeting = () => { const hr = new Date().getHours(); return hr < 12 ? "Good Morning" : hr < 17 ? "Good Afternoon" : "Good Evening"; };

const CONTACT_STATUS = { new: "New", contacted: "Contacted", closed: "Closed" };
// local date + time as "2026-10-05 12:30" (Excel export, file name)
const stamp = (d) => { const x = new Date(d), p = (v) => String(v).padStart(2, "0"); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())} ${p(x.getHours())}:${p(x.getMinutes())}`; };

/** Link that opens Gmail's "new message" page with the person's address, a subject and their message quoted underneath. */
function gmailReply(m) {
  const quoted = m.message ? `\n\n\n--- Your message, ${fmtDateTime(m.created_at)} ---\n${m.message}` : "";
  const q = new URLSearchParams({ view: "cm", fs: "1", to: m.email, su: "Re: your message to Sahara Jan Kalyan Samiti", body: `Dear ${m.name || "Sir / Madam"},${quoted}`.slice(0, 1500) });
  return `https://mail.google.com/mail/?${q}`;
}

async function deleteContact(m, reload) {
  if (!await confirmDialog({ title: "Delete message?", text: `The message from ${m.name || m.email || "this person"} will be removed permanently. This cannot be undone.`, ok: "Delete message", danger: true })) return false;
  try { await deleteContactMessage(m.id); toast("Message deleted."); reload(); return true; } catch (err) { toast(err.message, "err"); return false; }
}
/** All contact messages (not only the ones on screen) as an Excel file. */
async function exportContacts() {
  const rows = await getAllContactMessages();
  if (!rows.length) return toast("There are no contact messages to export.", "err");
  const { default: writeXlsxFile } = await import("write-excel-file");
  const head = ["Received", "Name", "Email", "Phone", "Message", "Status"].map((value) => ({ value, fontWeight: "bold" }));
  // every cell is written as text, so a value starting with "=" can never run as a formula
  const lines = rows.map((r) => [stamp(r.created_at), r.name || "", r.email || "", r.phone || "", r.message || "", CONTACT_STATUS[r.status] || r.status].map((value) => ({ type: String, value })));
  await writeXlsxFile([head, ...lines], { columns: [{ width: 18 }, { width: 26 }, { width: 34 }, { width: 18 }, { width: 70 }, { width: 14 }], sheet: "Contact messages", stickyRowsCount: 1,
    fileName: `contact-messages-${stamp(new Date()).slice(0, 10)}.xlsx` });
  toast(`Exported ${rows.length} contact message(s).`);
}
/** One message from the website Contact Us form: everything the person wrote, links to answer, and its status. */
function openContactMessage(m, reload) {
  const set = (status, text) => h("button", { type: "button", class: status === "new" ? "ghost" : null, onclick: async () => {
    try { await setContactMessageStatus(m.id, status); close(); toast("Status updated."); reload(); } catch (err) { toast(err.message, "err"); }
  } }, text);
  const close = modal(m.name || "Contact message", h("div", null,
    h("p", { class: "mut" }, `Received ${fmtDateTime(m.created_at)}`, " · ", tag(m.status === "new" ? "pending" : "active", CONTACT_STATUS[m.status] || m.status)),
    h("p", null, m.email ? h("a", { href: `mailto:${m.email}` }, m.email) : null, m.email && m.phone ? " · " : null, m.phone ? h("a", { href: `tel:${m.phone.replace(/[^\d+]/g, "")}` }, m.phone) : null),
    h("p", { class: "pre", "data-no-translate": "" }, m.message || "No message."),
    h("div", { class: "row end" },
      // opens a new Gmail message in the browser, from the Gmail account that is signed in, already addressed to this person
      m.email && h("a", { class: "btn", target: "_blank", rel: "noopener", href: gmailReply(m) }, "Reply by email"),
      h("button", { type: "button", class: "danger", onclick: async () => { if (await deleteContact(m, reload)) close(); } }, "Delete message"),
      h("div", { class: "grow" }),
      m.status === "new" ? set("contacted", "Mark as contacted") : set("new", "Back to new"))));
}

export default async ({ me, go, reload }) => {
  // the two parts load together; a problem with the contact messages never hides the rest of the dashboard
  const [d, contact] = await Promise.all([getDashboardData(), getContactMessages().catch((e) => ({ error: e.message }))]);
  const c = d.counts;
  const waiting = contact.rows ? contact.rows.filter((m) => m.status === "new").length : 0;
  const exportBtn = h("button", { type: "button", class: "ghost sm", onclick: () => busy(exportBtn, () => exportContacts().catch((e) => toast(e.message, "err")), "Exporting…") }, "Export Excel");
  const contactList = contact.error ? msg("err", contact.error)
    : contact.rows.length
      ? h("ul", { class: "feed" }, contact.rows.map((m) => h("li", null, h("span", { class: `dot ${m.status === "new" ? "request" : "volunteer"}`, "aria-hidden": "true" }),
          h("div", { class: "grow" },
            h("a", { href: "#", onclick: (ev) => { ev.preventDefault(); openContactMessage(m, reload); } }, m.name || m.email || "Unnamed"),
            h("div", { class: "mut" }, [m.email, m.phone].filter(Boolean).join(" · ")),
            h("div", { class: "contact-msg", "data-no-translate": "" }, m.message || "")),
          h("div", { class: "feed-r" }, tag(m.status === "new" ? "pending" : "active", CONTACT_STATUS[m.status] || m.status), h("div", { class: "mut" }, timeAgo(m.created_at)),
            h("div", { class: "row nowrap contact-actions" },
              h("button", { type: "button", class: "ghost sm", "aria-label": `View message from ${m.name || m.email || "this person"}`, onclick: () => openContactMessage(m, reload) }, "View"),
              h("button", { type: "button", class: "danger sm", "aria-label": `Delete message from ${m.name || m.email || "this person"}`, onclick: () => deleteContact(m, reload) }, "Delete"))))))
      : emptyState("No contact messages yet. Messages sent from the website Contact Us page appear here.");
  const ongoing = d.ongoingProjects.website + d.ongoingProjects.added;

  // things waiting for an admin
  const todo = [
    c.volunteers.pending && h("a", { href: "#/volunteers/signups", class: "chip warn" }, `${c.volunteers.pending} volunteer sign-up(s) awaiting approval`),
    d.pendingRequests && h("a", { href: "#/requests", class: "chip warn" }, `${d.pendingRequests} document request(s) pending`),
    d.funds.pending && h("a", { href: "#/donations", class: "chip warn" }, `${d.funds.pending} donation(s) with pending payment`)
  ].filter(Boolean);

  const recent = d.recent.length
    ? h("ul", { class: "feed" }, d.recent.map((r) => h("li", null, h("span", { class: `dot ${r.type}`, "aria-hidden": "true" }),
        h("div", { class: "grow" }, h("a", { href: "#/" + r.page }, r.title), h("div", { class: "mut" }, `${TYPE[r.type]} · ${r.sub}`)),
        h("div", { class: "feed-r" }, tag(r.status, r.status === "new" ? "pending" : r.status), h("div", { class: "mut" }, timeAgo(r.at))))))
    : emptyState("No donations, volunteer sign-ups or document requests yet. They appear here as soon as they arrive.");
  const activity = d.activity.length
    ? h("ul", { class: "feed" }, d.activity.map((a) => h("li", null, h("span", { class: `dot act-${a.action}`, "aria-hidden": "true" }),
        h("div", { class: "grow" }, a.summary, h("div", { class: "mut" }, a.admin_label || "")), h("div", { class: "feed-r mut" }, timeAgo(a.created_at)))))
    : emptyState("Admin changes (projects, donations, volunteers, events…) will be listed here.");

  const projStatus = [
    { label: "Ongoing", value: c.projects.website.ongoing + c.projects.added.ongoing, cls: "ok" },
    { label: "Completed", value: c.projects.website.completed + c.projects.added.completed, cls: "dark" },
    { label: "Planned", value: c.projects.added.planned, cls: "warn" },
    { label: "Not dated (website)", value: c.projects.website["not dated"], cls: "mut" }
  ];

  return h("div", null,
    h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, `${greeting()}, ${me.display_name || me.email} 👋`), h("p", { class: "mut" }, `Here's an overview of your impact and activities · live from the database · updated ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`)),
      h("button", { class: "ghost", onclick: reload }, "Refresh")),
    h("div", { class: "row" },
      h("button", { onclick: () => openProjectForm(null, () => go("projects")) }, "+ Add project"),
      h("button", { onclick: () => go("broadcast") }, "Broadcast message"),
      h("button", { onclick: () => openDonationForm(() => go("donations")) }, "Record offline donation")),
    h("div", { class: "status-strip" },
      h("span", { class: "chip" }, "● Email sending requires a backend (not available on this deployment)"),
      todo.length ? todo : h("span", { class: "chip ok" }, "✓ Nothing waiting for approval")),
    h("div", { class: "cards" },
      statCard("Total funds raised", inr(d.funds.total), `Online ${inr(d.funds.online)} · Offline ${inr(d.funds.offline)}`, { href: "#/donations" }),
      statCard("Raised this month", inr(d.funds.thisMonth), d.funds.pending ? `${d.funds.pending} payment(s) pending` : "No pending payments", { href: "#/reports" }),
      statCard("Donation records", n(c.donations.records), `${n(c.donations.success)} successful · ${n(c.donations.pending)} pending · ${n(c.donations.failed + c.donations.cancelled + c.donations.refunded)} other`, { href: "#/donations" }),
      statCard("Volunteers", n(c.volunteers.total), `${n(c.volunteers.active)} active · ${n(c.volunteers.pending)} pending · ${n(c.volunteers.inactive)} inactive`, { href: "#/volunteers/signups", tone: c.volunteers.pending ? "attn" : "" }),
      statCard("Total projects", n(c.projects.website.total + c.projects.added.total), `${n(c.projects.website.total)} on website portfolio · ${n(c.projects.added.total)} added here`, { href: "#/projects" }),
      statCard("Active projects", n(ongoing), `${n(c.projects.website.completed + c.projects.added.completed)} completed · ${n(c.projects.added.planned)} planned`, { href: "#/projects" }),
      statCard("Beneficiary reach", n(d.reach.website + d.reach.added), `Website figure ${n(d.reach.website)} + ${n(d.reach.added)} from added projects`),
      statCard("Pending document requests", n(d.pendingRequests), `${n(c.requests.total)} received in total`, { href: "#/requests", tone: d.pendingRequests ? "attn" : "" }),
      statCard("Upcoming events", n(c.events.upcoming), `${n(c.events.published)} published · ${n(c.events.total)} in total`, { href: "#/events" }),
      statCard("Admin users", n(c.admins), "People who can sign in here", { href: "#/admins" })),
    h("div", { class: "grid-2" },
      panel("Donations raised · last 12 months", barChart(d.months.map((m) => ({ label: monthLabel(m.month), title: monthLabel(m.month, true), value: m.raised })),
        { format: (v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`), emptyText: "No successful donations in the last 12 months yet." }), h("a", { href: "#/reports", class: "more" }, "Full analytics →")),
      panel(null, h("div", { class: "row" }, h("h2", { class: "grow", style: "margin:0" }, "Contact messages"), exportBtn), h("p", { class: "mut" }, contact.rows ? `People who wrote to us from the website Contact Us page, newest first · ${contact.total} in total · ${waiting} not answered yet` : "People who wrote to us from the website Contact Us page."), contactList)),
    h("div", { class: "grid-3" },
      panel("Recent submissions", recent),
      panel("Recent admin activity", activity, h("a", { href: "#/admins", class: "more" }, "Full activity log →")),
      panel("Projects by status", statBars(projStatus), h("p", { class: "mut" }, "Website portfolio (src/data/portfolio.ts) + projects added in admin."))),
    h("p", { class: "mut" }, "Funds count successful INR donations only. Website figures come from public/data/live.json and src/data/portfolio.ts."));
};
