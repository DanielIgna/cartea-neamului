/**
 * Importul inițial în CRM din fișierele CSV ale lui Daniel (scoli_trimise.csv, firme_trimise.csv...), din Admin → CRM → Import.
 * Idempotent: același fișier încărcat de două ori nu dublează nimic (organizațiile după email/nume, activitățile după un id stabil
 * din fișier + rând). Întoarce un raport: câte organizații noi, câte activități, câte adrese pe lista „nu contacta”, ce rânduri s-au sărit.
 */
import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting, crmOrganizations } from "@/db/schema";
import { addActivity, classifyReply, cleanEmail, isReplyKind, setOrgStatus, stableId, suppress, txt, upsertOrg, type OrgType } from "./crm";

export const IMPORT_KINDS = {
  scoli_trimise: { tip: "scoala", what: "Școli cărora le-ai scris (scoala, localitate, judet, email, data, ora)" },
  scoli_de_sunat: { tip: "scoala", what: "Școli de sunat (scoala, localitate, judet, telefon, email...)" },
  scoli_nu_contacta: { tip: "scoala", what: "Școli care nu vor să fie contactate (merg pe lista „nu contacta”)" },
  scoli_raspunsuri: { tip: "scoala", what: "Răspunsuri de la școli (scoala, email, data, raspuns)" },
  firme_trimise: { tip: "firma", what: "Firme cărora le-ai scris (firma, email, data, ora)" },
  firme_nu_contacta: { tip: "firma", what: "Firme care nu vor să fie contactate" },
  firme_raspunsuri: { tip: "firma", what: "Răspunsuri de la firme (firma, email, data, raspuns)" },
  presa_lista: { tip: "presa", what: "Redacții de presă de adăugat (nume, email, site, localitate, tara, sursa)" },
  magazine_lista: { tip: "librarie_magazin", what: "Librării și magazine online de adăugat (nume, email, telefon, site, localitate, tara, sursa)" },
  asociatii_lista: { tip: "asociatie_diaspora", what: "Asociații ale românilor din străinătate de adăugat (nume, email, site, localitate, tara, sursa)" },
} as const satisfies Record<string, { tip: OrgType; what: string }>;
export type ImportKind = keyof typeof IMPORT_KINDS;
export const isImportKind = (v: unknown): v is ImportKind => typeof v === "string" && v in IMPORT_KINDS;
/** Din numele fișierului („scoli_trimise.csv”, „scoli_trimise (1).csv”) felul importului. */
export const kindOfFile = (name: string): ImportKind | null => {
  const k = name.toLowerCase().replace(/\.csv$/, "").replace(/\s*\(\d+\)$/, "").trim();
  return isImportKind(k) ? k : null;
};

/** Un CSV mic: virgulă sau punct și virgulă (Excel românesc), ghilimele, rânduri goale sărite, BOM scos. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : first.includes("\t") && !first.includes(",") ? "\t" : ",";
  const out: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"' && cell === "") q = true;
    else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) out.push(row.map((x) => x.trim()));
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) out.push(row.map((x) => x.trim()));
  return out;
}

const HEAD: Record<string, string[]> = {
  nume: ["scoala", "școala", "școală", "firma", "nume", "organizatie", "organizație", "denumire", "unitate", "unitatea"],
  localitate: ["localitate", "localitatea", "oras", "oraș", "comuna", "comună"],
  judet: ["judet", "județ", "judetul", "județul"],
  tara: ["tara", "țara", "țară", "country"],
  email: ["email", "e-mail", "mail", "adresa", "adresă email"],
  telefon: ["telefon", "tel", "phone"],
  site: ["site", "website", "web"],
  data: ["data", "date", "ziua"],
  ora: ["ora", "time", "oră"],
  raspuns: ["raspuns", "răspuns", "mesaj", "text", "continut", "conținut", "rezumat"],
  motiv: ["motiv", "nota", "notă", "observatii", "observații"],
  sursa: ["sursa", "sursă", "sursa_datelor", "url"],
};
const norm = (h: string) => h.trim().toLowerCase().replace(/[_\s]+/g, " ");
function columns(header: string[]) {
  const map: Record<string, number> = {};
  header.forEach((h, i) => {
    const n = norm(h);
    for (const [k, alts] of Object.entries(HEAD)) if (map[k] === undefined && alts.some((a) => norm(a) === n)) map[k] = i;
  });
  return map;
}

/** „17.11.2026” / „2026-11-17” + „09:30” → dată (ora României aproximată ca UTC+2); fără dată → null. */
export function parseWhen(d: string | null, t: string | null): Date | null {
  if (!d) return null;
  let y: number, m: number, day: number;
  const ro = d.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/), iso = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) [y, m, day] = [+iso[1], +iso[2], +iso[3]];
  else if (ro) [y, m, day] = [+ro[3], +ro[2], +ro[1]];
  else return null;
  const tm = (t ?? d.slice(10)).match(/(\d{1,2}):(\d{2})/);
  const out = new Date(Date.UTC(y, m - 1, day, tm ? +tm[1] - 2 : 10, tm ? +tm[2] : 0));
  return Number.isNaN(out.getTime()) ? null : out;
}

