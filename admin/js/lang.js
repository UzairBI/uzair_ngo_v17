import { startDomTranslate } from "../../src/i18n/domTranslate.ts";
import { h } from "./ui.js";

// Language of the admin panel: English or Hindi. Remembered on this device, separately from the website's own language switch.
const KEY = "admin-lang";
let lang = "en";
try { lang = localStorage.getItem(KEY) === "hi" ? "hi" : "en"; } catch { /* storage blocked: English */ }
const dom = startDomTranslate(() => lang === "hi");
let loaded = false;

/** The Hindi wording is only downloaded the first time Hindi is switched on. */
async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const [admin, site, messages, base] = await Promise.all([import("../../src/i18n/hi.admin.ts"), import("../../src/i18n/hi.site.ts"), import("../../src/i18n/hi.messages.ts"), import("../../src/i18n/hi.ts")]);
    // the admin wording comes last so it wins where the website uses the same English text differently
    dom.add({ ...site.hiSite, ...messages.hiMessages, ...base.hi, ...admin.hiAdmin, ...admin.hiAdminMore });
    dom.addPatterns(admin.hiAdminPatterns);
  } catch { loaded = false; }
}
function apply() {
  document.documentElement.lang = lang;
  dom.refresh();
  if (lang === "hi") load();
  document.querySelectorAll(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
}
apply();

/** The EN / हिंदी switch (shown on the sign-in page and in the top bar). */
export function langSwitch() {
  const btn = (code, text) => h("button", { type: "button", class: "ghost sm", "data-lang": code, "aria-pressed": String(code === lang), onclick: () => {
    lang = code; try { localStorage.setItem(KEY, code); } catch { /* not remembered */ } apply();
  } }, text);
  return h("div", { class: "lang-switch", role: "group", "aria-label": "Language", "data-no-translate": "" }, btn("en", "EN"), btn("hi", "हिंदी"));
}
