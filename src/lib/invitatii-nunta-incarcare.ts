/**
 * Urcarea ZIP-ului unui model din Admin (Daniel, 27.11.2026: fișiere de 50–60 MB, niciodată publice). Corpul unei cereri pe
 * Vercel are cel mult 4,5 MB, așa că pagina din Admin taie fișierul în bucăți de 4 MB și le trimite pe rând (cu bara de progres);
 * fiecare bucată stă în storage-ul privat, sub magazin/invitatii-nunta/_incarcari/. La sfârșit serverul le lipește, verifică că
 * rezultatul e un ZIP întreg (antetul, directorul central, fiecare fișier din el) și abia atunci îl pune la
 * magazin/invitatii-nunta/<slug>.zip, apoi șterge bucățile. Un ZIP stricat nu înlocuiește niciodată fișierul bun.
 */
import { randomUUID } from "node:crypto";
import type { Db } from "@/db";
import { deleteObjects, getObjectBytes, putObject } from "./storage";
import { PHOTO_PREFIX, PHOTO_ROUTE, SHOP_CATEGORIES, SHOP_STORAGE, productFileKey } from "./invitatii-nunta";
import { addImage, productById, setProductZip } from "./invitatii-nunta-produse";

export const CHUNK_BYTES = 4 * 1024 * 1024;
export const MAX_ZIP_BYTES = 200 * 1024 * 1024;
export const MAX_PARTS = Math.ceil(MAX_ZIP_BYTES / CHUNK_BYTES);
export const UPLOAD_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Locul fișierelor; în teste, o hartă în memorie. */
export type Store = {
  put: (key: string, body: Uint8Array, type: string) => Promise<unknown>;
  get: (key: string) => Promise<Uint8Array>;
  del: (keys: string[]) => Promise<unknown>;
};

export const chunkKey = (productId: string, uploadId: string, n: number) => `${SHOP_STORAGE}/_incarcari/${productId}/${uploadId}/${String(n).padStart(4, "0")}`;

/** O bucată din ZIP (numerotate de la 0). */
export async function putZipChunk(store: Store, productId: string, uploadId: string, n: number, body: Uint8Array) {
  if (!UPLOAD_ID_RE.test(uploadId)) return { ok: false as const, error: "Încărcarea nu e bună." };
  if (!Number.isInteger(n) || n < 0 || n >= MAX_PARTS) return { ok: false as const, error: "Bucata nu e bună." };
  if (!body.length || body.length > CHUNK_BYTES) return { ok: false as const, error: "Bucata e goală sau prea mare." };
  await store.put(chunkKey(productId, uploadId, n), body, "application/octet-stream");
  return { ok: true as const };
}

const u16 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u32 = (b: Uint8Array, i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16)) + b[i + 3] * 0x1000000;
const u64 = (b: Uint8Array, i: number) => u32(b, i) + u32(b, i + 4) * 0x100000000;
const sig = (b: Uint8Array, i: number, s: number) => i >= 0 && i + 4 <= b.length && u32(b, i) === s;

/**
 * E un ZIP întreg? Începe cu antetul unui fișier (PK\x03\x04), are la sfârșit „end of central directory” (și ZIP64, pentru
 * fișierele mari), iar fiecare intrare din directorul central arată spre un fișier care chiar e acolo. Întoarce și câte fișiere
 * și câte PDF-uri are, ca Admin-ul să le arate.
 */
