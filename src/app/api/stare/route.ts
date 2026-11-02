import { sql } from "drizzle-orm";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { aiConfigured } from "@/lib/ai";
import { realtimeConfigured } from "@/lib/realtime";
import { bucketReachable, storageConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";

async function check(fn: () => Promise<unknown>) {
  const t = Date.now();
  try {
    return { ok: true, ms: Date.now() - t, detail: await fn() };
  } catch (e) {
    return { ok: false, ms: Date.now() - t, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** Starea serviciilor Neon folosite de aplicație (doar pentru utilizatori logați; nu expune chei). */
export async function GET() {
  if (!(await currentUser())) return Response.json({ error: "Intră în cont." }, { status: 401 });
  const fnUrl = process.env.NEON_FUNCTION_HELLO_BASE_URL;
  const [postgres, storage, fn] = await Promise.all([
    check(async () => {
      const r = await db.execute(sql`select count(*)::int as persoane from person`);
      return { driver: process.env.DATABASE_URL ? "neon (node-postgres)" : "pglite (local)", ...(r.rows?.[0] ?? {}) };
    }),
    storageConfigured() ? check(bucketReachable) : null,
    fnUrl ? check(() => fetch(fnUrl, { signal: AbortSignal.timeout(10_000) }).then((r) => r.json())) : null,
  ]);
  return Response.json({
    postgres,
    storage: storage ?? { ok: false, detail: "neconfigurat" },
    function: fn ?? { ok: false, detail: "NEON_FUNCTION_HELLO_BASE_URL lipsește" },
    aiGateway: { ok: aiConfigured(), detail: aiConfigured() ? "configurat" : "neconfigurat" },
    realtime: { ok: realtimeConfigured(), detail: realtimeConfigured() ? "configurat" : "neconfigurat" },
  });
}
