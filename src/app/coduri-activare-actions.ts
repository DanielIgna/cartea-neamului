"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { clientIp } from "@/lib/securitate";
import { normalizeCode as giftCardCode } from "@/lib/carduri-cadou";
import {
  activateCode, activationWhos, cancelCodes, checkActivationCode, checkLot, generateLot, normalizeActivationCode, recordAttempt, tooManyAttempts,
} from "@/lib/coduri-activare";
import { sendActivationMail } from "@/lib/coduri-activare-email";

/* ---------- Pagina publică /activare ---------- */

export async function activareAction(form: FormData) {
  const raw = String(form.get("cod") ?? "").trim().slice(0, 40);
  const cod = normalizeActivationCode(raw);
  const here = (r: string) => redirect(`/activare?${new URLSearchParams({ ...(cod ? { cod } : raw ? { cod: raw } : {}), r }).toString()}`);
  // Un cod de card din magazin (XXXX-XXXX-XXXX) are pagina lui, cu regulile lui.
  if (!cod && giftCardCode(raw)) redirect(`/activeaza?cod=${encodeURIComponent(giftCardCode(raw)!)}`);
  const me = await currentUser();
  const who = activationWhos(clientIp(await headers()) ?? "necunoscut", me?.id);
  if (await tooManyAttempts(db, who)) here("prea_multe");
  if (!cod) { await recordAttempt(db, who, false); here("invalid"); }
  if (!me) {
    // Fără cont: verificăm codul fără să-l folosim, apoi omul intră sau își face cont și revine aici, cu codul păstrat.
    const r = await checkActivationCode(db, cod!);
    await recordAttempt(db, who, r === "ok");
    if (r !== "ok") here(r);
    redirect(`/intrare?mod=cont-nou&next=${encodeURIComponent(`/activare?cod=${encodeURIComponent(cod!)}&r=gata`)}`);
  }
  const res = await activateCode(db, cod!, me!.id);
  await recordAttempt(db, who, res.result === "ok" || res.result === "used_by_you" || res.result === "has_subscription");
  if (res.result === "ok" && res.plan && res.until) {
    await sendActivationMail(db, { userId: me!.id, cod: cod!, plan: res.plan, until: res.until }).catch((e) => console.error("Emailul de activare a eșuat", e));
    revalidatePath("/plata");
    here(res.extended ? "ok_prelungit" : "ok");
  }
  here(res.result);
}

/* ---------- Admin → Coduri de activare ---------- */

const BASE = "/admin/coduri-activare";

async function admin() {
  const me = await currentUser();
  if (!me || !(await adminReady(me))) redirect("/");
  return me.id;
}

const back = (q: Record<string, string>) => {
  revalidatePath(BASE);
  redirect(`${BASE}?${new URLSearchParams(q).toString()}`);
};

export async function generateLotAction(form: FormData) {
  const by = await admin();
  const r = checkLot(Object.fromEntries(form));
  if ("error" in r) back({ eroare: r.error });
  const v = (r as { ok: Parameters<typeof generateLot>[1] }).ok;
  const { lot, coduri } = await generateLot(db, v, by);
  back({ lot, ok: `Am generat ${coduri.length} ${coduri.length === 1 ? "cod" : coduri.length < 20 ? "coduri" : "de coduri"} (${v.plan}, sursa ${v.sursa}). Descarcă CSV-ul lotului de mai jos.` });
}

export async function cancelCodesAction(form: FormData) {
  const by = await admin();
  const ids = form.getAll("id").map(String);
  const n = await cancelCodes(db, ids, by);
  const keep = Object.fromEntries(["status", "sursa", "lot"].map((k) => [k, String(form.get(`f_${k}`) ?? "")]).filter(([, v]) => v));
  back({ ...keep, ...(n ? { ok: `Am anulat ${n} ${n === 1 ? "cod" : n < 20 ? "coduri" : "de coduri"}.` } : { eroare: "Niciun cod nu s-a anulat (doar codurile nefolosite se pot anula)." }) });
}
