import { eq } from "drizzle-orm";
import { db } from "@/db";
import { document } from "@/db/schema";
import { currentUser, roleIn } from "@/lib/access";
import { presignedGetUrl, storageConfigured } from "@/lib/storage";

/** Deschide fișierul unui document: verificăm că e membru al arborelui, apoi redirecționăm spre un URL presemnat, valabil 10 minute. */
export async function GET(_: Request, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const me = await currentUser();
  if (!me) return new Response("Intră în cont.", { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(docId)) return new Response("Documentul nu există.", { status: 404 });
  const [d] = await db.select({ treeId: document.treeId, fileKey: document.fileKey }).from(document).where(eq(document.id, docId));
  if (!d || !(await roleIn(db, d.treeId, me.id))) return new Response("Documentul nu există.", { status: 404 });
  if (!d.fileKey) return new Response("Documentul nu are fișier atașat.", { status: 404 });
  if (!storageConfigured()) return new Response("Stocarea de fișiere nu e configurată.", { status: 503 });
  return Response.redirect(await presignedGetUrl(d.fileKey), 302);
}
