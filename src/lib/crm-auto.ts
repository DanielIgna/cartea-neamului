/**
 * Automatizările CRM (Daniel, 17.11.2026, CRM Etapa 4). Toate sunt OPRITE până le pornește Daniel din Admin → Autonomie (sau din
 * Admin → CRM → Automatizări); fiecare are limită zilnică, jurnal (automation_run) și verifică lista „nu contacta”.
 *
 * - `crm-reactivare`: celor „în risc” (din scorul CRM) care au spus „Da” la sfaturile pe email: UN email util (o idee concretă de
 *   completat arborele, nu reclamă), cel mult unul la 30 de zile, cu dezabonare dintr-un clic.
 * - `crm-ambasador`: cine a adus cel puțin 2 conturi: un mesaj de mulțumire + propunerea de a deveni partener local (City Partners).
 *   Nu pleacă singur: intră în Coada de aprobări.
 * - `crm-ciorne`: la răspunsurile „interesat” / „întrebare” de la școli și firme: o ciornă de răspuns în Coada de aprobări.
 *   Nicio replică nu pleacă fără „Aprob”.
 *
 * Restul automatizărilor din cerință există deja și nu se dublează: emailul de 24 h (`activare`), emailurile din zilele gratuite
 * (`conversie`), îndemnul „Invită-l pe … ” după 5 persoane (src/lib/invita-ramura.ts), alerta „nelivrat” (src/lib/crm-ingest.ts).
 */
import { sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { appSetting, automationMark } from "@/db/schema";
import { addActivity, isSuppressed } from "./crm";
import { queueApproval } from "./crm-admin";
import { realAccountSql } from "./conturi-test";
import { SITE_URL } from "./site-url";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  return ((await db.execute(q)).rows ?? []) as T[];
}
const DAY = 86_400_000;

/* ---------- Limitele zilnice ---------- */

export const LIMITS_KEY = "crm_limite";
const lim = (max: number) => z.coerce.number({ invalid_type_error: "Scrie un număr." }).int("Scrie un număr întreg.").min(0, "Cel puțin 0.").max(max, `Cel mult ${max}.`);
export const CrmLimits = z.object({ reactivare: lim(200), ambasador: lim(50), ciorne: lim(100), campanii: lim(200) });
export type CrmLimits = z.infer<typeof CrmLimits>;
export const DEFAULT_LIMITS: CrmLimits = { reactivare: 20, ambasador: 5, ciorne: 30, campanii: 20 };
export const REACTIVATION_GAP_DAYS = 30;

export async function crmLimits(db: Pick<Db, "select">): Promise<CrmLimits> {
  try {
    const [r] = await db.select({ v: appSetting.value }).from(appSetting).where(sql`${appSetting.key} = ${LIMITS_KEY}`);
    const p = CrmLimits.safeParse({ ...DEFAULT_LIMITS, ...((r?.v ?? {}) as object) });
    return p.success ? p.data : DEFAULT_LIMITS;
  } catch {
    return DEFAULT_LIMITS;
  }
}
export async function saveCrmLimits(db: Pick<Db, "insert">, v: CrmLimits, by: string | null, now = new Date()) {
  await db.insert(appSetting).values({ key: LIMITS_KEY, value: v, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: v, updatedBy: by, updatedAt: now } });
}

/* ---------- Textele (româna; engleza pentru celelalte limbi) ---------- */

export type ReactivationTip = "bunici" | "intrebari" | "ruda";
/** Ideea potrivită omului: arbore mic → bunicii; arbore fără amintiri → întrebările pentru bunici; altfel → o rudă care completează. */
export const tipFor = (o: { treePersons: number; media: boolean }): ReactivationTip => (o.treePersons < 5 ? "bunici" : !o.media ? "intrebari" : "ruda");

