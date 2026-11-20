import type { Theme } from "../tipuri";
import { THEMES_1 } from "./teme-1";
import { THEMES_2 } from "./teme-2";
import { MINORITY_THEMES } from "./teme-minoritati";

/** Ciornele de articole: valurile de emigrare, pe țări (Europa), și minoritățile din România. */
export const DRAFT_THEMES: Theme[] = [...THEMES_1, ...THEMES_2, ...MINORITY_THEMES];
