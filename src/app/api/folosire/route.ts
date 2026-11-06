import { z } from "zod";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { hasConsent } from "@/lib/consent";
import { isDemo } from "@/lib/demo";
import { cleanupUsage, recordUsage, sectionOf } from "@/lib/usage";

export const dynamic = "force-dynamic";

const Beat = z.object({
  id: z.string().max(64).nullish(),
  path: z.string().max(500),
  hint: z.string().max(40).nullish(),
  seconds: z.number().min(0).max(100_000),
  view: z.boolean().optional(),
  phone: z.boolean().optional(),
  app: z.boolean().optional(),
});
const none = () => new Response(null, { status: 204 });

/**
 * Bătăile trimise de browser (src/components/UsageBeat.tsx) cât stă omul, activ, într-o pagină. Se păstrează doar la cei care au
 * spus „Bine” și niciodată la contul de probă. Răspunsul e mereu gol, ca browserul să nu afle nimic din el.
 */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me || isDemo(me.email)) return none();
  if (!(await hasConsent(db, me.id, "usage"))) return none();
  const parsed = Beat.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return none();
  const section = sectionOf(parsed.data.path, parsed.data.hint);
  if (!section) return none();
  const { id, seconds, view, phone, app } = parsed.data;
  await recordUsage(db, me.id, section, { id, seconds, view: !!view, phone: !!phone, app: !!app });
  // Din când în când, curățenie: zilele mai vechi de 13 luni pleacă.
  if (Math.random() < 0.02) await cleanupUsage(db).catch(() => {});
  return none();
}