export function inspectZip(b: Uint8Array): { ok: true; files: number; pdfs: number } | { ok: false; error: string } {
  const bad = (error: string) => ({ ok: false as const, error });
  if (b.length < 30 || !sig(b, 0, 0x04034b50)) return bad("Fișierul nu e un ZIP (nu începe ca o arhivă ZIP).");
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 0xffff); i--) if (sig(b, i, 0x06054b50)) { eocd = i; break; }
  if (eocd < 0) return bad("Arhiva ZIP e tăiată: îi lipsește sfârșitul. Încearcă din nou.");
  let entries = u16(b, eocd + 10), cdSize = u32(b, eocd + 12), cdOffset = u32(b, eocd + 16);
  let end = eocd;
  if (entries === 0xffff || cdOffset === 0xffffffff || cdSize === 0xffffffff) {
    const loc = eocd - 20;
    if (!sig(b, loc, 0x07064b50)) return bad("Arhiva ZIP64 nu are locatorul ei.");
    const z = u64(b, loc + 8);
    if (!sig(b, z, 0x06064b50)) return bad("Arhiva ZIP64 e stricată.");
    entries = u64(b, z + 32); cdSize = u64(b, z + 40); cdOffset = u64(b, z + 48); end = z;
  }
  if (!entries) return bad("Arhiva ZIP e goală.");
  if (cdOffset + cdSize > end) return bad("Directorul arhivei ZIP e stricat.");
  let p = cdOffset, files = 0, pdfs = 0;
  for (let k = 0; k < entries; k++) {
    if (!sig(b, p, 0x02014b50)) return bad("Directorul arhivei ZIP e stricat.");
    const nameLen = u16(b, p + 28), extraLen = u16(b, p + 30), commentLen = u16(b, p + 32);
    let local = u32(b, p + 42);
    if (local === 0xffffffff) {
      // ZIP64: offsetul e în câmpul extra (id 0x0001), după mărimile care sunt și ele 0xffffffff.
      let q = p + 46 + nameLen;
      const stop = q + extraLen;
      while (q + 4 <= stop) {
        const id = u16(b, q), len = u16(b, q + 2);
        if (id === 1) {
          let o = q + 4;
          if (u32(b, p + 24) === 0xffffffff) o += 8;
          if (u32(b, p + 20) === 0xffffffff) o += 8;
          local = u64(b, o);
          break;
        }
        q += 4 + len;
      }
    }
    if (!sig(b, local, 0x04034b50)) return bad("Un fișier din arhiva ZIP lipsește sau e stricat.");
    const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nameLen));
    if (!name.endsWith("/")) { files++; if (/\.pdf$/i.test(name)) pdfs++; }
    p += 46 + nameLen + extraLen + commentLen;
  }
  if (!files) return bad("Arhiva ZIP n-are niciun fișier.");
  return { ok: true, files, pdfs };
}

/** Numele fișierului primit de client: invitatie-nunta-<slug>.zip (accesorii-nunta-<slug>.zip, jurnal-<slug>.pdf…). */
export const zipDownloadName = (slug: string, category: keyof typeof SHOP_CATEGORIES = "invitatie", ext: "zip" | "pdf" = "zip") =>
  `${SHOP_CATEGORIES[category].fileName(slug)}.${ext}`;

/**
 * E un PDF întreg? Începe cu „%PDF-” și are „%%EOF” în ultimii 2 KB (un fișier tăiat la urcare nu îl are). Întoarce și câte
 * pagini are, numărate grosier după „/Type /Page” (doar pentru Admin).
 */
export function inspectPdf(b: Uint8Array): { ok: true; pages: number } | { ok: false; error: string } {
  const head = new TextDecoder("latin1").decode(b.subarray(0, 8));
  if (!head.startsWith("%PDF-")) return { ok: false, error: "Fișierul nu e un PDF și nici un ZIP." };
  const tail = new TextDecoder("latin1").decode(b.subarray(Math.max(0, b.length - 2048)));
  if (!tail.includes("%%EOF")) return { ok: false, error: "PDF-ul e tăiat: îi lipsește sfârșitul. Încearcă din nou." };
  const pages = (new TextDecoder("latin1").decode(b).match(/\/Type\s*\/Page(?![a-z])/g) ?? []).length;
  return { ok: true, pages };
}

/**
 * Lipește bucățile, verifică ZIP-ul și îl pune în locul celui vechi. Bucățile se șterg oricum, și la reușită și la greșeală.
 */
