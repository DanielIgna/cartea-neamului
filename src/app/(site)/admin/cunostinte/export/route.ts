import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { founderReady } from "@/lib/admin-access";
import { AREA, LIFECYCLE, RISK } from "@/lib/cunostinte/functii";
import { DOC_CATEGORY, DOC_KIND, DOC_STATUS } from "@/lib/cunostinte/documente";
import { COLS, COL_LABEL, HEALTH, MARK, VERIF, buildGraph, knowledge } from "@/lib/cunostinte/verificare";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const line = (...v: unknown[]) => v.map(cell).join(",");

/** Admin → Centru de cunoștințe → export: harta funcțiilor sau documentele, în CSV (Excel) sau JSON (tot, cu dependențele). Doar fondatori. */
export async function GET(req: Request) {
  const me = await currentUser();
  if (!(await founderReady(me))) return new Response("Nu există.", { status: 404 });
  const url = new URL(req.url);
  const what = url.searchParams.get("ce") === "documente" ? "documente" : "functii";
  const format = url.searchParams.get("format") === "json" ? "json" : "csv";
  const k = await knowledge(db);
  const stamp = new Date().toISOString().slice(0, 10);
  const name = `cartea-neamului-${what}-${stamp}.${format}`;

  if (format === "json") {
    const body = what === "functii"
      ? { generat: new Date().toISOString(), rezumat: k.summary, functii: k.evals.map((e) => ({ ...e.fn, lifecycleAzi: e.lifecycle, sanatate: e.health, verificare: e.verification, erori7zile: e.errors7, probleme: e.issues, celule: e.cells })),
        dependente: buildGraph(k.evals, k.docs, k.facts) }
      : { generat: new Date().toISOString(), documente: k.docs.map((d) => ({ ...d.doc, stareAzi: d.status, recititPe: d.reviewedAt, urmatoareaRevizuire: d.nextReview, sanatate: d.health, deRevizuit: d.reasons })) };
    return new Response(JSON.stringify(body, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="${name}"`, "cache-control": "no-store" } });
  }

  const out: string[] = [];
  if (what === "functii") {
    out.push(line("Cheie", "Funcție", "Zonă", "Ciclu de viață", "Sănătate", "Risc", "Verificare", "Erori 7 zile", ...COLS.map((c) => COL_LABEL[c]), "Probleme", "Documente"));
    for (const e of k.evals) out.push(line(e.fn.key, e.fn.name, AREA[e.fn.area], LIFECYCLE[e.lifecycle], HEALTH[e.health], RISK[e.fn.risk], VERIF[e.verification], e.errors7,
      ...COLS.map((c) => `${MARK[e.cells[c].mark].sign} ${e.cells[c].note}`), e.issues.join(" | "), e.docs.join(" ")));
  } else {
    out.push(line("ID", "Titlu", "Tip", "Categorie", "Stare", "Versiune", "Data", "Următoarea revizuire", "Sănătate %", "De revizuit", "Guvernează", "Sursa"));
    for (const d of k.docs) out.push(line(d.doc.id, d.doc.title, DOC_KIND[d.doc.kind], DOC_CATEGORY[d.doc.category], DOC_STATUS[d.status].label, d.doc.version, d.doc.date,
      d.nextReview, d.health ?? "", d.reasons.join(" | "), d.doc.governs.join(" "), d.doc.source.join(" | ")));
  }
  return new Response(`﻿${out.join("\n")}\n`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"`, "cache-control": "no-store" } });
}
