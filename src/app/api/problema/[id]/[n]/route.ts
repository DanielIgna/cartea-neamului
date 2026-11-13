import { eq } from "drizzle-orm";
import { db } from "@/db";
import { problemReport } from "@/db/schema";
import { currentUser } from "@/lib/access";
import { isAdminUser } from "@/lib/admin";
import { getObjectBytes } from "@/lib/storage";

/** O poză atașată la o problemă raportată. O văd doar cel care a trimis-o și adminul. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const me = await currentUser();
  const no = () => new Response("Nu există.", { status: 404 });
  if (!me || !/^[0-9a-f-]{36}$/i.test(id) || !/^\d$/.test(n)) return no();
  const [r] = await db.select({ userId: problemReport.userId, images: problemReport.images }).from(problemReport).where(eq(problemReport.id, id));
  if (!r || (r.userId !== me.id && !isAdminUser(me))) return no();
  const img = r.images?.[Number(n)];
  if (!img) return no();
  try {
    return new Response(Buffer.from(await getObjectBytes(img.key)), { headers: { "Content-Type": img.type, "Cache-Control": "private, max-age=600", "X-Content-Type-Options": "nosniff" } });
  } catch (err) {
    console.error("problema: poza", id, err);
    return new Response("Poza nu se poate citi acum.", { status: 503 });
  }
}