export async function finishZipUpload(db: Db, store: Store, o: { productId: string; uploadId: string; parts: number; size: number }, now = new Date()) {
  const p = await productById(db, o.productId);
  if (!p) return { ok: false as const, error: "Modelul nu există." };
  if (!UPLOAD_ID_RE.test(o.uploadId)) return { ok: false as const, error: "Încărcarea nu e bună." };
  if (!Number.isInteger(o.parts) || o.parts < 1 || o.parts > MAX_PARTS || !Number.isInteger(o.size) || o.size < 1 || o.size > MAX_ZIP_BYTES) {
    return { ok: false as const, error: `Fișierul trebuie să aibă cel mult ${MAX_ZIP_BYTES / 1024 / 1024} MB.` };
  }
  const keys = Array.from({ length: o.parts }, (_, n) => chunkKey(o.productId, o.uploadId, n));
  try {
    const all = new Uint8Array(o.size);
    let at = 0;
    for (const k of keys) {
      const part = await store.get(k);
      if (at + part.length > o.size) return { ok: false as const, error: "Fișierul a ajuns mai mare decât trebuia. Încearcă din nou." };
      all.set(part, at);
      at += part.length;
    }
    if (at !== o.size) return { ok: false as const, error: "Fișierul n-a ajuns întreg. Încearcă din nou." };
    const cat = p.category ?? "invitatie";
    // La jurnale merge și un singur PDF, nu doar un ZIP (Daniel, 28.11.2026: „e un PDF descărcabil”).
    const isPdf = SHOP_CATEGORIES[cat].file === "zip-pdf" && all[0] === 0x25 && all[1] === 0x50;
    const z = isPdf ? inspectPdf(all) : inspectZip(all);
    if (!z.ok) return z;
    const ext = isPdf ? "pdf" : "zip";
    const key = p.zipKey?.endsWith(`.${ext}`) ? p.zipKey : productFileKey(cat, p.slug, ext);
    await store.put(key, all, isPdf ? "application/pdf" : "application/zip");
    const files = "files" in z ? z.files : 1;
    await setProductZip(db, p.id, { name: zipDownloadName(p.slug, cat, ext), size: o.size, files, key }, now);
    // Fișierul vechi de alt fel (un ZIP înlocuit cu un PDF) nu mai trebuie.
    if (p.zipKey && p.zipKey !== key) await store.del([p.zipKey]).catch(() => {});
    return { ok: true as const, files, pdfs: "pdfs" in z ? z.pdfs : 1, size: o.size, kind: ext, ...("pages" in z ? { pages: z.pages } : {}) };
  } catch (e) {
    console.error("invitatii-nunta zip", e instanceof Error ? e.name : "Error");
    return { ok: false as const, error: "O bucată din fișier lipsește. Încearcă din nou." };
  } finally {
    await store.del(keys).catch(() => {});
  }
}

/* ---------- Pozele de prezentare ---------- */

/** Sub limita de 4,5 MB a corpului unei cereri; pagina din Admin micșorează poza în browser (WebP, cel mult 1800 px). */
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

/** Tipul pozei după primii octeți (JPG, PNG, WebP), nu după nume; altceva nu se primește. */
export function photoType(b: Uint8Array): "webp" | "jpg" | "png" | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (sig(b, 0, 0x46464952) && sig(b, 8, 0x50424557)) return "webp";
  return null;
}
export const PHOTO_MIME = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" } as const;

/** Urcă o poză de prezentare și o pune la sfârșitul listei modelului. */
export async function addProductPhoto(db: Db, store: Store, o: { productId: string; body: Uint8Array; width: number; height: number }, now = new Date()) {
  const p = await productById(db, o.productId);
  if (!p) return { ok: false as const, error: "Modelul nu există." };
  if (!o.body.length || o.body.length > MAX_PHOTO_BYTES) return { ok: false as const, error: "Poza e goală sau mai mare de 4 MB." };
  const type = photoType(o.body);
  if (!type) return { ok: false as const, error: "Merg doar poze JPG, PNG sau WebP." };
  const w = Math.round(o.width), h = Math.round(o.height);
  if (!(w >= 100 && w <= 6000 && h >= 100 && h <= 6000)) return { ok: false as const, error: "Poza e prea mică (cel puțin 100 px)." };
  const file = `${p.slug}-${randomUUID().slice(0, 8)}.${type}`;
  const key = `${PHOTO_PREFIX}${file}`;
  await store.put(key, o.body, PHOTO_MIME[type]);
  const r = await addImage(db, p.id, { src: `${PHOTO_ROUTE}/${file}`, width: w, height: h, key }, now);
  if (!r.ok) { await store.del([key]).catch(() => {}); return r; }
  return { ok: true as const, src: `${PHOTO_ROUTE}/${file}` };
}

/** Storage-ul adevărat (Neon), pentru rutele din Admin. */
export const storageStore: Store = { put: putObject, get: getObjectBytes, del: deleteObjects };