const TIP_PATH: Record<ReactivationTip, string> = { bunici: "/arbore", intrebari: "/ghid/intrebari-pentru-bunici", ruda: "/invitatii" };
const RO = {
  subject: { bunici: "O idee pentru arborele tău: bunicii", intrebari: "Trei întrebări de pus bunicilor săptămâna asta", ruda: "Cine din familie ar mai ști ceva?" },
  body: {
    bunici: "Bună, {name}!\n\nArborele tău are încă puține nume. Cel mai ușor pas de azi: scrie numele bunicilor, chiar și fără date. De multe ori numele de fată al bunicii deschide o ramură întreagă.\n\nDacă nu le știi, întreabă un părinte sau o mătușă: durează cinci minute la telefon.",
    intrebari: "Bună, {name}!\n\nArborele tău are deja nume. Ce lipsește de obicei sunt poveștile. Trei întrebări bune pentru bunici: Cum arăta casa în care ați crescut? Cum v-ați cunoscut? Ce meserie avea tatăl dumneavoastră?\n\nScrie răspunsurile în Lada cu amintiri, ca să rămână în familie.",
    ruda: "Bună, {name}!\n\nArborele tău a crescut frumos. Acum cel mai mult ajută o rudă care știe altă ramură: un văr, o mătușă, un frate. Trimite-i linkul tău și completează ea ce știe.",
  },
  button: { bunici: "Adaugă bunicii", intrebari: "Vezi întrebările", ruda: "Trimite linkul unei rude" },
  why: "Primești acest email pentru că ai spus „Da” la sfaturile pe email. Îți scriem cel mult o dată pe lună.",
  unsubscribe: "Nu mai vreau sfaturi pe email",
};
const EN = {
  subject: { bunici: "An idea for your family tree: your grandparents", intrebari: "Three questions to ask your grandparents this week", ruda: "Who else in the family might know something?" },
  body: {
    bunici: "Hi {name}!\n\nYour tree still has only a few names. The easiest step today: add your grandparents' names, even without dates. A grandmother's maiden name often opens a whole new branch.\n\nIf you don't know them, ask a parent or an aunt: it takes five minutes on the phone.",
    intrebari: "Hi {name}!\n\nYour tree already has names. What is usually missing are the stories. Three good questions for grandparents: What was the house you grew up in like? How did you meet? What did your father do for a living?\n\nWrite the answers in the Memory chest so they stay in the family.",
    ruda: "Hi {name}!\n\nYour tree has grown nicely. What helps most now is a relative who knows another branch: a cousin, an aunt, a sibling. Send them your link and let them fill in what they know.",
  },
  button: { bunici: "Add your grandparents", intrebari: "See the questions", ruda: "Send your link to a relative" },
  why: "You are getting this email because you said “Yes” to tips by email. We write at most once a month.",
  unsubscribe: "No more tips by email",
};
export const reactivationText = (locale: string) => (locale === "ro" ? RO : EN);

export function ambassadorDraft(name: string, brought: number) {
  const first = name.split(" ")[0] || name;
  return {
    subiect: "Mulțumim că ne-ai adus familia și prietenii",
    text: `Bună, ${first}!\n\nPrin linkul tău și-au făcut cont ${brought} oameni în Cartea Neamului. Îți mulțumim din inimă.\n\nDacă ai vrea, te putem face partener local: primești un link și un afiș cu cod QR pentru biserica, școala sau magazinul din zona ta, iar pentru fiecare an plătit prin ele primești un comision. Răspunde-mi la acest email și îți trimit detaliile.\n\nCu drag,\nDaniel, Cartea Neamului`,
  };
}

export function replyDraft(kind: "interesat" | "intrebare", orgName: string) {
  return kind === "interesat"
    ? { subiect: `Re: Cartea Neamului pentru ${orgName}`, text: `Bună ziua,\n\nVă mulțumesc pentru răspuns! Pentru ${orgName} putem pregăti coduri cu reducere, valabile un an, câte unul pentru fiecare elev sau coleg. Ca să vi le trimit, am nevoie de: numărul aproximativ de elevi/angajați, clasele interesate (dacă e o școală) și acordul conducerii.\n\nFișele gratuite pentru proiectul de la clasă sunt aici: ${SITE_URL}/scoala\n\nCu stimă,\nDaniel Igna, Cartea Neamului` }
    : { subiect: `Re: Cartea Neamului pentru ${orgName}`, text: `Bună ziua,\n\nVă mulțumesc pentru întrebare. [Răspunsul tău aici.]\n\nPe scurt: fiecare elev sau coleg își face arborele familiei online, adună poveștile bunicilor și îl poate tipări. Primele 7 zile sunt gratuite, fără card, iar pentru grupuri dăm coduri cu reducere.\n\nCu stimă,\nDaniel Igna, Cartea Neamului` };
}

/* ---------- Reactivarea ---------- */

export type ReactivationCandidate = { id: string; name: string; email: string; locale: string; tree_persons: number; media: boolean };

