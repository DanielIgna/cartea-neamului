"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { autoDef, automationSwitches, isAutoKey, runAutomation, runLoop, saveSwitches } from "@/lib/autonomie";

export type AutoState = { ok?: string; error?: string } | null;

async function admin() {
  const me = await currentUser();
  return (await adminReady(me)) ? me : null;
}

const done = () => { revalidatePath("/admin/autonomie"); revalidatePath("/admin", "layout"); };

/** Comutatorul unei automatizări. Pornirea uneia „cu acordul tău” e chiar acordul: din clipa aceea le scrie oamenilor singură. */
export async function toggleAutomation(_: AutoState, form: FormData): Promise<AutoState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  const key = form.get("key");
  if (!isAutoKey(key)) return { error: "Automatizare necunoscută." };
  const sw = await automationSwitches(db);
  sw[key] = form.get("on") === "1";
  if (sw[key] && sw.paused?.[key]) { const p = { ...sw.paused }; delete p[key]; sw.paused = p; }
  await saveSwitches(db, sw, me.id);
  done();
  return { ok: `${autoDef(key).label}: ${sw[key] ? "pornită" : "oprită"}.` };
}

/** „Rulează acum” pentru una: cele cu aprobare doar pregătesc lista. */
export async function runAutomationNow(_: AutoState, form: FormData): Promise<AutoState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  const key = form.get("key");
  if (!isAutoKey(key)) return { error: "Automatizare necunoscută." };
  const r = await runAutomation(db, key, "manual", me.id);
  done();
  return r.status === "eroare" ? { error: r.note } : { ok: r.note };
}

/** „Aprobă”: abia acum se face schimbarea pregătită (de ex. problemele lămurite trec la „Rezolvată”). */
export async function approveAutomation(_: AutoState, form: FormData): Promise<AutoState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  const key = form.get("key");
  if (!isAutoKey(key) || autoDef(key).risk !== "aprobare") return { error: "Nu e nimic de aprobat aici." };
  const r = await runAutomation(db, key, "aprobare", me.id);
  done();
  return r.status === "eroare" ? { error: r.note } : { ok: r.note };
}

/** „Rulează bucla”: tot ce e pornit, apoi scorul nou (și poza zilei pentru grafic). */
export async function runLoopNow(_: AutoState): Promise<AutoState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  const { stats } = await runLoop(db, "manual", me.id);
  done();
  return { ok: `Am rulat ${stats.ran} automatizări · ${stats.acted} lucruri făcute · ${stats.pending} așteaptă aprobare · scor ${stats.score}.` };
}
