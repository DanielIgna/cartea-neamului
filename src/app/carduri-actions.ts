"use server";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { clientIp } from "@/lib/securitate";
import {
  ATTEMPTS_PER_HOUR, attemptsLastHour, cancelCards, checkBatch, checkCode, checkPartner, createBatch, fingerprint, giftCardsEnabled,
  markDelivered, markSold, normalizeCode, partnerByToken, pinMatches, portalSession, portalSessionOk, recordAttempt, redeemCard,
  savePartner, setGiftCardsEnabled, setPartnerActive, setPartnerPin, type Target,
} from "@/lib/carduri-cadou";

const UUID = /^[0-9a-f-]{36}$/i;
const BASE = "/admin/carduri";

async function admin() {
  const me = await currentUser();
  if (!me || !(await adminReady(me))) redirect("/");
  return me.id;
}
const back = (path: string, q: Record<string, string | number> = {}) => {
  revalidatePath(BASE);
  const s = new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)])).toString();
  redirect(`${path}${s ? `?${s}` : ""}`);
};
const backTo = (form: FormData) => {
  const b = String(form.get("back") ?? "");
  return b.startsWith(BASE) && !b.startsWith("//") ? b.split("?")[0] : BASE;
};

/* ---------- Admin ---------- */

export async function toggleGiftCards(form: FormData) {
  const by = await admin();
  await setGiftCardsEnabled(db, form.get("on") === "1", by);
  revalidatePath("/activeaza");
  back(BASE, { ok: form.get("on") === "1" ? "Funcția e pornită." : "Funcția e oprită." });
}

export async function savePartnerAction(form: FormData) {
  const by = await admin();
  const id = String(form.get("id") ?? "");
  const r = checkPartner(Object.fromEntries(form));
  if ("error" in r) back(BASE, { eroare: r.error });
  else { await savePartner(db, UUID.test(id) ? id : null, (r as { ok: Parameters<typeof savePartner>[2] }).ok, by); back(BASE, { ok: "Magazinul e salvat." }); }
}

export async function togglePartnerAction(form: FormData) {
  const by = await admin();
  const id = String(form.get("id") ?? "");
  if (UUID.test(id)) await setPartnerActive(db, id, form.get("activ") === "1", by);
  back(BASE);
}

export async function setPinAction(form: FormData) {
  const by = await admin();
  const id = String(form.get("id") ?? "");
  const pin = String(form.get("pin") ?? "").trim();
  if (!UUID.test(id)) back(BASE);
  const token = await setPartnerPin(db, id, pin, by);
  if (!token) back(BASE, { eroare: "PIN-ul trebuie să aibă între 6 și 10 cifre." });
  back(BASE, { ok: "PIN-ul magazinului e schimbat. Trimite-i magazinului legătura și PIN-ul pe căi diferite (de pildă legătura pe email, PIN-ul la telefon)." });
}

export async function createBatchAction(form: FormData) {
  const by = await admin();
  const r = checkBatch(Object.fromEntries(form));
  if ("error" in r) back(BASE, { eroare: r.error });
  const id = await createBatch(db, (r as { ok: Parameters<typeof createBatch>[1] }).ok, by);
  revalidatePath(BASE);
  redirect(`${BASE}/lot/${id}?ok=${encodeURIComponent("Lotul e generat.")}`);
}

/** Ținta unei schimbări din formular: un cod, sau lotul (cu interval opțional „de la … până la …”). */
function targetOf(form: FormData): Target | { error: string } {
  const raw = String(form.get("cod") ?? "").trim();
  if (raw) {
    const cod = normalizeCode(raw);
    return cod ? { cod } : { error: "Codul nu are forma XXXX-XXXX-XXXX." };
  }
  const batchId = String(form.get("batchId") ?? "");
  if (!UUID.test(batchId)) return { error: "Scrie un cod sau alege lotul." };
  const num = (k: string) => { const v = String(form.get(k) ?? "").trim(); return v ? Number(v) : undefined; };
  const from = num("from"), to = num("to");
  if ((from !== undefined && (!Number.isInteger(from) || from < 1)) || (to !== undefined && (!Number.isInteger(to) || to < 1)) || (from && to && from > to))
    return { error: "Intervalul nu e bun (de la ≤ până la, numere de pe card)." };
  return { batchId, from, to };
}

export async function cardAction(form: FormData) {
  const by = await admin();
  const path = backTo(form);
  const t = targetOf(form);
  if ("error" in t) back(path, { eroare: t.error });
  const target = t as Target;
  const what = String(form.get("what") ?? "");
  const n = what === "vandut" ? await markSold(db, target, by, "admin")
    : what === "livrat" ? await markDelivered(db, target, by)
    : what === "anulat" ? await cancelCards(db, target, by) : -1;
  if (n < 0) back(path);
  const label = what === "vandut" ? "marcate vândute" : what === "livrat" ? "marcate livrate" : "anulate";
  back(path, n ? { ok: `${n} ${n === 1 ? "card" : "carduri"} ${label}.` } : { eroare: "Niciun card nu s-a schimbat (poate erau deja în starea asta, folosite sau anulate)." });
}

