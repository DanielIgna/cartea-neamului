import { parseBlocks, type Block } from "@/lib/continut/markdown";
import { AL_DOILEA_RAZBOI } from "@/lib/istorie/al-doilea-razboi";
import { CRIZE } from "@/lib/istorie/crize";
import { GRIPA_SPANIOLA } from "@/lib/istorie/gripa-spaniola";
import { INTERBELIC } from "@/lib/istorie/interbelic";
import { PRIMUL_RAZBOI } from "@/lib/istorie/primul-razboi";
import { TIPARUL_ISTORIEI } from "@/lib/istorie/tiparul-istoriei";
import type { Articol } from "@/lib/istorie/tip";

/**
 * Seria SERIE din Istoria umanității (Daniel, 2026-11-26): fiecare articol e o pagină publică
 * /istoria-umanitatii/<slug>, în ordinea vremii. Pentru un articol nou: fișierul lui aici, apoi paginile din
 * src/app/(site)/istoria-umanitatii/<slug> și src/app/(public)/pub/[v]/istoria-umanitatii/<slug>, PUBLIC_PAGES și middleware.
 */
/** Numele seriei (Daniel, 2026-11-26: nu „Vremuri grele”, ci ceva legat de istoria umanității). */
export const SERIE = "Răscrucile istoriei";

export const ARTICOLE: Articol[] = [PRIMUL_RAZBOI, GRIPA_SPANIOLA, INTERBELIC, AL_DOILEA_RAZBOI, CRIZE, TIPARUL_ISTORIEI];

export const articolPath = (slug: string) => `/istoria-umanitatii/${slug}`;

export function getArticol(slug: string): Articol {
  const a = ARTICOLE.find((x) => x.slug === slug);
  if (!a) throw new Error(`Articol necunoscut: ${slug}`);
  return a;
}

/** Textul, în două părți: înainte și după locul filei pentru cei cu cont (marcajul [[fila]]). */
export function articolBlocks(a: Articol): { before: Block[]; after: Block[] } {
  const [before, after] = a.text.split("\n[[fila]]\n");
  return { before: parseBlocks(before), after: parseBlocks(after ?? "") };
}
