/** One-page PDF holding a JPEG, `wPt` x `hPt` points big. No library needed. */
export function jpegToPdf(jpeg: Uint8Array, pxW: number, pxH: number, wPt: number, hPt: number): Blob {
  const enc = new TextEncoder(), parts: (string | Uint8Array)[] = [], offs: number[] = [];
  let len = 0;
  const add = (p: string | Uint8Array) => { parts.push(p); len += typeof p === "string" ? enc.encode(p).length : p.length; };
  const obj = (n: number, body: string) => { offs[n] = len; add(`${n} 0 obj\n${body}\nendobj\n`); };
  add("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offs[4] = len;
  add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  add(jpeg); add("\nendstream\nendobj\n");
  const content = `q ${wPt} 0 0 ${hPt} 0 0 cm /Im0 Do Q`;
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const xref = len;
  add(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map((n) => String(offs[n]).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}

/** Saves a blob as a file download. */
export function saveBlob(b: Blob, filename: string) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
