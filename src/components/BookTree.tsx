"use client";
import { useMemo } from "react";
import type { PersonView } from "@/lib/tree-data";
import type { DescNode } from "@/lib/family";
import { LineageTree } from "./lineage-charts";

const nothing = () => {};

/** Copacul neamului din carte: desenul de pe site, fără clicuri, cu drumul de la trunchi la persoana din centru. */
export default function BookTree({ root, people, path }: { root: DescNode; people: Record<string, PersonView>; path: string[] }) {
  const egoPath = useMemo(() => new Set(path), [path]);
  return <LineageTree root={root} people={people} selectedId={null} egoPath={egoPath} onSelectPerson={nothing} onCenter={nothing} />;
}
