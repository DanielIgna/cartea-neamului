/**
 * CRM-ul din Admin (Daniel, 17.11.2026; inventarul în docs/crm-inventar.md). Ține evidența instituțiilor și firmelor cu care
 * vorbim (școli, firme, asociații din diaspora, presă...), a tot ce s-a întâmplat cu ele și a listei „nu contacta”.
 *
 * Reguli care nu se negociază:
 * - organizațiile au doar date oficiale publice (secretariat, office, contact); persoanele de contact doar dacă și-au dat singure datele;
 * - lista „nu contacta” (crm_suppression: adresă sau domeniu întreg) se verifică înainte de orice trimitere de marketing;
 * - aplicația NU trimite emailurile de prospectare; doar le înregistrează (import CSV sau ingestia cu token);
 * - conturile de test și demo nu intră în nicio cifră.
 */
import { createHash } from "node:crypto";
import { and, eq, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { crmActivities, crmOrganizations, crmSuppression } from "@/db/schema";
import { DEMO_EMAIL } from "./demo";
import { realAccountSql } from "./conturi-test";

/* ---------- Valori permise ---------- */

export const ORG_TYPES = ["scoala", "firma", "asociatie_diaspora", "parohie_sau_arhiva_doar_informativ", "librarie_magazin", "presa", "blog", "primarie", "biblioteca", "site_genealogie", "alt_partener"] as const;
export type OrgType = (typeof ORG_TYPES)[number];
export const isOrgType = (v: unknown): v is OrgType => typeof v === "string" && (ORG_TYPES as readonly string[]).includes(v);
export const ORG_TYPE_LABEL: Record<OrgType, string> = {
  scoala: "Școală", firma: "Firmă", asociatie_diaspora: "Asociație din diaspora", parohie_sau_arhiva_doar_informativ: "Parohie / arhivă (doar informativ)",
  librarie_magazin: "Librărie / magazin", presa: "Presă", blog: "Blog", primarie: "Primărie", biblioteca: "Bibliotecă", site_genealogie: "Site / societate de genealogie", alt_partener: "Alt partener",
};

export const ORG_STATUSES = ["nou", "contactat", "a_raspuns", "interesat", "in_discutie", "client", "partener", "nu_contacta", "nelivrat"] as const;
export type OrgStatus = (typeof ORG_STATUSES)[number];
export const isOrgStatus = (v: unknown): v is OrgStatus => typeof v === "string" && (ORG_STATUSES as readonly string[]).includes(v);
export const ORG_STATUS_LABEL: Record<OrgStatus, string> = {
  nou: "Nou", contactat: "Contactat", a_raspuns: "A răspuns", interesat: "Interesat", in_discutie: "În discuție", client: "Client",
  partener: "Partener", nu_contacta: "Nu contacta", nelivrat: "Email nelivrat",
};
/** Cât de departe a ajuns o organizație: un status nu coboară singur (un email trimis nu strică „interesat”). */
const STATUS_RANK: Record<OrgStatus, number> = { nou: 0, nelivrat: 1, contactat: 2, a_raspuns: 3, interesat: 4, in_discutie: 5, client: 6, partener: 6, nu_contacta: 9 };
export function advanceStatus(cur: OrgStatus, next: OrgStatus): OrgStatus {
  if (cur === "nu_contacta") return cur;
  if (next === "nu_contacta" || next === "nelivrat") return next === "nelivrat" && STATUS_RANK[cur] > STATUS_RANK.contactat ? cur : next;
  return STATUS_RANK[next] > STATUS_RANK[cur] ? next : cur;
}

export const ACTIVITY_TYPES = ["email_trimis", "email_nelivrat", "raspuns", "apel", "whatsapp", "nota", "formular", "cont_creat", "plata", "cod_folosit", "email_livrat", "email_deschis", "email_click", "dezabonat", "sarcina"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export const isActivityType = (v: unknown): v is ActivityType => typeof v === "string" && (ACTIVITY_TYPES as readonly string[]).includes(v);
export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  email_trimis: "Email trimis", email_nelivrat: "Email nelivrat", raspuns: "Răspuns", apel: "Apel", whatsapp: "WhatsApp", nota: "Notă",
  formular: "Formular", cont_creat: "Cont creat", plata: "Plată", cod_folosit: "Cod folosit",
  email_livrat: "Email livrat", email_deschis: "Email deschis", email_click: "Click în email", dezabonat: "Dezabonat", sarcina: "Sarcină",
};

export const DEAL_STAGES = ["nou", "contactat", "interesat", "oferta_trimisa", "aprobat", "coduri_emise", "activ", "reinnoire"] as const;
export type DealStage = (typeof DEAL_STAGES)[number];
export const isDealStage = (v: unknown): v is DealStage => typeof v === "string" && (DEAL_STAGES as readonly string[]).includes(v);
export const DEAL_STAGE_LABEL: Record<DealStage, string> = {
  nou: "Nou", contactat: "Contactat", interesat: "Interesat", oferta_trimisa: "Ofertă trimisă", aprobat: "Aprobat de conducere / decident",
  coduri_emise: "Coduri emise", activ: "Activ", reinnoire: "Reînnoire",
};
export const DEAL_PRODUCTS = ["coduri_scoala", "coduri_clasa", "abonamente_firma", "carduri_magazin"] as const;
export type DealProduct = (typeof DEAL_PRODUCTS)[number];
export const isDealProduct = (v: unknown): v is DealProduct => typeof v === "string" && (DEAL_PRODUCTS as readonly string[]).includes(v);
export const DEAL_PRODUCT_LABEL: Record<DealProduct, string> = {
  coduri_scoala: "Coduri pentru școală", coduri_clasa: "Coduri pentru o clasă", abonamente_firma: "Abonamente pentru firmă", carduri_magazin: "Carduri cadou în magazin",
};

export const RISKS = ["SAFE", "REVERSIBLE", "MEDIUM", "HIGH"] as const;
export type Risk = (typeof RISKS)[number];
export const APPROVAL_STATUSES = ["in_asteptare", "aprobat", "respins", "expirat"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export const APPROVAL_HOURS = 72;

export const SUPPRESSION_REASONS = ["dezabonat", "refuz", "nelivrat", "nu_contacta"] as const;
export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number];
export const isSuppressionReason = (v: unknown): v is SuppressionReason => typeof v === "string" && (SUPPRESSION_REASONS as readonly string[]).includes(v);

/* ---------- Mărunțișuri ---------- */

const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
export function cleanEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = v.trim().toLowerCase().replace(/^mailto:/, "");
  return EMAIL_RE.test(m) ? m.slice(0, 200) : null;
}
export const domainOf = (email: string) => email.slice(email.lastIndexOf("@") + 1).toLowerCase();
export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[șş]/g, "s").replace(/[țţ]/g, "t");
export function slugify(s: string, max = 40) {
  const out = fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max).replace(/-+$/, "");
  return out || null;
}
export const txt = (v: unknown, max = 200) => {
  const s = typeof v === "string" ? v.trim().slice(0, max) : typeof v === "number" ? String(v) : "";
  return s || null;
};
/** Cheia după care o organizație nu se dublează: emailul oficial, altfel tip + nume + localitate. */
export function dedupeKeyOf(o: { tip: string; nume: string; localitate?: string | null; emailOficial?: string | null }) {
  const e = cleanEmail(o.emailOficial);
  if (e) return `e:${e}`;
  return `n:${o.tip}|${fold(o.nume).replace(/\s+/g, " ").trim()}|${fold(o.localitate ?? "").trim()}`;
}
/** Un id stabil din câteva bucăți (pentru importul care se poate rula de mai multe ori). */
export const stableId = (...parts: (string | null | undefined)[]) => createHash("sha256").update(parts.map((p) => p ?? "").join("\u0001")).digest("hex").slice(0, 32);

