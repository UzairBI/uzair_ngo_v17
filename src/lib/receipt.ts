import { site, reg80G, reg12A, legalIds } from "../data/site";

const PAN = legalIds.find((l) => l.title.startsWith("PAN"))?.value ?? "";
import { jpegToPdf, saveBlob } from "./pdf";

export interface Receipt { no: string; date: string; name: string; pan: string; email: string; amount: number; demo: boolean }

const ones = "Zero One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen".split(" ");
const tens = "_ _ Twenty Thirty Forty Fifty Sixty Seventy Eighty Ninety".split(" ");
const b100 = (n: number) => (n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : ""));
const b1000 = (n: number) => (n >= 100 ? ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + b100(n % 100) : "") : b100(n));
/** 10000 -> "Ten Thousand" (Indian grouping). */
export function rupeesInWords(amount: number): string {
  let n = Math.floor(amount);
  if (n === 0) return "Zero";
  const parts: string[] = [];
  for (const [div, name] of [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"]] as const) { const q = Math.floor(n / div); if (q) parts.push(b1000(q) + " " + name); n %= div; }
  if (n) parts.push(b1000(n));
  return parts.join(" ");
}

const financialYear = (d: Date) => { const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-${String((y + 1) % 100).padStart(2, "0")}`; };
/** DEMO receipt: not recorded anywhere and not a valid tax document. */
export function demoReceipt(p: { name: string; pan: string; email: string; amount: number }): Receipt {
  const now = new Date(), dd = String(now.getDate()).padStart(2, "0"), mm = String(now.getMonth() + 1).padStart(2, "0");
  return { ...p, no: `DEMO/${financialYear(now)}/${String(Math.floor(Math.random() * 900000) + 100000)}`, date: `${dd}-${mm}-${now.getFullYear()}`, demo: true };
}

const W = 1240, H = 1000, SCALE = 2; // A5-landscape-ish, like a one-page receipt
const SERIF = "'Times New Roman', Times, serif";

function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number): number {
  let line = "";
  for (const word of text.split(" ")) {
    const t = line ? line + " " + word : word;
    if (c.measureText(t).width > maxW && line) { c.fillText(line, x, y); y += lh; line = word; } else line = t;
  }
  if (line) { c.fillText(line, x, y); y += lh; }
  return y;
}

export async function renderReceipt(r: Receipt): Promise<HTMLCanvasElement> {
  const logo = await new Promise<HTMLImageElement | null>((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = site.logo; });
  const cv = document.createElement("canvas"); cv.width = W * SCALE; cv.height = H * SCALE;
  const c = cv.getContext("2d")!; c.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  c.fillStyle = "#fff"; c.fillRect(0, 0, W, H);
  if (logo) { const h = 130, w = h * logo.width / logo.height; c.drawImage(logo, (W - w) / 2, 40, w, h); }
  c.fillStyle = "#1d2433"; c.textBaseline = "alphabetic"; c.textAlign = "center"; c.font = `500 20px ${SERIF}`;
  c.fillText(`${site.address.split(",").slice(0, 3).join(",")}, ${site.location}`, W / 2, 200);
  c.fillText(`${site.regLine}  ·  PAN ${PAN}  ·  ${site.email}`, W / 2, 230);

  const L = 90, R = W - 90;
  c.textAlign = "left"; c.font = `700 28px ${SERIF}`; c.fillText("Receipt No. ", L, 310);
  const w1 = c.measureText("Receipt No. ").width; c.font = `400 28px ${SERIF}`; c.fillText(r.no, L + w1, 310);
  c.textAlign = "right"; c.font = `400 28px ${SERIF}`; c.fillText(r.date, R, 310);
  const w2 = c.measureText(r.date).width; c.font = `700 28px ${SERIF}`; c.fillText("Receipt Date: ", R - w2, 310);

  c.textAlign = "left"; c.font = `700 30px ${SERIF}`;
  let y = wrap(c, `Received with thanks from ${r.name.toUpperCase()}${r.pan ? `, PAN No ${r.pan}` : ""} the sum of Rupees ${rupeesInWords(r.amount)} only as donations.`, L, 385, R - L, 44);

  c.font = `400 28px ${SERIF}`; y += 22;
  y = wrap(c, `EXEMPTION U/S.80-G OF THE I.T. ACT, 80G Unique Registration Number ${reg80G.value}, valid ${reg80G.validity ? "for " + reg80G.validity : "as per the approval"}, subject to the provisions of Sec.80G. 12A Registration Number ${reg12A.value}.`, L, y, R - L, 44);
  c.fillText(`PAN NO.: ${PAN}`, L, y); y += 90;

  c.font = `700 32px ${SERIF}`; c.fillText(`INR ${r.amount.toLocaleString("en-IN")} only`, L, y);
  c.font = `400 28px ${SERIF}`; c.fillText("Subject to realization", L, y + 42);

  c.textAlign = "center"; c.font = `400 24px ${SERIF}`; c.fillText(`FOR ${site.name.toUpperCase()}`, R - 190, y - 8);
  c.fillStyle = "#1d2433"; c.fillRect(R - 340, y + 92, 300, 1.5);
  c.fillText("Authorised Signatory", R - 190, y + 124);

  if (r.demo) {
    c.save(); c.translate(W / 2, H / 2 + 60); c.rotate(-0.42); c.textAlign = "center"; c.textBaseline = "middle";
    c.fillStyle = "rgba(200,30,30,.16)"; c.font = `800 150px Arial, sans-serif`; c.fillText("DEMO", 0, -50);
    c.font = `700 44px Arial, sans-serif`; c.fillText("NOT A VALID RECEIPT", 0, 60); c.restore();
  }
  return cv;
}

export async function downloadReceipt(r: Receipt, kind: "jpg" | "pdf") {
  const cv = await renderReceipt(r);
  const blob = await new Promise<Blob | null>((res) => cv.toBlob(res, "image/jpeg", 0.95));
  if (!blob) return;
  const base = `Donation-Receipt-${r.no.replace(/[^\w-]+/g, "-")}`;
  if (kind === "jpg") saveBlob(blob, `${base}.jpg`);
  else saveBlob(jpegToPdf(new Uint8Array(await blob.arrayBuffer()), W * SCALE, H * SCALE, 595.28, 595.28 * H / W), `${base}.pdf`);
}
