"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { arrangeImagesAction } from "@/app/invitatii-nunta-actions";
import type { ShopImage } from "@/lib/invitatii-nunta";

const CHUNK = 4 * 1024 * 1024;
const MAX_ZIP = 200 * 1024 * 1024;
const mb = (n: number) => `${(n / 1024 / 1024).toLocaleString("ro", { maximumFractionDigits: 1 })} MB`;

/** Trimite o bucată și spune cât a plecat din ea (pentru bara de progres). */
function sendChunk(url: string, body: Blob, onProgress: (sent: number) => void): Promise<{ ok: boolean; error?: string }> {
  return new Promise((done) => {
    const x = new XMLHttpRequest();
    x.open("POST", url);
    x.setRequestHeader("content-type", "application/octet-stream");
    x.upload.onprogress = (e) => onProgress(e.loaded);
    x.onload = () => {
      let error: string | undefined;
      try { error = JSON.parse(x.responseText).error; } catch { /* răspuns gol */ }
      done({ ok: x.status >= 200 && x.status < 300, error });
    };
    x.onerror = () => done({ ok: false, error: "Legătura s-a întrerupt." });
    x.send(body);
  });
}

/**
 * Urcarea ZIP-ului unui model: fișierul se taie în bucăți de 4 MB, trimise pe rând (fiecare încercată de 3 ori), cu bara de
 * progres; la sfârșit serverul le lipește, verifică ZIP-ul și abia apoi înlocuiește fișierul vechi.
 */
export function ZipUpload({ id, current }: { id: string; current: { name: string; size: number | null; files: number | null; at: string | null; version: number } | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);

  async function upload(file: File) {
    setMsg(null);
    if (!/\.zip$/i.test(file.name)) { setMsg({ error: "Alege un fișier .zip." }); return; }
    if (file.size > MAX_ZIP) { setMsg({ error: `Fișierul are ${mb(file.size)}; cel mult ${mb(MAX_ZIP)}.` }); return; }
    const upload = crypto.randomUUID();
    const parts = Math.ceil(file.size / CHUNK);
    setPct(0);
    try {
      for (let n = 0; n < parts; n++) {
        const blob = file.slice(n * CHUNK, Math.min(file.size, (n + 1) * CHUNK));
        let r: { ok: boolean; error?: string } = { ok: false };
        for (let tries = 0; tries < 3 && !r.ok; tries++) {
          r = await sendChunk(`/api/admin/invitatii-nunta/zip?pas=bucata&id=${encodeURIComponent(id)}&upload=${upload}&n=${n}`, blob,
            (sent) => setPct(Math.min(99, Math.round(((n * CHUNK + sent) / file.size) * 95))));
        }
        if (!r.ok) { setMsg({ error: r.error ?? "O bucată nu s-a putut trimite. Încearcă din nou." }); return; }
      }
      setPct(97);
      const res = await fetch("/api/admin/invitatii-nunta/zip?pas=gata", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, upload, parts, size: file.size }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ error: b.error ?? "Fișierul nu s-a putut verifica." }); return; }
      setPct(100);
      setMsg({ ok: `Gata: ZIP valid, ${b.files} fișiere (${b.pdfs} PDF), ${mb(file.size)}. De acum îl primesc cumpărătorii.` });
      router.refresh();
    } catch {
      setMsg({ error: "Urcarea s-a întrerupt. Încearcă din nou." });
    } finally {
      if (input.current) input.current.value = "";
      setTimeout(() => setPct(null), 1500);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Fișierul ZIP (privat)</h2>
      {current ? (
        <p>Acum: <b>{current.name}</b>{current.size ? `, ${mb(current.size)}` : ""}{current.files ? `, ${current.files} fișiere` : ""}{current.at ? `, urcat ${current.at}` : ""} (versiunea {current.version}).</p>
      ) : <p><b>Încă nu are ZIP.</b> Fără el, modelul nu se poate publica.</p>}
      <p className="muted">Fișierul nu e niciodată public: clienții îl primesc doar prin linkul de după plată. Un ZIP nou îl înlocuiește pe cel vechi pentru cumpărările de acum înainte; linkurile trimise deja (cele 30 de zile) merg mai departe și dau fișierul nou.</p>
      <label className="btn">
        {current ? "Înlocuiește ZIP-ul" : "Urcă ZIP-ul"}
        <input ref={input} type="file" accept=".zip,application/zip" hidden disabled={pct !== null} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
      </label>
      {pct !== null && (
        <div className="shopadm-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <span style={{ width: `${pct}%` }} /><b>{pct < 97 ? `${pct}%` : pct < 100 ? "Se verifică ZIP-ul…" : "100%"}</b>
        </div>
      )}
      {msg?.error && <p className="err" role="alert">{msg.error}</p>}
      {msg?.ok && <p className="cc-ok" role="status">{msg.ok}</p>}
    </div>
  );
}

