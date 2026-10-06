/**
 * Justified text only looks right when a line is long enough: in a narrow box the browser has to stretch the spaces
 * between a few words to fill the line. This watches the page and gives every justified paragraph that is too narrow
 * the class "no-justify" (see src/index.css), so it is left-aligned with normal word spacing; wide paragraphs stay justified.
 * It re-checks when the page content or the window size changes.
 */
/** Narrowest line, in letter-heights (em), that is still justified: about 80 characters, i.e. text running most of the page width. */
const MIN_EM = 42;
const SELECTOR = "main p, main .justified";

function check() {
  document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    const narrow = el.classList.contains("no-justify");
    // measured without the class, so a box that has become wide enough is justified again
    if (narrow) el.classList.remove("no-justify");
    const cs = getComputedStyle(el);
    if (cs.textAlign !== "justify") return;
    const width = el.clientWidth, size = parseFloat(cs.fontSize) || 16;
    if (width > 0 && width / size < MIN_EM) el.classList.add("no-justify");
  });
}

let started = false;
export function watchJustify() {
  if (started || typeof window === "undefined") return;
  started = true;
  let queued = false;
  // a short timer rather than "next frame": frames stop while the tab is in the background, a timer does not
  const later = () => { if (queued) return; queued = true; window.setTimeout(() => { queued = false; check(); }, 60); };
  // class changes made here are not watched, so the check never triggers itself
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", later);
  document.fonts?.ready.then(later).catch(() => {});
  later();
}