/* ---------- Pagina publică /activeaza ---------- */

async function whos(userId?: string | null) {
  const ip = clientIp(await headers()) ?? "necunoscut";
  return [fingerprint("ip", ip), ...(userId ? [fingerprint("u", userId)] : [])];
}

export async function activateAction(form: FormData) {
  const raw = String(form.get("cod") ?? "").slice(0, 40);
  const cod = normalizeCode(raw);
  const here = (r: string) => redirect(`/activeaza?${new URLSearchParams({ ...(cod ? { cod } : raw ? { cod: raw } : {}), r }).toString()}`);
  if (!(await giftCardsEnabled(db))) here("inactive");
  const me = await currentUser();
  const who = await whos(me?.id);
  if ((await attemptsLastHour(db, who)) >= ATTEMPTS_PER_HOUR) here("prea_multe");
  if (!cod) { await recordAttempt(db, who, false); here("invalid"); }
  if (!me) {
    // Fără cont: verificăm codul fără să-l folosim, apoi trimitem omul să intre sau să-și facă un cont și să revină aici.
    const r = await checkCode(db, cod!);
    await recordAttempt(db, who, r === "ok");
    if (r !== "ok") here(r);
    const next = `/activeaza?cod=${encodeURIComponent(cod!)}&r=gata`;
    redirect(`/intrare?mod=cont-nou&next=${encodeURIComponent(next)}`);
  }
  const res = await redeemCard(db, cod!, me!.id);
  await recordAttempt(db, who, res.result === "ok" || res.result === "used_by_you");
  revalidatePath("/plata");
  here(res.result);
}

/* ---------- Pagina magazinului /magazin/<token> ---------- */

const cookieName = (token: string) => `cn-magazin-${token.slice(0, 12)}`;

export async function portalLogin(form: FormData) {
  const token = String(form.get("token") ?? "");
  const p = await partnerByToken(db, token);
  if (!p || !p.activ || !(await giftCardsEnabled(db))) redirect(`/magazin/${encodeURIComponent(token)}`);
  const ip = clientIp(await headers()) ?? "necunoscut";
  const who = [fingerprint("pin", `${token}|${ip}`)];
  if ((await attemptsLastHour(db, who)) >= ATTEMPTS_PER_HOUR) redirect(`/magazin/${token}?r=prea_multe`);
  const ok = pinMatches(String(form.get("pin") ?? "").trim(), p!.pinHash);
  await recordAttempt(db, who, ok);
  if (!ok) redirect(`/magazin/${token}?r=pin`);
  (await cookies()).set(cookieName(token), portalSession(token, p!.pinHash!), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: `/magazin/${token}`, maxAge: 12 * 3600 });
  redirect(`/magazin/${token}`);
}

export async function portalLogout(form: FormData) {
  const token = String(form.get("token") ?? "");
  (await cookies()).delete({ name: cookieName(token), path: `/magazin/${token}` });
  redirect(`/magazin/${token}`);
}

/** Sesiunea paginii magazinului e validă? (folosită și de pagină) */
export async function portalSignedIn(token: string, pinHash: string | null) {
  return portalSessionOk((await cookies()).get(cookieName(token))?.value, token, pinHash);
}

export async function portalMarkSold(form: FormData) {
  const token = String(form.get("token") ?? "");
  const p = await partnerByToken(db, token);
  if (!p || !p.activ || !(await giftCardsEnabled(db)) || !(await portalSignedIn(token, p.pinHash))) redirect(`/magazin/${encodeURIComponent(token)}`);
  const ip = clientIp(await headers()) ?? "necunoscut";
  const who = [fingerprint("mag", `${token}|${ip}`)];
  // Mai larg decât la clienți (un magazin poate vinde multe într-o zi), dar tot cu plafon, ca PIN-ul furat să nu ghicească coduri.
  if ((await attemptsLastHour(db, who)) >= 120) redirect(`/magazin/${token}?r=prea_multe`);
  // Fie codul, fie lotul + numărul de pe card („Lot 3FA2 · Nr. 7”), ca vânzătorul să nu trebuiască să răzuiască cardul.
  const cod = normalizeCode(String(form.get("cod") ?? ""));
  const batchId = String(form.get("batchId") ?? ""), seq = Number(form.get("seq") ?? "");
  const target: Target | null = cod ? { cod } : UUID.test(batchId) && Number.isInteger(seq) && seq > 0 ? { batchId, from: seq, to: seq } : null;
  const n = target ? await markSold(db, target, null, "magazin", new Date(), p!.id) : 0;
  await recordAttempt(db, who, n > 0);
  revalidatePath(BASE);
  redirect(`/magazin/${token}?r=${n ? "vandut" : "nu"}${cod ? `&cod=${encodeURIComponent(cod)}` : seq > 0 ? `&nr=${seq}` : ""}`);
}
