import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { requireUser } from "@/lib/access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: PRIVATE_ROBOTS };

/**
 * Legătura din emailul de activare (src/lib/activare.ts): cine nu e intrat în cont intră întâi; apoi prima pagină îi arată
 * primii pași dacă n-are încă arbore, sau arborii lui dacă și l-a făcut între timp.
 */
export default async function FirstSteps() {
  await requireUser("/primii-pasi");
  redirect("/");
}
