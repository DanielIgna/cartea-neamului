/**
 * Proba completă a CRM-ului, cu date false (Daniel, 18.11.2026): organizații, campanie, trimitere, livrat/deschis/click,
 * nelivrat, dezabonare, răspunsuri din Gmail (simulat), sarcini, bani, profesori, rapoarte, dubluri, sănătate și alerte.
 *
 * - Fără DATABASE_URL rulează pe o bază în memorie (PGlite) și NU trimite niciun email (trimiterile se scriu în consolă).
 * - Cu DATABASE_URL-ul unei baze de PREVIEW (niciodată producția) și CRM_TEST_RECIPIENT=<adresa ta>, emailurile pleacă doar la
 *   adresa de test. Scriptul refuză să ruleze pe o bază care nu are „preview”, „test” sau „dev” în nume.
 *
 *   npx tsx scripts/crm-proba.ts
 */
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { crmSends, payment, user, accountSource } from "@/db/schema";
import { upsertOrg } from "@/lib/crm";
import { srcOf } from "@/lib/crm-admin";
import { CampaignInput, createCampaign, runCampaignBatch, saveTemplate, setCampaignStatus, trackSend, type CampaignMailer } from "@/lib/crm-campanii";
import { ingest } from "@/lib/crm-ingest";
import { refreshOrgAccounts, moneyByOrg } from "@/lib/crm-bani";
import { dueTasks, morningDigest } from "@/lib/crm-sarcini";
import { funnel, templateStats } from "@/lib/crm-rapoarte";
import { AmbassadorInput, ambassadorList, createAmbassador } from "@/lib/crm-ambasadori";
import { findDuplicates } from "@/lib/crm-curatenie";
import { alertsFor, crmHealth } from "@/lib/crm-sanatate";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (url && !/(preview|test|dev)/i.test(url)) throw new Error("DATABASE_URL nu pare o bază de preview/test: nu rulez pe producție.");
  if (url && !process.env.CRM_TEST_RECIPIENT) throw new Error("Pe o bază reală pune și CRM_TEST_RECIPIENT, ca emailurile să plece doar la tine.");
  const db = createDb();
  await runMigrations(db);
  const wed = new Date("2026-11-18T08:00:00Z");
  const step = (t: string) => console.log(`\n== ${t}`);

  step("Organizații false");
  const orgs = [];
  for (let i = 1; i <= 6; i++) orgs.push(await upsertOrg(db, { tip: "scoala", nume: `Școala de Probă ${i}`, localitate: "Cluj-Napoca", judet: "CJ", emailOficial: `secretariat@proba-${i}.example.ro` }));
  await upsertOrg(db, { tip: "scoala", nume: "Scoala de Proba 1", localitate: "Cluj-Napoca", telefon: "0264000000" });
  console.log(`${orgs.length + 1} organizații (una e dublură intenționată)`);

  step("Campanie și trimitere (luni–vineri, fereastră, limită 4)");
  const tpl = await saveTemplate(db, { nume: "Probă A", tipOrg: "scoala", subiect: "Proiect pentru {organizatie}", corp: "Bună ziua,\n\nPentru elevii din {localitate} avem fișe gratuite.", butonText: "Vedeți fișele", butonCale: "/scoala" }, null);
  const camp = await createCampaign(db, CampaignInput.parse({ nume: "Probă", templateId: tpl, tip: "scoala", limitaZi: 4 }), null);
  await setCampaignStatus(db, camp, "pornita", wed);
  let k = 0;
  const live = !!url && !!process.env.RESEND_API_KEY;
  const mailer: CampaignMailer = live ? async (m) => (await import("@/lib/email")).sendEmail(m) : async (m) => { console.log(`  [nu se trimite] către ${m.to}: ${m.subject}`); return { ok: true, id: `re_proba_${++k}` }; };
  console.log(await runCampaignBatch(db, { now: wed, mailer, dailyCap: 20 }));

  step("Urmărire: livrat, deschis, click, nelivrat, dezabonare");
  const sends = await db.select().from(crmSends);
  await trackSend(db, sends[0].id, "livrat", wed);
  await trackSend(db, sends[0].id, "click", wed);
  await trackSend(db, sends[1].id, "nelivrat", wed);
  await trackSend(db, sends[2].id, "dezabonat", wed);

  step("Răspunsuri (ca din Gmail)");
  const later = new Date(wed.getTime() + 3600_000);
  console.log((await ingest(db, [
    { id: "g1", type: "raspuns", email: sends[0].email, rezumat: "Suntem interesați, trimiteți-ne detalii", clasificare: "interesat" },
    { id: "g2", type: "raspuns", email: sends[3].email, rezumat: "Nu suntem interesați", clasificare: "refuz" },
  ], later)).results);

  step("Bani: cont adus prin link, plată → client");
  const [o0] = await db.execute(`select id, tip, slug from crm_organizations where email_oficial = '${sends[0].email}'`).then((r) => r.rows as { id: string; tip: string; slug: string }[]);
  await db.insert(user).values({ id: "proba-elev", name: "Elev Probă", email: "elev.proba@gmail.com" });
  await db.insert(accountSource).values({ userId: "proba-elev", firstSrc: srcOf(o0.tip, o0.slug) });
  await db.insert(payment).values({ id: "cs_proba", userId: "proba-elev", kind: "an", amount: 4900, currency: "ron" });
  console.log(await refreshOrgAccounts(db, later), (await moneyByOrg(db)).get(o0.id));

  step("Profesor ambasador");
  await createAmbassador(db, AmbassadorInput.parse({ nume: "Profesoara Probă", acord: false, organizationId: o0.id }), null, later);
  console.log((await ambassadorList(db)).map((a) => ({ nume: a.nume, link: a.slug, elevi: a.elevi })));

  step("Sarcini, rezumatul de dimineață");
  console.log((await dueTasks(db, later)).map((t) => t.titlu));
  console.log((await morningDigest(db, later)).text);

  step("Rapoarte");
  console.log(await funnel(db), (await templateStats(db)).map((t) => ({ nume: t.nume, trimise: t.trimise, raspunsuri: t.raspunsuri, rata: t.rataRaspuns })));

  step("Dubluri, sănătate, alerte");
  console.log((await findDuplicates(db)).map((d) => `${d.a.nume} ~ ${d.b.nume} (${d.motiv})`));
  const h = await crmHealth(db, later);
  console.log({ sentToday: h.sentToday, bounce: h.bounce, unread: h.unread, blocked: h.blocked }, alertsFor(h, later).map((a) => a.text));
  console.log("\nProba s-a terminat fără erori.");
}

main().catch((e) => { console.error(e); process.exit(1); });
