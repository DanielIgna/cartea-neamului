"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { addActivity, isActivityType, isDealProduct, isOrgType, isSuppressionReason, setOrgStatus, suppress, txt, unsuppress, upsertOrg } from "@/lib/crm";
import { addDeal, checkPartnershipForm, decideApproval, submitPartnership, updateDeal, updateOrg } from "@/lib/crm-admin";
import { importCsv, isImportKind, kindOfFile, type ImportReport } from "@/lib/crm-import";
import { contactRateOk } from "@/lib/contact";
import { crmAudit, formDiff } from "@/lib/crm-curatenie";

async function admin() {
  const me = await currentUser();
  return (await adminReady(me)) ? me : null;
}
const s = (f: FormData, k: string) => String(f.get(k) ?? "");
/**
 * Formularele cu două butoane (name/value, de pildă „Trimite acum” / „Nu trimite”) țin id-ul în „rid”, nu în „id”: un câmp numit
 * „id” acoperă form.id în browser, iar React pierde atunci valoarea butonului apăsat (Daniel, 27.11.2026, Aprobări).
 */
const rid = (f: FormData) => String(f.get("rid") ?? f.get("id") ?? "");
const back = (path: string, msg?: string) => redirect(msg ? `${path}${path.includes("?") ? "&" : "?"}ok=${encodeURIComponent(msg)}` : path);

/* ---------- Import ---------- */

export type ImportState = { reports?: ImportReport[]; error?: string } | null;
export async function importAction(_: ImportState, form: FormData): Promise<ImportState> {
  const me = await admin();
  if (!me) return { error: "Doar pentru admin." };
  await crmAudit(db, me.id, "import CSV", form.get("id") as string | null, formDiff(form));
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Alege cel puțin un fișier CSV." };
  const chosen = s(form, "kind");
  const reports: ImportReport[] = [];
  for (const file of files) {
    if (file.size > 950_000) return { error: `${file.name}: fișierul e prea mare (cel mult 1 MB); împarte-l în bucăți.` };
    const kind = kindOfFile(file.name) ?? (isImportKind(chosen) ? chosen : null);
    if (!kind) return { error: `${file.name}: nu știu ce fel de listă e. Denumește-l ca în listă (de ex. scoli_trimise.csv) sau alege felul.` };
    reports.push(await importCsv(db, kind, await file.text(), me.id));
  }
  revalidatePath("/admin/crm");
  return { reports };
}

/* ---------- Organizații ---------- */

export async function newOrgAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "organizație nouă", form.get("id") as string | null, formDiff(form));
  const tip = s(form, "tip");
  const nume = txt(form.get("nume"), 200);
  if (!isOrgType(tip) || !nume) return back("/admin/crm?t=organizatii", "Scrie numele și alege tipul.");
  const o = await upsertOrg(db, { tip, nume, localitate: txt(form.get("localitate")), judet: txt(form.get("judet"), 4), tara: txt(form.get("tara"), 40), site: txt(form.get("site"), 300),
    emailOficial: txt(form.get("email")), telefon: txt(form.get("telefon"), 40), sursaDatelor: txt(form.get("sursa"), 500) });
  redirect(`/admin/crm/org/${o.id}`);
}

export async function updateOrgAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "organizație modificată", form.get("id") as string | null, formDiff(form));
  const id = s(form, "id");
  const f = Object.fromEntries([...form.entries()].filter(([k]) => k !== "id")) as Record<string, unknown>;
  f.deSunat = form.get("deSunat") === "on";
  await updateOrg(db, id, f);
  if (form.get("status") === "nu_contacta" && form.get("emailOficial")) await suppress(db, s(form, "emailOficial"), "nu_contacta", { sursa: "fișa organizației", by: me.id });
  revalidatePath(`/admin/crm/org/${id}`);
  back(`/admin/crm/org/${id}`, "Salvat.");
}

export async function addActivityAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "activitate adăugată", form.get("id") as string | null, formDiff(form));
  const id = s(form, "id"), tip = s(form, "tip");
  if (!isActivityType(tip)) return;
  const rezumat = txt(form.get("rezumat"), 2000);
  await addActivity(db, { tip, canal: txt(form.get("canal"), 40), rezumat, organizationId: id, createdBy: me.id });
  if (tip === "apel" || tip === "whatsapp" || tip === "email_trimis") await setOrgStatus(db, id, "contactat");
  revalidatePath(`/admin/crm/org/${id}`);
  back(`/admin/crm/org/${id}`, "Trecut în istoric.");
}

