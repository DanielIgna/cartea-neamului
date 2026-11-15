import type { County } from "./localitati";
import { KIND_NAME, type Uat } from "./uat";

/** Bucățile de text ale paginilor de localități, fără server (le folosesc și Centrul SEO și testele). */
/** „1 locuitor”, „19 locuitori”, „20 de locuitori”, „1.234 de locuitori”. */
export function countOf(n: number, one: string, many: string) {
  const r = n % 100;
  return n === 1 ? `1 ${one}` : `${n.toLocaleString("ro-RO")} ${n >= 20 && (r === 0 || r >= 20) ? "de " : ""}${many}`;
}
export const km = (x: number) => (x < 10 ? x.toFixed(1).replace(".", ",") : String(Math.round(x)));
export const listRo = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} și ${xs[xs.length - 1]}`);

export const uatTitle = (u: Uat, c: County) => `${KIND_NAME[u.kind].title} ${u.name} (${c.name}): acte vechi, arhive, sate | Cartea Neamului`;
export function uatDescription(u: Uat, c: County) {
  const others = u.villages.filter((v) => !v.seat).map((v) => v.name);
  const what = u.kind === "c"
    ? (others.length ? `satele ${listRo(u.villages.slice(0, 4).map((v) => v.name))}${u.villages.length > 4 ? " și altele" : ""}` : `satul ${u.villages[0].name}`)
    : `${countOf(u.pop, "locuitor", "locuitori")}`;
  const d = `Unde cauți actele strămoșilor din ${u.name}, județul ${c.name}: ${what}, arhiva județului, registrele vechi și localitățile vecine.`;
  return d.length <= 165 ? d : `Unde cauți actele strămoșilor din ${u.name}, județul ${c.name}: satele, arhiva județului, registrele vechi și localitățile vecine.`;
}

