import type { PersonView } from "./tree-data";

/**
 * „Filmul vieții” de pe profilul unui om: pozele lui și ale familiei apropiate, puse pe o bandă de film în ordinea anilor,
 * plus „rolele” (colecțiile): câte una pentru el, pentru fiecare rudă apropiată care are poze și pentru pozele din lada
 * cu amintiri pe care cel care se uită le poate vedea. Doar date, fără nimic de desenat; FamilyFilm.tsx le arată.
 */
export type Frame = {
  /** Id-ul documentului (poza), unic pe bandă. */
  id: string;
  title: string;
  caption: string | null;
  year: number | null;
  /** Data cum a fost scrisă („vara lui 1965”), dacă e. */
  when: string | null;
  /** Câți ani avea omul profilului în poză, dacă știm anul pozei și anul nașterii lui. */
  age: number | null;
  /** Poză din album (se poate propune pentru prima pagină) sau din lada cu amintiri (rămâne doar în arbore). */
  source: "album" | "memory";
};

export type RelRole = "self" | "father" | "mother" | "grandfather" | "grandmother" | "spouse" | "sibling" | "child" | "grandchild" | "memories";
export type Reel = { id: string; role: RelRole; personId: string | null; name: string | null; sex: "M" | "F" | "U"; years: string | null; frames: Frame[] };
export type FilmData = { life: Frame[]; reels: Reel[]; total: number };

type Doc = PersonView["documents"][number];
const isImage = (d: Doc) => d.hasFile && (d.kind === "photo" || !!d.mimeType?.startsWith("image/"));

/** Primul an întreg dintr-o dată scrisă de mână („12.03.1932”, „vara lui 1965”, „cca. 1970”). */
export function yearOf(text: string | null | undefined): number | null {
  const m = /\b(1[5-9]\d\d|20\d\d)\b/.exec(text ?? "");
  return m ? Number(m[1]) : null;
}

/** Ordinea anilor; pozele fără an la sfârșit, în ordinea în care au venit. */
export function byYear<T extends { year: number | null }>(xs: T[]): T[] {
  return xs.map((x, i) => [x, i] as const)
    .sort(([a, i], [b, j]) => (a.year ?? 1e9) - (b.year ?? 1e9) || i - j).map(([x]) => x);
}

export type CloseFamily = {
  father: string | null; mother: string | null;
  paternal: { grandfather: string | null; grandmother: string | null }; maternal: { grandfather: string | null; grandmother: string | null };
  partners: string[]; siblings: string[]; children: string[]; grandchildren: { via: string; ids: string[] }[];
};

export type MemoryPhoto = { photoId: string | null; title: string | null; body: string; whenText: string | null; whenYear: number | null };

export function buildFilm(people: Record<string, PersonView>, pid: string, cf: CloseFamily, memories: MemoryPhoto[], yearsOf: (p: PersonView) => string | null): FilmData {
  const me = people[pid];
  const born = me?.birthYear ?? null;
  const ageAt = (y: number | null) => (y != null && born != null && y >= born && (me?.deathYear == null || y <= me.deathYear) ? y - born : null);
  const albumFrames = (p: PersonView): Frame[] => byYear(p.documents.filter(isImage).map((d) => {
    const year = yearOf(d.dateText);
    return { id: d.id, title: d.title, caption: d.description ?? null, year, when: d.dateText, age: ageAt(year), source: "album" as const };
  }));
  const memFrames: Frame[] = byYear(memories.filter((m) => !!m.photoId).map((m) => {
    const year = m.whenYear ?? yearOf(m.whenText);
    return { id: m.photoId!, title: m.title ?? m.body.slice(0, 80), caption: m.title ? m.body.slice(0, 160) : null, year, when: m.whenText, age: ageAt(year), source: "memory" as const };
  }));

  const roles: [RelRole, string | null][] = [
    ["self", pid],
    ["father", cf.father], ["mother", cf.mother],
    ...cf.partners.map((x) => ["spouse", x] as [RelRole, string]),
    ...cf.children.map((x) => ["child", x] as [RelRole, string]),
    ...cf.siblings.map((x) => ["sibling", x] as [RelRole, string]),
    ["grandfather", cf.paternal.grandfather], ["grandmother", cf.paternal.grandmother],
    ["grandfather", cf.maternal.grandfather], ["grandmother", cf.maternal.grandmother],
    ...cf.grandchildren.flatMap((g) => g.ids.map((x) => ["grandchild", x] as [RelRole, string])),
  ];
  const seen = new Set<string>();
  const reels: Reel[] = [];
  for (const [role, id] of roles) {
    const p = id ? people[id] : null;
    if (!p || seen.has(p.id) || p.discreet) continue;
    seen.add(p.id);
    const frames = albumFrames(p);
    if (frames.length) reels.push({ id: p.id, role, personId: p.id, name: p.name, sex: p.sex, years: yearsOf(p), frames });
  }
  if (memFrames.length) reels.push({ id: "lada", role: "memories", personId: null, name: null, sex: "U", years: null, frames: memFrames });

  // Banda de sus: viața omului (pozele lui și cele din amintiri); dacă are prea puține, toată familia apropiată.
  const uniq = (fs: Frame[]) => { const s = new Set<string>(); return fs.filter((f) => !s.has(f.id) && !!s.add(f.id)); };
  const own = uniq([...(reels.find((r) => r.role === "self")?.frames ?? []), ...memFrames]);
  const all = uniq(reels.flatMap((r) => r.frames));
  const life = byYear(own.length >= 4 ? own : all);
  return { life, reels, total: all.length };
}