/** „Am sunat” din „Azi”: o notă scurtă și organizația iese din „de sunat”. */
export async function calledAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "am sunat", form.get("id") as string | null, formDiff(form));
  const id = s(form, "id");
  await addActivity(db, { tip: "apel", canal: "telefon", rezumat: txt(form.get("rezumat"), 500) ?? "Am sunat", organizationId: id, createdBy: me.id });
  await updateOrg(db, id, { deSunat: false });
  await setOrgStatus(db, id, "contactat");
  await (await import("@/lib/crm-sarcini")).closeCallTasks(db, id, me.id);
  revalidatePath("/admin/crm");
  back("/admin/crm", "Apelul e trecut în istoric.");
}

/* ---------- Deal-uri ---------- */

export async function newDealAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "deal nou", form.get("id") as string | null, formDiff(form));
  const id = s(form, "id"), produs = s(form, "produs");
  if (!isDealProduct(produs)) return;
  const d = await addDeal(db, { organizationId: id, produs });
  await updateDeal(db, d, Object.fromEntries(form.entries()) as Record<string, unknown>);
  revalidatePath(`/admin/crm/org/${id}`);
  back(`/admin/crm/org/${id}`, "Deal adăugat.");
}

export async function updateDealAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "deal modificat", form.get("id") as string | null, formDiff(form));
  await updateDeal(db, s(form, "deal"), Object.fromEntries(form.entries()) as Record<string, unknown>);
  const to = s(form, "back") || "/admin/crm?t=pipeline";
  revalidatePath("/admin/crm");
  back(to.startsWith("/admin/crm") ? to : "/admin/crm?t=pipeline", "Salvat.");
}

/* ---------- Aprobări ---------- */

export async function decideAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "aprobare decisă", rid(form), formDiff(form));
  const d = s(form, "decizie");
  if (d !== "aprobat" && d !== "respins") return;
  const r = await decideApproval(db, rid(form), d, me.id, { subiect: txt(form.get("subiect"), 300) ?? undefined, text: txt(form.get("text"), 8000) ?? undefined });
  revalidatePath("/admin/crm");
  back("/admin/crm?t=aprobari", r.ok ? (d === "aprobat" ? "Aprobat." : "Respins.") : `Nu s-a putut: ${r.why}.`);
}

/* ---------- Nu contacta ---------- */

export async function suppressAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "pus pe „nu contacta”", form.get("id") as string | null, formDiff(form));
  const motiv = s(form, "motiv");
  const v = await suppress(db, s(form, "valoare"), isSuppressionReason(motiv) ? motiv : "nu_contacta", { sursa: "adăugat manual", by: me.id });
  revalidatePath("/admin/crm");
  back("/admin/crm?t=nucontacta", v ? `${v} e pe listă.` : "Scrie o adresă de email sau un domeniu (de pildă scoala.ro).");
}
export async function unsuppressAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "scos de pe „nu contacta”", form.get("id") as string | null, formDiff(form));
  await unsuppress(db, s(form, "valoare"));
  revalidatePath("/admin/crm");
  back("/admin/crm?t=nucontacta", "Scos de pe listă.");
}

/* ---------- Formularul public /parteneriate ---------- */

export type PartnershipState = { ok?: boolean; error?: string } | null;
export async function partnershipAction(_: PartnershipState, form: FormData): Promise<PartnershipState> {
  if (s(form, "website").trim()) return { ok: true }; // câmpul ascuns: doar roboții îl completează
  const checked = checkPartnershipForm(Object.fromEntries(form.entries()));
  if ("error" in checked) return { error: checked.error };
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "?";
  if (!contactRateOk(`parteneriate:${ip}`, Date.now(), 3)) return { error: "Ai trimis deja câteva cereri. Încearcă din nou peste o oră." };
  await submitPartnership(db, checked.ok);
  const { notifyInbound } = await import("@/lib/emailuri");
  await notifyInbound({ kind: "contact", name: checked.ok.organizatie, email: checked.ok.email, phone: checked.ok.telefon, city: checked.ok.localitate, page: "/parteneriate",
    message: `Cerere de parteneriat (${checked.ok.tip}): ${checked.ok.rol ?? ""} · ${checked.ok.numar ?? "?"} elevi/angajați\n\n${checked.ok.mesaj ?? ""}` }).catch(() => null);
  return { ok: true };
}

/* ---------- Scorurile ---------- */

export async function recomputeAction() {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "recalculare scoruri", null, null);
  const { refreshSignals } = await import("@/lib/crm-scor");
  const r = await refreshSignals(db);
  revalidatePath("/admin/crm");
  back("/admin/crm?t=scor", `Recalculat: ${r.users} conturi, ${r.changed} schimbate.`);
}