/** Micșorează poza în browser: WebP (sau JPG, dacă browserul nu știe WebP), cel mult 1800 px pe latura mare. */
async function toWeb(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bmp.width * k));
  canvas.height = Math.max(1, Math.round(bmp.height * k));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const get = (type: string) => new Promise<Blob | null>((done) => canvas.toBlob(done, type, 0.85));
  const webp = await get("image/webp");
  const blob = webp?.type === "image/webp" ? webp : await get("image/jpeg");
  if (!blob) throw new Error("canvas");
  return { blob, width: canvas.width, height: canvas.height };
}

/**
 * Pozele de prezentare: se urcă (mai multe deodată, micșorate în browser), se trag cu mouse-ul în ordinea dorită (sau cu
 * săgețile, pe telefon) și se șterg. Prima poză e cea principală: pe listă, sus pe pagina modelului și în previzualizarea linkului.
 */
export function ImagesEditor({ id, images: initial }: { id: string; images: ShopImage[] }) {
  const router = useRouter();
  const [images, setImages] = useState(initial);
  const [seen, setSeen] = useState(initial.map((i) => i.src).join());
  if (initial.map((i) => i.src).join() !== seen) { setSeen(initial.map((i) => i.src).join()); setImages(initial); }
  const [drag, setDrag] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function save(next: ShopImage[], ok: string) {
    const prev = images;
    setImages(next); setMsg(null);
    const r = await arrangeImagesAction(id, next.map((i) => i.src)).catch(() => ({ error: "Nu s-a putut salva." }));
    if (r.error) { setImages(prev); setMsg({ error: r.error }); } else setMsg({ ok });
  }
  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    void save(next, to === 0 ? "Am pus poza pe primul loc (poza principală)." : "Am salvat ordinea.");
  };

  async function upload(files: FileList) {
    setMsg(null);
    let done = 0;
    for (const f of Array.from(files)) {
      setBusy(`Se urcă poza ${done + 1} din ${files.length}…`);
      try {
        const small = await toWeb(f);
        const fd = new FormData();
        fd.set("id", id); fd.set("width", String(small.width)); fd.set("height", String(small.height));
        fd.set("file", new File([small.blob], `poza.${small.blob.type === "image/webp" ? "webp" : "jpg"}`, { type: small.blob.type }));
        const res = await fetch("/api/admin/invitatii-nunta/poze", { method: "POST", body: fd });
        const b = await res.json().catch(() => ({}));
        if (!res.ok) { setMsg({ error: `${f.name}: ${b.error ?? "nu s-a putut urca."}` }); break; }
        done++;
      } catch {
        setMsg({ error: `${f.name}: browserul nu poate citi poza (merg JPG, PNG, WebP).` });
        break;
      }
    }
    setBusy(null);
    if (input.current) input.current.value = "";
    if (done) { setMsg((m) => m ?? { ok: done === 1 ? "Am adăugat poza." : `Am adăugat ${done} poze.` }); router.refresh(); }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Pozele de prezentare</h2>
      <p className="muted">Trage pozele în ordinea dorită; <b>prima e poza principală</b>. Se văd public pe site, deci folosește pozele cu semnul „MODEL”, nu fișierele de vânzare.</p>
      {images.length === 0 ? <p><b>Încă nu are nicio poză.</b> Fără una, modelul nu se poate publica.</p> : (
        <ol className="shopadm-photos">
          {images.map((img, i) => (
            <li key={img.src} draggable className={drag === i ? "dragging" : undefined}
              onDragStart={(e) => { setDrag(i); e.dataTransfer.effectAllowed = "move"; }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
              onDrop={(e) => { e.preventDefault(); if (drag !== null) move(drag, i); setDrag(null); }}
              onDragEnd={() => setDrag(null)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" width={img.width} height={img.height} draggable={false} />
              <span className={i === 0 ? "pill ok" : "pill"}>{i === 0 ? "principală" : i + 1}</span>
              <div className="shopadm-photo-tools">
                <button type="button" className="btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Mută mai în față">←</button>
                <button type="button" className="btn" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} aria-label="Mută mai în spate">→</button>
                <button type="button" className="btn" onClick={() => void save(images.filter((x) => x !== img), "Am șters poza.")} aria-label="Șterge poza">Șterge</button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <label className="btn">
        Adaugă poze
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={!!busy} onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); }} />
      </label>
      {busy && <p role="status">{busy}</p>}
      {msg?.error && <p className="err" role="alert">{msg.error}</p>}
      {msg?.ok && <p className="cc-ok" role="status">{msg.ok}</p>}
    </div>
  );
}
