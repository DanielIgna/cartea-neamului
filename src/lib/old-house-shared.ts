/** Ce despre casa bătrânească merge și în browser (fără baza de date). Vezi src/lib/old-house.ts. */
export const HOUSE_VISIBILITY = ["private", "close", "tree"] as const;
export type HouseVisibility = (typeof HOUSE_VISIBILITY)[number];
export const MAX_HOUSE_PHOTOS = 8;

export type HouseView = {
  id: string; place: string | null; builtBy: string | null; builtYear: number | null; story: string | null; photoIds: string[];
  visibility: HouseVisibility; maxDegree: number | null; author: string | null; mine: boolean; orphan: boolean; updatedAt: string;
};
