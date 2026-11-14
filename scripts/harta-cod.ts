/**
 * Harta funcțiilor (Admin → Centru de cunoștințe): scrie src/lib/cunostinte/cod.json cu fișierele din cod, paginile și adresele API
 * (din src/app) și testele. Rulează la fiecare publicare în Vercel (vercel-build), așa că pagina verifică registrul față de codul
 * publicat cu adevărat. Fără dată în fișier, ca să nu se schimbe dacă n-a apărut sau n-a dispărut niciun fișier.
 */
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const walk = (dir: string): string[] => {
  let out: string[] = [];
  for (const name of readdirSync(join(ROOT, dir))) {
    if (name === "node_modules" || name === ".DS_Store") continue;
    const p = join(dir, name);
    out = statSync(join(ROOT, p)).isDirectory() ? out.concat(walk(p)) : out.concat(p);
  }
  return out;
};

/** src/app/(site)/arbore/[id]/page.tsx → /arbore/[id]; grupurile (x) nu intră în adresă. */
export function routeOf(file: string) {
  const rel = relative("src/app", file).split(/[\\/]/);
  const last = rel.pop()!;
  const kind = /^page\.(t|j)sx?$/.test(last) ? "pagina" : /^route\.(t|j)sx?$/.test(last) ? "api" : null;
  if (!kind) return null;
  const parts = rel.filter((s) => !/^\(.*\)$/.test(s));
  if (parts[0] === "pub") return null; // copia publică (/pub/[v]/…) a acelorași pagini
  return { path: `/${parts.join("/")}`, kind };
}

const files = [...walk("src"), ...walk("tests"), ...walk("scripts"), ...walk("drizzle")].map((f) => f.split("\\").join("/")).sort();
const routes = files.filter((f) => f.startsWith("src/app/")).map(routeOf).filter((r): r is { path: string; kind: string } => !!r)
  .sort((a, b) => a.path.localeCompare(b.path));
const out = {
  files: files.filter((f) => !f.endsWith("cunostinte/cod.json")),
  routes,
  tests: files.filter((f) => /^tests\/.*\.test\.tsx?$/.test(f)),
  migrations: files.filter((f) => /^drizzle\/\d+_.*\.sql$/.test(f)).length,
};
writeFileSync(join(ROOT, "src/lib/cunostinte/cod.json"), `${JSON.stringify(out, null, 1)}\n`);
console.log(`harta-cod: ${out.files.length} fișiere, ${out.routes.length} adrese, ${out.tests.length} teste`);