export type ImportReport = { kind: ImportKind; rows: number; orgsNew: number; orgsSeen: number; activities: number; suppressed: number; skipped: { row: number; why: string }[] };

export async function importCsv(db: Db, kind: ImportKind, text: string, by: string | null = null, now = new Date()): Promise<ImportReport> {
  const rep: ImportReport = { kind, rows: 0, orgsNew: 0, orgsSeen: 0, activities: 0, suppressed: 0, skipped: [] };
  const all = parseCsv(text);
  if (!all.length) return rep;
  const col = columns(all[0]);
  const hasHeader = col.nume !== undefined || col.email !== undefined;
  const data = hasHeader ? all.slice(1) : all;
  // Fără cap de tabel: ordinea din cerință (nume, localitate, judet, email, data, ora pentru școli; nume, email, data, ora pentru firme).
  const c = hasHeader ? col : kind.startsWith("scoli") ? { nume: 0, localitate: 1, judet: 2, email: 3, data: 4, ora: 5 } : { nume: 0, email: 1, data: 2, ora: 3 };
  const tip = IMPORT_KINDS[kind].tip;
  const get = (r: string[], k: string) => (c[k] === undefined ? null : txt(r[c[k]], k === "raspuns" ? 2000 : 200));
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const rowNo = i + (hasHeader ? 2 : 1);
    rep.rows++;
    const rawEmail = get(r, "email");
    const email = cleanEmail(rawEmail);
    const nume = get(r, "nume") ?? (email ? email.split("@")[1] : null);
    if (!nume) { rep.skipped.push({ row: rowNo, why: "fără nume și fără email" }); continue; }
    if (rawEmail && !email) { rep.skipped.push({ row: rowNo, why: `adresa „${rawEmail.slice(0, 60)}” nu e validă` }); continue; }
    const org = await upsertOrg(db, { tip, nume, localitate: get(r, "localitate"), judet: get(r, "judet"), tara: get(r, "tara"), emailOficial: email, telefon: get(r, "telefon"), site: get(r, "site"), sursaDatelor: get(r, "sursa") }, now);
    if (org.created) rep.orgsNew++; else rep.orgsSeen++;
    const when = parseWhen(get(r, "data"), get(r, "ora")) ?? now;
    const ext = (what: string) => `import:${kind}:${stableId(email ?? nume, get(r, "data"), get(r, "ora"), what)}`;
    // „_lista”: doar adaugă organizația (cu sursa adresei), fără activitate și fără să-i schimbe starea.
    if (kind.endsWith("_lista")) continue;
    if (kind.endsWith("_trimise")) {
      if (await addActivity(db, { tip: "email_trimis", canal: "email", rezumat: "Email de prezentare (import)", at: when, organizationId: org.id, externalId: ext("trimis"), createdBy: by })) rep.activities++;
      await setOrgStatus(db, org.id, "contactat", { now });
    } else if (kind === "scoli_de_sunat") {
      await db.update(crmOrganizations).set({ deSunat: true, updatedAt: now }).where(eq(crmOrganizations.id, org.id));
      if (await addActivity(db, { tip: "nota", canal: "import", rezumat: `De sunat${get(r, "motiv") ? `: ${get(r, "motiv")}` : ""}`, at: when, organizationId: org.id, externalId: ext("sunat"), createdBy: by })) rep.activities++;
    } else if (kind.endsWith("_nu_contacta")) {
      await setOrgStatus(db, org.id, "nu_contacta", { now });
      if (email && (await suppress(db, email, "nu_contacta", { sursa: `import ${kind}`, by, now }))) rep.suppressed++;
      if (await addActivity(db, { tip: "nota", canal: "import", rezumat: `Nu contacta${get(r, "motiv") ? `: ${get(r, "motiv")}` : ""}`, at: when, organizationId: org.id, externalId: ext("nu"), createdBy: by })) rep.activities++;
    } else if (kind.endsWith("_raspunsuri")) {
      const text = get(r, "raspuns");
      const k0 = get(r, "motiv");
      const kindOf = isReplyKind(k0) ? k0 : classifyReply(text);
      if (await addActivity(db, { tip: "raspuns", canal: "email", rezumat: text ?? "Răspuns (import)", at: when, organizationId: org.id, externalId: ext("raspuns"), meta: { clasificare: kindOf }, createdBy: by })) rep.activities++;
      if (kindOf === "refuz" || kindOf === "dezabonare") {
        await setOrgStatus(db, org.id, "nu_contacta", { now });
        if (email && (await suppress(db, email, kindOf === "refuz" ? "refuz" : "dezabonat", { sursa: `import ${kind}`, by, now }))) rep.suppressed++;
      } else await setOrgStatus(db, org.id, kindOf === "interesat" ? "interesat" : "a_raspuns", { now });
    }
  }
  return rep;
}

