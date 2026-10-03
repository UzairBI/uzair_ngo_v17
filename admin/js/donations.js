import { getDonations, createDonation, updateDonation } from "./data.js";
import { h, inr, tag, fmtDate, field, modal, run, msg, dataTable, toast, busy, validate, rules } from "./ui.js";

const METHODS = ["Cash", "Cheque", "Bank transfer / NEFT", "UPI (direct)", "Demand draft", "Other"];
const sel = (name, opts, val) => h("select", { name }, opts.map((o) => h("option", { value: o, selected: o === val }, o)));
const inp = (name, extra = {}) => h("input", { name, ...extra });
const today = () => new Date().toISOString().slice(0, 10);

function printReceipt(d, type) {
  const w = window.open("", "_blank", "noopener,width=720,height=900");
  if (!w) return toast("Allow pop-ups to print receipts.", "err");
  const title = type === "tax" ? "80G Tax Certificate" : "Donation Receipt";
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title} ${d.receipt_no}</title>
    <style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;color:#111}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:16px}td{padding:6px 0;border-bottom:1px solid #eee}td:first-child{color:#666;width:40%}</style></head>
    <body><h1>Sahara Jan Kalyan Samiti</h1><h2>${title}</h2>
    <table>
      <tr><td>Receipt no.</td><td>${d.receipt_no}</td></tr>
      <tr><td>Date</td><td>${fmtDate(d.donated_at)}</td></tr>
      <tr><td>Donor name</td><td>${d.donor_name || "—"}</td></tr>
      <tr><td>Amount</td><td>${inr(d.amount)}</td></tr>
      <tr><td>Mode</td><td>${d.mode}${d.method ? " · " + d.method : ""}</td></tr>
      ${d.donor_pan ? `<tr><td>PAN</td><td>${d.donor_pan}</td></tr>` : ""}
      ${d.donor_address ? `<tr><td>Address</td><td>${d.donor_address}</td></tr>` : ""}
      ${d.purpose ? `<tr><td>Purpose</td><td>${d.purpose}</td></tr>` : ""}
    </table>
    <p style="margin-top:32px;color:#666;font-size:13px">This is a system-generated ${title.toLowerCase()}.</p>
    <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

/** Record (or edit) a donation. Used by the dashboard quick action too. */
export function openDonationForm(done, existing) {
  const e = existing || {}, box = h("div");
  const save = h("button", { type: "submit" }, e.id ? "Save changes" : "Record donation");
  const f = h("form", { novalidate: true, onsubmit: async (ev) => {
    ev.preventDefault();
    if (!validate(f, {
      donor_name: rules.required("Donor name", 120),
      amount: (v) => (!v ? "Amount is required" : !(Number(v) > 0) ? "Amount must be more than 0" : null),
      donated_at: (v) => (!/^\d{4}-\d{2}-\d{2}$/.test(v) ? "Choose the donation date" : null),
      donor_email: rules.email, donor_phone: rules.phone,
      donor_pan: (v) => (v && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(v) ? "PAN must look like ABCDE1234F" : null)
    })) return;
    const body = Object.fromEntries(new FormData(f));
    const ok = await busy(save, () => run(box, () => (e.id ? updateDonation(e.id, { ...body, status: e.status || "success" }) : createDonation({ ...body, status: "success" }))));
    if (ok) { close(); toast(e.id ? "Donation updated." : "Donation recorded."); done?.(); }
  } },
    box, h("div", { class: "grid2" },
      field("Donor name", inp("donor_name", { value: e.donor_name || "", required: true })), field("Amount (₹)", inp("amount", { type: "number", min: "1", step: "0.01", value: e.amount || "", required: true })),
      field("Date", inp("donated_at", { type: "date", value: e.donated_at || today(), required: true })), field("Payment method", sel("method", e.mode === "online" ? [e.method || "Online", ...METHODS] : METHODS, e.method || "Cash")),
      field("Email (for receipts)", inp("donor_email", { type: "email", value: e.donor_email || "" })), field("Phone", inp("donor_phone", { value: e.donor_phone || "" })),
      field("PAN (needed for 80G)", inp("donor_pan", { value: e.donor_pan || "", maxlength: "10", placeholder: "ABCDE1234F" })), field("Cheque / UTR / reference no.", inp("reference", { value: e.reference || "" })),
      field("Purpose / campaign", inp("purpose", { value: e.purpose || "" })), field("Address", inp("donor_address", { value: e.donor_address || "" }))),
    inp("mode", { type: "hidden", value: e.mode || "offline" }), field("Notes", h("textarea", { name: "notes", rows: "2" }, e.notes || "")),
    h("div", { class: "row end" }, h("button", { type: "button", class: "ghost", onclick: () => close() }, "Cancel"), save));
  const close = modal(e.id ? "Edit donation" : "Record offline donation", f);
}

