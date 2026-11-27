"use server";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { dismissKeepNotice } from "@/lib/anunt-pastrare";

/** „Am înțeles” pe banda „Nou: Păstrarea”: se ține pe cont, ca banda să nu mai apară pe alt telefon sau calculator. */
export async function closeKeepNotice(): Promise<void> {
  const me = await currentUser();
  if (me) await dismissKeepNotice(db, me.id).catch(() => {});
}
