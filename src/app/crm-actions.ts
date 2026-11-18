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

async function admin() {
  const me = await currentUser();
  return (await adminReady(me)) ? me : null;
}
const s = (f: FormData, k: string) => String(f.get(k) ?? "");
const back = (path: string, msg?: string) => redirect(msg ? `${path}${path.includes("?") ? "&" : "?"}ok=${encodeURIComponent(msg)}` : path);

/* ---------- Import ---------- */

export type ImportState = { reports?: ImportReport[]; error?: string } | null;
export async function importAction(_: ImportState, form: FormData): Promise<ImportState> {
  const me = await admin();
  if (!me) return { error: "Doar pentru admin." };
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
  const id = s(form, "id");
  await addActivity(db, { tip: "apel", canal: "telefon", rezumat: txt(form.get("rezumat"), 500) ?? "Am sunat", organizationId: id, createdBy: me.id });
  await updateOrg(db, id, { deSunat: false });
  await setOrgStatus(db, id, "contactat");
  revalidatePath("/admin/crm");
  back("/admin/crm", "Apelul e trecut în istoric.");
}

/* ---------- Deal-uri ---------- */

export async function newDealAction(form: FormData) {
  const me = await admin();
  if (!me) return;
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
  await updateDeal(db, s(form, "deal"), Object.fromEntries(form.entries()) as Record<string, unknown>);
  const to = s(form, "back") || "/admin/crm?t=pipeline";
  revalidatePath("/admin/crm");
  back(to.startsWith("/admin/crm") ? to : "/admin/crm?t=pipeline", "Salvat.");
}

/* ---------- Aprobări ---------- */

export async function decideAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  const d = s(form, "decizie");
  if (d !== "aprobat" && d !== "respins") return;
  const r = await decideApproval(db, s(form, "id"), d, me.id, { subiect: txt(form.get("subiect"), 300) ?? undefined, text: txt(form.get("text"), 8000) ?? undefined });
  revalidatePath("/admin/crm");
  back("/admin/crm?t=aprobari", r.ok ? (d === "aprobat" ? "Aprobat." : "Respins.") : `Nu s-a putut: ${r.why}.`);
}

/* ---------- Nu contacta ---------- */

export async function suppressAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  const motiv = s(form, "motiv");
  const v = await suppress(db, s(form, "valoare"), isSuppressionReason(motiv) ? motiv : "nu_contacta", { sursa: "adăugat manual", by: me.id });
  revalidatePath("/admin/crm");
  back("/admin/crm?t=nucontacta", v ? `${v} e pe listă.` : "Scrie o adresă de email sau un domeniu (de pildă scoala.ro).");
}
export async function unsuppressAction(form: FormData) {
  const me = await admin();
  if (!me) return;
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
  const { refreshSignals } = await import("@/lib/crm-scor");
  const r = await refreshSignals(db);
  revalidatePath("/admin/crm");
  back("/admin/crm?t=scor", `Recalculat: ${r.users} conturi, ${r.changed} schimbate.`);
}

/* ---------- Automatizările (Etapa 4) ---------- */

export async function limitsAction(form: FormData) {
  const me = await admin();
  if (!me) return;
  const { CrmLimits, saveCrmLimits } = await import("@/lib/crm-auto");
  const p = CrmLimits.safeParse({ reactivare: s(form, "reactivare"), ambasador: s(form, "ambasador"), ciorne: s(form, "ciorne") });
  if (!p.success) back("/admin/crm?t=automatizari", `Nesalvat: ${p.error.issues[0]?.message ?? "valori greșite"}`);
  else {
    await saveCrmLimits(db, p.data, me.id);
    revalidatePath("/admin/crm");
    back("/admin/crm?t=automatizari", "Limitele pe zi au fost salvate.");
  }
}