/* ---------- Conturile de test nu intră în cifre ---------- */

/**
 * Fragment SQL adevărat pentru un cont real (nu demo, nu @example.com, nu venit pe un link test-link-*). `u` = aliasul tabelului
 * user; sursa se citește din account_source. Același criteriu ca filtrul din restul panoului.
 */
export function realUserSql(u = "u"): SQL {
  return realAccountSql(u);
}
export const isTestEmail = (email: string | null | undefined) => {
  const e = (email ?? "").toLowerCase();
  return e === DEMO_EMAIL || e.endsWith("@example.com");
};

/* ---------- Lista „nu contacta” ---------- */

/** Adresa (sau tot domeniul ei) e pe lista „nu contacta”? Se întreabă înainte de orice trimitere de marketing. */
export async function isSuppressed(db: Pick<Db, "select">, email: string): Promise<boolean> {
  const e = cleanEmail(email);
  if (!e) return true; // o adresă stricată nu primește nimic
  const r = await db.select({ v: crmSuppression.valoare }).from(crmSuppression)
    .where(sql`${crmSuppression.valoare} in (${e}, ${domainOf(e)})`).limit(1);
  return r.length > 0;
}
/** Din mai mulți destinatari, doar cei care nu sunt pe listă. */
export async function allowedRecipients(db: Pick<Db, "select">, emails: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const e of emails) if (!(await isSuppressed(db, e))) out.push(e);
  return out;
}

