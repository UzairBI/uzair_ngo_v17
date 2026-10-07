import { getEvents, getFileEvents, createEvent, updateEvent, deleteEvent, uploadEventImage, deleteEventImage, eventImageUrl } from "./data.js";
import { h, fmtDate, field, modal, tag, dataTable, confirmDialog, toast, busy, validate, rules } from "./ui.js";

function form(e, reload) {
  e = e || { images: [] };
  const imgs = h("div", { class: "thumbs" });
  // The main button keeps an event as it is (a new event is published). The second one switches: draft <-> published.
  // A draft is saved in the admin panel only; the website shows it once it is published.
  const live = e.id ? !!e.published : true;
  let publish = live; // what this save does
  const save = h("button", { type: "submit" }, !e.id ? "Publish event" : live ? "Save changes" : "Save draft");
  const other = h("button", { type: "button", class: "ghost", onclick: () => { publish = !live; f.requestSubmit(); } }, !e.id ? "Save as draft" : live ? "Move to drafts" : "Publish event");
  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    const published = publish, btn = published === live ? save : other; publish = live;
    if (!validate(f, { title: rules.required("Event name", 160), event_date: (v) => (!v ? "Date is required" : null), event_time: rules.max("Time", 60), place: rules.max("Place", 200), description: rules.max("Description", 3000) })) return;
    const b = Object.fromEntries(new FormData(f)); b.published = published;
    try {
      const saved = await busy(btn, () => (e.id ? updateEvent(e.id, b) : createEvent(b)));
      close(); toast(!e.id ? (published ? "Event published. You can add images now." : "Draft saved. You can add images now, then publish it.")
        : published === live ? (live ? "Event saved." : "Draft saved. It is not on the website until you publish it.")
        : published ? "Event published. It now shows on the website Events page." : "Event moved to drafts. It is no longer on the website.");
      reload(); if (!e.id) form(saved, reload); // after creating, reopen so images can be added
    } catch (err) { toast(err.message, "err"); }
  } },
    h("div", { class: "grid2" }, field("Event name", h("input", { name: "title", required: true, value: e.title || "" })), field("Date (today or later = Upcoming, earlier = Past events)", h("input", { name: "event_date", type: "date", required: true, value: e.event_date || "" })),
      field("Time (e.g. 10:00 AM - 2:00 PM)", h("input", { name: "event_time", value: e.event_time || "" })), field("Place", h("input", { name: "place", value: e.place || "" }))),
    field("Description", h("textarea", { name: "description", rows: "4" }, e.description || "")),
    h("p", { class: "mut" }, !e.id ? "Not ready yet? Save it as a draft: it stays in the admin panel only until you publish it."
      : live ? "This event is published: it is on the website Events page." : "This event is a draft: it is not on the website until you publish it."),
    h("div", { class: "row end" }, h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), other, save));
  const draw = (list) => imgs.replaceChildren(...list.map((img) => h("div", null, h("img", { src: eventImageUrl(img.storage_path), alt: "" }),
    h("button", { class: "danger sm", type: "button", onclick: async () => {
      try { await deleteEventImage(img); e.images = e.images.filter((x) => x.id !== img.id); draw(e.images); reload(); }
      catch (err) { toast(err.message, "err"); }
    } }, "Remove"))));
  const picker = h("input", { type: "file", accept: ".jpg,.jpeg,.png,.webp", multiple: true, onchange: async () => {
    for (const file of picker.files) {
      try { const img = await uploadEventImage(e.id, file); e.images = [...e.images, img]; draw(e.images); }
      catch (err) { toast(err.message, "err"); break; }
    }
    picker.value = ""; reload();
  } });
  const del = e.id && h("button", { class: "danger", type: "button", onclick: async () => {
    if (!await confirmDialog({ title: "Delete event?", text: "This event and its images will be deleted. This cannot be undone.", ok: "Delete event", danger: true })) return;
    try { await deleteEvent(e.id); close(); toast("Event deleted."); reload(); } catch (err) { toast(err.message, "err"); }
  } }, "Delete event");
  const body = h("div", null, f, e.id ? h("div", null, h("h2", null, "Images (JPG/PNG/WebP, up to 6)"), imgs, field("Add image", picker), del) : h("p", { class: "mut" }, "Images can be added right after the event is created."));
  const close = modal(!e.id ? "New event" : live ? "Edit event" : "Edit draft", body); draw(e.images);
}

