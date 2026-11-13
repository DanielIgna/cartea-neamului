/**
 * „Raportează o problemă” (Daniel, 2026-11-13): omul din cont ne spune ce nu merge (o eroare, o legătură greșită în arbore,
 * o idee), cu până la 3 poze ale ecranului. Pagina din care a venit (și arborele sau fișa de acolo) se ține minte singură, ca
 * să nu-l punem pe el s-o explice. Pozele stau în bucket, la probleme/<id>/, și le vede doar el și adminul.
 * Adminul răspunde și marchează rezolvată din Admin → Probleme; răspunsul îl vede omul pe /problema (și pe email, dacă e pus Resend).
 */
import { randomUUID } from "node:crypto";
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { problemReport, treeMember, type ProblemImage } from "@/db/schema";
import { contactInbox } from "./contact";
import { sendMail } from "./extra";

export const PROBLEM_KINDS = ["eroare", "arbore", "idee", "altceva"] as const;
export type ProblemKind = (typeof PROBLEM_KINDS)[number];
export const PROBLEM_STATUSES = ["nou", "vazut", "rezolvat"] as const;
export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];

export const PROBLEM_LIMITS = {
  minMessage: 5,
  message: 4000,
  reply: 4000,
  images: 3,
  /** Toate pozele împreună, sub limita de 4,5 MB a unei cereri pe Vercel (pagina le micșorează înainte). */
  totalBytes: 4 * 1024 * 1024,
  perDay: 10,
} as const;

export const KIND_LABEL: Record<ProblemKind, string> = { eroare: "Ceva nu merge", arbore: "Legături greșite în arbore", idee: "O idee", altceva: "Altceva" };
export const STATUS_LABEL: Record<ProblemStatus, string> = { nou: "Nouă", vazut: "Văzută", rezolvat: "Rezolvată" };

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Primii octeți ai fișierului, ca să nu primim altceva botezat „.jpg”. */
export function looksLikeImage(b: Uint8Array) {
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const webp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  return jpeg ? "image/jpeg" : png ? "image/png" : webp ? "image/webp" : null;
}

/**
 * Pagina din care a venit omul, curățată: doar o cale din site („/arbore/…”), fără alt site, cel mult 300 de semne.
 * De acolo scoatem arborele și fișa, dacă e cazul.
 */