/**
 * Lista de redacții (src/data/crm-presa.csv) intră o singură dată în CRM la publicare (Daniel, 25.11.2026: „nu știu unde am
 * emailurile pentru presă”). Doar adresele generale scrise de redacții pe site-ul lor; coloana „sursa” arată pagina.
 * Fără nicio trimitere: emailurile pleacă doar din Campanii, după aprobarea lui.
 */
export async function seedPressOnce(db: Db, csv: string, now = new Date()): Promise<string> {
  const MARK = "crm_presa_2026_11_25";
  const [seen] = await db.select({ key: appSetting.key }).from(appSetting).where(eq(appSetting.key, MARK));
  if (seen) return "deja";
  const rep = await importCsv(db, "presa_lista", csv, null, now);
  await db.insert(appSetting).values({ key: MARK, value: { at: now.toISOString(), noi: rep.orgsNew }, updatedAt: now }).onConflictDoNothing();
  return `${rep.orgsNew} redacții noi, ${rep.orgsSeen} deja în CRM`;
}

/**
 * Câte un email scris pentru fiecare redacție (src/data/crm-presa-mesaje.json), pus o singură dată în Admin → CRM → Aprobări
 * (Daniel, 25.11.2026: „vreau doar să apăs trimite, maxim să editez ceva”). Nu pleacă nimic până nu apasă el „Trimite acum”;
 * răspunsurile vin la contact@carteaneamului.ro. Stau 7 zile, apoi expiră.
 */
