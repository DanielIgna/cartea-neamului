/**
 * Arhiva sigilată (Daniel, 2026-11-14, varianta B, cu „5 ani arhiva și un an fără plată original”).
 *
 * După anul plătit, dacă nimeni din arbore nu mai are an plătit sau Păstrare:
 * - originalele pozelor și ale actelor scanate mai stau întregi `freeYears` (1 an) de la sfârșitul anului;
 * - cu cartea PDF a arborelui (orice plată „carte” pentru el: cumpărată, în pachet sau inclusă în plan), la sfârșitul acelui an
 *   totul trece comprimat în arhivă (pozele ca AVIF, glasurile și actele cum sunt), păstrat `sealYears` (5 ani) de la cumpărare;
 *   online rămân arborele și pozele în mic, iar la o nouă plată totul se deschide din nou întreg, pe loc, din arhivă;
 * - fără carte (sau după cei 5 ani), rămân doar pozele în mic; glasurile, actele PDF, numele, datele și textele rămân.
 * Înainte de mutare se trimit emailuri la 30 și 7 zile, înainte de micșorare la 90, 30 și 7 zile, titularului și celor care au
 * încărcat ceva în arbore. Fără email trimis, nu se face nimic. Conturile făcute înainte de pornirea regulilor păstrează
 * promisiunea de atunci: nu se șterge nimic. Descărcarea (Arhiva mea, Datele mele) și ștergerea rămân gratuite, oricând.
 */
import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { appSetting, archivePlan, document, payment, tree, treeMember, user } from "@/db/schema";
import { isLocale } from "@/i18n/locales";
import { getAppName, getT } from "@/i18n/server";
import { sendMail } from "./extra";
import { holdsYear, isKept, planSettings } from "./plans";
import { userAccess } from "./plata";
import { SITE_URL } from "./site-url";
import { ARCHIVE_PREFIX, deleteObjects, getObjectBytes, isArchiveKey, putObject } from "./storage";

const DAY = 86_400_000;
const YEAR = 365 * DAY;

/* ---------- Setările (Admin → Arhivă) ---------- */

export const ArchiveSettings = z.object({
  on: z.boolean().catch(false),
  from: z.string().datetime().nullable().catch(null),
  freeYears: z.coerce.number().int().min(1).max(10),
  sealYears: z.coerce.number().int().min(1).max(30),
});
export type ArchiveSettings = z.infer<typeof ArchiveSettings>;
export const DEFAULT_ARCHIVE: ArchiveSettings = { on: false, from: null, freeYears: 1, sealYears: 5 };
const KEY = "arhivare";

export async function archiveSettings(db: Pick<Db, "select">): Promise<ArchiveSettings> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY));
  const parsed = ArchiveSettings.safeParse({ ...DEFAULT_ARCHIVE, ...(row?.value as object | undefined) });
  return parsed.success ? parsed.data : DEFAULT_ARCHIVE;
}

/**
 * Ziua pornirii se ține minte la pornire și se uită la oprire, ca la plăți: cine își face cont cât regulile sunt oprite a citit
 * în Termeni promisiunea veche („nu se șterge nimic”), așa că la o nouă pornire intră și el la „regula de atunci”.
 */