/* ---------- Automatizările (Etapa 4) ---------- */

export async function limitsAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "limite pe zi", form.get("id") as string | null, formDiff(form));
  const { CrmLimits, saveCrmLimits } = await import("@/lib/crm-auto");
  const p = CrmLimits.safeParse({ reactivare: s(form, "reactivare"), ambasador: s(form, "ambasador"), ciorne: s(form, "ciorne"), campanii: s(form, "campanii") });
  if (!p.success) back("/admin/crm?t=automatizari", `Nesalvat: ${p.error.issues[0]?.message ?? "valori greșite"}`);
  else {
    await saveCrmLimits(db, p.data, me.id);
    revalidatePath("/admin/crm");
    back("/admin/crm?t=automatizari", "Limitele pe zi au fost salvate.");
  }
}

/* ---------- Campaniile (Etapa 5) ---------- */

const CAMP = "/admin/crm?t=campanii";

export async function saveTemplateAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "șablon salvat", form.get("id") as string | null, formDiff(form));
  const { TemplateInput, saveTemplate } = await import("@/lib/crm-campanii");
  const p = TemplateInput.safeParse({ nume: s(form, "nume"), tipOrg: s(form, "tipOrg"), subiect: s(form, "subiect"), corp: s(form, "corp"), butonText: s(form, "butonText"), butonCale: s(form, "butonCale") });
  if (!p.success) back(CAMP, `Nesalvat: ${p.error.issues[0]?.message ?? "date greșite"}`);
  else {
    const id = s(form, "id");
    await saveTemplate(db, p.data, me.id, /^[0-9a-f-]{36}$/i.test(id) ? id : null);
    revalidatePath("/admin/crm");
    back(CAMP, "Șablonul a fost salvat.");
  }
}

export async function newCampaignAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "campanie nouă", form.get("id") as string | null, formDiff(form));
  const { CampaignInput, createCampaign } = await import("@/lib/crm-campanii");
  const fu = s(form, "followUpZile");
  const p = CampaignInput.safeParse({
    nume: s(form, "nume"), templateId: s(form, "templateId"), tip: s(form, "tip"), judet: s(form, "judet"), localitate: s(form, "localitate"),
    statusuri: form.getAll("statusuri").map(String), includeContactati: form.get("includeContactati") === "on",
    limitaZi: s(form, "limitaZi") || 20, oraStart: s(form, "oraStart") || 9, oraSfarsit: s(form, "oraSfarsit") || 16,
    followUpZile: fu ? fu : null, followUpTemplateId: s(form, "followUpTemplateId") || null,
  });
  if (!p.success) back(CAMP, `Nesalvat: ${p.error.issues[0]?.message ?? "date greșite"}`);
  else {
    await createCampaign(db, p.data, me.id);
    revalidatePath("/admin/crm");
    back(CAMP, "Campania e salvată ca ciornă. Verifică destinatarii, trimite-ți o probă, apoi pornește-o.");
  }
}

export async function campaignStatusAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "stare campanie", rid(form), formDiff(form));
  const { isCampaignStatus, setCampaignStatus } = await import("@/lib/crm-campanii");
  const id = rid(form), st = s(form, "status");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !isCampaignStatus(st)) return;
  await setCampaignStatus(db, id, st);
  revalidatePath("/admin/crm");
  back(CAMP, st === "pornita" ? "Campania e pornită. Pleacă doar dacă „CRM: campanii către organizații” e pornită în Autonomie." : "Gata.");
}

export async function testMailAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "email de probă", form.get("id") as string | null, formDiff(form));
  const { sendTestMail } = await import("@/lib/crm-campanii");
  const id = s(form, "templateId");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const r = await sendTestMail(db, id, me.email);
  back(CAMP, "ok" in r && r.ok ? `Proba a plecat la ${me.email}.` : "Proba nu a plecat (verifică RESEND_API_KEY).");
}

export async function batchNowAction() {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "lot trimis acum", null, null);
  const { automationSwitches, runAutomation } = await import("@/lib/autonomie");
  const sw = await automationSwitches(db);
  if (!sw["crm-campanii"]) back(CAMP, "Pornește întâi „CRM: campanii către organizații” în Admin → Autonomie.");
  else {
    const r = await runAutomation(db, "crm-campanii", "manual", me.id);
    revalidatePath("/admin/crm");
    back(CAMP, r.note);
  }
}

/* ---------- Gmail (Etapa 6) ---------- */

