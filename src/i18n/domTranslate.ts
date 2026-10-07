/**
 * Shows the page in Hindi for every piece of text that has an entry in the dictionaries, wherever that text comes from:
 * page code, the data files, or the admin panel. It works on what is on screen: each piece of text (and each placeholder,
 * title and aria-label) is looked up by its exact English wording and replaced; switching back to English restores it.
 * Used by the website (src/i18n/LangContext.tsx) and by the admin panel (admin/js/lang.js).
 * Text with no entry stays in English, so adding a line to a dictionary is all that is needed to translate it.
 * An element with the attribute data-no-translate (and everything inside it) is left alone.
 */
type Dict = Record<string, string>;

const MONTHS: Dict = { January: "जनवरी", February: "फ़रवरी", March: "मार्च", April: "अप्रैल", May: "मई", June: "जून", July: "जुलाई", August: "अगस्त", September: "सितंबर", October: "अक्टूबर", November: "नवंबर", December: "दिसंबर",
  Jan: "जन.", Feb: "फ़र.", Mar: "मार्च", Apr: "अप्रैल", Jun: "जून", Jul: "जुलाई", Aug: "अग.", Sep: "सितं.", Sept: "सितं.", Oct: "अक्टू.", Nov: "नवं.", Dec: "दिसं." };
const monthNames = Object.keys(MONTHS).join("|");

/** Wording that follows a pattern (dates, numbered titles) instead of being one fixed sentence. */
const patterns: [RegExp, (m: RegExpMatchArray) => string][] = [
  [new RegExp(`^(\\d{1,2}) (${monthNames}),? (\\d{4})$`), (m) => `${m[1]} ${MONTHS[m[2]]} ${m[3]}`],
  [new RegExp(`^(${monthNames}) (\\d{4})$`), (m) => `${MONTHS[m[1]]} ${m[2]}`],
  [new RegExp(`^(\\d{1,2}) (${monthNames})$`), (m) => `${m[1]} ${MONTHS[m[2]]}`],
  [new RegExp(`^(${monthNames})$`), (m) => MONTHS[m[1]]],
  [/^Annual Report (\S+)$/, (m) => `वार्षिक रिपोर्ट ${m[1]}`],
  [/^(\d{4}) - Present$/, (m) => `${m[1]} - वर्तमान`],
  [/^(\d[\d,]*) beneficiaries$/, (m) => `${m[1]} लाभार्थी`]
];

const ATTRS = ["placeholder", "title", "aria-label", "alt"];
const SKIP = "script, style, noscript, code, pre, [contenteditable], [data-no-translate]";
const hasLatin = /[A-Za-z]/;

export interface DomTranslator {
  /** call after the language changed */ refresh: () => void;
  /** add more wording later */ add: (more: Dict) => void;
  /** add wording with changing parts: [English as a pattern, Hindi with {1} {2} ... for the parts]. A part that has its own entry is translated too. */
  addPatterns: (list: [string, string][]) => void;
}

