import { useCallback, useEffect, useRef, useState } from "react";
import { useTitle } from "../hooks/useTitle";
import { useLang } from "../i18n/LangContext";
import { site } from "../data/site";
import PageHero from "../components/PageHero";
import Reveal from "../components/Reveal";
import { jpegToPdf } from "../lib/pdf";
import IssuedCards from "../components/IssuedCards";
import { supabase } from "../lib/supabase";

/** Card is drawn at CR80 proportions (85.6 x 54 mm) on a canvas, so the preview, the JPG and the PDF are the same picture. */
const W = 1012, H = 638, SCALE = 2;
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const MAX_PHOTO = 5 * 1024 * 1024;

interface Data { name: string; role: string; phone: string; blood: string; valid: string; photo: HTMLImageElement | null; id: string }

const loadImage = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
  const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
});
const fmtDate = (v: string) => { const d = new Date(v); return isNaN(+d) ? v : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); };
const newId = () => `SJKS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
/** Largest font (down to `min`) at which `text` fits in `max` px; leaves the context font set. */
function fit(c: CanvasRenderingContext2D, text: string, weight: number, size: number, min: number, max: number, family: string) {
  let s = size;
  for (; s > min; s -= 2) { c.font = `${weight} ${s}px ${family}`; if (c.measureText(text).width <= max) break; }
  c.font = `${weight} ${s}px ${family}`;
}

function draw(canvas: HTMLCanvasElement, d: Data, logo: HTMLImageElement | null) {
  const c = canvas.getContext("2d"); if (!c) return;
  const F = "Poppins, 'Noto Sans Devanagari', system-ui, sans-serif";
  canvas.width = W * SCALE; canvas.height = H * SCALE;
  c.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  c.clearRect(0, 0, W, H);

  // body
  c.save(); rr(c, 0, 0, W, H, 36); c.clip();
  const bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#08305f"); bg.addColorStop(0.55, "#0b4f9c"); bg.addColorStop(1, "#1479d1");
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(255,255,255,.06)"; c.beginPath(); c.arc(W - 40, 250, 230, 0, 7); c.fill();
  c.fillStyle = "rgba(56,189,248,.14)"; c.beginPath(); c.arc(W - 170, H - 20, 170, 0, 7); c.fill();

  // header band with the logo
  c.fillStyle = "#fff"; c.fillRect(0, 0, W, 128);
  if (logo) { const h = 88, w = h * logo.width / logo.height; c.drawImage(logo, 40, 20, w, h); }
  c.fillStyle = "#38bdf8"; c.fillRect(0, 128, W, 6);
  c.textAlign = "right"; c.textBaseline = "middle";
  c.fillStyle = "#0b4f9c"; c.font = `700 30px ${F}`; c.fillText("MEMBER ID CARD", W - 40, 54);
  c.fillStyle = "#5b6b82"; c.font = `500 18px ${F}`; c.fillText(site.regLine, W - 40, 90);

  // photo
  const px = 44, py = 176, pw = 232, ph = 290;
  c.fillStyle = "#fff"; rr(c, px - 8, py - 8, pw + 16, ph + 16, 28); c.fill();
  c.save(); rr(c, px, py, pw, ph, 22); c.clip();
  if (d.photo) {
    const s = Math.max(pw / d.photo.width, ph / d.photo.height), iw = d.photo.width * s, ih = d.photo.height * s;
    c.drawImage(d.photo, px + (pw - iw) / 2, py + (ph - ih) / 3, iw, ih);
  } else {
    c.fillStyle = "#dbe7f5"; c.fillRect(px, py, pw, ph);
    c.fillStyle = "#9db6d3"; c.beginPath(); c.arc(px + pw / 2, py + 110, 54, 0, 7); c.fill();
    c.beginPath(); c.ellipse(px + pw / 2, py + 250, 92, 82, 0, 0, 7); c.fill();
  }
  c.restore();
  c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = "rgba(255,255,255,.9)"; c.font = `600 17px ${F}`; c.fillText(d.id || "ID: ----", px + pw / 2, py + ph + 40);

  // details
  const tx = 324, tw = W - tx - 44;
  c.textAlign = "left"; c.textBaseline = "alphabetic";
  c.fillStyle = "#fff"; fit(c, d.name || "Your Name", 700, 54, 28, tw, F); c.fillText(d.name || "Your Name", tx, 222);
  const role = d.role || "Role";
  c.font = `600 24px ${F}`; const rw = Math.min(c.measureText(role).width + 44, tw);
  c.fillStyle = "#38bdf8"; rr(c, tx, 246, rw, 46, 23); c.fill();
  c.fillStyle = "#06264d"; fit(c, role, 600, 24, 14, rw - 44, F); c.textBaseline = "middle"; c.fillText(role, tx + 22, 270);

  c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 2; c.beginPath(); c.moveTo(tx, 322); c.lineTo(tx + tw, 322); c.stroke();
  const rows: [string, string][] = [["PHONE", d.phone || "-"], ["BLOOD GROUP", d.blood || "-"], ["VALID TILL", d.valid ? fmtDate(d.valid) : "-"]];
  rows.forEach(([k, v], i) => {
    const y = 360 + i * 62;
    c.textBaseline = "alphabetic"; c.fillStyle = "rgba(255,255,255,.65)"; c.font = `600 15px ${F}`; c.fillText(k, tx, y);
    c.fillStyle = "#fff"; fit(c, v, 600, 28, 16, tw, F); c.fillText(v, tx, y + 32);
  });

  // footer
  c.fillStyle = "rgba(4,22,48,.55)"; c.fillRect(0, H - 56, W, 56);
  c.textBaseline = "middle"; c.textAlign = "left"; c.fillStyle = "#fff"; c.font = `600 19px ${F}`; c.fillText(site.name, 40, H - 28);
  c.textAlign = "right"; c.fillStyle = "rgba(255,255,255,.8)"; c.font = `500 17px ${F}`; c.fillText(site.website, W - 40, H - 28);
  c.restore();
}

const input = "w-full rounded-2xl border border-brand/15 bg-white px-5 py-3.5 text-[15px] text-ink outline-none transition placeholder:text-ink/40 focus:border-brand focus:ring-4 focus:ring-brand/15";
const label = "mb-1.5 block text-sm font-semibold text-ink";

export default function MemberID() {
  useTitle("Member ID Card");
  const { t } = useLang();
  const canvas = useRef<HTMLCanvasElement>(null);
  const logo = useRef<HTMLImageElement | null>(null);
  const [form, setForm] = useState({ name: "", role: "", phone: "", blood: "", valid: "" });
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [id, setId] = useState("");
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [listTick, setListTick] = useState(0);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    let alive = true;
    Promise.all([loadImage("/assets/images/logo.png").catch(() => null), document.fonts?.load("700 20px Poppins").catch(() => null), document.fonts?.load("500 20px Poppins").catch(() => null)])
      .then(([img]) => { if (alive) { logo.current = img; setTick((n) => n + 1); } });
    return () => { alive = false; };
  }, []);
  useEffect(() => { if (canvas.current) draw(canvas.current, { ...form, photo, id }, logo.current); }, [form, photo, id, tick]);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setErr("Please choose a JPG, PNG or WebP photo."); e.target.value = ""; return; }
    if (f.size > MAX_PHOTO) { setErr("The photo is larger than 5 MB. Please choose a smaller one."); e.target.value = ""; return; }
    const url = URL.createObjectURL(f);
    try { setPhoto(await loadImage(url)); setErr(""); } catch { setErr("That photo could not be read."); } finally { URL.revokeObjectURL(url); }
  };

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!form.name.trim() || !form.role.trim()) return setErr("Please enter your full name and role.");
    if (!/^[+\d][\d\s-]{6,17}$/.test(form.phone.trim()) || form.phone.replace(/\D/g, "").length < 10) return setErr("Please enter a valid 10-digit phone number.");
    if (!photo) return setErr("Please upload a passport-size photo.");
    setErr("");
    if (supabase) {
      // the card is saved in the database; the same phone number always gets the same ID back
      setBusy(true);
      const { data, error } = await supabase.rpc("issue_member_card", { p_name: form.name, p_role: form.role, p_phone: form.phone, p_blood: form.blood || null, p_valid: form.valid || null });
      setBusy(false);
      const res = data as { status?: string; card_id?: string } | null;
      if (error || !res) return setErr("The card could not be saved. Please check your connection and try again.");
      if (res.status === "rate_limited") return setErr("Too many attempts. Please try again in a few minutes.");
      if (!res.card_id) return setErr("Please check your details and try again.");
      setId(res.card_id); setListTick((n) => n + 1);
    } else if (!id) setId(newId());
    canvas.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const blob = useCallback(() => new Promise<Blob | null>((res) => canvas.current ? canvas.current.toBlob(res, "image/jpeg", 0.95) : res(null)), []);
  const save = (b: Blob, ext: string) => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(b);
    a.download = `${(form.name.trim() || "member").replace(/[^\w-]+/g, "-")}-ID-Card.${ext}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const ready = !!id;
  const downloadJpg = async () => { const b = await blob(); if (b) save(b, "jpg"); };
  const downloadPdf = async () => { const b = await blob(); if (b) save(jpegToPdf(new Uint8Array(await b.arrayBuffer()), W * SCALE, H * SCALE, 242.65, 153.07), "pdf"); };

  return (
    <>
      <PageHero images={["/assets/images/gallery/csr-volunteering/sap-volunteers-group.jpg"]} eyebrow={t("Member Services")} title={t("Member ID Card")} text={t("Fill in your details, add a photo and download your ID card as a JPG or PDF.")} />
      <section className="bg-gradient-to-b from-[#f3f8fe] via-white to-[#eef5fd] py-12 md:py-16">
        <div className="container-site grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
          <Reveal>
            <form onSubmit={generate} noValidate className="rounded-3xl border border-brand/10 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(11,79,156,.45)] sm:p-8">
              <h2 className="text-xl font-bold text-ink">{t("Your details")}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><label className={label} htmlFor="mid-name">{t("Full Name")} *</label><input id="mid-name" className={input} maxLength={40} value={form.name} onChange={set("name")} placeholder="e.g. Ramesh Kumar" autoComplete="name" /></div>
                <div className="sm:col-span-2"><label className={label} htmlFor="mid-role">{t("Role")} *</label><input id="mid-role" className={input} maxLength={30} value={form.role} onChange={set("role")} placeholder="e.g. Volunteer, Member, Coordinator" /></div>
                <div><label className={label} htmlFor="mid-phone">{t("Phone")} *</label><input id="mid-phone" className={input} inputMode="tel" maxLength={18} value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" autoComplete="tel" /></div>
                <div><label className={label} htmlFor="mid-blood">{t("Blood Group")}</label>
                  <select id="mid-blood" className={input} value={form.blood} onChange={set("blood")}><option value="">{t("Select")}</option>{BLOOD.map((b) => <option key={b}>{b}</option>)}</select></div>
                <div className="sm:col-span-2"><label className={label} htmlFor="mid-valid">{t("Valid Till")}</label><input id="mid-valid" type="date" className={input} value={form.valid} onChange={set("valid")} /></div>
                <div className="sm:col-span-2"><label className={label} htmlFor="mid-photo">{t("Passport-size photo")} *</label>
                  <input id="mid-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} className={`${input} cursor-pointer p-2.5 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand file:px-5 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark`} />
                  <p className="mt-1.5 text-xs text-ink/55">{t("JPG, PNG or WebP, up to 5 MB. Your photo stays on your device and is never uploaded.")}</p></div>
              </div>
              {err && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{t(err)}</p>}
              <button type="submit" className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-dark to-brand px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/30 transition hover:brightness-110">{busy ? t("Saving...") : ready ? t("Update Card") : t("Generate Card")}</button>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button type="button" disabled={!ready} onClick={downloadJpg} className="rounded-2xl bg-ink px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40">{t("Download JPG")}</button>
                <button type="button" disabled={!ready} onClick={downloadPdf} className="rounded-2xl bg-ink px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40">{t("Download PDF")}</button>
              </div>
            </form>
          </Reveal>

          <Reveal>
            <div className="lg:sticky lg:top-28">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-dark">{t("Live preview")}</p>
              <canvas ref={canvas} role="img" aria-label="Member ID card preview" className="block h-auto w-full rounded-[22px] shadow-[0_30px_60px_-25px_rgba(6,26,54,.65)] ring-1 ring-black/5" style={{ aspectRatio: `${W} / ${H}` }} />
              <p className="mt-4 text-center text-sm text-ink/60">{ready ? t("Your card is ready. Download it from the buttons on the form.") : t("Fill the form and press Generate Card to get your ID number and enable the downloads.")}</p>
            </div>
          </Reveal>
        </div>
      </section>
      <IssuedCards refresh={listTick} />
    </>
  );
}
