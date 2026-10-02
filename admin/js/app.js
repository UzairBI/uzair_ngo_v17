import { supabase, AuthError, signIn, signOut, getCurrentAdmin, onAuthStateChange } from "./supabase.js";
import { h, field, msg, run, spinner } from "./ui.js";
import dashboard from "./dashboard.js";
import reports from "./reports.js";
import donations from "./donations.js";
import requests from "./requests.js";
import events from "./events.js";
import projects from "./projects.js";
import volunteers from "./volunteers.js";
import broadcast from "./broadcast.js";
import admins from "./admins.js";

// [label, page, badge key from Supabase dashboard query]
const pages = {
  dashboard: ["Dashboard", dashboard], reports: ["Analytics", reports], projects: ["Projects", projects],
  donations: ["Donations", donations], volunteers: ["Volunteers", volunteers],
  requests: ["Document requests", requests], events: ["Events", events], broadcast: ["Broadcast", broadcast],
  admins: ["Admins & activity", admins]
};
const app = document.getElementById("app");
let signedIn = false;

function loginView() {
  signedIn = false; window.onhashchange = null;
  const box = h("div"), email = h("input", { type: "email", autocomplete: "email", required: true, placeholder: "Email" }), pw = h("input", { type: "password", autocomplete: "current-password", required: true });
  const btn = h("button", { type: "submit" }, "Sign in");
  const form = h("form", { class: "panel", onsubmit: async (e) => {
    e.preventDefault(); btn.disabled = true; btn.textContent = "Signing in…";
    const ok = await run(box, () => signIn(email.value, pw.value));
    btn.disabled = false; btn.textContent = "Sign in"; pw.value = ""; if (ok) start();
  } }, h("h1", null, "Admin sign in"), box, field("Email", email), field("Password", pw), btn, h("p", { class: "mut" }, "Powered by Supabase Auth"));
  app.replaceChildren(h("div", { class: "login" }, form));
  email.focus();
}

// Listen for auth state changes globally
onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    signedIn = false;
    loginView();
  } else if (event === "SIGNED_IN" && !signedIn) {
    start();
  }
});

async function start() {
  let me;
  try { me = await getCurrentAdmin(); } catch { return loginView(); }
  signedIn = true;
  const main = h("main", { id: "main", tabindex: "-1" });
  const links = Object.entries(pages).map(([k, [label]]) => h("a", { href: "#/" + k, "data-k": k }, h("span", null, label), h("span", { class: "badge", hidden: true })));
  const menu = h("div", { class: "side-links" }, links,
    h("a", { href: "/", target: "_blank", rel: "noopener" }, "View website ↗"),
    h("button", { class: "ghost", onclick: async () => { await signOut().catch(() => {}); loginView(); } }, `Sign out (${me.email})`));
  const toggle = h("button", { class: "menu-btn ghost sm", "aria-expanded": "false", "aria-controls": "side-links", onclick: () => {
    const open = nav.classList.toggle("open"); toggle.setAttribute("aria-expanded", String(open));
  } }, "Menu");
  menu.id = "side-links";
  const nav = h("nav", { class: "side", "aria-label": "Admin" }, h("div", { class: "side-top" }, h("a", { href: "#/dashboard", class: "brand" }, h("img", { src: "/assets/images/logo.png", alt: "", onerror: (e) => e.target.remove() }), h("b", null, "NGO Admin")), toggle), menu,
    h("div", { class: "side-card" }, h("img", { src: "/assets/images/field-9.jpg", alt: "", onerror: (e) => e.target.remove() }), h("strong", null, "Creating Brighter Futures"), h("span", null, "Your work helps empower communities.")));
  const crumb = h("span", { class: "crumb" });
  const topbar = h("header", { class: "topbar" }, crumb, h("div", { class: "grow" }), h("div", { class: "who" }, h("span", { class: "avatar", "aria-hidden": "true" }, (me.email || "A")[0].toUpperCase()), h("span", null, h("b", null, me.display_name || me.email), h("small", null, me.role === "admin" ? "Administrator" : me.role === "editor" ? "Editor" : "Viewer"))));
  app.replaceChildren(h("div", { class: "shell" }, nav, h("div", { class: "content" }, topbar, main)));

  // "needs attention" counters next to the menu items - fetch from Supabase
  const badges = async () => {
    try {
      const { data: pendingRequests } = await supabase.from("document_requests").select("id", { count: "exact" }).eq("status", "new");
      const { data: pendingVolunteers } = await supabase.from("volunteers").select("id", { count: "exact" }).eq("status", "pending");
      const { data: pendingDonations } = await supabase.from("donations").select("id", { count: "exact" }).eq("status", "pending");
      const counts = { pendingRequests: pendingRequests?.length || 0, pendingVolunteers: pendingVolunteers?.length || 0, pendingDonations: pendingDonations?.length || 0 };
      links.forEach((a) => {
        let n = 0;
        if (a.dataset.k === "requests") n = counts.pendingRequests;
        if (a.dataset.k === "volunteers") n = counts.pendingVolunteers;
        if (a.dataset.k === "donations") n = counts.pendingDonations;
        const b = a.querySelector(".badge"); b.hidden = !n; b.textContent = n || ""; b.title = n ? `${n} need attention` : "";
      });
    } catch { /* badges are optional */ }
  };
  const route = async () => {
    const key = (location.hash.match(/^#\/(\w+)/) || [])[1];
    const k = pages[key] ? key : "dashboard";
    links.forEach((a) => { const on = a.dataset.k === k; a.classList.toggle("on", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); });
    nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false");
    document.title = `${pages[k][0]} · Admin`; crumb.textContent = pages[k][0];
    main.replaceChildren(spinner());
    try { main.replaceChildren(await pages[k][1]({ me, supabase, go: (p) => (location.hash = "#/" + p), reload: route, badges })); }
    catch (e) { if (e instanceof AuthError) return loginView(); main.replaceChildren(msg("err", e.message), h("button", { class: "ghost", onclick: route }, "Try again")); }
    badges();
  };
  window.onhashchange = route; route();
}

// Check if user is already logged in
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) start();
  else loginView();
});
