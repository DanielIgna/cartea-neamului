import { db } from "@/db";
import { candidates } from "@/lib/conversie";
import { planSettings } from "@/lib/plans";

const DAY = 86_400_000;

/**
 * Ziua „mutată” pentru simulator: ziua N din zilele gratuite ale contului (ziua 1 = prima zi), la o oră după începutul ei.
 * Cu plățile oprite, ca și cum ar fi pornit la facerea contului.
 */
export async function simulatedNow(userId: string, day: number): Promise<Date | null> {
  const [c] = userId ? await candidates(db, new Date(), userId) : [];
  if (!c || !Number.isFinite(day)) return null;
  const ps = await planSettings(db);
  const started = ps.on && ps.startedAt ? new Date(ps.startedAt).getTime() : 0;
  const start = Math.max(c.createdAt.getTime(), started);
  return new Date(start + (Math.min(Math.max(Math.round(day), 1), 60) - 1) * DAY + 3_600_000);
}