/** An event from the website file (public/data/live.json): shown as it is, with a button to copy it into a real, editable event. */
function fileEvent(e, reload) {
  const close = modal("Sample event from the website file", h("div", null,
    h("p", { class: "mut" }, e.sample
      ? "This event is written in the website file public/data/live.json and marked as a sample: it shows on the development website only and is hidden on the live website. It cannot be edited here."
      : "This event is written in the website file public/data/live.json, not in the admin panel. It shows on the website and cannot be edited here."),
    h("h2", null, e.title),
    h("p", null, [fmtDate(e.event_date), e.event_time, e.place].filter(Boolean).join(" · ")),
    e.description ? h("p", null, e.description) : null,
    e.fileImages.length ? h("div", { class: "thumbs" }, e.fileImages.map((src) => h("div", null, h("img", { src, alt: "" })))) : null,
    h("div", { class: "row end" },
      h("button", { type: "button", class: "ghost", onclick: () => close() }, "Close"),
      h("button", { type: "button", onclick: () => { close(); form({ title: e.title.replace(/\s*\(sample\)\s*$/i, ""), event_date: e.event_date, event_time: e.event_time, place: e.place, description: e.description, images: [] }, reload); } }, "Copy into a real event"))));
}

export default async () => {
  const wrap = h("div"), today = new Date().toISOString().slice(0, 10);
  const list = dataTable({
    columns: [
      { label: "Date", cell: (r) => fmtDate(r.event_date), sort: (r) => r.event_date },
      { label: "Event", cell: (r) => h("div", null, h("b", null, r.title), r.event_time ? h("div", { class: "mut" }, r.event_time) : null), sort: (r) => r.title.toLowerCase() },
      { label: "Place", cell: (r) => r.place || "—", sort: (r) => (r.place || "").toLowerCase() },
      { label: "Images", cell: (r) => (r.file ? r.fileImages : r.images).length, sort: (r) => (r.file ? r.fileImages : r.images).length, cls: "num" },
      { label: "When", cell: (r) => tag(r.event_date >= today ? "active" : "cancelled", r.event_date >= today ? "Upcoming" : "Past"), sort: (r) => (r.event_date >= today ? 0 : 1) },
      { label: "Status", cell: (r) => (r.file ? tag(r.sample ? "pending" : "active", r.sample ? "Sample (hidden on live site)" : "Website file") : tag(r.published ? "active" : "pending", r.published ? "Published" : "Draft")), sort: (r) => (r.file ? 2 : r.published ? 0 : 1) }],
    search: (r) => [r.title, r.place, r.description, r.event_time].join(" "), searchLabel: "Search events",
    filters: [
      { label: "When", options: [["upcoming", "Upcoming"], ["past", "Past"]], test: (r, v) => (v === "upcoming") === (r.event_date >= today) },
      { label: "Status", options: [["published", "Published"], ["draft", "Draft"], ["file", "Sample / website file"]], test: (r, v) => (v === "file" ? !!r.file : !r.file && (v === "published") === !!r.published) }],
    date: { label: "Date", get: (r) => r.event_date }, sort: { i: 0, dir: "desc" }, onRow: (r) => (r.file ? fileEvent(r, load) : form(r, load)),
    summary: (rows) => h("p", { class: "mut" }, `${rows.length} event(s) · ${rows.filter((r) => !r.file && !r.published).length} draft(s)`),
    empty: "No events yet. Published events appear on the website Events page.",
    tools: [h("button", { onclick: () => form(null, load) }, "+ New event")]
  });
  async function load() { list.loading(); try { const [rows, fromFile] = await Promise.all([getEvents(), getFileEvents()]); list.set([...rows, ...fromFile]); } catch (e) { list.error(e.message); } }
  wrap.append(h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Events"), h("p", { class: "mut" }, "Click an event to edit it, add images or publish a draft. Drafts are not on the website. Events marked “Sample” come from the website file and can be copied into a real event."))), list.el);
  await load(); return wrap;
};