/** Cei „în risc”, cu acordul pentru sfaturi dat acum, reali, fără email de reactivare în ultimele 30 de zile. */
export async function reactivationCandidates(db: Db, now = new Date()): Promise<ReactivationCandidate[]> {
  const since = new Date(now.getTime() - REACTIVATION_GAP_DAYS * DAY).toISOString();
  const r = await rows<Row>(db, sql`
    select u.id, u.name, u.email, u.locale, coalesce((s.detalii->>'treePersons')::int, 0) as tree_persons,
      (exists (select 1 from memory mm where mm.author_id = u.id) or exists (select 1 from document d where d.uploaded_by = u.id and d.kind in ('photo','audio'))) as media
    from crm_user_signals s join "user" u on u.id = s.user_id
    where s.etapa = 'in_risc' and ${realAccountSql("u")}
      and coalesce((select c.granted from consent c where c.user_id = u.id and c.purpose = 'news' order by c.created_at desc limit 1), false)
      and not exists (select 1 from automation_mark k where k.automation = 'crm-reactivare' and k.ref like u.id || ':%' and k.at > ${since})
    order by s.scor desc, u.id`);
  return r.map((x) => ({ id: String(x.id), name: String(x.name ?? ""), email: String(x.email), locale: String(x.locale ?? "ro"), tree_persons: Number(x.tree_persons ?? 0), media: !!x.media }));
}

type Mailer = (m: { to: string; subject: string; html: string; text: string; tag: string; idempotencyKey?: string; headers?: Record<string, string>; marketing?: boolean }) => Promise<{ ok?: boolean; skipped?: boolean }>;
const defaultMailer: Mailer = async (m) => {
  const r = await (await import("./email")).sendEmail(m);
  return "skipped" in r ? { skipped: true } : { ok: r.ok };
};

