import { family, type Graph } from "./kinship";

/** Felul rudei pe care o adaugi lângă cineva (același ca în formularul „Adaugă o rudă”). */
export type RelKind = "father" | "mother" | "child" | "spouse" | "sibling";

/** La „+ Tată”/„+ Mamă”: frații care nu au încă un asemenea părinte; la „+ Soț/soție”: copiii fără al doilea părinte. */
export function shareIds(g: Graph, sexOf: (id: string) => "M" | "F" | "U" | undefined, id: string, k: RelKind): string[] {
  const fam = family(g, id);
  if (k === "father" || k === "mother") {
    const sex = k === "father" ? "M" : "F";
    return fam.siblings.filter((x) => !(g.parents.get(x) ?? []).some((pid) => sexOf(pid) === sex));
  }
  return k === "spouse" ? fam.children.filter((x) => (g.parents.get(x) ?? []).length === 1) : [];
}

const parentBySex = (g: Graph, id: string | null, sex: "M" | "F") => (id ? (g.parents.get(id) ?? []).find((p) => g.sex.get(p) === sex) ?? null : null);

/**
 * Rudele apropiate ale unei persoane, așa cum le arată profilul ei: părinții, bunicii din partea fiecărui părinte, soții,
 * frații, copiii, nepoții de frate sau soră și nepoții de copil. Pentru fiecare loc gol se știe lângă cine se adaugă ruda.
 */
export function closeFamily(g: Graph, id: string) {
  const fam = family(g, id);
  const father = parentBySex(g, id, "M"), mother = parentBySex(g, id, "F");
  const side = (parent: string | null) => ({ parent, grandfather: parentBySex(g, parent, "M"), grandmother: parentBySex(g, parent, "F") });
  const kids = (of: string) => g.children.get(of) ?? [];
  return {
    father, mother,
    paternal: side(father), maternal: side(mother),
    partners: fam.partners, siblings: fam.siblings, children: fam.children,
    /** Nepoții de frate sau soră, pe frați (și frații fără copii, ca să li se poată adăuga). */
    nephews: fam.siblings.map((s) => ({ via: s, ids: kids(s) })),
    /** Nepoții de copil (copiii copiilor), pe copii. */
    grandchildren: fam.children.map((c) => ({ via: c, ids: kids(c) })),
  };
}
export type CloseFamily = ReturnType<typeof closeFamily>;

/**
 * Cei pe care un om îi poate corecta din profilul lui, chiar dacă nu i-a trecut el: el însuși și rudele lui apropiate
 * (părinți, bunici, soți, frați, copii, nepoți). Fișele revendicate de altcineva rămân ale lor.
 */
export function closeKinIds(g: Graph, id: string): Set<string> {
  const f = closeFamily(g, id);
  const out = new Set<string>([id]);
  for (const x of [f.father, f.mother, f.paternal.grandfather, f.paternal.grandmother, f.maternal.grandfather, f.maternal.grandmother,
    ...f.partners, ...f.siblings, ...f.children, ...f.nephews.flatMap((n) => n.ids), ...f.grandchildren.flatMap((n) => n.ids)]) if (x) out.add(x);
  return out;
}

/**
 * Poate omul `meId` corecta fișa `target`? Regula de bază a arborelui (editorii pe oricine, ceilalți ce au trecut ei și propriul
 * profil), plus rudele lui apropiate (`kin`, din closeKinIds pornind de la fișa lui), cât timp ruda nu și-a revendicat fișa.
 */
export function mayEdit(o: { editor: boolean; contributor: boolean; meId: string; kin: Set<string> | null; target: { id: string; createdBy: string | null; claimedBy: string | null } }) {
  if (!o.contributor) return false;
  if (o.editor || o.target.createdBy === o.meId || o.target.claimedBy === o.meId) return true;
  if (o.target.claimedBy) return false;
  return !!o.kin?.has(o.target.id);
}
