/**
 * Conversia din zilele gratuite în plătit (Daniel, 16 noiembrie 2026). Înregistrarea rămâne fără card; în zilele gratuite și
 * puțin după ele, site-ul îl ajută pe om să ajungă la un plan:
 *
 * - șase emailuri (ziua 1, 3, 5, 7, 8 și 14; zilele se schimbă din Admin → Conversie), în limba omului, prin Resend, cu datele
 *   lui (prenumele, câte persoane are arborele, zilele rămase, legătura lui de invitație, prețurile din Admin). Fiecare are
 *   dezabonare dintr-un clic (pagină + antetul List-Unsubscribe) și pleacă doar cât automatizarea „conversie” din Admin →
 *   Autonomie e pornită (oprită până o pornește Daniel). Cel mult un email pe zi; un pas pierdut (automatizarea a fost oprită)
 *   nu se mai trimite după 3 zile, ca un cont vechi să nu primească tot șirul deodată;
 * - în ziua 8 (prima zi după zilele gratuite): un cod unic de reducere (implicit 20%), făcut ca cod promoțional în Stripe, cu o
 *   singură folosire și care expiră singur după 48 de ore; pe /plata se aplică singur;
 * - deschiderile (o poză de 1×1 în email) și clicurile (legătura trece prin /api/conversie/c) se numără pe fiecare email, iar plata
 *   de după se trece la ultimul email pe care omul a apăsat (sau, fără clic, la ultimul primit) în 7 zile;
 * - în cont: banda „Mai ai X zile gratuite” (AccessBanner), fereastra din ultima zi și, după expirare, reducerea în bandă.
 *
 * După zilele gratuite nu se șterge nimic: arborele se vede, doar adăugarea, schimbarea, invitațiile și descărcarea lui se
 * deschid din nou cu un plan (src/lib/plans.ts, src/lib/plata.ts).
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, isNull, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { appSetting, conversionMail, conversionOffer } from "@/db/schema";
import type { Access } from "./plans";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const DAY = 86_400_000;
const HOUR = 3_600_000;

/* ---------- Pașii și setările ---------- */

/** Pașii șirului, în ordine: bun venit, progresul, planurile, ultima zi, reducerea, ultima reamintire. */
export const STEPS = ["bunvenit", "progres", "planuri", "ultimazi", "reducere", "asteapta"] as const;
export type Step = (typeof STEPS)[number];
export const isStep = (v: unknown): v is Step => typeof v === "string" && (STEPS as readonly string[]).includes(v);
/** Pașii din zilele gratuite și cei de după ele. */
const TRIAL_STEPS: readonly Step[] = ["bunvenit", "progres", "planuri", "ultimazi"];
const AFTER_STEPS: readonly Step[] = ["reducere", "asteapta"];
export const STEP_LABEL: Record<Step, string> = {
  bunvenit: "Bun venit + 3 pași", progres: "„Arborele tău are deja N persoane” + invitație", planuri: "Ce primești cu abonamentul",
  ultimazi: "„Perioada gratuită se încheie azi”", reducere: "Reducerea de după (cod unic)", asteapta: "Ultima reamintire",
};
