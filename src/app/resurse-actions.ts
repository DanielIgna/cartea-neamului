"use server";
import { headers } from "next/headers";
import { db } from "@/db";
import { contactRateOk } from "@/lib/contact";
import { checkDnaRequest, saveDnaRequest, type DnaProblem } from "@/lib/resurse";
import { getLocale } from "@/i18n/server";

export type DnaResult = { ok?: boolean; error?: DnaProblem | "tooMany" | "failed" };

/**
 * „Vreau un test ADN” de pe /resurse-genealogie: păstrează cererea (cu acordul și data lui), fără să trimită nimic la laboratoare.
 * Câmpul `website` e ascuns oamenilor: doar roboții îl completează, iar atunci le spunem „primit” fără să păstrăm nimic.
 */
export async function sendDnaRequest(_: DnaResult | null, form: FormData): Promise<DnaResult> {
  if (String(form.get("website") ?? "").trim()) return { ok: true };
  const checked = checkDnaRequest(Object.fromEntries(form));
  if ("problem" in checked) return { error: checked.problem };
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "?";
  if (!contactRateOk(`adn:${ip}`)) return { error: "tooMany" };
  try {
    await saveDnaRequest(db, checked.ok, await getLocale());
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { error: "failed" };
  }
}
