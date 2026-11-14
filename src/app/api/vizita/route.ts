import { z } from "zod";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { isAdminUser } from "@/lib/admin";
import { isDemo } from "@/lib/demo";
import { clientIp } from "@/lib/securitate";
import { cleanupVisits, isBot, recordVisit } from "@/lib/vizite";
import { cleanupConversions, recordConversion } from "@/lib/conversii";
import { ctaTarget } from "@/lib/cta";

export const dynamic = "force-dynamic";

const Body = z.object({
  path: z.string().max(500),
  ref: z.string().max(500).nullish(),
  us: z.string().max(80).nullish(),
  um: z.string().max(80).nullish(),
  uc: z.string().max(120).nullish(),
  w: z.number().int().min(0).max(10_000).nullish(),
  lang: z.string().max(10).nullish(),
  /** Clic pe un buton de început: adresa spre care duce (/intrare, /plata…). Nu e o pagină nouă, ci o conversie. */
  cta: z.string().max(60).nullish(),
});
const none = () => new Response(null, { status: 204 });

/**
 * O pagină deschisă, trimisă de src/components/VisitBeacon.tsx, numărată anonim (src/lib/vizite.ts). Adminii și contul de probă
 * nu se numără, ca să nu umfle cifrele. Răspunsul e mereu gol.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return none();
  const me = await currentUser().catch(() => null);
  if (me && (isDemo(me.email) || isAdminUser(me))) return none();
  const h = req.headers;
  const d = parsed.data;
  if (d.cta) {
    const target = ctaTarget(d.cta) ?? (/^[a-z0-9-]{2,40}$/.test(d.cta) ? d.cta : null);
    if (target && !isBot(h.get("user-agent"))) await recordConversion(db, "cta", { headers: h, label: target, page: d.path });
    return none();
  }
  try {
    await recordVisit(db, { path: d.path, ref: d.ref, utmSource: d.us, utmMedium: d.um, utmCampaign: d.uc, width: d.w, lang: d.lang }, {
      ip: clientIp(h), ua: h.get("user-agent"), host: h.get("host"), country: h.get("x-vercel-ip-country"),
      region: h.get("x-vercel-ip-country-region"), city: h.get("x-vercel-ip-city"), logged: !!me,
    });
    if (Math.random() < 0.01) await Promise.all([cleanupVisits(db).catch(() => {}), cleanupConversions(db).catch(() => {})]);
  } catch (e) {
    console.error("vizita: nu s-a putut număra", e);
  }
  return none();
}
