import { getVideos, createVideo, updateVideo, deleteVideo } from "./data.js";
import { h, fmtDate, field, modal, tag, dataTable, confirmDialog, toast, busy, validate, rules } from "./ui.js";
import photosPane from "./photos.js";

/** The 11-character video id from any YouTube link (watch, youtu.be, shorts, embed, live) or the id itself. Null when it is not one. */
export function youtubeId(input) {
  const s = String(input || "").trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  let u;
  try { u = new URL(/^https?:\/\//i.test(s) ? s : "https://" + s); } catch { return null; }
  const host = u.hostname.replace(/^(www|m|music)\./, "");
  let id = null;
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
    id = m ? m[1] : u.searchParams.get("v");
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}
const thumb = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const link = (id) => `https://www.youtube.com/watch?v=${id}`;

function form(v, reload) {
  v = v || {};
  const save = h("button", { type: "submit" }, v.id ? "Save changes" : "Add video");
  const preview = h("div", { class: "thumbs" });
  const url = h("input", { name: "url", required: true, placeholder: "https://www.youtube.com/watch?v=...", value: v.youtube_id ? link(v.youtube_id) : "", oninput: () => show() });
  const show = () => { const id = youtubeId(url.value); preview.replaceChildren(id ? h("div", null, h("img", { src: thumb(id), alt: "Video preview" })) : ""); };
  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    if (!validate(f, { url: (x) => (!x ? "YouTube link is required" : youtubeId(x) ? null : "This does not look like a YouTube video link"), title: rules.max("Title", 160), description: rules.max("Description", 600) })) return;
    const b = { youtube_id: youtubeId(url.value), title: f.title.value.trim(), description: f.description.value.trim(), published: f.published.checked };
    try {
      await busy(save, () => (v.id ? updateVideo(v.id, b) : createVideo(b)));
      close(); toast(v.id ? "Video saved." : "Video added. It now shows after the earlier videos on the website."); reload();
    } catch (err) { toast(err.message, "err"); }
  } },
    field("YouTube link", url), preview,
    field("Title (shown under the video; optional)", h("input", { name: "title", maxlength: "160", value: v.title || "" })),
    field("Description (shown under the title; optional, up to 600 characters)", h("textarea", { name: "description", rows: "4", maxlength: "600" }, v.description || "")),
    h("label", { class: "chk" }, h("input", { type: "checkbox", name: "published", checked: v.id ? !!v.published : true }), "Published (visible on the website Video Gallery)"),
    h("div", { class: "row end" },
      v.id && h("button", { class: "danger", type: "button", onclick: async () => {
        if (!await confirmDialog({ title: "Remove video?", text: "It will be removed from the website Video Gallery. The video itself stays on YouTube.", ok: "Remove video", danger: true })) return;
        try { await deleteVideo(v.id); close(); toast("Video removed."); reload(); } catch (err) { toast(err.message, "err"); }
      } }, "Remove video"),
      h("div", { class: "grow" }), h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), save));
  const close = modal(v.id ? "Edit video" : "Add video", f); show();
}

/** The "Videos" tab of the Media & Gallery page. `onCount(n)` is told how many videos there are. */
function videosPane(onCount) {
  const list = dataTable({
    columns: [
      { label: "Order", cell: (r) => r.n, sort: (r) => r.n, cls: "num" },
      { label: "Video", cell: (r) => h("div", { class: "thumbs" }, h("div", null, h("img", { src: thumb(r.youtube_id), alt: "" }))) },
      { label: "Title", cell: (r) => h("div", null, h("b", null, r.title || "Untitled"), r.description ? h("div", { class: "mut" }, r.description.length > 110 ? r.description.slice(0, 110) + "…" : r.description) : null, h("div", { class: "mut" }, h("a", { href: link(r.youtube_id), target: "_blank", rel: "noopener" }, "Open on YouTube ↗"))), sort: (r) => (r.title || "").toLowerCase() },
      { label: "Added", cell: (r) => fmtDate(r.created_at), sort: (r) => r.created_at },
      { label: "Status", cell: (r) => tag(r.published ? "active" : "pending", r.published ? "Published" : "Hidden"), sort: (r) => (r.published ? 0 : 1) }],
    search: (r) => [r.title, r.description, r.youtube_id].join(" "), searchLabel: "Search videos",
    filters: [{ label: "Status", options: [["published", "Published"], ["hidden", "Hidden"]], test: (r, x) => (x === "published") === !!r.published }],
    sort: { i: 0, dir: "asc" }, onRow: (r) => form(r, load),
    empty: "No videos yet. Add a YouTube link and it appears in the website Video Gallery.",
    tools: [h("button", { onclick: () => form(null, load) }, "+ Add video")]
  });
  async function load() {
    list.loading();
    try { const rows = await getVideos(); list.set(rows.map((r, i) => ({ ...r, n: i + 1 }))); onCount?.(rows.length); }
    catch (e) { list.error(e.code === "PGRST205" ? "The video table does not exist yet. Run supabase/migrations/20250106000000_gallery_videos.sql in the Supabase SQL Editor." : e.message); }
  }
  load();
  return h("div", null,
    h("p", { class: "mut" }, "YouTube videos shown on the website under Media & Gallery. They appear left to right in this order; a new video goes after the last one. Click a video to edit or remove it."),
    h("p", { class: "mut" }, "With two or more published videos the website shows them as a tile grid like the photo gallery: video no. 1 is the large tile, and a tile opens the video with its title and description."),
    list.el);
}

// Media & Gallery: two tabs, the videos and the photos of the website's Media & Gallery page.
export default async () => {
  const count = (k, n) => (tabs.querySelector(`[data-t=${k}] .count`).textContent = n);
  const body = h("div");
  const tabs = h("div", { class: "tabs", role: "tablist" }, [["videos", "Videos"], ["photos", "Photos"]].map(([k, l]) =>
    h("button", { type: "button", role: "tab", "data-t": k, class: "tab", onclick: () => show(k) }, l, " ", h("span", { class: "count" }, "…"))));
  const panes = { videos: videosPane((n) => count("videos", n)), photos: photosPane((n) => count("photos", n)) };
  const show = (k) => { tabs.querySelectorAll(".tab").forEach((t) => { const on = t.dataset.t === k; t.classList.toggle("on", on); t.setAttribute("aria-selected", String(on)); }); body.replaceChildren(panes[k]); };
  show("videos");
  return h("div", null, h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Media & Gallery"),
    h("p", { class: "mut" }, "The videos and photos shown on the website Media & Gallery page."))), tabs, body);
};
