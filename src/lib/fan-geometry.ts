/**
 * Geometria evantaiului strămoșilor: inelele, feliile și culorile pe linia tatălui și a mamei.
 * O folosesc și desenul de pe site (în browser), și cel din carte (desenat pe server, pentru tipar).
 */

/** Generația unui loc Ahnentafel: 1 = persoana din centru, 2–3 părinții, 4–7 bunicii… */
export const genOf = (n: number) => Math.floor(Math.log2(n));
const side = (n: number) => (genOf(n) < 1 ? null : n >> (genOf(n) - 1) === 2 ? "pat" : "mat");
export const fillFor = (n: number) => (genOf(n) === 0 ? "var(--accent-soft)" : `var(--${side(n)}-${Math.min(genOf(n), 4)})`);

/** O felie de inel, între razele r1 și r2 și unghiurile a1 și a2 (în grade), cu centrul în (cx, cy). */
export function arc(r1: number, r2: number, a1: number, a2: number, cx: number, cy: number) {
  const pt = (r: number, a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x1, y1] = pt(r2, a1), [x2, y2] = pt(r2, a2), [x3, y3] = pt(r1, a2), [x4, y4] = pt(r1, a1);
  const lg = a2 - a1 > 180 ? 1 : 0;
  return `M${x1} ${y1}A${r2} ${r2} 0 ${lg} 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 ${lg} 0 ${x4} ${y4}Z`;
}

/** Razele inelelor: primele 4 generații late, cu nume întregi; cele vechi tot mai înguste, cu text de-a lungul razei. */
export function fanRadii(generations: number) {
  const R = [0, 72, 148, 214, 276, 340];
  for (let g = 5; g <= generations; g++) R[g + 1] = R[g] + (g <= 6 ? 74 : 64);
  return R.slice(0, generations + 2);
}
