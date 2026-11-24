import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tree, treeMember } from "@/db/schema";
import { requireUser } from "@/lib/access";

export const dynamic = "force-dynamic";

/**
 * „Arborele meu” din meniul de sus (Daniel, 24.11.2026): duce direct în arbore, fără să știi că trebuie apăsat pe siglă.
 * Cel mai nou arbore al omului (ca butonul „Deschide arborele” de pe prima pagină); fără arbore, la primii pași de pe prima pagină.
 * Tot aici duc și emailurile cu sfaturi („Adaugă bunicii”, src/lib/crm-auto.ts).
 */
export default async function MyTree() {
  const me = await requireUser("/arbore");
  const [first] = await db.select({ id: tree.id }).from(treeMember).innerJoin(tree, eq(tree.id, treeMember.treeId))
    .where(eq(treeMember.userId, me.id)).orderBy(desc(tree.createdAt)).limit(1);
  redirect(first ? `/arbore/${first.id}` : "/");
}
