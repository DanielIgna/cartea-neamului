/**
 * Proba cerută de Daniel la pornirea codurilor de activare (25.11.2026), făcută o singură dată pe baza reală, la publicare
 * (scripts/deploy-db.ts): câte un cod de test pe fiecare plan (sursa „test”), activat pe un cont nou, făcut doar pentru probă;
 * se verifică planul și data, apoi același cod încă o dată (același cont și alt cont nou), ca să se vadă „deja folosit”.
 * La sfârșit codurile de test se anulează, iar conturile de probă se șterg (cu planul lor). Rezultatul rămâne în app_setting
 * și se vede în Admin → Coduri de activare. Nu atinge niciun cont adevărat, nicio plată și niciun abonament.
 */
import { randomBytes } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, activationCode, appSetting, auditLog, user } from "@/db/schema";
import { addMonths } from "./carduri-cadou";
import { activateCode, generateLot } from "./coduri-activare";
import type { Tier } from "./plans";

export const PROBA_KEY = "coduri_activare_proba_2026_11_25";

export type ProbaRow = {
  plan: Tier; cod: string; activare: string; planPrimit: string | null; valabilPana: string | null; asteptat: string;
  planOk: boolean; dataOk: boolean; aDouaOaraAcelasiCont: string; aDouaOaraAltCont: string; anulat: boolean;
};
export type Proba = { at: string; ok: boolean; rows: ProbaRow[]; conturiSterse: number; eroare?: string };

export async function probaResult(db: Pick<Db, "select">): Promise<Proba | null> {
  const [r] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, PROBA_KEY));
  return (r?.value as Proba | undefined) ?? null;
}

export async function probaOnce(db: Db, now = new Date()): Promise<string> {
  if (await probaResult(db)) return "deja";
  const tag = randomBytes(4).toString("hex");
  const users: string[] = [];
  const rows: ProbaRow[] = [];
  const codes: string[] = [];
  const newUser = async (label: string) => {
    const id = `proba-activare-${label}-${tag}`;
    await db.insert(user).values({ id, name: "Probă activare cod", email: `${id}@proba.carteaneamului.ro`, emailVerified: false, createdAt: now, updatedAt: now });
    users.push(id);
    return id;
  };
  let eroare: string | undefined;
  try {
    for (const plan of ["basic", "familie", "premium"] as const) {
      const { coduri: [cod] } = await generateLot(db, { plan, cantitate: 1, sursa: "test" }, null, now);
      codes.push(cod);
      const u = await newUser(plan);
      const r = await activateCode(db, cod, u, now);
      const [p] = await db.select({ tier: accountPlan.tier, paidUntil: accountPlan.paidUntil }).from(accountPlan).where(eq(accountPlan.userId, u));
      const asteptat = addMonths(now, 12);
      const again = await activateCode(db, cod, u, now);
      const other = await activateCode(db, cod, await newUser(`${plan}-2`), now);
      rows.push({
        plan, cod, activare: r.result, planPrimit: p?.tier ?? null, valabilPana: p?.paidUntil?.toISOString() ?? null, asteptat: asteptat.toISOString(),
        planOk: p?.tier === plan, dataOk: p?.paidUntil?.getTime() === asteptat.getTime(),
        aDouaOaraAcelasiCont: again.result, aDouaOaraAltCont: other.result, anulat: false,
      });
    }
  } catch (e) {
    eroare = e instanceof Error ? e.message : String(e);
  }
  // Codurile de test se anulează (sunt folosite, deci direct aici), iar conturile de probă se șterg cu planul lor.
  if (codes.length) {
    const done = await db.update(activationCode).set({ status: "anulat", cancelledAt: new Date() }).where(inArray(activationCode.cod, codes)).returning({ cod: activationCode.cod });
    for (const c of done) {
      await db.insert(auditLog).values({ treeId: null, actorId: null, entity: "cod_activare", entityId: c.cod, action: "anulat", diff: { proba: true }, createdAt: new Date() });
      const row = rows.find((x) => x.cod === c.cod);
      if (row) row.anulat = true;
    }
  }
  const gone = users.length ? await db.delete(user).where(inArray(user.id, users)).returning({ id: user.id }) : [];
  const ok = !eroare && rows.length === 3 && rows.every((r) => r.activare === "ok" && r.planOk && r.dataOk && r.aDouaOaraAcelasiCont === "used_by_you" && r.aDouaOaraAltCont === "used" && r.anulat);
  const proba: Proba = { at: now.toISOString(), ok, rows, conturiSterse: gone.length, ...(eroare ? { eroare } : {}) };
  await db.insert(appSetting).values({ key: PROBA_KEY, value: proba, updatedAt: new Date() }).onConflictDoNothing();
  return `${ok ? "reușită" : "cu probleme"}: ${rows.map((r) => `${r.plan} ${r.activare}/${r.aDouaOaraAltCont}`).join(", ")}${eroare ? ` (${eroare})` : ""}`;
}
