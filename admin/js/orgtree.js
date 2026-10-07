import { getTeamMembers, getVolunteers } from "./data.js";
import { h, field } from "./ui.js";

// Team & Volunteers: who works under whom ("Works under" in each person's form). A team member or a volunteer can work
// under any other team member or volunteer; it is saved on the person as "team:<id>" or "volunteer:<id>" (column
// reports_to). Admin panel only: the website never shows it.

/** Everyone who can be chosen, team first: [{ key, id, type, name, sub, status, under }]. */
export async function loadPeople() {
  const [team, vols] = await Promise.all([getTeamMembers(), getVolunteers()]);
  const people = [
    ...team.map((r) => ({ key: `team:${r.id}`, id: r.id, type: "team", name: r.name, sub: r.post, under: r.reports_to || null })),
    ...vols.map((r) => ({ key: `volunteer:${r.id}`, id: r.id, type: "volunteer", name: r.name || "Unnamed", sub: r.area || "", status: r.status, under: r.reports_to || null }))
  ];
  // someone whose lead was deleted, or who ended up in a loop, counts as working under no one
  const by = new Map(people.map((p) => [p.key, p]));
  people.forEach((p) => { if (p.under && !by.has(p.under)) p.under = null; });
  people.forEach((p) => { const seen = new Set([p.key]); for (let x = by.get(p.under); x; x = by.get(x.under)) { if (seen.has(x.key)) { p.under = null; break; } seen.add(x.key); } });
  return people;
}
/** Keys of everyone below this person, at any depth (they cannot become the person's lead). */
function below(people, key) {
  const out = new Set(), walk = (k) => people.forEach((p) => { if (p.under === k && !out.has(p.key)) { out.add(p.key); walk(p.key); } });
  if (key) walk(key);
  return out;
}
const label = (p) => [p.name, p.type === "team" ? p.sub : "Volunteer"].filter(Boolean).join(" · ");

/** The choices of a "Works under" box: no one, then every team member and volunteer except the person and those below them. */
function options(people, selfKey, current) {
  const skip = below(people, selfKey); if (selfKey) skip.add(selfKey);
  const group = (type, text) => { const list = people.filter((p) => p.type === type && !skip.has(p.key) && (p.status !== "inactive" || p.key === current));
    return list.length ? h("optgroup", { label: text }, list.map((p) => h("option", { value: p.key, selected: p.key === current }, label(p)))) : null; };
  return [h("option", { value: "" }, "No one"), group("team", "Team"), group("volunteer", "Volunteers")];
}

/**
 * The "Works under" box for a form. `selfKey` = the person being edited ("team:3"), null for a new person.
 * value() = the chosen key or null; changed() = whether it differs from what was saved (only then is it sent).
 */
export function managerField(selfKey, current, onchange) {
  current = current || null;
  const sel = h("select", { name: "reports_to", disabled: true, onchange: () => onchange?.(sel.value || null) }, h("option", { value: current || "" }, "Loading…"));
  loadPeople().then((people) => {
    // the freshly loaded choice wins over the row the form was opened with (it may have been changed since)
    const self = selfKey && people.find((p) => p.key === selfKey);
    if (self) current = self.under; else if (!people.some((p) => p.key === current)) current = null; sel.replaceChildren(...options(people, selfKey, current).filter(Boolean)); sel.value = current || ""; sel.disabled = false; })
    .catch(() => sel.replaceChildren(h("option", { value: current || "" }, "The list could not be loaded.")));
  return { el: field("Works under (who this person reports to; kept in the admin panel only)", sel), value: () => sel.value || null, changed: () => !sel.disabled && (sel.value || null) !== current };
}