export async function runReactivation(db: Db, o: { now?: Date; limit?: number; mailer?: Mailer; dryRun?: boolean } = {}) {
  const now = o.now ?? new Date();
  const limit = o.limit ?? (await crmLimits(db)).reactivare;
  const people = await reactivationCandidates(db, now);
  const { unsubscribeToken } = await import("./crestere");
  const { footerFor, renderMail } = await import("./emailuri");
  const { isLocale } = await import("@/i18n/locales");
  const mailer = o.mailer ?? defaultMailer;
  const out = { candidates: people.length, sent: 0, suppressed: 0, failed: 0, previews: [] as { email: string; subject: string; text: string }[] };
  for (const u of people) {
    if (out.sent >= limit) break;
    if (await isSuppressed(db, u.email)) { out.suppressed++; continue; }
    const t = reactivationText(u.locale);
    const tip = tipFor({ treePersons: u.tree_persons, media: u.media });
    const name = u.name.split(" ")[0] || u.name;
    const tok = unsubscribeToken(u.id);
    const unsub = `${SITE_URL}/dezabonare?u=${encodeURIComponent(u.id)}&t=${tok}`;
    const body = t.body[tip].replace("{name}", name);
    const { html, text } = renderMail([
      ...body.split("\n\n").map((p) => ({ p })),
      { button: t.button[tip], href: `${SITE_URL}${TIP_PATH[tip]}?utm_source=email&utm_medium=email&utm_campaign=reactivare` },
      { note: t.why, link: t.unsubscribe, href: unsub },
    ], await footerFor(isLocale(u.locale) ? u.locale : "ro"));
    if (o.dryRun) { out.previews.push({ email: u.email, subject: t.subject[tip], text }); out.sent++; continue; }
    const day = now.toISOString().slice(0, 10);
    const r = await mailer({ to: u.email, subject: t.subject[tip], html, text, tag: "reactivare", marketing: true, idempotencyKey: `reactivare-${u.id}-${day}`,
      headers: { "List-Unsubscribe": `<${SITE_URL}/api/vesti/dezabonare?u=${encodeURIComponent(u.id)}&t=${tok}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
    if (r.ok) {
      await db.insert(automationMark).values({ automation: "crm-reactivare", ref: `${u.id}:${day}`, at: now }).onConflictDoNothing();
      await addActivity(db, { tip: "email_trimis", canal: "email", rezumat: `Reactivare: ${t.subject[tip]}`, at: now, userId: u.id, externalId: `reactivare:${u.id}:${day}` });
      out.sent++;
    } else if (r.skipped) out.suppressed++;
    else out.failed++;
  }
  return out;
}

/* ---------- Ambasadorii ---------- */

export async function queueAmbassadors(db: Db, o: { now?: Date; limit?: number } = {}) {
  const now = o.now ?? new Date();
  const limit = o.limit ?? (await crmLimits(db)).ambasador;
  const r = await rows<{ id: string; name: string; email: string; brought: unknown }>(db, sql`
    select u.id, u.name, u.email, coalesce((s.detalii->>'brought')::int, 0) as brought
    from crm_user_signals s join "user" u on u.id = s.user_id
    where s.etapa = 'ambasador' and ${realAccountSql("u")}
      and not exists (select 1 from crm_approvals a where a.dedupe_key = 'ambasador:' || u.id)
    order by s.scor desc limit ${limit}`);
  let queued = 0, skipped = 0;
  for (const u of r) {
    if (await isSuppressed(db, u.email)) { skipped++; continue; }
    const d = ambassadorDraft(u.name, Number(u.brought ?? 0));
    if (await queueApproval(db, { tipActiune: "email-ambasador", payload: { destinatar: u.email, ...d }, motiv: `A adus ${Number(u.brought ?? 0)} conturi: mulțumire + propunerea de partener local`, risc: "MEDIUM", userId: u.id, dedupeKey: `ambasador:${u.id}` }, now)) queued++;
  }
  return { candidates: r.length, queued, skipped };
}

/* ---------- Ciornele de răspuns ---------- */

/** O ciornă pentru fiecare răspuns „interesat” / „întrebare” din ultimele 14 zile care nu are încă una (și nu e pe listă). */
export async function queueReplyDrafts(db: Db, o: { now?: Date; limit?: number } = {}) {
  const now = o.now ?? new Date();
  const limit = o.limit ?? (await crmLimits(db)).ciorne;
  const since = new Date(now.getTime() - 14 * DAY).toISOString();
  const r = await rows<{ id: string; org: string; nume: string; email: string | null; kind: string }>(db, sql`
    select a.id, a.organization_id as org, o.nume, o.email_oficial as email, a.meta->>'clasificare' as kind
    from crm_activities a join crm_organizations o on o.id = a.organization_id
    where a.tip = 'raspuns' and a.at > ${since} and a.meta->>'clasificare' in ('interesat','intrebare') and o.status <> 'nu_contacta'
      and o.email_oficial is not null
      and not exists (select 1 from crm_approvals p where p.dedupe_key = 'raspuns:' || a.id)
      and not exists (select 1 from crm_activities b where b.organization_id = a.organization_id and b.at > a.at and b.tip in ('email_trimis','apel','whatsapp'))
    order by a.at limit ${limit}`);
  let queued = 0, skipped = 0;
  for (const x of r) {
    if (!x.email || (await isSuppressed(db, x.email))) { skipped++; continue; }
    const d = replyDraft(x.kind === "interesat" ? "interesat" : "intrebare", x.nume);
    if (await queueApproval(db, { tipActiune: "email-raspuns", payload: { destinatar: x.email, ...d }, motiv: `Ciornă de răspuns (${x.kind}); editeaz-o înainte de „Aprob”`, risc: "MEDIUM", organizationId: x.org, dedupeKey: `raspuns:${x.id}` }, now)) queued++;
  }
  return { candidates: r.length, queued, skipped };
}

/* ---------- Cifrele pentru Admin → CRM → Automatizări ---------- */

export async function automationStats(db: Db) {
  const [r] = await rows<Row>(db, sql`select
    (select count(*) from automation_mark where automation = 'crm-reactivare') as reactivari,
    (select count(*) from automation_mark k where k.automation = 'crm-reactivare'
      and exists (select 1 from session s where s.user_id = split_part(k.ref, ':', 1) and s.updated_at > k.at)) as revenit,
    (select count(*) from crm_approvals where tip_actiune = 'email-ambasador') as ambasadori,
    (select count(*) from crm_approvals where tip_actiune = 'email-ambasador' and status = 'aprobat') as ambasadori_trimisi,
    (select count(*) from crm_approvals where tip_actiune = 'email-raspuns') as ciorne,
    (select count(*) from crm_approvals where tip_actiune = 'email-raspuns' and status = 'aprobat') as ciorne_trimise,
    (select count(*) from conversion_mail) as conversie,
    (select count(*) from conversion_mail where paid_at is not null) as conversie_platit,
    (select count(*) from automation_mark where automation = 'activare') as activare,
    (select count(*) from automation_mark k where k.automation = 'activare' and exists (select 1 from tree t where t.owner_id = k.ref and t.created_at > k.at)) as activare_arbore,
    (select count(*) from automation_mark where automation = 'ramura-afisata') as ramura_afisata,
    (select count(*) from invitation where person_id is not null and accepted_at is not null) as ramura_acceptate`).catch(() => [{} as Row]);
  return Object.fromEntries(Object.entries(r ?? {}).map(([k, v]) => [k, Number(v ?? 0) || 0])) as Record<string, number>;
}
