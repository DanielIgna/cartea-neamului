/**
 * Ingestia CRM (POST /api/admin/crm/ingest, cu token): evenimentele trimise de asistentul care scrie școlilor și firmelor din
 * contact.carteaneamului@gmail.com. Emailurile trimise din afară se înregistrează aici; cele din campaniile CRM (src/lib/crm-campanii.ts) se scriu singure.
 *
 * Evenimente: email_trimis, email_nelivrat, raspuns, organizatie_noua. Fiecare are un `id` unic (al expeditorului), deci același
 * eveniment trimis de două ori se scrie o singură dată. Un refuz sau o dezabonare pune adresa imediat pe lista „nu contacta”;
 * un email nelivrat trece organizația la „nelivrat” și o pune la „de sunat”. Nicio replică nu pleacă de aici.
 */
import { timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { crmOrganizations } from "@/db/schema";
import { addActivity, classifyReply, cleanEmail, isOrgType, isReplyKind, orgByEmail, setOrgStatus, suppress, upsertOrg, type ReplyKind } from "./crm";

export const INGEST_TYPES = ["email_trimis", "email_nelivrat", "raspuns", "organizatie_noua"] as const;
export const MAX_EVENTS = 200;

const Org = z.object({
  nume: z.string().trim().min(1).max(200).optional(),
  tip: z.string().optional(),
  email: z.string().max(200).optional(),
  localitate: z.string().max(120).optional(),
  judet: z.string().max(60).optional(),
  tara: z.string().max(40).optional(),
  site: z.string().max(300).optional(),
  telefon: z.string().max(60).optional(),
  sursa_datelor: z.string().max(500).optional(),
});
export const IngestEvent = z.object({
  id: z.string().trim().min(1).max(200),
  type: z.enum(INGEST_TYPES),
  at: z.string().datetime({ offset: true }).optional(),
  email: z.string().max(200).optional(), // adresa organizației (destinatarul sau expeditorul răspunsului)
  subiect: z.string().max(300).optional(),
  rezumat: z.string().max(4000).optional(),
  clasificare: z.string().optional(), // interesat / intrebare / refuz / dezabonare / automat; lipsă = după reguli
  organizatie: Org.optional(),
});
export type IngestEvent = z.infer<typeof IngestEvent>;
export type IngestResult = { id: string; ok: boolean; nou: boolean; note?: string; clasificare?: ReplyKind };

/** Tokenul din `Authorization: Bearer …` (CRM_INGEST_TOKEN în Vercel). Fără token pus, ingestia e închisă. */
export function ingestAuthorized(header: string | null, token = process.env.CRM_INGEST_TOKEN?.trim()): boolean {
  if (!token || token.length < 16 || !header?.startsWith("Bearer ")) return false;
  const a = Buffer.from(header.slice(7).trim()), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function orgFor(db: Db, ev: IngestEvent, now: Date) {
  const email = cleanEmail(ev.email ?? ev.organizatie?.email);
  if (email) {
    const found = await orgByEmail(db, email);
    if (found) return found.id;
  }
  const o = ev.organizatie;
  if (!o?.nume && !email) return null;
  const tip = isOrgType(o?.tip) ? o.tip : "alt_partener";
  const r = await upsertOrg(db, { tip, nume: o?.nume ?? email!.split("@")[1], emailOficial: email, localitate: o?.localitate, judet: o?.judet, tara: o?.tara, site: o?.site, telefon: o?.telefon, sursaDatelor: o?.sursa_datelor }, now);
  return r.id;
}

/** Ultimul email de campanie trimis organizației primește „a răspuns” (fără follow-up după asta). */
export async function markReplied(db: Db, orgId: string, at: Date) {
  await db.execute(sql`update crm_sends set replied_at = ${at.toISOString()} where id = (select id from crm_sends where organization_id = ${orgId}
    and replied_at is null and sent_at <= ${at.toISOString()} order by sent_at desc limit 1)`);
}

export async function ingestOne(db: Db, ev: IngestEvent, now = new Date()): Promise<IngestResult> {
  const at = ev.at ? new Date(ev.at) : now;
  const orgId = await orgFor(db, ev, now);
  if (!orgId) return { id: ev.id, ok: false, nou: false, note: "lipsește emailul sau numele organizației" };
  const ext = `ingest:${ev.id}`;
  const email = cleanEmail(ev.email ?? ev.organizatie?.email);
  if (ev.type === "organizatie_noua") {
    const nou = await addActivity(db, { tip: "nota", canal: "ingestie", rezumat: ev.rezumat ?? "Organizație adăugată", at, organizationId: orgId, externalId: ext });
    return { id: ev.id, ok: true, nou };
  }
  if (ev.type === "email_trimis") {
    const nou = await addActivity(db, { tip: "email_trimis", canal: "email", rezumat: ev.subiect ?? ev.rezumat ?? "Email trimis", at, organizationId: orgId, externalId: ext });
    if (nou) await setOrgStatus(db, orgId, "contactat", { now });
    return { id: ev.id, ok: true, nou };
  }
  if (ev.type === "email_nelivrat") {
    const nou = await addActivity(db, { tip: "email_nelivrat", canal: "email", rezumat: ev.rezumat ?? "Emailul nu a ajuns", at, organizationId: orgId, externalId: ext });
    if (nou) {
      await setOrgStatus(db, orgId, "nelivrat", { now });
      await db.update(crmOrganizations).set({ deSunat: true, updatedAt: now }).where(eq(crmOrganizations.id, orgId));
    }
    // Daniel, 18.11.2026: adresa care nu există intră pe „nu contacta” cu motivul „nelivrat” (organizația rămâne „de sunat”).
    if (email) await suppress(db, email, "nelivrat", { sursa: "ingestie", now });
    return { id: ev.id, ok: true, nou };
  }
  // raspuns
  const kind: ReplyKind = isReplyKind(ev.clasificare) ? ev.clasificare : classifyReply(`${ev.subiect ?? ""}\n${ev.rezumat ?? ""}`);
  const nou = await addActivity(db, { tip: "raspuns", canal: "email", rezumat: ev.rezumat ?? ev.subiect ?? "Răspuns", at, organizationId: orgId, externalId: ext, meta: { clasificare: kind, subiect: ev.subiect ?? null } });
  if (nou && kind !== "automat") await markReplied(db, orgId, at);
  if (kind === "refuz" || kind === "dezabonare") {
    // Lista „nu contacta” se pune chiar dacă evenimentul vine a doua oară: e partea care protejează omul.
    if (email) await suppress(db, email, kind === "refuz" ? "refuz" : "dezabonat", { sursa: "ingestie", now });
    await setOrgStatus(db, orgId, "nu_contacta", { now });
  } else if (nou && kind !== "automat") {
    await setOrgStatus(db, orgId, kind === "interesat" ? "interesat" : "a_raspuns", { now });
  }
  return { id: ev.id, ok: true, nou, clasificare: kind };
}

/** Un lot de evenimente (sau unul singur). Cele stricate se raportează, celelalte merg mai departe. */
export async function ingest(db: Db, body: unknown, now = new Date()): Promise<{ ok: boolean; results: IngestResult[]; error?: string }> {
  const list = Array.isArray(body) ? body : body && typeof body === "object" && Array.isArray((body as { events?: unknown }).events) ? (body as { events: unknown[] }).events : [body];
  if (list.length > MAX_EVENTS) return { ok: false, results: [], error: `cel mult ${MAX_EVENTS} de evenimente o dată` };
  const results: IngestResult[] = [];
  for (const raw of list) {
    const p = IngestEvent.safeParse(raw);
    if (!p.success) {
      const id = raw && typeof raw === "object" && typeof (raw as { id?: unknown }).id === "string" ? (raw as { id: string }).id : "?";
      results.push({ id, ok: false, nou: false, note: p.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ").slice(0, 300) });
      continue;
    }
    results.push(await ingestOne(db, p.data, now));
  }
  // Ciornele de răspuns apar imediat în Aprobări, dacă Daniel a pornit „CRM: ciorne de răspuns” (altfel, nimic).
  if (results.some((r) => r.nou && (r.clasificare === "interesat" || r.clasificare === "intrebare"))) {
    try {
      const { automationSwitches } = await import("./autonomie");
      const sw = await automationSwitches(db);
      if (sw["crm-ciorne"] && !sw.paused?.["crm-ciorne"]) await (await import("./crm-auto")).queueReplyDrafts(db, { now });
    } catch (e) {
      console.error("[crm] ciorne", e instanceof Error ? e.message : e);
    }
  }
  return { ok: results.every((r) => r.ok), results };
}