export function startDomTranslate(isHindi: () => boolean, ...dicts: Dict[]): DomTranslator {
  const dict: Dict = Object.assign({}, ...dicts);
  // what each text node / attribute said in English, and the Hindi we put there (to notice when the page itself changes it)
  const textWas = new WeakMap<Text, string>(), textSet = new WeakMap<Text, string>();
  const attrWas = new WeakMap<Element, Dict>(), attrSet = new WeakMap<Element, Dict>();

  const extra: [RegExp, string][] = [];
  const lookup = (s: string): string | null => {
    if (dict[s] !== undefined) return dict[s];
    for (const [re, fn] of patterns) { const m = s.match(re); if (m) return fn(m); }
    for (const [re, hi] of extra) { const m = s.match(re); if (m) return hi.replace(/\{(\d+)\}/g, (_, n) => { const part = m[Number(n)] ?? ""; return dict[part.trim()] ?? part; }); }
    return null;
  };
  /** Hindi for one piece of text, or null. "A · B" is translated part by part when the whole has no entry. */
  const translate = (raw: string): string | null => {
    const s = raw.replace(/\s+/g, " ").trim();
    if (!s || !hasLatin.test(s)) return null;
    let hi = lookup(s);
    if (hi === null && s.includes(" · ")) {
      const parts = s.split(" · "), done = parts.map((p) => lookup(p.trim()));
      if (done.some((d) => d !== null)) hi = parts.map((p, i) => done[i] ?? p).join(" · ");
    }
    if (hi === null) return null;
    // keep the spaces around the text: neighbouring pieces rely on them
    return raw.match(/^\s*/)![0] + hi + raw.match(/\s*$/)![0];
  };

  const doText = (node: Text, on: boolean) => {
    const now = node.nodeValue ?? "";
    if (textSet.get(node) !== now) { textWas.delete(node); textSet.delete(node); } // new node, or the page wrote new text into it
    if (on) {
      if (textSet.has(node)) return;
      const hi = translate(now);
      if (hi === null || hi === now) return;
      // a choice in a drop-down keeps sending its English wording, whatever language it is shown in
      const opt = node.parentElement;
      if (opt instanceof HTMLOptionElement && !opt.hasAttribute("value")) opt.setAttribute("value", opt.text.trim());
      textWas.set(node, now); textSet.set(node, hi); node.nodeValue = hi;
    } else if (textWas.has(node)) {
      const en = textWas.get(node)!;
      textWas.delete(node); textSet.delete(node); node.nodeValue = en;
    }
  };
  const doAttrs = (el: Element, on: boolean) => {
    for (const a of ATTRS) {
      const now = el.getAttribute(a);
      if (now === null) continue;
      const was = attrWas.get(el) ?? {}, set = attrSet.get(el) ?? {};
      if (set[a] !== now) { delete was[a]; delete set[a]; }
      if (on && set[a] === undefined) {
        const hi = translate(now);
        if (hi !== null && hi !== now) { was[a] = now; set[a] = hi; attrWas.set(el, was); attrSet.set(el, set); el.setAttribute(a, hi); }
      } else if (!on && was[a] !== undefined) {
        const en = was[a]; delete was[a]; delete set[a]; el.setAttribute(a, en);
      }
    }
  };
  const walk = (root: Node, on: boolean) => {
    if (root.nodeType === Node.TEXT_NODE) { if (!(root.parentElement?.closest(SKIP + ", textarea"))) doText(root as Text, on); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const el = root as Element;
    if (el.closest(SKIP)) return;
    doAttrs(el, on);
    if (el instanceof HTMLTextAreaElement) return; // what is typed in a text box is never changed, only its placeholder
    const w = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        if (n.nodeType !== Node.ELEMENT_NODE) return NodeFilter.FILTER_ACCEPT;
        if ((n as Element).matches(SKIP)) return NodeFilter.FILTER_REJECT;
        if (n instanceof HTMLTextAreaElement) { doAttrs(n, on); return NodeFilter.FILTER_REJECT; }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeType === Node.TEXT_NODE ? doText(n as Text, on) : doAttrs(n as Element, on);
  };

  // anything that appears or changes later (a new page, an opened form, a message) is handled as it arrives
  new MutationObserver((list) => {
    const on = isHindi();
    if (!on) return;
    for (const m of list) {
      if (m.type === "characterData") walk(m.target, on);
      else if (m.type === "attributes") { if (!(m.target as Element).closest(SKIP)) doAttrs(m.target as Element, on); }
      else m.addedNodes.forEach((n) => walk(n, on));
    }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  const refresh = () => walk(document.body, isHindi());
  refresh();
  return {
    refresh,
    add: (more) => { Object.assign(dict, more); refresh(); },
    addPatterns: (list) => { list.forEach(([src, hi]) => { try { extra.push([new RegExp(src), hi]); } catch { /* skip a pattern that is not valid */ } }); refresh(); }
  };
}