export async function seedPressDraftsOnce(db: Db, drafts: Record<string, { subiect: string; text: string }>, now = new Date()): Promise<string> {
  const MARK = "crm_presa_ciorne_2026_11_25";
  const [seen] = await db.select({ key: appSetting.key }).from(appSetting).where(eq(appSetting.key, MARK));
  if (seen) return "deja";
  const { queueApproval } = await import("./crm-admin");
  let n = 0;
  for (const [email, d] of Object.entries(drafts)) {
    const [org] = await db.select({ id: crmOrganizations.id, nume: crmOrganizations.nume }).from(crmOrganizations).where(eq(crmOrganizations.emailOficial, email)).limit(1);
    if (!org) continue;
    const id = await queueApproval(db, {
      tipActiune: "email_presa", risc: "MEDIUM", organizationId: org.id, dedupeKey: `presa-1:${email}`, hours: 7 * 24,
      motiv: `Propunere de subiect pentru ${org.nume}, scrisă pentru redacția lor. Citește, schimbă ce vrei, apoi „Trimite acum”.`,
      payload: { destinatar: email, subiect: d.subiect, text: d.text, replyTo: "contact@carteaneamului.ro" },
    }, now);
    if (id) n++;
  }
  await db.insert(appSetting).values({ key: MARK, value: { at: now.toISOString(), ciorne: n }, updatedAt: now }).onConflictDoNothing();
  return `${n} emailuri pentru redacții în Aprobări`;
}

/**
 * Librăriile și magazinele online pentru cardurile cadou digitale (Daniel, 25.11.2026: „pe ce platforme sau magazine online le-aș
 * putea pune? librării etc.”, apoi „pregătește-mi în Admin totul, emailuri”). Lista (src/data/crm-magazine.csv) intră o singură
 * dată în CRM la „Magazine online”; adresele sunt cele scrise de magazine pe site-ul lor (coloana „sursa”). Nimic nu se trimite.
 */
export async function seedShopsOnce(db: Db, csv: string, now = new Date()): Promise<string> {
  const MARK = "crm_magazine_2026_11_25";
  const [seen] = await db.select({ key: appSetting.key }).from(appSetting).where(eq(appSetting.key, MARK));
  if (seen) return "deja";
  const rep = await importCsv(db, "magazine_lista", csv, null, now);
  await db.insert(appSetting).values({ key: MARK, value: { at: now.toISOString(), noi: rep.orgsNew }, updatedAt: now }).onConflictDoNothing();
  return `${rep.orgsNew} magazine noi, ${rep.orgsSeen} deja în CRM`;
}

/**
 * Câte un email de propunere pentru fiecare magazin (src/data/crm-magazine-mesaje.json), pus o singură dată în CRM → Aprobări.
 * Pleacă doar când Daniel apasă „Trimite acum”; răspunsurile vin la contact@carteaneamului.ro. Stau 14 zile (până aproape de
 * Crăciun), apoi expiră.
 */
export async function seedShopDraftsOnce(db: Db, drafts: Record<string, { subiect: string; text: string }>, now = new Date()): Promise<string> {
  const MARK = "crm_magazine_ciorne_2026_11_25";
  const [seen] = await db.select({ key: appSetting.key }).from(appSetting).where(eq(appSetting.key, MARK));
  if (seen) return "deja";
  const { queueApproval } = await import("./crm-admin");
  let n = 0;
  for (const [email, d] of Object.entries(drafts)) {
    const [org] = await db.select({ id: crmOrganizations.id, nume: crmOrganizations.nume }).from(crmOrganizations).where(eq(crmOrganizations.emailOficial, email)).limit(1);
    if (!org) continue;
    const id = await queueApproval(db, {
      tipActiune: "email_magazin", risc: "MEDIUM", organizationId: org.id, dedupeKey: `magazin-1:${email}`, hours: 14 * 24,
      motiv: `Propunere de card cadou digital pentru ${org.nume}. Citește, completează discountul dacă vrei, apoi „Trimite acum”.`,
      payload: { destinatar: email, subiect: d.subiect, text: d.text, replyTo: "contact@carteaneamului.ro" },
    }, now);
    if (id) n++;
  }
  await db.insert(appSetting).values({ key: MARK, value: { at: now.toISOString(), ciorne: n }, updatedAt: now }).onConflictDoNothing();
  return `${n} emailuri pentru magazine în Aprobări`;
}