export async function gmailSyncAction() {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "Gmail citit acum", null, null);
  const { runAutomation } = await import("@/lib/autonomie");
  const r = await runAutomation(db, "crm-gmail", "manual", me.id);
  revalidatePath("/admin/crm");
  back("/admin/crm?t=sanatate", r.note);
}

export async function gmailUnlinkAction() {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "Gmail dezlegat", null, null);
  const { gmailState, saveGmailState } = await import("@/lib/crm-gmail");
  const st = await gmailState(db);
  await saveGmailState(db, { ...st, sealed: undefined, linkedAt: undefined }, me.id);
  revalidatePath("/admin/crm");
  back("/admin/crm?t=sanatate", "Gmail a fost dezlegat. Poți scoate și accesul din contul Google (Securitate → Aplicații terțe).");
}

/* ---------- Banii (Etapa 7) ---------- */

export async function orgCodeAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "cod organizație", form.get("id") as string | null, formDiff(form));
  const id = s(form, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const { createOrgCode } = await import("@/lib/crm-bani");
  let msg: string;
  try {
    msg = `Codul organizației: ${await createOrgCode(db, id)} (aceeași reducere ca NEAM90).`;
  } catch (e) {
    msg = `Codul nu s-a făcut: ${e instanceof Error ? e.message : "eroare"}`;
  }
  revalidatePath(`/admin/crm/org/${id}`);
  back(`/admin/crm/org/${id}`, msg);
}

export async function linkSchoolAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "școală legată", form.get("id") as string | null, formDiff(form));
  const id = s(form, "id"), school = s(form, "schoolId");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const { linkSchool, refreshOrgAccounts } = await import("@/lib/crm-bani");
  await linkSchool(db, id, /^[0-9a-f-]{36}$/i.test(school) ? school : null);
  await refreshOrgAccounts(db);
  revalidatePath(`/admin/crm/org/${id}`);
  back(`/admin/crm/org/${id}`, "Școala a fost legată.");
}

/* ---------- Sarcinile (Etapa 8) ---------- */

export async function newTaskAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "sarcină nouă", form.get("id") as string | null, formDiff(form));
  const id = s(form, "id");
  const { addTask, dueFrom } = await import("@/lib/crm-sarcini");
  const due = dueFrom(s(form, "cand"), s(form, "data"));
  const titlu = txt(form.get("titlu"), 300);
  const path = /^[0-9a-f-]{36}$/i.test(id) ? `/admin/crm/org/${id}` : "/admin/crm";
  if (!titlu || !due) back(path, "Scrie ce e de făcut și alege termenul.");
  else {
    await addTask(db, { organizationId: /^[0-9a-f-]{36}$/i.test(id) ? id : null, titlu, scadenta: due, by: me.id });
    revalidatePath("/admin/crm");
    back(path, `Sarcina e pusă pe ${due.toLocaleDateString("ro-RO", { timeZone: "Europe/Bucharest", weekday: "long", day: "numeric", month: "long" })}.`);
  }
}

export async function closeTaskAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "sarcină închisă", rid(form), formDiff(form));
  const id = rid(form);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const { closeTask } = await import("@/lib/crm-sarcini");
  const st = s(form, "status") === "anulata" ? "anulata" : "facuta";
  const t = await closeTask(db, id, st, me.id);
  if (t?.org && st === "facuta") await addActivity(db, { tip: "sarcina", canal: "crm", rezumat: `Făcut: ${t.titlu}`, organizationId: t.org, createdBy: me.id });
  revalidatePath("/admin/crm");
  const ret = s(form, "back");
  back(ret.startsWith("/admin/crm") ? ret : "/admin/crm", st === "facuta" ? "Bifat ca făcut." : "Sarcina a fost anulată.");
}

/* ---------- Profesorii ambasadori (Etapa 10) ---------- */

const PROF = "/admin/crm?t=profesori";

export async function newAmbassadorAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "profesor nou", form.get("id") as string | null, formDiff(form));
  const { AmbassadorInput, createAmbassador } = await import("@/lib/crm-ambasadori");
  const p = AmbassadorInput.safeParse({ nume: s(form, "nume"), email: s(form, "email"), telefon: s(form, "telefon"), acord: form.get("acord") === "on",
    organizationId: s(form, "organizationId") || null, schoolCodeId: s(form, "schoolCodeId") || null, nota: s(form, "nota") });
  if (!p.success) back(PROF, `Nesalvat: ${p.error.issues[0]?.message ?? "date greșite"}`);
  else {
    const a = await createAmbassador(db, p.data, me.id);
    revalidatePath("/admin/crm");
    back(PROF, `Profesorul e adăugat. Linkul lui: ?src=prof-${a.slug}`);
  }
}