export async function saveArchiveSettings(db: Pick<Db, "insert" | "select">, v: Omit<ArchiveSettings, "from">, by: string | null, now = new Date()) {
  const before = await archiveSettings(db);
  const value: ArchiveSettings = { ...v, from: v.on ? (before.on && before.from ? before.from : now.toISOString()) : null };
  await db.insert(appSetting).values({ key: KEY, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
  return value;
}

/* ---------- Starea unui arbore ---------- */

export type ArchiveEvent = "arhivare" | "reducere";
/** Cu câte zile înainte trimitem emailurile. */
export const NOTICE_DAYS: Record<ArchiveEvent, number[]> = { arhivare: [30, 7], reducere: [90, 30, 7] };

export type TreeArchiveState =
  | { kind: "oprit" } // regulile nu sunt pornite
  | { kind: "vechi" } // contul titularului e dinainte de reguli: nu se șterge nimic
  | { kind: "tinut" } // cineva din arbore are anul, Păstrarea sau zilele gratuite
  | { kind: "liber"; freeEnd: Date; sealedUntil: Date | null; next: { event: ArchiveEvent; at: Date } } // originalele online încă
  | { kind: "sigilat"; sealedUntil: Date; next: { event: ArchiveEvent; at: Date } } // în arhiva sigilată
  | { kind: "redus" } // au rămas pozele în mic
  | { kind: "nimic" }; // nimic de mutat sau de micșorat (de pildă doar glasuri)

/** Ultima zi a arhivei sigilate, după cea mai nouă carte PDF plătită pentru arbore (sau null). */
export async function sealedUntil(db: Pick<Db, "select">, treeId: string, s: ArchiveSettings): Promise<Date | null> {
  const [b] = await db.select({ at: payment.createdAt }).from(payment)
    .where(and(eq(payment.treeId, treeId), eq(payment.kind, "carte"))).orderBy(desc(payment.createdAt)).limit(1);
  return b ? new Date(b.at.getTime() + s.sealYears * YEAR) : null;
}

/**
 * Ce urmează pentru arbore. „Ținut” e dacă oricine din arbore are anul (plătit, beta, gratuit mereu), Păstrarea sau e încă în
 * zilele gratuite: arborele e al familiei, nu doar al titularului.
 */
export async function treeArchiveState(db: Db, treeId: string, s: ArchiveSettings, now = new Date()): Promise<TreeArchiveState> {
  if (!s.on || !s.from) return { kind: "oprit" };
  const [t] = await db.select({ ownerId: tree.ownerId, createdAt: user.createdAt }).from(tree).leftJoin(user, eq(user.id, tree.ownerId)).where(eq(tree.id, treeId));
  if (!t?.ownerId || !t.createdAt || t.createdAt < new Date(s.from)) return { kind: "vechi" };
  const owner = (await userAccess(db, t.ownerId, now)).access;
  if (owner.kind !== "expirat" || isKept(owner)) return { kind: "tinut" };
  const members = await db.select({ id: treeMember.userId }).from(treeMember).where(eq(treeMember.treeId, treeId));
  for (const m of members) {
    if (m.id === t.ownerId) continue;
    const a = (await userAccess(db, m.id, now)).access;
    if (holdsYear(a) || isKept(a)) return { kind: "tinut" };
  }
  const freeEnd = new Date(owner.since.getTime() + s.freeYears * YEAR);
  const sealed = await sealedUntil(db, treeId, s);
  const sealedLater = sealed && sealed > freeEnd ? sealed : null;
  const left = await pendingDocs(db, treeId);
  const endAt = sealedLater ?? freeEnd;
  if (now >= endAt) {
    // Timpul originalelor (și al arhivei) a trecut: urmează micșorarea pozelor, dacă mai sunt.
    if (left.images) return { kind: "liber", freeEnd, sealedUntil: sealedLater, next: { event: "reducere", at: endAt } };
    return left.reduced ? { kind: "redus" } : { kind: "nimic" };
  }
  if (sealedLater && now >= freeEnd && !left.live) return { kind: "sigilat", sealedUntil: sealedLater, next: { event: "reducere", at: sealedLater } };
  if (sealedLater && left.live) return { kind: "liber", freeEnd, sealedUntil: sealedLater, next: { event: "arhivare", at: freeEnd } };
  if (!sealedLater && !left.images) return { kind: "nimic" };
  return { kind: "liber", freeEnd, sealedUntil: sealedLater, next: { event: "reducere", at: endAt } };
}

const isImage = (mime: string | null) => !!mime && mime.startsWith("image/");

/** Câte fișiere mai sunt online neatinse (`live`), câte poze nemicșorate (online sau în arhivă) și câte micșorate. */
async function pendingDocs(db: Pick<Db, "select">, treeId: string) {
  const rows = await db.select({ fileKey: document.fileKey, mimeType: document.mimeType, reducedAt: document.reducedAt }).from(document)
    .where(and(eq(document.treeId, treeId), isNotNull(document.fileKey)));
  let live = 0, images = 0, reduced = 0;
  for (const r of rows) {
    if (r.reducedAt) { reduced++; continue; }
    if (!isArchiveKey(r.fileKey!)) live++;
    if (isImage(r.mimeType)) images++;
  }
  return { live, images, reduced };
}

/* ---------- Mutarea în arhivă și micșorarea ---------- */

type Doc = { id: string; fileKey: string; mimeType: string | null; previewKey: string | null };
const sharpLib = async () => (await import("sharp")).default;

/** Poza în mic (cel mult 480 px, JPEG): se vede online în locul originalului. */
async function makePreview(bytes: Uint8Array) {
  const sharp = await sharpLib();
  return new Uint8Array(await sharp(Buffer.from(bytes)).rotate().resize(480, 480, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer());
}

/**
 * Un fișier trece în arhivă: pozele (nu și GIF-urile) recomprimate ca AVIF, dacă ies mai mici; restul așa cum sunt. Întâi scriem
 * și verificăm copia din arhivă, apoi schimbăm rândul, abia apoi ștergem originalul.
 */
export async function archiveDoc(db: Db, d: Doc, now = new Date()) {
  if (isArchiveKey(d.fileKey)) return false;
  const bytes = await getObjectBytes(d.fileKey);
  let body = bytes, mime = d.mimeType ?? "application/octet-stream", key = ARCHIVE_PREFIX + d.fileKey, previewKey = d.previewKey;
  if (isImage(d.mimeType)) {
    if (!previewKey) {
      previewKey = `${d.fileKey}.mic.jpg`;
      await putObject(previewKey, await makePreview(bytes), "image/jpeg");
    }
    if (d.mimeType !== "image/gif") {
      try {
        const sharp = await sharpLib();
        const avif = new Uint8Array(await sharp(Buffer.from(bytes)).rotate().avif({ quality: 60, effort: 4 }).toBuffer());
        if (avif.length < bytes.length) { body = avif; mime = "image/avif"; key = `${key}.avif`; }
      } catch (e) { console.error("arhivare: avif", d.id, e); }
    }
  }
  await putObject(key, body, mime);
  const check = await getObjectBytes(key);
  if (check.length !== body.length) throw new Error(`arhiva: copia fișierului ${d.id} nu se potrivește`);
  await db.update(document).set({ fileKey: key, mimeType: mime, previewKey, archivedAt: now }).where(and(eq(document.id, d.id), eq(document.fileKey, d.fileKey)));
  await deleteObjects([d.fileKey]);
  return true;
}

/** O poză (sau un act scanat) rămâne doar în mic. Glasurile, PDF-urile și celelalte fișiere nu se ating. */
export async function reduceDoc(db: Db, d: Doc, now = new Date()) {
  if (!isImage(d.mimeType)) return false;
  let previewKey = d.previewKey;
  if (!previewKey) {
    previewKey = `${d.fileKey.replace(/^arhiva\//, "")}.mic.jpg`;
    await putObject(previewKey, await makePreview(await getObjectBytes(d.fileKey)), "image/jpeg");
  }
  await db.update(document).set({ fileKey: previewKey, mimeType: "image/jpeg", previewKey, reducedAt: now }).where(and(eq(document.id, d.id), eq(document.fileKey, d.fileKey)));
  if (d.fileKey !== previewKey) await deleteObjects([d.fileKey]);
  return true;
}

/** Fișierele unui arbore la care mai e ceva de făcut pentru eveniment, câte `limit` deodată. */
async function docsFor(db: Pick<Db, "select">, treeId: string, event: ArchiveEvent, limit: number): Promise<Doc[]> {
  const rows = await db.select({ id: document.id, fileKey: document.fileKey, mimeType: document.mimeType, previewKey: document.previewKey }).from(document)
    .where(and(eq(document.treeId, treeId), isNotNull(document.fileKey), isNull(document.reducedAt),
      event === "arhivare" ? sql`${document.fileKey} not like 'arhiva/%'` : sql`${document.mimeType} like 'image/%'`))
    .limit(limit);
  return rows as Doc[];
}

/* ---------- Anunțurile ---------- */

type Mailer = (to: string, subject: string, text: string) => Promise<boolean>;

/** Titularul și cei care au încărcat fișiere în arbore, cu limba lor. Titularul e primul. */
async function recipients(db: Db, treeId: string) {
  const [t] = await db.select({ ownerId: tree.ownerId, name: tree.name }).from(tree).where(eq(tree.id, treeId));
  const up = await db.selectDistinct({ id: document.uploadedBy }).from(document).where(and(eq(document.treeId, treeId), isNotNull(document.uploadedBy)));
  const ids = [...new Set([t?.ownerId, ...up.map((u) => u.id)].filter((x): x is string => !!x))];
  const people = ids.length ? await db.select({ id: user.id, name: user.name, email: user.email, locale: user.locale }).from(user).where(inArray(user.id, ids)) : [];
  people.sort((a, b) => Number(b.id === t?.ownerId) - Number(a.id === t?.ownerId));
  return { treeName: t?.name ?? "", ownerId: t?.ownerId ?? null, people };
}

async function sendNotice(db: Db, treeId: string, event: ArchiveEvent, due: Date, days: number, s: ArchiveSettings, mail: Mailer) {
  const { treeName, ownerId, people } = await recipients(db, treeId);
  const ps = await planSettings(db);
  let ownerOk = false;
  for (const p of people) {
    const locale = isLocale(p.locale) ? p.locale : "ro";
    const [t, app] = await Promise.all([getT("ArchiveMail", locale), getAppName(locale)]);
    const lei = locale === "ro";
    const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(due);
    const vars = {
      name: p.name, app, tree: treeName, date, days, years: s.sealYears, link: `${SITE_URL}/arhiva`,
      keep: lei ? `${ps.keepLei} lei` : `${ps.keepEur} €`, book: lei ? `${ps.bookLei} lei` : `${ps.bookEur} €`,
    };
    const ok = await mail(p.email, t(`${event}.subject`, vars), t(`${event}.body`, vars)).catch(() => false);
    if (p.id === ownerId) ownerOk = ok;
  }
  return ownerOk;
}

/* ---------- Rularea zilnică ---------- */

export type ArchiveRun = { trees: number; notices: number; archived: number; reduced: number; waiting: number; skipped: string | null };

/**
 * Trece prin arborii cu fișiere și face pasul care e la rând: trimite anunțul scadent sau, după ultimul anunț și termenul lui,
 * mută în arhivă ori micșorează (câte `batch` fișiere pe rulare, restul a doua zi). Ziua unei acțiuni nu vine niciodată mai devreme
 * decât primul anunț + cel mai lung termen (90 sau 30 de zile), chiar dacă regulile s-au pornit târziu.
 */
export async function runArchive(db: Db, now = new Date(), opts: { mail?: Mailer; batch?: number } = {}): Promise<ArchiveRun> {
  const s = await archiveSettings(db);
  const out: ArchiveRun = { trees: 0, notices: 0, archived: 0, reduced: 0, waiting: 0, skipped: null };
  if (!s.on) return { ...out, skipped: "regulile arhivei sunt oprite (Admin → Arhivă)" };
  const mail = opts.mail ?? ((to, subject, text) => sendMail(to, subject, text));
  let budget = opts.batch ?? 150;
  const trees = await db.selectDistinct({ id: document.treeId }).from(document).where(and(isNotNull(document.fileKey), isNull(document.reducedAt)));
  for (const { id } of trees) {
    const st = await treeArchiveState(db, id, s, now);
    const plans = await db.select().from(archivePlan).where(eq(archivePlan.treeId, id));
    if (st.kind !== "liber" && st.kind !== "sigilat") {
      // Familia a reînnoit (sau nu mai e nimic de făcut): anunțurile și pașii neterminați se uită; la o nouă expirare se iau de la capăt.
      if (plans.length && st.kind === "tinut") await db.delete(archivePlan).where(eq(archivePlan.treeId, id));
      continue;
    }
    out.trees++;
    const { event, at } = st.next;
    const offsets = NOTICE_DAYS[event];
    const longest = Math.max(...offsets), shortest = Math.min(...offsets);
    // Un pas început pentru alt eveniment (de pildă micșorarea, iar între timp s-a cumpărat cartea) sau pentru o zi mai devreme
    // decât cea de acum (cartea a prelungit termenul) se uită și se ia de la capăt cu ziua nouă.
    for (const p of plans) {
      if (p.doneAt) continue;
      if (p.event !== event || p.dueAt < at) await db.delete(archivePlan).where(and(eq(archivePlan.treeId, id), eq(archivePlan.event, p.event)));
    }
    let row = (await db.select().from(archivePlan).where(and(eq(archivePlan.treeId, id), eq(archivePlan.event, event))))[0];
    if (row?.doneAt) continue;
    if (!row) {
      if (now.getTime() < at.getTime() - longest * DAY) continue; // prea devreme pentru primul anunț
      const due = new Date(Math.max(at.getTime(), now.getTime() + longest * DAY));
      if (!(await sendNotice(db, id, event, due, Math.round((due.getTime() - now.getTime()) / DAY), s, mail))) { out.waiting++; continue; }
      out.notices++;
      await db.insert(archivePlan).values({ treeId: id, event, dueAt: due, notices: { [longest]: now.toISOString() }, createdAt: now }).onConflictDoNothing();
      continue;
    }
    const sent = row.notices as Record<string, string>;
    // Anunțul următor: cel mai scurt termen ajuns (cele sărite, dacă ceasul n-a mers câteva zile, se socotesc trimise odată cu el).
    const dueNow = offsets.filter((o) => !sent[o] && now.getTime() >= row.dueAt.getTime() - o * DAY);
    if (dueNow.length) {
      const o = Math.min(...dueNow);
      if (await sendNotice(db, id, event, row.dueAt, Math.max(1, Math.round((row.dueAt.getTime() - now.getTime()) / DAY)), s, mail)) {
        const next = { ...sent };
        for (const x of dueNow) next[x] = x === o ? now.toISOString() : "sarit";
        await db.update(archivePlan).set({ notices: next }).where(and(eq(archivePlan.treeId, id), eq(archivePlan.event, event)));
        out.notices++;
      } else out.waiting++;
      continue;
    }
    const last = sent[shortest];
    if (now < row.dueAt || !last || last === "sarit" || now.getTime() < new Date(last).getTime() + shortest * DAY) continue;
    // E ziua: mutăm sau micșorăm, câte puțin pe rulare.
    if (budget <= 0) { out.waiting++; continue; }
    const docs = await docsFor(db, id, event, budget);
    for (const d of docs) {
      try {
        const done = event === "arhivare" ? await archiveDoc(db, d, now) : await reduceDoc(db, d, now);
        if (done) { if (event === "arhivare") out.archived++; else out.reduced++; }
      } catch (e) { console.error("arhivare", id, d.id, e); }
      budget--;
    }
    if ((await docsFor(db, id, event, 1)).length === 0) {
      await db.update(archivePlan).set({ doneAt: now }).where(and(eq(archivePlan.treeId, id), eq(archivePlan.event, event)));
      row = { ...row, doneAt: now };
    }
  }
  return out;
}

/* ---------- Pentru om și pentru Admin ---------- */

/** Regulile noi i se aplică omului? (pornite și cont făcut din ziua pornirii). Întoarce setările sau null. */
export async function archiveAppliesTo(db: Db, userId: string) {
  const s = await archiveSettings(db);
  if (!s.on || !s.from) return null;
  const [u] = await db.select({ createdAt: user.createdAt }).from(user).where(eq(user.id, userId));
  return u && u.createdAt >= new Date(s.from) ? s : null;
}

/** Ce îi spunem omului despre arborii lui (Arhiva mea, banda de sus). Doar arborii în care e titular. */
export async function myArchiveNotes(db: Db, userId: string, now = new Date()) {
  const s = await archiveSettings(db);
  if (!s.on) return [];
  const owned = await db.select({ id: tree.id, name: tree.name }).from(tree).where(eq(tree.ownerId, userId));
  const out: { treeId: string; name: string; state: TreeArchiveState }[] = [];
  for (const t of owned) {
    const state = await treeArchiveState(db, t.id, s, now);
    if (state.kind === "liber" || state.kind === "sigilat" || state.kind === "redus") out.push({ treeId: t.id, name: t.name, state });
  }
  return out;
}

/** Cifrele pentru Admin → Arhivă. */
export async function archiveOverview(db: Db, now = new Date()) {
  const s = await archiveSettings(db);
  const r = await db.execute(sql`select
      count(*) filter (where file_key like 'arhiva/%' and reduced_at is null)::int as archived,
      count(*) filter (where reduced_at is not null)::int as reduced,
      count(*) filter (where file_key is not null and file_key not like 'arhiva/%' and reduced_at is null)::int as live
    from document`);
  const counts = (r.rows?.[0] ?? {}) as { archived?: number; reduced?: number; live?: number };
  const plans = await db.select({ treeId: archivePlan.treeId, event: archivePlan.event, dueAt: archivePlan.dueAt, notices: archivePlan.notices, doneAt: archivePlan.doneAt, name: tree.name })
    .from(archivePlan).innerJoin(tree, eq(tree.id, archivePlan.treeId)).orderBy(archivePlan.dueAt).limit(200);
  return { settings: s, counts: { archived: Number(counts.archived ?? 0), reduced: Number(counts.reduced ?? 0), live: Number(counts.live ?? 0) }, plans, now };
}
