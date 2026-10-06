import { getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, uploadBlogImage, removeBlogImages } from "./data.js";
import { h, fmtDate, field, modal, tag, dataTable, confirmDialog, toast, busy, validate, rules } from "./ui.js";

// Same groups as the website offers first (src/data/blog.ts). Another group can be typed in.
const CATEGORIES = ["Education", "Health", "Women Empowerment", "Environment", "Social Relief", "Volunteers", "Stories"];
const MAX_MB = 8;
const imageProblem = (file) => (!/^image\/(jpeg|png|webp)$/.test(file.type) ? "Please choose a JPG, PNG or WebP photo." : file.size > MAX_MB * 1024 * 1024 ? `“${file.name}” is larger than ${MAX_MB} MB.` : null);
/** "A Mat, a Slate…" -> "a-mat-a-slate": the last part of the post's web address. */
const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/, "");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/** One photo of the post: shows the current one with a Remove button, and a picker to add or replace it. */
function photoSlot(label, url) {
  const picker = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp" });
  const current = h("div", { class: "thumbs" });
  let cleared = false; // "Remove" pressed: saved without this photo
  const show = () => current.replaceChildren(...(url && !cleared
    ? [h("div", null, h("a", { href: url, target: "_blank", rel: "noopener" }, h("img", { src: url, alt: `Current ${label.toLowerCase()}` })),
      h("button", { type: "button", class: "danger sm", onclick: () => { cleared = true; picker.value = ""; show(); } }, "Remove"))]
    : [h("p", { class: "mut" }, cleared ? "This photo will be removed when you save." : "No photo yet.")]));
  show();
  return { file: () => picker.files[0], cleared: () => cleared,
    el: [h("h2", null, label), current, field(`Upload a photo (JPG, PNG or WebP, up to ${MAX_MB} MB)${url ? ": replaces the current one" : ""}`, picker)] };
}

function form(r, reload) {
  r = r || {};
  const save = h("button", { type: "submit" }, r.id ? "Save changes" : "Publish post");
  const cover = photoSlot("Cover photo", r.cover_url), photo = photoSlot("Second photo", r.photo_url);
  const slug = h("input", { name: "slug", required: true, maxlength: "120", placeholder: "a-short-name-for-the-post", value: r.slug || "", oninput: () => { slugTouched = true; } });
  let slugTouched = !!r.id; // a new post takes its address from the title until the address is typed by hand
  const title = h("input", { name: "title", required: true, maxlength: "200", placeholder: "e.g. A Mat, a Slate and a Second Chance", value: r.title || "", oninput: () => { if (!slugTouched) slug.value = slugify(title.value); } });

  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    slug.value = slugify(slug.value);
    if (!validate(f, { title: rules.required("Title", 200), slug: rules.required("Web address", 120), category: rules.required("Group", 60), author: rules.max("Author", 80),
      published_on: rules.required("Date"), excerpt: rules.max("Summary", 400), body: rules.required("Post", 20000), photo_caption: rules.max("Caption", 300) })) return;
    const problem = [cover, photo].map((s) => s.file() && imageProblem(s.file())).find(Boolean);
    if (problem) return toast(problem, "err");
    const b = { title: f.title.value.trim(), slug: slug.value, category: f.category.value.trim(), author: f.author.value.trim(), published_on: f.published_on.value,
      excerpt: f.excerpt.value.trim(), body: f.body.value.trim(), photo_caption: f.photo_caption.value.trim(), published: f.published.checked };
    const uploading = !!(cover.file() || photo.file());
    try {
      await busy(save, async () => {
        const fresh = [], stale = []; // files uploaded by this save / files no longer used after it
        try {
          for (const [slot, key] of [[cover, "cover"], [photo, "photo"]]) {
            if (slot.file()) { const up = await uploadBlogImage(slot.file()); fresh.push(up.path); b[`${key}_url`] = up.url; b[`${key}_path`] = up.path; stale.push(r[`${key}_path`]); }
            else if (slot.cleared()) { b[`${key}_url`] = null; b[`${key}_path`] = null; stale.push(r[`${key}_path`]); }
          }
          r.id ? await updateBlogPost(r.id, b) : await createBlogPost(b);
        } catch (err) { await removeBlogImages(fresh); throw err; } // do not leave orphan uploads behind
        await removeBlogImages(stale);
      }, uploading ? "Uploading…" : "Saving…");
      close(); toast(r.id ? "Post saved." : b.published ? "Post published. It now shows on the website Blog page." : "Post saved as hidden."); reload();
    } catch (err) { toast(err.message, "err"); }
  } },
    field("Title *", title),
    field("Web address * (the post opens at /blog/ followed by this; small letters, numbers and hyphens)", slug),
    h("div", { class: "grid2" },
      field("Group * (choose one, or type your own)", h("input", { name: "category", required: true, maxlength: "60", list: "blog-cats", value: r.category || CATEGORIES[0] })),
      field("Date * (shown on the post; the newest comes first)", h("input", { name: "published_on", type: "date", required: true, value: r.published_on || today() }))),
    field("Author", h("input", { name: "author", maxlength: "80", placeholder: "e.g. Sahara Team", value: r.author ?? "Sahara Team" })),
    h("datalist", { id: "blog-cats" }, CATEGORIES.map((c) => h("option", { value: c }))),
    field("Summary (one or two sentences shown on the Blog page and at the top of the post; up to 400 characters)", h("textarea", { name: "excerpt", rows: "3", maxlength: "400" }, r.excerpt || "")),
    field("Post * (leave an empty line between paragraphs)", h("textarea", { name: "body", rows: "14", maxlength: "20000", required: true }, r.body || "")),
    h("p", { class: "mut" }, "Start a line with ## to make it a heading, or with > to show it as a highlighted quote."),
    cover.el, photo.el,
    field("Caption of the second photo (shown under it inside the post; up to 300 characters)", h("input", { name: "photo_caption", maxlength: "300", value: r.photo_caption || "" })),
    h("label", { class: "chk" }, h("input", { type: "checkbox", name: "published", checked: r.id ? !!r.published : true }), "Published (visible on the website)"),
    h("div", { class: "row end" },
      r.id && h("button", { class: "danger", type: "button", onclick: async () => {
        if (!await confirmDialog({ title: "Remove post?", text: `“${r.title}” and its photos will be removed from the website. This cannot be undone.`, ok: "Remove", danger: true })) return;
        try { await deleteBlogPost(r); close(); toast("Post removed."); reload(); } catch (err) { toast(err.message, "err"); }
      } }, "Remove post"),
      r.id && r.published && h("a", { class: "btn ghost", href: `/blog/${r.slug}`, target: "_blank", rel: "noopener" }, "View on website ↗"),
      h("div", { class: "grow" }), h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), save));
  const close = modal(r.id ? "Edit post" : "New post", f);
}

