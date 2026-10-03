import { getDocumentRequests, getDocumentRequest, updateDocumentRequest, deleteDocumentRequest, getRequestAttachments, uploadRequestAttachment, deleteRequestAttachment, getRequestFileUrl } from "./data.js";
import { h, tag, fmtDate, field, modal, run, msg, dataTable, confirmDialog, toast } from "./ui.js";

const kv = (k, v) => v ? h("p", null, h("b", null, k + ": "), v) : null;

async function detail(row, reload) {
  const r = await getDocumentRequest(row.id), box = h("div"), files = h("div");
  const message = h("textarea", { rows: "9" }, r.admin_message || "");
  const refresh = async () => {
    const atts = await getRequestAttachments(r.id);
    files.replaceChildren(h("ul", { class: "files" }, atts.length ? atts.map((a) => h("li", null,
      h("a", { href: "#", onclick: async (e) => { e.preventDefault(); window.open(await getRequestFileUrl(a.storage_path), "_blank", "noopener"); } }, a.filename),
      h("span", { class: "mut" }, `${Math.round((a.size_bytes || 0) / 1024)} KB`),
      h("button", { class: "danger sm", onclick: async () => { await run(box, () => deleteRequestAttachment(a)); refresh(); } }, "Remove"))) : h("li", { class: "mut" }, "No attachments yet.")));
  };
  const picker = h("input", { type: "file", multiple: true, accept: ".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.zip,.mp3,.m4a,.wav,.ogg", onchange: async () => {
    for (const f of picker.files) { if (!await run(box, () => uploadRequestAttachment(r.id, f))) break; }
    picker.value = ""; refresh();
  } });
  const setStatus = (s, text) => h("button", { class: "ghost", onclick: async () => { if (await run(box, () => updateDocumentRequest(r.id, { status: s, admin_message: message.value }), text)) reload(); } }, text);
  const remove = h("button", { class: "danger", onclick: async () => {
    if (!await confirmDialog({ title: "Delete request?", text: "This document request will be removed permanently.", ok: "Delete", danger: true })) return;
    if (await run(box, () => deleteDocumentRequest(r.id))) { close(); toast("Request deleted."); reload(); }
  } }, "Delete request");
  const body = h("div", null, box,
    h("p", null, tag(r.status), " ", h("span", { class: "mut" }, `${r.reference || ""} · received ${fmtDate(r.created_at)}${r.sent_at ? " · sent " + fmtDate(r.sent_at) : ""}`)),
    kv("Requester", r.name), kv("Organisation", r.organisation), kv("Email", r.email), kv("Phone", r.phone),
    kv("Request", `${r.request_type || ""}: ${r.document_type || ""}${r.financial_year ? " (" + r.financial_year + ")" : ""}`), kv("Purpose", r.purpose), kv("Delivery", r.delivery), kv("Postal address", r.delivery_address), kv("Message from requester", r.message),
    h("h2", null, "Documents to send"), files, field("Add document(s) (PDF, image, audio, Office)", picker),
    msg("info", "Sending email requires a backend (not available on this deployment). Download the documents above and send them yourself, then mark the request as sent."),
    field("Internal note", message),
    h("div", { class: "row" }, setStatus("sent", "Mark as sent"), setStatus("completed", "Mark completed"), r.status !== "new" && setStatus("new", "Back to pending"), remove));
  modal("Document request", body); refresh();
}

export default async () => {
  const wrap = h("div");
  const list = dataTable({
    columns: [
      { label: "Received", cell: (r) => fmtDate(r.created_at), sort: (r) => r.created_at, firstDir: "desc" },
      { label: "Ref", cell: (r) => r.reference, sort: (r) => r.reference || "" },
      { label: "Requester", cell: (r) => h("div", null, r.name || "—", r.organisation ? h("div", { class: "mut" }, r.organisation) : null), sort: (r) => (r.name || "").toLowerCase() },
      { label: "Document", cell: (r) => h("div", null, r.document_type || "—", h("div", { class: "mut" }, [r.request_type, r.financial_year].filter(Boolean).join(" · "))), sort: (r) => r.document_type || "" },
      { label: "Status", cell: (r) => tag(r.status), sort: (r) => ["new", "sent", "completed"].indexOf(r.status) }],
    search: (r) => [r.reference, r.name, r.organisation, r.email, r.phone, r.document_type, r.purpose, r.message].join(" "), searchLabel: "Search ref, name, email, document",
    filters: [
      { label: "Status", value: "new", options: [["new", "Pending"], ["sent", "Sent"], ["completed", "Completed"]], test: (r, v) => r.status === v },
      { label: "Type", options: [["Certificate", "Certificate"], ["Audit report", "Audit report"]], test: (r, v) => r.request_type === v }],
    date: { label: "Received", get: (r) => r.created_at }, sort: { i: 0, dir: "desc" }, onRow: (r) => detail(r, load),
    empty: "No document requests yet. Requests from the website Transparency page arrive here."
  });
  async function load() { list.loading(); try { list.set(await getDocumentRequests()); } catch (e) { list.error(e.message); } }
  wrap.append(h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Certificate / document requests"),
    h("p", { class: "mut" }, "Showing pending requests first. Change the Status filter to see sent and completed ones."))), list.el);
  await load(); return wrap;
};
