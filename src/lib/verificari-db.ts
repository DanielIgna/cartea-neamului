/**
 * Răspunsurile din „De verificat în arbore”, câte o listă pe arbore, în app_setting (cheia `verificari:<arbore>`).
 * Un răspuns dat rămâne adevărul arborelui: întrebarea nu mai apare, pentru nimeni.
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";
import type { Decisions } from "./verificari";

const keyOf = (treeId: string) => `verificari:${treeId}`;
const Shape = z.record(z.object({ choice: z.string(), by: z.string().nullable().default(null), at: z.string() }));

export async function loadDecisions(db: Pick<Db, "select">, treeId: string): Promise<Decisions> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, keyOf(treeId)));
  const parsed = Shape.safeParse(row?.value ?? {});
  return parsed.success ? parsed.data : {};
}

export async function saveDecision(db: Db, treeId: string, key: string, choice: string, by: string, now = new Date()) {
  const all = { ...(await loadDecisions(db, treeId)), [key]: { choice, by, at: now.toISOString() } };
  await db.insert(appSetting).values({ key: keyOf(treeId), value: all, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: all, updatedBy: by, updatedAt: now } });
}