export function problemContext(raw: unknown): { page: string | null; treeId: string | null; personId: string | null } {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s.startsWith("/") || s.startsWith("//") || /[\s\\]/.test(s)) return { page: null, treeId: null, personId: null };
  const page = s.slice(0, 300);
  const path = page.split(/[?#]/)[0];
  const tree = new RegExp(`^/(?:arbore|mesaje)/(${UUID.source})`, "i").exec(path);
  const pers = new RegExp(`/persoana/(${UUID.source})`, "i").exec(path);
  return { page, treeId: tree ? tree[1].toLowerCase() : null, personId: pers ? pers[1].toLowerCase() : null };
}

export type ProblemInput = { kind: ProblemKind; message: string };
export function checkProblem(raw: { kind?: unknown; message?: unknown }): { ok: ProblemInput } | { problem: "message" | "tooLong" } {
  const kind = PROBLEM_KINDS.includes(raw.kind as ProblemKind) ? (raw.kind as ProblemKind) : "altceva";
  const message = typeof raw.message === "string" ? raw.message.replace(/\r\n/g, "\n").trim() : "";
  if (message.length < PROBLEM_LIMITS.minMessage) return { problem: "message" };
  if (message.length > PROBLEM_LIMITS.message) return { problem: "tooLong" };
  return { ok: { kind, message } };
}

export const problemImageKey = (reportId: string, type: string) =>
  `probleme/${reportId}/${randomUUID()}.${type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg"}`;

/** Câte a trimis omul în ultimele 24 de ore (ca să nu se poată umple baza de date). */
export async function reportsToday(db: Pick<Db, "select">, userId: string, now = new Date()) {
  const [r] = await db.select({ n: count() }).from(problemReport)
    .where(and(eq(problemReport.userId, userId), gte(problemReport.createdAt, new Date(now.getTime() - 86_400_000))));
  return Number(r?.n ?? 0);
}

/** Arborele se ține minte doar dacă omul e chiar în el (o adresă scrisă de mână nu ne arată arborii altora). */
export async function memberTree(db: Pick<Db, "select">, userId: string, treeId: string | null) {
  if (!treeId) return null;
  const [m] = await db.select({ id: treeMember.treeId }).from(treeMember).where(and(eq(treeMember.treeId, treeId), eq(treeMember.userId, userId)));
  return m ? treeId : null;
}

export async function myReports(db: Pick<Db, "select">, userId: string) {
  return db.select().from(problemReport).where(eq(problemReport.userId, userId)).orderBy(desc(problemReport.createdAt)).limit(50);
}

/** Câte răspunsuri noi n-a văzut încă omul (pentru semnul din meniu). */
export async function unseenReplies(db: Pick<Db, "select">, userId: string) {
  const [r] = await db.select({ n: count() }).from(problemReport)
    .where(and(eq(problemReport.userId, userId), isNotNull(problemReport.repliedAt), isNull(problemReport.replySeenAt)));
  return Number(r?.n ?? 0);
}

export async function markRepliesSeen(db: Pick<Db, "update">, userId: string, now = new Date()) {
  await db.update(problemReport).set({ replySeenAt: now })
    .where(and(eq(problemReport.userId, userId), isNotNull(problemReport.repliedAt), isNull(problemReport.replySeenAt)));
}

/** Câte probleme noi așteaptă în Admin. */
export async function newReportsCount(db: Pick<Db, "select">) {
  const [r] = await db.select({ n: count() }).from(problemReport).where(eq(problemReport.status, "nou"));
  return Number(r?.n ?? 0);
}

/** Adminul răspunde și/sau schimbă starea. Un răspuns nou se arată omului ca „nou” până deschide pagina. */
export async function answerReport(db: Pick<Db, "update" | "select">, id: string, input: { reply?: string | null; status?: ProblemStatus }, now = new Date()) {
  const [cur] = await db.select({ reply: problemReport.reply, status: problemReport.status }).from(problemReport).where(eq(problemReport.id, id));
  if (!cur) return null;
  const set: Partial<typeof problemReport.$inferInsert> = {};
  const reply = input.reply === undefined ? undefined : (input.reply ?? "").trim().slice(0, PROBLEM_LIMITS.reply) || null;
  const replyChanged = reply !== undefined && reply !== cur.reply;
  if (replyChanged) Object.assign(set, { reply, repliedAt: reply ? now : null, replySeenAt: null });
  let status = input.status ?? cur.status;
  if (replyChanged && reply && status === "nou") status = "vazut";
  if (status !== cur.status) Object.assign(set, { status, resolvedAt: status === "rezolvat" ? now : null });
  if (Object.keys(set).length) await db.update(problemReport).set(set).where(eq(problemReport.id, id));
  return { replyChanged: replyChanged && !!reply, status };
}

/** La ștergerea contului: cheile pozelor lui, ca să se șteargă și fișierele (rândurile pleacă odată cu contul). */
export async function userProblemKeys(db: Pick<Db, "select">, userId: string): Promise<string[]> {
  const rows = await db.select({ images: problemReport.images }).from(problemReport).where(eq(problemReport.userId, userId));
  return rows.flatMap((r) => (r.images ?? []).map((i) => i.key));
}

/** Rapoartele vechi rezolvate (peste 12 luni) se șterg; întoarce cheile pozelor lor. */
export async function dropOldResolved(db: Pick<Db, "select" | "delete">, now = new Date()) {
  const cutoff = new Date(now.getTime() - 365 * 86_400_000);
  const rows = await db.select({ id: problemReport.id, images: problemReport.images }).from(problemReport)
    .where(and(eq(problemReport.status, "rezolvat"), sql`${problemReport.resolvedAt} < ${cutoff}`));
  if (!rows.length) return [];
  await db.delete(problemReport).where(inArray(problemReport.id, rows.map((r) => r.id)));
  return rows.flatMap((r) => (r.images ?? []).map((i) => i.key));
}

/** Emailul către noi când vine o problemă nouă. Fără Resend nu pleacă nimic: problema stă oricum în Admin → Probleme. */
export async function notifyNewProblem(r: { id: string; kind: ProblemKind; message: string; page: string | null; images: ProblemImage[] }, who: { name: string; email: string }, site: string) {
  const text = [
    `${who.name || who.email} (${who.email}) a raportat o problemă: ${KIND_LABEL[r.kind]}.`,
    "",
    r.message,
    "",
    r.page ? `Pagina: ${site}${r.page}` : "",
    r.images.length ? `Poze atașate: ${r.images.length}` : "",
    "",
    `Vezi și răspunde: ${site}/admin/probleme#p-${r.id}`,
  ].filter((l, i, a) => l || a[i - 1]).join("\n");
  return sendMail(contactInbox(), `Problemă raportată: ${KIND_LABEL[r.kind]}`, text);
}

/** Emailul către om când îi răspundem. Textul e scurt și în limba lui (vine gata tradus de la pagină). */
export async function notifyReply(to: string, t: { subject: string; body: string; link: string }, reply: string) {
  return sendMail(to, t.subject, [t.body, "", reply, "", t.link].join("\n"));
}