export async function suppress(db: Pick<Db, "insert">, value: string, motiv: SuppressionReason, o: { sursa?: string | null; by?: string | null; now?: Date } = {}) {
  const raw = value.trim().toLowerCase().replace(/^@/, "");
  const email = cleanEmail(raw);
  const domain = !email && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(raw) ? raw : null;
  const v = email ?? domain;
  if (!v) return null;
  await db.insert(crmSuppression).values({ valoare: v, tip: email ? "email" : "domeniu", motiv, sursa: o.sursa ?? null, createdBy: o.by ?? null, createdAt: o.now ?? new Date() })
    .onConflictDoNothing();
  return v;
}
export async function unsuppress(db: Pick<Db, "delete">, value: string) {
  await db.delete(crmSuppression).where(eq(crmSuppression.valoare, value.trim().toLowerCase()));
}

/* ---------- Organizații și activități ---------- */

export type OrgInput = {
  tip: OrgType; nume: string; localitate?: string | null; judet?: string | null; tara?: string | null; site?: string | null;
  emailOficial?: string | null; telefon?: string | null; sursaDatelor?: string | null; note?: string | null;
};

/** Găsește organizația după cheie sau o face; completează doar câmpurile goale (nu suprascrie ce ai scris tu). */
export async function upsertOrg(db: Db, o: OrgInput, now = new Date()): Promise<{ id: string; created: boolean; status: OrgStatus }> {
  const emailOficial = cleanEmail(o.emailOficial);
  const key = dedupeKeyOf({ ...o, emailOficial });
  const [found] = await db.select().from(crmOrganizations).where(eq(crmOrganizations.dedupeKey, key)).limit(1);
  if (found) {
    const patch: Partial<typeof crmOrganizations.$inferInsert> = {};
    if (!found.localitate && o.localitate) patch.localitate = o.localitate;
    if (!found.judet && o.judet) patch.judet = o.judet;
    if (!found.site && o.site) patch.site = o.site;
    if (!found.telefon && o.telefon) patch.telefon = o.telefon;
    if (!found.sursaDatelor && o.sursaDatelor) patch.sursaDatelor = o.sursaDatelor;
    if (Object.keys(patch).length) await db.update(crmOrganizations).set({ ...patch, updatedAt: now }).where(eq(crmOrganizations.id, found.id));
    return { id: found.id, created: false, status: (isOrgStatus(found.status) ? found.status : "nou") };
  }
  const base = slugify(o.nume, 34) ?? "org";
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const [taken] = await db.select({ id: crmOrganizations.id }).from(crmOrganizations).where(eq(crmOrganizations.slug, slug)).limit(1);
    if (!taken) break;
    slug = `${base}-${i}`;
  }
  const [row] = await db.insert(crmOrganizations).values({
    tip: o.tip, nume: o.nume.slice(0, 200), localitate: o.localitate ?? null, judet: o.judet ?? null, tara: (o.tara ?? "RO").slice(0, 40),
    site: o.site ?? null, emailOficial, telefon: o.telefon ?? null, sursaDatelor: o.sursaDatelor ?? null, note: o.note ?? null,
    dedupeKey: key, slug, createdAt: now, updatedAt: now,
  }).onConflictDoNothing().returning({ id: crmOrganizations.id });
  if (row) return { id: row.id, created: true, status: "nou" };
  const [again] = await db.select({ id: crmOrganizations.id, status: crmOrganizations.status }).from(crmOrganizations).where(eq(crmOrganizations.dedupeKey, key)).limit(1);
  return { id: again.id, created: false, status: isOrgStatus(again.status) ? again.status : "nou" };
}

export async function setOrgStatus(db: Db, id: string, next: OrgStatus, o: { force?: boolean; now?: Date } = {}) {
  const [cur] = await db.select({ status: crmOrganizations.status }).from(crmOrganizations).where(eq(crmOrganizations.id, id));
  if (!cur) return null;
  const from = isOrgStatus(cur.status) ? cur.status : "nou";
  const to = o.force ? next : advanceStatus(from, next);
  if (to !== from) await db.update(crmOrganizations).set({ status: to, updatedAt: o.now ?? new Date() }).where(eq(crmOrganizations.id, id));
  return to;
}

