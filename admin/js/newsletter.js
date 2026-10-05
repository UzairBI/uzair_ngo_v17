import { getSubscribers, getAllSubscribers, getSubscriberCounts, updateSubscriberStatus } from "./data.js";
import { h, tag, fmtDate, statCard, spinner, msg, toast, busy } from "./ui.js";

const n = (v) => Number(v || 0).toLocaleString("en-IN");
const STATUS = { active: "Active", unsubscribed: "Unsubscribed" };
// "website-footer" -> "Website Footer"
const sourceLabel = (s) => String(s || "").split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") || "—";
// local date + time as "2026-10-05 12:30" (Excel export, file name)
const stamp = (d) => { const x = new Date(d), p = (v) => String(v).padStart(2, "0"); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())} ${p(x.getHours())}:${p(x.getMinutes())}`; };

// Same look as the shared dataTable (ui.js), but the search, filter and pages are run by the database,
// so the browser only ever holds the rows on screen.
export default async () => {
  const st = { q: "", status: "", page: 1, size: 25, total: 0 };
  let seq = 0; // ignores replies that arrive after a newer search
  const cards = h("div", { class: "cards" });
  const body = h("div"), info = h("div", { class: "dt-info" }), pager = h("div", { class: "dt-pager" });

  const qIn = h("input", { type: "search", placeholder: "Search subscribers…", "aria-label": "Search subscribers by email", oninput: () => { clearTimeout(qIn.t); qIn.t = setTimeout(() => { st.q = qIn.value.trim(); st.page = 1; load(); }, 300); } });
  const sel = h("select", { "aria-label": "Status", onchange: () => { st.status = sel.value; st.page = 1; load(); } },
    h("option", { value: "" }, "All"), Object.entries(STATUS).map(([v, t]) => h("option", { value: v }, t)));
  const clear = h("button", { type: "button", class: "ghost sm", hidden: true, onclick: () => { clearTimeout(qIn.t); st.q = st.status = ""; qIn.value = sel.value = ""; st.page = 1; load(); } }, "Clear filters");

  const exportBtn = h("button", { type: "button", class: "ghost", onclick: () => busy(exportBtn, async () => {
    try {
      const rows = await getAllSubscribers(st);
      if (!rows.length) return toast("There are no subscribers to export.", "err");
      const { default: writeXlsxFile } = await import("write-excel-file");
      const head = ["Email", "Status", "Subscribed Date", "Source"].map((value) => ({ value, fontWeight: "bold" }));
      // every cell is written as text, so a value starting with "=" can never run as a formula
      const lines = rows.map((r) => [r.email, STATUS[r.status] || r.status, stamp(r.subscribed_at), sourceLabel(r.source)].map((value) => ({ type: String, value })));
      await writeXlsxFile([head, ...lines], { columns: [{ width: 38 }, { width: 16 }, { width: 20 }, { width: 20 }], sheet: "Subscribers", stickyRowsCount: 1,
        fileName: `newsletter-subscribers-${stamp(new Date()).slice(0, 10)}.xlsx` });
      toast(`Exported ${rows.length} subscriber(s).`);
    } catch (e) { toast(e.message, "err"); }
  }, "Exporting…") }, "Export Excel");

  const setStatus = (r) => {
    const to = r.status === "active" ? "unsubscribed" : "active";
    const btn = h("button", { type: "button", class: to === "active" ? "sm" : "ghost sm", onclick: async () => {
      try { await busy(btn, () => updateSubscriberStatus(r.id, to)); toast(`${r.email} is now ${STATUS[to].toLowerCase()}.`); load(); }
      catch (e) { toast(e.message, "err"); }
    } }, to === "active" ? "Reactivate" : "Unsubscribe");
    return btn;
  };

  function draw(rows) {
    const pages = Math.max(1, Math.ceil(st.total / st.size));
    body.replaceChildren(h("div", { class: "tablewrap" }, h("table", null,
      h("thead", null, h("tr", null, ["Email", "Status", "Subscribed Date", "Source", ""].map((l) => h("th", { class: l ? "" : "actions" }, l)))),
      h("tbody", null, rows.length
        ? rows.map((r) => h("tr", null, h("td", null, h("b", null, r.email)), h("td", null, tag(r.status === "active" ? "active" : "inactive", STATUS[r.status] || r.status)),
            h("td", null, fmtDate(r.subscribed_at)), h("td", null, sourceLabel(r.source)), h("td", { class: "actions" }, setStatus(r))))
        : h("tr", null, h("td", { colspan: 5, class: "td-empty" }, st.q || st.status ? "No subscribers match these filters." : "No subscribers yet. Sign-ups from the website footer appear here."))))));
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
      const [{ rows, total }, c] = await Promise.all([getSubscribers(st), getSubscriberCounts()]);
      if (mine !== seq) return;
      if (!rows.length && st.page > 1) { st.page = 1; return load(); } // the last row of the last page just left this filter
      st.total = total;
      cards.replaceChildren(statCard("Total subscribers", n(c.total), "Everyone who has signed up"), statCard("Active subscribers", n(c.active), "Receiving updates"),
        statCard("Unsubscribed", n(c.unsubscribed), "Kept on record, not contacted"), statCard("New subscribers", n(c.recent), "Subscribed in the last 30 days"));
      draw(rows);
    } catch (e) {
      if (mine !== seq) return;
      body.replaceChildren(msg("err", e.code === "PGRST205" ? "The subscribers table does not exist yet. Run supabase/migrations/20250105000000_newsletter_subscribers.sql in the Supabase SQL Editor." : e.message),
        h("button", { type: "button", class: "ghost", onclick: load }, "Try again"));
    }
  }

  const wrap = h("div", null,
    h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Newsletter Subscribers"),
      h("p", { class: "mut" }, "Emails from the “Field Updates Newsletter” form in the website footer. Unsubscribed emails are kept on record instead of being deleted."))),
    cards,
    h("div", { class: "dt" },
      h("div", { class: "dt-tools" }, h("div", { class: "dt-search" }, qIn), h("label", { class: "dt-f" }, "Status", sel), clear, h("div", { class: "grow" }), exportBtn),
      body, h("div", { class: "dt-foot" }, info, pager)));
  await load(); return wrap;
};
