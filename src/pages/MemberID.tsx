import { useEffect, useRef, useState } from "react";
import { useTitle } from "../hooks/useTitle";
import { useLang } from "../i18n/LangContext";
import PageHero from "../components/PageHero";
import Reveal from "../components/Reveal";
import { W, H, draw, fmtDate, loadImage, downloadCard, photoForUpload, memberPhotoUrl, MEMBER_PHOTOS } from "../lib/memberCard";
import IssuedCards from "../components/IssuedCards";
import { supabase } from "../lib/supabase";

const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const MAX_PHOTO = 5 * 1024 * 1024;
const newId = () => `SJKS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

type Field = "name" | "role" | "phone" | "blood" | "photo";
const FIELDS: Field[] = ["name", "role", "phone", "blood", "photo"];
/** Shown above the button while any field still has a problem. */
const FIX_FIELDS = "Please correct the highlighted fields.";
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** The 10 digits of an Indian mobile number, without +91 / 91 / a leading 0; "" if it is not one. */
const mobile = (v: string) => {
  if (!/^\+?[\d\s-]+$/.test(v.trim())) return "";
  let d = v.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2); else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : "";
};
/** What is wrong with one field ("" = fine). The same checks run as the visitor leaves a field and again on submit. */
function check(field: Field, form: { name: string; role: string; phone: string; blood: string }, photo: HTMLImageElement | null): string {
  const name = form.name.trim(), role = form.role.trim();
  switch (field) {
    case "name":
      if (!name) return "Please enter your full name.";
      if (name.length < 3) return "The name must be at least 3 characters long.";
      if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(name)) return "The name can contain only letters, spaces, dots and hyphens.";
      return "";
    case "role":
      if (!role) return "Please enter your role.";
      if (role.length < 2) return "The role must be at least 2 characters long.";
      if (!/^[\p{L}\p{M}\d][\p{L}\p{M}\d &/().,'-]*$/u.test(role)) return "The role contains characters that are not allowed.";
      return "";
    case "phone":
      if (!form.phone.trim()) return "Please enter your phone number.";
      return mobile(form.phone) ? "" : "Please enter a valid 10-digit mobile number.";
    case "blood":
      return !form.blood || BLOOD.includes(form.blood) ? "" : "Please choose a blood group from the list.";
    case "photo":
      return photo ? "" : "Please upload a passport-size photo.";
  }
}

const input = "w-full rounded-2xl border border-brand/15 bg-white px-5 py-3.5 text-[15px] text-ink outline-none transition placeholder:text-ink/40 focus:border-brand focus:ring-4 focus:ring-brand/15";
const label = "mb-1.5 block text-sm font-semibold text-ink";

export default function MemberID() {
  useTitle("Member ID Card");
  const { t } = useLang();
  const canvas = useRef<HTMLCanvasElement>(null);
  const logo = useRef<HTMLImageElement | null>(null);
  // the photo already sent in this visit (and which picture it was), so pressing the button again does not send it twice
  const sent = useRef<{ img: HTMLImageElement; path: string } | null>(null);
  // "valid" (valid till) is never typed here: our team sets it when approving, and it comes back with the approved card
  const [form, setForm] = useState({ name: "", role: "", phone: "", blood: "", valid: "" });
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [id, setId] = useState("");
  const [err, setErr] = useState("");
  // what is wrong with each field, shown under it
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  // the application was sent and is waiting for an admin (Member ID Cards in the admin panel) to approve it
  const [waiting, setWaiting] = useState(false);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [listTick, setListTick] = useState(0);
  // a field that is showing a problem is checked again as it is corrected
  const set = (k: Exclude<Field, "photo">) => (e: { target: { value: string } }) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    if (errors[k]) setErrors((x) => ({ ...x, [k]: check(k, next, photo) }));
  };
  const blur = (k: Field) => () => setErrors((x) => ({ ...x, [k]: check(k, form, photo) }));
  const cls = (k: Field) => `${input}${errors[k] ? " !border-rose-500 focus:!ring-rose-500/15" : ""}`;
  const problem = (k: Field) => errors[k] ? <p id={`mid-${k}-err`} role="alert" className="mt-1.5 text-xs font-medium text-rose-700">{t(errors[k]!)}</p> : null;
  const aria = (k: Field) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `mid-${k}-err` : undefined });

  useEffect(() => {
    let alive = true;
    Promise.all([loadImage("/assets/images/logo.png").catch(() => null), document.fonts?.load("700 20px Poppins").catch(() => null), document.fonts?.load("500 20px Poppins").catch(() => null)])
      .then(([img]) => { if (alive) { logo.current = img; setTick((n) => n + 1); } });
    return () => { alive = false; };
  }, []);
  useEffect(() => { if (canvas.current) draw(canvas.current, { ...form, photo, id }, logo.current); }, [form, photo, id, tick]);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const bad = (text: string) => { setPhoto(null); setErrors((x) => ({ ...x, photo: text })); e.target.value = ""; };
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return bad("Please choose a JPG, PNG or WebP photo.");
    if (f.size > MAX_PHOTO) return bad("The photo is larger than 5 MB. Please choose a smaller one.");
    const url = URL.createObjectURL(f);
    try {
      const img = await loadImage(url);
      if (img.width < 150 || img.height < 150) return bad("The photo is too small. Please use one at least 150 pixels wide and tall.");
      setPhoto(img); setErrors((x) => ({ ...x, photo: "" }));
    } catch { bad("That photo could not be read. Please choose another one."); } finally { URL.revokeObjectURL(url); }
  };

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const found = Object.fromEntries(FIELDS.map((k) => [k, check(k, form, photo)])) as Record<Field, string>;
    setErrors(found); setWaiting(false);
    const first = FIELDS.find((k) => found[k]);
    if (first) { setErr(FIX_FIELDS); document.getElementById(`mid-${first}`)?.focus(); return; }
    setErr("");
    if (supabase && photo) {
      // the application is saved in the database and an admin approves it; the same phone number always gets the same answer back
      type Answer = { status?: string; card_id?: string; full_name?: string; role?: string; blood_group?: string | null; valid_till?: string | null; photo_path?: string | null };
      let res: Answer | null = null;
      setBusy(true);
      try {
        // first ask where this phone number stands: the photo is only sent when there is an application to attach it to
        const asked = await supabase.rpc("member_card_status", { p_phone: form.phone.trim() });
        if (asked.error) throw asked.error;
        res = asked.data as Answer;
        if (res?.status === "none" || res?.status === "pending") {
          if (sent.current?.img !== photo) {
            const path = `${crypto.randomUUID()}.jpg`;
            const up = await supabase.storage.from(MEMBER_PHOTOS).upload(path, await photoForUpload(photo), { contentType: "image/jpeg" });
            if (up.error) throw up.error;
            sent.current = { img: photo, path };
          }
          const saved = await supabase.rpc("issue_member_card", { p_name: form.name.trim().replace(/\s+/g, " "), p_role: form.role.trim().replace(/\s+/g, " "), p_phone: form.phone.trim(), p_blood: form.blood || null, p_photo: sent.current.path });
          if (saved.error) throw saved.error;
          res = saved.data as Answer;
        }
      } catch { res = null; }
      setBusy(false);
      if (!res) return setErr("The application could not be sent. Please check your connection and try again.");
      if (res.status === "rate_limited") return setErr("Too many attempts. Please try again in a few minutes.");
      if (res.status === "rejected") { setId(""); return setErr("Your application was not approved. Please contact our office for help."); }
      if (res.status === "pending") { setId(""); return setWaiting(true); }
      if (res.status !== "approved" || !res.card_id) return setErr("Please check your details and try again.");
      // the card carries the details and the photo as approved by our team
      if (res.photo_path) { const stored = await loadImage(memberPhotoUrl(res.photo_path), true).catch(() => null); if (stored) setPhoto(stored); }
      setForm((f) => ({ ...f, name: res.full_name ?? f.name, role: res.role ?? f.role, blood: res.blood_group ?? "", valid: res.valid_till ?? "" }));
      setId(res.card_id); setListTick((n) => n + 1);
    } else if (!id) setId(newId());
    canvas.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const ready = !!id;
  const download = (kind: "jpg" | "pdf") => () => { if (canvas.current) downloadCard(canvas.current, form.name, kind).catch(() => setErr("The card could not be downloaded. Please try again.")); };
  const downloadJpg = download("jpg"), downloadPdf = download("pdf");

  return (
    <>
      <PageHero images={["/assets/images/member-id-banner.jpg"]} imgClassName="object-[center_42%]" eyebrow={t("Member Services")} title={t("Member ID Card")} text={t("Apply with your details and a photo. Once our team approves your application, download your ID card as a JPG or PDF.")} />
      <section className="bg-gradient-to-b from-[#f3f8fe] via-white to-[#eef5fd] py-12 md:py-16">
        <div className="container-site grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
          <Reveal>
            <form onSubmit={generate} noValidate className="rounded-3xl border border-brand/10 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(11,79,156,.45)] sm:p-8">
              <h2 className="text-xl font-bold text-ink">{t("Your details")}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><label className={label} htmlFor="mid-name">{t("Full Name")} *</label><input id="mid-name" className={cls("name")} maxLength={40} value={form.name} onChange={set("name")} onBlur={blur("name")} {...aria("name")} placeholder="e.g. Ramesh Kumar" autoComplete="name" />{problem("name")}</div>
                <div className="sm:col-span-2"><label className={label} htmlFor="mid-role">{t("Role")} *</label><input id="mid-role" className={cls("role")} maxLength={30} value={form.role} onChange={set("role")} onBlur={blur("role")} {...aria("role")} placeholder="e.g. Volunteer, Member, Coordinator" />{problem("role")}</div>
                <div><label className={label} htmlFor="mid-phone">{t("Phone")} *</label><input id="mid-phone" type="tel" className={cls("phone")} inputMode="tel" maxLength={18} value={form.phone} onChange={set("phone")} onBlur={blur("phone")} {...aria("phone")} placeholder="+91 98765 43210" autoComplete="tel" />{problem("phone")}</div>
                <div><label className={label} htmlFor="mid-blood">{t("Blood Group")}</label>
                  <select id="mid-blood" className={cls("blood")} value={form.blood} onChange={set("blood")} onBlur={blur("blood")} {...aria("blood")}><option value="">{t("Select")}</option>{BLOOD.map((b) => <option key={b}>{b}</option>)}</select>{problem("blood")}</div>
                <div className="sm:col-span-2"><label className={label} htmlFor="mid-applied">{t("Date of Application")}</label><input id="mid-applied" readOnly tabIndex={-1} className={`${input} cursor-default bg-slate-50 text-ink/70`} value={fmtDate(dayKey(new Date()))} />
                  <p className="mt-1.5 text-xs text-ink/55">{t("The validity of your card is set by our team when your application is approved.")}</p></div>
                <div className="sm:col-span-2"><label className={label} htmlFor="mid-photo">{t("Passport-size photo")} *</label>
                  <input id="mid-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} {...aria("photo")} className={`${cls("photo")} cursor-pointer p-2.5 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand file:px-5 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark`} />
                  {problem("photo")}
                  <p className="mt-1.5 text-xs text-ink/55">{t("JPG, PNG or WebP, up to 5 MB. Your photo is sent with your application and printed on your ID card.")}</p></div>
              </div>
              {err && (err !== FIX_FIELDS || FIELDS.some((k) => errors[k])) && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{t(err)}</p>}
              {waiting && <p role="status" className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{t("Your application has been sent and is waiting for approval. Come back later, enter the same phone number and press the button again to get your card.")}</p>}
              <button type="submit" className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-dark to-brand px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/30 transition hover:brightness-110">{busy ? t("Saving...") : ready ? t("Update Card") : waiting ? t("Check Approval Status") : t("Apply for ID Card")}</button>
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
              <p className="mt-4 text-center text-sm text-ink/60">{ready ? t("Your card is ready. Download it from the buttons on the form.") : t("Fill the form and apply. Your ID number and the downloads are enabled once our team approves your application.")}</p>
            </div>
          </Reveal>
        </div>
      </section>
      <IssuedCards refresh={listTick} />
    </>
  );
}
