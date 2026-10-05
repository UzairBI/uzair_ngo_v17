import { getTickerMessages, createTickerMessage, deleteTickerMessage } from "./data.js";
import { h, field, fmtDateTime, msg, toast, busy, validate, rules, confirmDialog, spinner } from "./ui.js";

// Broadcast = the scrolling "Live" strip at the very top of every page of the website.
// Write a message, send it, and it joins the strip (newest first). Nothing else happens here.
const MAX = 160;

export default async () => {
  const list = h("div");
  const message = h("textarea", { name: "message", rows: "3", maxlength: String(MAX), placeholder: "e.g. 🎉 New event is live now: join our health camp this Sunday" });
  const send = h("button", { type: "submit" }, "Send to website");

  async function load() {
    list.replaceChildren(spinner());
    try {
      const rows = await getTickerMessages();
      list.replaceChildren(rows.length
        ? h("ul", { class: "feed" }, rows.map((r) => h("li", null,
            h("div", { class: "grow" }, h("div", { class: "pre" }, r.message), h("div", { class: "mut" }, `Sent ${fmtDateTime(r.created_at)}`)),
            h("button", { type: "button", class: "danger sm", onclick: async () => {
              if (!await confirmDialog({ title: "Remove message?", text: `“${r.message}” will stop showing on the website.`, ok: "Remove", danger: true })) return;
              try { await deleteTickerMessage(r.id); toast("Message removed from the website."); load(); } catch (e) { toast(e.message, "err"); }
            } }, "Remove"))))
        : h("p", { class: "mut" }, "No messages. The website shows its built-in text until you send one."));
    } catch (e) {
      list.replaceChildren(msg("err", e.code === "PGRST205" ? "The messages table does not exist yet. Run supabase/migrations/20250112000000_ticker_messages.sql in the Supabase SQL Editor." : e.message));
    }
  }

  const form = h("form", { novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    if (!validate(form, { message: rules.required("Message", MAX) })) return;
    try {
      await busy(send, () => createTickerMessage(message.value.trim().replace(/\s+/g, " ")), "Sending…");
      message.value = ""; toast("Sent. It is now showing at the top of the website."); load();
    } catch (err) { toast(err.message, "err"); }
  } },
    field(`Message (up to ${MAX} characters)`, message),
    h("div", { class: "row" }, send));

  const wrap = h("div", null,
    h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Broadcast message"),
      h("p", { class: "mut" }, "Messages here scroll in the “Live” strip at the very top of every page of the website. A new message appears first."))),
    h("div", { class: "panel" }, form),
    h("h2", { class: "sec" }, "Showing on the website now"), h("div", { class: "panel" }, list));
  await load(); return wrap;
};