export default async () => {
  const wrap = h("div");
  const list = dataTable({
    columns: [
      { label: "Cover", cell: (r) => (r.cover_url ? h("div", { class: "thumbs" }, h("div", null, h("img", { src: r.cover_url, alt: "", loading: "lazy" }))) : h("span", { class: "mut" }, "None")) },
      { label: "Post", cell: (r) => h("div", null, h("b", null, r.title), r.excerpt ? h("div", { class: "mut" }, r.excerpt.length > 120 ? r.excerpt.slice(0, 120) + "…" : r.excerpt) : null), sort: (r) => (r.title || "").toLowerCase() },
      { label: "Group", cell: (r) => r.category, sort: (r) => r.category },
      { label: "Author", cell: (r) => r.author || h("span", { class: "mut" }, "Not set"), sort: (r) => (r.author || "").toLowerCase() },
      { label: "Date", cell: (r) => fmtDate(r.published_on), sort: (r) => r.published_on },
      { label: "Status", cell: (r) => tag(r.published ? "active" : "pending", r.published ? "Published" : "Hidden"), sort: (r) => (r.published ? 0 : 1) }],
    search: (r) => [r.title, r.excerpt, r.category, r.author].join(" "), searchLabel: "Search posts",
    filters: [
      { label: "Group", options: (rs) => [...new Set(rs.map((r) => r.category).filter(Boolean))].sort().map((c) => [c, c]), test: (r, x) => r.category === x },
      { label: "Status", options: [["published", "Published"], ["hidden", "Hidden"]], test: (r, x) => (x === "published") === !!r.published }],
    sort: { i: 4, dir: "desc" }, pageSize: 25, onRow: (r) => form(r, load),
    summary: (rows) => h("p", { class: "mut" }, `${rows.length} post(s) · ${rows.filter((r) => r.published).length} published`),
    empty: "No posts yet. Write one and it appears on the website under Blog.",
    tools: [h("button", { onclick: () => form(null, load) }, "+ New post")]
  });
  async function load() {
    list.loading();
    try { list.set(await getBlogPosts()); }
    catch (e) { list.error(e.code === "PGRST205" ? "The blog table does not exist yet. Run supabase/migrations/20250121000000_blog_posts.sql in the Supabase SQL Editor." : e.message); }
  }
  wrap.append(h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Blog"),
    h("p", { class: "mut" }, "Posts shown on the website Blog page, newest date first: the newest one is the large story at the top. Click a row to edit it, change its photos, hide it or remove it."))), list.el);
  await load(); return wrap;
};
