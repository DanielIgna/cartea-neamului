import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { CARD_ORIGIN, activationUrl, batchById, batchCards, STATUS_LABEL, toCsv, type CardStatus } from "@/lib/carduri-cadou";

export const dynamic = "force-dynamic";

/** Codurile unui lot (CSV), cu legătura de activare a fiecăruia: pentru tipografie sau pentru evidența magazinului. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!(await adminReady(me))) return new Response("Nu există.", { status: 404 });
  const { id } = await params;
  const b = /^[0-9a-f-]{36}$/i.test(id) ? await batchById(db, id) : null;
  if (!b) return new Response("Nu există.", { status: 404 });
  const cards = await batchCards(db, id);
  const csv = toCsv(
    ["Nr", "Cod", "Stare", "Magazin", "Plan", "Luni", "Preț raft (lei)", "Vândut la", "Folosit la", "Legătura de activare"],
    cards.map((c) => [c.seq, c.cod, STATUS_LABEL[c.status as CardStatus] ?? c.status, b.partner, b.plan, b.durataLuni, b.pretRaftLei, c.soldAt, c.redeemedAt, activationUrl(CARD_ORIGIN, c.cod)]),
  );
  const day = b.createdAt.toISOString().slice(0, 10);
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="carduri-${day}-${id.slice(0, 8)}.csv"`, "cache-control": "no-store" } });
}