function detail(d, reload) {
  const box = h("div"), el = h("div");
  const status = h("select", { onchange: async () => { if (await run(box, () => updateDonation(d.id, { status: status.value }), "Status updated.")) reload(); } },
    ["pending", "success", "failed", "refunded", "cancelled"].map((s) => h("option", { value: s, selected: s === d.status }, s)));
  el.append(box, ...[
    h("p", null, h("b", null, d.receipt_no), " · ", tag(d.status), " · ", d.mode, " / ", d.method || "-"),
    h("p", null, inr(d.amount), " from ", d.donor_name || "(unknown)", d.donor_email ? ` <${d.donor_email}>` : "", " on ", fmtDate(d.donated_at)),
    d.gateway_payment_id ? h("p", { class: "mut" }, `Gateway: ${d.gateway} · ${d.gateway_payment_id} · gateway status: ${d.gateway_status}${d.gateway_error ? " · " + d.gateway_error : ""}`) : null,
    h("div", { class: "row" }, "Status:", status),
    h("h2", null, "Receipts & certificates"),
    !d.donor_pan ? msg("info", "Donor PAN is empty. Add it (Edit) to include it on an 80G certificate.") : null,
    h("div", { class: "row" },
      h("button", { class: "ghost", onclick: () => printReceipt(d, "receipt") }, "Print receipt"),
      h("button", { class: "ghost", onclick: () => printReceipt(d, "tax") }, "Print 80G certificate")),
    h("div", { class: "row" }, h("button", { class: "ghost", onclick: () => { close(); openDonationForm(reload, d); } }, "Edit details"))
  ].filter(Boolean));
  const close = modal("Donation", el);
}

const STATUSES = ["success", "pending", "failed", "refunded", "cancelled"];
export default async () => {
  const wrap = h("div");
  const exportCsv = () => {
    const rows = list.rows;
    const lines = [["Date", "Receipt", "Donor", "Email", "Amount", "Mode", "Method", "Purpose", "Status"],
      ...rows.map((r) => [r.donated_at, r.receipt_no, r.donor_name || "", r.donor_email || "", r.amount, r.mode, r.method || "", r.purpose || "", r.status])];
    const csv = lines.map((l) => l.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = h("a", { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: `donations-${today()}.csv` });
    document.body.append(a); a.click(); a.remove();
  };
  const list = dataTable({
    columns: [
      { label: "Date", cell: (r) => fmtDate(r.donated_at), sort: (r) => r.donated_at + String(r.id).padStart(9, "0"), firstDir: "desc" },
      { label: "Receipt", cell: (r) => r.receipt_no, sort: (r) => r.id },
      { label: "Donor", cell: (r) => h("div", null, r.donor_name || "—", r.donor_email ? h("div", { class: "mut" }, r.donor_email) : null), sort: (r) => (r.donor_name || "").toLowerCase() },
      { label: "Amount", cell: (r) => inr(r.amount), sort: (r) => Number(r.amount), cls: "num", firstDir: "desc" },
      { label: "Mode", cell: (r) => `${r.mode}${r.method ? " · " + r.method : ""}`, sort: (r) => r.mode + (r.method || "") },
      { label: "Purpose", cell: (r) => r.purpose || "—", sort: (r) => (r.purpose || "").toLowerCase() },
      { label: "Status", cell: (r) => tag(r.status), sort: (r) => STATUSES.indexOf(r.status) }],
    search: (r) => [r.donor_name, r.donor_email, r.donor_phone, r.reference, r.gateway_payment_id, r.purpose, r.receipt_no].join(" "), searchLabel: "Search name, email, reference, receipt",
    filters: [
      { label: "Status", options: STATUSES.map((x) => [x, x]), test: (r, v) => r.status === v },
      { label: "Mode", options: [["online", "Online"], ["offline", "Offline"]], test: (r, v) => r.mode === v },
      { label: "Method", options: (rs) => [...new Set(rs.map((r) => r.method).filter(Boolean))].sort().map((m) => [m, m]), test: (r, v) => r.method === v }],
    date: { label: "Date", get: (r) => r.donated_at }, sort: { i: 0, dir: "desc" }, onRow: (r) => detail(r, load),
    summary: (rows) => { const ok = rows.filter((r) => r.status === "success" && r.currency === "INR");
      return h("p", { class: "mut" }, `${rows.length} donation record(s) · ${inr(ok.reduce((t, r) => t + Number(r.amount), 0))} raised from ${ok.length} successful`); },
    empty: "No donations yet. Online payments appear automatically; record cheques, cash and bank transfers with “+ Record offline donation”.",
    tools: [h("button", { onclick: () => openDonationForm(load) }, "+ Record offline donation"), h("button", { class: "btn ghost", onclick: exportCsv }, "Export CSV")]
  });
  async function load() { list.loading(); try { list.set(await getDonations()); } catch (e) { list.error(e.message); } }
  wrap.append(h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Donations & finance"), h("p", { class: "mut" }, "Click a row for receipts, tax certificates and status."))), list.el);
  await load(); return wrap;
};