export async function ambassadorCodeAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "cod profesor", form.get("id") as string | null, formDiff(form));
  const id = s(form, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const { ambassadorCode } = await import("@/lib/crm-ambasadori");
  let msg: string;
  try { msg = `Codul profesorului: ${await ambassadorCode(db, id)}`; } catch (e) { msg = `Codul nu s-a făcut: ${e instanceof Error ? e.message : "eroare"}`; }
  revalidatePath("/admin/crm");
  back(PROF, msg);
}

export async function payoutAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "recompensă dată", form.get("id") as string | null, formDiff(form));
  const id = s(form, "id"), suma = Number(s(form, "suma"));
  if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isFinite(suma) || suma <= 0 || suma > 100000) back(PROF, "Scrie suma dată (în lei).");
  else {
    const { addPayout } = await import("@/lib/crm-ambasadori");
    await addPayout(db, id, suma, txt(form.get("nota"), 300), me.id);
    revalidatePath("/admin/crm");
    back(PROF, "Recompensa dată e trecută.");
  }
}

export async function rewardRulesAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "reguli recompensă", form.get("id") as string | null, formDiff(form));
  const { RewardRules, saveRewardRules } = await import("@/lib/crm-ambasadori");
  const p = RewardRules.safeParse({ leiPerCont: s(form, "leiPerCont"), leiPerPlata: s(form, "leiPerPlata"), pragAnGratuit: s(form, "pragAnGratuit"), minimPlata: s(form, "minimPlata") });
  if (!p.success) back(PROF, "Nesalvat: verifică numerele.");
  else {
    await saveRewardRules(db, p.data, me.id);
    revalidatePath("/admin/crm");
    back(PROF, "Regulile recompensei au fost salvate.");
  }
}

export async function toggleAmbassadorAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  await crmAudit(db, me.id, "profesor pornit/oprit", form.get("id") as string | null, formDiff(form));
  const id = s(form, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const { crmAmbassadors } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  await db.update(crmAmbassadors).set({ activ: s(form, "activ") === "1" }).where(eq(crmAmbassadors.id, id));
  revalidatePath("/admin/crm");
  back(PROF, "Gata.");
}

/* ---------- Curățenie: dubluri, ștergere GDPR (Etapa 11) ---------- */

const CUR = "/admin/crm?t=curatenie";
const isId = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

export async function mergeAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  const keep = s(form, "keep"), drop = s(form, "drop");
  if (!isId(keep) || !isId(drop) || keep === drop || s(form, "confirm") !== "on") back(CUR, "Bifează „Am văzut previzualizarea” ca să unești.");
  else {
    const { mergeOrgs } = await import("@/lib/crm-curatenie");
    const ok = await mergeOrgs(db, keep, drop, me.id);
    revalidatePath("/admin/crm");
    back(ok ? `/admin/crm/org/${keep}` : CUR, ok ? "Organizațiile au fost unite." : "Nu s-au putut uni (poate una a fost deja ștearsă).");
  }
}

export async function ignoreDupAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  const a = s(form, "a"), b = s(form, "b");
  if (!isId(a) || !isId(b)) return;
  const { crmAudit: log, ignoreDuplicate } = await import("@/lib/crm-curatenie");
  await ignoreDuplicate(db, a, b, me.id);
  await log(db, me.id, "nu sunt dubluri", a, { a, b });
  revalidatePath("/admin/crm");
  back(CUR, "Perechea nu mai apare la dubluri.");
}

export async function gdprDeleteAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  const id = s(form, "id");
  if (!isId(id) || s(form, "confirm") !== "STERGE") back(isId(id) ? `/admin/crm/org/${id}` : "/admin/crm", "Scrie STERGE ca să confirmi ștergerea.");
  else {
    const { gdprDeleteOrg } = await import("@/lib/crm-curatenie");
    await gdprDeleteOrg(db, id, { keepSuppression: form.get("keep") === "on", by: me.id });
    revalidatePath("/admin/crm");
    back("/admin/crm?t=organizatii", "Organizația, persoanele ei și istoricul au fost șterse.");
  }
}

export async function gdprDeleteContactAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  const id = s(form, "id"), org = s(form, "org");
  if (!isId(id)) return;
  const { gdprDeleteContact } = await import("@/lib/crm-curatenie");
  await gdprDeleteContact(db, id, { keepSuppression: form.get("keep") === "on", by: me.id });
  revalidatePath("/admin/crm");
  back(isId(org) ? `/admin/crm/org/${org}` : "/admin/crm", "Persoana de contact a fost ștearsă.");
}
