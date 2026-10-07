import { getContactMessagesPage, getContactMessageCounts, getAllContactMessages, setContactMessageStatus, deleteContactMessage } from "./data.js";
import { h, tag, timeAgo, fmtDateTime, statCard, spinner, modal, toast, msg, busy, confirmDialog } from "./ui.js";

const n = (v) => Number(v || 0).toLocaleString("en-IN");
export const CONTACT_STATUS = { new: "New", contacted: "Contacted", closed: "Closed" };
// local date + time as "2026-10-05 12:30" (Excel export, file name)
const stamp = (d) => { const x = new Date(d), p = (v) => String(v).padStart(2, "0"); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())} ${p(x.getHours())}:${p(x.getMinutes())}`; };

/** Link that opens Gmail's "new message" page with the person's address, a subject and their message quoted underneath. */
function gmailReply(m) {
  const quoted = m.message ? `\n\n\n--- Your message, ${fmtDateTime(m.created_at)} ---\n${m.message}` : "";
  const q = new URLSearchParams({ view: "cm", fs: "1", to: m.email, su: "Re: your message to Sahara Jan Kalyan Samiti", body: `Dear ${m.name || "Sir / Madam"},${quoted}`.slice(0, 1500) });
  return `https://mail.google.com/mail/?${q}`;
}

export async function deleteContact(m, reload) {
  if (!await confirmDialog({ title: "Delete message?", text: `The message from ${m.name || m.email || "this person"} will be removed permanently. This cannot be undone.`, ok: "Delete message", danger: true })) return false;
  try { await deleteContactMessage(m.id); toast("Message deleted."); reload(); return true; } catch (err) { toast(err.message, "err"); return false; }
}
/** Contact messages as an Excel file: all of them, or only the ones matching a search + status filter. */
export async function exportContacts(filter) {
  const rows = await getAllContactMessages(filter);
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
export function openContactMessage(m, reload) {
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

// Same look as the Newsletter Subscribers page: the search, filter and pages are run by the database.
export default async ({ badges }) => {
  const st = { q: "", status: "", page: 1, size: 25, total: 0 };
  let seq = 0; // ignores replies that arrive after a newer search
  const cards = h("div", { class: "cards" });
  const body = h("div"), info = h("div", { class: "dt-info" }), pager = h("div", { class: "dt-pager" });
  // after a status change or a delete: this list and the number next to the menu item
  const refresh = () => { load(); badges(); };

  const qIn = h("input", { type: "search", placeholder: "Search messages…", "aria-label": "Search messages by name, email, phone or text", oninput: () => { clearTimeout(qIn.t); qIn.t = setTimeout(() => { st.q = qIn.value.trim(); st.page = 1; load(); }, 300); } });
  const sel = h("select", { "aria-label": "Status", onchange: () => { st.status = sel.value; st.page = 1; load(); } },
    h("option", { value: "" }, "All"), Object.entries(CONTACT_STATUS).map(([v, t]) => h("option", { value: v }, t)));
  const clear = h("button", { type: "button", class: "ghost sm", hidden: true, onclick: () => { clearTimeout(qIn.t); st.q = st.status = ""; qIn.value = sel.value = ""; st.page = 1; load(); } }, "Clear filters");
  const exportBtn = h("button", { type: "button", class: "ghost", onclick: () => busy(exportBtn, () => exportContacts(st).catch((e) => toast(e.message, "err")), "Exporting…") }, "Export Excel");

  function draw(rows) {
    const pages = Math.max(1, Math.ceil(st.total / st.size));
    const who = (m) => m.name || m.email || "this person";
    body.replaceChildren(h("div", { class: "tablewrap" }, h("table", null,
      h("thead", null, h("tr", null, ["Name", "Message", "Status", "Received", ""].map((l) => h("th", { class: l ? "" : "actions" }, l)))),
      h("tbody", null, rows.length
        ? rows.map((m) => h("tr", null,
            h("td", null, h("a", { href: "#", onclick: (ev) => { ev.preventDefault(); openContactMessage(m, refresh); } }, h("b", null, m.name || m.email || "Unnamed")), h("div", { class: "mut" }, [m.email, m.phone].filter(Boolean).join(" · "))),
            h("td", null, h("div", { class: "contact-msg", "data-no-translate": "" }, m.message || "")),
            h("td", null, tag(m.status === "new" ? "pending" : "active", CONTACT_STATUS[m.status] || m.status)),
            h("td", { title: fmtDateTime(m.created_at) }, timeAgo(m.created_at)),
            h("td", { class: "actions" },
              h("button", { type: "button", class: "ghost sm", "aria-label": `View message from ${who(m)}`, onclick: () => openContactMessage(m, refresh) }, "View"),
              h("button", { type: "button", class: "danger sm", "aria-label": `Delete message from ${who(m)}`, onclick: () => deleteContact(m, refresh) }, "Delete"))))
        : h("tr", null, h("td", { colspan: 5, class: "td-empty" }, st.q || st.status ? "No messages match these filters." : "No contact messages yet. Messages sent from the website Contact Us page appear here."))))));
    info.textContent = rows.length ? `Showing ${n((st.page - 1) * st.size + 1)}–${n((st.page - 1) * st.size + rows.length)} of ${n(st.total)}` : "";
    pager.replaceChildren(
      h("label", { class: "dt-size" }, "Rows", h("select", { "aria-label": "Rows per page", onchange: (e) => { st.size = +e.target.value; st.page = 1; load(); } }, [10, 25, 50, 100].map((v) => h("option", { value: v, selected: v === st.size }, v)))),
      h("button", { type: "button", class: "ghost sm", disabled: st.page <= 1, onclick: () => { st.page--; load(); } }, "‹ Prev"),
      h("span", { class: "mut" }, `Page ${st.page} of ${pages}`),
      h("button", { type: "button", class: "ghost sm", disabled: st.page >= pages, onclick: () => { st.page++; load(); } }, "Next ›"));
  }

  async function load() {
    const mine = ++seq;
    clear.hidden = !(st.q || st.status);
    body.replaceChildren(spinner()); info.textContent = ""; pager.replaceChildren();
    try {
      const [{ rows, total }, c] = await Promise.all([getContactMessagesPage(st), getContactMessageCounts()]);
      if (mine !== seq) return;
      if (!rows.length && st.page > 1) { st.page = 1; return load(); } // the last row of the last page just left this filter
      st.total = total;
      cards.replaceChildren(statCard("Total messages", n(c.total), "Everything received from the Contact Us page"), statCard("Not answered yet", n(c.waiting), "Waiting for a reply", { tone: c.waiting ? "attn" : "" }),
        statCard("Contacted", n(c.contacted), "Already answered"), statCard("New messages", n(c.recent), "Received in the last 30 days"));
      draw(rows);
    } catch (e) {
      if (mine !== seq) return;
      body.replaceChildren(msg("err", e.message), h("button", { type: "button", class: "ghost", onclick: load }, "Try again"));
    }
  }

  const wrap = h("div", null,
    h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Contact messages"),
      h("p", { class: "mut" }, "People who wrote to us from the website Contact Us page."))),
    cards,
    h("div", { class: "dt" },
      h("div", { class: "dt-tools" }, h("div", { class: "dt-search" }, qIn), h("label", { class: "dt-f" }, "Status", sel), clear, h("div", { class: "grow" }), exportBtn),
      body, h("div", { class: "dt-foot" }, info, pager)));
  await load(); return wrap;
};
