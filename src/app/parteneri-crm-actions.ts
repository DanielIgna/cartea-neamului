"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { checkPartner, isStage, savePartner, setPartnerPin, type PartnerInput } from "@/lib/carduri-cadou";
import { addContact, checkContact, deleteContact, ensureRefCode, setNextStep, setStage } from "@/lib/parteneri-crm";

const UUID = /^[0-9a-f-]{36}$/i;
const BASE = "/admin/parteneri";

async function admin() {
  const me = await currentUser();
  if (!me || !(await adminReady(me))) redirect("/");
  return me.id;
}
function go(path: string, q: Record<string, string> = {}): never {
  revalidatePath(BASE);
  revalidatePath("/admin/carduri");
  const s = new URLSearchParams(q).toString();
  redirect(`${path}${s ? `?${s}` : ""}`);
}

/** Partener nou sau schimbat, din fișa lui (cu etapa, categoria, județul, următorul pas). */
export async function saveCrmPartner(form: FormData) {
  const by = await admin();
  const id = String(form.get("id") ?? "");
  const r = checkPartner(Object.fromEntries(form));
  const here = UUID.test(id) ? `${BASE}/${id}` : `${BASE}/nou`;
  if ("error" in r) go(here, { eroare: r.error });
  const saved = await savePartner(db, UUID.test(id) ? id : null, (r as { ok: PartnerInput }).ok, by);
  go(`${BASE}/${saved}`, { ok: "Salvat." });
}

export async function setStageAction(form: FormData) {
  const by = await admin();
  const id = String(form.get("id") ?? ""), etapa = form.get("etapa");
  if (UUID.test(id) && isStage(etapa)) await setStage(db, id, etapa, by);
  go(`${BASE}/${id}`, { ok: "Etapa e schimbată." });
}

export async function addContactAction(form: FormData) {
  const by = await admin();
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) go(BASE);
  const r = checkContact(Object.fromEntries(form));
  if ("error" in r) go(`${BASE}/${id}`, { eroare: r.error });
  await addContact(db, id, (r as { ok: { canal: string; nota: string } }).ok, by);
  go(`${BASE}/${id}`, { ok: "Contactul e notat." });
}

export async function deleteContactAction(form: FormData) {
  await admin();
  const id = String(form.get("id") ?? ""), logId = String(form.get("logId") ?? "");
  if (UUID.test(id) && UUID.test(logId)) await deleteContact(db, id, logId);
  go(`${BASE}/${id}`);
}

/** Pasul următor e făcut: îl șterge din aducerile aminte (sau îl amână cu 7 zile). */
export async function stepDoneAction(form: FormData) {
  await admin();
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) go(BASE);
  const later = form.get("amana") === "1";
  const pas = later ? String(form.get("pas") ?? "") || null : null;
  await setNextStep(db, id, pas, later ? new Date(Date.now() + 7 * 86_400_000) : null);
  const back = String(form.get("back") ?? "");
  go(back === "lista" ? BASE : `${BASE}/${id}`, { ok: later ? "Amânat cu 7 zile." : "Pasul e făcut." });
}

export async function setPinCrm(form: FormData) {
  const by = await admin();
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) go(BASE);
  const token = await setPartnerPin(db, id, String(form.get("pin") ?? "").trim(), by);
  if (!token) go(`${BASE}/${id}`, { eroare: "PIN-ul trebuie să aibă între 6 și 10 cifre." });
  go(`${BASE}/${id}`, { ok: "PIN-ul e pus. Trimiteți legătura și PIN-ul pe căi diferite (legătura pe email, PIN-ul la telefon)." });
}

export async function refCodeAction(form: FormData) {
  await admin();
  const id = String(form.get("id") ?? "");
  if (UUID.test(id)) await ensureRefCode(db, id);
  go(`${BASE}/${id}`);
}
