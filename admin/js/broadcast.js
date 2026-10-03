import { getBroadcastAudienceCounts, getBroadcastHistory } from "./data.js";
import { h, field, fmtDate, dataTable, msg } from "./ui.js";

export default async () => {
  const counts = await getBroadcastAudienceCounts();
  const audience = h("select", null, [["volunteers", "Active volunteers"], ["donors", "Donors (successful donations)"], ["all", "Volunteers + donors"]].map(([v, l]) => h("option", { value: v }, `${l} (${counts[v]} with email)`)));
  const subject = h("input", { name: "subject", maxlength: "200", disabled: true }), message = h("textarea", { name: "message", rows: "8", maxlength: "5000", disabled: true });
  const form = h("form", { novalidate: true, onsubmit: (e) => e.preventDefault() },
    msg("info", "Sending email requires a backend (SMTP) which is not available on this deployment. Use the audience counts below to export recipients yourself, or send via your own email tool."),
    field("Audience", audience), field("Subject", subject), field("Message", message));
  const hist = dataTable({ columns: [{ label: "Sent", cell: (r) => fmtDate(r.created_at), sort: (r) => r.created_at, firstDir: "desc" }, { label: "Audience", cell: (r) => r.audience, sort: (r) => r.audience },
    { label: "Subject", cell: (r) => r.subject, sort: (r) => (r.subject || "").toLowerCase() }, { label: "Recipients", cell: (r) => r.recipients, sort: (r) => r.recipients, cls: "num" }],
    rows: await getBroadcastHistory(), search: (r) => [r.subject, r.body, r.audience].join(" "), searchLabel: "Search broadcasts", sort: { i: 0, dir: "desc" }, pageSize: 10,
    empty: "No broadcasts sent yet (from before this deployment)." });
  return h("div", null, h("div", { class: "page-head" }, h("div", { class: "grow" }, h("h1", null, "Broadcast message"), h("p", { class: "mut" }, "Email active volunteers and/or donors. Recipients never see each other (BCC)."))),
    h("div", { class: "panel" }, form), h("h2", { class: "sec" }, "Past broadcasts"), hist.el);
};
