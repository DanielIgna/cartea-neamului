import { isPlaceholder } from "./family";
import { kinship, unionsOf, type Graph } from "./kinship";
import type { QuestionContext, Who } from "./questions";

/** Cine vede o amintire. Ce se poate alege la fiecare amintire, cu numele de pe ecran. */
export type Visibility = "private" | "asker" | "close" | "tree";
export const VISIBILITY_LABEL: Record<Visibility, string> = {
  private: "Doar eu (ciornă)",
  asker: "Doar cel care a întrebat",
  close: "Familia apropiată",
  tree: "Tot arborele",
};

export type MemoryAccess = { personId: string; authorId: string | null; visibility: Visibility; maxDegree: number | null; askedBy?: string | null };
export type Viewer = { userId: string; personId: string | null };

/**
 * Poate `viewer` să vadă amintirea? Autorul și omul din ladă o văd mereu. Ciorna doar ei; „doar cel care a întrebat” doar el;
 * „familia apropiată” rudele de sânge până la gradul ales (sau gradul de la mesaje) și soții; „tot arborele” oricine e în arbore.
 * Cine a pus o întrebare vede mereu răspunsul la ea (afară de ciornă), chiar dacă e mai departe de gradul ales.
 */
export function canSee(m: MemoryAccess, viewer: Viewer, g: Graph, defaultDegree: number, ownerUserId: string | null) {
  if ((m.authorId && m.authorId === viewer.userId) || (ownerUserId && ownerUserId === viewer.userId)) return true;
  if (m.visibility !== "private" && m.askedBy && m.askedBy === viewer.userId) return true;
  switch (m.visibility) {
    case "private": return false;
    case "asker": return false;
    case "tree": return true;
    case "close": {
      const me = viewer.personId;
      if (!me) return false;
      if (me === m.personId || (g.partners.get(me) ?? []).includes(m.personId)) return true;
      const k = kinship(g, me, m.personId);
      return !!k && k.degree !== null && k.degree <= (m.maxDegree ?? defaultDegree);
    }
  }
}

type PersonLike = { id: string; givenName: string; sex: "M" | "F" | "U"; birthYear: number | null; deathYear: number | null; discreet?: boolean;
  birthPlace?: string | null; residencePlace?: string | null; occupation?: string | null };

/** Ce știe arborele despre un om, pentru întrebările lui: părinți, bunici, soți (fără cei discreți), copii în ordinea nașterii, frați. */
export function questionContext(g: Graph, people: Record<string, PersonLike>, id: string): QuestionContext | null {
  const p = people[id];
  if (!p) return null;
  const who = (x: string): Who | null => (people[x] ? { id: x, givenName: people[x].givenName, sex: people[x].sex, birthYear: people[x].birthYear, deathYear: people[x].deathYear } : null);
  const list = (ids: string[]) => ids.map(who).filter((x): x is Who => !!x);
  const placeholder = (x: string) => isPlaceholder(people[x]?.givenName ?? "");
  const parents = (g.parents.get(id) ?? []).filter((x) => !placeholder(x));
  const grandparents = parents.flatMap((x) => g.parents.get(x) ?? []).filter((x) => !placeholder(x));
  const partners = unionsOf(g, id).map((u) => u.spouse).filter((s): s is string => !!s && !!people[s] && !people[s].discreet && !placeholder(s));
  const children = [...(g.children.get(id) ?? [])].sort((a, b) => (people[a]?.birthYear ?? 9999) - (people[b]?.birthYear ?? 9999));
  const siblings = [...new Set(parents.flatMap((x) => g.children.get(x) ?? []))].filter((x) => x !== id);
  return {
    me: { ...who(id)!, birthPlace: p.birthPlace ?? null, residencePlace: p.residencePlace ?? null, occupation: p.occupation ?? null },
    parents: list(parents), grandparents: list(grandparents), partners: list(partners), children: list(children), siblings: list(siblings),
  };
}

/** Anul unei amintiri, din ce a scris omul la „Când” („vara lui 1965”, „cca. 1970”). */
export const yearIn = (text: string | null | undefined) => {
  const m = text?.match(/\b(1[89]\d{2}|20\d{2})\b/);
  return m ? Number(m[1]) : null;
};
