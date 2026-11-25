/**
 * Ce citește și schimbă pagina Admin → CRM (src/app/(site)/admin/crm): lista „Azi”, organizațiile cu fișa lor, pipeline-ul,
 * coada de aprobări și lista „nu contacta”. Toate cifrele scot conturile de test (realUserSql).
 */
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { crmActivities, crmApprovals, crmContacts, crmDeals, crmOrganizations, crmSuppression } from "@/db/schema";
import {
  APPROVAL_HOURS, addActivity, cleanEmail, isDealProduct, isDealStage, isOrgStatus, isOrgType, realUserSql, setOrgStatus, txt, upsertOrg,
  type DealProduct, type DealStage, type OrgType, type Risk,
} from "./crm";
import { crmPartners, dueSteps } from "./parteneri-crm";
import { orgPriority } from "./crm-scor";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  return ((await db.execute(q)).rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const DAY = 86_400_000;
export const endOfDay = (now: Date) => { const e = new Date(now); e.setUTCHours(23, 59, 59, 999); return e; };

/* ---------- Linkul cu sursă al unei organizații ---------- */

export const SRC_PREFIX: Partial<Record<OrgType, string>> = { scoala: "scoala", firma: "firma", asociatie_diaspora: "asociatie", librarie_magazin: "magazin", presa: "presa", blog: "blog", primarie: "primarie" };
export const srcOf = (tip: string, slug: string | null) => (slug ? `${SRC_PREFIX[tip as OrgType] ?? "org"}-${slug}`.slice(0, 40) : null);

/** Conturile reale venite pe linkurile ?src= ale organizațiilor: câte, câte cu arbore început, câte plătitoare. */
export async function accountsBySrc(db: Db): Promise<Map<string, { accounts: number; trees: number; paid: number }>> {
  const r = await rows<{ src: string; accounts: unknown; trees: unknown; paid: unknown }>(db, sql`
    select coalesce(s.first_src, s.source) as src, count(*) as accounts,
      count(*) filter (where exists (select 1 from tree t where t.owner_id = u.id)) as trees,
      count(*) filter (where exists (select 1 from payment p where p.user_id = u.id)) as paid
    from account_source s join "user" u on u.id = s.user_id
    where coalesce(s.first_src, s.source) is not null and ${realUserSql("u")}
    group by 1`);
  return new Map(r.map((x) => [x.src, { accounts: n(x.accounts), trees: n(x.trees), paid: n(x.paid) }]));
}

/* ---------- Organizațiile ---------- */

export type OrgFilter = { tip?: string; status?: string; judet?: string; tara?: string; q?: string; sort?: string };
export type OrgRow = typeof crmOrganizations.$inferSelect & { activities: number; lastAt: Date | null; src: string | null; accounts: number; trees: number; paid: number; prioritate: number };

export async function orgList(db: Db, f: OrgFilter = {}, limit = 500): Promise<OrgRow[]> {
  const where: SQL[] = [];
  if (isOrgType(f.tip)) where.push(eq(crmOrganizations.tip, f.tip));
  if (isOrgStatus(f.status)) where.push(eq(crmOrganizations.status, f.status));
  if (f.judet) where.push(eq(crmOrganizations.judet, f.judet));
  if (f.tara) where.push(eq(crmOrganizations.tara, f.tara));
  if (f.q?.trim()) {
    const like = `%${f.q.trim().toLowerCase()}%`;
    where.push(sql`(lower(${crmOrganizations.nume}) like ${like} or lower(coalesce(${crmOrganizations.emailOficial}, '')) like ${like} or lower(coalesce(${crmOrganizations.localitate}, '')) like ${like})`);
  }
  const [list, counts, bySrc, sizes, warm] = await Promise.all([
    db.select().from(crmOrganizations).where(where.length ? and(...where) : undefined).orderBy(desc(crmOrganizations.updatedAt)).limit(limit),
    rows<{ id: string; c: unknown; last: string | null }>(db, sql`select organization_id as id, count(*) as c, max(at) as last from crm_activities where organization_id is not null group by 1`),
    accountsBySrc(db),
    rows<{ id: string; m: unknown }>(db, sql`select organization_id as id, max(coalesce(conturi_estimate, 0)) as m from crm_deals group by 1`),
    warmCounties(db),
  ]);
  const cm = new Map(counts.map((c) => [c.id, c]));
  const sm = new Map(sizes.map((x) => [x.id, n(x.m)]));
  const out = list.map((o) => {
    const src = srcOf(o.tip, o.slug);
    const a = (src && bySrc.get(src)) || { accounts: 0, trees: 0, paid: 0 };
    const c = cm.get(o.id);
    const prioritate = orgPriority({ tip: o.tip, status: o.status, maxAccounts: sm.get(o.id) ?? 0, warmCounty: !!o.judet && warm.has(o.judet) });
    return { ...o, activities: n(c?.c), lastAt: c?.last ? new Date(c.last) : null, src, ...a, prioritate };
  });
  return f.sort === "prioritate" ? out.sort((x, y) => y.prioritate - x.prioritate) : out;
}

/** Județele în care au venit deja conturi (reale) pe linkurile ?src= ale organizațiilor de acolo. */
export async function warmCounties(db: Db): Promise<Set<string>> {
  const r = await rows<{ judet: string }>(db, sql`
    select distinct o.judet from crm_organizations o join account_source s on coalesce(s.first_src, s.source) like '%-' || o.slug
    join "user" u on u.id = s.user_id where o.judet is not null and o.slug is not null and ${realUserSql("u")}`);
  return new Set(r.map((x) => x.judet));
}

export async function orgDetail(db: Db, id: string) {
  const [org] = await db.select().from(crmOrganizations).where(eq(crmOrganizations.id, id));
  if (!org) return null;
  const src = srcOf(org.tip, org.slug);
  const [activities, contacts, deals, accounts] = await Promise.all([
    db.select().from(crmActivities).where(eq(crmActivities.organizationId, id)).orderBy(desc(crmActivities.at)).limit(200),
    db.select().from(crmContacts).where(eq(crmContacts.organizationId, id)),
    db.select().from(crmDeals).where(eq(crmDeals.organizationId, id)).orderBy(desc(crmDeals.updatedAt)),
    src ? rows<{ id: string; name: string; created_at: string; trees: unknown; paid: unknown }>(db, sql`
      select u.id, u.name, u.created_at,
        (select count(*) from tree t where t.owner_id = u.id) as trees,
        (select count(*) from payment p where p.user_id = u.id) as paid
      from account_source s join "user" u on u.id = s.user_id
      where coalesce(s.first_src, s.source) = ${src} and ${realUserSql("u")} order by u.created_at desc limit 200`) : Promise.resolve([]),
  ]);
  return { org, src, activities, contacts, deals, accounts: accounts.map((a) => ({ ...a, trees: n(a.trees), paid: n(a.paid) })) };
}

export async function updateOrg(db: Db, id: string, f: Record<string, unknown>, now = new Date()) {
  const patch: Partial<typeof crmOrganizations.$inferInsert> = { updatedAt: now };
  for (const k of ["localitate", "judet", "site", "telefon", "note", "sursaDatelor"] as const) if (k in f) patch[k] = txt(f[k], k === "note" ? 4000 : 300);
  if ("tara" in f) patch.tara = txt(f.tara, 40) ?? "RO";
  if ("emailOficial" in f) patch.emailOficial = cleanEmail(f.emailOficial);
  if ("deSunat" in f) patch.deSunat = f.deSunat === true || f.deSunat === "on";
  await db.update(crmOrganizations).set(patch).where(eq(crmOrganizations.id, id));
  if (isOrgStatus(f.status)) await setOrgStatus(db, id, f.status, { force: true, now });
}

/* ---------- Pipeline ---------- */

export type DealRow = typeof crmDeals.$inferSelect & { orgNume: string; orgTip: string };
export async function dealList(db: Db): Promise<DealRow[]> {
  const r = await db.select({ d: crmDeals, orgNume: crmOrganizations.nume, orgTip: crmOrganizations.tip }).from(crmDeals)
    .innerJoin(crmOrganizations, eq(crmOrganizations.id, crmDeals.organizationId)).orderBy(crmDeals.dataUrmatoruluiPas);
  return r.map((x) => ({ ...x.d, orgNume: x.orgNume, orgTip: x.orgTip }));
}
export async function addDeal(db: Db, o: { organizationId: string; produs: DealProduct; conturiEstimate?: number | null; valoareEstimata?: number | null; etapa?: DealStage; urmatorulPas?: string | null; dataUrmatoruluiPas?: Date | null; note?: string | null }, now = new Date()) {
  const [r] = await db.insert(crmDeals).values({ ...o, etapa: o.etapa ?? "nou", createdAt: now, updatedAt: now }).returning({ id: crmDeals.id });
  return r.id;
}
export async function updateDeal(db: Db, id: string, f: Record<string, unknown>, now = new Date()) {
  const patch: Partial<typeof crmDeals.$inferInsert> = { updatedAt: now };
  if (isDealStage(f.etapa)) patch.etapa = f.etapa;
  if (isDealProduct(f.produs)) patch.produs = f.produs;
  if ("urmatorulPas" in f) patch.urmatorulPas = txt(f.urmatorulPas, 300);
  if ("dataUrmatoruluiPas" in f) { const d = typeof f.dataUrmatoruluiPas === "string" && f.dataUrmatoruluiPas ? new Date(`${f.dataUrmatoruluiPas}T09:00:00Z`) : null; patch.dataUrmatoruluiPas = d && !Number.isNaN(d.getTime()) ? d : null; }
  if ("conturiEstimate" in f) patch.conturiEstimate = Number.isFinite(Number(f.conturiEstimate)) && f.conturiEstimate !== "" ? Math.max(0, Math.round(Number(f.conturiEstimate))) : null;
  if ("valoareEstimata" in f) patch.valoareEstimata = Number.isFinite(Number(f.valoareEstimata)) && f.valoareEstimata !== "" ? Math.max(0, Math.round(Number(f.valoareEstimata))) : null;
  await db.update(crmDeals).set(patch).where(eq(crmDeals.id, id));
}

/* ---------- Oferta de volum pentru firme ---------- */

export const VOLUME_TIERS = [
  { from: 10, to: 29, pct: 10 }, { from: 30, to: 89, pct: 15 }, { from: 90, to: 149, pct: 20 }, { from: 150, to: 499, pct: 25 },
] as const;
/** Reducerea pentru un număr de conturi: sub 10 nimic, de la 500 ofertă personalizată (null). */
export function volumeDiscount(accounts: number): number | null {
  if (accounts >= 500) return null;
  return VOLUME_TIERS.find((t) => accounts >= t.from && accounts <= t.to)?.pct ?? 0;
}
export const volumeValue = (accounts: number, priceLei: number) => {
  const pct = volumeDiscount(accounts);
  return pct === null ? null : Math.round(accounts * priceLei * (1 - pct / 100));
};

/* ---------- Coada de aprobări ---------- */

export type ApprovalPayload = { destinatar?: string; subiect?: string; text?: string; [k: string]: unknown };
export async function queueApproval(db: Db, o: { tipActiune: string; payload: ApprovalPayload; motiv?: string | null; risc?: Risk; organizationId?: string | null; userId?: string | null; dedupeKey?: string | null }, now = new Date()) {
  const r = await db.insert(crmApprovals).values({
    tipActiune: o.tipActiune, payload: o.payload, motiv: o.motiv ?? null, risc: o.risc ?? "MEDIUM", organizationId: o.organizationId ?? null,
    userId: o.userId ?? null, dedupeKey: o.dedupeKey ?? null, createdAt: now, expiresAt: new Date(now.getTime() + APPROVAL_HOURS * 3600_000),
  }).onConflictDoNothing().returning({ id: crmApprovals.id });
  return r[0]?.id ?? null;
}
/** Ce a trecut de 72 h fără răspuns devine „expirat”. */
export async function expireApprovals(db: Db, now = new Date()) {
  const r = await db.update(crmApprovals).set({ status: "expirat", cand: now })
    .where(and(eq(crmApprovals.status, "in_asteptare"), sql`${crmApprovals.expiresAt} < ${now.toISOString()}`)).returning({ id: crmApprovals.id });
  return r.length;
}
export async function pendingApprovals(db: Db, now = new Date()) {
  await expireApprovals(db, now);
  return db.select({ a: crmApprovals, orgNume: crmOrganizations.nume }).from(crmApprovals)
    .leftJoin(crmOrganizations, eq(crmOrganizations.id, crmApprovals.organizationId))
    .where(eq(crmApprovals.status, "in_asteptare")).orderBy(crmApprovals.createdAt);
}
export async function recentDecisions(db: Db, limit = 30) {
  return db.select({ a: crmApprovals, orgNume: crmOrganizations.nume }).from(crmApprovals)
    .leftJoin(crmOrganizations, eq(crmOrganizations.id, crmApprovals.organizationId))
    .where(sql`${crmApprovals.status} <> 'in_asteptare'`).orderBy(desc(crmApprovals.cand)).limit(limit);
}

/**
 * Hotărârea pe o aprobare. „Aprob” la un email îl trimite (ca email de marketing: lista „nu contacta” se verifică din nou chiar
 * acum) și îl trece în istoric; dacă destinatarul e pe listă, nu pleacă nimic și aprobarea rămâne „respins” cu motivul.
 */
export async function decideApproval(db: Db, id: string, decision: "aprobat" | "respins", by: string, edit: { subiect?: string; text?: string } | null = null, now = new Date(),
  send: (m: { to: string; subject: string; text: string; html: string; tag: string; marketing: boolean }) => Promise<{ ok?: boolean; skipped?: boolean }> = async (m) => (await import("./email")).sendEmail(m)) {
  const [a] = await db.select().from(crmApprovals).where(eq(crmApprovals.id, id));
  if (!a || a.status !== "in_asteptare") return { ok: false as const, why: "nu mai așteaptă" };
  if (a.expiresAt < now) { await expireApprovals(db, now); return { ok: false as const, why: "a expirat" }; }
  const payload: ApprovalPayload = { ...a.payload, ...(edit?.subiect ? { subiect: edit.subiect.slice(0, 300) } : {}), ...(edit?.text ? { text: edit.text.slice(0, 8000) } : {}) };
  if (decision === "respins") {
    await db.update(crmApprovals).set({ status: "respins", payload, cineAAprobat: by, cand: now }).where(eq(crmApprovals.id, id));
    return { ok: true as const, why: "respins" };
  }
  if (a.tipActiune.startsWith("email") && payload.destinatar) {
    const { escHtml } = await import("./emailuri");
    const r = await send({ to: payload.destinatar, subject: payload.subiect ?? "Cartea Neamului", text: payload.text ?? "",
      html: (payload.text ?? "").split("\n\n").map((p) => `<p>${escHtml(p).replace(/\n/g, "<br>")}</p>`).join(""), tag: `crm-${a.tipActiune}`, marketing: true });
    if (!r.ok) {
      const why = r.skipped ? "nu a plecat (destinatarul e pe lista „nu contacta” sau emailul nu e configurat)" : "nu a plecat (eroare la trimitere)";
      await db.update(crmApprovals).set({ status: "respins", payload: { ...payload, eroare: why }, cineAAprobat: by, cand: now }).where(eq(crmApprovals.id, id));
      return { ok: false as const, why };
    }
    await addActivity(db, { tip: "email_trimis", canal: "email", rezumat: payload.subiect ?? "Email aprobat", at: now, organizationId: a.organizationId, userId: a.userId, createdBy: by, externalId: `aprobare:${id}` });
  }
  await db.update(crmApprovals).set({ status: "aprobat", payload, cineAAprobat: by, cand: now }).where(eq(crmApprovals.id, id));
  return { ok: true as const, why: "aprobat" };
}

/* ---------- Lista „nu contacta” ---------- */

export const suppressionList = (db: Db, limit = 1000) => db.select().from(crmSuppression).orderBy(desc(crmSuppression.createdAt)).limit(limit);

/* ---------- Azi ---------- */

export type TodayItem = { kind: "sarcina" | "raspuns" | "aprobare" | "de_sunat" | "deal" | "partener"; late?: boolean; title: string; detail: string; href: string; phone?: string | null; email?: string | null; site?: string | null; at: Date | null; id?: string };

export async function todayList(db: Db, now = new Date()): Promise<TodayItem[]> {
  const end = endOfDay(now);
  const since = new Date(now.getTime() - 14 * DAY);
  const [tasks, replies, approvals, calls, deals, partners] = await Promise.all([
    import("./crm-sarcini").then((m) => m.dueTasks(db, now)),
    // Răspunsurile din ultimele 14 zile la care n-am mai făcut nimic după ele.
    rows<{ org: string; nume: string; rezumat: string | null; at: string; email: string | null; telefon: string | null; clasificare: string | null }>(db, sql`
      select a.organization_id as org, o.nume, a.rezumat, a.at, o.email_oficial as email, o.telefon, a.meta->>'clasificare' as clasificare
      from crm_activities a join crm_organizations o on o.id = a.organization_id
      where a.tip = 'raspuns' and a.at > ${since.toISOString()} and o.status not in ('nu_contacta')
        and coalesce(a.meta->>'clasificare', '') not in ('automat', 'refuz', 'dezabonare')
        and not exists (select 1 from crm_activities b where b.organization_id = a.organization_id and b.at > a.at and b.tip in ('email_trimis','apel','whatsapp','nota'))
      order by a.at desc limit 50`),
    pendingApprovals(db, now),
    db.select().from(crmOrganizations).where(and(eq(crmOrganizations.deSunat, true), sql`${crmOrganizations.status} not in ('nu_contacta','client','partener')`)).orderBy(crmOrganizations.updatedAt).limit(50),
    db.select({ d: crmDeals, nume: crmOrganizations.nume, telefon: crmOrganizations.telefon, email: crmOrganizations.emailOficial }).from(crmDeals)
      .innerJoin(crmOrganizations, eq(crmOrganizations.id, crmDeals.organizationId))
      .where(sql`${crmDeals.dataUrmatoruluiPas} <= ${end.toISOString()}`).orderBy(crmDeals.dataUrmatoruluiPas).limit(50),
    crmPartners(db).then((p) => dueSteps(p, now)),
  ]);
  const out: TodayItem[] = [];
  const callTask = new Set(tasks.filter((t) => t.sursa === "nelivrat" && t.org).map((t) => t.org));
  for (const t of tasks) out.push({ kind: "sarcina", title: t.nume ?? t.titlu, detail: t.titlu, href: t.org ? `/admin/crm/org/${t.org}` : "/admin/crm", phone: t.telefon, email: t.email, at: t.scadenta, id: t.id, late: t.restanta });
  for (const r of replies) out.push({ kind: "raspuns", title: r.nume, detail: `${r.clasificare ? `${r.clasificare}: ` : ""}${(r.rezumat ?? "").slice(0, 220)}`, href: `/admin/crm/org/${r.org}`, email: r.email, phone: r.telefon, at: new Date(r.at) });
  for (const { a, orgNume } of approvals) out.push({ kind: "aprobare", title: orgNume ?? a.payload.destinatar ?? a.tipActiune, detail: `${a.risc} · ${a.motiv ?? a.tipActiune}`, href: "/admin/crm?t=aprobari", at: a.createdAt, id: a.id });
  for (const o of calls.filter((x) => !callTask.has(x.id))) out.push({ kind: "de_sunat", title: o.nume, detail: [o.status === "nelivrat" ? "emailul n-a ajuns" : "de sunat", o.localitate, o.judet].filter(Boolean).join(" · "), href: `/admin/crm/org/${o.id}`, phone: o.telefon, site: o.site, email: o.emailOficial, at: o.updatedAt });
  for (const { d, nume, telefon, email } of deals) out.push({ kind: "deal", title: nume, detail: d.urmatorulPas ?? "pasul următor", href: `/admin/crm/org/${d.organizationId}`, phone: telefon, email, at: d.dataUrmatoruluiPas });
  for (const p of partners) out.push({ kind: "partener", title: p.numeMagazin, detail: p.urmatorulPas ?? "pasul următor", href: `/admin/parteneri/${p.id}`, phone: p.telefon, email: p.email, at: p.urmatorulPasLa });
  return out;
}

/** Textul precompletat pentru WhatsApp (doar numerele românești sau internaționale; altfel nimic). */
export function whatsappLink(phone: string | null | undefined, text: string) {
  const d = (phone ?? "").replace(/[^\d+]/g, "");
  const intl = d.startsWith("+") ? d.slice(1) : d.startsWith("00") ? d.slice(2) : d.startsWith("07") ? `4${d}` : d.startsWith("0") ? `4${d}` : d;
  return intl.length >= 10 ? `https://wa.me/${intl}?text=${encodeURIComponent(text)}` : null;
}

/* ---------- Cifrele de sus ---------- */

export async function crmCounts(db: Db, now = new Date()) {
  const [r] = await rows<Row>(db, sql`select
    (select count(*) from crm_organizations) as orgs,
    (select count(*) from crm_organizations where tip = 'scoala') as scoli,
    (select count(*) from crm_organizations where tip = 'firma') as firme,
    (select count(*) from crm_organizations where tip = 'presa') as presa,
    (select count(*) from crm_organizations where status in ('a_raspuns','interesat','in_discutie')) as calde,
    (select count(*) from crm_organizations where status in ('client','partener')) as clienti,
    (select count(*) from crm_activities where tip = 'email_trimis' and at > ${new Date(now.getTime() - 30 * DAY).toISOString()}) as trimise30,
    (select count(*) from crm_activities where tip = 'raspuns' and at > ${new Date(now.getTime() - 30 * DAY).toISOString()}) as raspunsuri30,
    (select count(*) from crm_approvals where status = 'in_asteptare' and expires_at > ${now.toISOString()}) as aprobari,
    (select count(*) from crm_suppression) as suprimate`);
  return Object.fromEntries(Object.entries(r ?? {}).map(([k, v]) => [k, n(v)])) as Record<"orgs" | "scoli" | "firme" | "presa" | "calde" | "clienti" | "trimise30" | "raspunsuri30" | "aprobari" | "suprimate", number>;
}

/* ---------- Formularul public „Vreau coduri” (/parteneriate) ---------- */

export const FORM_KINDS = { scoala: "Școală / clasă", firma: "Firmă", asociatie_diaspora: "Asociație a românilor din străinătate", alt_partener: "Bibliotecă, muzeu, primărie sau alt partener" } as const;
export type FormKind = keyof typeof FORM_KINDS;
export const isFormKind = (v: unknown): v is FormKind => typeof v === "string" && v in FORM_KINDS;

export type PartnershipForm = { tip: FormKind; organizatie: string; localitate: string | null; rol: string | null; numar: number | null; email: string; telefon: string | null; mesaj: string | null; consent: boolean };
export function checkPartnershipForm(f: Record<string, unknown>): { ok: PartnershipForm } | { error: string } {
  const tip = isFormKind(f.tip) ? f.tip : null;
  if (!tip) return { error: "Alege ce fel de organizație ești." };
  const organizatie = txt(f.organizatie, 200);
  if (!organizatie) return { error: "Scrie numele școlii, al firmei sau al organizației." };
  const email = cleanEmail(f.email);
  if (!email) return { error: "Adresa de email nu pare bună." };
  const numar = f.numar === "" || f.numar == null ? null : Math.round(Number(f.numar));
  if (numar !== null && (!Number.isFinite(numar) || numar < 1 || numar > 100_000)) return { error: "Numărul de elevi sau angajați nu pare bun." };
  if (f.consent !== "on" && f.consent !== true) return { error: "Bifează acordul ca să-ți putem răspunde." };
  return { ok: { tip, organizatie, localitate: txt(f.localitate, 120), rol: txt(f.rol, 120), numar, email, telefon: txt(f.telefon, 40), mesaj: txt(f.mesaj, 2000), consent: true } };
}

export const PARTNERSHIP_CONSENT = "Sunt de acord ca datele de mai sus să fie folosite doar ca să primesc un răspuns și oferta cerută.";

/** Formularul trimis: organizație + persoană de contact (cu acordul ei) + deal + activitate; apare în „Azi” chiar de azi. */
export async function submitPartnership(db: Db, p: PartnershipForm, now = new Date()) {
  const org = await upsertOrg(db, { tip: p.tip as OrgType, nume: p.organizatie, localitate: p.localitate, sursaDatelor: "formular /parteneriate" }, now);
  const [c] = await db.insert(crmContacts).values({ organizationId: org.id, nume: null, rol: p.rol, email: p.email, telefon: p.telefon, consimtamant: true,
    sursaConsimtamant: `formular /parteneriate: ${PARTNERSHIP_CONSENT}`, consimtamantAt: now, createdAt: now }).returning({ id: crmContacts.id });
  const produs: DealProduct = p.tip === "scoala" ? (p.numar && p.numar <= 40 ? "coduri_clasa" : "coduri_scoala") : "abonamente_firma";
  await addDeal(db, { organizationId: org.id, produs, conturiEstimate: p.numar, etapa: "interesat", urmatorulPas: "Răspunde la cererea din formular", dataUrmatoruluiPas: now }, now);
  await addActivity(db, { tip: "formular", canal: "site", rezumat: [p.rol && `Rol: ${p.rol}`, p.numar && `${p.numar} elevi/angajați`, p.mesaj].filter(Boolean).join(" · ") || "Cerere din formular", at: now, organizationId: org.id, contactId: c.id });
  await setOrgStatus(db, org.id, "interesat", { now });
  return org.id;
}
