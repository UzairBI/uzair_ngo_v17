import { supabase, AuthError, signIn, signOut, getCurrentAdmin, onAuthStateChange } from "./supabase.js";
import { h, field, msg, run, spinner } from "./ui.js";
import dashboard from "./dashboard.js";
import reports from "./reports.js";
import donations from "./donations.js";
import requests from "./requests.js";
import events from "./events.js";
import projects from "./projects.js";
import volunteers from "./volunteers.js";
import newsletter from "./newsletter.js";
import contacts from "./contacts.js";
import videos from "./videos.js";
import annualReports from "./annualreports.js";
import awards from "./awards.js";
import blog from "./blog.js";
import broadcast from "./broadcast.js";
import admins from "./admins.js";
import pageContent from "./pagecontent.js";
import { langSwitch } from "./lang.js";
import { adminPhotoUrl } from "./data.js";

// [label, page, badge key from Supabase dashboard query]
const pages = {
  dashboard: ["Dashboard", dashboard], reports: ["Analytics", reports], projects: ["Projects", projects],
  donations: ["Donations", donations], volunteers: ["Team & Volunteers", volunteers], subscribers: ["Newsletter Subscribers", newsletter], messages: ["Contact messages", contacts],
  requests: ["Document requests", requests], events: ["Events", events], videos: ["Media & Gallery", videos], annualreports: ["Annual Reports", annualReports], awards: ["Awards & Recognition", awards], blog: ["Blog", blog], pagecontent: ["Website Pages", pageContent], broadcast: ["Broadcast", broadcast],
  admins: ["Admins & activity", admins]
};
const app = document.getElementById("app");
let signedIn = false;

function loginView(authError = null) {
  signedIn = false; window.onhashchange = null;
  const box = h("div"), email = h("input", { type: "email", autocomplete: "email", required: true, placeholder: "Email" }), pw = h("input", { type: "password", autocomplete: "current-password", required: true });
  const btn = h("button", { type: "submit" }, "Sign in");
  const form = h("form", { class: "panel", onsubmit: async (e) => {
    e.preventDefault(); btn.disabled = true; btn.textContent = "Signing in…";
    const ok = await run(box, () => signIn(email.value, pw.value));
    btn.disabled = false; btn.textContent = "Sign in"; pw.value = ""; if (ok) start();
  } }, h("h1", null, "Admin sign in"), authError ? msg("err", authError) : box, field("Email", email), field("Password", pw), btn, h("p", { class: "mut" }, "Powered by Supabase Auth"), langSwitch());
  app.replaceChildren(h("div", { class: "login" }, form));
  email.focus();
}

// Listen for auth state changes globally (ignore INITIAL_SESSION to avoid double rendering)
onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    signedIn = false;
    loginView();
  } else if (event === "SIGNED_IN" && !signedIn) {
    // Don't start here yet; wait for getCurrentAdmin to verify it's actually an admin
    // The form submission will call start() after a successful login
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
  const topbar = h("header", { class: "topbar" }, crumb, h("div", { class: "grow" }), langSwitch(), h("div", { class: "who" }, (me.photo_path ? h("img", { class: "avatar", alt: "", src: adminPhotoUrl(me.photo_path), onerror: (e) => e.target.replaceWith(h("span", { class: "avatar", "aria-hidden": "true" }, (me.email || "A")[0].toUpperCase())) }) : h("span", { class: "avatar", "aria-hidden": "true" }, (me.email || "A")[0].toUpperCase())), h("span", null, h("b", null, me.display_name || me.email), h("small", null, me.role === "admin" ? "Administrator" : me.role === "editor" ? "Editor" : "Viewer"))));
  app.replaceChildren(h("div", { class: "shell" }, nav, h("div", { class: "content" }, topbar, main)));

  // "needs attention" counters next to the menu items - fetch from Supabase
  const badges = async () => {
    try {
      const [reqs, vols, dons, msgs] = await Promise.all([
        supabase.from("document_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("volunteers").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("donations").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("form_submissions").select("id", { count: "exact", head: true }).eq("kind", "contact").eq("status", "new")
      ]);
      const counts = {
        pendingRequests: reqs.count || 0,
        pendingVolunteers: vols.count || 0,
        pendingDonations: dons.count || 0,
        newMessages: msgs.count || 0
      };
      links.forEach((a) => {
        let n = 0;
        if (a.dataset.k === "requests") n = counts.pendingRequests;
        if (a.dataset.k === "volunteers") n = counts.pendingVolunteers;
        if (a.dataset.k === "donations") n = counts.pendingDonations;
        if (a.dataset.k === "messages") n = counts.newMessages;
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