export type ActivityInput = {
  tip: ActivityType; canal?: string | null; rezumat?: string | null; at?: Date; organizationId?: string | null; contactId?: string | null;
  userId?: string | null; externalId?: string | null; meta?: Record<string, unknown> | null; createdBy?: string | null;
};
/** O activitate nouă; cu același `externalId` a doua oară nu se mai scrie (întoarce false). */
export async function addActivity(db: Pick<Db, "insert">, a: ActivityInput): Promise<boolean> {
  const r = await db.insert(crmActivities).values({
    tip: a.tip, canal: a.canal ?? null, rezumat: a.rezumat?.slice(0, 2000) ?? null, at: a.at ?? new Date(), organizationId: a.organizationId ?? null,
    contactId: a.contactId ?? null, userId: a.userId ?? null, externalId: a.externalId ?? null, meta: a.meta ?? null, createdBy: a.createdBy ?? null,
  }).onConflictDoNothing().returning({ id: crmActivities.id });
  return r.length > 0;
}

/** Organizația după email oficial (sau după domeniul site-ului, dacă emailul e de pe domeniul ei). */
/** Domeniile de email gratuite: acolo legăm doar adresa exactă, nu tot domeniul (multe școli au adrese pe yahoo/gmail). */
export const FREE_MAIL_DOMAINS = new Set(["gmail.com", "googlemail.com", "yahoo.com", "yahoo.ro", "ymail.com", "hotmail.com", "outlook.com", "live.com", "msn.com", "icloud.com", "me.com", "aol.com", "gmx.com", "gmx.net", "mail.com", "protonmail.com", "proton.me"]);

/** Organizația după adresa exactă; altfel după domeniu (doar domenii proprii, nu gratuite, și doar dacă e una singură). */
export async function orgByEmail(db: Pick<Db, "select">, email: string) {
  const e = cleanEmail(email);
  if (!e) return null;
  const [r] = await db.select({ id: crmOrganizations.id, status: crmOrganizations.status }).from(crmOrganizations)
    .where(and(sql`lower(${crmOrganizations.emailOficial}) = ${e}`)).limit(1);
  if (r) return r;
  const domain = e.split("@")[1];
  if (!domain || FREE_MAIL_DOMAINS.has(domain)) return null;
  const list = await db.select({ id: crmOrganizations.id, status: crmOrganizations.status }).from(crmOrganizations)
    .where(sql`split_part(lower(${crmOrganizations.emailOficial}), '@', 2) = ${domain} or lower(${crmOrganizations.site}) ~ ${`(^|[/.])${domain.replace(/[.]/g, "\\.")}(/|$)`}`).limit(2);
  return list.length === 1 ? list[0] : null;
}

/* ---------- Răspunsurile: clasificare simplă, după cuvinte (fără nimic ascuns) ---------- */

export const REPLY_KINDS = ["interesat", "intrebare", "refuz", "dezabonare", "automat"] as const;
export type ReplyKind = (typeof REPLY_KINDS)[number];
export const isReplyKind = (v: unknown): v is ReplyKind => typeof v === "string" && (REPLY_KINDS as readonly string[]).includes(v);
export const REPLY_LABEL: Record<ReplyKind, string> = { interesat: "Pozitiv (interesat)", intrebare: "Neutru (întrebare)", refuz: "Negativ (refuz)", dezabonare: "Dezabonare", automat: "Auto-reply / absent" };

const RULES: [ReplyKind, RegExp][] = [
  ["automat", /(out of office|auto[- ]?reply|automatic reply|raspuns automat|sunt in concediu|absent (din birou|pana)|nu sunt la birou|mailer-daemon|delivery status)/],
  ["dezabonare", /(dezabon|unsubscribe|stergeti[- ]?(ne|ma)|scoateti[- ]?(ne|ma)|(ne|ma) (scoateti|stergeti|eliminati) din|nu (ne|mai) (mai )?trimiteti|nu ne mai contactati|nu doresc sa (mai )?primesc|eliminati adresa)/],
  ["refuz", /(nu (suntem|sunt) interesat|nu ne intereseaza|nu este cazul|nu dorim|nu avem nevoie|multumim,? dar nu|refuz|nu (avem|dispunem de) (buget|fonduri)|nu putem (participa|colabora)|not interested|no,? thank)/],
  ["interesat", /(suntem interesat|sunt interesat|ne intereseaza|da,? (va rog|dorim)|dorim (sa|coduri|detalii)|trimiteti[- ]?ne (oferta|detalii|codurile)|vrem (sa|coduri)|cum procedam|ne-ar interesa)/],
  ["intrebare", /\?|(cat costa|ce presupune|cum functioneaza|puteti detalia|as dori (sa stiu|informatii))/],
];
/** Ce fel de răspuns e, după reguli de cuvinte (ordinea contează: un „out of office” nu e interes, o dezabonare nu e întrebare). */
export function classifyReply(text: string | null | undefined): ReplyKind {
  const t = fold(text ?? "");
  for (const [k, re] of RULES) if (re.test(t)) return k;
  return "intrebare";
}
