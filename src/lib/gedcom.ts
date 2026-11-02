/**
 * GEDCOM 5.5.1: citire și scriere. Funcții pure, fără bază de date, ca să poată fi testate ușor.
 */
export type GIndividual = {
  xref: string;
  given: string;
  surname: string;
  birthSurname?: string;
  sex: "M" | "F" | "U";
  birth?: { date?: string; place?: string };
  death?: { date?: string; place?: string };
  deceased?: boolean;
  occupation?: string;
  note?: string;
};
export type GFamily = { xref: string; husb?: string; wife?: string; children: string[]; marriage?: { date?: string; place?: string } };
export type GedcomData = { individuals: GIndividual[]; families: GFamily[] };

type Node = { level: number; tag: string; xref?: string; value: string; children: Node[] };

function parseTree(text: string): Node[] {
  const roots: Node[] = [];
  const stack: Node[] = [];
  for (const raw of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(\d+)\s+(@[^@]+@\s+)?(\S+)(?:\s(.*))?$/);
    if (!m) continue;
    const node: Node = { level: +m[1], xref: m[2]?.trim(), tag: m[3].toUpperCase(), value: m[4] ?? "", children: [] };
    while (stack.length && stack[stack.length - 1].level >= node.level) stack.pop();
    if (node.tag === "CONT" || node.tag === "CONC") {
      const parent = stack[stack.length - 1];
      if (parent) parent.value += (node.tag === "CONT" ? "\n" : "") + node.value;
      continue;
    }
    if (stack.length) stack[stack.length - 1].children.push(node);
    else roots.push(node);
    stack.push(node);
  }
  return roots;
}

const child = (n: Node, tag: string) => n.children.find((c) => c.tag === tag);
const event = (n: Node | undefined) =>
  n ? { date: child(n, "DATE")?.value || undefined, place: child(n, "PLAC")?.value || undefined } : undefined;

export function parseGedcom(text: string): GedcomData {
  const individuals: GIndividual[] = [];
  const families: GFamily[] = [];
  for (const rec of parseTree(text)) {
    if (rec.tag === "INDI" && rec.xref) {
      const nameNode = child(rec, "NAME");
      const nameVal = nameNode?.value ?? "";
      const sm = nameVal.match(/\/([^/]*)\//);
      const given = child(nameNode ?? rec, "GIVN")?.value ?? nameVal.replace(/\/[^/]*\//, "").trim();
      const surname = child(nameNode ?? rec, "SURN")?.value ?? sm?.[1]?.trim() ?? "";
      const married = rec.children.filter((c) => c.tag === "NAME")[1];
      const deat = child(rec, "DEAT");
      const sexVal = child(rec, "SEX")?.value?.toUpperCase();
      individuals.push({
        xref: rec.xref,
        given,
        surname,
        birthSurname: married ? married.value.match(/\/([^/]*)\//)?.[1] : undefined,
        sex: sexVal === "M" || sexVal === "F" ? sexVal : "U",
        birth: event(child(rec, "BIRT") ?? child(rec, "BAPM") ?? child(rec, "CHR")),
        death: event(deat),
        deceased: !!deat,
        occupation: child(rec, "OCCU")?.value || undefined,
        note: child(rec, "NOTE")?.value || undefined,
      });
    } else if (rec.tag === "FAM" && rec.xref) {
      families.push({
        xref: rec.xref,
        husb: child(rec, "HUSB")?.value,
        wife: child(rec, "WIFE")?.value,
        children: rec.children.filter((c) => c.tag === "CHIL").map((c) => c.value),
        marriage: event(child(rec, "MARR")),
      });
    }
  }
  return { individuals, families };
}

function wrap(level: number, tag: string, value: string): string[] {
  const lines: string[] = [];
  value.split("\n").forEach((part, i) => {
    const chunks = part.match(/.{1,200}/g) ?? [""];
    chunks.forEach((c, j) => lines.push(`${i === 0 && j === 0 ? `${level} ${tag}` : `${level + 1} ${j === 0 ? "CONT" : "CONC"}`} ${c}`.trimEnd()));
  });
  return lines;
}

export function writeGedcom(data: GedcomData, opts: { source?: string } = {}): string {
  const out: string[] = [
    "0 HEAD",
    "1 SOUR CARTEA_NEAMULUI",
    `2 NAME ${opts.source ?? "Cartea Neamului"}`,
    "1 GEDC", "2 VERS 5.5.1", "2 FORM LINEAGE-LINKED",
    "1 CHAR UTF-8",
  ];
  const famsOf = new Map<string, string[]>();
  const famcOf = new Map<string, string[]>();
  for (const f of data.families) {
    for (const p of [f.husb, f.wife]) if (p) famsOf.set(p, [...(famsOf.get(p) ?? []), f.xref]);
    for (const c of f.children) famcOf.set(c, [...(famcOf.get(c) ?? []), f.xref]);
  }
  for (const i of data.individuals) {
    out.push(`0 ${i.xref} INDI`, `1 NAME ${i.given} /${i.surname}/`.replace(/\s+/g, " "));
    if (i.given) out.push(`2 GIVN ${i.given}`);
    if (i.surname) out.push(`2 SURN ${i.surname}`);
    if (i.birthSurname) out.push(`1 NAME ${i.given} /${i.birthSurname}/`, "2 TYPE birth");
    out.push(`1 SEX ${i.sex}`);
    if (i.birth?.date || i.birth?.place) {
      out.push("1 BIRT");
      if (i.birth.date) out.push(`2 DATE ${i.birth.date}`);
      if (i.birth.place) out.push(`2 PLAC ${i.birth.place}`);
    }
    if (i.deceased || i.death?.date || i.death?.place) {
      out.push(i.death?.date || i.death?.place ? "1 DEAT" : "1 DEAT Y");
      if (i.death?.date) out.push(`2 DATE ${i.death.date}`);
      if (i.death?.place) out.push(`2 PLAC ${i.death.place}`);
    }
    if (i.occupation) out.push(`1 OCCU ${i.occupation}`);
    if (i.note) out.push(...wrap(1, "NOTE", i.note));
    for (const f of famcOf.get(i.xref) ?? []) out.push(`1 FAMC ${f}`);
    for (const f of famsOf.get(i.xref) ?? []) out.push(`1 FAMS ${f}`);
  }
  for (const f of data.families) {
    out.push(`0 ${f.xref} FAM`);
    if (f.husb) out.push(`1 HUSB ${f.husb}`);
    if (f.wife) out.push(`1 WIFE ${f.wife}`);
    if (f.marriage?.date || f.marriage?.place) {
      out.push("1 MARR");
      if (f.marriage.date) out.push(`2 DATE ${f.marriage.date}`);
      if (f.marriage.place) out.push(`2 PLAC ${f.marriage.place}`);
    }
    for (const c of f.children) out.push(`1 CHIL ${c}`);
  }
  out.push("0 TRLR");
  return out.join("\n") + "\n";
}
