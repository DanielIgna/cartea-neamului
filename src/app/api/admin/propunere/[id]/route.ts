import { eq } from "drizzle-orm";
import { db } from "@/db";
import { homeSubmission } from "@/db/schema";
import { currentUser } from "@/lib/access";
import { isAdminUser } from "@/lib/admin";
import { getObjectBytes } from "@/lib/storage";

/** Poza unei propuneri, pentru Admin → Propuneri. Până la aprobare o vede doar adminul. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isAdminUser(await currentUser())) return new Response("Nu există.", { status: 404 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Nu există.", { status: 404 });
  const [s] = await db.select({ key: homeSubmission.fileKey, type: homeSubmission.mimeType, status: homeSubmission.status }).from(homeSubmission).where(eq(homeSubmission.id, id));
  if (!s || s.status === "withdrawn" || s.status === "removed") return new Response("Nu există.", { status: 404 });
  try {
    return new Response(Buffer.from(await getObjectBytes(s.key)), { headers: { "Content-Type": s.type, "Cache-Control": "private, max-age=600", "X-Content-Type-Options": "nosniff" } });
  } catch (err) {
    console.error("propunere", id, err);
    return new Response("Poza nu se poate citi acum.", { status: 503 });
  }
}
