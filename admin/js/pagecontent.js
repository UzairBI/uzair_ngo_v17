import { getPageContent, savePageContent } from "./data.js";
import { h, fmtDateTime, msg, tag, toast, busy, confirmDialog, panel } from "./ui.js";
import { pageTexts, PAGE_TEXT_MAX } from "../../src/data/pageContent.ts";

// Website address of each page, for the "View page" link.
const PATHS = { "Home: Impact Numbers": "/", "About Us": "/about", "Our Projects": "/projects", "Photo & Video Gallery": "/media", "Latest News": "/news", "Events Calendar": "/events",
  "Transparency & Reports": "/transparency", "Get Involved": "/get-involved", "Contact Us": "/contact", "Donate": "/donate",
  "Privacy Policy": "/privacy", "Terms of Use": "/terms", "DPDP Compliance Notice": "/dpdp" };
const pages = [...new Set(pageTexts.map((x) => x.page))];

/** One page of the website: every text on it in a box, saved together with the page's "Save changes" button. */
function pageForm(page, saved, reload) {
  const items = pageTexts.filter((x) => x.page === page);
  const save = h("button", { type: "submit" }, "Save changes");
  const inputs = items.map((x, n) => {
    // a number and its text ("...value" then "...label") share one line: no label above each box, just the two boxes
    const pairOf = x.key.endsWith(".label") && items[n - 1]?.key === x.key.replace(/label$/, "value") ? items[n - 1] : null;
    const paired = !!pairOf || (x.key.endsWith(".value") && items[n + 1]?.key === x.key.replace(/value$/, "label"));
    const input = x.long
      ? h("textarea", { name: x.key, rows: String(Math.min(8, Math.max(3, Math.ceil(x.text.length / 90)))), maxlength: String(PAGE_TEXT_MAX) }, saved[x.key]?.value ?? x.text)
      : h("input", { name: x.key, maxlength: String(PAGE_TEXT_MAX), value: saved[x.key]?.value ?? x.text, ...(paired ? { "aria-label": x.label } : {}) });
    const state = h("span");
    // "Changed" while the box differs from the original wording; the button puts the original back (saved with the page)
    const mark = () => {
      const changed = input.value.trim() !== x.text;
      state.replaceChildren(changed ? (paired ? "" : tag("pending", "Changed")) : "", changed ? h("button", { type: "button", class: "ghost sm", title: `Original: ${x.text}`, onclick: () => { input.value = x.text; mark(); } }, paired ? "Undo" : "Use original") : "");
    };
    input.addEventListener("input", mark); mark();
    return { x, input, state, paired, pairOf, el: paired ? null : h("label", null, h("span", { class: "row nowrap" }, x.label, state), input) };
  });
  // what goes into the form, top to bottom: a small heading where a group starts, then single boxes or number + text lines
  const body = [];
  inputs.forEach((i, n) => {
    if (i.x.section && i.x.section !== items[n - 1]?.section) body.push(h("h4", { class: "pt-head" }, i.x.section), i.paired ? h("div", { class: "pt-pair pt-cols mut" }, h("span", null, "Number"), h("span", null, "Text shown with it")) : "");
    if (i.pairOf) { const a = inputs[n - 1]; body.push(h("div", { class: "pt-pair" }, a.input, i.input, h("span", { class: "row nowrap" }, a.state, i.state))); }
    else if (!i.paired) body.push(i.el);
  });
  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    const empty = inputs.find((i) => !i.input.value.trim());
    if (empty) { toast(`"${empty.x.label}" is empty. Type the text, or press "Use original".`, "err"); empty.input.focus(); return; }
    // only what differs from the saved state is sent: new wording is stored, wording equal to the original removes its row
    const changed = [], reset = [];
    inputs.forEach(({ x, input }) => {
      const value = input.value.trim(), was = saved[x.key]?.value;
      if (value === x.text) { if (was !== undefined) reset.push(x.key); }
      else if (value !== was) changed.push({ key: x.key, value });
    });
    if (!changed.length && !reset.length) { toast("Nothing to save: no text was changed."); return; }
    try { await busy(save, () => savePageContent(changed, reset)); toast(`${page} saved. The website shows the new text now.`); reload(); }
    catch (err) { toast(err.message, "err"); }
  } },
    body,
    h("div", { class: "row end" },
      h("button", { type: "button", class: "ghost", onclick: async () => {
        if (!await confirmDialog({ title: `Put back all original text on ${page}?`, text: "Every text on this page goes back to its original wording. Your changes on this page are removed.", ok: "Put back originals", danger: true })) return;
        try { await savePageContent([], items.map((x) => x.key)); toast(`${page} is back to its original text.`); reload(); } catch (err) { toast(err.message, "err"); }
      } }, "Put back all originals"),
      h("div", { class: "grow" }), save));
  return f;
}

export default async () => {
  const wrap = h("div");
  let open = pages[0];
  async function load() {
    let rows;
    try { rows = await getPageContent(); }
    catch (e) {
      wrap.replaceChildren(msg("err", e.code === "PGRST205" ? "The page text table does not exist yet. Run supabase/migrations/20250116000000_page_content.sql in the Supabase SQL Editor." : e.message));
      return;
    }
    const saved = Object.fromEntries(rows.map((r) => [r.key, r]));
    wrap.replaceChildren(
      h("p", { class: "mut" }, "The headings and paragraphs of the website pages. Pick a page, change the text and press “Save changes”. A text you have not changed keeps its original wording. Changed text is shown as typed in both English and Hindi."),
      ...pages.map((page) => {
        const keys = pageTexts.filter((x) => x.page === page).map((x) => x.key);
        const mine = keys.map((k) => saved[k]).filter(Boolean);
        const last = mine.map((r) => r.updated_at).sort().pop();
        const box = h("details", { open: page === open, ontoggle: (ev) => { if (ev.target.open) open = page; } },
          h("summary", null, h("b", null, page), " ", h("span", { class: "mut" }, `${keys.length} texts · ${mine.length ? `${mine.length} changed, last on ${fmtDateTime(last)}` : "all original"}`)),
          h("p", { class: "mut" }, h("a", { href: PATHS[page] || "/", target: "_blank", rel: "noopener" }, "View this page on the website ↗")),
          pageForm(page, saved, load));
        return panel(null, box);
      }));
  }
  await load();
  return wrap;
};
