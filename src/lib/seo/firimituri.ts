import type { Crumb } from "@/components/continut/Breadcrumbs";
import { countyPath, isCapital, type County } from "@/lib/continut/localitati";
import { GEN_HUB } from "@/lib/genealogie-orase";
import { genRegionPath, getGenRegion } from "@/lib/genealogie-regiuni";

/**
 * Firul de pagini al localităților (planul SEO, etapa 3): Acasă › Genealogie › Regiune › Județ (› Oraș sau comună).
 * Regiunea e prima regiune a județului (cea principală, din content/localitati/judete.json).
 */
export function countyCrumbs(c: County): Crumb[] {
  const r = c.regions[0] ? getGenRegion(c.regions[0]) : null;
  return [
    { name: "Genealogie", path: GEN_HUB },
    ...(r ? [{ name: r.name, path: genRegionPath(r) }] : []),
    { name: isCapital(c) ? "București" : `Județul ${c.name}`, path: countyPath(c) },
  ];
}

export const placeCrumbs = (c: County, place: Crumb): Crumb[] => [...countyCrumbs(c), place];
